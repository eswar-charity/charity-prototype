import inspect

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import Base
from app.db.session import SessionLocal, get_db


def test_base_has_naming_convention():
    assert Base.metadata.naming_convention["fk"].startswith("fk_")


def test_get_db_is_async_generator():
    assert inspect.isasyncgenfunction(get_db)


def test_sessionmaker_binds_async_session():
    assert SessionLocal.class_ is AsyncSession
