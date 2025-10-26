from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from db import get_db
from schemas import RecoveryStatusCreate, RecoveryStatusResponse
from status.models import RecoveryStatus
from auth.models import User
from auth.routes import get_current_user

router = APIRouter(prefix="/status", tags=["status"])

@router.get("/", response_model=RecoveryStatusResponse)
async def get_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's recovery status"""
    status_record = db.query(RecoveryStatus).filter(
        RecoveryStatus.user_id == current_user.id
    ).first()
    
    if not status_record:
        # Create default status if none exists
        status_record = RecoveryStatus(
            user_id=current_user.id,
            is_active=False
        )
        db.add(status_record)
        db.commit()
        db.refresh(status_record)
    
    return status_record

@router.post("/", response_model=RecoveryStatusResponse)
async def update_status(
    status_data: RecoveryStatusCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update or create recovery status"""
    status_record = db.query(RecoveryStatus).filter(
        RecoveryStatus.user_id == current_user.id
    ).first()
    
    if status_record:
        # Update existing
        status_record.is_active = status_data.is_active
        status_record.reason = status_data.reason
        status_record.temperature = status_data.temperature
        status_record.has_fracture = status_data.has_fracture
        status_record.fracture_details = status_data.fracture_details
        status_record.recent_surgery = status_data.recent_surgery
        status_record.surgery_details = status_data.surgery_details
        status_record.injury_type = status_data.injury_type
        status_record.recovery_notes = status_data.recovery_notes
        status_record.updated_at = datetime.utcnow()
    else:
        # Create new
        status_record = RecoveryStatus(
            user_id=current_user.id,
            is_active=status_data.is_active,
            reason=status_data.reason,
            temperature=status_data.temperature,
            has_fracture=status_data.has_fracture,
            fracture_details=status_data.fracture_details,
            recent_surgery=status_data.recent_surgery,
            surgery_details=status_data.surgery_details,
            injury_type=status_data.injury_type,
            recovery_notes=status_data.recovery_notes
        )
        db.add(status_record)
    
    db.commit()
    db.refresh(status_record)
    
    # Log notification if recovery is activated
    if status_data.is_active:
        print(f"🚨 RECOVERY MODE ACTIVATED for {current_user.name}")
        print(f"   Reason: {status_data.reason}")
        print(f"   Temperature: {status_data.temperature}")
        if status_data.has_fracture:
            print(f"   Fracture: {status_data.fracture_details}")
        if status_data.recent_surgery:
            print(f"   Surgery: {status_data.surgery_details}")
        print(f"   Emergency contacts will be notified")
    
    return status_record

@router.post("/recovery/activate")
async def activate_recovery(
    status_data: RecoveryStatusCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Activate recovery mode"""
    status_data.is_active = True
    return await update_status(status_data, current_user, db)

@router.post("/recovery/deactivate")
async def deactivate_recovery(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deactivate recovery mode"""
    status_record = db.query(RecoveryStatus).filter(
        RecoveryStatus.user_id == current_user.id
    ).first()
    
    if status_record:
        status_record.is_active = False
        status_record.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(status_record)
        print(f"✅ Recovery mode deactivated for {current_user.name}")
    
    return {"message": "Recovery mode deactivated", "status": status_record}
