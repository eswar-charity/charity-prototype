from pydantic import BaseModel


class PostCreateRequest(BaseModel):
    text: str | None = None
    phase: str = "during"
    media_id: int | None = None
    media_alt: str | None = None
    highlight: str | None = None


class ReplyCreateRequest(BaseModel):
    text: str | None = None
    media_id: int | None = None


class UpdateCreateRequest(BaseModel):
    text: str | None = None
    media_id: int | None = None


class MessageCreateRequest(BaseModel):
    text: str
