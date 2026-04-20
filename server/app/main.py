from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import ensure_upload_directories, settings
from app.routers import admin, auth, dashboard, messages, notices, payments
from app.services.bootstrap import bootstrap_application


# Ensure upload folders exist
ensure_upload_directories()

# Create FastAPI app
app = FastAPI(title="PG Management System API", version="2.0.0")


# ✅ CORS CONFIG
origins = ["https://pgms-rho.vercel.app"]

if settings.frontend_url and settings.frontend_url not in origins:
    origins.append(settings.frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ✅ Static files
app.mount("/uploads", StaticFiles(directory=settings.uploads_dir), name="uploads")


# ✅ Startup
@app.on_event("startup")
def on_startup():
    bootstrap_application()


# ✅ Root route
@app.get("/")
def root():
    return {"message": "PG Management System API is running."}


# ✅ Routers
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(dashboard.router, tags=["Dashboard"])
app.include_router(admin.router, tags=["Admin"])
app.include_router(payments.router, tags=["Payments"])
app.include_router(notices.router, tags=["Notices"])
app.include_router(messages.router, tags=["Messages"])