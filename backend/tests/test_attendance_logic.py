import pytest
import datetime
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models.attendance import AttendanceSession, AttendanceRecord, AttendanceCorrectionRequest
from app.models.students import Student
from app.models.users import User, AuditLog
from app.services.auth_service import auth_service
from app.ml.risk_analyzer import AttendanceRiskAnalyzer

client = TestClient(app)

def _get_admin_token():
    res = client.post("/api/v1/auth/login", json={
        "email": "admin@trinity.edu.in",
        "password": "Admin@123"
    })
    return res.json()["access_token"]

def _get_faculty_token():
    res = client.post("/api/v1/auth/login", json={
        "email": "sharma.it@trinity.edu.in",
        "password": "Faculty@123"
    })
    return res.json()["access_token"]

def test_attendance_status_calculations():
    """Verify present, late, absent, excused arithmetic via AttendanceRiskAnalyzer."""
    # 8 present, 2 late, 2 absent out of 12 eligible -> 10/12 = 83.33%
    pct = AttendanceRiskAnalyzer.calculate_attendance_percentage(
        present_count=8, late_count=2, total_eligible=12, late_weight=1.0
    )
    assert pct == 83.33

    # Zero sessions must return 100.0%
    assert AttendanceRiskAnalyzer.calculate_attendance_percentage(0, 0, 0) == 100.0

    # With late weighted as 0.8: (8 + 1.6) / 12 = 9.6 / 12 = 80.0%
    pct_weighted = AttendanceRiskAnalyzer.calculate_attendance_percentage(
        present_count=8, late_count=2, total_eligible=12, late_weight=0.8
    )
    assert pct_weighted == 80.0

def test_absent_marking_only_after_session_closing():
    """
    Verify:
    1. Newly created active session does NOT mark students Absent immediately.
    2. When faculty closes the session, Absent status is finalized for all unverified eligible students.
    """
    token = _get_faculty_token()
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create a session for Division 1 (MSC IT Sem 1 Div A)
    res = client.post("/api/v1/attendance/sessions", json={
        "faculty_id": 1,
        "subject_id": 1,
        "class_id": 1,
        "division_id": 1,
        "room": "Lab 101"
    }, headers=headers)
    assert res.status_code == 200
    sess_data = res.json()
    session_id = sess_data["id"]
    assert sess_data["status"] == "Active"
    assert sess_data["eligible_students_count"] >= 1
    # Before closing, absent_count must be 0 (unfinalized)
    assert sess_data["absent_count"] == 0

    # Verify no AttendanceRecord entries marked Absent exist for this session yet
    db = SessionLocal()
    active_absents = db.query(AttendanceRecord).filter(
        AttendanceRecord.session_id == session_id,
        AttendanceRecord.status == "Absent"
    ).count()
    assert active_absents == 0
    db.close()

    # 2. Mark one student Present manually during the active session
    res_mark = client.post("/api/v1/attendance/manual-record", json={
        "session_id": session_id,
        "student_id": 1,
        "status": "Present",
        "remarks": "Arrived on time"
    }, headers=headers)
    assert res_mark.status_code == 200

    # 3. Faculty completes (closes) the session
    res_close = client.post(f"/api/v1/attendance/sessions/{session_id}/complete", headers=headers)
    assert res_close.status_code == 200
    closed_sess = res_close.json()
    assert closed_sess["status"] == "Completed"
    assert closed_sess["present_count"] == 1
    assert closed_sess["absent_count"] == closed_sess["eligible_students_count"] - 1

    # 4. Verify in DB that Absent records were officially finalized upon closure
    db = SessionLocal()
    closed_records = db.query(AttendanceRecord).filter(AttendanceRecord.session_id == session_id).all()
    absent_records = [r for r in closed_records if r.status == "Absent"]
    assert len(absent_records) == closed_sess["absent_count"]
    for r in absent_records:
        assert r.attendance_source == "Session Close Finalization"
        assert r.faculty_approval == "Approved"

    # Verify audit log for session closing
    audit = db.query(AuditLog).filter(
        AuditLog.action == "SESSION_CLOSED_ROSTER_FINALIZED",
        AuditLog.entity_id == str(session_id)
    ).first()
    assert audit is not None
    db.close()

def test_duplicate_attendance_event_prevention():
    """Verify marking attendance twice for the same student in a session is handled idempotently."""
    token = _get_faculty_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Create session
    res = client.post("/api/v1/attendance/sessions", json={
        "faculty_id": 1,
        "subject_id": 1,
        "class_id": 1,
        "division_id": 1
    }, headers=headers)
    session_id = res.json()["id"]

    # First manual mark -> Present
    res1 = client.post("/api/v1/attendance/manual-record", json={
        "session_id": session_id,
        "student_id": 1,
        "status": "Present"
    }, headers=headers)
    assert res1.status_code == 200

    # Second mark -> Update existing record without creating duplicate row
    res2 = client.post("/api/v1/attendance/manual-record", json={
        "session_id": session_id,
        "student_id": 1,
        "status": "Present",
        "remarks": "Duplicate check"
    }, headers=headers)
    assert res2.status_code == 200

    db = SessionLocal()
    records_count = db.query(AttendanceRecord).filter(
        AttendanceRecord.session_id == session_id,
        AttendanceRecord.student_id == 1
    ).count()
    assert records_count == 1, "Duplicate attendance record row was created!"
    db.close()

def test_faculty_correction_review_and_audit():
    """Verify student correction requests, faculty review approval, session recount and audit trail."""
    token_admin = _get_admin_token()
    headers_admin = {"Authorization": f"Bearer {token_admin}"}

    # Find an existing record or create one
    db = SessionLocal()
    rec = db.query(AttendanceRecord).first()
    rec_id = rec.id
    student_id = rec.student_id
    db.close()

    # Submit correction request
    res_sub = client.post("/api/v1/attendance/corrections", json={
        "attendance_record_id": rec_id,
        "student_id": student_id,
        "requested_status": "Excused",
        "reason": "Official Inter-University Hackathon Participation"
    }, headers=headers_admin)
    assert res_sub.status_code == 200
    corr_id = res_sub.json()["id"]

    # Review correction request
    res_rev = client.put(f"/api/v1/attendance/corrections/{corr_id}/review", json={
        "status": "Approved",
        "review_remarks": "Approved with official event certificate"
    }, headers=headers_admin)
    assert res_rev.status_code == 200

    # Verify record was updated to Excused
    db = SessionLocal()
    updated_rec = db.query(AttendanceRecord).filter(AttendanceRecord.id == rec_id).first()
    assert updated_rec.status == "Excused"
    assert updated_rec.is_excused is True

    # Verify audit log
    audit = db.query(AuditLog).filter(
        AuditLog.action == "ATTENDANCE_CORRECTION_REVIEWED",
        AuditLog.entity_id == str(corr_id)
    ).first()
    assert audit is not None
    db.close()
