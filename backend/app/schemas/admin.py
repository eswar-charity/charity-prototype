from pydantic import BaseModel


class InviteNonprofitRequest(BaseModel):
    name: str
    category: str = "Community"
    ein: str | None = None
    # When given, a single-use account invite is issued for this nonprofit admin.
    admin_email: str | None = None


class InviteAdminRequest(BaseModel):
    email: str
