from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime, date
from typing import List, Optional

from db import get_db
from auth.models import User
from auth.routes import get_current_user
from fitness.models import FitnessGoal, FitnessPlan, WorkoutLog
from status.models import RecoveryStatus
from nutrition.models import LabReport
from fitness.ai_service import generate_fitness_plan
from schemas import FitnessGoalCreate, WorkoutLogUpdate

router = APIRouter(prefix="/fitness", tags=["fitness"])


@router.post("/set-goal")
async def set_fitness_goal(
    goal_data: FitnessGoalCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Set or update user's fitness goal"""
    # Deactivate any existing active goals
    existing_goals = db.query(FitnessGoal).filter(
        FitnessGoal.user_id == current_user.id,
        FitnessGoal.is_active == True
    ).all()
    
    for goal in existing_goals:
        goal.is_active = False
    
    # Create new goal
    new_goal = FitnessGoal(
        user_id=current_user.id,
        goal_type=goal_data.goal_type,
        target_description=goal_data.target_description,
        target_date=goal_data.target_date,
        is_active=True
    )
    
    db.add(new_goal)
    db.commit()
    db.refresh(new_goal)
    
    return {"message": "Goal set successfully", "goal": new_goal}


@router.get("/current-goal")
async def get_current_goal(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's current active fitness goal"""
    goal = db.query(FitnessGoal).filter(
        FitnessGoal.user_id == current_user.id,
        FitnessGoal.is_active == True
    ).first()
    
    return goal if goal else {"message": "No active goal"}


@router.post("/generate-plan")
async def generate_plan(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate a new 30-day fitness plan based on current health status and goals"""
    
    # Get user's active goal
    goal = db.query(FitnessGoal).filter(
        FitnessGoal.user_id == current_user.id,
        FitnessGoal.is_active == True
    ).first()
    
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please set a fitness goal first"
        )
    
    # Get recovery status (only if currently active)
    recovery = db.query(RecoveryStatus).filter(
        RecoveryStatus.user_id == current_user.id,
        RecoveryStatus.is_active == True
    ).order_by(desc(RecoveryStatus.created_at)).first()
    
    recovery_data = {
        'is_active': recovery.is_active if recovery else False,
        'reason': recovery.reason if recovery else None,
        'temperature': recovery.temperature if recovery else None,
        'has_fracture': recovery.has_fracture if recovery else False,
        'fracture_details': recovery.fracture_details if recovery else None,
        'recent_surgery': recovery.recent_surgery if recovery else False,
        'surgery_details': recovery.surgery_details if recovery else None,
        'injury_type': recovery.injury_type if recovery else None,
        'recovery_notes': recovery.recovery_notes if recovery else None
    }
    
    # Get latest lab report insights
    latest_lab = db.query(LabReport).filter(
        LabReport.user_id == current_user.id
    ).order_by(desc(LabReport.created_at)).first()
    
    lab_insights = latest_lab.ai_summary if latest_lab and latest_lab.ai_summary else None
    
    # Get workout history to identify skipped exercises
    workout_history = None
    existing_plan = db.query(FitnessPlan).filter(
        FitnessPlan.user_id == current_user.id,
        FitnessPlan.is_active == True
    ).first()
    
    if existing_plan:
        logs = db.query(WorkoutLog).filter(
            WorkoutLog.plan_id == existing_plan.id,
            WorkoutLog.completed == False
        ).all()
        
        if len(logs) > 5:  # If more than 5 uncompleted workouts
            skipped_types = [log.workout_name for log in logs[:10]]
            workout_history = {
                'frequently_skipped': list(set(skipped_types))
            }
    
    # Generate plan using AI
    try:
        plan_data = generate_fitness_plan(
            user_goal=goal.goal_type,
            recovery_status=recovery_data,
            lab_insights=lab_insights,
            medical_conditions=current_user.pre_existing_conditions,
            workout_history=workout_history
        )
        
        # Deactivate old plans
        old_plans = db.query(FitnessPlan).filter(
            FitnessPlan.user_id == current_user.id,
            FitnessPlan.is_active == True
        ).all()
        
        for old_plan in old_plans:
            old_plan.is_active = False
        
        # Save new plan
        new_plan = FitnessPlan(
            user_id=current_user.id,
            goal_id=goal.id,
            plan_data=plan_data,
            health_snapshot={
                'recovery': recovery_data,
                'lab_insights': lab_insights,
                'medical_conditions': current_user.pre_existing_conditions
            },
            is_active=True
        )
        
        db.add(new_plan)
        db.commit()
        db.refresh(new_plan)
        
        # Create workout logs for tracking
        if 'days' in plan_data:
            for day_data in plan_data['days']:
                for exercise in day_data.get('exercises', []):
                    if exercise.get('type') != 'rest':
                        workout_log = WorkoutLog(
                            user_id=current_user.id,
                            plan_id=new_plan.id,
                            day_number=day_data['day'],
                            workout_name=exercise['name'],
                            completed=False
                        )
                        db.add(workout_log)
            
            db.commit()
        
        return {
            "message": "Fitness plan generated successfully",
            "plan": new_plan,
            "health_warnings": plan_data.get('health_warnings', [])
        }
        
    except Exception as e:
        print(f"Error generating plan: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate fitness plan: {str(e)}"
        )


@router.get("/current-plan")
async def get_current_plan(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's current active fitness plan"""
    plan = db.query(FitnessPlan).filter(
        FitnessPlan.user_id == current_user.id,
        FitnessPlan.is_active == True
    ).first()
    
    if not plan:
        return {"message": "No active plan. Please generate a plan first."}
    
    # Get workout logs for this plan
    logs = db.query(WorkoutLog).filter(
        WorkoutLog.plan_id == plan.id
    ).all()
    
    completion_data = {
        'total_workouts': len(logs),
        'completed': len([l for l in logs if l.completed]),
        'completion_percentage': (len([l for l in logs if l.completed]) / len(logs) * 100) if logs else 0
    }
    
    return {
        "plan": plan,
        "progress": completion_data
    }


@router.post("/log-workout")
async def log_workout(
    log_data: WorkoutLogUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark a workout as completed or update notes"""
    workout_log = db.query(WorkoutLog).filter(
        WorkoutLog.id == log_data.workout_log_id,
        WorkoutLog.user_id == current_user.id
    ).first()
    
    if not workout_log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workout log not found"
        )
    
    workout_log.completed = log_data.completed
    workout_log.completion_date = datetime.utcnow() if log_data.completed else None
    workout_log.notes = log_data.notes
    
    db.commit()
    db.refresh(workout_log)
    
    return {"message": "Workout logged successfully", "log": workout_log}


@router.get("/progress")
async def get_progress(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's workout progress statistics"""
    active_plan = db.query(FitnessPlan).filter(
        FitnessPlan.user_id == current_user.id,
        FitnessPlan.is_active == True
    ).first()
    
    if not active_plan:
        return {"message": "No active plan"}
    
    logs = db.query(WorkoutLog).filter(
        WorkoutLog.plan_id == active_plan.id
    ).all()
    
    completed_logs = [l for l in logs if l.completed]
    
    # Calculate days active
    plan_age_days = (datetime.utcnow() - active_plan.created_at).days
    
    return {
        "plan_created": active_plan.created_at,
        "days_active": plan_age_days + 1,
        "total_workouts": len(logs),
        "completed_workouts": len(completed_logs),
        "completion_percentage": (len(completed_logs) / len(logs) * 100) if logs else 0,
        "current_day": min(plan_age_days + 1, 30),
        "goal_type": active_plan.goal.goal_type if active_plan.goal else "Not set"
    }


@router.get("/workout-logs")
async def get_workout_logs(
    day_number: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get workout logs, optionally filtered by day number"""
    active_plan = db.query(FitnessPlan).filter(
        FitnessPlan.user_id == current_user.id,
        FitnessPlan.is_active == True
    ).first()
    
    if not active_plan:
        return []
    
    query = db.query(WorkoutLog).filter(WorkoutLog.plan_id == active_plan.id)
    
    if day_number:
        query = query.filter(WorkoutLog.day_number == day_number)
    
    logs = query.all()
    return logs


# Register RAG retriever routes
from .retriever import register_fitness_retriever_routes
register_fitness_retriever_routes(router)
