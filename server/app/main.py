from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.config import ensure_upload_directories, settings
from app.routers import admin, auth, dashboard, messages, notices, payments
from app.services.bootstrap import bootstrap_application


# Ensure upload folders exist
ensure_upload_directories()

# Create app
app = FastAPI(title="PG Management System API", version="2.0.0")


# ✅ CORS FIX (IMPORTANT)
# Always include your frontend URL explicitly
origins = [
    "https://pgms-rho.vercel.app",  # your Vercel frontend
]

# If you still want to use env variable, add safely:
if settings.frontend_url:
    origins.append(settings.frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(set(origins)),  # remove duplicates safely
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Static files (uploads)
app.mount("/uploads", StaticFiles(directory=settings.uploads_dir), name="uploads")


# Startup event
@app.on_event("startup")
def on_startup():
    bootstrap_application()


# Root route
@app.get("/")
def root():
    return {"message": "PG Management System API is running."}


# Routers
app.include_router(auth.router, prefix="/auth")
app.include_router(dashboard.router)
app.include_router(admin.router)
app.include_router(payments.router)
app.include_router(notices.router)
app.include_router(messages.router)