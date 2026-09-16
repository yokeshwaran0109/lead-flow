import uuid

from pydantic import BaseModel, ConfigDict


class FilePresignRequest(BaseModel):
    filename: str
    content_type: str
    size_bytes: int


class FilePresignRequestBatch(BaseModel):
    files: list[FilePresignRequest]


class FilePresignResponse(BaseModel):
    file_id: uuid.UUID
    upload_url: str
    storage_key: str


class FileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    filename: str
    size_bytes: int
    uploaded: bool
