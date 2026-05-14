import httpx
import json
from datetime import datetime, timedelta
from typing import Optional
from core.cache import redis_client

MFAPI_BASE = "https://api.mfapi.in/mf"
NAV_CACHE_TTL = 86_400 # 24 hours

async def get_nav_history(scheme_code: str) -> list[dict]:
    """
    Fetch NAV history with a Redis-first caching strategy.
    Falls back to MFapi.in on cache miss.
    Returns list of {date: str, nav: float} sorted oldest-first.
    """
    cache_key = f"nav:{scheme_code}"
    cached = await redis_client.get(cache_key)
    
    if cached:
        print(f"CACHE HIT: Loaded {scheme_code} from Upstash Redis!")
        return json.loads(cached)
        
    print(f"CACHE MISS: Fetching {scheme_code} from MFapi...")
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(f"{MFAPI_BASE}/{scheme_code}")
        resp.raise_for_status()
        raw = resp.json()
        
    # MFapi returns newest-first; reverse for time-series math
    nav_series = [
        {"date": entry["date"], "nav": float(entry["nav"])}
        for entry in reversed(raw["data"])
        if _is_valid_nav(entry["nav"])
    ]
    
    await redis_client.setex(cache_key, NAV_CACHE_TTL, json.dumps(nav_series))
    return nav_series

def _is_valid_nav(nav_str: str) -> bool:
    try:
        return float(nav_str) > 0
    except (ValueError, TypeError):
        return False