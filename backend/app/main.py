from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.templating import Jinja2Templates

from app.api import admin, auth, files, invoices, jobs
from app.core.config import settings

app = FastAPI(title="Lead Flow API")
templates = Jinja2Templates(directory=str(Path(__file__).parent / "templates"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=settings.cors_origins != ["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(jobs.router)
app.include_router(files.router)
app.include_router(invoices.router)
app.include_router(admin.router)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/")
async def portal(request: Request):
    return templates.TemplateResponse(request, "portal.html")
