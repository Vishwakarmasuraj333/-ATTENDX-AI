from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import datetime

class BiometricConsentRequest(BaseModel):
    student_id: int
    consent_statement: str
    guardian_consent_verified: bool = False
    guardian_name: Optional[str] = None

class FaceEnrollSample(BaseModel):
    sample_index: int # 1: Frontal, 2: Left angle, 3: Right angle
    image_base64: str

class FaceEnrollRequest(BaseModel):
    student_id: int
    samples: List[FaceEnrollSample]

class FaceEnrollResponse(BaseModel):
    student_id: int
    student_name: str
    templates_stored: int
    average_quality: float
    is_success: bool
    message: str

class LiveVerifyFrameRequest(BaseModel):
    session_id: int
    image_base64: str

class DetectedFaceVerificationResult(BaseModel):
    bbox: List[int]
    detection_confidence: float
    liveness_score: float
    liveness_status: str # Passed, Failed, Inconclusive
    liveness_checks: Dict[str, Any]
    match_status: str # Verified, Unknown, Low Quality, Spoof Detected, Already Marked, Multiple Faces
    confidence_score: float
    matched_student_id: Optional[int] = None
    matched_student_name: Optional[str] = None
    matched_enrollment_number: Optional[str] = None
    attendance_marked: bool = False
    message: str

class LiveVerifyFrameResponse(BaseModel):
    session_id: int
    faces_detected_count: int
    results: List[DetectedFaceVerificationResult]
    latency_ms: float
    timestamp: datetime.datetime

