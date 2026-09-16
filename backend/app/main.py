from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, files, invoices, jobs
from app.core.config import settings

app = FastAPI(title="Lead Flow API")

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


@app.get("/health")
async def health():
    return {"status": "ok"}
