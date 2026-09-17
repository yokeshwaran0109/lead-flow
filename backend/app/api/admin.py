import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_admin
from app.core.database import get_db
from app.core.security import create_access_token
from app.models.admin import Admin
from app.models.file import JobFile
from app.models.job import Job
from app.models.studio import Studio
from app.schemas.admin import AdminJobDetail, AdminJobOut, AdminOut, ImpersonateOut, StudioSummary
from app.services.b2_storage import generate_presigned_get_url

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/me", response_model=AdminOut)
async def admin_me(admin: Admin = Depends(get_current_admin)):
    return admin


@router.get("/studios", response_model=list[StudioSummary])
async def list_studios(
    admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.scalars(select(Studio).order_by(Studio.created_at.desc()))
    return result.all()


@router.get("/jobs", response_model=list[AdminJobOut])
async def list_all_jobs(
    admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.scalars(
        select(Job).options(selectinload(Job.studio)).order_by(Job.created_at.desc())
    )
    return result.all()


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
