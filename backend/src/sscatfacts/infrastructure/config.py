from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg://sscatfacts:sscatfacts@postgres:5432/sscatfacts"
    cat_fact_url: str = "https://catfact.ninja"
    cat_fact_timeout_seconds: float = 3.0
    cat_fact_max_retries: int = 1
    cors_origins: str = "http://localhost:5173"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
