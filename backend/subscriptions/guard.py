from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from auth.routes import get_current_user
from db import get_db
from .models import Subscription

PLAN_RANKS = {
    "basic": 1,
    "plus": 2,
    "pro": 3
}

def require_plan(min_plan: str = "basic"):
    """Dependency to check if user has required plan tier"""
    
    async def _check_plan(
        current_user = Depends(get_current_user),
        db: Session = Depends(get_db)
    ):
        user_id = str(current_user.id)
        
        # Get user's subscription
        subscription = db.query(Subscription).filter(
            Subscription.user_id == user_id
        ).first()
        
        # Check if active subscription or trial exists
        if not subscription or subscription.status not in ["active", "trial"]:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail=f"This feature requires an active subscription. Please upgrade to {min_plan.title()} or higher."
            )
        
        # Check if trial has expired
        if subscription.status == "trial" and subscription.trial_ends_at:
            from datetime import datetime
            if datetime.utcnow() > subscription.trial_ends_at:
                raise HTTPException(
                    status_code=status.HTTP_402_PAYMENT_REQUIRED,
                    detail="Your free trial has ended. Please subscribe to continue using premium features."
                )
        
        # Check plan tier
        user_rank = PLAN_RANKS.get(subscription.plan, 0)
        required_rank = PLAN_RANKS.get(min_plan, 0)
        
        if user_rank < required_rank:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This feature requires {min_plan.title()} plan or higher. Your current plan: {subscription.plan.title()}"
            )
        
        return subscription
    
    return _check_plan
