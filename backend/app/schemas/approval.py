from pydantic import BaseModel


class ReasonRequest(BaseModel):
    reason: str


class FeedbackRequest(BaseModel):
    feedback: str
    # Wizard areas the SE may edit when fixing: media_story | nonprofit | date_location
    areas: list[str] | None = None


class AutopilotUpdate(BaseModel):
    enabled: bool | None = None
    checks: list[str] | None = None


class TrustedSERequest(BaseModel):
    se_user_id: int
