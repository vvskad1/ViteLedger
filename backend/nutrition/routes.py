from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import os
import shutil
from pathlib import Path

from db import get_db
from auth.routes import get_current_user
from auth.models import User
from nutrition.models import Meal, LabReport, NutritionRecommendation, MealPlan
from reminder.models import Reminder
from appointment.models import Appointment
from nutrition.pdf_extractor import PDFExtractor
from nutrition.ai_service import AIService
from nutrition.meal_plan_generator import MealPlanGenerator
from schemas import (
    MealCreate, MealResponse, 
    LabReportResponse, LabReportAnalysis,
    NutritionRecommendationResponse
)
import json

router = APIRouter(prefix="/nutrition", tags=["nutrition"])
pdf_extractor = PDFExtractor()
ai_service = AIService()
meal_plan_generator = MealPlanGenerator()

# Ensure uploads directory exists
UPLOAD_DIR = Path("uploads/lab_reports")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# ===== MEAL ROUTES =====

@router.get("/meals", response_model=List[MealResponse])
def get_meals(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 50
):
    """Get user's meal history"""
    meals = db.query(Meal).filter(
        Meal.user_id == current_user.id
    ).order_by(Meal.meal_date.desc()).limit(limit).all()
    return meals

@router.post("/meals", response_model=MealResponse, status_code=status.HTTP_201_CREATED)
def create_meal(
    meal_data: MealCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Log a new meal"""
    new_meal = Meal(
        user_id=current_user.id,
        **meal_data.dict()
    )
    db.add(new_meal)
    db.commit()
    db.refresh(new_meal)
    return new_meal

@router.delete("/meals/{meal_id}")
def delete_meal(
    meal_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a meal entry"""
    meal = db.query(Meal).filter(
        Meal.id == meal_id,
        Meal.user_id == current_user.id
    ).first()
    
    if not meal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meal not found"
        )
    
    db.delete(meal)
    db.commit()
    return {"message": "Meal deleted successfully"}

# ===== LAB REPORT ROUTES =====

@router.get("/lab-reports", response_model=List[LabReportResponse])
def get_lab_reports(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's lab reports"""
    reports = db.query(LabReport).filter(
        LabReport.user_id == current_user.id
    ).order_by(LabReport.created_at.desc()).all()
    return reports

@router.get("/lab-reports/{report_id}")
def get_lab_report(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific lab report with full analysis"""
    report = db.query(LabReport).filter(
        LabReport.id == report_id,
        LabReport.user_id == current_user.id
    ).first()
    
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lab report not found"
        )
    
    return {
        "id": report.id,
        "report_name": report.report_name,
        "uploaded_at": report.uploaded_at,
        "analysis_status": report.analysis_status,
        "ai_summary": report.ai_summary,
        "abnormalities": report.abnormalities,
        "key_findings": report.key_findings,
        "recommendations": report.recommendations,
        "risk_factors": report.risk_factors,
        "reminder_created": report.reminder_created
    }

@router.post("/lab-reports/upload", response_model=LabReportResponse)
async def upload_lab_report(
    file: UploadFile = File(...),
    report_name: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload and analyze a lab report PDF"""
    
    # Get report name from form or use filename
    if not report_name:
        report_name = file.filename.replace('.pdf', '') if file.filename else "Lab Report"
    
    # Validate file type
    if not file.filename.endswith('.pdf'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are allowed"
        )
    
    # Create unique filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{current_user.id}_{timestamp}_{file.filename}"
    file_path = UPLOAD_DIR / filename
    
    # Save file
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}"
        )
    
    # Extract text from PDF
    with open(file_path, "rb") as pdf_file:
        pdf_content = pdf_file.read()
        extracted_text = pdf_extractor.extract_text(pdf_content)
    
    # Create lab report record
    lab_report = LabReport(
        user_id=current_user.id,
        report_name=report_name,
        file_path=str(file_path),
        extracted_text=extracted_text,
        analysis_status="analyzing"
    )
    
    db.add(lab_report)
    db.commit()
    db.refresh(lab_report)
    
    # Start AI analysis
    if extracted_text:
        try:
            analysis = ai_service.analyze_lab_report(extracted_text, user=current_user)
            
            # Save analysis results
            lab_report.ai_summary = analysis.get("summary", "")
            lab_report.key_findings = json.dumps(analysis.get("key_findings", []))
            lab_report.recommendations = analysis.get("recommendations", "")
            lab_report.risk_factors = analysis.get("risk_factors", "")
            
            # Save abnormalities as JSON
            abnormalities = analysis.get("abnormalities", [])
            if abnormalities:
                lab_report.abnormalities = json.dumps(abnormalities)
                
                # Calculate earliest next test date
                earliest_days = None
                for abnormality in abnormalities:
                    if 'next_test_days' in abnormality and abnormality['next_test_days']:
                        if earliest_days is None or abnormality['next_test_days'] < earliest_days:
                            earliest_days = abnormality['next_test_days']
                
                # Set next test date based on earliest abnormality
                if earliest_days:
                    lab_report.next_test_date = datetime.now() + timedelta(days=earliest_days)
                
                # Create automatic reminders and appointments for each abnormality
                for abnormality in abnormalities:
                    if 'next_test_days' in abnormality and abnormality['next_test_days']:
                        retest_date = datetime.now() + timedelta(days=abnormality['next_test_days'])
                        
                        reminder_text = f"Retest {abnormality['parameter']} - Previous result was {abnormality['status'].upper()}: {abnormality['value']}"
                        
                        # Create reminder
                        reminder = Reminder(
                            user_id=current_user.id,
                            title=f"Retest: {abnormality['parameter']}",
                            description=reminder_text,
                            reminder_datetime=retest_date,
                            reminder_type="lab_test",
                            is_completed=False
                        )
                        db.add(reminder)
                        print(f"✅ Created reminder for {abnormality['parameter']} at {retest_date}")
                        
                        # Create appointment
                        appointment = Appointment(
                            user_id=current_user.id,
                            title=f"Lab Test: {abnormality['parameter']} Retest",
                            appointment_type="lab_test",
                            appointment_datetime=retest_date,
                            notes=f"Follow-up test for {abnormality['parameter']}. Previous value: {abnormality['value']} ({abnormality['status']})",
                            is_completed=False
                        )
                        db.add(appointment)
                        print(f"✅ Created appointment for {abnormality['parameter']} at {retest_date}")
                        
                        lab_report.reminder_created = True
            
            lab_report.analysis_status = "completed"
            db.commit()
            db.refresh(lab_report)
        except Exception as e:
            print(f"AI analysis failed: {e}")
            lab_report.analysis_status = "failed"
            db.commit()
    
    return lab_report

@router.get("/lab-reports/{report_id}/analysis", response_model=LabReportAnalysis)
def get_lab_report_analysis(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed analysis of a lab report"""
    report = db.query(LabReport).filter(
        LabReport.id == report_id,
        LabReport.user_id == current_user.id
    ).first()
    
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lab report not found"
        )
    
    return {
        "id": report.id,
        "report_name": report.report_name,
        "analysis_complete": report.analysis_complete,
        "ai_summary": report.ai_summary,
        "key_findings": json.loads(report.key_findings) if report.key_findings else [],
        "recommendations": json.loads(report.recommendations) if report.recommendations else [],
        "risk_factors": json.loads(report.risk_factors) if report.risk_factors else []
    }

@router.delete("/lab-reports/{report_id}")
def delete_lab_report(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a lab report"""
    report = db.query(LabReport).filter(
        LabReport.id == report_id,
        LabReport.user_id == current_user.id
    ).first()
    
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lab report not found"
        )
    
    # Delete the physical file
    try:
        file_path = Path(report.file_path)
        if file_path.exists():
            file_path.unlink()
    except Exception as e:
        print(f"Failed to delete file: {e}")
    
    # Delete from database
    db.delete(report)
    db.commit()
    return {"message": "Lab report deleted successfully"}

# ===== AI RECOMMENDATIONS =====

@router.post("/recommendations/generate")
async def generate_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate AI-powered nutrition recommendations using complete user profile and lab results"""
    
    # Get recent meals
    recent_meals = db.query(Meal).filter(
        Meal.user_id == current_user.id
    ).order_by(Meal.meal_date.desc()).limit(7).all()
    
    # Get latest completed lab report with abnormalities
    latest_lab_report = db.query(LabReport).filter(
        LabReport.user_id == current_user.id,
        LabReport.analysis_status == "completed",
        LabReport.abnormalities.isnot(None)
    ).order_by(LabReport.created_at.desc()).first()
    
    # Generate personalized recommendations using full user profile and lab findings
    recommendations_text = ai_service.generate_meal_recommendations(
        user=current_user,
        lab_report=latest_lab_report,
        recent_meals=recent_meals
    )
    
    # Save recommendation
    based_on = "user_profile"
    if latest_lab_report:
        based_on = "user_profile_lab_results_and_abnormalities"
    
    recommendation = NutritionRecommendation(
        user_id=current_user.id,
        recommendation_text=recommendations_text,
        recommendation_type="personalized_meal_plan",
        based_on=based_on
    )
    
    db.add(recommendation)
    db.commit()
    db.refresh(recommendation)
    
    return {"recommendation": recommendations_text}

@router.get("/recommendations", response_model=List[NutritionRecommendationResponse])
def get_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's nutrition recommendations"""
    recommendations = db.query(NutritionRecommendation).filter(
        NutritionRecommendation.user_id == current_user.id,
        NutritionRecommendation.is_active == True
    ).order_by(NutritionRecommendation.created_at.desc()).limit(10).all()
    
    return recommendations

# ===== MEAL PLAN GENERATION WITH RAG =====

@router.post("/meal-plan/generate")
async def generate_meal_plan(
    expectations: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate personalized 7-day meal plan with RAG-verified recipes
    
    Args:
        expectations: User's goals (e.g., "I want to bulk by focusing on protein and reducing sugars")
    
    Returns:
        Complete meal plan with daily breakdown, sources, and modification notes
    """
    
    # Check for required profile data
    if not current_user.date_of_birth or not current_user.weight or not current_user.height:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please complete your profile (age, weight, height) before generating a meal plan"
        )
    
    # Get latest lab report with abnormalities
    latest_lab_report = db.query(LabReport).filter(
        LabReport.user_id == current_user.id,
        LabReport.analysis_status == "completed",
        LabReport.abnormalities.isnot(None)
    ).order_by(LabReport.created_at.desc()).first()
    
    # Parse abnormalities
    lab_abnormalities = []
    if latest_lab_report and latest_lab_report.abnormalities:
        try:
            lab_abnormalities = json.loads(latest_lab_report.abnormalities)
        except:
            lab_abnormalities = []
    
    # Generate meal plan with RAG
    try:
        result = meal_plan_generator.generate_meal_plan(
            user=current_user,
            expectations=expectations,
            lab_abnormalities=lab_abnormalities
        )
        
        if 'error' in result:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result['error']
            )
        
        # Save meal plan to database
        meal_plan = MealPlan(
            user_id=current_user.id,
            expectations=expectations,
            plan_data=json.dumps(result['plan_data']),
            modification_notes=result.get('modification_notes', ''),
            sources=json.dumps(result.get('sources', [])),
            user_age=result['user_snapshot']['age'],
            user_weight=result['user_snapshot']['weight'],
            user_height=result['user_snapshot']['height'],
            user_nationality=result['user_snapshot']['nationality'],
            user_allergies=result['user_snapshot']['allergies'],
            lab_considerations=json.dumps(result.get('lab_considerations', []))
        )
        
        # Deactivate previous plans
        db.query(MealPlan).filter(
            MealPlan.user_id == current_user.id,
            MealPlan.is_active == True
        ).update({'is_active': False})
        
        db.add(meal_plan)
        db.commit()
        db.refresh(meal_plan)
        
        return {
            "id": meal_plan.id,
            "plan_data": result['plan_data'],
            "modification_notes": result.get('modification_notes', ''),
            "sources": result.get('sources', []),
            "total_sources": result.get('total_sources', 0),
            "created_at": meal_plan.created_at
        }
        
    except Exception as e:
        print(f"Meal plan generation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate meal plan: {str(e)}"
        )

@router.get("/meal-plan/active")
def get_active_meal_plan(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's active meal plan"""
    meal_plan = db.query(MealPlan).filter(
        MealPlan.user_id == current_user.id,
        MealPlan.is_active == True
    ).order_by(MealPlan.created_at.desc()).first()
    
    if not meal_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active meal plan found"
        )
    
    return {
        "id": meal_plan.id,
        "expectations": meal_plan.expectations,
        "plan_data": json.loads(meal_plan.plan_data),
        "modification_notes": meal_plan.modification_notes,
        "sources": json.loads(meal_plan.sources) if meal_plan.sources else [],
        "created_at": meal_plan.created_at
    }

@router.get("/meal-plan/history")
def get_meal_plan_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's meal plan history"""
    meal_plans = db.query(MealPlan).filter(
        MealPlan.user_id == current_user.id
    ).order_by(MealPlan.created_at.desc()).limit(10).all()
    
    return [
        {
            "id": plan.id,
            "expectations": plan.expectations,
            "is_active": plan.is_active,
            "created_at": plan.created_at,
            "modification_notes": plan.modification_notes[:100] + "..." if plan.modification_notes and len(plan.modification_notes) > 100 else plan.modification_notes
        }
        for plan in meal_plans
    ]
