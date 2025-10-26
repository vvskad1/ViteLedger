from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import logging
import os

from db import get_db
from schemas import CaretakerCreate, CaretakerResponse
from status.models import Caretaker
from auth.models import User
from auth.routes import get_current_user
from rag.store import get_store
from caretaker.knowledge_base import APPLICATION_KNOWLEDGE
from groq import Groq

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/caretaker", tags=["caretaker"])

@router.get("/", response_model=List[CaretakerResponse])
async def get_caretakers(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all caretakers for current user"""
    caretakers = db.query(Caretaker).filter(
        Caretaker.user_id == current_user.id
    ).all()
    return caretakers

@router.post("/", response_model=CaretakerResponse, status_code=status.HTTP_201_CREATED)
async def add_caretaker(
    caretaker_data: CaretakerCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a new caretaker/emergency contact"""
    caretaker = Caretaker(
        user_id=current_user.id,
        name=caretaker_data.name,
        relationship_type=caretaker_data.relationship_type,
        phone=caretaker_data.phone,
        email=caretaker_data.email,
        share_on_recovery=caretaker_data.share_on_recovery
    )
    
    db.add(caretaker)
    db.commit()
    db.refresh(caretaker)
    
    print(f"✅ Emergency contact added: {caretaker.name} ({caretaker.relationship_type})")
    
    return caretaker

@router.put("/{caretaker_id}", response_model=CaretakerResponse)
async def update_caretaker(
    caretaker_id: int,
    caretaker_data: CaretakerCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a caretaker"""
    caretaker = db.query(Caretaker).filter(
        Caretaker.id == caretaker_id,
        Caretaker.user_id == current_user.id
    ).first()
    
    if not caretaker:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Caretaker not found"
        )
    
    caretaker.name = caretaker_data.name
    caretaker.relationship_type = caretaker_data.relationship_type
    caretaker.phone = caretaker_data.phone
    caretaker.email = caretaker_data.email
    caretaker.share_on_recovery = caretaker_data.share_on_recovery
    
    db.commit()
    db.refresh(caretaker)
    
    return caretaker

@router.delete("/{caretaker_id}")
async def delete_caretaker(
    caretaker_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a caretaker"""
    caretaker = db.query(Caretaker).filter(
        Caretaker.id == caretaker_id,
        Caretaker.user_id == current_user.id
    ).first()
    
    if not caretaker:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Caretaker not found"
        )
    
    db.delete(caretaker)
    db.commit()
    
    return {"message": "Caretaker deleted successfully"}


# ========== CARETAKER AI ASSISTANT ==========

def get_groq_client():
    """Get Groq client for AI responses"""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY not set")
    return Groq(api_key=api_key)


def index_knowledge_base():
    """Index the application knowledge base into ChromaDB"""
    try:
        store = get_store()
        
        # Split knowledge base into chunks
        chunks = APPLICATION_KNOWLEDGE.split('\n\n')
        clean_chunks = [chunk.strip() for chunk in chunks if chunk.strip() and len(chunk.strip()) > 50]
        
        # Index into caretaker collection
        if clean_chunks:
            store.embed_texts("caretaker", clean_chunks)
            logger.info(f"Indexed {len(clean_chunks)} knowledge base chunks")
            return True
        return False
    except Exception as e:
        logger.error(f"Failed to index knowledge base: {e}")
        return False


@router.post("/assistant/chat")
async def caretaker_chat(
    payload: dict,
    current_user: User = Depends(get_current_user)
):
    """
    CareTaker AI Assistant - answers questions about VitalEdger application.
    """
    message = payload.get("message", "")
    
    if not message or len(message.strip().split()) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message must be at least 2 words"
        )
    
    try:
        # Ensure knowledge base is indexed (idempotent)
        index_knowledge_base()
        
        # Retrieve relevant context from knowledge base
        store = get_store()
        docs = store.retrieve("caretaker", message, top_k=3)
        
        # Build context from retrieved documents
        context = "\n\n".join([doc.get("text", "") for doc in docs]) if docs else APPLICATION_KNOWLEDGE[:3000]
        
        # Generate response using Groq
        system_prompt = """You are CareTaker, a helpful AI assistant for the VitalEdger health management application.
Your role is to help users understand features, navigate the app, and answer questions about functionality.

Be friendly, concise, and informative. Use the provided context to give accurate answers.
If asked about features not in the context, politely say you don't have that information.
Always maintain a helpful and professional tone.

IMPORTANT: Do NOT reveal any technical implementation details such as:
- AI models, APIs, or frameworks being used
- Database structures or backend technologies
- Third-party services or integrations
- Technical architecture or code details
Focus only on user-facing features and how to use the application."""

        full_prompt = f"""Based on this VitalEdger application documentation:

{context}

User question: {message}

Provide a clear, helpful response about the VitalEdger application. Include specific feature names and how to use them when relevant."""

        client = get_groq_client()
        response = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": full_prompt}
            ],
            model="llama-3.1-8b-instant",
            temperature=0.5,
            max_tokens=400
        )
        
        return {
            "response": response.choices[0].message.content,
            "context_used": len(docs) > 0
        }
        
    except Exception as e:
        logger.error(f"CareTaker AI failed: {e}")
        return {
            "response": "I'm CareTaker, your VitalEdger assistant! I can help you with questions about the app's features, navigation, and how to use different modules. What would you like to know?",
            "context_used": False,
            "fallback": True
        }


@router.post("/assistant/index")
async def reindex_knowledge_base(
    current_user: User = Depends(get_current_user)
):
    """
    Manually trigger re-indexing of knowledge base (admin function)
    """
    try:
        success = index_knowledge_base()
        return {
            "success": success,
            "message": "Knowledge base indexed successfully" if success else "Indexing failed"
        }
    except Exception as e:
        logger.error(f"Re-indexing failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
