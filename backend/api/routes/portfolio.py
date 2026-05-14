from fastapi import APIRouter, Body
from services.overlap_engine import detect_stock_overlap, FundHolding
from services.monte_carlo import run_monte_carlo
from services.nav_fetcher import get_nav_history

router = APIRouter(prefix="/api/v1/portfolio", tags=["portfolio"])

@router.post("/overlap")
async def portfolio_overlap(funds: list[dict] = Body(...)):
    """Analyze stock overlap between multiple funds in a portfolio."""
    # Note: In a real app, holdings are fetched from a DB [cite: 1007]
    # Here we expect the frontend to pass weights and holdings [cite: 198-203]
    fund_objects = [FundHolding(**f) for f in funds]
    return detect_stock_overlap(fund_objects) 

@router.post("/projections")
async def portfolio_projections(
    scheme_code: str, 
    monthly_sip: float = 10000, 
    years: int = 10
):
    """Run 5,000 simulations for a fund's future growth."""
    nav_series = await get_nav_history(scheme_code) 
    return run_monte_carlo(nav_series, monthly_sip, years) 