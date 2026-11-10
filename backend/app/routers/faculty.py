from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.faculty import Faculty, FacultySubject
from app.models.academic import Department, Subject, Division
from app.models.users import User, Role
from app.schemas.faculty import FacultyCreate, FacultyUpdate, FacultyResponse, SubjectAllocationItem
from app.services.auth_service import auth_service

router = APIRouter(prefix="/api/v1/faculty", tags=["Faculty Management"])

def _format_faculty(f: Faculty) -> dict:
    allocations = []
    for fs in f.assigned_subjects:
        allocations.append({
            "subject_id": fs.subject_id,
            "subject_name": fs.subject.subject_name if fs.subject else None,
            "subject_code": fs.subject.subject_code if fs.subject else None,
            "division_id": fs.division_id
        })
    return {
        "id": f.id,
        "faculty_id_code": f.faculty_id_code,
        "full_name": f.full_name,
        "email": f.email,
        "phone": f.phone,
        "designation": f.designation,
        "department_id": f.department_id,
        "account_status": f.account_status,
        "user_id": f.user_id,
        "department_name": f.department.name if f.department else None,
        "assigned_subjects": allocations,
        "created_at": f.created_at
    }

@router.get("", response_model=List[FacultyResponse])
def list_faculty(department_id: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(Faculty)
    if department_id:
        q = q.filter(Faculty.department_id == department_id)
    return [_format_faculty(f) for f in q.all()]

@router.get("/{faculty_id}", response_model=FacultyResponse)
def get_faculty(faculty_id: int, db: Session = Depends(get_db)):
    f = db.query(Faculty).filter(Faculty.id == faculty_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Faculty member not found")
    return _format_faculty(f)

@router.post("", response_model=FacultyResponse)
def create_faculty(
    payload: FacultyCreate,
    db: Session = Depends(get_db),
    user: User = Depends(auth_service.require_roles(["Super Admin", "College Admin", "HOD"]))
):
    existing = db.query(Faculty).filter(
        (Faculty.faculty_id_code == payload.faculty_id_code) | (Faculty.email == payload.email)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Faculty code or email already registered.")

    faculty_role = db.query(Role).filter(Role.name == "Faculty").first()
    user_account = User(
        email=payload.email,
        username=payload.faculty_id_code.lower(),
        hashed_password=auth_service.get_password_hash("Faculty@123"),
        full_name=payload.full_name,
        role_id=faculty_role.id if faculty_role else 4,
        is_active=True
    )
    db.add(user_account)
    db.flush()

    faculty = Faculty(
        **payload.dict(),
        user_id=user_account.id
    )
    db.add(faculty)
    db.commit()
    db.refresh(faculty)
    return _format_faculty(faculty)

@router.post("/{faculty_id}/allocate-subject")
def allocate_subject(
    faculty_id: int,
    payload: SubjectAllocationItem,
    db: Session = Depends(get_db),
    user: User = Depends(auth_service.require_roles(["Super Admin", "College Admin", "HOD"]))
):
    faculty = db.query(Faculty).filter(Faculty.id == faculty_id).first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty not found")

    existing = db.query(FacultySubject).filter(
        FacultySubject.faculty_id == faculty_id,
        FacultySubject.subject_id == payload.subject_id,
        FacultySubject.division_id == payload.division_id
    ).first()
    if existing:
        return {"message": "Subject already allocated to this faculty"}

    fs = FacultySubject(
        faculty_id=faculty_id,
        subject_id=payload.subject_id,
        division_id=payload.division_id
    )
    db.add(fs)
    db.commit()
    return {"message": "Subject successfully allocated"}

