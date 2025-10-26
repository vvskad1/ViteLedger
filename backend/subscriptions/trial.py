"""Automatic trial activation on user registration"""
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from subscriptions.models import Subscription

TRIAL_DAYS = 3
DEFAULT_TRIAL_PLAN = "plus"  # Give everyone Plus plan for trial

def activate_trial(user_id: str, db: Session):
    """Automatically activate 3-day trial for new user"""
    
    # Check if user already has subscription
    existing = db.query(Subscription).filter(
        Subscription.user_id == user_id
    ).first()
    
    if existing:
        return existing  # Don't override existing subscription
    
    # Create trial subscription
    trial_ends = datetime.utcnow() + timedelta(days=TRIAL_DAYS)
    
    trial_sub = Subscription(
        user_id=user_id,
        plan=DEFAULT_TRIAL_PLAN,
        period="trial",
        status="trial",
        is_trial=True,
        trial_ends_at=trial_ends,
        started_at=datetime.utcnow(),
        ends_at=trial_ends,
        provider="TRIAL",
        provider_ref=f"trial_{user_id}"
    )
    
    db.add(trial_sub)
    db.commit()
    db.refresh(trial_sub)
    
    return trial_sub
