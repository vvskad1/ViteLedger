from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from fastapi.security.http import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import timedelta

from db import get_db
from schemas import UserCreate, UserLogin, UserResponse, UserUpdate, Token
from auth.models import User
from auth.utils import (
    get_password_hash, 
    verify_password, 
    create_access_token, 
    verify_token,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from subscriptions.trial import activate_trial

router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer()

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user: UserCreate, db: Session = Depends(get_db)):
    # Check if user exists
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    db_user = User(
        name=user.name,
        email=user.email,
        password_hash=get_password_hash(user.password),
        # Personal Info
        date_of_birth=user.date_of_birth,
        gender=user.gender,
        nationality=user.nationality,
        state_region=user.state_region,
        # Physical Metrics
        height=user.height,
        weight=user.weight,
        blood_type=user.blood_type,
        # Lifestyle Info
        activity_level=user.activity_level,
        occupation_type=user.occupation_type,
        # Dietary Preferences
        diet_type=user.diet_type,
        food_allergies=user.food_allergies,
        dietary_restrictions=user.dietary_restrictions,
        food_preferences=user.food_preferences,
        # Medical Background
        pre_existing_conditions=user.pre_existing_conditions,
        current_medications=user.current_medications,
        health_goals=user.health_goals
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Auto-activate 3-day trial
    try:
        activate_trial(str(db_user.id), db)
    except Exception as e:
        print(f"Failed to activate trial: {e}")
        # Don't fail registration if trial activation fails
    
    return db_user

@router.post("/login", response_model=Token)
def login(user: UserLogin, db: Session = Depends(get_db)):
    # Find user
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": db_user.email}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    token_data = verify_token(credentials.credentials)
    if token_data is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = db.query(User).filter(User.email == token_data.email).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return user

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=UserResponse)
async def update_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user profile information"""
    # Update only provided fields
    update_data = user_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)
    
    db.commit()
    db.refresh(current_user)
    return current_user
