from pydantic import BaseModel, Field, field_validator, model_validator


def _normalize_email(value):
    """Strip whitespace and lowercase email strings; pass through other values unchanged."""
    if isinstance(value, str) and value:
        return value.strip().lower()
    return value


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str = Field(min_length=8)
    role: str = "se"

    @field_validator("email", mode="before")
    @classmethod
    def _lowercase_email(cls, v):
        return _normalize_email(v)

    @field_validator("role")
    @classmethod
    def _validate_role(cls, v: str) -> str:
        # Nonprofit admins are invite-only (see /auth/accept-invite).
        if v != "se":
            raise ValueError("role must be 'se'; nonprofit accounts are invite-only")
        return v


class LoginRequest(BaseModel):
    email: str
    password: str

    @field_validator("email", mode="before")
    @classmethod
    def _lowercase_email(cls, v):
        return _normalize_email(v)


class RefreshRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    refresh_token: str | None = None


class AcceptInviteRequest(BaseModel):
    token: str = Field(min_length=10)
    name: str = Field(min_length=1)
    password: str = Field(min_length=8)


class IdentityGateRequest(BaseModel):
    email: str | None = None
    phone: str | None = None
    name: str | None = None

    @field_validator("email", mode="before")
    @classmethod
    def _lowercase_email(cls, v):
        return _normalize_email(v)

    @model_validator(mode="after")
    def _require_email_or_phone(self):
        if not self.email and not self.phone:
            raise ValueError("email or phone is required")
        return self


class GoogleAuthRequest(BaseModel):
    id_token: str = Field(min_length=1)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
