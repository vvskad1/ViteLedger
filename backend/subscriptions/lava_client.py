import os
import hmac
import hashlib
import json
import httpx
import backoff
from datetime import datetime

class LavaSubs:
    """Lava payment provider client (PRODUCTION)"""
    
    def __init__(self):
        self.api_key = os.getenv("LAVA_API_KEY")
        self.base_url = os.getenv("LAVA_BASE_URL", "https://api.lava.ai")
        self.webhook_secret = os.getenv("LAVA_WEBHOOK_SECRET")
        
        # Endpoint paths (configurable)
        self.create_path = os.getenv("LAVA_CREATE_SUB_PATH", "/v1/subscriptions/create")
        self.cancel_path = os.getenv("LAVA_CANCEL_SUB_PATH", "/v1/subscriptions/cancel")
        self.portal_path = os.getenv("LAVA_CUSTOMER_PORTAL_PATH", "/v1/portal/sessions")
        
        # Price IDs map
        self.price_map = {
            ("basic", "weekly"): os.getenv("LAVA_PRICE_BASIC_WEEKLY"),
            ("basic", "monthly"): os.getenv("LAVA_PRICE_BASIC_MONTHLY"),
            ("basic", "yearly"): os.getenv("LAVA_PRICE_BASIC_YEARLY"),
            ("plus", "weekly"): os.getenv("LAVA_PRICE_PLUS_WEEKLY"),
            ("plus", "monthly"): os.getenv("LAVA_PRICE_PLUS_MONTHLY"),
            ("plus", "yearly"): os.getenv("LAVA_PRICE_PLUS_YEARLY"),
            ("pro", "weekly"): os.getenv("LAVA_PRICE_PRO_WEEKLY"),
            ("pro", "monthly"): os.getenv("LAVA_PRICE_PRO_MONTHLY"),
            ("pro", "yearly"): os.getenv("LAVA_PRICE_PRO_YEARLY"),
        }
    
    def _get_headers(self):
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
    
    @backoff.on_exception(backoff.expo, httpx.HTTPError, max_tries=3)
    async def create_checkout(self, user_id: str, plan: str, period: str) -> dict:
        """Create checkout session for recurring subscription"""
        price_id = self.price_map.get((plan, period))
        if not price_id:
            raise ValueError(f"No price ID configured for {plan}/{period}")
        
        payload = {
            "price_id": price_id,
            "user_reference": user_id,
            "success_url": f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/billing?success=true",
            "cancel_url": f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/billing?canceled=true"
        }
        
        async with httpx.AsyncClient() as client:
            # TODO: Adjust based on actual Lava API spec
            response = await client.post(
                f"{self.base_url}{self.create_path}",
                headers=self._get_headers(),
                json=payload
            )
            response.raise_for_status()
            data = response.json()
            
            return {
                "checkout_url": data.get("checkout_url") or data.get("url"),
                "provider_ref": data.get("subscription_id") or data.get("id")
            }
    
    @backoff.on_exception(backoff.expo, httpx.HTTPError, max_tries=3)
    async def cancel(self, provider_ref: str) -> bool:
        """Cancel subscription at provider"""
        async with httpx.AsyncClient() as client:
            # TODO: Adjust based on actual Lava API spec
            response = await client.post(
                f"{self.base_url}{self.cancel_path}/{provider_ref}",
                headers=self._get_headers()
            )
            response.raise_for_status()
            return True
    
    @backoff.on_exception(backoff.expo, httpx.HTTPError, max_tries=3)
    async def create_portal_session(self, provider_ref: str) -> dict:
        """Create customer portal session"""
        payload = {
            "subscription_id": provider_ref,
            "return_url": f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/billing"
        }
        
        async with httpx.AsyncClient() as client:
            # TODO: Adjust based on actual Lava API spec
            response = await client.post(
                f"{self.base_url}{self.portal_path}",
                headers=self._get_headers(),
                json=payload
            )
            response.raise_for_status()
            data = response.json()
            
            return {
                "url": data.get("portal_url") or data.get("url")
            }
    
    def parse_webhook(self, headers: dict, body_bytes: bytes) -> dict:
        """Parse and verify webhook from Lava"""
        # TODO: Implement signature verification based on Lava's spec
        signature = headers.get("x-lava-signature") or headers.get("lava-signature")
        
        if self.webhook_secret and signature:
            # Verify HMAC signature
            expected = hmac.new(
                self.webhook_secret.encode(),
                body_bytes,
                hashlib.sha256
            ).hexdigest()
            
            if not hmac.compare_digest(signature, expected):
                raise ValueError("Invalid webhook signature")
        
        # Parse payload
        payload = json.loads(body_bytes)
        
        # Normalize to standard format
        # TODO: Adjust based on actual Lava webhook structure
        event_type = payload.get("type") or payload.get("event")
        data = payload.get("data") or payload
        
        return {
            "type": event_type,
            "event_id": payload.get("id") or payload.get("event_id"),
            "data": {
                "user_reference": data.get("user_reference") or data.get("customer_id"),
                "provider_ref": data.get("subscription_id") or data.get("id"),
                "plan": data.get("plan"),
                "period": data.get("period") or data.get("interval"),
                "current_period_end": data.get("current_period_end")
            }
        }


class LavaSandboxSubs:
    """Lava payment provider client (SANDBOX/TEST MODE)"""
    
    def __init__(self):
        self.api_key = os.getenv("LAVA_API_KEY_TEST")
        self.base_url = os.getenv("LAVA_BASE_URL_SANDBOX", "https://sandbox.api.lava.ai")
        self.webhook_secret = os.getenv("LAVA_WEBHOOK_SECRET_TEST")
        
        # Endpoint paths (configurable)
        self.create_path = os.getenv("LAVA_CREATE_SUB_PATH", "/v1/test/checkout/intents")
        self.cancel_path = os.getenv("LAVA_CANCEL_SUB_PATH", "/v1/test/subscriptions/cancel")
        self.portal_path = os.getenv("LAVA_CUSTOMER_PORTAL_PATH", "/v1/test/portal/sessions")
        
        # Price IDs map (test environment)
        self.price_map = {
            ("basic", "weekly"): os.getenv("LAVA_PRICE_BASIC_WEEKLY", "price_test_basic_weekly"),
            ("basic", "monthly"): os.getenv("LAVA_PRICE_BASIC_MONTHLY", "price_test_basic_monthly"),
            ("basic", "yearly"): os.getenv("LAVA_PRICE_BASIC_YEARLY", "price_test_basic_yearly"),
            ("plus", "weekly"): os.getenv("LAVA_PRICE_PLUS_WEEKLY", "price_test_plus_weekly"),
            ("plus", "monthly"): os.getenv("LAVA_PRICE_PLUS_MONTHLY", "price_test_plus_monthly"),
            ("plus", "yearly"): os.getenv("LAVA_PRICE_PLUS_YEARLY", "price_test_plus_yearly"),
            ("pro", "weekly"): os.getenv("LAVA_PRICE_PRO_WEEKLY", "price_test_pro_weekly"),
            ("pro", "monthly"): os.getenv("LAVA_PRICE_PRO_MONTHLY", "price_test_pro_monthly"),
            ("pro", "yearly"): os.getenv("LAVA_PRICE_PRO_YEARLY", "price_test_pro_yearly"),
        }
        
        print(f"🧪 Lava Sandbox mode active — all payments simulated via {self.base_url}")
    
    def _get_headers(self):
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
    
    @backoff.on_exception(backoff.expo, httpx.HTTPError, max_tries=3)
    async def create_checkout(self, user_id: str, plan: str, period: str) -> dict:
        """Create checkout session for test subscription"""
        price_id = self.price_map.get((plan, period))
        
        payload = {
            "user_reference": user_id,
            "price_id": price_id,
            "test_mode": True,
            "metadata": {
                "purpose": "test_subscription",
                "plan": plan,
                "period": period
            },
            "success_url": f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/billing?success=true",
            "cancel_url": f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/billing?canceled=true"
        }
        
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(
                f"{self.base_url}{self.create_path}",
                headers=self._get_headers(),
                json=payload
            )
            response.raise_for_status()
            data = response.json()
            
            return {
                "checkout_url": data.get("checkout_url") or data.get("hosted_url") or data.get("url"),
                "provider_ref": data.get("id") or data.get("intent_id") or data.get("subscription_id")
            }
    
    @backoff.on_exception(backoff.expo, httpx.HTTPError, max_tries=3)
    async def cancel(self, provider_ref: str) -> bool:
        """Cancel test subscription"""
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(
                f"{self.base_url}{self.cancel_path}/{provider_ref}",
                headers=self._get_headers()
            )
            response.raise_for_status()
            return True
    
    @backoff.on_exception(backoff.expo, httpx.HTTPError, max_tries=3)
    async def create_portal_session(self, provider_ref: str) -> dict:
        """Create test customer portal session"""
        payload = {
            "subscription_id": provider_ref,
            "return_url": f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/billing"
        }
        
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(
                f"{self.base_url}{self.portal_path}",
                headers=self._get_headers(),
                json=payload
            )
            response.raise_for_status()
            data = response.json()
            
            return {
                "url": data.get("portal_url") or data.get("url")
            }
    
    def parse_webhook(self, headers: dict, body_bytes: bytes) -> dict:
        """Parse and verify webhook from Lava Sandbox (auto-succeeds for testing)"""
        # Parse payload
        payload = json.loads(body_bytes)
        
        # Automatically mark as success for sandbox testing
        event_type = payload.get("type") or payload.get("event") or "subscription.active"
        data = payload.get("data") or payload
        
        return {
            "type": event_type,
            "event_id": payload.get("id") or payload.get("event_id") or "test_event_id",
            "data": {
                "user_reference": data.get("user_reference") or data.get("customer_id"),
                "provider_ref": data.get("subscription_id") or data.get("id"),
                "plan": data.get("plan"),
                "period": data.get("period") or data.get("interval"),
                "current_period_end": data.get("current_period_end")
            }
        }
