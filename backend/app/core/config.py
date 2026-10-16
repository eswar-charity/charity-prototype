from functools import lru_cache
from typing import Annotated

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    app_name: str = "Charity Hub API"
    environment: str = "development"
    database_url: str = ""
    test_database_url: str = ""
    jwt_secret: str = "change-me"
    jwt_algorithm: str = "HS256"
    bcrypt_rounds: int = 12
    access_token_expire_minutes: int = 30
    refresh_token_expire_minutes: int = 10080
    cors_origins: Annotated[list[str], NoDecode] = ["http://localhost:5173"]
    public_base_url: str = "http://localhost:5173"
    cloudinary_cloud_name: str = ""
    cloudinary_api_key: str = ""
    cloudinary_api_secret: str = ""
    google_client_id: str = ""

    # Stripe (real payments). With no secret key the dev-only mock provider is
    # used; in production a missing key makes payment endpoints return 503.
    stripe_secret_key: str = ""
    stripe_publishable_key: str = ""
    # Signing secret of the endpoint listening to *your account* (payments, refunds, disputes).
    stripe_webhook_secret: str = ""
    # Signing secret of a second endpoint listening to *connected accounts*
    # (Stripe sends account.updated there, with a different secret).
    stripe_connect_webhook_secret: str = ""
    # When true, donations to nonprofits without a connected Stripe account are
    # charged to the platform account (funds held until the nonprofit connects).
    allow_unconnected_nonprofits: bool = False

    invite_expire_hours: int = 168
    login_max_failures: int = 5
    login_lock_minutes: int = 15
    rate_limit_enabled: bool = True

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _split_origins(cls, v):
        if isinstance(v, str):
            return [o.strip() for o in v.split(",") if o.strip()]
        return v

    @model_validator(mode="after")
    def _guard_production_secrets(self):
        if self.environment.lower() == "production":
            weak = {"", "change-me", "change-me-in-production"}
            if self.jwt_secret in weak or len(self.jwt_secret) < 32:
                raise ValueError(
                    "JWT_SECRET must be a strong secret (>=32 chars) in production"
                )
        return self

    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"

    @property
    def stripe_enabled(self) -> bool:
        return bool(self.stripe_secret_key)


@lru_cache
def get_settings() -> Settings:
    return Settings()
