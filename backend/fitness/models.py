from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Date, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from db import Base


class FitnessGoal(Base):
    __tablename__ = "fitness_goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    goal_type = Column(String, nullable=False)  # weight_loss, muscle_gain, stamina, flexibility, disease_management
    target_description = Column(Text, nullable=True)
    target_date = Column(Date, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="fitness_goals")
    

class FitnessPlan(Base):
    __tablename__ = "fitness_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    goal_id = Column(Integer, ForeignKey("fitness_goals.id"), nullable=True)
    plan_data = Column(JSON, nullable=False)  # 30-day workout plan in JSON format
    health_snapshot = Column(JSON, nullable=True)  # Recovery status + lab parameters when plan was generated
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="fitness_plans")
    goal = relationship("FitnessGoal")


class WorkoutLog(Base):
    __tablename__ = "workout_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    plan_id = Column(Integer, ForeignKey("fitness_plans.id"), nullable=False)
    day_number = Column(Integer, nullable=False)  # 1-30
    workout_name = Column(String, nullable=False)
    completed = Column(Boolean, default=False)
    completion_date = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="workout_logs")
    plan = relationship("FitnessPlan")
