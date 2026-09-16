import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_admin, get_current_studio
from app.core.database import get_db
from app.models.invoice import Invoice
from app.models.job import Job, Stage
from app.models.studio import Studio
from app.schemas.invoice import InvoiceCreate, InvoiceOut
from app.services.email import send_email

router = APIRouter(prefix="/jobs/{job_id}/invoice", tags=["invoices"])


@router.get("", response_model=InvoiceOut)
async def get_invoice(
    job_id: uuid.UUID,
    studio: Studio = Depends(get_current_studio),
    db: AsyncSession = Depends(get_db),
):
    job = await db.get(Job, job_id, options=[selectinload(Job.invoice)])
    if not job or job.studio_id != studio.id or not job.invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return job.invoice


@router.post("", response_model=InvoiceOut, dependencies=[Depends(get_current_admin)])
async def create_invoice(job_id: uuid.UUID, data: InvoiceCreate, db: AsyncSession = Depends(get_db)):
    job = await db.get(Job, job_id, options=[selectinload(Job.invoice)])
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.invoice:
        raise HTTPException(status_code=400, detail="Invoice already exists for this job")
    invoice_number = f"ELY-{datetime.now(timezone.utc).year}-{job.seq}"
    invoice = Invoice(
        job_id=job.id,
        invoice_number=invoice_number,
        lines=[line.model_dump() for line in data.lines],
        total_amount=data.total_amount,
    )
    job.stage = Stage.INVOICE_SENT.value
    db.add(invoice)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Invoice already exists for this job")
    await db.refresh(invoice)
    studio = await db.get(Studio, job.studio_id)
    if studio:
        send_email(
            studio.email,
            f"Invoice {invoice.invoice_number} for {job.ref}",
            f"<p>Invoice {invoice.invoice_number} for {job.ref} ({job.name}): ${invoice.total_amount}.</p>",
        )
    return invoice


@router.post("/pay", response_model=InvoiceOut, dependencies=[Depends(get_current_admin)])
async def mark_paid(job_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    job = await db.get(Job, job_id, options=[selectinload(Job.invoice)])
    if not job or not job.invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    job.invoice.paid = True
    job.invoice.paid_at = datetime.now(timezone.utc)
    job.stage = Stage.INVOICE_PAID.value
    await db.commit()
    await db.refresh(job.invoice)
    studio = await db.get(Studio, job.studio_id)
    if studio:
        send_email(
            studio.email,
            f"Payment received for {job.ref}",
            f"<p>Thanks — we've received payment for {job.ref} ({job.name}).</p>",
        )
    return job.invoice
