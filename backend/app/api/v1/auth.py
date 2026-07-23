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
