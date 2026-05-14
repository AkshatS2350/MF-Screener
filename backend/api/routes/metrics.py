from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from typing import Literal
from services.nav_fetcher import get_nav_history
from services.returns_engine import compute_rolling_returns
from services.risk_engine import compute_risk_metrics

# This sets up the base URL: /api/v1/metrics
router = APIRouter(prefix="/api/v1/metrics", tags=["metrics"])

class RollingReturnsResponse(BaseModel):
    scheme_code: str
    window: str
    data: list[dict]
    current: float
    median: float
    best: float
    worst: float
    pct_positive: float

# This adds the specific endpoint: /rolling-returns/120716
@router.get("/rolling-returns/{scheme_code}", response_model=RollingReturnsResponse)
async def rolling_returns(
    scheme_code: str,
    window: Literal["1y", "3y", "5y"] = Query("3y"),
):
    nav = await get_nav_history(scheme_code)
    if not nav:
        raise HTTPException(status_code=404, detail="Scheme not found or no NAV data")
        
    result = compute_rolling_returns(nav, window=window)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
        
    return {"scheme_code": scheme_code, **result}

@router.get("/risk/{scheme_code}")
async def risk_metrics(
    scheme_code: str,
    benchmark_code: str | None = Query(None, description="Nifty 50 scheme code"),
):
    fund_nav = await get_nav_history(scheme_code)
    bm_nav = await get_nav_history(benchmark_code) if benchmark_code else None
    return compute_risk_metrics(fund_nav, bm_nav)