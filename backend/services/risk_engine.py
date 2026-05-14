import numpy as np
import pandas as pd

# MIBOR-linked proxy for Indian risk-free rate
RISK_FREE_ANNUAL = 0.065 # 6.5% p.a.
TRADING_DAYS = 252

# THIS IS THE FUNCTION IT WAS LOOKING FOR:
def compute_risk_metrics(
    fund_nav: list[dict],
    benchmark_nav: list[dict] | None = None,
) -> dict:
    """
    Returns Sharpe Ratio, Beta, Std Dev, Max Drawdown, and Sortino Ratio.
    benchmark_nav: Nifty 50 or category average NAV series.
    """
    fund_df = _nav_to_returns(fund_nav)
    rf_daily = (1 + RISK_FREE_ANNUAL) ** (1 / TRADING_DAYS) - 1
    excess = fund_df["daily_return"] - rf_daily
    
    # Annualised standard deviation
    std_annual = float(fund_df["daily_return"].std() * np.sqrt(TRADING_DAYS) * 100)
    
    # Sharpe ratio
    sharpe = float((excess.mean() / fund_df["daily_return"].std()) * np.sqrt(TRADING_DAYS))
    
    # Sortino: penalises only downside deviation
    downside = fund_df["daily_return"][fund_df["daily_return"] < rf_daily]
    downside_std = float(downside.std() * np.sqrt(TRADING_DAYS))
    sortino = float((excess.mean() * TRADING_DAYS) / downside_std) if downside_std > 0 else None
    
    # Max drawdown
    nav_series = fund_df["nav"]
    roll_max = nav_series.cummax()
    drawdown = (nav_series - roll_max) / roll_max
    max_drawdown = float(drawdown.min() * 100)
    
    result = {
        "std_dev_annual_pct": round(std_annual, 4),
        "sharpe_ratio": round(sharpe, 4),
        "sortino_ratio": round(sortino, 4) if sortino else None,
        "max_drawdown_pct": round(max_drawdown, 4),
    }
    
    # Beta and Alpha (requires benchmark)
    if benchmark_nav:
        bm_df = _nav_to_returns(benchmark_nav)
        aligned = fund_df.set_index("date").join(
            bm_df.set_index("date")[["daily_return"]].rename(columns={"daily_return": "bm_return"}),
            how="inner",
        )
        cov = np.cov(aligned["daily_return"].values, aligned["bm_return"].values)
        beta = float(cov[0, 1] / cov[1, 1])
        
        fund_annual = aligned["daily_return"].mean() * TRADING_DAYS
        bm_annual = aligned["bm_return"].mean() * TRADING_DAYS
        alpha = float(fund_annual - (RISK_FREE_ANNUAL + beta * (bm_annual - RISK_FREE_ANNUAL))) * 100
        
        result["beta"] = round(beta, 4)
        result["alpha_pct"] = round(alpha, 4)
        
    return result

def _nav_to_returns(nav_series: list[dict]) -> pd.DataFrame:
    df = pd.DataFrame(nav_series)
    df["date"] = pd.to_datetime(df["date"], format="%d-%m-%Y", errors="coerce")
    df = df.dropna().sort_values("date").reset_index(drop=True)
    df["daily_return"] = df["nav"].pct_change()
    return df.dropna()