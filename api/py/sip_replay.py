import json
import pandas as pd
import httpx
from http.server import BaseHTTPRequestHandler

# 1. The Core Financial Logic
def sip_vs_lumpsum(nav_json: list[dict], monthly_sip: float, start_date: str, end_date: str) -> dict:
    df = pd.DataFrame(nav_json)
    df["date"] = pd.to_datetime(df["date"], dayfirst=True, errors="coerce")
    df = df.dropna(subset=["date"]).sort_values("date").set_index("date")
    
    start = pd.Timestamp(start_date)
    end = pd.Timestamp(end_date)
    df = df[(df.index >= start) & (df.index <= end)]
    
    if len(df) < 30:
        return {"error": "Not enough NAV data in the selected range"}

    # SIP: invest monthly_sip on the 1st available NAV each month
    sip_months = df.resample("MS").first()
    total_months = len(sip_months)
    total_invested = monthly_sip * total_months
    
    sip_units = (monthly_sip / sip_months["nav"]).cumsum()
    latest_nav = df["nav"].iloc[-1]
    sip_final = sip_units.iloc[-1] * latest_nav
    
    years = (end - start).days / 365.25
    
    # Simple XIRR approximation
    def xirr(final, invested, y):
        return round(((final / invested) ** (1/y) - 1) * 100, 2) if y > 0 else 0

    return {
        "total_invested": round(total_invested, 2),
        "sip_final_value": round(sip_final, 2),
        "sip_xirr": xirr(sip_final, total_invested, years),
    }

# 2. The Vercel Serverless Handler
class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        # Read the incoming JSON request
        length = int(self.headers.get("content-length", 0))
        body = json.loads(self.rfile.read(length))
        
        # Fetch actual data from MFapi (Skipping Redis for the very first test)
        scheme_code = body.get("scheme_code", "120716") # Default to a Large Cap fund
        resp = httpx.get(f"https://api.mfapi.in/mf/{scheme_code}")
        raw_data = resp.json()
        nav_series = [{"date": e["date"], "nav": float(e["nav"])} for e in reversed(raw_data["data"])]
        
        # Run the engine
        result = sip_vs_lumpsum(
            nav_json=nav_series,
            monthly_sip=body.get("monthly_sip", 10000),
            start_date=body.get("start_date", "2015-01-01"),
            end_date=body.get("end_date", "2024-12-31")
        )
        
        # Send the response back
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(result).encode())