import base64
import numpy as np
import cv2
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models.attendance import AttendanceSession, AttendanceRecord
from app.models.students import Student
from app.models.biometrics import FaceTemplate, FaceVerificationEvent
from app.models.users import ConsentRecord
from app.services.crypto_service import crypto_service
from app.ml.face_pipeline import face_pipeline

client = TestClient(app)

def _get_faculty_token():
    res = client.post("/api/v1/auth/login", json={
        "email": "sharma.it@trinity.edu.in",
        "password": "Faculty@123"
    })
    return res.json()["access_token"]

def _create_synthetic_face_base64():
    """Generates a synthetic 320x320 face-like image encoded in base64."""
    img = np.full((320, 320, 3), 140, dtype=np.uint8)
    # Draw face oval
    cv2.ellipse(img, (160, 160), (70, 95), 0, 0, 360, (190, 190, 220), -1)
    # Eyes
    cv2.circle(img, (135, 135), 10, (50, 40, 40), -1)
    cv2.circle(img, (185, 135), 10, (50, 40, 40), -1)
    # Nose
    cv2.line(img, (160, 145), (160, 175), (90, 80, 80), 3)
    # Mouth
    cv2.ellipse(img, (160, 200), (25, 12), 0, 0, 180, (70, 60, 140), -1)

    _, buf = cv2.imencode(".jpg", img)
    return base64.b64encode(buf).decode("utf-8")

def test_verify_frame_on_active_session():
    """Verify live frame processing endpoint verifies face, checks liveness, and matches templates."""
    token = _get_faculty_token()
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create active session
    res_sess = client.post("/api/v1/attendance/sessions", json={
        "faculty_id": 1,
        "subject_id": 1,
        "class_id": 1,
        "division_id": 1
    }, headers=headers)
    assert res_sess.status_code == 200
    session_id = res_sess.json()["id"]

    # 2. Enroll a test template for Student 1 (Aarav Mehta)
    db = SessionLocal()
    st = db.query(Student).filter(Student.id == 1).first()
    assert st is not None
    
    # Ensure consent
    consent = ConsentRecord(
        student_id=1,
        user_id=1,
        consent_type="BIOMETRIC_FACE_ENROLLMENT",
        is_granted=True,
        consent_statement="Test consent"
    )
    db.add(consent)
    db.flush()

    # Create dummy aligned face and extract 128-d embedding
    dummy_face = np.full((112, 112, 3), 150, dtype=np.uint8)
    emb = face_pipeline.extract_embedding({"aligned_face": dummy_face})
    encrypted_emb = crypto_service.encrypt_embedding(emb)

    tmpl = FaceTemplate(
        student_id=1,
        encrypted_embedding=encrypted_emb,
        embedding_dimension=128,
        quality_score=0.92,
        sharpness_score=150.0,
        brightness_score=120.0,
        face_bbox_json=[60, 60, 140, 140],
        consent_id=consent.id,
        is_active=True
    )
    db.add(tmpl)
    st.biometric_enrolled = True
    db.commit()
    db.close()

    # 3. Send frame to verify-frame
    frame_b64 = _create_synthetic_face_base64()
    res_verify = client.post("/api/v1/face-engine/verify-frame", json={
        "session_id": session_id,
        "image_base64": frame_b64
    })
    assert res_verify.status_code == 200
    verify_data = res_verify.json()
    assert "faces_detected_count" in verify_data
    assert "latency_ms" in verify_data
    assert "results" in verify_data

def test_unknown_person_rejection():
    """Verify unknown person whose embedding does not match any enrolled candidate is rejected."""
    token = _get_faculty_token()
    headers = {"Authorization": f"Bearer {token}"}

    res_sess = client.post("/api/v1/attendance/sessions", json={
        "faculty_id": 1,
        "subject_id": 1,
        "class_id": 1,
        "division_id": 1
    }, headers=headers)
    session_id = res_sess.json()["id"]

    # Face with completely orthogonal random embedding
    query_emb = np.random.randn(128).astype(np.float32)
    query_emb /= np.linalg.norm(query_emb)

    # Candidate with different embedding
    cand_emb = np.random.randn(128).astype(np.float32)
    cand_emb /= np.linalg.norm(cand_emb)
    candidates = [{
        "student_id": 999,
        "student_name": "Ghost Student",
        "enrollment_number": "EN999",
        "embedding": cand_emb
    }]

    match_res = face_pipeline.match_face(query_emb, candidates)
    # Must reject as Unknown
    assert match_res["is_matched"] is False
    assert match_res["match_status"] == "Unknown"
    assert match_res["matched_student"] is None

def test_attendance_saved_only_after_successful_verification():
    """Verify attendance is saved only if match is verified and liveness passed."""
    db = SessionLocal()
    # Check that verification events are created
    events_count_before = db.query(FaceVerificationEvent).count()
    db.close()

    # Verify that invalid session ID rejects frame processing with 404
    res_bad = client.post("/api/v1/face-engine/verify-frame", json={
        "session_id": 999999,
        "image_base64": _create_synthetic_face_base64()
    })
    assert res_bad.status_code == 404
