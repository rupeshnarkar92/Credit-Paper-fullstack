from pydantic_settings import BaseSettings
from functools import lru_cache
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse


class Settings(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    SMTP_HOST: str = "smtp.ethereal.email"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "noreply@creditpaper.com"

    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/auth/google/callback"

    FRONTEND_URL: str = "http://localhost:5173"

    ENCRYPTION_KEY: str = ""
    USE_ENCRYPTION: bool = False

    model_config = {"env_file": ".env", "extra": "forbid"}

    @classmethod
    def get_database_url(cls, url: str) -> str:
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        if url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)

        parsed = urlparse(url)
        params = parse_qs(parsed.query)

        if "sslmode" in params:
            sslmode = params.pop("sslmode")[0]
            if sslmode in ("require", "prefer", "allow"):
                params["ssl"] = ["require"]
            del params["sslmode"]

        new_query = urlencode(params, doseq=True)
        return urlunparse(parsed._replace(query=new_query))


@lru_cache
def get_settings() -> Settings:
    return Settings()
