from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.ratelimit import rate_limit
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import (
    AcceptInviteRequest,
    GoogleAuthRequest,
    IdentityGateRequest,
    LoginRequest,
    LogoutRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
)
from app.schemas.user import UserRead
from app.services import auth_service, invite_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/register",
    response_model=UserRead,
    status_code=201,
    dependencies=[Depends(rate_limit("register", 10))],
)
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_db)):
    return await auth_service.register(
        db, payload.name, payload.email, payload.password, payload.role
    )


@router.post(
    "/login",
    response_model=TokenResponse,
    dependencies=[Depends(rate_limit("login", 20))],
)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    return await auth_service.login(db, payload.email, payload.password)


@router.post(
    "/refresh",
    response_model=TokenResponse,
    dependencies=[Depends(rate_limit("refresh", 60))],
)
async def refresh(payload: RefreshRequest, db: AsyncSession = Depends(get_db)):
    return await auth_service.refresh(db, payload.refresh_token)


@router.post("/logout")
async def logout(
    payload: LogoutRequest | None = None, db: AsyncSession = Depends(get_db)
):
    await auth_service.logout(db, payload.refresh_token if payload else None)
    return {"status": "ok"}


@router.get("/me", response_model=UserRead)
async def me(user: User = Depends(get_current_user)):
    return user


@router.post(
    "/identity-gate",
    response_model=TokenResponse,
    dependencies=[Depends(rate_limit("identity-gate", 15))],
)
async def identity_gate(
    payload: IdentityGateRequest, db: AsyncSession = Depends(get_db)
):
    _user, tokens = await auth_service.identity_gate(
        db, payload.email, payload.phone, payload.name
    )
    return tokens


@router.post(
    "/google",
    response_model=TokenResponse,
    dependencies=[Depends(rate_limit("google", 20))],
)
async def google(payload: GoogleAuthRequest, db: AsyncSession = Depends(get_db)):
    _user, tokens = await auth_service.google_login(db, payload.id_token)
    return tokens


@router.get(
    "/invites/{token}", dependencies=[Depends(rate_limit("invite-preview", 30))]
)
async def invite_preview(token: str, db: AsyncSession = Depends(get_db)):
    return await invite_service.preview(db, token)


@router.post(
    "/accept-invite",
    response_model=TokenResponse,
    status_code=201,
    dependencies=[Depends(rate_limit("accept-invite", 10))],
)
async def accept_invite(payload: AcceptInviteRequest, db: AsyncSession = Depends(get_db)):
    _user, tokens = await invite_service.accept(
        db, payload.token, payload.name, payload.password
    )
    return tokens
