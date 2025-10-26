from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from db import Base

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    appointment_type = Column(String, nullable=False)  # lab_test, doctor_visit, checkup, scan, etc.
    appointment_datetime = Column(DateTime, nullable=False)
    location = Column(String, nullable=True)
    doctor_name = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    is_completed = Column(Boolean, default=False)
    reminder_sent = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="appointments")
