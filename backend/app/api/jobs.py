import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_studio, require_admin
from app.core.database import get_db
from app.models.job import Job
from app.models.studio import Studio
from app.schemas.job import JobCreate, JobOut, StageUpdate
from app.services.email import send_email

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.post("", response_model=JobOut)
async def create_job(
    data: JobCreate,
    studio: Studio = Depends(get_current_studio),
    db: AsyncSession = Depends(get_db),
):
    job = Job(
        studio_id=studio.id,
        name=data.name,
        spec=data.spec,
        turnaround=data.turnaround,
        notes=data.notes,
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)
    return job


@router.get("", response_model=list[JobOut])
async def list_jobs(
    studio: Studio = Depends(get_current_studio),
    db: AsyncSession = Depends(get_db),
):
    result = await db.scalars(
        select(Job).where(Job.studio_id == studio.id).order_by(Job.created_at.desc())
    )
    return result.all()


@router.get("/{job_id}", response_model=JobOut)
async def get_job(
    job_id: uuid.UUID,
    studio: Studio = Depends(get_current_studio),
    db: AsyncSession = Depends(get_db),
):
    job = await db.get(Job, job_id)
    if not job or job.studio_id != studio.id:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.patch("/{job_id}/stage", response_model=JobOut, dependencies=[Depends(require_admin)])
async def update_stage(job_id: uuid.UUID, data: StageUpdate, db: AsyncSession = Depends(get_db)):
    job = await db.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    job.stage = data.stage.value
    await db.commit()
    await db.refresh(job)
    studio = await db.get(Studio, job.studio_id)
    if studio:
        stage_label = data.stage.name.replace("_", " ").title()
        send_email(
            studio.email,
            f"{job.ref} moved to {stage_label}",
            f"<p>Your job {job.ref} ({job.name}) is now: {stage_label}.</p>",
        )
    return job
