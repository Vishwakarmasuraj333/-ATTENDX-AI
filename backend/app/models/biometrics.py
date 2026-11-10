from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Float, Text, JSON
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.base import TimestampMixin

class FaceTemplate(Base, TimestampMixin):
    __tablename__ = "face_templates"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Secure encrypted template storage (Fernet AES-256)
    encrypted_embedding = Column(Text, nullable=False)
    embedding_dimension = Column(Integer, default=128)
    algorithm_name = Column(String(50), default="OpenCV_SFace_v1")
    
    sample_index = Column(Integer, default=1) # 1=Frontal, 2=Left tilt, 3=Right tilt
    quality_score = Column(Float, nullable=False) # 0.0 - 1.0 (sharpness + illumination)
    sharpness_score = Column(Float, nullable=True) # Laplacian variance
    brightness_score = Column(Float, nullable=True) # Normalized mean intensity
    face_bbox_json = Column(JSON, nullable=True) # [x, y, w, h]
    
    is_active = Column(Boolean, default=True)
    consent_id = Column(Integer, ForeignKey("consent_records.id", ondelete="SET NULL"), nullable=True)

    student = relationship("Student", back_populates="face_templates")


class FaceVerificationEvent(Base, TimestampMixin):
    __tablename__ = "face_verification_events"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("attendance_sessions.id", ondelete="SET NULL"), nullable=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="SET NULL"), nullable=True, index=True)
    
    matched_enrollment_number = Column(String(50), nullable=True)
    matched_student_name = Column(String(150), nullable=True)
    confidence_score = Column(Float, nullable=False) # Cosine similarity score
    liveness_score = Column(Float, nullable=False) # 0.0 - 1.0 anti-spoofing score
    
    # Statuses: "Verified", "Unknown", "Low Quality", "Spoof Detected", "Already Marked", "Multiple Faces"
    match_status = Column(String(50), nullable=False, index=True)
    liveness_status = Column(String(30), default="Passed") # "Passed", "Failed", "Inconclusive"
    
    verification_latency_ms = Column(Float, default=0.0)
    client_ip = Column(String(45), nullable=True)
    metadata_json = Column(JSON, nullable=True)

    session = relationship("AttendanceSession", back_populates="verification_events")

