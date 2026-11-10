from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.timetable import TimetableSlot
from app.models.users import User
from app.schemas.timetable import TimetableCreate, TimetableResponse, TimetableConflictCheck
from app.services.auth_service import auth_service

router = APIRouter(prefix="/api/v1/timetables", tags=["Timetable & Scheduling"])

def _check_time_overlap(s1: str, e1: str, s2: str, e2: str) -> bool:
    """
    Returns True if time ranges (HH:MM) overlap.
    """
    return (s1 < e2) and (e1 > s2)

def _format_slot(t: TimetableSlot) -> dict:
    return {
        "id": t.id,
        "department_id": t.department_id,
        "course_id": t.course_id,
        "semester_id": t.semester_id,
        "class_id": t.class_id,
        "division_id": t.division_id,
        "subject_id": t.subject_id,
        "faculty_id": t.faculty_id,
        "room": t.room,
        "day_of_week": t.day_of_week,
        "start_time": t.start_time,
        "end_time": t.end_time,
        "is_active": t.is_active,
        "subject_name": t.subject.subject_name if t.subject else None,
        "subject_code": t.subject.subject_code if t.subject else None,
        "faculty_name": t.faculty.full_name if t.faculty else None,
        "class_name": t.division.class_group.name if t.division and t.division.class_group else None,
        "division_name": t.division.division_name if t.division else None,
        "created_at": t.created_at
    }

@router.get("", response_model=List[TimetableResponse])
def list_timetables(
    faculty_id: Optional[int] = None,
    class_id: Optional[int] = None,
    division_id: Optional[int] = None,
    day_of_week: Optional[str] = None,
    db: Session = Depends(get_db)
):
    q = db.query(TimetableSlot).filter(TimetableSlot.is_active == True)
    if faculty_id:
        q = q.filter(TimetableSlot.faculty_id == faculty_id)
    if class_id:
        q = q.filter(TimetableSlot.class_id == class_id)
    if division_id:
        q = q.filter(TimetableSlot.division_id == division_id)
    if day_of_week:
        q = q.filter(TimetableSlot.day_of_week == day_of_week)
    return [_format_slot(t) for t in q.all()]

@router.post("/check-conflict", response_model=TimetableConflictCheck)
def check_conflict(payload: TimetableCreate, db: Session = Depends(get_db)):
    # 1. Check Faculty Conflict
    faculty_slots = db.query(TimetableSlot).filter(
        TimetableSlot.faculty_id == payload.faculty_id,
        TimetableSlot.day_of_week == payload.day_of_week,
        TimetableSlot.is_active == True
    ).all()
    for s in faculty_slots:
        if _check_time_overlap(payload.start_time, payload.end_time, s.start_time, s.end_time):
            return {
                "has_conflict": True,
                "conflict_type": "FACULTY_OVERLAP",
                "conflict_detail": f"Faculty member is already scheduled for '{s.subject.subject_name if s.subject else 'Class'}' in {s.room} from {s.start_time} to {s.end_time}."
            }

    # 2. Check Room Conflict
    room_slots = db.query(TimetableSlot).filter(
        TimetableSlot.room == payload.room,
        TimetableSlot.day_of_week == payload.day_of_week,
        TimetableSlot.is_active == True
    ).all()
    for s in room_slots:
        if _check_time_overlap(payload.start_time, payload.end_time, s.start_time, s.end_time):
            return {
                "has_conflict": True,
                "conflict_type": "ROOM_OVERLAP",
                "conflict_detail": f"Room {payload.room} is already allocated from {s.start_time} to {s.end_time}."
            }

    # 3. Check Division Conflict
    div_slots = db.query(TimetableSlot).filter(
        TimetableSlot.division_id == payload.division_id,
        TimetableSlot.day_of_week == payload.day_of_week,
        TimetableSlot.is_active == True
    ).all()
    for s in div_slots:
        if _check_time_overlap(payload.start_time, payload.end_time, s.start_time, s.end_time):
            return {
                "has_conflict": True,
                "conflict_type": "CLASS_OVERLAP",
                "conflict_detail": f"Division is already scheduled for {s.subject.subject_name if s.subject else 'another lecture'} at this time."
            }

    return {"has_conflict": False, "conflict_type": None, "conflict_detail": None}

@router.post("", response_model=TimetableResponse)
def create_timetable_slot(
    payload: TimetableCreate,
    db: Session = Depends(get_db),
    user: User = Depends(auth_service.require_roles(["Super Admin", "College Admin", "HOD", "Class Coordinator"]))
):
    # Perform strict conflict check
    conflict = check_conflict(payload, db)
    if conflict["has_conflict"]:
        raise HTTPException(
            status_code=400,
            detail=f"Scheduling Conflict: {conflict['conflict_detail']}"
        )

    slot = TimetableSlot(**payload.dict())
    db.add(slot)
    db.commit()
    db.refresh(slot)
    return _format_slot(slot)

