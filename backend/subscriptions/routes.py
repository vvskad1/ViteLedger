from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
import os
from auth.routes import get_current_user
from db import get_db
from .models import Subscription
from .client import get_subs_client

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])

class CreateSubRequest(BaseModel):
    plan: str  # basic|plus|pro
    period: str  # weekly|monthly|yearly

class MockActivateRequest(BaseModel):
    plan: str
    period: str

@router.get("/me")
async def get_my_subscription(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's subscription"""
    user_id = str(current_user.id)
    
    subscription = db.query(Subscription).filter(
        Subscription.user_id == user_id
    ).first()
    
    if not subscription:
        return {
            "status": "inactive",
            "plan": None,
            "period": None,
            "started_at": None,
            "ends_at": None,
            "provider": None,
            "is_trial": False,
            "trial_ends_at": None
        }
    
    # Check if trial has expired
    if subscription.is_trial and subscription.trial_ends_at:
        if datetime.utcnow() > subscription.trial_ends_at:
            subscription.status = "expired"
            subscription.updated_at = datetime.utcnow()
            db.commit()
    
    return {
        "id": subscription.id,
        "plan": subscription.plan,
        "period": subscription.period,
        "status": subscription.status,
        "is_trial": subscription.is_trial,
        "trial_ends_at": subscription.trial_ends_at.isoformat() if subscription.trial_ends_at else None,
        "started_at": subscription.started_at.isoformat() if subscription.started_at else None,
        "ends_at": subscription.ends_at.isoformat() if subscription.ends_at else None,
        "provider": subscription.provider,
        "updated_at": subscription.updated_at.isoformat()
    }

@router.post("/create")
async def create_subscription(
    request: CreateSubRequest,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create checkout session for subscription"""
    user_id = str(current_user.id)
    
    # Validate plan and period
    valid_plans = ["basic", "plus", "pro"]
    valid_periods = ["weekly", "monthly", "yearly"]
    
    if request.plan not in valid_plans:
        raise HTTPException(400, f"Invalid plan. Choose from: {valid_plans}")
    if request.period not in valid_periods:
        raise HTTPException(400, f"Invalid period. Choose from: {valid_periods}")
    
    # Get subscription client
    client = get_subs_client()
    
    # Create checkout
    try:
        # Check if method is async
        import inspect
        if inspect.iscoroutinefunction(client.create_checkout):
            result = await client.create_checkout(user_id, request.plan, request.period)
        else:
            result = client.create_checkout(user_id, request.plan, request.period)
        
        # Store pending subscription reference
        subscription = db.query(Subscription).filter(
            Subscription.user_id == user_id
        ).first()
        
        if not subscription:
            subscription = Subscription(
                user_id=user_id,
                plan=request.plan,
                period=request.period,
                status="inactive",
                provider=os.getenv("SUBS_MODE", "MOCK"),
                provider_ref=result.get("provider_ref")
            )
            db.add(subscription)
        else:
            subscription.plan = request.plan
            subscription.period = request.period
            subscription.provider_ref = result.get("provider_ref")
        
        db.commit()
        
        return {
            "checkout_url": result["checkout_url"],
            "provider_ref": result.get("provider_ref")
        }
    except Exception as e:
        raise HTTPException(500, f"Failed to create checkout: {str(e)}")

@router.post("/cancel")
async def cancel_subscription(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel user's subscription"""
    user_id = str(current_user.id)
    
    subscription = db.query(Subscription).filter(
        Subscription.user_id == user_id
    ).first()
    
    if not subscription:
        raise HTTPException(404, "No subscription found")
    
    if subscription.status not in ["active", "past_due"]:
        raise HTTPException(400, "Subscription is not active")
    
    # Cancel at provider
    client = get_subs_client()
    try:
        await client.cancel(subscription.provider_ref)
        
        # Update status (keep ends_at for end of period access)
        subscription.status = "canceled"
        subscription.updated_at = datetime.utcnow()
        db.commit()
        
        return {"message": "Subscription canceled successfully", "ends_at": subscription.ends_at}
    except Exception as e:
        raise HTTPException(500, f"Failed to cancel subscription: {str(e)}")

@router.post("/portal")
async def create_portal_session(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create customer portal session"""
    user_id = str(current_user.id)
    
    subscription = db.query(Subscription).filter(
        Subscription.user_id == user_id
    ).first()
    
    if not subscription or not subscription.provider_ref:
        raise HTTPException(404, "No active subscription found")
    
    client = get_subs_client()
    try:
        result = await client.create_portal_session(subscription.provider_ref)
        return {"url": result["url"]}
    except Exception as e:
        raise HTTPException(500, f"Failed to create portal session: {str(e)}")

@router.post("/webhook")
async def handle_webhook(request: Request, db: Session = Depends(get_db)):
    """Handle webhook from payment provider"""
    headers = dict(request.headers)
    body_bytes = await request.body()
    
    client = get_subs_client()
    
    try:
        event = client.parse_webhook(headers, body_bytes)
        
        event_type = event.get("type")
        data = event.get("data", {})
        
        user_id = data.get("user_reference")
        provider_ref = data.get("provider_ref")
        
        if not user_id or not provider_ref:
            return {"status": "ignored", "reason": "missing user or subscription reference"}
        
        # Get or create subscription
        subscription = db.query(Subscription).filter(
            Subscription.user_id == user_id
        ).first()
        
        if not subscription:
            subscription = Subscription(
                user_id=user_id,
                provider=os.getenv("SUBS_MODE", "MOCK"),
                provider_ref=provider_ref
            )
            db.add(subscription)
        
        # Update based on event type
        if event_type in ["subscription.active", "subscription.created"]:
            subscription.status = "active"
            subscription.plan = data.get("plan", subscription.plan)
            subscription.period = data.get("period", subscription.period)
            subscription.started_at = datetime.utcnow()
            
            # Calculate ends_at
            if data.get("current_period_end"):
                subscription.ends_at = datetime.fromisoformat(data["current_period_end"])
            elif hasattr(client, 'calculate_period_end'):
                subscription.ends_at = client.calculate_period_end(subscription.period)
        
        elif event_type == "subscription.renewed":
            subscription.status = "active"
            if data.get("current_period_end"):
                subscription.ends_at = datetime.fromisoformat(data["current_period_end"])
        
        elif event_type == "subscription.past_due":
            subscription.status = "past_due"
        
        elif event_type in ["subscription.canceled", "subscription.cancelled"]:
            subscription.status = "canceled"
        
        elif event_type == "subscription.expired":
            subscription.status = "expired"
        
        subscription.updated_at = datetime.utcnow()
        db.commit()
        
        return {"status": "processed", "event_type": event_type}
    
    except Exception as e:
        print(f"Webhook error: {e}")
        raise HTTPException(400, f"Webhook processing failed: {str(e)}")

# MOCK-only endpoint for development
@router.post("/mock/activate")
async def mock_activate(
    request: MockActivateRequest,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Development-only: Immediately activate a subscription"""
    if os.getenv("SUBS_MODE") != "MOCK":
        raise HTTPException(403, "This endpoint is only available in MOCK mode")
    
    user_id = str(current_user.id)
    
    # Get mock client to calculate period end
    from .mock_client import MockSubs
    client = MockSubs()
    
    subscription = db.query(Subscription).filter(
        Subscription.user_id == user_id
    ).first()
    
    if not subscription:
        subscription = Subscription(
            user_id=user_id,
            provider="MOCK",
            provider_ref=f"mock_{user_id}_{request.plan}_{request.period}"
        )
        db.add(subscription)
    
    subscription.plan = request.plan
    subscription.period = request.period
    subscription.status = "active"
    subscription.started_at = datetime.utcnow()
    subscription.ends_at = client.calculate_period_end(request.period)
    subscription.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(subscription)
    
    return {
        "message": "Subscription activated",
        "plan": subscription.plan,
        "period": subscription.period,
        "ends_at": subscription.ends_at.isoformat()
    }
