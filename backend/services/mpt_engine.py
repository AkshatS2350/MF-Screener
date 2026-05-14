import numpy as np
import pandas as pd

TRADING_DAYS = 252
NUM_PORTFOLIOS = 1000 

def efficient_frontier(funds_nav: list[dict]) -> dict:
    """Finds the max-Sharpe and min-variance portfolios.""" 
    # Convert list of NAVs into a returns matrix
    returns = pd.concat([
        pd.DataFrame(f["nav"]).assign(date=lambda x: pd.to_datetime(x["date"], dayfirst=True))
        .set_index("date")["nav"].pct_change().rename(f["scheme_code"])
        for f in funds_nav
    ], axis=1).dropna() 

    mean_ret = returns.mean() * TRADING_DAYS
    cov_matrix = returns.cov() * TRADING_DAYS
    results = {"weights": [], "returns": [], "volatility": [], "sharpe": []}
    
    rng = np.random.default_rng(42)
    for _ in range(NUM_PORTFOLIOS):
        w = rng.dirichlet(np.ones(len(returns.columns))) # Random weights [cite: 1654]
        p_ret = float(w @ mean_ret)
        p_vol = float(np.sqrt(w @ cov_matrix @ w))
        p_shrp = (p_ret - 0.065) / p_vol if p_vol > 0 else 0
        
        results["weights"].append(w.tolist())
        results["returns"].append(p_ret * 100)
        results["volatility"].append(p_vol * 100)
        results["sharpe"].append(p_shrp) 

    max_s_idx = int(np.argmax(results["sharpe"]))
    min_v_idx = int(np.argmin(results["volatility"]))

    return {
        "max_sharpe": {"weights": results["weights"][max_s_idx], "return": results["returns"][max_s_idx]},
        "min_volatility": {"weights": results["weights"][min_v_idx], "volatility": results["volatility"][min_v_idx]}
    } 