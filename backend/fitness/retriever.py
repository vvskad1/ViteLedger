"""
Fitness retriever: RAG endpoints for fitness module.
"""
from fastapi import Depends, HTTPException, status
from auth.routes import get_current_user
from auth.models import User
from rag.pipeline import fetch_external_knowledge, assemble_prompt, format_response_with_sources
import logging
from groq import Groq
import os

logger = logging.getLogger(__name__)


def get_groq_client():
    """Get Groq client for AI responses"""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY not set")
    return Groq(api_key=api_key)


def naive_coach_reply(prompt_data: dict) -> str:
    """
    Generate fitness coach reply using Groq with RAG context.
    References retrieved sources with practical advice.
    """
    system_prompt = prompt_data["system_prompt"]
    context = prompt_data["context"]
    user_text = prompt_data["user_text"]
    
    # Build full prompt
    full_prompt = f"""Based on these fitness sources:

{context}

User query: {user_text}

Provide a motivating, science-backed fitness response that:
1. Addresses their specific question/concern
2. References 1-2 key insights from the sources above
3. Gives actionable workout or technique recommendations
4. Stays concise (3-4 sentences)"""
    
    try:
        client = get_groq_client()
        response = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": full_prompt}
            ],
            model="llama-3.1-8b-instant",
            temperature=0.7,
            max_tokens=250
        )
        
        return response.choices[0].message.content
        
    except Exception as e:
        logger.error(f"Groq API failed: {e}")
        return "Great question! Focus on proper form, progressive overload, and adequate recovery. Remember: consistency beats intensity. Start where you are and build gradually!"


def register_fitness_retriever_routes(router):
    """Register RAG endpoints to existing Fitness router."""
    
    @router.post("/search")
    async def fitness_search(
        payload: dict,
        current_user: User = Depends(get_current_user)
    ):
        """
        Search for fitness/workout/training information from web sources.
        """
        query = payload.get("query", "")
        
        if not query or len(query.strip()) < 3:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Query must be at least 3 characters"
            )
        
        try:
            docs = fetch_external_knowledge("fitness", query, use_web=True)
            
            return {
                "results": docs[:5],
                "count": len(docs)
            }
            
        except Exception as e:
            logger.error(f"Fitness search failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Search failed. Please try again."
            )
    
    @router.post("/advice")
    async def fitness_advice(
        payload: dict,
        current_user: User = Depends(get_current_user)
    ):
        """
        Get AI fitness coaching advice with web knowledge integration.
        """
        message = payload.get("message", "")
        use_web = payload.get("useWeb", True)
        
        # Validate message has at least 3 words
        word_count = len(message.strip().split())
        if not message or word_count < 3:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Message must be at least 3 words"
            )
        
        try:
            # Fetch relevant sources (will gracefully fallback if Bright Data unavailable)
            docs = []
            try:
                docs = fetch_external_knowledge("fitness", message, use_web=use_web)
            except Exception as fetch_error:
                logger.warning(f"Web knowledge fetch failed, continuing without sources: {fetch_error}")
                docs = []
            
            # Assemble prompt with context
            prompt_data = assemble_prompt("fitness", message, docs)
            
            # Generate response
            reply = naive_coach_reply(prompt_data)
            
            # Format with sources
            result = format_response_with_sources(reply, docs)
            
            return result
            
        except ValueError as e:
            # Likely API key missing - provide helpful message
            logger.error(f"Configuration error: {e}")
            # Fall back to basic response without web sources
            try:
                from groq import Groq
                import os
                client = Groq(api_key=os.getenv("GROQ_API_KEY"))
                response = client.chat.completions.create(
                    messages=[
                        {"role": "system", "content": "You are an expert fitness coach."},
                        {"role": "user", "content": message}
                    ],
                    model="llama-3.1-8b-instant",
                    temperature=0.7,
                    max_tokens=200
                )
                return {
                    "response": response.choices[0].message.content,
                    "sources": [],
                    "note": "Web sources unavailable"
                }
            except:
                pass
            
            return {
                "response": "Focus on progressive overload, proper form, and adequate recovery. Stay consistent with your training and nutrition. You've got this!",
                "sources": [],
                "fallback": True
            }
        except Exception as e:
            logger.error(f"Fitness advice failed: {e}")
            # Fallback response
            return {
                "response": "Focus on progressive overload, proper form, and adequate recovery. Stay consistent with your training and nutrition. You've got this!",
                "sources": [],
                "fallback": True
            }
