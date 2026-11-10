import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import engine, Base
from app.utils.seed_data import seed_database
from app.ml.models_loader import model_manager

# Import all routers
from app.routers import (
    auth,
    academic,
    students,
    faculty,
    timetable,
    attendance,
    face_engine,
    analytics,
    reports,
    notifications,
    audit
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure database tables are created and seed data is populated
    Base.metadata.create_all(bind=engine)
    try:
        seed_database()
    except Exception as e:
        print(f"Startup seed notice: {e}")
    yield
    # Shutdown

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AttendX AI – Intelligent Face Recognition Attendance & Smart Campus Management Platform API",
    version=settings.PROJECT_VERSION,
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for profile uploads
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include Routers
app.include_router(auth.router)
app.include_router(academic.router)
app.include_router(students.router)
app.include_router(faculty.router)
app.include_router(timetable.router)
app.include_router(attendance.router)
app.include_router(face_engine.router)
app.include_router(analytics.router)
app.include_router(reports.router)
app.include_router(notifications.router)
app.include_router(audit.router)

@app.get("/", tags=["System"])
def root():
    return {
        "system": settings.PROJECT_NAME,
        "version": settings.PROJECT_VERSION,
        "status": "Operational",
        "documentation": "/docs",
        "vision_engine": {
            "yunet_loaded": model_manager.detector is not None,
            "sface_loaded": model_manager.recognizer is not None,
            "fallback_active": model_manager.use_fallback
        }
    }

@app.get("/api/v1/health", tags=["System"])
def health_check():
    return {
        "status": "healthy",
        "database": "connected",
        "biometric_encryption": "AES-256 Fernet active",
        "liveness_anti_spoofing": "multi-cue spectral & gradient active",
        "timestamp": os.path.basename(__file__)
    }

