# Charity Hub Backend — Phase 1: Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a runnable, tested FastAPI application skeleton with async Postgres wiring, configuration, migrations, and a health endpoint — the base every later phase builds on.

**Architecture:** Clean-architecture FastAPI app under `backend/`. Config via pydantic-settings from `.env`. Async SQLAlchemy 2.0 engine + session, exposed through a `get_db` dependency. Alembic set up for async migrations. A central app factory mounts routers, CORS, a request-id middleware, and a uniform JSON error handler. Tests run with pytest + httpx against a local Postgres (docker-compose) so the dialect matches Supabase.

**Tech Stack:** Python 3.12, FastAPI, Uvicorn, SQLAlchemy 2.0 (async, asyncpg), Alembic, Pydantic v2 + pydantic-settings, pytest, pytest-asyncio, httpx.

## Global Constraints

- Python **3.12**; all I/O paths **async** (`async def`, `AsyncSession`, `asyncpg`).
- SQLAlchemy **2.0** style (`Mapped`, `mapped_column`, `DeclarativeBase`). Pydantic **v2** (`model_config`, `ConfigDict`).
- All config from environment via pydantic-settings — **no secrets committed**. `.env` is git-ignored; only `.env.example` is committed.
- API is versioned under `/api/v1`.
- Backend lives in top-level `backend/`; all paths below are relative to repo root `c:\charity-prototype`.
- Uniform error envelope: `{"error": {"code": <string>, "message": <string>, "details": <any|null>}}`.
- Every domain module split into `models/`, `schemas/`, `repositories/`, `services/`, `api/v1/` — one responsibility per file.
- Tests use `TEST_DATABASE_URL` (local Postgres), never the real Supabase URL.

---

## File Structure (created this phase)

- `backend/requirements.txt` — pinned dependencies
- `backend/.env.example` — documented env template
- `backend/.gitignore` — ignore `.env`, `__pycache__`, `.pytest_cache`, `.venv`
- `backend/docker-compose.yml` — local Postgres for dev + tests
- `backend/app/__init__.py`
- `backend/app/core/config.py` — `Settings` + `get_settings()`
- `backend/app/core/exceptions.py` — `AppError` + handlers
- `backend/app/db/base.py` — `Base` declarative + naming convention
- `backend/app/db/session.py` — async engine, `SessionLocal`, `get_db`
- `backend/app/middleware/request_context.py` — request-id middleware
- `backend/app/api/__init__.py`, `backend/app/api/v1/__init__.py` — router aggregation
- `backend/app/api/v1/health.py` — health router
- `backend/app/main.py` — app factory `create_app()`
- `backend/alembic.ini`, `backend/alembic/env.py`, `backend/alembic/script.py.mako`, `backend/alembic/versions/` (empty)
- `backend/tests/__init__.py`, `backend/tests/conftest.py` — fixtures
- `backend/tests/test_config.py`, `backend/tests/test_health.py`, `backend/tests/test_errors.py`
- `backend/README.md` — run + test instructions

---

### Task 1: Dependencies, env template, and Settings config

**Files:**
- Create: `backend/requirements.txt`, `backend/.env.example`, `backend/.gitignore`, `backend/docker-compose.yml`
- Create: `backend/app/__init__.py`, `backend/app/core/__init__.py`, `backend/app/core/config.py`
- Test: `backend/tests/__init__.py`, `backend/tests/test_config.py`

**Interfaces:**
- Produces: `app.core.config.Settings` (pydantic-settings model) with fields `app_name: str`, `environment: str`, `database_url: str`, `test_database_url: str`, `jwt_secret: str`, `jwt_algorithm: str`, `access_token_expire_minutes: int`, `refresh_token_expire_minutes: int`, `cors_origins: list[str]`, `cloudinary_cloud_name: str`, `cloudinary_api_key: str`, `cloudinary_api_secret: str`. Plus `get_settings() -> Settings` (cached).

- [ ] **Step 1: Write `backend/requirements.txt`**

```text
fastapi==0.115.6
uvicorn[standard]==0.34.0
sqlalchemy[asyncio]==2.0.36
asyncpg==0.30.0
alembic==1.14.0
pydantic==2.10.4
pydantic-settings==2.7.0
PyJWT==2.10.1
passlib[bcrypt]==1.7.4
cloudinary==1.41.0
python-multipart==0.0.20
qrcode[pil]==8.0
pytest==8.3.4
pytest-asyncio==0.25.0
httpx==0.28.1
```

- [ ] **Step 2: Write `backend/.env.example`**

```text
APP_NAME=Charity Hub API
ENVIRONMENT=development
# Supabase Postgres (asyncpg). Use the pooler/session connection string.
DATABASE_URL=postgresql+asyncpg://USER:PASSWORD@HOST:5432/postgres
# Local Postgres for running the test suite (docker-compose default below)
TEST_DATABASE_URL=postgresql+asyncpg://charity:charity@localhost:5433/charity_test
JWT_SECRET=change-me-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_MINUTES=10080
CORS_ORIGINS=http://localhost:5173,http://localhost:4173
CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret
```

- [ ] **Step 3: Write `backend/.gitignore`**

```text
.env
.venv/
__pycache__/
*.pyc
.pytest_cache/
.ruff_cache/
```

- [ ] **Step 4: Write `backend/docker-compose.yml`** (local Postgres for dev + tests)

```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_USER: charity
      POSTGRES_PASSWORD: charity
      POSTGRES_DB: charity
    ports: ["5432:5432"]
    volumes: ["charity_pg:/var/lib/postgresql/data"]
  test_db:
    image: postgres:16
    environment:
      POSTGRES_USER: charity
      POSTGRES_PASSWORD: charity
      POSTGRES_DB: charity_test
    ports: ["5433:5432"]
volumes:
  charity_pg:
```

- [ ] **Step 5: Write empty `backend/app/__init__.py` and `backend/app/core/__init__.py` and `backend/tests/__init__.py`** (empty files)

- [ ] **Step 6: Write the failing test `backend/tests/test_config.py`**

```python
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
```

- [ ] **Step 7: Run test to verify it fails**

Run: `cd backend && python -m pytest tests/test_config.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'app.core.config'`

- [ ] **Step 8: Implement `backend/app/core/config.py`**

```python
from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


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
    access_token_expire_minutes: int = 30
    refresh_token_expire_minutes: int = 10080
    cors_origins: list[str] = ["http://localhost:5173"]
    cloudinary_cloud_name: str = ""
    cloudinary_api_key: str = ""
    cloudinary_api_secret: str = ""

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _split_origins(cls, v):
        if isinstance(v, str):
            return [o.strip() for o in v.split(",") if o.strip()]
        return v


@lru_cache
def get_settings() -> Settings:
    return Settings()
```

- [ ] **Step 9: Run test to verify it passes**

Run: `cd backend && python -m pytest tests/test_config.py -v`
Expected: PASS (2 passed)

- [ ] **Step 10: Commit**

```bash
git add backend/requirements.txt backend/.env.example backend/.gitignore backend/docker-compose.yml backend/app backend/tests
git commit -m "feat(backend): scaffold project with settings config"
```

---

### Task 2: Async DB engine, Base model, and `get_db` dependency

**Files:**
- Create: `backend/app/db/__init__.py`, `backend/app/db/base.py`, `backend/app/db/session.py`
- Test: `backend/tests/test_db.py`

**Interfaces:**
- Consumes: `app.core.config.get_settings`.
- Produces:
  - `app.db.base.Base` — `DeclarativeBase` subclass with a metadata naming convention.
  - `app.db.session.engine` — module-level async engine (built from `database_url`).
  - `app.db.session.SessionLocal` — `async_sessionmaker[AsyncSession]`.
  - `app.db.session.get_db() -> AsyncIterator[AsyncSession]` — FastAPI dependency yielding a session, closing it after.

- [ ] **Step 1: Write empty `backend/app/db/__init__.py`**

- [ ] **Step 2: Write the failing test `backend/tests/test_db.py`**

```python
import inspect

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import Base
from app.db.session import SessionLocal, get_db


def test_base_has_naming_convention():
    assert Base.metadata.naming_convention["fk"].startswith("fk_")


def test_get_db_is_async_generator():
    assert inspect.isasyncgenfunction(get_db)


def test_sessionmaker_binds_async_session():
    assert SessionLocal.kw["class_"] is AsyncSession
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd backend && python -m pytest tests/test_db.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'app.db.base'`

- [ ] **Step 4: Implement `backend/app/db/base.py`**

```python
from sqlalchemy import MetaData
from sqlalchemy.orm import DeclarativeBase

NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


class Base(DeclarativeBase):
    metadata = MetaData(naming_convention=NAMING_CONVENTION)
```

- [ ] **Step 5: Implement `backend/app/db/session.py`**

```python
from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import get_settings

settings = get_settings()

engine = create_async_engine(
    settings.database_url or "postgresql+asyncpg://localhost/placeholder",
    echo=False,
    future=True,
)

SessionLocal = async_sessionmaker(
    bind=engine, class_=AsyncSession, expire_on_commit=False
)


async def get_db() -> AsyncIterator[AsyncSession]:
    async with SessionLocal() as session:
        yield session
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd backend && python -m pytest tests/test_db.py -v`
Expected: PASS (3 passed)

- [ ] **Step 7: Commit**

```bash
git add backend/app/db backend/tests/test_db.py
git commit -m "feat(backend): add async engine, Base model, and get_db dependency"
```

---

### Task 3: App factory, health endpoint, CORS, error handling, and middleware

**Files:**
- Create: `backend/app/core/exceptions.py`, `backend/app/middleware/__init__.py`, `backend/app/middleware/request_context.py`
- Create: `backend/app/api/__init__.py`, `backend/app/api/v1/__init__.py`, `backend/app/api/v1/health.py`, `backend/app/main.py`
- Test: `backend/tests/conftest.py`, `backend/tests/test_health.py`, `backend/tests/test_errors.py`

**Interfaces:**
- Consumes: `app.core.config.get_settings`.
- Produces:
  - `app.core.exceptions.AppError(code: str, message: str, status_code: int = 400, details=None)` — base application exception.
  - `app.core.exceptions.register_exception_handlers(app: FastAPI) -> None` — installs handlers producing the uniform error envelope.
  - `app.api.v1.api_router` — `APIRouter` aggregating all v1 routers (health mounted now).
  - `app.main.create_app() -> FastAPI` — the app factory.
  - `conftest` fixture `client` — an `httpx.AsyncClient` bound to the app via ASGI transport.

- [ ] **Step 1: Write the failing tests `backend/tests/test_health.py`**

```python
import pytest


@pytest.mark.asyncio
async def test_health_ok(client):
    resp = await client.get("/api/v1/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}
```

- [ ] **Step 2: Write the failing tests `backend/tests/test_errors.py`**

```python
import pytest


@pytest.mark.asyncio
async def test_unknown_route_uses_error_envelope(client):
    resp = await client.get("/api/v1/does-not-exist")
    assert resp.status_code == 404
    body = resp.json()
    assert "error" in body
    assert body["error"]["code"] == "not_found"
    assert "message" in body["error"]


@pytest.mark.asyncio
async def test_app_error_envelope(client):
    resp = await client.get("/api/v1/health/boom")
    assert resp.status_code == 418
    assert resp.json()["error"]["code"] == "teapot"
```

- [ ] **Step 3: Write `backend/tests/conftest.py`**

```python
import asyncio

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.main import create_app


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture
async def client():
    app = create_app()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
```

- [ ] **Step 4: Run tests to verify they fail**

Run: `cd backend && python -m pytest tests/test_health.py tests/test_errors.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'app.main'`

- [ ] **Step 5: Implement `backend/app/core/exceptions.py`**

```python
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException


class AppError(Exception):
    def __init__(self, code: str, message: str, status_code: int = 400, details=None):
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details
        super().__init__(message)


def _envelope(code: str, message: str, details=None):
    return {"error": {"code": code, "message": message, "details": details}}


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def _app_error(_: Request, exc: AppError):
        return JSONResponse(
            status_code=exc.status_code,
            content=_envelope(exc.code, exc.message, exc.details),
        )

    @app.exception_handler(StarletteHTTPException)
    async def _http_error(_: Request, exc: StarletteHTTPException):
        code = {404: "not_found", 401: "unauthorized", 403: "forbidden"}.get(
            exc.status_code, "http_error"
        )
        return JSONResponse(
            status_code=exc.status_code,
            content=_envelope(code, str(exc.detail)),
        )

    @app.exception_handler(RequestValidationError)
    async def _validation_error(_: Request, exc: RequestValidationError):
        return JSONResponse(
            status_code=422,
            content=_envelope("validation_error", "Invalid request", exc.errors()),
        )
```

- [ ] **Step 6: Implement `backend/app/middleware/__init__.py` (empty) and `backend/app/middleware/request_context.py`**

```python
import uuid

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request


class RequestContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("x-request-id", str(uuid.uuid4()))
        request.state.request_id = request_id
        response = await call_next(request)
        response.headers["x-request-id"] = request_id
        return response
```

- [ ] **Step 7: Implement `backend/app/api/v1/health.py`**

```python
from fastapi import APIRouter

from app.core.exceptions import AppError

router = APIRouter(prefix="/health", tags=["health"])


@router.get("")
async def health():
    return {"status": "ok"}


@router.get("/boom")
async def boom():
    # Test-only route exercising the AppError envelope.
    raise AppError(code="teapot", message="I'm a teapot", status_code=418)
```

- [ ] **Step 8: Implement `backend/app/api/__init__.py` (empty) and `backend/app/api/v1/__init__.py`**

```python
from fastapi import APIRouter

from app.api.v1.health import router as health_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(health_router)
```

- [ ] **Step 9: Implement `backend/app/main.py`**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import api_router
from app.core.config import get_settings
from app.core.exceptions import register_exception_handlers
from app.middleware.request_context import RequestContextMiddleware


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.app_name, version="1.0.0")

    app.add_middleware(RequestContextMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_exception_handlers(app)
    app.include_router(api_router)
    return app


app = create_app()
```

- [ ] **Step 10: Run tests to verify they pass**

Run: `cd backend && python -m pytest tests/test_health.py tests/test_errors.py -v`
Expected: PASS (3 passed)

- [ ] **Step 11: Commit**

```bash
git add backend/app/core/exceptions.py backend/app/middleware backend/app/api backend/app/main.py backend/tests/conftest.py backend/tests/test_health.py backend/tests/test_errors.py
git commit -m "feat(backend): add app factory, health endpoint, CORS, and error envelope"
```

---

### Task 4: Alembic async migrations and README

**Files:**
- Create: `backend/alembic.ini`, `backend/alembic/env.py`, `backend/alembic/script.py.mako`, `backend/alembic/versions/.gitkeep`
- Create: `backend/README.md`

**Interfaces:**
- Consumes: `app.core.config.get_settings`, `app.db.base.Base`.
- Produces: a working `alembic` configuration whose `target_metadata` is `Base.metadata` and whose URL comes from `Settings.database_url`. No version files yet (first migration is authored in Phase 2 with the first models).

- [ ] **Step 1: Write `backend/alembic.ini`** (minimal; URL injected in env.py)

```ini
[alembic]
script_location = alembic
prepend_sys_path = .

[loggers]
keys = root,sqlalchemy,alembic

[handlers]
keys = console

[formatters]
keys = generic

[logger_root]
level = WARN
handlers = console
qualname =

[logger_sqlalchemy]
level = WARN
handlers =
qualname = sqlalchemy.engine

[logger_alembic]
level = INFO
handlers =
qualname = alembic

[handler_console]
class = StreamHandler
args = (sys.stderr,)
level = NOTSET
formatter = generic

[formatter_generic]
format = %(levelname)-5.5s [%(name)s] %(message)s
datefmt = %H:%M:%S
```

- [ ] **Step 2: Write `backend/alembic/script.py.mako`**

```mako
"""${message}

Revision ID: ${up_revision}
Revises: ${down_revision | comma,n}
Create Date: ${create_date}
"""
from alembic import op
import sqlalchemy as sa
${imports if imports else ""}

revision = ${repr(up_revision)}
down_revision = ${repr(down_revision)}
branch_labels = ${repr(branch_labels)}
depends_on = ${repr(depends_on)}


def upgrade() -> None:
    ${upgrades if upgrades else "pass"}


def downgrade() -> None:
    ${downgrades if downgrades else "pass"}
```

- [ ] **Step 3: Write `backend/alembic/env.py`** (async, metadata from Base)

```python
import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy.ext.asyncio import create_async_engine

from app.core.config import get_settings
from app.db.base import Base

# Import models so they register on Base.metadata (populated from Phase 2 on).
try:
    import app.models  # noqa: F401
except ModuleNotFoundError:
    pass

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata
DB_URL = get_settings().database_url


def run_migrations_offline() -> None:
    context.configure(
        url=DB_URL, target_metadata=target_metadata, literal_binds=True,
        dialect_opts={"paramstyle": "named"}, compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def _do_run(connection) -> None:
    context.configure(
        connection=connection, target_metadata=target_metadata, compare_type=True
    )
    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    engine = create_async_engine(DB_URL, future=True)
    async with engine.connect() as connection:
        await connection.run_sync(_do_run)
    await engine.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
```

- [ ] **Step 4: Create `backend/alembic/versions/.gitkeep`** (empty file)

- [ ] **Step 5: Verify Alembic loads its config** (no DB needed for offline check of config parsing)

Run: `cd backend && python -c "from alembic.config import Config; from alembic.script import ScriptDirectory; ScriptDirectory.from_config(Config('alembic.ini')); print('alembic config ok')"`
Expected: prints `alembic config ok`

- [ ] **Step 6: Write `backend/README.md`**

````markdown
# Charity Hub API

FastAPI backend for the Charity Hub prototype.

## Setup

```bash
cd backend
python -m venv .venv && . .venv/Scripts/activate   # Windows
pip install -r requirements.txt
cp .env.example .env   # then fill in Supabase + Cloudinary values
```

## Run local Postgres (dev + tests)

```bash
docker compose up -d
```

## Run the API

```bash
uvicorn app.main:app --reload
# Swagger UI at http://localhost:8000/docs
```

## Migrations

```bash
alembic revision --autogenerate -m "message"
alembic upgrade head
```

## Tests

```bash
python -m pytest -v
```
````

- [ ] **Step 7: Run the full suite to confirm the phase is green**

Run: `cd backend && python -m pytest -v`
Expected: PASS (all tests from Tasks 1–3 pass)

- [ ] **Step 8: Commit**

```bash
git add backend/alembic.ini backend/alembic backend/README.md
git commit -m "feat(backend): configure async Alembic migrations and add README"
```

---

## Self-Review

**Spec coverage (Phase 1 slice of §3, §7, §8):**
- Clean-architecture folder skeleton → Tasks 1–3 create `core/`, `db/`, `api/v1/`, `middleware/`. ✓
- Config from env, no secrets committed → Task 1 (`.env.example` + `.gitignore`). ✓
- Async DB session + `get_db` → Task 2. ✓
- App factory, CORS, uniform error envelope → Task 3. ✓
- Alembic async → Task 4. ✓
- Test harness (pytest + httpx async client) → Task 3 `conftest.py`. ✓
- README/run docs → Task 4. ✓
- Later phases (models, auth, domains) are intentionally out of this plan.

**Placeholder scan:** No TBD/TODO; every code step contains full content. The single `pass`-like branch is the documented "no version files yet" state in `env.py`, guarded by try/except. ✓

**Type consistency:** `get_settings` used consistently (Tasks 1–4); `Base.metadata` referenced in Task 2 (definition) and Task 4 (consumer); `create_app()`/`api_router`/`AppError` names match between definition (Task 3) and usage (conftest, main). ✓

## Next phase

Phase 2 (Auth & users) will be planned against this scaffold once Phase 1 is executed and reviewed — it authors the first Alembic migration (users + related tables), JWT security in `app/core/security.py`, the `get_current_user`/`require_role` deps in `app/api/deps.py`, and the auth + profile routers.
