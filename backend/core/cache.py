import asyncio
import json
import time
from typing import Any
import redis.asyncio as aioredis
from core.config import settings

# THIS IS THE VARIABLE IT COULDN'T FIND:
# L2: Redis (shared across workers)
redis_client = aioredis.from_url(
    settings.REDIS_URL,
    encoding="utf-8",
    decode_responses=True,
    max_connections=20,
)

# L1: In-process dict (avoids Redis RTT for hot paths)
_l1: dict[str, tuple[Any, float]] = {}
_L1_TTL = 300 # 5 minutes

def _l1_get(key: str) -> Any | None:
    if key in _l1:
        val, exp = _l1[key]
        if time.monotonic() < exp:
            return val
        del _l1[key]
    return None

def _l1_set(key: str, val: Any) -> None:
    _l1[key] = (val, time.monotonic() + _L1_TTL)

# Public helpers
async def cache_get(key: str) -> Any | None:
    """L1 -> L2 read-through."""
    hit = _l1_get(key)
    if hit is not None:
        return hit
    
    raw = await redis_client.get(key)
    if raw:
        val = json.loads(raw)
        _l1_set(key, val)
        return val
    return None

async def cache_set(key: str, val: Any, ttl: int = 86_400) -> None:
    """Write to both L1 and L2."""
    _l1_set(key, val)
    await redis_client.setex(key, ttl, json.dumps(val))