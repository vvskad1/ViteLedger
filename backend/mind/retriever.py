"""
Mind retriever: RAG endpoints for mindfulness module.
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


def naive_empathetic_reply(prompt_data: dict) -> str:
    """
    Generate empathetic reply using Groq with RAG context.
    Quotes retrieved sources in a compassionate way.
    """
    system_prompt = prompt_data["system_prompt"]
    context = prompt_data["context"]
    user_text = prompt_data["user_text"]
    
    # Build full prompt
    full_prompt = f"""Context from evidence-based sources:

{context}

Client message: {user_text}

You are a professional therapist. Respond with:
1. Brief acknowledgment of their experience (1 sentence)
2. Specific, actionable insights from the research above - cite techniques by name
3. One practical exercise or strategy they can try right now
4. Keep response conversational, professional, and 4-5 sentences

Do NOT say "I'm sorry" or be overly sympathetic. Be direct, supportive, and solution-focused like a real therapist."""
    
    try:
        client = get_groq_client()
        response = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": full_prompt}
            ],
            model="llama-3.1-8b-instant",
            temperature=0.6,
            max_tokens=300
        )
        
        return response.choices[0].message.content
        
    except Exception as e:
        logger.error(f"Groq API failed: {e}")
        return "I understand you're dealing with stress. Let's focus on what you can control right now. Try this: Take 5 slow breaths - in for 4 counts, hold for 4, out for 6. This activates your parasympathetic nervous system and can reduce cortisol within minutes."


def register_mind_retriever_routes(router):
    """Register RAG endpoints to existing Mind router."""
    
    @router.post("/search")
    async def mind_search(
        payload: dict,
        current_user: User = Depends(get_current_user)
    ):
        """
        Search for mindfulness/mental health information from web sources.
        """
        query = payload.get("query", "")
        
        if not query or len(query.strip()) < 3:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Query must be at least 3 characters"
            )
        
        try:
            docs = fetch_external_knowledge("mind", query, use_web=True)
            
            return {
                "results": docs[:5],
                "count": len(docs)
            }
            
        except Exception as e:
            logger.error(f"Mind search failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Search failed. Please try again."
            )
    
    @router.post("/advice")
    async def mind_advice(
        payload: dict,
        current_user: User = Depends(get_current_user)
    ):
        """
        Get AI mindfulness advice with web knowledge integration.
        """
        message = payload.get("message", "")
        use_web = payload.get("useWeb", True)
        
        # Validate message has at least 3 words
        word_count = len(message.strip().split())
        if not message or word_count < 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Message must be at least 3 words"
            )
        
        try:
            # Fetch relevant sources (will gracefully fallback if Bright Data unavailable)
            docs = []
            
            # Skip web search for very short/simple messages like greetings or thanks
            simple_patterns = ['thank', 'thanks', 'ok', 'okay', 'bye', 'hello', 'hi', 'hey', 'will', 'following']
            is_simple = any(pattern in message.lower().split() for pattern in simple_patterns) and len(message.split()) < 10
            
            if not is_simple and use_web:
                try:
                    docs = fetch_external_knowledge("mind", message, use_web=use_web)
                except Exception as fetch_error:
                    logger.warning(f"Web knowledge fetch failed, continuing without sources: {fetch_error}")
                    docs = []
            else:
                logger.info(f"Skipping web search for simple/short message")
            
            # Assemble prompt with context
            prompt_data = assemble_prompt("mind", message, docs)
            
            # Generate response
            reply = naive_empathetic_reply(prompt_data)
            
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
                        {"role": "system", "content": "You are a calm, empathetic AI mindfulness companion."},
                        {"role": "user", "content": message}
                    ],
                    model="llama-3.1-8b-instant",
                    temperature=0.8,
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
                "response": "I'm here to listen and support you. Take a deep breath, and know that it's okay to feel what you're feeling. Would you like to try a mindfulness exercise?",
                "sources": [],
                "fallback": True
            }
        except Exception as e:
            logger.error(f"Mind advice failed: {e}")
            # Fallback response
            return {
                "response": "I'm here to listen and support you. Take a deep breath, and know that it's okay to feel what you're feeling. Would you like to try a mindfulness exercise?",
                "sources": [],
                "fallback": True
            }
