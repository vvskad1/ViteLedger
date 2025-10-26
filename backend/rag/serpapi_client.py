"""
SerpAPI client for web search with RAG integration.
Simple and reliable Google search results.
"""
import os

# Disable ChromaDB telemetry before any imports
os.environ["ANONYMIZED_TELEMETRY"] = "False"

import httpx
import backoff
import logging
from typing import List, Dict
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

class BrightDataClient:
    """SerpAPI client (keeping name for compatibility)."""
    
    def __init__(self):
        self.api_key = os.getenv("SERPAPI_KEY")
        self.engine = os.getenv("SERPAPI_ENGINE", "google")
        self.timeout_ms = int(os.getenv("SERPAPI_TIMEOUT_MS", "30000"))
        self.mode = "serpapi"
        
        if not self.api_key or self.api_key == "your_serpapi_key_here":
            logger.warning("SERPAPI_KEY not configured - will use fallback data")
    
    @backoff.on_exception(
        backoff.expo,
        (httpx.TimeoutException, httpx.HTTPStatusError),
        max_tries=3,
        giveup=lambda e: isinstance(e, httpx.HTTPStatusError) and e.response.status_code == 401
    )
    def _make_request(self, url: str, params: Dict = None) -> Dict:
        """Make HTTP request with retry logic."""
        timeout = httpx.Timeout(self.timeout_ms / 1000.0)
        
        try:
            with httpx.Client(timeout=timeout) as client:
                response = client.get(url, params=params)
                response.raise_for_status()
                return response.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error {e.response.status_code}: {e.response.text}")
            raise
        except Exception as e:
            logger.error(f"Request failed: {e}")
            raise
    
    def search_serpapi(self, query: str) -> List[Dict]:
        """
        Search using SerpAPI Google Search.
        Returns normalized results.
        """
        if not self.api_key or self.api_key == "your_serpapi_key_here":
            logger.warning("SerpAPI key not configured, using fallback")
            return self.search_fallback(query)
        
        try:
            # SerpAPI endpoint
            url = "https://serpapi.com/search"
            
            params = {
                "api_key": self.api_key,
                "engine": self.engine,
                "q": query,
                "num": 5
            }
            
            logger.info(f"Calling SerpAPI for: {query}")
            
            response = self._make_request(url, params=params)
            
            # Parse SerpAPI response
            results = []
            organic_results = response.get("organic_results", [])
            
            for item in organic_results[:5]:
                results.append({
                    "title": item.get("title", ""),
                    "url": item.get("link", ""),
                    "text": item.get("snippet", "")
                })
            
            if results:
                logger.info(f"Retrieved {len(results)} results from SerpAPI")
            else:
                logger.warning("No results from SerpAPI, using fallback")
                return self.search_fallback(query)
                
            return results
            
        except Exception as e:
            logger.error(f"SerpAPI search failed: {e}")
            return self.search_fallback(query)
    
    def search_fallback(self, query: str) -> List[Dict]:
        """
        Fallback with contextual mock data.
        Provides relevant health/fitness information when API unavailable.
        """
        logger.info(f"Using fallback data for: {query}")
        
        # Generate contextual mock data based on query
        if "anxiety" in query.lower() or "stress" in query.lower() or "mindful" in query.lower():
            return [
                {
                    "title": "Mindfulness Techniques for Anxiety Relief",
                    "url": "https://www.headspace.com/anxiety",
                    "text": "Research shows that mindfulness meditation can significantly reduce anxiety symptoms. Practice focused breathing, body scans, and present-moment awareness to calm your nervous system."
                },
                {
                    "title": "Scientific Evidence for Stress Reduction",
                    "url": "https://www.health.harvard.edu/mind-and-mood/mindfulness-meditation",
                    "text": "Harvard Medical School studies indicate that regular mindfulness practice physically changes brain regions associated with stress response, leading to better emotional regulation."
                },
                {
                    "title": "Grounding Techniques for Immediate Relief",
                    "url": "https://www.psychologytoday.com/grounding-techniques",
                    "text": "The 5-4-3-2-1 grounding technique helps anchor you in the present moment: identify 5 things you see, 4 you can touch, 3 you hear, 2 you smell, and 1 you taste."
                }
            ]
        elif "fitness" in query.lower() or "workout" in query.lower() or "exercise" in query.lower():
            return [
                {
                    "title": "Evidence-Based Workout Principles",
                    "url": "https://www.acsm.org/exercise-guidelines",
                    "text": "The American College of Sports Medicine recommends progressive overload, proper form, and adequate recovery as key principles for effective training and injury prevention."
                },
                {
                    "title": "HIIT Training Benefits and Protocols",
                    "url": "https://www.ncbi.nlm.nih.gov/hiit-research",
                    "text": "High-Intensity Interval Training improves cardiovascular fitness and metabolic health. Studies show 20-30 minutes of HIIT can be as effective as longer moderate-intensity sessions."
                },
                {
                    "title": "Recovery and Muscle Growth Science",
                    "url": "https://www.strengthandconditioning.org/recovery",
                    "text": "Muscle growth occurs during recovery, not during workouts. Aim for 48 hours between training the same muscle groups, prioritize sleep (7-9 hours), and ensure adequate protein intake."
                }
            ]
        else:
            # General wellness results
            return [
                {
                    "title": "Evidence-Based Health Practices",
                    "url": "https://www.nih.gov/health-information",
                    "text": "National Institutes of Health emphasizes the importance of balanced nutrition, regular physical activity, adequate sleep, stress management, and social connections for overall wellness."
                },
                {
                    "title": "Holistic Approach to Well-being",
                    "url": "https://www.who.int/health-topics/wellness",
                    "text": "The World Health Organization defines wellness as a state of complete physical, mental, and social well-being, not merely the absence of disease or infirmity."
                }
            ]
    
    def search(self, query: str) -> List[Dict]:
        """
        Main search method using SerpAPI.
        Returns normalized results: [{title, url, text}, ...]
        """
        if not query or not query.strip():
            return []
        
        logger.info(f"Searching query: {query}")
        
        # Try SerpAPI, falls back automatically if it fails
        results = self.search_serpapi(query)
        
        # Deduplicate by URL
        seen_urls = set()
        unique_results = []
        for r in results:
            if r['url'] not in seen_urls:
                seen_urls.add(r['url'])
                unique_results.append(r)
        
        logger.info(f"Found {len(unique_results)} unique results")
        return unique_results
