from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List
from db import get_db
from auth.routes import get_current_user
from auth.models import User
from .models import MoodLog
from .schemas import MoodCreate, MoodResponse
import os
from groq import Groq

router = APIRouter(prefix="/mind", tags=["Mindfulness"])


def get_groq_client():
    """Get Groq client for AI therapy responses"""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY environment variable not set")
    return Groq(api_key=api_key)


@router.post("/log-mood", response_model=MoodResponse)
async def log_mood(
    mood_data: MoodCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Log a mood entry for the user"""
    mood_log = MoodLog(
        user_id=current_user.id,
        mood=mood_data.mood,
        intensity=mood_data.intensity,
        note=mood_data.note
    )
    
    db.add(mood_log)
    db.commit()
    db.refresh(mood_log)
    
    return mood_log


@router.get("/mood-logs", response_model=List[MoodResponse])
async def get_mood_logs(
    limit: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's mood log history"""
    logs = db.query(MoodLog).filter(
        MoodLog.user_id == current_user.id
    ).order_by(desc(MoodLog.created_at)).limit(limit).all()
    
    return logs


@router.post("/chat")
async def ai_therapy_chat(
    message: dict,
    current_user: User = Depends(get_current_user)
):
    """
    AI therapist chat - empathetic, supportive responses
    NOT diagnostic - only supportive and calming
    """
    user_message = message.get("message", "")
    
    if not user_message:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message is required"
        )
    
    try:
        client = get_groq_client()
        
        system_prompt = """You are a calm, empathetic AI mindfulness companion and supportive listener. 
Your role is to:
- Provide emotional support and validation
- Suggest mindfulness techniques (breathing, grounding, etc.)
- Encourage self-compassion and positive thinking
- Be warm, non-judgmental, and calming

You are NOT:
- A licensed therapist or medical professional
- Providing medical diagnosis or treatment
- A replacement for professional mental health care

Keep responses concise (2-3 sentences), warm, and actionable. 
If someone mentions severe distress, gently suggest professional help."""

        response = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            model="llama-3.1-8b-instant",
            temperature=0.8,
            max_tokens=200
        )
        
        ai_response = response.choices[0].message.content
        
        return {
            "response": ai_response,
            "timestamp": "now"
        }
        
    except Exception as e:
        # Fallback response if AI fails
        return {
            "response": "I'm here to listen. It sounds like you're going through something difficult. Remember to breathe deeply and be kind to yourself. Would a short breathing exercise help?",
            "timestamp": "now",
            "fallback": True
        }


@router.get("/mindfulness-exercises")
async def get_exercises():
    """Get list of guided mindfulness exercises"""
    exercises = [
        {
            "id": 1,
            "title": "4-7-8 Breathing",
            "duration": "5 min",
            "type": "breathing",
            "description": "Calm your nervous system with rhythmic breathing",
            "icon": "🫁"
        },
        {
            "id": 2,
            "title": "Body Scan Meditation",
            "duration": "10 min",
            "type": "meditation",
            "description": "Release tension by scanning through your body",
            "icon": "🧘"
        },
        {
            "id": 3,
            "title": "5-4-3-2-1 Grounding",
            "duration": "3 min",
            "type": "grounding",
            "description": "Ground yourself in the present moment",
            "icon": "🌿"
        },
        {
            "id": 4,
            "title": "Gratitude Practice",
            "duration": "5 min",
            "type": "gratitude",
            "description": "Reflect on things you're grateful for today",
            "icon": "🙏"
        },
        {
            "id": 5,
            "title": "Progressive Muscle Relaxation",
            "duration": "8 min",
            "type": "relaxation",
            "description": "Systematically relax all muscle groups",
            "icon": "💆"
        }
    ]
    
    return exercises


# Register RAG retriever routes
from .retriever import register_mind_retriever_routes
register_mind_retriever_routes(router)
