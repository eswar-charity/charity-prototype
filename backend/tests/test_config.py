import os

from app.core.config import Settings, get_settings


def test_settings_reads_from_environment(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "postgresql+asyncpg://u:p@h:5432/db")
    monkeypatch.setenv("JWT_SECRET", "s3cret")
    monkeypatch.setenv("CORS_ORIGINS", "http://a.com,http://b.com")
    s = Settings()
    assert s.database_url == "postgresql+asyncpg://u:p@h:5432/db"
    assert s.jwt_secret == "s3cret"
    assert s.cors_origins == ["http://a.com", "http://b.com"]


def test_get_settings_is_cached():
    assert get_settings() is get_settings()
