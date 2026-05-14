from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://mock:mock@localhost/mock"
    
    # PASTE YOUR ACTUAL UPSTASH URL DIRECTLY HERE:
    REDIS_URL: str = "rediss://default:gQAAAAAAAeGaAAIgcDExZDE5NGU5YjgyZGY0ZTkyODk5NDczMTllNGIzMDQwMw@adapting-stingray-123290.upstash.io:6379"
    
    MFAPI_BASE: str = "https://api.mfapi.in/mf"
    RISK_FREE_RATE: float = 0.065

settings = Settings()