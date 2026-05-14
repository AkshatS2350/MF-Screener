import asyncio
import pandas as pd
from services.nav_fetcher import get_nav_history
from core.cache import cache_get, cache_set

# AMFI peer groups for synthesis [cite: 646-647]
CATEGORY_PEERS = {
    "Large Cap Fund": ["120716", "118989", "119533", "120594"], 
    "Mid Cap Fund": ["120841", "120848", "118778", "119060"], 
}

async def get_category_average_nav(category: str) -> list[dict] | None:
    """Synthesizes category average from equal-weighted peer NAVs."""
    cache_key = f"cat_avg:{category}"
    cached = await cache_get(cache_key) 
    if cached: return cached 

    peer_codes = CATEGORY_PEERS.get(category)
    if not peer_codes: return None 

    # Fetch peer data concurrently to save time [cite: 665]
    results = await asyncio.gather(*[get_nav_history(code) for code in peer_codes]) 
    frames = []
    for r in results:
        df = pd.DataFrame(r)
        df["date"] = pd.to_datetime(df["date"], format="%d-%m-%Y") 
        frames.append(df.set_index("date")["nav"]) 

    # Normalise to 1000 base for direct comparison 
    combined = pd.concat(frames, axis=1).dropna() 
    avg_nav = (combined.mean(axis=1) / combined.mean(axis=1).iloc[0]) * 1000 
    result = [{"date": d.strftime("%d-%m-%Y"), "nav": round(v, 4)} for d, v in avg_nav.items()] 
    await cache_set(cache_key, result, ttl=43200) 
    return result

async def compare_fund_vs_category(
    scheme_code: str,
    category: str,
) -> dict:
    """Returns alpha, tracking error, and information ratio vs category avg.""" 
    from services.risk_engine import _nav_to_returns
    import numpy as np

    # 1. Fetch both NAV series
    fund_nav = await get_nav_history(scheme_code) 
    cat_nav = await get_category_average_nav(category) 
    
    if not cat_nav:
        return {"error": "Category data unavailable"} 

    # 2. Convert to daily returns and align dates
    fund_ret = _nav_to_returns(fund_nav).set_index("date")["daily_return"] 
    cat_ret = _nav_to_returns(cat_nav).set_index("date")["daily_return"] 

    aligned = pd.concat([fund_ret, cat_ret], axis=1, keys=["fund", "cat"]).dropna() 
    
    # 3. Calculate relative metrics
    active_return = aligned["fund"] - aligned["cat"] 
    annual_days = 252 
    
    tracking_error = float(active_return.std() * np.sqrt(annual_days) * 100) 
    alpha_annual = float(active_return.mean() * annual_days * 100) 
    info_ratio = float(alpha_annual / tracking_error) if tracking_error > 0 else None 

    return {
        "scheme_code": scheme_code,
        "category": category,
        "alpha_pct": round(alpha_annual, 4),
        "tracking_error": round(tracking_error, 4),
        "information_ratio": round(info_ratio, 4) if info_ratio else None,
        "outperformed_pct": round(float(np.mean(active_return > 0) * 100), 2)
    } 