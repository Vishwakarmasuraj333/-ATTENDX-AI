from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List, Optional
import datetime
import uuid

from app.database import get_db
from app.models.attendance import AttendanceSession, AttendanceRecord, AttendanceCorrectionRequest
from app.models.students import Student
from app.models.academic import Subject, Division, ClassGroup
from app.models.faculty import Faculty
from app.models.users import User
from app.schemas.attendance import (
    AttendanceSessionCreate, AttendanceSessionResponse,
    AttendanceRecordResponse, ManualAttendanceRequest, BulkManualAttendanceRequest,
    AttendanceCorrectionCreate, AttendanceCorrectionReview, AttendanceCorrectionResponse
)
from app.services.auth_service import auth_service
from app.ml.risk_analyzer import AttendanceRiskAnalyzer

router = APIRouter(prefix="/api/v1/attendance", tags=["Attendance Management"])

def _format_session(s: AttendanceSession) -> dict:
    return {
        "id": s.id,
        "timetable_slot_id": s.timetable_slot_id,
        "faculty_id": s.faculty_id,
        "faculty_name": s.faculty.full_name if s.faculty else None,
        "subject_id": s.subject_id,
        "subject_name": s.subject.subject_name if s.subject else None,
        "subject_code": s.subject.subject_code if s.subject else None,
        "class_id": s.class_id,
        "class_name": s.class_group.name if s.class_group else None,
        "division_id": s.division_id,
        "division_name": s.division.division_name if s.division else None,
        "session_date": s.session_date,
        "start_time": s.start_time,
        "end_time": s.end_time,
        "session_code": s.session_code,
        "status": s.status,
        "room": s.room,
        "eligible_students_count": s.eligible_students_count,
        "present_count": s.present_count,
        "absent_count": s.absent_count,
        "late_count": s.late_count,
        "created_at": s.created_at
    }

def _format_record(r: AttendanceRecord) -> dict:
    return {
        "id": r.id,
        "session_id": r.session_id,
        "student_id": r.student_id,
        "student_name": r.student.full_name if r.student else None,
        "enrollment_number": r.student.enrollment_number if r.student else None,
        "roll_number": r.student.roll_number if r.student else None,
        "subject_id": r.subject_id,
        "subject_name": r.subject.subject_name if r.subject else None,
        "date": r.date,
        "check_in_time": r.check_in_time,
        "status": r.status,
        "attendance_source": r.attendance_source,
        "faculty_approval": r.faculty_approval,
        "confidence_score": r.confidence_score,
        "liveness_verified": r.liveness_verified,
        "is_excused": r.is_excused,
        "remarks": r.remarks
    }

@router.get("/sessions", response_model=List[AttendanceSessionResponse])
def list_sessions(
    faculty_id: Optional[int] = None,
    subject_id: Optional[int] = None,
    division_id: Optional[int] = None,
    status: Optional[str] = None,
    date: Optional[datetime.date] = None,
    db: Session = Depends(get_db)
):
    q = db.query(AttendanceSession)
    if faculty_id:
        q = q.filter(AttendanceSession.faculty_id == faculty_id)
    if subject_id:
        q = q.filter(AttendanceSession.subject_id == subject_id)
    if division_id:
        q = q.filter(AttendanceSession.division_id == division_id)
    if status:
        q = q.filter(AttendanceSession.status == status)
    if date:
        q = q.filter(AttendanceSession.session_date == date)
    sessions = q.order_by(AttendanceSession.created_at.desc()).all()
    return [_format_session(s) for s in sessions]

@router.post("/sessions", response_model=AttendanceSessionResponse)
def create_session(
    payload: AttendanceSessionCreate,
    db: Session = Depends(get_db),
    user: User = Depends(auth_service.require_roles(["Super Admin", "College Admin", "Faculty", "HOD"]))
):
    today = payload.session_date or datetime.date.today()
    session_code = f"SES-{today.strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

    # Fetch eligible students in this division
    students = db.query(Student).filter(
        Student.division_id == payload.division_id,
        Student.account_status == "Active"
    ).all()

    session = AttendanceSession(
        timetable_slot_id=payload.timetable_slot_id,
        faculty_id=payload.faculty_id,
        subject_id=payload.subject_id,
        class_id=payload.class_id,
        division_id=payload.division_id,
        session_date=today,
        start_time=datetime.datetime.utcnow(),
        session_code=session_code,
        status="Active",
        room=payload.room,
        eligible_students_count=len(students),
        present_count=0,
        absent_count=0, # Absent status is finalized only after session closing
        late_count=0
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return _format_session(session)

@router.get("/sessions/{session_id}", response_model=AttendanceSessionResponse)
def get_session(session_id: int, db: Session = Depends(get_db)):
    session = db.query(AttendanceSession).filter(AttendanceSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Attendance session not found")
    return _format_session(session)

@router.post("/sessions/{session_id}/complete", response_model=AttendanceSessionResponse)
def complete_session(
    session_id: int,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(auth_service.require_roles(["Super Admin", "College Admin", "Faculty", "HOD"]))
):
    session = db.query(AttendanceSession).filter(AttendanceSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Attendance session not found")

    session.status = "Completed"
    session.end_time = datetime.datetime.utcnow()

    # Verify eligible student roster for the division
    eligible_students = db.query(Student).filter(
        Student.division_id == session.division_id,
        Student.account_status == "Active"
    ).all()

    existing_records = {
        r.student_id: r for r in db.query(AttendanceRecord).filter(AttendanceRecord.session_id == session_id).all()
    }

    # Finalize Absent status strictly after session is closed and eligible roster is verified
    finalized_absent = 0
    for st in eligible_students:
        rec = existing_records.get(st.id)
        if not rec:
            absent_rec = AttendanceRecord(
                session_id=session.id,
                student_id=st.id,
                subject_id=session.subject_id,
                date=session.session_date,
                status="Absent",
                attendance_source="Session Close Finalization",
                faculty_approval="Approved"
            )
            db.add(absent_rec)
            finalized_absent += 1
        elif rec.status not in ("Present", "Late", "Excused"):
            rec.status = "Absent"
            rec.attendance_source = "Session Close Finalization"
            rec.faculty_approval = "Approved"
            finalized_absent += 1

    db.flush()

    # Refresh counts from actual records
    present_c = db.query(AttendanceRecord).filter(
        AttendanceRecord.session_id == session_id,
        AttendanceRecord.status == "Present"
    ).count()
    late_c = db.query(AttendanceRecord).filter(
        AttendanceRecord.session_id == session_id,
        AttendanceRecord.status == "Late"
    ).count()
    absent_c = db.query(AttendanceRecord).filter(
        AttendanceRecord.session_id == session_id,
        AttendanceRecord.status == "Absent"
    ).count()

    session.eligible_students_count = len(eligible_students)
    session.present_count = present_c
    session.late_count = late_c
    session.absent_count = absent_c

    db.commit()
    db.refresh(session)

    auth_service.log_audit(
        db=db,
        user_id=user.id,
        action="SESSION_CLOSED_ROSTER_FINALIZED",
        entity_type="AttendanceSession",
        entity_id=str(session.id),
        details={
            "eligible_students": len(eligible_students),
            "present": present_c,
            "late": late_c,
            "absent": absent_c
        },
        ip=request.client.host if request.client else None
    )

    return _format_session(session)

@router.get("/sessions/{session_id}/records", response_model=List[AttendanceRecordResponse])
def get_session_records(session_id: int, db: Session = Depends(get_db)):
    records = db.query(AttendanceRecord).filter(
        AttendanceRecord.session_id == session_id
    ).join(Student).order_by(Student.roll_number.asc()).all()
    return [_format_record(r) for r in records]

@router.post("/manual-record")
def update_manual_attendance(
    payload: ManualAttendanceRequest,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(auth_service.require_roles(["Super Admin", "College Admin", "Faculty", "HOD"]))
):
    record = db.query(AttendanceRecord).filter(
        AttendanceRecord.session_id == payload.session_id,
        AttendanceRecord.student_id == payload.student_id
    ).first()

    if not record:
        session = db.query(AttendanceSession).filter(AttendanceSession.id == payload.session_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        record = AttendanceRecord(
            session_id=payload.session_id,
            student_id=payload.student_id,
            subject_id=session.subject_id,
            date=session.session_date
        )
        db.add(record)

    old_status = record.status
    record.status = payload.status
    record.attendance_source = f"Manual ({user.role.name if user.role else 'Faculty'})"
    record.faculty_approval = "Approved"
    record.remarks = payload.remarks
    if payload.status in ("Present", "Late") and not record.check_in_time:
        record.check_in_time = datetime.datetime.utcnow()

    # Update session aggregates
    session = db.query(AttendanceSession).filter(AttendanceSession.id == payload.session_id).first()
    if session:
        session.present_count = db.query(AttendanceRecord).filter(AttendanceRecord.session_id == session.id, AttendanceRecord.status == "Present").count()
        session.late_count = db.query(AttendanceRecord).filter(AttendanceRecord.session_id == session.id, AttendanceRecord.status == "Late").count()
        session.absent_count = db.query(AttendanceRecord).filter(AttendanceRecord.session_id == session.id, AttendanceRecord.status == "Absent").count()

    db.commit()

    auth_service.log_audit(
        db=db,
        user_id=user.id,
        action="MANUAL_ATTENDANCE_OVERRIDE",
        entity_type="AttendanceRecord",
        entity_id=str(record.id),
        details={"student_id": payload.student_id, "from": old_status, "to": payload.status},
        ip=request.client.host if request.client else None
    )

    return {"message": "Attendance record updated successfully", "record": _format_record(record)}

@router.post("/bulk-manual-records")
def bulk_update_manual_attendance(
    payload: BulkManualAttendanceRequest,
    db: Session = Depends(get_db),
    user: User = Depends(auth_service.require_roles(["Super Admin", "College Admin", "Faculty", "HOD"]))
):
    session = db.query(AttendanceSession).filter(AttendanceSession.id == payload.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    for item in payload.records:
        rec = db.query(AttendanceRecord).filter(
            AttendanceRecord.session_id == payload.session_id,
            AttendanceRecord.student_id == item.student_id
        ).first()
        if rec:
            rec.status = item.status
            rec.attendance_source = f"Bulk Manual ({user.role.name if user.role else 'Faculty'})"
            rec.faculty_approval = "Approved"
            rec.remarks = item.remarks
            if item.status in ("Present", "Late") and not rec.check_in_time:
                rec.check_in_time = datetime.datetime.utcnow()

    db.commit()

    # Recalculate session totals
    session.present_count = db.query(AttendanceRecord).filter(AttendanceRecord.session_id == session.id, AttendanceRecord.status == "Present").count()
    session.late_count = db.query(AttendanceRecord).filter(AttendanceRecord.session_id == session.id, AttendanceRecord.status == "Late").count()
    session.absent_count = db.query(AttendanceRecord).filter(AttendanceRecord.session_id == session.id, AttendanceRecord.status == "Absent").count()
    db.commit()

    return {"message": f"Successfully updated {len(payload.records)} student attendance records"}

@router.get("/student/{student_id}/history")
def get_student_attendance_history(student_id: int, subject_id: Optional[int] = None, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    q = db.query(AttendanceRecord).filter(AttendanceRecord.student_id == student_id)
    if subject_id:
        q = q.filter(AttendanceRecord.subject_id == subject_id)
    records = q.order_by(AttendanceRecord.date.desc()).all()

    # Calculate overall institutional percentage
    eligible_records = [r for r in records if not r.is_excused]
    total_eligible = len(eligible_records)
    present_count = sum(1 for r in eligible_records if r.status == "Present")
    late_count = sum(1 for r in eligible_records if r.status == "Late")
    absent_count = sum(1 for r in eligible_records if r.status == "Absent")
    excused_count = sum(1 for r in records if r.is_excused)

    pct = AttendanceRiskAnalyzer.calculate_attendance_percentage(present_count, late_count, total_eligible)

    # Subject-wise percentage breakdown
    subjects_dict = {}
    for r in records:
        s_id = r.subject_id
        s_name = r.subject.subject_name if r.subject else "General"
        if s_id not in subjects_dict:
            subjects_dict[s_id] = {
                "subject_id": s_id,
                "subject_name": s_name,
                "subject_code": r.subject.subject_code if r.subject else "",
                "present": 0,
                "late": 0,
                "absent": 0,
                "eligible": 0
            }
        if not r.is_excused:
            subjects_dict[s_id]["eligible"] += 1
            if r.status == "Present":
                subjects_dict[s_id]["present"] += 1
            elif r.status == "Late":
                subjects_dict[s_id]["late"] += 1
            elif r.status == "Absent":
                subjects_dict[s_id]["absent"] += 1

    subject_breakdown = []
    for s_info in subjects_dict.values():
        s_pct = AttendanceRiskAnalyzer.calculate_attendance_percentage(
            s_info["present"], s_info["late"], s_info["eligible"]
        )
        subject_breakdown.append({**s_info, "percentage": s_pct})

    return {
        "student_id": student.id,
        "student_name": student.full_name,
        "enrollment_number": student.enrollment_number,
        "roll_number": student.roll_number,
        "attendance_percentage": pct,
        "total_eligible_sessions": total_eligible,
        "present_count": present_count,
        "late_count": late_count,
        "absent_count": absent_count,
        "excused_count": excused_count,
        "subject_breakdown": subject_breakdown,
        "records": [_format_record(r) for r in records]
    }

# --- Attendance Correction Requests ---
@router.post("/corrections", response_model=AttendanceCorrectionResponse)
def submit_correction_request(
    payload: AttendanceCorrectionCreate,
    db: Session = Depends(get_db),
    user: User = Depends(auth_service.get_current_user)
):
    record = db.query(AttendanceRecord).filter(AttendanceRecord.id == payload.attendance_record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Attendance record not found")

    corr = AttendanceCorrectionRequest(
        attendance_record_id=payload.attendance_record_id,
        student_id=record.student_id,
        requested_status=payload.requested_status,
        reason=payload.reason,
        evidence_document_url=payload.evidence_document_url,
        status="Pending"
    )
    db.add(corr)
    db.commit()
    db.refresh(corr)

    return {
        "id": corr.id,
        "attendance_record_id": corr.attendance_record_id,
        "student_id": corr.student_id,
        "student_name": corr.attendance_record.student.full_name if corr.attendance_record and corr.attendance_record.student else None,
        "requested_status": corr.requested_status,
        "reason": corr.reason,
        "evidence_document_url": corr.evidence_document_url,
        "status": corr.status,
        "reviewed_by": corr.reviewed_by,
        "review_remarks": corr.review_remarks,
        "reviewed_at": corr.reviewed_at,
        "created_at": corr.created_at
    }

@router.get("/corrections", response_model=List[AttendanceCorrectionResponse])
def list_correction_requests(status: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(AttendanceCorrectionRequest)
    if status:
        q = q.filter(AttendanceCorrectionRequest.status == status)
    results = q.order_by(AttendanceCorrectionRequest.created_at.desc()).all()
    return [{
        "id": c.id,
        "attendance_record_id": c.attendance_record_id,
        "student_id": c.student_id,
        "student_name": c.attendance_record.student.full_name if c.attendance_record and c.attendance_record.student else None,
        "requested_status": c.requested_status,
        "reason": c.reason,
        "evidence_document_url": c.evidence_document_url,
        "status": c.status,
        "reviewed_by": c.reviewed_by,
        "review_remarks": c.review_remarks,
        "reviewed_at": c.reviewed_at,
        "created_at": c.created_at
    } for c in results]

@router.put("/corrections/{correction_id}/review")
def review_correction_request(
    correction_id: int,
    payload: AttendanceCorrectionReview,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(auth_service.require_roles(["Super Admin", "College Admin", "Faculty", "HOD"]))
):
    corr = db.query(AttendanceCorrectionRequest).filter(AttendanceCorrectionRequest.id == correction_id).first()
    if not corr:
        raise HTTPException(status_code=404, detail="Correction request not found")

    corr.status = payload.status # Approved / Rejected
    corr.review_remarks = payload.review_remarks
    corr.reviewed_by = user.id
    corr.reviewed_at = datetime.datetime.utcnow()

    # If approved, update the actual attendance record
    if payload.status == "Approved":
        record = db.query(AttendanceRecord).filter(AttendanceRecord.id == corr.attendance_record_id).first()
        if record:
            record.status = corr.requested_status
            record.attendance_source = f"Approved Correction ({user.role.name if user.role else 'Admin'})"
            record.faculty_approval = "Approved"
            record.remarks = f"Correction approved: {corr.reason}"
            if corr.requested_status == "Excused":
                record.is_excused = True
            elif corr.requested_status in ("Present", "Late"):
                record.is_excused = False
                if not record.check_in_time:
                    record.check_in_time = datetime.datetime.utcnow()

            # Synchronize session totals
            session = db.query(AttendanceSession).filter(AttendanceSession.id == record.session_id).first()
            if session:
                session.present_count = db.query(AttendanceRecord).filter(AttendanceRecord.session_id == session.id, AttendanceRecord.status == "Present").count()
                session.late_count = db.query(AttendanceRecord).filter(AttendanceRecord.session_id == session.id, AttendanceRecord.status == "Late").count()
                session.absent_count = db.query(AttendanceRecord).filter(AttendanceRecord.session_id == session.id, AttendanceRecord.status == "Absent").count()

    db.commit()

    auth_service.log_audit(
        db=db,
        user_id=user.id,
        action="ATTENDANCE_CORRECTION_REVIEWED",
        entity_type="AttendanceCorrectionRequest",
        entity_id=str(corr.id),
        details={"status": payload.status, "requested_status": corr.requested_status, "student_id": corr.student_id},
        ip=request.client.host if request.client else None
    )

    return {"message": f"Correction request {payload.status.lower()} successfully."}

