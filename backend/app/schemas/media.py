from pydantic import BaseModel, ConfigDict


class SignRequest(BaseModel):
    folder: str
    resource_type: str = "image"


class SignResponse(BaseModel):
    cloud_name: str
    api_key: str
    timestamp: int
    folder: str
    signature: str
    resource_type: str


class MediaCreateRequest(BaseModel):
    public_id: str
    secure_url: str
    resource_type: str
    format: str
    bytes: int
    width: int | None = None
    height: int | None = None
    entity_type: str | None = None
    entity_id: int | None = None


class MediaRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    public_id: str
    secure_url: str
    resource_type: str
    format: str
    bytes: int
    width: int | None = None
    height: int | None = None
    owner_id: int | None = None
    entity_type: str | None = None
    entity_id: int | None = None
