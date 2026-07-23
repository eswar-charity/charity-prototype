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
