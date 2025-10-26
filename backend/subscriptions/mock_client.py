import uuid
from datetime import datetime, timedelta

class MockSubs:
    """Development-only fake subscription provider"""
    
    def create_checkout(self, user_id: str, plan: str, period: str) -> dict:
        """Create a fake checkout session"""
        provider_ref = f"mock_sub_{uuid.uuid4().hex[:12]}"
        checkout_url = f"https://mock.local/checkout/{provider_ref}?plan={plan}&period={period}"
        
        return {
            "checkout_url": checkout_url,
            "provider_ref": provider_ref
        }
    
    def cancel(self, provider_ref: str) -> bool:
        """Mock cancel - always succeeds"""
        return True
    
    def create_portal_session(self, provider_ref: str) -> dict:
        """Mock portal session"""
        return {
            "url": f"https://mock.local/portal/{provider_ref}"
        }
    
    def parse_webhook(self, headers: dict, body_bytes: bytes) -> dict:
        """Mock webhook - trust and return payload"""
        import json
        try:
            payload = json.loads(body_bytes)
            return payload
        except:
            return {}
    
    def calculate_period_end(self, period: str) -> datetime:
        """Calculate end date based on period"""
        now = datetime.utcnow()
        if period == "weekly":
            return now + timedelta(days=7)
        elif period == "monthly":
            return now + timedelta(days=30)
        elif period == "yearly":
            return now + timedelta(days=365)
        return now
