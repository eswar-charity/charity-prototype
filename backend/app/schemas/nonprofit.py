from pydantic import BaseModel, ConfigDict


class NonprofitRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str
    category: str
    ein: str | None = None
    verified: bool
    status: str
    settlement_status: str
    source: str | None = None
    mission: str | None = None
    legal_name: str | None = None
    headquarters: str | None = None
    founded_year: int | None = None
    source_url: str | None = None
    raw_cause: str | None = None
    logo_media_id: int | None = None
    cover_media_id: int | None = None
    logo_url: str | None = None
    cover_url: str | None = None
    color: str | None = None
    initials: str | None = None


class NonprofitListResponse(BaseModel):
    items: list[NonprofitRead]
    total: int
    has_more: bool


class NonprofitProfileResponse(BaseModel):
    nonprofit: NonprofitRead
    stats: dict
    events: list = []


class NonprofitProfileUpdate(BaseModel):
    mission: str | None = None
    logo_media_id: int | None = None
    cover_media_id: int | None = None
