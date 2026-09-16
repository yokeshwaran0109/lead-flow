import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr

from app.schemas.file import FileOut
from app.schemas.invoice import InvoiceOut
from app.schemas.job import JobOut


class AdminLogin(BaseModel):
    email: EmailStr
    password: str


class AdminOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    name: str


class StudioSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    name: str
    location: str
    plan: str
    created_at: datetime


class AdminJobOut(JobOut):
    studio: StudioSummary


class AdminJobDetail(AdminJobOut):
    files: list[FileOut]
    invoice: InvoiceOut | None
