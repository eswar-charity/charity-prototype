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
        if v not in ("se", "np_admin"):
            raise ValueError("role must be 'se' or 'np_admin'")
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
