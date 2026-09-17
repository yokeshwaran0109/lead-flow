import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_admin
from app.core.database import get_db
from app.core.security import create_access_token
from app.models.admin import Admin
from app.models.file import JobFile
from app.models.invoice import Invoice
from app.models.job import Job
from app.models.studio import Studio
from app.schemas.admin import (
    AdminJobCreate,
    AdminJobDetail,
    AdminJobOut,
    AdminOut,
    AnalyticsOut,
    ImpersonateOut,
    StudioSummary,
)
from app.services.b2_storage import generate_presigned_get_url

router = APIRouter(prefix="/admin", tags=["admin"])

JOB_LOAD_OPTIONS = [selectinload(Job.studio), selectinload(Job.files), selectinload(Job.invoice)]


@router.get("/me", response_model=AdminOut)
async def admin_me(admin: Admin = Depends(get_current_admin)):
    return admin


@router.get("/studios", response_model=list[StudioSummary])
async def list_studios(
    admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    studios = (await db.scalars(select(Studio).order_by(Studio.created_at.desc()))).all()

    orders_map = dict((await db.execute(select(Job.studio_id, func.count(Job.id)).group_by(Job.studio_id))).all())
    files_map = dict(
        (
            await db.execute(
                select(Job.studio_id, func.count(JobFile.id))
                .join(JobFile, JobFile.job_id == Job.id)
                .group_by(Job.studio_id)
            )
        ).all()
    )
    revenue_map = dict(
        (
            await db.execute(
                select(Job.studio_id, func.coalesce(func.sum(Invoice.total_amount), 0))
                .join(Invoice, Invoice.job_id == Job.id)
                .where(Invoice.paid.is_(True))
                .group_by(Job.studio_id)
            )
        ).all()
    )

    out = []
    for s in studios:
        summary = StudioSummary.model_validate(s)
        summary.orders_count = orders_map.get(s.id, 0)
        summary.files_total = files_map.get(s.id, 0)
        summary.revenue = float(revenue_map.get(s.id, 0))
        out.append(summary)
    return out


@router.get("/jobs", response_model=list[AdminJobOut])
async def list_all_jobs(
    admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.scalars(
        select(Job).options(*JOB_LOAD_OPTIONS).order_by(Job.created_at.desc())
    )
    return result.all()


@router.post("/jobs", response_model=AdminJobOut)
async def create_job_for_studio(
    data: AdminJobCreate,
    admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    studio = await db.get(Studio, data.studio_id)
    if not studio:
        raise HTTPException(status_code=404, detail="Studio not found")
    job = Job(
        studio_id=studio.id,
        name=data.name,
        spec=data.spec,
        turnaround=data.turnaround,
        notes=data.notes,
    )
    db.add(job)
    await db.commit()
    return await db.get(Job, job.id, options=JOB_LOAD_OPTIONS)


@router.get("/analytics", response_model=AnalyticsOut)
async def get_analytics(
    admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    jobs = (await db.scalars(select(Job).options(selectinload(Job.files), selectinload(Job.invoice)))).all()

    now = datetime.now(timezone.utc)

    def month_key(dt: datetime) -> str:
        return dt.strftime("%Y-%m")

    this_month = month_key(now)
    last_month_anchor = now.replace(day=1) - timedelta(days=1)
    last_month = month_key(last_month_anchor)

    revenue_this_month = 0.0
    revenue_last_month = 0.0
    monthly: dict[str, float] = {}
    paid_totals: list[float] = []
    turnaround_hours: list[float] = []
    spec_counts: dict[str, int] = {}
    files_edited = 0

    for j in jobs:
        files_edited += len(j.files)
        spec_counts[j.spec] = spec_counts.get(j.spec, 0) + 1
        inv = j.invoice
        if inv and inv.paid and inv.paid_at:
            mk = month_key(inv.paid_at)
            monthly[mk] = monthly.get(mk, 0.0) + float(inv.total_amount)
            paid_totals.append(float(inv.total_amount))
            turnaround_hours.append((inv.paid_at - j.created_at).total_seconds() / 3600)
            if mk == this_month:
                revenue_this_month += float(inv.total_amount)
            if mk == last_month:
                revenue_last_month += float(inv.total_amount)

    avg_order_value = sum(paid_totals) / len(paid_totals) if paid_totals else 0.0
    avg_turnaround_hours = sum(turnaround_hours) / len(turnaround_hours) if turnaround_hours else 0.0

    months_seq = []
    y, m = now.year, now.month
    for i in range(5, -1, -1):
        mm = m - i
        yy = y
        while mm <= 0:
            mm += 12
            yy -= 1
        months_seq.append(f"{yy}-{mm:02d}")
    monthly_revenue = [{"month": mk, "total": round(monthly.get(mk, 0.0), 2)} for mk in months_seq]

    total_jobs = len(jobs) or 1
    service_breakdown = [
        {"spec": spec, "count": c, "percent": round(c / total_jobs * 100, 1)}
        for spec, c in sorted(spec_counts.items(), key=lambda x: -x[1])
    ]

    return AnalyticsOut(
        revenue_this_month=round(revenue_this_month, 2),
        revenue_last_month=round(revenue_last_month, 2),
        avg_order_value=round(avg_order_value, 2),
        files_edited=files_edited,
        avg_turnaround_hours=round(avg_turnaround_hours, 1),
        monthly_revenue=monthly_revenue,
        service_breakdown=service_breakdown,
    )


@router.get("/jobs/{job_id}", response_model=AdminJobDetail)
async def get_job_detail(
    job_id: uuid.UUID,
    admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    job = await db.get(
        Job,
        job_id,
        options=[selectinload(Job.studio), selectinload(Job.files), selectinload(Job.invoice)],
    )
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.post("/studios/{studio_id}/impersonate", response_model=ImpersonateOut)
async def impersonate_studio(
    studio_id: uuid.UUID,
    admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    studio = await db.get(Studio, studio_id)
    if not studio:
        raise HTTPException(status_code=404, detail="Studio not found")
    token = create_access_token(subject=str(studio.id), role="studio", impersonated_by=str(admin.id))
    return ImpersonateOut(
        access_token=token, role="studio", studio_id=studio.id, studio_name=studio.name
    )


@router.get("/jobs/{job_id}/files/{file_id}/download")
async def download_file(
    job_id: uuid.UUID,
    file_id: uuid.UUID,
    admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    file = await db.get(JobFile, file_id)
    if not file or file.job_id != job_id:
        raise HTTPException(status_code=404, detail="File not found")
    return {"download_url": generate_presigned_get_url(file.storage_key)}
