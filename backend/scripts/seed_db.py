import asyncio
import httpx
import os
from dotenv import load_dotenv

# Load your Supabase keys from the .env file
load_dotenv()
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")

# Supabase REST API Headers
headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates" # Acts like an 'upsert'
}

async def seed_mutual_funds():
    print("Fetching master list from MFapi...")
    async with httpx.AsyncClient() as client:
        response = await client.get("https://api.mfapi.in/mf")
        all_funds = response.json()

    print(f"Found {len(all_funds)} funds. Preparing for database...")
    
    # Grab the first 500 funds for a quick sync
    db_records = []
    for fund in all_funds[:500]: 
        db_records.append({
            "scheme_code": str(fund["schemeCode"]),
            "scheme_name": fund["schemeName"],
            "amc_name": fund["schemeName"].split()[0], 
            "category": "Equity", 
            "expense_ratio": 0.5, 
            "aum_cr": 1000 
        })

    print("Uploading directly to Supabase REST API...")
    async with httpx.AsyncClient() as client:
        # Upload in batches of 100
        for i in range(0, len(db_records), 100):
            batch = db_records[i:i+100]
            
            # Direct POST request to the mutual_funds table endpoint
            res = await client.post(
                f"{url}/rest/v1/mutual_funds",
                headers=headers,
                json=batch
            )
            
            if res.status_code in [200, 201]:
                print(f"Uploaded batch {i} to {i+100}")
            else:
                print(f"Failed on batch {i}. Error: {res.text}")

    print("Sync complete! Your database is now populated.")

if __name__ == "__main__":
    asyncio.run(seed_mutual_funds())