import pandas as pd
from services.returns_engine import _to_dataframe

def sip_vs_lumpsum(nav_json: list[dict], monthly_sip: float, start_date: str, end_date: str) -> dict:
    """Replay actual SIP vs lump-sum outcomes on real historical NAVs.""" 
    df = _to_dataframe(nav_json).set_index("date")
    start, end = pd.Timestamp(start_date), pd.Timestamp(end_date)
    df = df[(df.index >= start) & (df.index <= end)] 

    if len(df) < 30:
        return {"error": "Not enough NAV data in the selected range"} 

    # SIP Logic: Invest on the 1st available NAV each month [cite: 1294-1295]
    sip_months = df.resample("MS").first()
    total_months = len(sip_months)
    sip_dates = sip_months.index
    
    running_units = 0.0
    sip_curve = []
    month_idx = 0
    
    for dt, row in df.iterrows():
        if month_idx < len(sip_dates) and dt >= sip_dates[month_idx]:
            running_units += monthly_sip / row["nav"]
            month_idx += 1
        sip_curve.append({
            "date": dt.strftime("%Y-%m-%d"),
            "value": round(running_units * row["nav"], 2),
            "invested": round(monthly_sip * month_idx, 2)
        }) 

    # Lump sum Logic: Invest total amount on day one [cite: 1315-1316]
    total_invested = monthly_sip * total_months
    lumpsum_units = total_invested / df["nav"].iloc[0]
    lumpsum_curve = [{"date": dt.strftime("%Y-%m-%d"), "value": round(lumpsum_units * row["nav"], 2)} 
                     for dt, row in df.iterrows()] 

    return {
        "sip_curve": sip_curve,
        "lumpsum_curve": lumpsum_curve,
        "total_invested": round(total_invested, 2),
        "winner": "sip" if sip_curve[-1]["value"] > lumpsum_curve[-1]["value"] else "lumpsum"
    } 