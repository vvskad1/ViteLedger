from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class MoodCreate(BaseModel):
    mood: str
    intensity: float
    note: Optional[str] = None


class MoodResponse(BaseModel):
    id: int
    user_id: int
    mood: str
    intensity: float
    note: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True
