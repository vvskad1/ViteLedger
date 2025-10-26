from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from db import Base

class Meal(Base):
    __tablename__ = "meals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    meal_name = Column(String, nullable=False)
    meal_type = Column(String, nullable=False)  # breakfast, lunch, dinner, snack
    calories = Column(Float, nullable=True)
    protein = Column(Float, nullable=True)  # grams
    carbs = Column(Float, nullable=True)    # grams
    fats = Column(Float, nullable=True)     # grams
    notes = Column(Text, nullable=True)
    meal_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="meals")

class LabReport(Base):
    __tablename__ = "lab_reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    report_name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)  # Path to uploaded PDF
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    report_date = Column(DateTime, nullable=True)
    next_test_date = Column(DateTime, nullable=True)  # Calculated next test date
    
    # AI Analysis Results
    analysis_status = Column(String, default="pending")  # pending, analyzing, completed, failed
    extracted_text = Column(Text, nullable=True)
    ai_summary = Column(Text, nullable=True)
    
    # Detailed abnormality analysis (JSON string)
    abnormalities = Column(Text, nullable=True)  # List of abnormal findings with details
    key_findings = Column(Text, nullable=True)  # JSON string
    recommendations = Column(Text, nullable=True)
    risk_factors = Column(Text, nullable=True)
    
    # Reminder for next test
    reminder_created = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="lab_reports")

class NutritionRecommendation(Base):
    __tablename__ = "nutrition_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    recommendation_text = Column(Text, nullable=False)
    recommendation_type = Column(String, nullable=False)  # meal_plan, supplement, diet_change
    based_on = Column(String, nullable=True)  # lab_report, health_goal, deficiency
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="nutrition_recommendations")

class MealPlan(Base):
    __tablename__ = "meal_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    expectations = Column(Text, nullable=False)  # User's goals/preferences
    plan_data = Column(Text, nullable=False)  # JSON string: 7-day meal plan with recipes, macros
    modification_notes = Column(Text, nullable=True)  # Explanation of lab-based modifications
    sources = Column(Text, nullable=True)  # JSON string: RAG source URLs for verification
    
    # User profile snapshot at generation time
    user_age = Column(Integer, nullable=True)
    user_weight = Column(Float, nullable=True)
    user_height = Column(Float, nullable=True)
    user_nationality = Column(String, nullable=True)
    user_allergies = Column(Text, nullable=True)
    
    # Lab abnormalities considered
    lab_considerations = Column(Text, nullable=True)  # JSON string of lab abnormalities
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", backref="meal_plans")
