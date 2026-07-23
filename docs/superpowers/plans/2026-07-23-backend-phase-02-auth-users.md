# Charity Hub Backend — Phase 2: Auth & Users Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add JWT authentication, password hashing, RBAC dependencies, the `User`/`UserCause` data model, and the auth + profile API surface on top of the Phase 1 scaffold — everything the CreateAccount, TellAboutYou, and identity-gate (join/donate) frontend flows need to register, sign in, convert guests, and edit a public profile.

**Architecture:** Clean-architecture FastAPI app under `backend/`. This phase adds `app/core/security.py` (JWT + bcrypt), `app/models/user.py` + `app/models/enums.py`, `app/utils/identity.py` (initials/color), `app/repositories/user_repository.py`, `app/schemas/{auth,user}.py`, `app/services/{auth_service,user_service}.py`, `app/api/deps.py` (auth/RBAC deps), and the `auth` + `users` routers mounted in `api_router`. A handwritten Alembic migration `0001_users` mirrors the models for the real Supabase deploy. Automated tests run on SQLite (aiosqlite) via a fresh-per-test engine and a `get_db` override established in `tests/conftest.py`.

**Tech Stack:** Python 3.12, FastAPI, SQLAlchemy 2.0 async, Pydantic v2, PyJWT, passlib[bcrypt], pytest + pytest-asyncio + httpx, aiosqlite (tests only).

## Global Constraints

- **Reuse the existing venv — do NOT run `pip install`.** A venv with all deps (incl. `aiosqlite==0.20.0`, PyJWT, passlib[bcrypt]) already exists at `backend/.venv`. Run tests with: `cd backend && .venv/Scripts/python -m pytest -v`.
- **Create/modify ONLY files under `backend/`.** Stage only the task-scoped paths shown in each Commit step — **never `git add -A`**; the repo working tree has unrelated changes elsewhere (frontend + docs).
- Python **3.12**; all DB I/O paths **async** (`async def`, `AsyncSession`). SQLAlchemy **2.0** style (`Mapped`, `mapped_column`). Pydantic **v2** (`ConfigDict`, `model_validator`, `field_validator`).
- **Dialect-portable models only** (tests run on SQLite): integer autoincrement PKs, `String`/`Text`, `Boolean`, `Numeric`, `DateTime`, generic `sqlalchemy.JSON`. **NO** Postgres `ARRAY`, native `ENUM`, or `UUID` columns. Represent enums as `String` columns validated by a Python `enum.StrEnum` + Pydantic — never DB-native enums.
- **Do NOT use `pydantic.EmailStr`** anywhere — `email-validator` is not installed and must not be added. Email fields are plain `str`.
- Reuse Phase 1 interfaces exactly: `app.core.config.get_settings()`, `app.db.base.Base`, `app.db.session.get_db`/`SessionLocal`/`engine`, `app.core.exceptions.AppError(code, message, status_code=400, details=None)`, `app.main.create_app()`, `app.api.v1.api_router`. Raise `AppError` for auth/permission failures (401 `unauthorized`, 403 `forbidden`, 409 `conflict`).
- Uniform error envelope (already installed by Phase 1 handlers): `{"error": {"code", "message", "details"}}`.
- API is versioned under `/api/v1`. All paths below are relative to repo root `C:\charity-prototype`.
- **Test DB via SQLite, NOT Alembic.** The suite builds schema with `Base.metadata.create_all` on an aiosqlite engine and overrides `get_db`. The Alembic migration authored in Task 9 targets Supabase Postgres and is **validated against Supabase later — it is NOT run by the test suite.**
- Keep all Phase 1 tests green and pytest output pristine (`pytest.ini` already sets `asyncio_mode = auto`).
- **Out of scope this phase (do NOT build):** organizer public profile + follows, notifications endpoints, nonprofits, events, media/Cloudinary, seeding demo data. Any forward reference to a later entity is a plain **nullable integer column with NO foreign key** (e.g. `avatar_media_id`).

---

## File Structure (created/modified this phase)

- `backend/tests/conftest.py` — **modified**: add aiosqlite engine, `db_engine`/`db_session` fixtures, `get_db`-overriding `client`, `make_user`, `auth_header`
- `backend/tests/test_infra.py` — new: proves test DB + session wiring
- `backend/app/models/__init__.py` — new (empty in Task 1; imports models from Task 3)
- `backend/app/core/security.py` — new: JWT + bcrypt
- `backend/tests/test_security.py` — new
- `backend/app/models/enums.py` — new: `UserRole`, `UserStatus` StrEnums
- `backend/app/models/user.py` — new: `User`, `UserCause`
- `backend/app/utils/__init__.py`, `backend/app/utils/identity.py` — new: `derive_initials`, `pick_color`
- `backend/tests/test_models.py` — new
- `backend/app/repositories/__init__.py`, `backend/app/repositories/user_repository.py` — new
- `backend/tests/test_user_repository.py` — new
- `backend/app/schemas/__init__.py`, `backend/app/schemas/auth.py`, `backend/app/schemas/user.py` — new
- `backend/app/services/__init__.py`, `backend/app/services/auth_service.py` — new
- `backend/tests/test_auth_service.py` — new
- `backend/app/api/deps.py` — new: `get_current_user`, `get_current_user_optional`, `require_role`
- `backend/tests/test_deps.py` — new
- `backend/app/api/v1/auth.py` — new: auth router
- `backend/app/api/v1/__init__.py` — **modified**: mount `auth` + `users` routers
- `backend/tests/test_auth_api.py` — new
- `backend/app/services/user_service.py` — new
- `backend/app/api/v1/users.py` — new: profile router
- `backend/tests/test_users_api.py` — new
- `backend/alembic/versions/0001_users.py` — new: handwritten migration (Supabase deploy only)

---

### Task 1: Test infrastructure — aiosqlite DB, session override, and auth fixtures

**Files:**
- Create: `backend/app/models/__init__.py` (empty)
- Modify: `backend/tests/conftest.py`
- Test: `backend/tests/test_infra.py`

**Interfaces:**
- Consumes: `app.main.create_app`, `app.db.base.Base`, `app.db.session.get_db`, `app.models` (empty for now).
- Produces (pytest fixtures):
  - `db_engine` — fresh-per-test aiosqlite `AsyncEngine` (in-memory, `StaticPool`) with `Base.metadata.create_all` applied.
  - `db_session() -> AsyncSession` — a session bound to `db_engine`.
  - `client` — `httpx.AsyncClient` bound to `create_app()` with `get_db` overridden to the test engine.
  - `make_user` — callable `async (role="se", email="user@example.com", phone=None, password="Passw0rd!", name="Test User", **kwargs) -> User` inserting a user (uses deferred imports so Phase 1 stays importable).
  - `auth_header` — callable `(user) -> {"Authorization": "Bearer <access_token>"}`.

- [ ] **Step 1: Create empty `backend/app/models/__init__.py`** (empty file — real models are registered here in Task 3)

- [ ] **Step 2: Replace `backend/tests/conftest.py` with the expanded fixtures**

```python
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.pool import StaticPool

import app.models  # noqa: F401  # register models on Base.metadata before create_all
from app.db.base import Base
from app.db.session import get_db
from app.main import create_app


@pytest_asyncio.fixture
async def db_engine():
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(db_engine):
    maker = async_sessionmaker(
        bind=db_engine, class_=AsyncSession, expire_on_commit=False
    )
    async with maker() as session:
        yield session


@pytest_asyncio.fixture
async def client(db_engine):
    maker = async_sessionmaker(
        bind=db_engine, class_=AsyncSession, expire_on_commit=False
    )

    async def _override_get_db():
        async with maker() as session:
            yield session

    app = create_app()
    app.dependency_overrides[get_db] = _override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest.fixture
def make_user(db_session):
    async def _make(
        role="se",
        email="user@example.com",
        phone=None,
        password="Passw0rd!",
        name="Test User",
        **kwargs,
    ):
        # Deferred imports: these modules are created in Tasks 2 and 3.
        from app.core.security import hash_password
        from app.models.user import User
        from app.utils.identity import derive_initials, pick_color

        user = User(
            role=role,
            email=email,
            phone=phone,
            password_hash=hash_password(password) if password else None,
            name=name,
            initials=kwargs.pop("initials", derive_initials(name)),
            color=kwargs.pop("color", pick_color(name)),
            status=kwargs.pop("status", "active"),
            **kwargs,
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)
        return user

    return _make


@pytest.fixture
def auth_header():
    def _header(user):
        from app.core.security import create_access_token

        token = create_access_token(subject=str(user.id), extra={"role": user.role})
        return {"Authorization": f"Bearer {token}"}

    return _header
```

- [ ] **Step 3: Write the failing test `backend/tests/test_infra.py`**

```python
import pytest
from sqlalchemy import text


@pytest.mark.asyncio
async def test_db_session_executes_query(db_session):
    result = await db_session.execute(text("SELECT 1"))
    assert result.scalar_one() == 1


@pytest.mark.asyncio
async def test_client_health_still_works_with_override(client):
    resp = await client.get("/api/v1/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && .venv/Scripts/python -m pytest tests/test_infra.py -v`
Expected: PASS (2 passed).

- [ ] **Step 5: Run the FULL suite to confirm Phase 1 tests still pass with the new conftest**

Run: `cd backend && .venv/Scripts/python -m pytest -v`
Expected: PASS (all Phase 1 tests — config/db/health/errors — plus the 2 new infra tests). Output pristine.

- [ ] **Step 6: Commit**

```bash
git add backend/app/models/__init__.py backend/tests/conftest.py backend/tests/test_infra.py
git commit -m "test(backend): add aiosqlite test DB, get_db override, and auth fixtures"
```

---

### Task 2: Security — JWT tokens and password hashing

**Files:**
- Create: `backend/app/core/security.py`
- Test: `backend/tests/test_security.py`

**Interfaces:**
- Consumes: `app.core.config.get_settings`, `app.core.exceptions.AppError`.
- Produces (all in `app.core.security`):
  - `hash_password(password: str) -> str`
  - `verify_password(password: str, password_hash: str) -> bool`
  - `create_access_token(subject: str, extra: dict | None = None) -> str` — sets claim `type="access"`, `sub`, `iat`, `exp`.
  - `create_refresh_token(subject: str) -> str` — sets claim `type="refresh"`.
  - `decode_token(token: str) -> dict` — returns claims; raises `AppError("unauthorized", ..., status_code=401)` on expired/invalid.

- [ ] **Step 1: Write the failing test `backend/tests/test_security.py`**

```python
import jwt
import pytest

from app.core.exceptions import AppError
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)


def test_password_hash_roundtrip():
    hashed = hash_password("Passw0rd!")
    assert hashed != "Passw0rd!"
    assert verify_password("Passw0rd!", hashed) is True
    assert verify_password("wrong", hashed) is False


def test_access_token_has_type_and_subject():
    token = create_access_token(subject="42", extra={"role": "se"})
    claims = decode_token(token)
    assert claims["sub"] == "42"
    assert claims["type"] == "access"
    assert claims["role"] == "se"


def test_refresh_token_has_refresh_type():
    claims = decode_token(create_refresh_token(subject="7"))
    assert claims["sub"] == "7"
    assert claims["type"] == "refresh"


def test_decode_invalid_token_raises_401():
    with pytest.raises(AppError) as exc:
        decode_token("not-a-real-token")
    assert exc.value.status_code == 401
    assert exc.value.code == "unauthorized"


def test_decode_expired_token_raises_401():
    from app.core.config import get_settings

    settings = get_settings()
    expired = jwt.encode(
        {"sub": "1", "type": "access", "exp": 1},  # 1970 -> already expired
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
    )
    with pytest.raises(AppError) as exc:
        decode_token(expired)
    assert exc.value.status_code == 401


def test_create_access_token_accepts_no_extra():
    claims = decode_token(create_access_token(subject="9"))
    assert claims["sub"] == "9"
    assert claims["type"] == "access"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && .venv/Scripts/python -m pytest tests/test_security.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'app.core.security'`.

- [ ] **Step 3: Implement `backend/app/core/security.py`**

```python
from datetime import datetime, timedelta, timezone

import jwt
from passlib.context import CryptContext

from app.core.config import get_settings
from app.core.exceptions import AppError

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


def _create_token(
    subject: str,
    token_type: str,
    expires_delta: timedelta,
    extra: dict | None = None,
) -> str:
    settings = get_settings()
    now = datetime.now(timezone.utc)
    payload: dict = {
        "sub": str(subject),
        "type": token_type,
        "iat": now,
        "exp": now + expires_delta,
    }
    if extra:
        payload.update(extra)
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def create_access_token(subject: str, extra: dict | None = None) -> str:
    settings = get_settings()
    return _create_token(
        subject,
        "access",
        timedelta(minutes=settings.access_token_expire_minutes),
        extra,
    )


def create_refresh_token(subject: str) -> str:
    settings = get_settings()
    return _create_token(
        subject,
        "refresh",
        timedelta(minutes=settings.refresh_token_expire_minutes),
    )


def decode_token(token: str) -> dict:
    settings = get_settings()
    try:
        return jwt.decode(
            token, settings.jwt_secret, algorithms=[settings.jwt_algorithm]
        )
    except jwt.ExpiredSignatureError as exc:
        raise AppError("unauthorized", "Token has expired", status_code=401) from exc
    except jwt.InvalidTokenError as exc:
        raise AppError("unauthorized", "Invalid token", status_code=401) from exc
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && .venv/Scripts/python -m pytest tests/test_security.py -v`
Expected: PASS (6 passed). (A benign passlib "reading bcrypt version" log line may be captured by pytest but does not fail the run.)

- [ ] **Step 5: Commit**

```bash
git add backend/app/core/security.py backend/tests/test_security.py
git commit -m "feat(backend): add JWT token and bcrypt password security"
```

---

### Task 3: User + UserCause models, portable enums, and identity util

**Files:**
- Create: `backend/app/models/enums.py`, `backend/app/models/user.py`
- Create: `backend/app/utils/__init__.py` (empty), `backend/app/utils/identity.py`
- Modify: `backend/app/models/__init__.py` (register models)
- Test: `backend/tests/test_models.py`

**Interfaces:**
- Consumes: `app.db.base.Base`.
- Produces:
  - `app.models.enums.UserRole(StrEnum)` — members `se`, `np_admin`, `platform_admin`, `guest_lead`.
  - `app.models.enums.UserStatus(StrEnum)` — members `active`, `suspended`, `pending`.
  - `app.models.user.User` — columns per spec §4 (integer PK, nullable unique `email`, nullable `phone`/`password_hash`/`bio`/`city`/`avatar_media_id`, `role`/`name`/`initials`/`color`/`status` non-null, `created_at`), relationship `causes` (selectin, cascade delete-orphan).
  - `app.models.user.UserCause` — `id`, `user_id` FK→`users.id` (CASCADE), `cause` string.
  - `app.utils.identity.derive_initials(name: str) -> str`, `app.utils.identity.pick_color(name: str) -> str`.

- [ ] **Step 1: Write the failing test `backend/tests/test_models.py`**

```python
import pytest
from sqlalchemy import select

from app.models.enums import UserRole, UserStatus
from app.models.user import User, UserCause
from app.utils.identity import derive_initials, pick_color


def test_user_role_enum_values():
    assert set(UserRole) == {
        UserRole.se,
        UserRole.np_admin,
        UserRole.platform_admin,
        UserRole.guest_lead,
    }
    assert UserRole.se == "se"
    assert UserStatus.active == "active"


def test_derive_initials():
    assert derive_initials("Mike Rivera") == "MR"
    assert derive_initials("Jane") == "JA"
    assert derive_initials("  ") == "?"


def test_pick_color_is_deterministic_hex():
    c = pick_color("Mike Rivera")
    assert c.startswith("#") and len(c) == 7
    assert pick_color("Mike Rivera") == c


@pytest.mark.asyncio
async def test_persist_user_with_causes(db_session):
    user = User(
        role="se",
        email="mike@example.com",
        phone=None,
        password_hash="x",
        name="Mike Rivera",
        initials="MR",
        color="#C62828",
        status="active",
    )
    user.causes.append(UserCause(cause="Environment"))
    user.causes.append(UserCause(cause="Education"))
    db_session.add(user)
    await db_session.commit()

    fetched = (
        await db_session.execute(select(User).where(User.email == "mike@example.com"))
    ).scalar_one()
    assert fetched.id is not None
    assert fetched.avatar_media_id is None
    assert {c.cause for c in fetched.causes} == {"Environment", "Education"}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && .venv/Scripts/python -m pytest tests/test_models.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'app.models.enums'`.

- [ ] **Step 3: Implement `backend/app/models/enums.py`**

```python
from enum import StrEnum


class UserRole(StrEnum):
    se = "se"
    np_admin = "np_admin"
    platform_admin = "platform_admin"
    guest_lead = "guest_lead"


class UserStatus(StrEnum):
    active = "active"
    suspended = "suspended"
    pending = "pending"
```

- [ ] **Step 4: Implement `backend/app/utils/__init__.py` (empty) and `backend/app/utils/identity.py`**

```python
PALETTE = [
    "#C62828",
    "#7C3AED",
    "#F5604A",
    "#2C4B6E",
    "#1A2F48",
    "#00897B",
    "#5E35B1",
    "#EF6C00",
]


def derive_initials(name: str) -> str:
    parts = [p for p in (name or "").strip().split() if p]
    if not parts:
        return "?"
    if len(parts) == 1:
        return parts[0][:2].upper()
    return (parts[0][0] + parts[-1][0]).upper()


def pick_color(name: str) -> str:
    if not name:
        return PALETTE[0]
    idx = sum(ord(ch) for ch in name) % len(PALETTE)
    return PALETTE[idx]
```

- [ ] **Step 5: Implement `backend/app/models/user.py`**

```python
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    role: Mapped[str] = mapped_column(String(32), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    initials: Mapped[str] = mapped_column(String(8), nullable=False)
    color: Mapped[str] = mapped_column(String(16), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active")
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    city: Mapped[str | None] = mapped_column(String(120), nullable=True)
    # avatar_media_id: forward reference to a future media_assets table.
    # Plain nullable integer, NO foreign key yet (media is a later phase).
    avatar_media_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False
    )

    causes: Mapped[list["UserCause"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class UserCause(Base):
    __tablename__ = "user_causes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    cause: Mapped[str] = mapped_column(String(80), nullable=False)

    user: Mapped["User"] = relationship(back_populates="causes")
```

- [ ] **Step 6: Update `backend/app/models/__init__.py` to register the models**

```python
from app.models.user import User, UserCause

__all__ = ["User", "UserCause"]
```

- [ ] **Step 7: Run test to verify it passes**

Run: `cd backend && .venv/Scripts/python -m pytest tests/test_models.py -v`
Expected: PASS (4 passed).

- [ ] **Step 8: Commit**

```bash
git add backend/app/models/enums.py backend/app/models/user.py backend/app/models/__init__.py backend/app/utils backend/tests/test_models.py
git commit -m "feat(backend): add User/UserCause models, role enums, and identity util"
```

---

### Task 4: User repository (async DB access)

**Files:**
- Create: `backend/app/repositories/__init__.py` (empty), `backend/app/repositories/user_repository.py`
- Test: `backend/tests/test_user_repository.py`

**Interfaces:**
- Consumes: `app.models.user.User`, `app.models.user.UserCause`.
- Produces (all in `app.repositories.user_repository`, all `async`):
  - `get_by_id(db: AsyncSession, user_id: int) -> User | None`
  - `get_by_email(db: AsyncSession, email: str) -> User | None`
  - `get_by_phone(db: AsyncSession, phone: str) -> User | None` (needed by the identity gate)
  - `create(db: AsyncSession, **fields) -> User`
  - `update(db: AsyncSession, user: User, **fields) -> User`
  - `set_causes(db: AsyncSession, user: User, causes: list[str]) -> User` (replaces all cause rows)

- [ ] **Step 1: Write the failing test `backend/tests/test_user_repository.py`**

```python
import pytest

from app.repositories import user_repository


@pytest.mark.asyncio
async def test_create_and_get_by_id_email_phone(db_session):
    user = await user_repository.create(
        db_session,
        role="se",
        email="a@example.com",
        phone="+15550001",
        password_hash="h",
        name="Ada Lovelace",
        initials="AL",
        color="#C62828",
        status="active",
    )
    assert user.id is not None
    assert (await user_repository.get_by_id(db_session, user.id)).email == "a@example.com"
    assert (await user_repository.get_by_email(db_session, "a@example.com")).id == user.id
    assert (await user_repository.get_by_phone(db_session, "+15550001")).id == user.id
    assert await user_repository.get_by_email(db_session, "missing@example.com") is None


@pytest.mark.asyncio
async def test_update_fields(db_session):
    user = await user_repository.create(
        db_session,
        role="se",
        email="b@example.com",
        password_hash="h",
        name="Grace Hopper",
        initials="GH",
        color="#7C3AED",
        status="active",
    )
    updated = await user_repository.update(db_session, user, bio="Hello", city="NYC")
    assert updated.bio == "Hello"
    assert updated.city == "NYC"


@pytest.mark.asyncio
async def test_set_causes_replaces(db_session):
    user = await user_repository.create(
        db_session,
        role="se",
        email="c@example.com",
        password_hash="h",
        name="Cause Person",
        initials="CP",
        color="#00897B",
        status="active",
    )
    await user_repository.set_causes(db_session, user, ["Environment", "Education"])
    assert {c.cause for c in user.causes} == {"Environment", "Education"}
    await user_repository.set_causes(db_session, user, ["Health"])
    assert {c.cause for c in user.causes} == {"Health"}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && .venv/Scripts/python -m pytest tests/test_user_repository.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'app.repositories.user_repository'`.

- [ ] **Step 3: Implement `backend/app/repositories/__init__.py` (empty) and `backend/app/repositories/user_repository.py`**

```python
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, UserCause


async def get_by_id(db: AsyncSession, user_id: int) -> User | None:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def get_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def get_by_phone(db: AsyncSession, phone: str) -> User | None:
    result = await db.execute(select(User).where(User.phone == phone))
    return result.scalar_one_or_none()


async def create(db: AsyncSession, **fields) -> User:
    user = User(**fields)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def update(db: AsyncSession, user: User, **fields) -> User:
    for key, value in fields.items():
        setattr(user, key, value)
    await db.commit()
    await db.refresh(user)
    return user


async def set_causes(db: AsyncSession, user: User, causes: list[str]) -> User:
    user.causes.clear()
    for cause in causes:
        user.causes.append(UserCause(cause=cause))
    await db.commit()
    await db.refresh(user)
    return user
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && .venv/Scripts/python -m pytest tests/test_user_repository.py -v`
Expected: PASS (3 passed).

- [ ] **Step 5: Commit**

```bash
git add backend/app/repositories backend/tests/test_user_repository.py
git commit -m "feat(backend): add async user repository"
```

---

### Task 5: Auth + user schemas and auth service

**Files:**
- Create: `backend/app/schemas/__init__.py` (empty), `backend/app/schemas/auth.py`, `backend/app/schemas/user.py`
- Create: `backend/app/services/__init__.py` (empty), `backend/app/services/auth_service.py`
- Test: `backend/tests/test_auth_service.py`

**Interfaces:**
- Consumes: `app.repositories.user_repository`, `app.core.security`, `app.core.exceptions.AppError`, `app.utils.identity`.
- Produces (schemas, Pydantic v2):
  - `app.schemas.auth.RegisterRequest{name: str, email: str, password: str(min 8), role: str="se"}` — role restricted to `se|np_admin`.
  - `app.schemas.auth.LoginRequest{email: str, password: str}`
  - `app.schemas.auth.RefreshRequest{refresh_token: str}`
  - `app.schemas.auth.IdentityGateRequest{email: str|None, phone: str|None, name: str|None}` — at least one of email/phone required.
  - `app.schemas.auth.GoogleMockRequest{email: str|None, name: str|None}`
  - `app.schemas.auth.TokenResponse{access_token: str, refresh_token: str, token_type: str="bearer"}`
  - `app.schemas.user.UserRead` (`from_attributes`, flattens `causes` to `list[str]`) and `app.schemas.user.ProfileUpdateRequest{name, bio, city, causes, avatar_media_id — all optional}`.
- Produces (`app.services.auth_service`, async unless noted):
  - `register(db, name, email, password, role) -> User`
  - `authenticate(db, email, password) -> User`
  - `issue_tokens(user) -> dict` (sync)
  - `login(db, email, password) -> dict`
  - `refresh(db, refresh_token) -> dict`
  - `identity_gate(db, email, phone, name) -> tuple[User, dict]`
  - `google_mock(db, email, name) -> tuple[User, dict]`

- [ ] **Step 1: Write the failing test `backend/tests/test_auth_service.py`**

```python
import pytest

from app.core.exceptions import AppError
from app.core.security import decode_token
from app.schemas.auth import IdentityGateRequest, RegisterRequest
from app.schemas.user import UserRead
from app.services import auth_service


def test_register_request_rejects_privileged_role():
    with pytest.raises(ValueError):
        RegisterRequest(name="X", email="x@e.com", password="Passw0rd!", role="platform_admin")
    with pytest.raises(ValueError):
        RegisterRequest(name="X", email="x@e.com", password="Passw0rd!", role="guest_lead")
    ok = RegisterRequest(name="X", email="x@e.com", password="Passw0rd!", role="np_admin")
    assert ok.role == "np_admin"


def test_identity_gate_request_requires_email_or_phone():
    with pytest.raises(ValueError):
        IdentityGateRequest()
    assert IdentityGateRequest(phone="+15550001").phone == "+15550001"


def test_user_read_flattens_causes():
    class _Cause:
        def __init__(self, c):
            self.cause = c

    class _User:
        id = 1
        role = "se"
        email = "m@e.com"
        phone = None
        name = "Mike"
        initials = "MI"
        color = "#C62828"
        status = "active"
        bio = None
        city = None
        avatar_media_id = None
        causes = [_Cause("Environment"), _Cause("Education")]

    read = UserRead.model_validate(_User())
    assert read.causes == ["Environment", "Education"]


@pytest.mark.asyncio
async def test_register_then_login(db_session):
    user = await auth_service.register(
        db_session, name="Mike Rivera", email="mike@e.com", password="Passw0rd!", role="se"
    )
    assert user.role == "se"
    assert user.initials == "MR"
    tokens = await auth_service.login(db_session, "mike@e.com", "Passw0rd!")
    assert tokens["token_type"] == "bearer"
    assert decode_token(tokens["access_token"])["sub"] == str(user.id)


@pytest.mark.asyncio
async def test_register_duplicate_email_conflict(db_session):
    await auth_service.register(db_session, name="A", email="dup@e.com", password="Passw0rd!", role="se")
    with pytest.raises(AppError) as exc:
        await auth_service.register(db_session, name="B", email="dup@e.com", password="Passw0rd!", role="se")
    assert exc.value.status_code == 409


@pytest.mark.asyncio
async def test_login_bad_credentials(db_session):
    await auth_service.register(db_session, name="A", email="a@e.com", password="Passw0rd!", role="se")
    with pytest.raises(AppError) as exc:
        await auth_service.login(db_session, "a@e.com", "wrong")
    assert exc.value.status_code == 401


@pytest.mark.asyncio
async def test_refresh_issues_new_access(db_session):
    user = await auth_service.register(db_session, name="A", email="r@e.com", password="Passw0rd!", role="se")
    tokens = await auth_service.login(db_session, "r@e.com", "Passw0rd!")
    refreshed = await auth_service.refresh(db_session, tokens["refresh_token"])
    assert decode_token(refreshed["access_token"])["type"] == "access"
    assert decode_token(refreshed["access_token"])["sub"] == str(user.id)


@pytest.mark.asyncio
async def test_refresh_rejects_access_token(db_session):
    await auth_service.register(db_session, name="A", email="ra@e.com", password="Passw0rd!", role="se")
    tokens = await auth_service.login(db_session, "ra@e.com", "Passw0rd!")
    with pytest.raises(AppError) as exc:
        await auth_service.refresh(db_session, tokens["access_token"])
    assert exc.value.status_code == 401


@pytest.mark.asyncio
async def test_identity_gate_creates_then_reuses_guest_lead(db_session):
    user1, tokens1 = await auth_service.identity_gate(db_session, email=None, phone="+15550009", name=None)
    assert user1.role == "guest_lead"
    assert tokens1["access_token"]
    user2, _ = await auth_service.identity_gate(db_session, email=None, phone="+15550009", name=None)
    assert user2.id == user1.id


@pytest.mark.asyncio
async def test_google_mock_creates_se(db_session):
    user, tokens = await auth_service.google_mock(db_session, email="mike.rivera@demo.charityhub.com", name="Mike Rivera")
    assert user.role == "se"
    assert tokens["token_type"] == "bearer"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && .venv/Scripts/python -m pytest tests/test_auth_service.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'app.schemas.auth'`.

- [ ] **Step 3: Implement `backend/app/schemas/__init__.py` (empty) and `backend/app/schemas/auth.py`**

```python
from pydantic import BaseModel, Field, field_validator, model_validator


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str = Field(min_length=8)
    role: str = "se"

    @field_validator("role")
    @classmethod
    def _validate_role(cls, v: str) -> str:
        if v not in ("se", "np_admin"):
            raise ValueError("role must be 'se' or 'np_admin'")
        return v


class LoginRequest(BaseModel):
    email: str
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class IdentityGateRequest(BaseModel):
    email: str | None = None
    phone: str | None = None
    name: str | None = None

    @model_validator(mode="after")
    def _require_email_or_phone(self):
        if not self.email and not self.phone:
            raise ValueError("email or phone is required")
        return self


class GoogleMockRequest(BaseModel):
    email: str | None = None
    name: str | None = None


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
```

- [ ] **Step 4: Implement `backend/app/schemas/user.py`**

```python
from pydantic import BaseModel, ConfigDict, field_validator


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    role: str
    email: str | None = None
    phone: str | None = None
    name: str
    initials: str
    color: str
    status: str
    bio: str | None = None
    city: str | None = None
    avatar_media_id: int | None = None
    causes: list[str] = []

    @field_validator("causes", mode="before")
    @classmethod
    def _flatten_causes(cls, v):
        out: list[str] = []
        for item in v or []:
            out.append(item.cause if hasattr(item, "cause") else item)
        return out


class ProfileUpdateRequest(BaseModel):
    name: str | None = None
    bio: str | None = None
    city: str | None = None
    causes: list[str] | None = None
    avatar_media_id: int | None = None
```

- [ ] **Step 5: Implement `backend/app/services/__init__.py` (empty) and `backend/app/services/auth_service.py`**

```python
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppError
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.repositories import user_repository
from app.utils.identity import derive_initials, pick_color


def issue_tokens(user: User) -> dict:
    return {
        "access_token": create_access_token(
            subject=str(user.id), extra={"role": user.role}
        ),
        "refresh_token": create_refresh_token(subject=str(user.id)),
        "token_type": "bearer",
    }


async def register(
    db: AsyncSession, name: str, email: str, password: str, role: str
) -> User:
    if await user_repository.get_by_email(db, email):
        raise AppError("conflict", "Email already registered", status_code=409)
    return await user_repository.create(
        db,
        role=role,
        email=email,
        phone=None,
        password_hash=hash_password(password),
        name=name,
        initials=derive_initials(name),
        color=pick_color(name),
        status="active",
    )


async def authenticate(db: AsyncSession, email: str, password: str) -> User:
    user = await user_repository.get_by_email(db, email)
    if not user or not user.password_hash or not verify_password(
        password, user.password_hash
    ):
        raise AppError("unauthorized", "Invalid credentials", status_code=401)
    return user


async def login(db: AsyncSession, email: str, password: str) -> dict:
    user = await authenticate(db, email, password)
    return issue_tokens(user)


async def refresh(db: AsyncSession, refresh_token: str) -> dict:
    claims = decode_token(refresh_token)
    if claims.get("type") != "refresh":
        raise AppError("unauthorized", "Invalid refresh token", status_code=401)
    user = await user_repository.get_by_id(db, int(claims["sub"]))
    if not user:
        raise AppError("unauthorized", "User not found", status_code=401)
    return {
        "access_token": create_access_token(
            subject=str(user.id), extra={"role": user.role}
        ),
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


async def identity_gate(
    db: AsyncSession, email: str | None, phone: str | None, name: str | None
) -> tuple[User, dict]:
    user = None
    if email:
        user = await user_repository.get_by_email(db, email)
    if not user and phone:
        user = await user_repository.get_by_phone(db, phone)
    if not user:
        display = name or (email.split("@")[0] if email else "Guest")
        user = await user_repository.create(
            db,
            role="guest_lead",
            email=email,
            phone=phone,
            password_hash=None,
            name=display,
            initials=derive_initials(display),
            color=pick_color(display),
            status="active",
        )
    return user, issue_tokens(user)


async def google_mock(
    db: AsyncSession, email: str | None, name: str | None
) -> tuple[User, dict]:
    email = email or "mike.rivera@demo.charityhub.com"
    user = await user_repository.get_by_email(db, email)
    if not user:
        display = name or "Mike Rivera"
        user = await user_repository.create(
            db,
            role="se",
            email=email,
            phone=None,
            password_hash=None,
            name=display,
            initials=derive_initials(display),
            color=pick_color(display),
            status="active",
        )
    return user, issue_tokens(user)
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd backend && .venv/Scripts/python -m pytest tests/test_auth_service.py -v`
Expected: PASS (10 passed).

- [ ] **Step 7: Commit**

```bash
git add backend/app/schemas backend/app/services backend/tests/test_auth_service.py
git commit -m "feat(backend): add auth/user schemas and auth service"
```

---

### Task 6: Auth & RBAC dependencies

**Files:**
- Create: `backend/app/api/deps.py`
- Test: `backend/tests/test_deps.py`

**Interfaces:**
- Consumes: `app.db.session.get_db`, `app.core.security.decode_token`, `app.core.exceptions.AppError`, `app.repositories.user_repository`, `app.models.user.User`.
- Produces (all in `app.api.deps`):
  - `get_current_user(request: Request, db: AsyncSession = Depends(get_db)) -> User` — parses `Authorization: Bearer`, decodes access token (401 on missing/invalid/wrong-type), loads user (401 if not found).
  - `get_current_user_optional(request, db) -> User | None` — returns `None` instead of raising.
  - `require_role(*roles: str)` — returns an async dependency that yields the current user or raises `AppError("forbidden", ..., 403)`.

- [ ] **Step 1: Write the failing test `backend/tests/test_deps.py`**

```python
import pytest
from starlette.requests import Request

from app.api.deps import (
    get_current_user,
    get_current_user_optional,
    require_role,
)
from app.core.exceptions import AppError
from app.core.security import create_access_token, create_refresh_token


def _request(headers: dict) -> Request:
    scope = {
        "type": "http",
        "headers": [(k.lower().encode(), v.encode()) for k, v in headers.items()],
    }
    return Request(scope)


@pytest.mark.asyncio
async def test_get_current_user_happy(db_session, make_user):
    user = await make_user(role="se", email="d1@e.com")
    req = _request({"Authorization": f"Bearer {create_access_token(str(user.id))}"})
    resolved = await get_current_user(req, db_session)
    assert resolved.id == user.id


@pytest.mark.asyncio
async def test_get_current_user_missing_header_401(db_session):
    with pytest.raises(AppError) as exc:
        await get_current_user(_request({}), db_session)
    assert exc.value.status_code == 401


@pytest.mark.asyncio
async def test_get_current_user_rejects_refresh_token(db_session, make_user):
    user = await make_user(email="d2@e.com")
    req = _request({"Authorization": f"Bearer {create_refresh_token(str(user.id))}"})
    with pytest.raises(AppError) as exc:
        await get_current_user(req, db_session)
    assert exc.value.status_code == 401


@pytest.mark.asyncio
async def test_get_current_user_optional_returns_none(db_session):
    assert await get_current_user_optional(_request({}), db_session) is None
    bad = _request({"Authorization": "Bearer garbage"})
    assert await get_current_user_optional(bad, db_session) is None


@pytest.mark.asyncio
async def test_require_role_allows_and_blocks(make_user):
    se_user = await make_user(role="se", email="d3@e.com")
    dep = require_role("se", "platform_admin")
    assert (await dep(user=se_user)).id == se_user.id

    guest = await make_user(role="guest_lead", email="d4@e.com", password=None)
    with pytest.raises(AppError) as exc:
        await dep(user=guest)
    assert exc.value.status_code == 403
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && .venv/Scripts/python -m pytest tests/test_deps.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'app.api.deps'`.

- [ ] **Step 3: Implement `backend/app/api/deps.py`**

```python
from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppError
from app.core.security import decode_token
from app.db.session import get_db
from app.models.user import User
from app.repositories import user_repository


def _extract_bearer(request: Request) -> str | None:
    auth = request.headers.get("authorization")
    if not auth or not auth.lower().startswith("bearer "):
        return None
    return auth.split(" ", 1)[1].strip()


async def get_current_user(
    request: Request, db: AsyncSession = Depends(get_db)
) -> User:
    token = _extract_bearer(request)
    if not token:
        raise AppError("unauthorized", "Not authenticated", status_code=401)
    claims = decode_token(token)
    if claims.get("type") != "access":
        raise AppError("unauthorized", "Invalid access token", status_code=401)
    user = await user_repository.get_by_id(db, int(claims["sub"]))
    if not user:
        raise AppError("unauthorized", "User not found", status_code=401)
    return user


async def get_current_user_optional(
    request: Request, db: AsyncSession = Depends(get_db)
) -> User | None:
    token = _extract_bearer(request)
    if not token:
        return None
    try:
        claims = decode_token(token)
    except AppError:
        return None
    if claims.get("type") != "access":
        return None
    return await user_repository.get_by_id(db, int(claims["sub"]))


def require_role(*roles: str):
    async def _dependency(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise AppError(
                "forbidden", "Insufficient permissions", status_code=403
            )
        return user

    return _dependency
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && .venv/Scripts/python -m pytest tests/test_deps.py -v`
Expected: PASS (5 passed).

- [ ] **Step 5: Commit**

```bash
git add backend/app/api/deps.py backend/tests/test_deps.py
git commit -m "feat(backend): add get_current_user, optional, and require_role deps"
```

---

### Task 7: Auth router

**Files:**
- Create: `backend/app/api/v1/auth.py`
- Modify: `backend/app/api/v1/__init__.py` (mount the auth router)
- Test: `backend/tests/test_auth_api.py`

**Interfaces:**
- Consumes: `app.db.session.get_db`, `app.api.deps.get_current_user`, `app.services.auth_service`, `app.schemas.auth.*`, `app.schemas.user.UserRead`.
- Produces: `app.api.v1.auth.router` (`APIRouter(prefix="/auth")`) with:
  - `POST /api/v1/auth/register` → 201, `UserRead`
  - `POST /api/v1/auth/login` → `TokenResponse`
  - `POST /api/v1/auth/refresh` → `TokenResponse`
  - `POST /api/v1/auth/logout` → `{"status": "ok"}`
  - `GET /api/v1/auth/me` → `UserRead` (auth required)
  - `POST /api/v1/auth/identity-gate` → `TokenResponse`
  - `POST /api/v1/auth/google` → `TokenResponse`

- [ ] **Step 1: Write the failing test `backend/tests/test_auth_api.py`**

```python
import pytest


@pytest.mark.asyncio
async def test_register_login_me_flow(client):
    reg = await client.post(
        "/api/v1/auth/register",
        json={"name": "Mike Rivera", "email": "mike@e.com", "password": "Passw0rd!", "role": "se"},
    )
    assert reg.status_code == 201
    body = reg.json()
    assert body["role"] == "se"
    assert body["initials"] == "MR"
    assert body["causes"] == []

    login = await client.post(
        "/api/v1/auth/login", json={"email": "mike@e.com", "password": "Passw0rd!"}
    )
    assert login.status_code == 200
    tokens = login.json()
    assert tokens["token_type"] == "bearer"

    me = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {tokens['access_token']}"},
    )
    assert me.status_code == 200
    assert me.json()["email"] == "mike@e.com"


@pytest.mark.asyncio
async def test_register_rejects_privileged_role_422(client):
    resp = await client.post(
        "/api/v1/auth/register",
        json={"name": "X", "email": "x@e.com", "password": "Passw0rd!", "role": "platform_admin"},
    )
    assert resp.status_code == 422
    assert resp.json()["error"]["code"] == "validation_error"


@pytest.mark.asyncio
async def test_register_duplicate_409(client):
    payload = {"name": "A", "email": "dup@e.com", "password": "Passw0rd!", "role": "se"}
    await client.post("/api/v1/auth/register", json=payload)
    resp = await client.post("/api/v1/auth/register", json=payload)
    assert resp.status_code == 409
    assert resp.json()["error"]["code"] == "conflict"


@pytest.mark.asyncio
async def test_login_bad_credentials_401(client):
    await client.post(
        "/api/v1/auth/register",
        json={"name": "A", "email": "a@e.com", "password": "Passw0rd!", "role": "se"},
    )
    resp = await client.post(
        "/api/v1/auth/login", json={"email": "a@e.com", "password": "nope"}
    )
    assert resp.status_code == 401
    assert resp.json()["error"]["code"] == "unauthorized"


@pytest.mark.asyncio
async def test_me_requires_auth_401(client):
    resp = await client.get("/api/v1/auth/me")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_refresh_returns_new_access(client):
    await client.post(
        "/api/v1/auth/register",
        json={"name": "A", "email": "r@e.com", "password": "Passw0rd!", "role": "se"},
    )
    tokens = (
        await client.post(
            "/api/v1/auth/login", json={"email": "r@e.com", "password": "Passw0rd!"}
        )
    ).json()
    resp = await client.post(
        "/api/v1/auth/refresh", json={"refresh_token": tokens["refresh_token"]}
    )
    assert resp.status_code == 200
    assert resp.json()["access_token"]


@pytest.mark.asyncio
async def test_identity_gate_phone_creates_guest(client):
    resp = await client.post("/api/v1/auth/identity-gate", json={"phone": "+15550009"})
    assert resp.status_code == 200
    assert resp.json()["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_identity_gate_requires_email_or_phone_422(client):
    resp = await client.post("/api/v1/auth/identity-gate", json={})
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_google_mock_returns_tokens(client):
    resp = await client.post(
        "/api/v1/auth/google", json={"email": "mike.rivera@demo.charityhub.com", "name": "Mike Rivera"}
    )
    assert resp.status_code == 200
    assert resp.json()["access_token"]


@pytest.mark.asyncio
async def test_logout_ok(client):
    resp = await client.post("/api/v1/auth/logout")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && .venv/Scripts/python -m pytest tests/test_auth_api.py -v`
Expected: FAIL — routes return 404 (auth router not mounted yet) / import error.

- [ ] **Step 3: Implement `backend/app/api/v1/auth.py`**

```python
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import (
    GoogleMockRequest,
    IdentityGateRequest,
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
)
from app.schemas.user import UserRead
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserRead, status_code=201)
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_db)):
    return await auth_service.register(
        db, payload.name, payload.email, payload.password, payload.role
    )


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    return await auth_service.login(db, payload.email, payload.password)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(payload: RefreshRequest, db: AsyncSession = Depends(get_db)):
    return await auth_service.refresh(db, payload.refresh_token)


@router.post("/logout")
async def logout():
    return {"status": "ok"}


@router.get("/me", response_model=UserRead)
async def me(user: User = Depends(get_current_user)):
    return user


@router.post("/identity-gate", response_model=TokenResponse)
async def identity_gate(
    payload: IdentityGateRequest, db: AsyncSession = Depends(get_db)
):
    _user, tokens = await auth_service.identity_gate(
        db, payload.email, payload.phone, payload.name
    )
    return tokens


@router.post("/google", response_model=TokenResponse)
async def google(payload: GoogleMockRequest, db: AsyncSession = Depends(get_db)):
    _user, tokens = await auth_service.google_mock(db, payload.email, payload.name)
    return tokens
```

- [ ] **Step 4: Update `backend/app/api/v1/__init__.py` to mount the auth router** (users router mounted in Task 8)

```python
from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.health import router as health_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(health_router)
api_router.include_router(auth_router)
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd backend && .venv/Scripts/python -m pytest tests/test_auth_api.py -v`
Expected: PASS (10 passed).

- [ ] **Step 6: Commit**

```bash
git add backend/app/api/v1/auth.py backend/app/api/v1/__init__.py backend/tests/test_auth_api.py
git commit -m "feat(backend): add auth router (register/login/refresh/me/identity-gate/google)"
```

---

### Task 8: User service and profile router

**Files:**
- Create: `backend/app/services/user_service.py`, `backend/app/api/v1/users.py`
- Modify: `backend/app/api/v1/__init__.py` (mount the users router)
- Test: `backend/tests/test_users_api.py`

**Interfaces:**
- Consumes: `app.repositories.user_repository`, `app.api.deps.get_current_user`, `app.db.session.get_db`, `app.schemas.user.{UserRead, ProfileUpdateRequest}`.
- Produces:
  - `app.services.user_service.get_profile(db, user) -> User` (async)
  - `app.services.user_service.update_profile(db, user, name=None, bio=None, city=None, causes=None, avatar_media_id=None) -> User` (async)
  - `app.api.v1.users.router` (`APIRouter(prefix="/me")`):
    - `GET /api/v1/me/profile` → `UserRead` (auth required)
    - `PATCH /api/v1/me/profile` → `UserRead` (auth required)

- [ ] **Step 1: Write the failing test `backend/tests/test_users_api.py`**

```python
import pytest


async def _register_and_login(client, email="p@e.com"):
    await client.post(
        "/api/v1/auth/register",
        json={"name": "Profile User", "email": email, "password": "Passw0rd!", "role": "se"},
    )
    tokens = (
        await client.post(
            "/api/v1/auth/login", json={"email": email, "password": "Passw0rd!"}
        )
    ).json()
    return {"Authorization": f"Bearer {tokens['access_token']}"}


@pytest.mark.asyncio
async def test_get_profile(client):
    headers = await _register_and_login(client)
    resp = await client.get("/api/v1/me/profile", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["name"] == "Profile User"


@pytest.mark.asyncio
async def test_get_profile_requires_auth_401(client):
    resp = await client.get("/api/v1/me/profile")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_patch_profile_updates_fields_and_causes(client):
    headers = await _register_and_login(client, email="p2@e.com")
    resp = await client.patch(
        "/api/v1/me/profile",
        headers=headers,
        json={
            "bio": "Building change",
            "city": "Austin",
            "causes": ["Environment", "Education"],
            "avatar_media_id": 5,
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["bio"] == "Building change"
    assert body["city"] == "Austin"
    assert body["avatar_media_id"] == 5
    assert sorted(body["causes"]) == ["Education", "Environment"]


@pytest.mark.asyncio
async def test_patch_profile_replaces_causes(client):
    headers = await _register_and_login(client, email="p3@e.com")
    await client.patch(
        "/api/v1/me/profile", headers=headers, json={"causes": ["Environment"]}
    )
    resp = await client.patch(
        "/api/v1/me/profile", headers=headers, json={"causes": ["Health"]}
    )
    assert resp.json()["causes"] == ["Health"]
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && .venv/Scripts/python -m pytest tests/test_users_api.py -v`
Expected: FAIL — `/api/v1/me/profile` returns 404 (router not mounted) / import error.

- [ ] **Step 3: Implement `backend/app/services/user_service.py`**

```python
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.repositories import user_repository


async def get_profile(db: AsyncSession, user: User) -> User:
    return user


async def update_profile(
    db: AsyncSession,
    user: User,
    name: str | None = None,
    bio: str | None = None,
    city: str | None = None,
    causes: list[str] | None = None,
    avatar_media_id: int | None = None,
) -> User:
    fields: dict = {}
    if name is not None:
        fields["name"] = name
    if bio is not None:
        fields["bio"] = bio
    if city is not None:
        fields["city"] = city
    if avatar_media_id is not None:
        fields["avatar_media_id"] = avatar_media_id
    if fields:
        user = await user_repository.update(db, user, **fields)
    if causes is not None:
        user = await user_repository.set_causes(db, user, causes)
    return user
```

- [ ] **Step 4: Implement `backend/app/api/v1/users.py`**

```python
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import ProfileUpdateRequest, UserRead
from app.services import user_service

router = APIRouter(prefix="/me", tags=["users"])


@router.get("/profile", response_model=UserRead)
async def get_profile(user: User = Depends(get_current_user)):
    return user


@router.patch("/profile", response_model=UserRead)
async def update_profile(
    payload: ProfileUpdateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await user_service.update_profile(
        db,
        user,
        name=payload.name,
        bio=payload.bio,
        city=payload.city,
        causes=payload.causes,
        avatar_media_id=payload.avatar_media_id,
    )
```

- [ ] **Step 5: Update `backend/app/api/v1/__init__.py` to also mount the users router**

```python
from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.health import router as health_router
from app.api.v1.users import router as users_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(users_router)
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd backend && .venv/Scripts/python -m pytest tests/test_users_api.py -v`
Expected: PASS (4 passed).

- [ ] **Step 7: Run the FULL suite to confirm the whole phase is green**

Run: `cd backend && .venv/Scripts/python -m pytest -v`
Expected: PASS (all Phase 1 + Phase 2 tests). Output pristine.

- [ ] **Step 8: Commit**

```bash
git add backend/app/services/user_service.py backend/app/api/v1/users.py backend/app/api/v1/__init__.py backend/tests/test_users_api.py
git commit -m "feat(backend): add user service and profile router"
```

---

### Task 9: Alembic migration 0001_users (Supabase deploy only)

**Files:**
- Create: `backend/alembic/versions/0001_users.py`

**Interfaces:**
- Produces: a handwritten Alembic revision `0001_users` (down_revision `None`) creating `users` + `user_causes`, mirroring the Task 3 models. **This migration targets Supabase Postgres and is validated against Supabase later — it is NOT executed by the SQLite test suite.** The test suite continues to build schema via `Base.metadata.create_all` (Task 1).

- [ ] **Step 1: Write `backend/alembic/versions/0001_users.py`**

```python
"""users and user_causes

Revision ID: 0001_users
Revises:
Create Date: 2026-07-23
"""
from alembic import op
import sqlalchemy as sa

revision = "0001_users"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("role", sa.String(length=32), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("phone", sa.String(length=32), nullable=True),
        sa.Column("password_hash", sa.String(length=255), nullable=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("initials", sa.String(length=8), nullable=False),
        sa.Column("color", sa.String(length=16), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("city", sa.String(length=120), nullable=True),
        sa.Column("avatar_media_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id", name="pk_users"),
        sa.UniqueConstraint("email", name="uq_users_email"),
    )
    op.create_table(
        "user_causes",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("cause", sa.String(length=80), nullable=False),
        sa.PrimaryKeyConstraint("id", name="pk_user_causes"),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name="fk_user_causes_user_id_users",
            ondelete="CASCADE",
        ),
    )


def downgrade() -> None:
    op.drop_table("user_causes")
    op.drop_table("users")
```

- [ ] **Step 2: Verify the migration script parses and is discoverable as a head** (no DB connection required; this does NOT run the migration)

Run: `cd backend && .venv/Scripts/python -c "from alembic.config import Config; from alembic.script import ScriptDirectory; sd = ScriptDirectory.from_config(Config('alembic.ini')); print([s.revision for s in sd.walk_revisions()]); print('head:', sd.get_current_head())"`
Expected: prints `['0001_users']` and `head: 0001_users`.

- [ ] **Step 3: Confirm the test suite is unaffected (still SQLite create_all, migration not run)**

Run: `cd backend && .venv/Scripts/python -m pytest -v`
Expected: PASS (full suite unchanged from Task 8).

- [ ] **Step 4: Commit**

```bash
git add backend/alembic/versions/0001_users.py
git commit -m "feat(backend): add handwritten alembic migration 0001_users"
```

---

## Self-Review

**Spec coverage (Phase 2 slice of §4, §5, §6, §8):**
- Test infra: aiosqlite fresh-per-test engine, `get_db` override, `client`/`db_session`/`make_user`/`auth_header` fixtures → Task 1 (§8 decision). ✓
- Security: `hash_password`/`verify_password`, `create_access_token`/`create_refresh_token` with `type` claim, `decode_token` (401 on invalid/expired) → Task 2 (§5). ✓
- Models: `User` (all spec §4 columns incl. nullable unique email, nullable phone/password_hash/bio/city, plain nullable `avatar_media_id` with NO FK) + `UserCause`; portable enums via `StrEnum`; `derive_initials`/`pick_color` util → Task 3 (§4, portability §8). ✓
- Repository: `get_by_id`/`get_by_email`/`get_by_phone`/`create`/`update`/`set_causes` → Task 4. ✓
- Schemas: register (role restricted to se|np_admin), login, token response (bearer), identity-gate (email OR phone), user read, profile update → Task 5 (§6). ✓
- Auth service: register (rejects platform_admin/guest_lead via schema validation), authenticate+login→tokens, refresh→new access, identity_gate→create-or-get guest_lead, google_mock→SE session → Task 5 (§5). ✓
- Deps: `get_current_user`, `get_current_user_optional`, `require_role(*roles)` → Task 6 (§5). ✓
- Auth router: register/login/refresh/logout/me/identity-gate/google → Task 7 (§6). ✓
- User service + profile router: GET/PATCH `/me/profile` → Task 8 (§6). ✓
- Alembic 0001_users (Supabase-only, not run in tests) → Task 9. ✓
- Frontend parity: `role="se"` default + `np_admin` (accountRoles); TellAboutYou fields name/bio/city/photo/causes → ProfileUpdateRequest; identity gates capture phone (join/donate) → guest_lead creation; Google + email SE signup → `/auth/google` mock + register; Mike Rivera → initials "MR" asserted. ✓

**Out-of-scope confirmed absent:** no organizer/follow, notifications, nonprofits, events, media, or seeding endpoints. `avatar_media_id` is a plain nullable int with NO FK (commented in model + migration). ✓

**Placeholder scan:** every code step contains complete, runnable content — no TODO/TBD/"similar to above". The only `return {"status": "ok"}` stub is the intentional stateless `logout` (JWT is stateless; no server-side revocation this phase). Deferred imports inside `make_user`/`auth_header` are intentional (fixtures created before their target modules exist; they execute only in Phase 2 tests). ✓

**Type consistency across tasks:** `create_access_token`/`create_refresh_token`/`decode_token` signatures match between definition (Task 2) and all consumers (conftest, auth_service, deps, tests). `user_repository` function names match between definition (Task 4) and consumers (auth_service Task 5, deps Task 6, user_service Task 8). `UserRead`/`TokenResponse`/`ProfileUpdateRequest` match between schema definition (Task 5) and routers (Tasks 7, 8). `get_current_user`/`require_role` match between deps (Task 6) and routers (Tasks 7, 8). `get_db` import is the same object overridden in conftest and depended on in routers. `role` string values (`se`, `np_admin`, `platform_admin`, `guest_lead`) consistent across `UserRole` enum, schema validators, and service logic. ✓

**Environment/safety:** all test commands use `.venv/Scripts/python -m pytest`; no `pip install`; every Commit step stages only task-scoped `backend/...` paths (no `git add -A`). ✓

## Next phase

Phase 3 (Media — Cloudinary sign/persist/delete) builds on this auth layer: it will introduce the `media_assets` table, wire `avatar_media_id` and future entity media, and reuse `get_current_user`/`require_role` to protect upload signing. `avatar_media_id` remains a plain nullable int until then.
