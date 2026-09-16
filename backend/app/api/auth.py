from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_studio
from app.core.database import get_db
from app.core.security import create_access_token, hash_password, verify_password
from app.models.studio import Studio
from app.schemas.auth import StudioLogin, StudioOut, StudioSignup, Token
from app.services.email import send_email

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=Token)
async def signup(data: StudioSignup, db: AsyncSession = Depends(get_db)):
    existing = await db.scalar(select(Studio).where(Studio.email == data.email))
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    studio = Studio(
        email=data.email,
        password_hash=hash_password(data.password),
        name=data.name,
        location=data.location,
    )
    db.add(studio)
    await db.commit()
    await db.refresh(studio)
    send_email(studio.email, "Welcome to Lead Flow", f"<p>Hi {studio.name}, your account is ready.</p>")
    token = create_access_token(str(studio.id))
    return Token(access_token=token)


@router.post("/login", response_model=Token)
async def login(data: StudioLogin, db: AsyncSession = Depends(get_db)):
    studio = await db.scalar(select(Studio).where(Studio.email == data.email))
    if not studio or not verify_password(data.password, studio.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(str(studio.id))
    return Token(access_token=token)


@router.get("/me", response_model=StudioOut)
async def me(studio: Studio = Depends(get_current_studio)):
    return studio
