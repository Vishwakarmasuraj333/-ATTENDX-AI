import base64
import time
import datetime
from typing import List, Dict, Any, Optional
import numpy as np
import cv2
from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect, Request
from sqlalchemy.orm import Session

from app.database import get_db, SessionLocal
from app.models.students import Student
from app.models.attendance import AttendanceSession, AttendanceRecord
from app.models.biometrics import FaceTemplate, FaceVerificationEvent
from app.models.users import ConsentRecord, User
from app.schemas.biometrics import (
    FaceEnrollRequest, FaceEnrollResponse, 
    LiveVerifyFrameRequest, LiveVerifyFrameResponse, 
    DetectedFaceVerificationResult, BiometricConsentRequest
)
from app.services.auth_service import auth_service
from app.services.crypto_service import crypto_service
from app.ml.face_pipeline import face_pipeline
from app.ml.liveness_detector import liveness_detector
from app.config import settings

router = APIRouter(prefix="/api/v1/face-engine", tags=["Face Recognition Engine"])

# Active WebSocket connections for live session streaming
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, session_id: int, websocket: WebSocket):
        await websocket.accept()
        if session_id not in self.active_connections:
            self.active_connections[session_id] = []
        self.active_connections[session_id].append(websocket)

    def disconnect(self, session_id: int, websocket: WebSocket):
        if session_id in self.active_connections:
            if websocket in self.active_connections[session_id]:
                self.active_connections[session_id].remove(websocket)
            if not self.active_connections[session_id]:
                del self.active_connections[session_id]

    async def broadcast(self, session_id: int, message: dict):
        if session_id in self.active_connections:
            for connection in self.active_connections[session_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    pass

manager = ConnectionManager()

def _decode_base64_image(image_base64: str) -> np.ndarray:
    """
    Decodes a base64 encoded data URI or string into an OpenCV BGR numpy array.
    """
    try:
        if "," in image_base64:
            image_base64 = image_base64.split(",")[1]
        img_bytes = base64.b64decode(image_base64)
        nparr = np.frombuffer(img_bytes, np.uint8)
        img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img_bgr is None:
            raise ValueError("Decoded image is empty")
        return img_bgr
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image format or decoding error: {str(e)}")

# --- 1. BIOMETRIC CONSENT RECORDING ---
@router.post("/consent")
def record_biometric_consent(
    payload: BiometricConsentRequest,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(auth_service.get_current_user)
):
    student = db.query(Student).filter(Student.id == payload.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    consent = ConsentRecord(
        student_id=payload.student_id,
        user_id=user.id,
        consent_type="BIOMETRIC_FACE_ENROLLMENT",
        is_granted=True,
        consent_statement=payload.consent_statement,
        guardian_consent_verified=payload.guardian_consent_verified,
        guardian_name=payload.guardian_name,
        ip_address=request.client.host if request.client else None
    )
    db.add(consent)
    db.commit()
    db.refresh(consent)
    return {"message": "Informed biometric consent recorded successfully.", "consent_id": consent.id}

# --- 2. MULTI-SAMPLE FACE ENROLLMENT ---
@router.post("/enroll", response_model=FaceEnrollResponse)
def enroll_student_face(
    payload: FaceEnrollRequest,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(auth_service.require_roles(["Super Admin", "College Admin", "Faculty", "Class Coordinator"]))
):
    student = db.query(Student).filter(Student.id == payload.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Verify informed consent exists
    consent = db.query(ConsentRecord).filter(
        ConsentRecord.student_id == student.id,
        ConsentRecord.is_granted == True
    ).order_by(ConsentRecord.created_at.desc()).first()
    if not consent:
        raise HTTPException(
            status_code=400,
            detail="Biometric consent is mandatory before facial template enrollment."
        )

    if not payload.samples or len(payload.samples) < 1:
        raise HTTPException(status_code=400, detail="At least one face sample is required for enrollment.")

    # Remove prior templates if re-enrolling
    db.query(FaceTemplate).filter(FaceTemplate.student_id == student.id).delete()

    quality_scores = []
    enrolled_count = 0

    for sample in payload.samples:
        img_bgr = _decode_base64_image(sample.image_base64)
        detected_faces = face_pipeline.detect_faces(img_bgr)

        if len(detected_faces) == 0:
            raise HTTPException(status_code=400, detail=f"No face detected in sample #{sample.sample_index}. Ensure face is directly facing camera.")
        if len(detected_faces) > 1:
            raise HTTPException(status_code=400, detail=f"Multiple faces detected in sample #{sample.sample_index}. Only the enrolling student must be in view.")

        primary_face = detected_faces[0]
        q_assessment = face_pipeline.assess_quality(primary_face["face_crop"], primary_face["bbox"], img_bgr.shape)

        if not q_assessment["is_acceptable"]:
            issues_text = "; ".join(q_assessment["issues"])
            raise HTTPException(status_code=400, detail=f"Sample #{sample.sample_index} quality check failed: {issues_text}")

        # Extract 128-dimensional embedding
        embedding = face_pipeline.extract_embedding(primary_face)

        # Encrypt embedding at rest using AES-256
        encrypted_token = crypto_service.encrypt_embedding(embedding)

        template = FaceTemplate(
            student_id=student.id,
            encrypted_embedding=encrypted_token,
            embedding_dimension=len(embedding),
            algorithm_name="OpenCV_SFace_v1",
            sample_index=sample.sample_index,
            quality_score=q_assessment["score"],
            sharpness_score=q_assessment["sharpness"],
            brightness_score=q_assessment["brightness"],
            face_bbox_json=primary_face["bbox"],
            consent_id=consent.id,
            is_active=True
        )
        db.add(template)
        quality_scores.append(q_assessment["score"])
        enrolled_count += 1

    # Update student biometric status
    student.biometric_enrolled = True
    student.biometric_enrolled_at = datetime.datetime.utcnow()
    db.commit()

    avg_quality = float(np.mean(quality_scores)) if quality_scores else 0.0

    auth_service.log_audit(
        db=db,
        user_id=user.id,
        action="FACE_BIOMETRIC_ENROLLED",
        entity_type="Student",
        entity_id=str(student.id),
        details={"samples_count": enrolled_count, "avg_quality": avg_quality},
        ip=request.client.host if request.client else None
    )

    return {
        "student_id": student.id,
        "student_name": student.full_name,
        "templates_stored": enrolled_count,
        "average_quality": round(avg_quality, 3),
        "is_success": True,
        "message": f"Successfully enrolled {enrolled_count} biometric templates for {student.full_name}."
    }

# --- 3. LIVE ATTENDANCE FRAME VERIFICATION & MATCHING ---
@router.post("/verify-frame", response_model=LiveVerifyFrameResponse)
async def verify_live_attendance_frame(
    payload: LiveVerifyFrameRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    start_time = time.time()
    session = db.query(AttendanceSession).filter(AttendanceSession.id == payload.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Attendance session not found")
    if session.status != "Active":
        raise HTTPException(status_code=400, detail=f"Session is {session.status}. Live attendance can only run on Active sessions.")

    # 1. Fetch eligible enrolled student templates for this session's division
    eligible_students = db.query(Student).filter(
        Student.division_id == session.division_id,
        Student.account_status == "Active",
        Student.biometric_enrolled == True
    ).all()

    enrolled_candidates = []
    for st in eligible_students:
        for tmpl in st.face_templates:
            if tmpl.is_active:
                try:
                    decrypted_emb = crypto_service.decrypt_embedding(tmpl.encrypted_embedding)
                    enrolled_candidates.append({
                        "student_id": st.id,
                        "student_name": st.full_name,
                        "enrollment_number": st.enrollment_number,
                        "roll_number": st.roll_number,
                        "embedding": decrypted_emb
                    })
                except Exception as e:
                    continue

    # 2. Decode incoming video frame
    img_bgr = _decode_base64_image(payload.image_base64)
    detected_faces = face_pipeline.detect_faces(img_bgr)
    results: List[DetectedFaceVerificationResult] = []

    multiple_faces = len(detected_faces) > 1

    for face in detected_faces:
        bbox = face["bbox"]
        detection_conf = face["confidence"]
        face_crop = face["face_crop"]

        # Quality check
        q_check = face_pipeline.assess_quality(face_crop, bbox, img_bgr.shape)
        if not q_check["is_acceptable"]:
            results.append(DetectedFaceVerificationResult(
                bbox=bbox,
                detection_confidence=detection_conf,
                liveness_score=0.0,
                liveness_status="Inconclusive",
                liveness_checks={},
                match_status="Low Quality",
                confidence_score=0.0,
                attendance_marked=False,
                message="Low capture quality: " + "; ".join(q_check["issues"][:1])
            ))
            continue

        # 3. Passive Liveness / Anti-spoofing verification
        liveness_res = liveness_detector.evaluate_liveness(face_crop)
        liveness_score = liveness_res["score"]
        liveness_status = liveness_res["status"]

        if not liveness_res["is_live"]:
            # Distinguish Presentation Attack (Spoof) from Inconclusive check
            is_spoof = (liveness_status == "Failed")
            assigned_status = "Spoof Detected" if is_spoof else "Inconclusive"
            status_message = (
                "Anti-spoofing check failed. Screen/paper replay detected."
                if is_spoof
                else "Liveness verification inconclusive. Please adjust lighting and face camera directly."
            )

            evt = FaceVerificationEvent(
                session_id=session.id,
                confidence_score=0.0,
                liveness_score=liveness_score,
                liveness_status=liveness_status,
                match_status=assigned_status,
                verification_latency_ms=round((time.time() - start_time) * 1000, 2),
                client_ip=request.client.host if request.client else None
            )
            db.add(evt)
            db.commit()

            results.append(DetectedFaceVerificationResult(
                bbox=bbox,
                detection_confidence=detection_conf,
                liveness_score=liveness_score,
                liveness_status=liveness_status,
                liveness_checks=liveness_res["checks"],
                match_status=assigned_status,
                confidence_score=0.0,
                attendance_marked=False,
                message=status_message
            ))
            continue

        # 4. Extract embedding and match against enrolled database templates
        query_embedding = face_pipeline.extract_embedding(face)
        match_res = face_pipeline.match_face(query_embedding, enrolled_candidates)
        confidence = match_res["confidence"]

        if not match_res["is_matched"]:
            # Unknown Person
            evt = FaceVerificationEvent(
                session_id=session.id,
                confidence_score=confidence,
                liveness_score=liveness_score,
                liveness_status=liveness_status,
                match_status="Unknown",
                verification_latency_ms=round((time.time() - start_time) * 1000, 2),
                client_ip=request.client.host if request.client else None
            )
            db.add(evt)
            db.commit()

            results.append(DetectedFaceVerificationResult(
                bbox=bbox,
                detection_confidence=detection_conf,
                liveness_score=liveness_score,
                liveness_status=liveness_status,
                liveness_checks=liveness_res["checks"],
                match_status="Unknown",
                confidence_score=confidence,
                attendance_marked=False,
                message="Unrecognized individual. Not enrolled in this class division."
            ))
            continue

        # Matched student found
        matched_info = match_res["matched_student"]
        student_id = matched_info["student_id"]

        # 5. Safeguard: Check if student already marked Present in this session
        record = db.query(AttendanceRecord).filter(
            AttendanceRecord.session_id == session.id,
            AttendanceRecord.student_id == student_id
        ).first()

        if record and record.status in ("Present", "Late"):
            results.append(DetectedFaceVerificationResult(
                bbox=bbox,
                detection_confidence=detection_conf,
                liveness_score=liveness_score,
                liveness_status=liveness_status,
                liveness_checks=liveness_res["checks"],
                match_status="Already Marked",
                confidence_score=confidence,
                matched_student_id=student_id,
                matched_student_name=matched_info["student_name"],
                matched_enrollment_number=matched_info["enrollment_number"],
                attendance_marked=False,
                message=f"Attendance already registered for {matched_info['student_name']}."
            ))
            continue

        # 6. Mark Attendance Successfully with Concurrency Protection
        try:
            if not record:
                record = AttendanceRecord(
                    session_id=session.id,
                    student_id=student_id,
                    subject_id=session.subject_id,
                    date=session.session_date
                )
                db.add(record)

            record.status = "Present"
            record.attendance_source = "Face Recognition (YuNet + SFace)"
            record.faculty_approval = "Approved"
            record.confidence_score = confidence
            record.liveness_verified = True
            record.check_in_time = datetime.datetime.utcnow()
            record.remarks = f"AI Verified (Match: {int(confidence*100)}%, Liveness: {int(liveness_score*100)}%)"

            # Record Verification Event
            event = FaceVerificationEvent(
                session_id=session.id,
                student_id=student_id,
                matched_enrollment_number=matched_info["enrollment_number"],
                matched_student_name=matched_info["student_name"],
                confidence_score=confidence,
                liveness_score=liveness_score,
                liveness_status=liveness_status,
                match_status="Verified",
                verification_latency_ms=round((time.time() - start_time) * 1000, 2),
                client_ip=request.client.host if request.client else None
            )
            db.add(event)
            db.flush()

            # Update session live counts accurately
            session.present_count = db.query(AttendanceRecord).filter(
                AttendanceRecord.session_id == session.id,
                AttendanceRecord.status == "Present"
            ).count()
            session.late_count = db.query(AttendanceRecord).filter(
                AttendanceRecord.session_id == session.id,
                AttendanceRecord.status == "Late"
            ).count()
            session.absent_count = max(0, session.eligible_students_count - session.present_count - session.late_count)

            db.commit()
        except Exception as err:
            db.rollback()
            # If a concurrent request already inserted this record
            results.append(DetectedFaceVerificationResult(
                bbox=bbox,
                detection_confidence=detection_conf,
                liveness_score=liveness_score,
                liveness_status=liveness_status,
                liveness_checks=liveness_res["checks"],
                match_status="Already Marked",
                confidence_score=confidence,
                matched_student_id=student_id,
                matched_student_name=matched_info["student_name"],
                matched_enrollment_number=matched_info["enrollment_number"],
                attendance_marked=False,
                message=f"Attendance already registered for {matched_info['student_name']}."
            ))
            continue

        # Broadcast live event via WebSocket to any connected classroom screens / faculty monitors
        ws_event = {
            "type": "ATTENDANCE_MARKED",
            "student_id": student_id,
            "student_name": matched_info["student_name"],
            "enrollment_number": matched_info["enrollment_number"],
            "roll_number": matched_info["roll_number"],
            "confidence": confidence,
            "liveness_score": liveness_score,
            "present_count": session.present_count,
            "absent_count": session.absent_count,
            "check_in_time": record.check_in_time.strftime("%H:%M:%S")
        }
        await manager.broadcast(session.id, ws_event)

        results.append(DetectedFaceVerificationResult(
            bbox=bbox,
            detection_confidence=detection_conf,
            liveness_score=liveness_score,
            liveness_status=liveness_status,
            liveness_checks=liveness_res["checks"],
            match_status="Verified",
            confidence_score=confidence,
            matched_student_id=student_id,
            matched_student_name=matched_info["student_name"],
            matched_enrollment_number=matched_info["enrollment_number"],
            attendance_marked=True,
            message=f"Verified: {matched_info['student_name']} (Roll: {matched_info['roll_number']})"
        ))

    latency = round((time.time() - start_time) * 1000, 2)

    return LiveVerifyFrameResponse(
        session_id=session.id,
        faces_detected_count=len(detected_faces),
        results=results,
        latency_ms=latency,
        timestamp=datetime.datetime.utcnow()
    )

# --- 4. WEBSOCKET REAL-TIME LIVE ATTENDANCE STREAM ---
@router.websocket("/ws/attendance/{session_id}")
async def attendance_live_websocket(websocket: WebSocket, session_id: int):
    await manager.connect(session_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Keepalive ping/pong
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(session_id, websocket)

# --- 5. BIOMETRIC CONSENT WITHDRAWAL & TEMPLATE DELETION ---
@router.delete("/biometrics/{student_id}")
def delete_biometric_templates(
    student_id: int,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(auth_service.get_current_user)
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Authorize: Student themselves or Admin
    if user.role.name == "Student":
        if student.user_id != user.id:
            raise HTTPException(status_code=403, detail="Unauthorized to delete another student's biometric data.")
    elif user.role.name not in ["Super Admin", "College Admin"]:
        raise HTTPException(status_code=403, detail="Unauthorized action.")

    # Delete all templates
    del_count = db.query(FaceTemplate).filter(FaceTemplate.student_id == student.id).delete()
    
    # Revoke consent records
    consents = db.query(ConsentRecord).filter(ConsentRecord.student_id == student.id).all()
    for c in consents:
        c.is_granted = False
        c.revoked_at = datetime.datetime.utcnow()
        c.revocation_reason = "Voluntary user withdrawal of biometric consent"

    student.biometric_enrolled = False
    student.biometric_enrolled_at = None
    student.manual_attendance_opt_in = True # Default to manual alternative

    db.commit()

    auth_service.log_audit(
        db=db,
        user_id=user.id,
        action="BIOMETRIC_DATA_PURGED",
        entity_type="Student",
        entity_id=str(student.id),
        details={"deleted_templates_count": del_count},
        ip=request.client.host if request.client else None
    )

    return {
        "message": f"All facial biometric templates ({del_count}) securely erased and consent revoked. Student has been transitioned to manual attendance mode.",
        "student_id": student.id
    }

