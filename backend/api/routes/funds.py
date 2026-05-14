from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
import httpx

router = APIRouter(prefix="/api/v1/funds", tags=["funds"])

@router.get("/search")
async def search_funds(q: str = Query(..., min_length=3)):
    """Search for funds by name using the AMFI master list proxy."""
    async with httpx.AsyncClient() as client:
        # We fetch the master list from MFapi [cite: 35]
        resp = await client.get("https://api.mfapi.in/mf")
        all_funds = resp.json()
    
    # Filter based on user query
    results = [f for f in all_funds if q.lower() in f['schemeName'].lower()]
    return results[:10] # Return top 10 matches for autocomplete [cite: 877]

@router.get("/{scheme_code}")
async def get_fund_meta(scheme_code: str):
    """Get metadata for a specific fund (Name, Category, etc.)"""
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"https://api.mfapi.in/mf/{scheme_code}")
        if resp.status_code != 200:
            raise HTTPException(status_code=404, detail="Fund not found")
        data = resp.json()
        
    return {
        "scheme_code": scheme_code,
        "scheme_name": data["meta"]["scheme_name"],
        "category": data["meta"]["scheme_category"],
        "amc": data["meta"]["fund_house"]
    } 