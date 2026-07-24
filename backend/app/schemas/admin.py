from pydantic import BaseModel


class InviteNonprofitRequest(BaseModel):
    name: str
    category: str = "Community"
    ein: str | None = None
