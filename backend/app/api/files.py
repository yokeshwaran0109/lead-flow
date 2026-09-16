import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_studio
from app.core.database import get_db
from app.models.file import JobFile
from app.models.job import Job
from app.models.studio import Studio
from app.schemas.file import FileOut, FilePresignRequestBatch, FilePresignResponse
from app.services.r2_storage import generate_presigned_put_url

router = APIRouter(prefix="/jobs/{job_id}/files", tags=["files"])


async def _get_owned_job(job_id: str, studio: Studio, db: AsyncSession) -> Job:
    job = await db.get(Job, job_id)
    if not job or job.studio_id != studio.id:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.post("/presign", response_model=list[FilePresignResponse])
async def presign_files(
    job_id: str,
    data: FilePresignRequestBatch,
    studio: Studio = Depends(get_current_studio),
    db: AsyncSession = Depends(get_db),
):
    job = await _get_owned_job(job_id, studio, db)
    responses = []
    for f in data.files:
        file_id = uuid.uuid4()
        storage_key = f"studios/{studio.id}/jobs/{job.id}/{file_id}-{f.filename}"
        job_file = JobFile(
            id=file_id,
            job_id=job.id,
            filename=f.filename,
            content_type=f.content_type,
            size_bytes=f.size_bytes,
            storage_key=storage_key,
        )
        db.add(job_file)
        upload_url = generate_presigned_put_url(storage_key, f.content_type)
        responses.append(
            FilePresignResponse(file_id=file_id, upload_url=upload_url, storage_key=storage_key)
        )
    await db.commit()
    return responses


@router.post("/{file_id}/complete", response_model=FileOut)
async def complete_upload(
    job_id: str,
    file_id: str,
    studio: Studio = Depends(get_current_studio),
    db: AsyncSession = Depends(get_db),
):
    job = await _get_owned_job(job_id, studio, db)
    file = await db.get(JobFile, file_id)
    if not file or file.job_id != job.id:
        raise HTTPException(status_code=404, detail="File not found")
    file.uploaded = True
    await db.commit()
    await db.refresh(file)
    return file


@router.get("", response_model=list[FileOut])
async def list_files(
    job_id: str,
    studio: Studio = Depends(get_current_studio),
    db: AsyncSession = Depends(get_db),
):
    job = await _get_owned_job(job_id, studio, db)
    result = await db.scalars(select(JobFile).where(JobFile.job_id == job.id))
    return result.all()
