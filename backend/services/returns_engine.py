import numpy as np
import pandas as pd
from datetime import datetime
from typing import Literal

WindowType = Literal["1y", "3y", "5y"]

WINDOW_DAYS: dict[WindowType, int] = {
    "1y": 252,
    "3y": 756,
    "5y": 1260,
}

# THIS IS THE FUNCTION IT WAS LOOKING FOR:
def compute_rolling_returns(nav_series: list[dict], window: WindowType = "3y") -> dict:
    """Compute annualised rolling returns for every valid window in the series."""
    df = _to_dataframe(nav_series)
    window_days = WINDOW_DAYS[window]
    years = int(window[0])
    
    if len(df) < window_days:
        return {"error": f"Insufficient data for {window} window"}
        
    # Vectorised CAGR = (nav_end/nav_start) ^ (1/years) - 1
    nav = df["nav"].values
    nav_end = nav[window_days:]
    nav_start = nav[:-window_days]
    
    rolling_cagr = (nav_end/nav_start) ** (1.0 / years) - 1.0
    rolling_cagr_pct = np.round(rolling_cagr * 100, 4)
    
    result_dates = df["date"].iloc[window_days:].dt.strftime("%Y-%m-%d").tolist()
    
    data_points = [
        {"date": d, "return_pct": float(r)}
        for d, r in zip(result_dates, rolling_cagr_pct)
    ]
    
    return {
        "window": window,
        "data": data_points,
        "current": float(rolling_cagr_pct[-1]),
        "median": float(np.median(rolling_cagr_pct)),
        "percentile_25": float(np.percentile(rolling_cagr_pct, 25)),
        "percentile_75": float(np.percentile(rolling_cagr_pct, 75)),
        "best": float(np.max(rolling_cagr_pct)),
        "worst": float(np.min(rolling_cagr_pct)),
        "pct_positive": float(np.mean(rolling_cagr_pct > 0) * 100),
    }

def compute_point_to_point_cagr(nav_series: list[dict], from_date: str | None = None, to_date: str | None = None) -> float:
    """CAGR between two specific dates (defaults to full history)."""
    df = _to_dataframe(nav_series)
    if from_date:
        df = df[df["date"] >= pd.Timestamp(from_date)]
    if to_date:
        df = df[df["date"] <= pd.Timestamp(to_date)]
    if len(df) < 2:
        raise ValueError("Not enough data for CAGR calculation")
        
    nav_start = df["nav"].iloc[0]
    nav_end = df["nav"].iloc[-1]
    days = (df["date"].iloc[-1] - df["date"].iloc[0]).days
    years = days / 365.25
    return ((nav_end / nav_start) ** (1.0 / years) - 1.0) * 100

def _to_dataframe(nav_series: list[dict]) -> pd.DataFrame:
    df = pd.DataFrame(nav_series)
    df["date"] = pd.to_datetime(df["date"], format="%d-%m-%Y", errors="coerce")
    df = df.dropna(subset=["date"]).sort_values("date").reset_index(drop=True)
    return df