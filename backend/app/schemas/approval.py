from pydantic import BaseModel


class ReasonRequest(BaseModel):
    reason: str


class FeedbackRequest(BaseModel):
    feedback: str


class AutopilotUpdate(BaseModel):
    enabled: bool | None = None
    checks: list[str] | None = None


class TrustedSERequest(BaseModel):
    se_user_id: int
