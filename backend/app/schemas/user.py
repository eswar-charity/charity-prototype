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
