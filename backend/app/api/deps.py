from fastapi import Depends, Header, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import decode_access_token, decode_token
from app.models.admin import Admin
from app.models.studio import Studio


async def get_current_studio(
    authorization: str | None = Header(None),
    db: AsyncSession = Depends(get_db),
) -> Studio:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.removeprefix("Bearer ")
    studio_id = decode_access_token(token)
    if not studio_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    studio = await db.get(Studio, studio_id)
    if not studio:
        raise HTTPException(status_code=401, detail="Studio not found")
    return studio


async def get_current_admin(
    authorization: str | None = Header(None),
    db: AsyncSession = Depends(get_db),
) -> Admin:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.removeprefix("Bearer ")
    payload = decode_token(token)
    if not payload or payload.get("role") != "admin":
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    admin = await db.get(Admin, payload["sub"])
    if not admin:
        raise HTTPException(status_code=401, detail="Admin not found")
    return admin
