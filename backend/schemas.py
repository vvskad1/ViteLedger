from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, date

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    # Personal Info
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    nationality: Optional[str] = None
    state_region: Optional[str] = None
    # Physical Metrics
    height: Optional[float] = None
    weight: Optional[float] = None
    blood_type: Optional[str] = None
    # Lifestyle Info
    activity_level: Optional[str] = None
    occupation_type: Optional[str] = None
    # Dietary Preferences
    diet_type: Optional[str] = None
    food_allergies: Optional[str] = None
    dietary_restrictions: Optional[str] = None
    food_preferences: Optional[str] = None
    # Medical Background
    pre_existing_conditions: Optional[str] = None
    current_medications: Optional[str] = None
    health_goals: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    nationality: Optional[str] = None
    state_region: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    blood_type: Optional[str] = None
    activity_level: Optional[str] = None
    occupation_type: Optional[str] = None
    diet_type: Optional[str] = None
    food_allergies: Optional[str] = None
    dietary_restrictions: Optional[str] = None
    food_preferences: Optional[str] = None
    pre_existing_conditions: Optional[str] = None
    current_medications: Optional[str] = None
    health_goals: Optional[str] = None

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    name: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    nationality: Optional[str] = None
    state_region: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    blood_type: Optional[str] = None
    activity_level: Optional[str] = None
    occupation_type: Optional[str] = None
    diet_type: Optional[str] = None
    food_allergies: Optional[str] = None
    dietary_restrictions: Optional[str] = None
    food_preferences: Optional[str] = None
    pre_existing_conditions: Optional[str] = None
    current_medications: Optional[str] = None
    health_goals: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Recovery Status Schemas
class RecoveryStatusCreate(BaseModel):
    is_active: bool
    reason: Optional[str] = None
    temperature: Optional[str] = None
    has_fracture: Optional[bool] = False
    fracture_details: Optional[str] = None
    recent_surgery: Optional[bool] = False
    surgery_details: Optional[str] = None
    injury_type: Optional[str] = None
    recovery_notes: Optional[str] = None

class RecoveryStatusResponse(BaseModel):
    id: int
    user_id: int
    is_active: bool
    reason: Optional[str]
    temperature: Optional[str]
    has_fracture: Optional[bool]
    fracture_details: Optional[str]
    recent_surgery: Optional[bool]
    surgery_details: Optional[str]
    injury_type: Optional[str]
    recovery_notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Caretaker Schemas
class CaretakerCreate(BaseModel):
    name: str
    relationship_type: str
    phone: str
    email: EmailStr
    share_on_recovery: bool = False

class CaretakerResponse(BaseModel):
    id: int
    user_id: int
    name: str
    relationship_type: str
    phone: str
    email: str
    share_on_recovery: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Reminder Schemas
class ReminderCreate(BaseModel):
    title: str
    reminder_type: str
    time: Optional[str] = None
    days: Optional[str] = None
    reminder_datetime: Optional[datetime] = None
    enabled: bool = True
    is_completed: bool = False
    description: Optional[str] = None

class ReminderUpdate(BaseModel):
    title: Optional[str] = None
    reminder_type: Optional[str] = None
    time: Optional[str] = None
    days: Optional[str] = None
    reminder_datetime: Optional[datetime] = None
    enabled: Optional[bool] = None
    is_completed: Optional[bool] = None
    description: Optional[str] = None

class ReminderResponse(BaseModel):
    id: int
    user_id: int
    title: str
    reminder_type: str
    time: Optional[str]
    days: Optional[str]
    reminder_datetime: Optional[datetime]
    enabled: bool
    is_completed: Optional[bool]
    description: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

# Sleep Schedule Schemas
class SleepScheduleCreate(BaseModel):
    sleep_start: str  # e.g., "22:30"
    sleep_end: str    # e.g., "07:00"

class SleepScheduleResponse(BaseModel):
    id: int
    user_id: int
    sleep_start: str
    sleep_end: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Sleep Log Schemas
class SleepLogCreate(BaseModel):
    date: Optional[date] = None
    bed_time: datetime
    wake_time: datetime
    quality: Optional[str] = None  # poor, fair, good, excellent
    notes: Optional[str] = None

    class Config:
        arbitrary_types_allowed = True

class SleepLogResponse(BaseModel):
    id: int
    user_id: int
    date: date
    bed_time: datetime
    wake_time: datetime
    duration_hours: float
    quality: Optional[str]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Nutrition Schemas
class MealCreate(BaseModel):
    meal_name: str
    meal_type: str  # breakfast, lunch, dinner, snack
    calories: Optional[float] = None
    protein: Optional[float] = None
    carbs: Optional[float] = None
    fats: Optional[float] = None
    notes: Optional[str] = None
    meal_date: Optional[datetime] = None

class MealResponse(BaseModel):
    id: int
    user_id: int
    meal_name: str
    meal_type: str
    calories: Optional[float]
    protein: Optional[float]
    carbs: Optional[float]
    fats: Optional[float]
    notes: Optional[str]
    meal_date: datetime
    created_at: datetime

    class Config:
        from_attributes = True

class LabReportResponse(BaseModel):
    id: int
    user_id: int
    report_name: str
    uploaded_at: Optional[datetime] = None
    report_date: Optional[datetime] = None
    next_test_date: Optional[datetime] = None
    analysis_status: str  # pending, analyzing, completed, failed
    ai_summary: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class LabReportAnalysis(BaseModel):
    id: int
    report_name: str
    analysis_status: str
    ai_summary: Optional[str]
    key_findings: List[str]
    recommendations: List[str]
    risk_factors: List[str]

class NutritionRecommendationResponse(BaseModel):
    id: int
    user_id: int
    recommendation_text: str
    recommendation_type: str
    based_on: Optional[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Appointment Schemas
class AppointmentCreate(BaseModel):
    title: str
    appointment_type: str
    appointment_datetime: datetime
    location: Optional[str] = None
    doctor_name: Optional[str] = None
    notes: Optional[str] = None
    is_completed: bool = False

class AppointmentUpdate(BaseModel):
    title: Optional[str] = None
    appointment_type: Optional[str] = None
    appointment_datetime: Optional[datetime] = None
    location: Optional[str] = None
    doctor_name: Optional[str] = None
    notes: Optional[str] = None
    is_completed: Optional[bool] = None

class AppointmentResponse(BaseModel):
    id: int
    user_id: int
    title: str
    appointment_type: str
    appointment_datetime: datetime
    location: Optional[str]
    doctor_name: Optional[str]
    notes: Optional[str]
    is_completed: bool
    reminder_sent: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Hydration Schemas
class HydrationCreate(BaseModel):
    amount_ml: float
    daily_goal_ml: Optional[float] = None

class HydrationUpdate(BaseModel):
    daily_goal_ml: float

class HydrationResponse(BaseModel):
    id: int
    user_id: int
    date: date
    amount_ml: float
    daily_goal_ml: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Fitness Schemas
class FitnessGoalCreate(BaseModel):
    goal_type: str
    target_description: Optional[str] = None
    target_date: Optional[date] = None

class FitnessGoalResponse(BaseModel):
    id: int
    user_id: int
    goal_type: str
    target_description: Optional[str]
    target_date: Optional[date]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class WorkoutLogUpdate(BaseModel):
    workout_log_id: int
    completed: bool
    notes: Optional[str] = None
