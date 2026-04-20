from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from app.config import ensure_upload_directories, settings
from app.routers import admin, auth, dashboard, messages, notices, payments
from app.services.bootstrap import bootstrap_application


ensure_upload_directories()
app = FastAPI(title="PG Management System API", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "https://pgms-rho.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/uploads", StaticFiles(directory=settings.uploads_dir), name="uploads")


@app.on_event("startup")
def on_startup():
    bootstrap_application()


@app.get("/")
def root():
    return {"message": "PG Management System API is running."}


app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(admin.router)
app.include_router(payments.router)
app.include_router(notices.router)
app.include_router(messages.router)
