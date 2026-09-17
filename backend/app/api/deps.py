import secrets

from fastapi import Depends, Header, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.security import decode_access_token
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


async def require_admin(x_admin_key: str | None = Header(None)) -> None:
    if not x_admin_key or not secrets.compare_digest(x_admin_key, settings.admin_api_key):
        raise HTTPException(status_code=403, detail="Admin access required")
