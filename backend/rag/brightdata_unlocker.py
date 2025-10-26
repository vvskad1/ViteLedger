"""
Bright Data SERP API client for structured search results.
Returns clean, parsed Google search results.
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
    """Bright Data SERP API client."""
    
    def __init__(self):
        self.api_key = os.getenv("BRIGHTDATA_API_KEY")
        self.serp_url = os.getenv("BRIGHTDATA_SERP_URL", "https://api.brightdata.com/request")
        self.zone = os.getenv("BRIGHTDATA_SERP_ZONE", "serp_api1")
        self.timeout_ms = int(os.getenv("BRIGHTDATA_TIMEOUT_MS", "30000"))
        self.mode = "serp_api"
        
        if not self.api_key or self.api_key == "your_api_key_here":
            logger.warning("BRIGHTDATA_API_KEY not configured - will use fallback data")
    
    @backoff.on_exception(
        backoff.expo,
        (httpx.TimeoutException, httpx.HTTPStatusError),
        max_tries=3,
        giveup=lambda e: isinstance(e, httpx.HTTPStatusError) and e.response.status_code in [401, 403]
    )
    def _make_request(self, search_url: str) -> str:
        """Make HTTP request to Bright Data SERP API with retry logic."""
        timeout = httpx.Timeout(self.timeout_ms / 1000.0)
        
        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            # Bright Data SERP request format
            payload = {
                "zone": self.zone,
                "url": search_url,
                "format": "raw"  # Returns raw HTML
            }
            
            logger.info(f"SERP API payload: {payload}")
            
            with httpx.Client(timeout=timeout) as client:
                response = client.post(
                    self.serp_url,
                    headers=headers,
                    json=payload
                )
                response.raise_for_status()
                
                logger.info(f"Response status: {response.status_code}, length: {len(response.text)}")
                
                return response.text
                
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error {e.response.status_code}: {e.response.text}")
            raise
        except Exception as e:
            logger.error(f"Request failed: {e}")
            raise
    
    def _parse_google_results(self, html: str) -> List[Dict]:
        """Parse Google search results from HTML."""
        try:
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(html, 'html.parser')
            results = []
            
            # Find all h3 tags (these are the result titles)
            h3_tags = soup.find_all('h3', limit=10)
            logger.info(f"Found {len(h3_tags)} h3 result titles")
            
            for h3 in h3_tags:
                # Get the parent link
                link_elem = h3.find_parent('a')
                if not link_elem:
                    # Try to find nearby link
                    parent = h3.find_parent('div')
                    if parent:
                        link_elem = parent.find('a', href=True)
                
                if link_elem:
                    title = h3.get_text(strip=True)
                    url = link_elem.get('href', '')
                    
                    # Clean up URL
                    if url.startswith('/url?q='):
                        url = url.split('/url?q=')[1].split('&')[0]
                    
                    # Try to find snippet text - look for sibling or parent divs with text
                    text = ''
                    parent_div = h3.find_parent('div')
                    if parent_div:
                        # Look for divs with substantial text after the h3
                        for sibling in parent_div.find_all('div'):
                            sibling_text = sibling.get_text(strip=True)
                            if len(sibling_text) > 50 and sibling_text != title:
                                text = sibling_text[:300]
                                break
                    
                    # Only add valid HTTP(S) URLs
                    if url and url.startswith('http'):
                        results.append({
                            'title': title,
                            'url': url,
                            'text': text
                        })
                        logger.info(f"✓ Parsed: {title[:60]}...")
                        
                        if len(results) >= 5:
                            break
            
            return results
            
        except ImportError:
            logger.error("BeautifulSoup not installed")
            return []
        except Exception as e:
            logger.error(f"HTML parsing failed: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    def search_brightdata(self, query: str) -> List[Dict]:
        """
        Search using Bright Data SERP API.
        Returns parsed Google search results.
        """
        if not self.api_key or self.api_key == "your_api_key_here":
            logger.warning("Bright Data API key not configured, using fallback")
            return self.search_fallback(query)
        
        try:
            # URL-encode the query
            import urllib.parse
            encoded_query = urllib.parse.quote_plus(query)
            
            # Google search URL with parameters
            search_url = f"https://www.google.com/search?q={encoded_query}&hl=en&gl=us&num=10"
            
            logger.info(f"Calling Bright Data SERP API for: {query}")
            
            # Fetch HTML through Bright Data
            html = self._make_request(search_url)
            
            # Debug: Save HTML to file for inspection
            try:
                with open('debug_google_result.html', 'w', encoding='utf-8') as f:
                    f.write(html)
                logger.info("Saved HTML to debug_google_result.html")
            except:
                pass
            
            # Parse results from HTML
            results = self._parse_google_results(html)
            
            if results:
                logger.info(f"Retrieved {len(results)} results from Bright Data SERP API")
                return results
            else:
                logger.warning("No results parsed from HTML, using fallback")
                return self.search_fallback(query)
            
        except Exception as e:
            logger.error(f"Bright Data SERP search failed: {e}")
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
        Main search method using Bright Data Web Unlocker.
        Returns normalized results: [{title, url, text}, ...]
        """
        if not query or not query.strip():
            return []
        
        logger.info(f"Searching query: {query}")
        
        # Try Bright Data Web Unlocker, falls back automatically if it fails
        results = self.search_brightdata(query)
        
        # Deduplicate by URL
        seen_urls = set()
        unique_results = []
        for r in results:
            if r['url'] not in seen_urls:
                seen_urls.add(r['url'])
                unique_results.append(r)
        
        logger.info(f"Found {len(unique_results)} unique results")
        return unique_results
