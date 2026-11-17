import os

class Settings:
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "TextilePro Fabric Trading ERP")
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "secret-fabric-erp-token-2026-production-key-textilepro-xyz99")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    MONGO_URI: str = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "fabric_erp")
    USE_LOCAL_STORAGE_FALLBACK: bool = os.getenv("USE_LOCAL_STORAGE_FALLBACK", "true").lower() in ("true", "1", "yes")

settings = Settings()
