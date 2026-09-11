from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path

# Project root = two levels up from this file (backend/app/core/config.py -> project root)
PROJECT_ROOT = Path(__file__).resolve().parents[3]
ENV_FILE = PROJECT_ROOT / ".env"


class Settings(BaseSettings):
    # Kalshi
    kalshi_api_key: str
    kalshi_private_key_path: str
    kalshi_base_url: str = "https://api.elections.kalshi.com/trade-api/v2"

    # Database
    database_url: str

    # Redis
    redis_url: str

    # Trading
    trading_mode: str = "paper"  # "paper" or "live"

    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def kalshi_private_key_full_path(self) -> Path:
        return PROJECT_ROOT / self.kalshi_private_key_path.lstrip("./")


settings = Settings()