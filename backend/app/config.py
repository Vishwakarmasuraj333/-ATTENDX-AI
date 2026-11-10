import os
import logging
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger("attendx.config")

DEFAULT_SECRET_KEY = "attendx-ai-super-secret-production-grade-key-2026-msc-it"
DEFAULT_BIOMETRIC_KEY = "vM7kC3vE8tG9hW4zL1xY6rP2bN5sD8fA4qJ7wE0mR3g="

class Settings(BaseSettings):
    PROJECT_NAME: str = "AttendX AI"
    PROJECT_VERSION: str = "2.0.0"
    ENVIRONMENT: str = "development"
    
    # Security & JWT
    SECRET_KEY: str = DEFAULT_SECRET_KEY
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours
    
    # Biometric Encryption (AES-256 Fernet key: 32 url-safe base64-encoded bytes)
    BIOMETRIC_ENCRYPTION_KEY: str = DEFAULT_BIOMETRIC_KEY
    
    # Database
    DATABASE_URL: str = "sqlite:///./attendx.db"
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*"
    ]
    
    # Face Recognition Calibration
    FACE_MATCH_THRESHOLD: float = 0.65
    FACE_LIVENESS_THRESHOLD: float = 0.70
    MIN_FACE_SIZE: int = 80 # minimum pixels width/height
    MIN_IMAGE_QUALITY_SCORE: float = 0.60
    
    # Storage & Uploads
    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
    MODEL_WEIGHTS_DIR: str = os.path.join(os.path.dirname(os.path.dirname(__file__)), "ml_weights")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()

# Enforce security requirements
if settings.ENVIRONMENT.lower() == "production":
    if settings.SECRET_KEY == DEFAULT_SECRET_KEY:
        raise ValueError("CRITICAL SECURITY ERROR: Default SECRET_KEY detected in production environment! Configure a unique secret key via environment variable or .env file.")
    if settings.BIOMETRIC_ENCRYPTION_KEY == DEFAULT_BIOMETRIC_KEY:
        raise ValueError("CRITICAL SECURITY ERROR: Default BIOMETRIC_ENCRYPTION_KEY detected in production environment! Biometric data must be encrypted with an externally provisioned key.")

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.MODEL_WEIGHTS_DIR, exist_ok=True)
