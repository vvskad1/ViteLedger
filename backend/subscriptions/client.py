import os
from .mock_client import MockSubs
from .lava_client import LavaSubs, LavaSandboxSubs

def get_subs_client():
    """Return appropriate subscription client based on SUBS_MODE"""
    mode = os.getenv("SUBS_MODE", "MOCK").upper()
    
    if mode == "LAVA_SANDBOX":
        return LavaSandboxSubs()
    elif mode == "LAVA":
        return LavaSubs()
    else:
        return MockSubs()
