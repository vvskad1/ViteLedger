"""
Simple test script to verify Bright Data Web Unlocker API
"""
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(__file__))

# Disable telemetry first
os.environ["ANONYMIZED_TELEMETRY"] = "False"

from rag.brightdata_unlocker import BrightDataClient
import logging

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(levelname)s: %(message)s'
)

def test_brightdata():
    print("="*60)
    print("BRIGHT DATA SERP API TEST")
    print("="*60)
    
    try:
        # Initialize client
        print("\n1. Initializing Bright Data SERP API client...")
        client = BrightDataClient()
        print(f"   Mode: {client.mode}")
        print(f"   API Key configured: {'Yes' if client.api_key and client.api_key != 'your_api_key_here' else 'No (using fallback)'}")
        print(f"   SERP URL: {client.serp_url}")
        
        # Test search
        test_query = "stress management techniques"
        print(f"\n2. Testing search query: '{test_query}'")
        print("   Will fetch structured Google results from Bright Data SERP API...")
        
        results = client.search(test_query)
        
        print(f"\n3. RESULTS ({len(results)} found):")
        print("-"*60)
        
        if results:
            for i, result in enumerate(results, 1):
                print(f"\n   Result {i}:")
                print(f"   Title: {result['title']}")
                print(f"   URL:   {result['url']}")
                text_preview = result['text'][:100] if result['text'] else 'No text'
                print(f"   Text:  {text_preview}...")
        
        print("\n" + "="*60)
        if results:
            # Check if it's fallback data
            is_fallback = any('headspace.com' in r['url'] or 'acsm.org' in r['url'] for r in results)
            if is_fallback:
                print("STATUS: Using FALLBACK data (Bright Data SERP API key not configured or failed)")
            else:
                print("STATUS: Real data from Bright Data SERP API!")
        else:
            print("STATUS: No results returned")
        print("="*60)
        
    except Exception as e:
        print(f"\nERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_brightdata()
