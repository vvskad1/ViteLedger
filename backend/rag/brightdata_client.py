"""
SerpAPI client for web search with RAG integration.
Includes retry logic, timeouts, and response normalization.
"""
import os

# Disable ChromaDB telemetry before any imports
os.environ["ANONYMIZED_TELEMETRY"] = "False"

import httpx
import backoff
import logging
import json
from typing import List, Dict
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

class BrightDataClient:
    """SerpAPI client for Google search results."""
    
    def __init__(self):
        self.api_key = os.getenv("SERPAPI_KEY")
        self.engine = os.getenv("SERPAPI_ENGINE", "google")
        self.timeout_ms = int(os.getenv("SERPAPI_TIMEOUT_MS", "30000"))
        self.mode = "serpapi"  # For compatibility
        
        if not self.api_key:
            logger.warning("SERPAPI_KEY not set - will use fallback data")
    
    def _get_headers(self) -> Dict[str, str]:
        """Get headers for SerpAPI requests."""
        return {
            "Content-Type": "application/json"
        }    @backoff.on_exception(
        backoff.expo,
        (httpx.TimeoutException, httpx.HTTPStatusError),
        max_tries=3,
        giveup=lambda e: isinstance(e, httpx.HTTPStatusError) and e.response.status_code < 500
    )
    def _make_request(self, url: str, method: str = "POST", json_data: Dict = None) -> Dict:
        """Make HTTP request with retry logic."""
        timeout = httpx.Timeout(self.timeout_ms / 1000.0)
        
        try:
            with httpx.Client(timeout=timeout, follow_redirects=True) as client:
                if method == "GET":
                    response = client.get(url, headers=self._get_headers())
                else:
                    response = client.post(url, headers=self._get_headers(), json=json_data)
                
                response.raise_for_status()
                return response.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error {e.response.status_code}: {e.response.text}")
            raise
        except Exception as e:
            logger.error(f"Request failed: {e}")
            raise
    
    def search_serp_via_proxy(self, query: str) -> List[Dict]:
        """
        Search using Bright Data SERP API via proxy.
        Uses Google search through Bright Data's proxy network.
        """
        try:
            # Bright Data SERP API endpoint using Web Scraper API
            # Format: https://brd.superproxy.io:22225
            proxy_host = os.getenv("BRIGHTDATA_PROXY_HOST", "brd.superproxy.io")
            proxy_port = os.getenv("BRIGHTDATA_PROXY_PORT", "22225")
            
            # Create proxy URL with authentication
            # Format: http://brd-customer-{customer_id}-zone-{zone}:{password}@brd.superproxy.io:22225
            proxy_url = f"http://{self.api_key}@{proxy_host}:{proxy_port}"
            
            # Use Google search via proxy
            search_url = f"https://www.google.com/search?q={query}&num=10"
            
            timeout = httpx.Timeout(self.timeout_ms / 1000.0)
            proxies = {
                "http://": proxy_url,
                "https://": proxy_url
            }
            
            with httpx.Client(timeout=timeout, proxies=proxies, follow_redirects=True) as client:
                response = client.get(search_url, headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                })
                
                # Parse HTML response (simplified - in production use BeautifulSoup)
                html = response.text
                
                # For now, return mock data since HTML parsing is complex
                # In production, you'd use BeautifulSoup to extract search results
                logger.warning("SERP via proxy returned HTML - needs parsing. Returning empty for now.")
                return []
                
        except Exception as e:
            logger.error(f"SERP proxy search failed: {e}")
            return []
    
    def search_web_scraper(self, query: str) -> List[Dict]:
        """
        Search using Bright Data Web Scraper API with proxy.
        Uses Google search through Bright Data's proxy network.
        """
        try:
            proxy_host = os.getenv("BRIGHTDATA_PROXY_HOST", "brd.superproxy.io")
            proxy_port = os.getenv("BRIGHTDATA_PROXY_PORT", "22225")
            
            # Construct proxy URL with authentication
            # Format: http://{api_key}@{host}:{port}
            proxy_url = f"http://{self.api_key}@{proxy_host}:{proxy_port}"
            
            # Use Google search via Bright Data proxy
            search_url = f"https://www.google.com/search?q={query}&num=10"
            
            timeout = httpx.Timeout(self.timeout_ms / 1000.0)
            
            logger.info(f"Calling Bright Data Web Scraper for: {query}")
            
            # httpx uses 'proxy' not 'proxies' (singular)
            with httpx.Client(timeout=timeout, proxy=proxy_url) as client:
                response = client.get(search_url, headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                })
                
                response.raise_for_status()
                html = response.text
                
                # Parse Google search results from HTML
                results = self._parse_google_html(html)
                
                if results:
                    logger.info(f"Retrieved {len(results)} results from Bright Data Web Scraper")
                    return results
                else:
                    logger.warning("No results parsed from HTML, using fallback")
                    return self.search_serp_fallback(query)
                    
        except Exception as e:
            logger.error(f"Bright Data Web Scraper failed: {e}")
            return self.search_serp_fallback(query)
    
    def _parse_google_html(self, html: str) -> List[Dict]:
        """
        Parse Google search results from HTML.
        Simple extraction - could be enhanced with BeautifulSoup.
        """
        try:
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(html, 'html.parser')
            results = []
            
            # Find organic search results
            for result in soup.select('div.g')[:5]:
                title_elem = result.select_one('h3')
                link_elem = result.select_one('a')
                snippet_elem = result.select_one('div.VwiC3b')
                
                if title_elem and link_elem:
                    results.append({
                        'title': title_elem.get_text(),
                        'url': link_elem.get('href', ''),
                        'text': snippet_elem.get_text() if snippet_elem else ''
                    })
            
            return results
        except ImportError:
            logger.warning("BeautifulSoup not installed, cannot parse HTML. Install with: pip install beautifulsoup4")
            return []
        except Exception as e:
            logger.error(f"HTML parsing failed: {e}")
            return []
    
    def search_serp_fallback(self, query: str) -> List[Dict]:
        """
        Fallback mock data when API is unavailable.
        Returns relevant results for the query.
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
        
        logger.info(f"Searching with SerpAPI, query={query}")
        
        # Try SerpAPI, fallback if it fails
        results = self.search_serpapi(query)
        
        # Deduplicate by URL
        seen_urls = set()
        unique_results = []
        for item in results:
            url = item.get("url", "")
            if url and url not in seen_urls:
                seen_urls.add(url)
                unique_results.append(item)
        
        logger.info(f"Found {len(unique_results)} unique results")
        return unique_results
