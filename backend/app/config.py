from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Core
    app_name: str = "Leadly API"
    environment: str = "development"
    secret_key: str = "change-me-in-production-please-32chars-min"
    access_token_ttl_min: int = 30
    refresh_token_ttl_days: int = 30

    # Database
    database_url: str = "sqlite:///./data/leadly.db"

    # Storage (screenshots, exports live outside the DB)
    storage_dir: str = "./data/storage"

    # CORS
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    # Providers
    serpapi_key: str = ""  # empty -> finder uses OpenStreetMap + sample fallback

    # AI: OFF | LOCAL_LIGHT | LOCAL_FULL | API_PREMIUM
    ai_provider: str = "ollama"  # or "off" / "anthropic"
    ai_mode: str = "LOCAL_LIGHT"
    ollama_base_url: str = "http://ollama:11434"
    ollama_model: str = "qwen2.5:7b"
    anthropic_api_key: str = ""

    # Networking / safety
    request_timeout_s: float = 9.0
    max_html_bytes: int = 2_000_000
    per_domain_concurrency: int = 2
    outbound_proxy: str = ""  # honoured for audits/finder in sandboxed envs

    # Bootstrap owner (used by seed / first-run)
    owner_email: str = "owner@leadly.local"
    owner_password: str = "changeme123"

    @property
    def cors_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
