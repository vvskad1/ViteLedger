from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from db import Base

class RecoveryStatus(Base):
    __tablename__ = "recovery_status"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_active = Column(Boolean, default=False)
    reason = Column(String, nullable=True)
    temperature = Column(String, nullable=True)
    
    # Enhanced recovery fields
    has_fracture = Column(Boolean, default=False)
    fracture_details = Column(String, nullable=True)
    recent_surgery = Column(Boolean, default=False)
    surgery_details = Column(String, nullable=True)
    injury_type = Column(String, nullable=True)
    recovery_notes = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="recovery_status")


class Caretaker(Base):
    __tablename__ = "caretakers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    relationship_type = Column(String, nullable=False)  # e.g., "Family", "Friend", "Doctor"
    phone = Column(String, nullable=False)
    email = Column(String, nullable=False)
    share_on_recovery = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="caretakers")
