from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from db import get_db
from schemas import ReminderCreate, ReminderUpdate, ReminderResponse
from reminder.models import Reminder
from auth.models import User
from auth.routes import get_current_user

router = APIRouter(prefix="/reminders", tags=["reminders"])

@router.get("/", response_model=List[ReminderResponse])
async def get_reminders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all reminders for current user"""
    reminders = db.query(Reminder).filter(
        Reminder.user_id == current_user.id
    ).order_by(Reminder.time).all()
    return reminders

@router.post("/", response_model=ReminderResponse, status_code=status.HTTP_201_CREATED)
async def create_reminder(
    reminder_data: ReminderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new reminder"""
    reminder = Reminder(
        user_id=current_user.id,
        title=reminder_data.title,
        reminder_type=reminder_data.reminder_type,
        time=reminder_data.time,
        days=reminder_data.days,
        enabled=reminder_data.enabled,
        description=reminder_data.description
    )
    
    db.add(reminder)
    db.commit()
    db.refresh(reminder)
    
    print(f"🔔 Reminder created: {reminder.title} at {reminder.time}")
    
    return reminder

@router.put("/{reminder_id}", response_model=ReminderResponse)
async def update_reminder(
    reminder_id: int,
    reminder_data: ReminderUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a reminder"""
    reminder = db.query(Reminder).filter(
        Reminder.id == reminder_id,
        Reminder.user_id == current_user.id
    ).first()
    
    if not reminder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reminder not found"
        )
    
    # Update only provided fields
    update_data = reminder_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(reminder, field, value)
    
    db.commit()
    db.refresh(reminder)
    
    return reminder

@router.delete("/{reminder_id}")
async def delete_reminder(
    reminder_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a reminder"""
    reminder = db.query(Reminder).filter(
        Reminder.id == reminder_id,
        Reminder.user_id == current_user.id
    ).first()
    
    if not reminder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reminder not found"
        )
    
    db.delete(reminder)
    db.commit()
    
    return {"message": "Reminder deleted successfully"}

@router.patch("/{reminder_id}/toggle")
async def toggle_reminder(
    reminder_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Toggle reminder enabled status"""
    reminder = db.query(Reminder).filter(
        Reminder.id == reminder_id,
        Reminder.user_id == current_user.id
    ).first()
    
    if not reminder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reminder not found"
        )
    
    reminder.enabled = not reminder.enabled
    db.commit()
    db.refresh(reminder)
    
    status_text = "enabled" if reminder.enabled else "disabled"
    print(f"🔔 Reminder {status_text}: {reminder.title}")
    
    return {"message": f"Reminder {status_text}", "enabled": reminder.enabled}
