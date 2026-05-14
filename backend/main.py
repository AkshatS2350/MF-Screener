from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import all the routers you've created
from api.routes import metrics, funds, portfolio, screener, analysis

app = FastAPI(
    title="Mutual Fund Analyzer API",
    description="Professional Financial Engine for NAV and Portfolio Analysis"
)

# CORS setup: Allows your Next.js frontend to talk to this Python server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with your Vercel URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registering the routers (Modular URLs) [cite: 10-13, 327]
app.include_router(metrics.router)    # Rolling returns & Risk [cite: 327]
app.include_router(funds.router)      # Search & Metadata
app.include_router(portfolio.router)  # Overlap & Projections
app.include_router(screener.router)   # Multi-factor filtering [cite: 921]
app.include_router(analysis.router)   # SIP Replay & Benchmarking

@app.get("/")
async def root():
    return {
        "status": "Online",
        "message": "Financial Engine is active. Use /docs for API documentation."
    }