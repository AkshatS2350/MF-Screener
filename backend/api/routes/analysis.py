from fastapi import APIRouter, Query
from services.sip_engine import sip_vs_lumpsum
from services.drawdown_engine import analyze_drawdowns
from services.category_benchmarker import compare_fund_vs_category
from services.nav_fetcher import get_nav_history

router = APIRouter(prefix="/api/v1/analysis", tags=["analysis"])

@router.get("/drawdown/{scheme_code}")
async def drawdown_anatomy(scheme_code: str):
    nav = await get_nav_history(scheme_code)
    return analyze_drawdowns(nav) 

@router.get("/benchmark/{scheme_code}")
async def benchmark_comparison(scheme_code: str, category: str):
    """Returns alpha, tracking error, and info ratio vs category peers."""
    return await compare_fund_vs_category(scheme_code, category) 