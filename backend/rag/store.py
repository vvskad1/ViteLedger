"""
Storage layer for RAG: SQLite caching + Chroma vector store.
Handles embeddings, caching, and semantic retrieval.
"""
import os

# Disable ChromaDB telemetry BEFORE any other imports
os.environ["ANONYMIZED_TELEMETRY"] = "False"

import hashlib
import json
from datetime import datetime, timedelta
from typing import List, Dict, Literal
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime
from db import Base  # Use the shared Base
from sqlalchemy.orm import sessionmaker
import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
import logging

logger = logging.getLogger(__name__)


class WebCache(Base):
    """SQLite table for caching web search results."""
    __tablename__ = "web_cache"
    
    id = Column(Integer, primary_key=True, index=True)
    scope = Column(String, index=True)  # 'mind' or 'fitness'
    query = Column(String, index=True)
    hash = Column(String, unique=True, index=True)
    result_json = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)


class RAGStore:
    """Handles embeddings, caching, and vector retrieval."""
    
    def __init__(self):
        # SQLite for caching - use existing engine from db.py
        from db import engine
        self.engine = engine
        self.SessionLocal = sessionmaker(bind=self.engine)
        
        # Sentence transformer for embeddings
        embed_model = os.getenv("RAG_EMBED_MODEL", "all-MiniLM-L6-v2")
        self.embedder = SentenceTransformer(embed_model)
        
        # Chroma for vector search
        chroma_dir = os.path.join(os.path.dirname(__file__), "..", "chroma_db")
        os.makedirs(chroma_dir, exist_ok=True)
        
        self.chroma_client = chromadb.PersistentClient(
            path=chroma_dir,
            settings=Settings(anonymized_telemetry=False)
        )
        
        # Create collections for each scope
        self.mind_collection = self.chroma_client.get_or_create_collection(
            name="mind_collection",
            metadata={"hnsw:space": "cosine"}
        )
        
        self.fitness_collection = self.chroma_client.get_or_create_collection(
            name="fitness_collection",
            metadata={"hnsw:space": "cosine"}
        )
    
    def _get_collection(self, scope: Literal["mind", "fitness"]):
        """Get the appropriate Chroma collection."""
        return self.mind_collection if scope == "mind" else self.fitness_collection
    
    def _compute_hash(self, scope: str, query: str) -> str:
        """Compute hash for cache key."""
        key = f"{scope}:{query.lower().strip()}"
        return hashlib.md5(key.encode()).hexdigest()
    
    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        """
        Embed texts using sentence-transformers.
        Returns list of embedding vectors.
        """
        if not texts:
            return []
        
        try:
            embeddings = self.embedder.encode(texts, convert_to_numpy=True)
            return embeddings.tolist()
        except Exception as e:
            logger.error(f"Embedding failed: {e}")
            return []
    
    def get_cached_results(self, scope: str, query: str, ttl_hours: int = 24) -> List[Dict]:
        """
        Check if cached results exist and are fresh.
        Returns cached docs or empty list.
        """
        cache_hash = self._compute_hash(scope, query)
        
        db = self.SessionLocal()
        try:
            cache_entry = db.query(WebCache).filter(
                WebCache.hash == cache_hash
            ).first()
            
            if not cache_entry:
                return []
            
            # Check TTL
            age = datetime.utcnow() - cache_entry.created_at
            if age > timedelta(hours=ttl_hours):
                logger.info(f"Cache expired for {scope}:{query}")
                return []
            
            # Parse and return
            docs = json.loads(cache_entry.result_json)
            logger.info(f"Cache hit for {scope}:{query} ({len(docs)} docs)")
            return docs
            
        except Exception as e:
            logger.error(f"Cache retrieval failed: {e}")
            return []
        finally:
            db.close()
    
    def cache_and_index(self, scope: Literal["mind", "fitness"], query: str, docs: List[Dict]):
        """
        Cache results in SQLite and index in Chroma for vector search.
        
        Args:
            scope: 'mind' or 'fitness'
            query: original search query
            docs: list of {title, url, text} dicts
        """
        if not docs:
            return
        
        cache_hash = self._compute_hash(scope, query)
        
        # Store in SQLite cache
        db = self.SessionLocal()
        try:
            # Delete old entry if exists
            db.query(WebCache).filter(WebCache.hash == cache_hash).delete()
            
            # Create new entry
            cache_entry = WebCache(
                scope=scope,
                query=query,
                hash=cache_hash,
                result_json=json.dumps(docs),
                created_at=datetime.utcnow()
            )
            db.add(cache_entry)
            db.commit()
            logger.info(f"Cached {len(docs)} docs for {scope}:{query}")
            
        except Exception as e:
            logger.error(f"Cache storage failed: {e}")
            db.rollback()
        finally:
            db.close()
        
        # Index in Chroma
        try:
            collection = self._get_collection(scope)
            
            # Prepare data for indexing
            texts = [doc.get("text", "")[:1200] for doc in docs]
            embeddings = self.embed_texts(texts)
            
            if not embeddings:
                logger.warning("No embeddings generated, skipping Chroma indexing")
                return
            
            # Create unique IDs
            ids = [f"{scope}_{cache_hash}_{i}" for i in range(len(docs))]
            
            # Metadata
            metadatas = [
                {
                    "title": doc.get("title", "")[:200],
                    "url": doc.get("url", "")[:500],
                    "scope": scope,
                    "query": query[:200]
                }
                for doc in docs
            ]
            
            # Upsert to collection
            collection.upsert(
                ids=ids,
                embeddings=embeddings,
                metadatas=metadatas,
                documents=texts
            )
            
            logger.info(f"Indexed {len(docs)} docs in Chroma for {scope}")
            
        except Exception as e:
            logger.error(f"Chroma indexing failed: {e}")
    
    def retrieve(self, scope: Literal["mind", "fitness"], query: str, top_k: int = 4) -> List[Dict]:
        """
        Semantic retrieval from Chroma vector store.
        
        Args:
            scope: 'mind' or 'fitness'
            query: user query for semantic search
            top_k: number of results to return
            
        Returns:
            List of {title, url, text} dicts
        """
        try:
            collection = self._get_collection(scope)
            
            # Embed query
            query_embedding = self.embed_texts([query])
            if not query_embedding:
                return []
            
            # Query Chroma
            results = collection.query(
                query_embeddings=query_embedding,
                n_results=top_k,
                where={"scope": scope}
            )
            
            # Parse results
            docs = []
            if results and results.get("documents") and results["documents"][0]:
                for i in range(len(results["documents"][0])):
                    metadata = results["metadatas"][0][i] if results.get("metadatas") else {}
                    docs.append({
                        "title": metadata.get("title", "Untitled"),
                        "url": metadata.get("url", ""),
                        "text": results["documents"][0][i]
                    })
            
            logger.info(f"Retrieved {len(docs)} docs from Chroma for {scope}:{query}")
            return docs
            
        except Exception as e:
            logger.error(f"Chroma retrieval failed: {e}")
            return []


# Singleton instance
_store = None

def get_store() -> RAGStore:
    """Get or create RAGStore singleton."""
    global _store
    if _store is None:
        _store = RAGStore()
    return _store
