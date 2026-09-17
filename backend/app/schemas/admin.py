import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.auth import Token
from app.schemas.file import FileOut
from app.schemas.invoice import InvoiceOut
from app.schemas.job import JobOut


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
    orders_count: int = 0
    files_total: int = 0
    revenue: float = 0.0


class AdminJobOut(JobOut):
    studio: StudioSummary
    files_count: int = 0
    invoice: InvoiceOut | None = None


class AdminJobDetail(AdminJobOut):
    files: list[FileOut]


class AdminJobCreate(BaseModel):
    studio_id: uuid.UUID
    name: str
    spec: str
    turnaround: str
    notes: str = ""


class ImpersonateOut(Token):
    studio_id: uuid.UUID
    studio_name: str


class MonthlyRevenue(BaseModel):
    month: str
    total: float


class ServiceBreakdown(BaseModel):
    spec: str
    count: int
    percent: float


class AnalyticsOut(BaseModel):
    revenue_this_month: float
    revenue_last_month: float
    avg_order_value: float
    files_edited: int
    avg_turnaround_hours: float
    monthly_revenue: list[MonthlyRevenue]
    service_breakdown: list[ServiceBreakdown]
