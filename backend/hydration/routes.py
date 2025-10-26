from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import date, datetime, timedelta
from db import get_db
from auth.routes import get_current_user
from auth.models import User
from hydration.models import HydrationLog
from schemas import HydrationCreate, HydrationUpdate, HydrationResponse

router = APIRouter(prefix="/hydration", tags=["hydration"])

@router.get("/today", response_model=HydrationResponse)
def get_today_hydration(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get today's hydration log"""
    today = date.today()
    
    log = db.query(HydrationLog).filter(
        HydrationLog.user_id == current_user.id,
        HydrationLog.date == today
    ).first()
    
    if not log:
        # Create a new log for today
        log = HydrationLog(
            user_id=current_user.id,
            date=today,
            amount_ml=0,
            daily_goal_ml=2000
        )
        db.add(log)
        db.commit()
        db.refresh(log)
    
    return log

@router.post("/add", response_model=HydrationResponse)
def add_water(
    hydration_data: HydrationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add water intake to today's log"""
    today = date.today()
    
    log = db.query(HydrationLog).filter(
        HydrationLog.user_id == current_user.id,
        HydrationLog.date == today
    ).first()
    
    if not log:
        log = HydrationLog(
            user_id=current_user.id,
            date=today,
            amount_ml=hydration_data.amount_ml,
            daily_goal_ml=hydration_data.daily_goal_ml or 2000
        )
        db.add(log)
    else:
        log.amount_ml += hydration_data.amount_ml
        if hydration_data.daily_goal_ml:
            log.daily_goal_ml = hydration_data.daily_goal_ml
    
    db.commit()
    db.refresh(log)
    return log

@router.put("/goal", response_model=HydrationResponse)
def update_daily_goal(
    hydration_data: HydrationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update daily hydration goal"""
    today = date.today()
    
    log = db.query(HydrationLog).filter(
        HydrationLog.user_id == current_user.id,
        HydrationLog.date == today
    ).first()
    
    if not log:
        log = HydrationLog(
            user_id=current_user.id,
            date=today,
            amount_ml=0,
            daily_goal_ml=hydration_data.daily_goal_ml
        )
        db.add(log)
    else:
        log.daily_goal_ml = hydration_data.daily_goal_ml
    
    db.commit()
    db.refresh(log)
    return log

@router.get("/history", response_model=List[HydrationResponse])
def get_hydration_history(
    days: int = 7,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get hydration history for the last N days"""
    start_date = date.today() - timedelta(days=days-1)
    
    logs = db.query(HydrationLog).filter(
        HydrationLog.user_id == current_user.id,
        HydrationLog.date >= start_date
    ).order_by(HydrationLog.date.desc()).all()
    
    return logs

@router.delete("/reset")
def reset_today_hydration(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reset today's water intake to 0"""
    today = date.today()
    
    log = db.query(HydrationLog).filter(
        HydrationLog.user_id == current_user.id,
        HydrationLog.date == today
    ).first()
    
    if log:
        log.amount_ml = 0
        db.commit()
        return {"message": "Today's hydration reset successfully"}
    
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="No hydration log found for today"
    )
