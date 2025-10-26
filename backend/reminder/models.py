from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Time
from sqlalchemy.orm import relationship
from datetime import datetime
from db import Base

class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    reminder_type = Column(String, nullable=False)  # e.g., "medication", "meal", "hydration", "appointment", "lab_test"
    time = Column(String, nullable=True)  # Time in HH:MM format (for recurring reminders)
    days = Column(String, nullable=True)  # JSON string of days: "mon,tue,wed" (for recurring reminders)
    reminder_datetime = Column(DateTime, nullable=True)  # Specific datetime for one-time reminders
    enabled = Column(Boolean, default=True)
    is_completed = Column(Boolean, default=False)  # For one-time reminders
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="reminders")
