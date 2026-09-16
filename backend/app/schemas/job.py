import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.job import Stage


class JobCreate(BaseModel):
    name: str
    spec: str
    turnaround: str
    notes: str = ""


class JobOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    ref: str
    name: str
    spec: str
    turnaround: str
    notes: str
    stage: int
    due_date: datetime | None
    created_at: datetime


class StageUpdate(BaseModel):
    stage: Stage
