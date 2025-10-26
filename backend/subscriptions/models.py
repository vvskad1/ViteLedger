from sqlalchemy import Column, Integer, String, DateTime, Index, Boolean
from datetime import datetime
from db import Base

class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, unique=True, index=True, nullable=False)
    plan = Column(String, nullable=False)  # basic|plus|pro
    period = Column(String, nullable=False)  # weekly|monthly|yearly
    status = Column(String, nullable=False, default="inactive")  # inactive|trial|active|past_due|canceled|expired
    is_trial = Column(Boolean, default=False)  # Whether user is in trial period
    trial_ends_at = Column(DateTime, nullable=True)  # When trial ends
    started_at = Column(DateTime, nullable=True)
    ends_at = Column(DateTime, nullable=True)
    provider = Column(String, nullable=False)  # MOCK|LAVA
    provider_ref = Column(String, nullable=True)  # subscription id at provider
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index('idx_provider_ref', 'provider_ref'),
    )
