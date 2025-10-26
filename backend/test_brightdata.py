"""
Test Bright Data Web Scraper API integration
"""
from rag.brightdata_client import BrightDataClient
import logging

# Enable debug logging
logging.basicConfig(level=logging.INFO)

def test_brightdata():
    print("Testing Bright Data Web Scraper API...\n")
    
    try:
        client = BrightDataClient()
        print(f"✓ Client initialized")
        print(f"  Mode: {client.mode}")
        print(f"  API Key (first 20 chars): {client.api_key[:20]}...")
        print()
        
        # Test search
        query = "anxiety relief techniques"
        print(f"Searching for: '{query}'")
        results = client.search(query)
        
        print(f"\n✓ Retrieved {len(results)} results:\n")
        for i, result in enumerate(results, 1):
            print(f"{i}. {result['title']}")
            print(f"   URL: {result['url']}")
            print(f"   Text: {result['text'][:100]}...")
            print()
        
        if results:
            print("✓ Bright Data integration working!")
        else:
            print("⚠ No results returned - check logs above")
            
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_brightdata()
