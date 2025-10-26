"""
RAG pipeline orchestration: fetching, caching, and prompt assembly.
"""
import os
import logging
from typing import List, Dict, Literal
from rag.brightdata_unlocker import BrightDataClient
from rag.store import get_store

logger = logging.getLogger(__name__)

def fetch_external_knowledge(
    scope: Literal["mind", "fitness"], 
    query: str,
    use_web: bool = True
) -> List[Dict]:
    """
    Fetch external knowledge for a query.
    
    Flow:
    1. Check cache (24h TTL)
    2. If fresh cache exists, return it
    3. Otherwise, fetch from Bright Data
    4. Cache and index new results
    5. Return docs
    
    Args:
        scope: 'mind' or 'fitness'
        query: user query
        use_web: if False, only return cached/vector results
        
    Returns:
        List of {title, url, text} dicts
    """
    if not query or not query.strip():
        return []
    
    try:
        store = get_store()
    except Exception as e:
        logger.error(f"Failed to initialize RAG store: {e}")
        return []
    
    # Check cache first
    try:
        cached_docs = store.get_cached_results(scope, query, ttl_hours=24)
        if cached_docs:
            logger.info(f"Using cached results for {scope}:{query}")
            return cached_docs
    except Exception as e:
        logger.warning(f"Cache retrieval failed: {e}")
    
    # Try semantic retrieval from previously indexed docs
    try:
        vector_docs = store.retrieve(scope, query, top_k=int(os.getenv("RAG_TOP_K", "4")))
    except Exception as e:
        logger.warning(f"Vector retrieval failed: {e}")
        vector_docs = []
    
    if not use_web:
        logger.info(f"Web disabled, returning {len(vector_docs)} vector results")
        return vector_docs
    
    # Fetch fresh data from Bright Data
    try:
        client = BrightDataClient()
        fresh_docs = client.search(query)
        
        if fresh_docs:
            # Cache and index
            try:
                store.cache_and_index(scope, query, fresh_docs)
                logger.info(f"Fetched and cached {len(fresh_docs)} fresh docs")
            except Exception as cache_error:
                logger.warning(f"Failed to cache results: {cache_error}")
            return fresh_docs
        else:
            logger.warning(f"No results from Bright Data for {scope}:{query}")
            # Fallback to vector search
            return vector_docs
            
    except ValueError as ve:
        # API key missing or configuration error
        logger.error(f"Bright Data configuration error: {ve}")
        return vector_docs
    except Exception as e:
        logger.error(f"Bright Data fetch failed: {e}")
        # Fallback to vector search
        return vector_docs


def assemble_prompt(
    scope: Literal["mind", "fitness"],
    user_text: str,
    docs: List[Dict],
    max_context_tokens: int = 1500
) -> Dict[str, str]:
    """
    Assemble a prompt with retrieved context.
    
    Args:
        scope: 'mind' or 'fitness'
        user_text: user's message/query
        docs: retrieved documents
        max_context_tokens: approximate token limit for context (rough: ~4 chars = 1 token)
        
    Returns:
        {
            "system_prompt": str,
            "context": str,
            "user_text": str
        }
    """
    # System prompts
    if scope == "mind":
        system_prompt = """You are a licensed therapist with expertise in cognitive-behavioral therapy and mindfulness-based stress reduction. 
Provide professional, evidence-based mental health guidance. Be direct, supportive, and solution-focused. 
Use the research sources to recommend specific therapeutic techniques and exercises. 
Avoid being overly sympathetic - instead, validate their experience briefly and focus on actionable strategies."""
    else:  # fitness
        system_prompt = """You are an experienced personal trainer and exercise physiologist.
Provide professional, science-backed fitness guidance and workout recommendations.
Use the research sources to support your advice with current best practices.
Be direct, motivating, and focus on practical action steps."""
    
    # Build context from docs
    context_parts = []
    total_chars = 0
    max_chars = max_context_tokens * 4  # rough estimate
    
    for i, doc in enumerate(docs[:int(os.getenv("RAG_TOP_K", "4"))], 1):
        title = doc.get("title", "Source")
        text = doc.get("text", "")
        url = doc.get("url", "")
        
        # Truncate text if needed
        remaining = max_chars - total_chars
        if remaining <= 0:
            break
        
        snippet = text[:min(len(text), remaining, 800)]  # max 800 chars per source
        
        context_parts.append(f"[{i}] {title}\n{snippet}\nSource: {url}\n")
        total_chars += len(context_parts[-1])
    
    context = "\n".join(context_parts) if context_parts else "No additional sources available."
    
    return {
        "system_prompt": system_prompt,
        "context": context,
        "user_text": user_text
    }


def format_response_with_sources(response_text: str, docs: List[Dict]) -> Dict:
    """
    Format AI response with source citations.
    
    Returns:
        {
            "response": str,
            "sources": List[{title, url}]
        }
    """
    sources = []
    for doc in docs[:3]:  # top 3 sources
        sources.append({
            "title": doc.get("title", "Untitled"),
            "url": doc.get("url", "")
        })
    
    return {
        "response": response_text,
        "sources": sources
    }
