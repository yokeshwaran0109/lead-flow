import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_studio
from app.core.database import get_db
from app.core.security import create_access_token, hash_password, verify_password
from app.models.admin import Admin
from app.models.studio import Studio
from app.schemas.auth import ConfirmIn, SetPasswordIn, StudioLogin, StudioOut, StudioSignup, Token
from app.services.email import render_verify_email, send_email

router = APIRouter(prefix="/auth", tags=["auth"])

CONFIRM_TOKEN_EXPIRE_MINUTES = 10


@router.post("/signup")
async def signup(data: StudioSignup, request: Request, db: AsyncSession = Depends(get_db)):
    existing = await db.scalar(select(Studio).where(Studio.email == data.email))
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    confirm_token = secrets.token_urlsafe(32)
    studio = Studio(
        email=data.email,
        name=data.name,
        password_hash=None,
        confirmed=False,
        confirm_token=confirm_token,
        confirm_token_expires=datetime.now(timezone.utc) + timedelta(minutes=CONFIRM_TOKEN_EXPIRE_MINUTES),
    )
    db.add(studio)
    await db.commit()
    confirm_url = f"{str(request.base_url).rstrip('/')}/?confirm={confirm_token}"
    send_email(
        studio.email,
        "Confirm your Lead Flow account",
        render_verify_email(studio.name, confirm_url, CONFIRM_TOKEN_EXPIRE_MINUTES),
    )
    return {"detail": "Check your email to confirm your account."}


@router.post("/confirm", response_model=Token)
async def confirm(data: ConfirmIn, db: AsyncSession = Depends(get_db)):
    studio = await db.scalar(select(Studio).where(Studio.confirm_token == data.token))
    if (
        not studio
        or not studio.confirm_token_expires
        or studio.confirm_token_expires < datetime.now(timezone.utc)
    ):
        raise HTTPException(status_code=400, detail="Invalid or expired confirmation link")
    studio.confirmed = True
    studio.confirm_token = None
    studio.confirm_token_expires = None
    await db.commit()
    token = create_access_token(str(studio.id), role="studio")
    return Token(access_token=token, role="studio")


@router.post("/set-password")
async def set_password(
    data: SetPasswordIn,
    studio: Studio = Depends(get_current_studio),
    db: AsyncSession = Depends(get_db),
):
    studio.password_hash = hash_password(data.password)
    await db.commit()
    return {"detail": "Password set"}


@router.post("/login", response_model=Token)
async def login(data: StudioLogin, db: AsyncSession = Depends(get_db)):
    studio = await db.scalar(select(Studio).where(Studio.email == data.email))
    if studio and studio.password_hash and verify_password(data.password, studio.password_hash):
        token = create_access_token(str(studio.id), role="studio")
        return Token(access_token=token, role="studio")

    admin = await db.scalar(select(Admin).where(Admin.email == data.email))
    if admin and verify_password(data.password, admin.password_hash):
        token = create_access_token(str(admin.id), role="admin")
        return Token(access_token=token, role="admin")

    raise HTTPException(status_code=401, detail="Invalid credentials")


@router.get("/me", response_model=StudioOut)
async def me(studio: Studio = Depends(get_current_studio)):
    return studio
