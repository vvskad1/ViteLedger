from sqlalchemy import Column, Integer, String, DateTime, Float, Date, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from db import Base

class SleepSchedule(Base):
    __tablename__ = "sleep_schedules"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    sleep_start = Column(String, nullable=False)  # e.g., "22:30" (10:30 PM)
    sleep_end = Column(String, nullable=False)    # e.g., "07:00" (7:00 AM)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="sleep_schedule")

class SleepLog(Base):
    __tablename__ = "sleep_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(Date, nullable=False)  # The date of sleep
    bed_time = Column(DateTime, nullable=False)  # Actual time went to bed
    wake_time = Column(DateTime, nullable=False)  # Actual time woke up
    duration_hours = Column(Float, nullable=False)  # Calculated sleep duration
    quality = Column(String, nullable=True)  # poor, fair, good, excellent
    notes = Column(String, nullable=True)  # Optional notes
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="sleep_logs")
