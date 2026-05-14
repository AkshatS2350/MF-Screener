import numpy as np
from services.returns_engine import _to_dataframe

def run_monte_carlo(nav_series: list[dict], monthly_sip: float, years: int = 10, simulations: int = 5000) -> dict:
    """Simulate SIP portfolio growth using bootstrapped daily returns.""" 
    df = _to_dataframe(nav_series)
    daily_returns = df["nav"].pct_change().dropna().values
    months = years * 12
    rng = np.random.default_rng(42) 
    
    # Bootstrap monthly returns (approx 21 trading days per month) [cite: 287-288]
    monthly_return_pool = np.array([
        np.prod(1 + rng.choice(daily_returns, size=21, replace=True)) - 1
        for _ in range(simulations * months)
    ]).reshape(simulations, months) 
    
    corpus = np.zeros(simulations)
    monthly_values = np.zeros((simulations, months))
    
    for m in range(months):
        corpus = corpus * (1 + monthly_return_pool[:, m]) + monthly_sip
        monthly_values[:, m] = corpus 
        
    percentiles = [5, 25, 50, 75, 95] # For the fan chart [cite: 296]
    bands = {f"p{p}": np.percentile(monthly_values, p, axis=0).tolist() for p in percentiles} 
    
    total_invested = monthly_sip * months
    final_values = monthly_values[:, -1] 
    
    return {
        "total_invested": total_invested,
        "bands": bands,
        "summary": {
            "median_corpus": round(float(np.median(final_values)), 2),
            "probability_of_profit": round(float(np.mean(final_values > total_invested) * 100), 2)
        }
    } 