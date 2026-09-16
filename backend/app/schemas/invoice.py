import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class InvoiceLine(BaseModel):
    description: str
    qty: int
    amount: float


class InvoiceCreate(BaseModel):
    lines: list[InvoiceLine]
    total_amount: float


class InvoiceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    invoice_number: str
    lines: list
    total_amount: float
    issued_at: datetime
    paid: bool
    paid_at: datetime | None
