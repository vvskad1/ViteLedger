from sqlalchemy import Column, Integer, String, Date, Float, Text
from sqlalchemy.orm import relationship
from db import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    
    # Personal Info
    date_of_birth = Column(Date, nullable=True)
    gender = Column(String, nullable=True)  # Male, Female, Other
    nationality = Column(String, nullable=True)  # India, USA, China, etc.
    state_region = Column(String, nullable=True)  # Telangana, California, etc.
    
    # Physical Metrics
    height = Column(Float, nullable=True)  # in cm
    weight = Column(Float, nullable=True)  # in kg
    blood_type = Column(String, nullable=True)  # A+, B+, O+, etc.
    
    # Lifestyle Info
    activity_level = Column(String, nullable=True)  # Sedentary, Light, Moderate, Active, Very Active
    occupation_type = Column(String, nullable=True)  # Desk job, Physical labor, etc.
    
    # Dietary Preferences (stored as comma-separated strings or JSON)
    diet_type = Column(String, nullable=True)  # Omnivore, Vegetarian, Vegan, Pescatarian
    food_allergies = Column(Text, nullable=True)  # Comma-separated: "Nuts, Dairy, Gluten"
    dietary_restrictions = Column(Text, nullable=True)  # Halal, Kosher, No Beef, No Pork
    food_preferences = Column(Text, nullable=True)  # Optional text
    
    # Medical Background
    pre_existing_conditions = Column(Text, nullable=True)  # Comma-separated
    current_medications = Column(Text, nullable=True)  # Comma-separated
    health_goals = Column(Text, nullable=True)  # Weight loss, Muscle gain, etc.
    
    recovery_status = relationship("RecoveryStatus", back_populates="user", uselist=False)
    caretakers = relationship("Caretaker", back_populates="user")
    reminders = relationship("Reminder", back_populates="user")
    sleep_schedule = relationship("SleepSchedule", back_populates="user", uselist=False)
    sleep_logs = relationship("SleepLog", back_populates="user")
    meals = relationship("Meal", back_populates="user")
    lab_reports = relationship("LabReport", back_populates="user")
    nutrition_recommendations = relationship("NutritionRecommendation", back_populates="user")
    appointments = relationship("Appointment", back_populates="user")
    hydration_logs = relationship("HydrationLog", back_populates="user")
    fitness_goals = relationship("FitnessGoal", back_populates="user")
    fitness_plans = relationship("FitnessPlan", back_populates="user")
    workout_logs = relationship("WorkoutLog", back_populates="user")
    mood_logs = relationship("MoodLog", back_populates="user")

