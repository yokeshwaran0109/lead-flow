import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Identity, Integer, SmallInteger, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Stage(int, enum.Enum):
    RECEIVED = 0
    IN_EDITING = 1
    QUALITY_CHECK = 2
    DELIVERED = 3
    INVOICE_SENT = 4
    INVOICE_PAID = 5


class Job(Base):
    __tablename__ = "jobs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # human-facing job number, e.g. LF-1043 — separate from the UUID primary key
    seq: Mapped[int] = mapped_column(Integer, Identity(start=1043, increment=1), unique=True)
    studio_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("studios.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    spec: Mapped[str] = mapped_column(String(255), nullable=False)
    turnaround: Mapped[str] = mapped_column(String(50), nullable=False)
    notes: Mapped[str] = mapped_column(Text, default="")
    stage: Mapped[int] = mapped_column(SmallInteger, default=Stage.RECEIVED.value)
    due_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    studio: Mapped["Studio"] = relationship(back_populates="jobs")
    files: Mapped[list["JobFile"]] = relationship(back_populates="job", cascade="all, delete-orphan")
    invoice: Mapped["Invoice"] = relationship(
        back_populates="job", uselist=False, cascade="all, delete-orphan"
    )

    @property
    def ref(self) -> str:
        return f"LF-{self.seq}"
