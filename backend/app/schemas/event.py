from pydantic import BaseModel


class OrganizerBrief(BaseModel):
    id: int
    name: str
    initials: str | None = None
    color: str | None = None


class NonprofitBrief(BaseModel):
    id: int
    name: str
    slug: str
    initials: str | None = None
    color: str | None = None
    verified: bool = False


class EventRead(BaseModel):
    id: int
    key: str
    title: str
    story: str | None = None
    subtitle: str | None = None
    category: str | None = None
    kind: str
    status: str
    visibility: str
    date: str | None = None
    start_time: str | None = None
    end_time: str | None = None
    location: str | None = None
    is_live: bool
    cover_media_id: int | None = None
    backed: int
    joined: int
    updates: int
    chat_count: int
    raised: int
    nonprofit: NonprofitBrief | None = None
    organizer: OrganizerBrief | None = None
    tags: list[str] = []
    photos: list[str] = []


class EventListResponse(BaseModel):
    items: list[EventRead]
    total: int
    has_more: bool


class EventCreateRequest(BaseModel):
    title: str | None = None
    story: str | None = None
    nonprofit_id: int | None = None
    category: str | None = None
    date: str | None = None
    start_time: str | None = None
    end_time: str | None = None
    location: str | None = None
    visibility: str = "public"
    cover_media_id: int | None = None
    tags: list[str] | None = None


class EventUpdateRequest(BaseModel):
    title: str | None = None
    story: str | None = None
    nonprofit_id: int | None = None
    category: str | None = None
    date: str | None = None
    start_time: str | None = None
    end_time: str | None = None
    location: str | None = None
    visibility: str | None = None
    cover_media_id: int | None = None
    tags: list[str] | None = None
