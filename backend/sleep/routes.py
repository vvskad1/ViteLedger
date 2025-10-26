from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime, timedelta, date
from db import get_db
from auth.routes import get_current_user
from auth.models import User
from sleep.models import SleepSchedule, SleepLog
from schemas import SleepScheduleCreate, SleepScheduleResponse, SleepLogCreate, SleepLogResponse

router = APIRouter(prefix="/sleep", tags=["sleep"])

@router.get("/schedule", response_model=Optional[SleepScheduleResponse])
def get_sleep_schedule(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the user's sleep schedule"""
    schedule = db.query(SleepSchedule).filter(
        SleepSchedule.user_id == current_user.id
    ).first()
    return schedule

@router.post("/schedule", response_model=SleepScheduleResponse)
def create_or_update_sleep_schedule(
    schedule_data: SleepScheduleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create or update the user's sleep schedule"""
    # Check if schedule already exists
    existing_schedule = db.query(SleepSchedule).filter(
        SleepSchedule.user_id == current_user.id
    ).first()
    
    if existing_schedule:
        # Update existing schedule
        existing_schedule.sleep_start = schedule_data.sleep_start
        existing_schedule.sleep_end = schedule_data.sleep_end
        db.commit()
        db.refresh(existing_schedule)
        return existing_schedule
    else:
        # Create new schedule
        new_schedule = SleepSchedule(
            user_id=current_user.id,
            sleep_start=schedule_data.sleep_start,
            sleep_end=schedule_data.sleep_end
        )
        db.add(new_schedule)
        db.commit()
        db.refresh(new_schedule)
        return new_schedule

@router.delete("/schedule")
def delete_sleep_schedule(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete the user's sleep schedule"""
    schedule = db.query(SleepSchedule).filter(
        SleepSchedule.user_id == current_user.id
    ).first()
    
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sleep schedule not found"
        )
    
    db.delete(schedule)
    db.commit()
    return {"message": "Sleep schedule deleted successfully"}

# Sleep Log Routes
@router.post("/log", response_model=SleepLogResponse)
def create_sleep_log(
    log_data: SleepLogCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Log a sleep session"""
    # Calculate duration
    duration = (log_data.wake_time - log_data.bed_time).total_seconds() / 3600
    
    if duration < 0:
        duration += 24  # Handle sleep crossing midnight
    
    new_log = SleepLog(
        user_id=current_user.id,
        date=log_data.date or date.today(),
        bed_time=log_data.bed_time,
        wake_time=log_data.wake_time,
        duration_hours=round(duration, 2),
        quality=log_data.quality,
        notes=log_data.notes
    )
    
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    return new_log

@router.get("/logs", response_model=List[SleepLogResponse])
def get_sleep_logs(
    days: int = 7,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get sleep logs for the last N days"""
    start_date = date.today() - timedelta(days=days-1)
    
    logs = db.query(SleepLog).filter(
        SleepLog.user_id == current_user.id,
        SleepLog.date >= start_date
    ).order_by(SleepLog.date.desc()).all()
    
    return logs

@router.get("/stats")
def get_sleep_stats(
    days: int = 7,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get sleep statistics and suggestions"""
    start_date = date.today() - timedelta(days=days-1)
    
    logs = db.query(SleepLog).filter(
        SleepLog.user_id == current_user.id,
        SleepLog.date >= start_date
    ).all()
    
    if not logs:
        return {
            "average_duration": 0,
            "total_logs": 0,
            "suggestion": "Start logging your sleep to get personalized insights!"
        }
    
    avg_duration = sum(log.duration_hours for log in logs) / len(logs)
    quality_counts = {}
    for log in logs:
        if log.quality:
            quality_counts[log.quality] = quality_counts.get(log.quality, 0) + 1
    
    # Generate suggestions
    suggestion = ""
    if avg_duration < 6:
        suggestion = "You're averaging less than 6 hours of sleep. Try to aim for 7-9 hours for optimal health."
    elif avg_duration < 7:
        suggestion = "You're getting decent sleep, but aim for 7-9 hours for better recovery."
    elif avg_duration > 9:
        suggestion = "You're sleeping over 9 hours on average. Ensure quality over quantity."
    else:
        suggestion = "Great! You're in the optimal sleep range of 7-9 hours."
    
    return {
        "average_duration": round(avg_duration, 2),
        "total_logs": len(logs),
        "quality_distribution": quality_counts,
        "suggestion": suggestion,
        "logs": logs
    }

@router.delete("/log/{log_id}")
def delete_sleep_log(
    log_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a sleep log"""
    log = db.query(SleepLog).filter(
        SleepLog.id == log_id,
        SleepLog.user_id == current_user.id
    ).first()
    
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sleep log not found"
        )
    
    db.delete(log)
    db.commit()
    return {"message": "Sleep log deleted successfully"}

