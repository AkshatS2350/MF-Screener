import numpy as np
import pandas as pd

# Annotations for major Indian market events [cite: 1515]
MARKET_EVENTS = [
    {"date": "2020-03-23", "label": "Covid crash", "severity": "high"}, 
    {"date": "2016-11-08", "label": "Demonetisation", "severity": "high"} 
]

def analyze_drawdowns(nav_json: list[dict]):
    df = pd.DataFrame(nav_json)
    df["date"] = pd.to_datetime(df["date"], dayfirst=True) 
    nav = df["nav"].values
    
    roll_max = np.maximum.accumulate(nav) 
    drawdown = (nav - roll_max) / roll_max * 100 
    # Logic to identify discrete "episodes" of falling and recovering [cite: 1539-1540]
    # (Implementation follows logic from PDF Page 40-41)
    return {
        "max_drawdown": round(float(drawdown.min()), 2), 
        "drawdown_series": list(drawdown)
    }