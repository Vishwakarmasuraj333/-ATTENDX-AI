import io
import csv
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import datetime

from app.database import get_db
from app.models.students import Student, StudentSubject
from app.models.academic import Department, Course, ClassGroup, Division, Subject
from app.models.users import User, Role
from app.schemas.student import StudentCreate, StudentUpdate, StudentResponse, StudentBulkImportResult
from app.services.auth_service import auth_service

router = APIRouter(prefix="/api/v1/students", tags=["Student Management"])

def _format_student(s: Student) -> dict:
    return {
        "id": s.id,
        "enrollment_number": s.enrollment_number,
        "roll_number": s.roll_number,
        "full_name": s.full_name,
        "email": s.email,
        "phone": s.phone,
        "department_id": s.department_id,
        "course_id": s.course_id,
        "academic_year_id": s.academic_year_id,
        "semester_id": s.semester_id,
        "class_id": s.class_id,
        "division_id": s.division_id,
        "user_id": s.user_id,
        "admission_date": s.admission_date,
        "profile_photo_url": s.profile_photo_url,
        "account_status": s.account_status,
        "biometric_enrolled": s.biometric_enrolled,
        "biometric_enrolled_at": s.biometric_enrolled_at,
        "manual_attendance_opt_in": s.manual_attendance_opt_in,
        "department_name": s.department.name if s.department else None,
        "course_name": s.course.name if s.course else None,
        "class_name": s.class_group.name if s.class_group else None,
        "division_name": s.division.division_name if s.division else None,
        "created_at": s.created_at
    }

@router.get("", response_model=List[StudentResponse])
def list_students(
    search: Optional[str] = None,
    department_id: Optional[int] = None,
    course_id: Optional[int] = None,
    semester_id: Optional[int] = None,
    class_id: Optional[int] = None,
    division_id: Optional[int] = None,
    biometric_enrolled: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    q = db.query(Student)
    if search:
        search_filter = f"%{search}%"
        q = q.filter(
            (Student.full_name.ilike(search_filter)) |
            (Student.enrollment_number.ilike(search_filter)) |
            (Student.roll_number.ilike(search_filter)) |
            (Student.email.ilike(search_filter))
        )
    if department_id:
        q = q.filter(Student.department_id == department_id)
    if course_id:
        q = q.filter(Student.course_id == course_id)
    if semester_id:
        q = q.filter(Student.semester_id == semester_id)
    if class_id:
        q = q.filter(Student.class_id == class_id)
    if division_id:
        q = q.filter(Student.division_id == division_id)
    if biometric_enrolled is not None:
        q = q.filter(Student.biometric_enrolled == biometric_enrolled)

    students = q.order_by(Student.roll_number.asc()).all()
    return [_format_student(s) for s in students]

@router.get("/{student_id}", response_model=StudentResponse)
def get_student(student_id: int, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return _format_student(student)

@router.post("", response_model=StudentResponse)
def create_student(
    payload: StudentCreate,
    db: Session = Depends(get_db),
    user: User = Depends(auth_service.require_roles(["Super Admin", "College Admin", "HOD", "Class Coordinator"]))
):
    # Prevent duplicate enrollment numbers
    existing_enrollment = db.query(Student).filter(Student.enrollment_number == payload.enrollment_number).first()
    if existing_enrollment:
        raise HTTPException(status_code=400, detail=f"Enrollment number '{payload.enrollment_number}' is already registered.")

    existing_email = db.query(Student).filter(Student.email == payload.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail=f"Student email '{payload.email}' already exists.")

    # Create associated student login account if user role exists
    student_role = db.query(Role).filter(Role.name == "Student").first()
    user_account = None
    if student_role:
        user_account = User(
            email=payload.email,
            username=payload.enrollment_number.lower(),
            hashed_password=auth_service.get_password_hash("Student@123"), # default reset password
            full_name=payload.full_name,
            role_id=student_role.id,
            is_active=True
        )
        db.add(user_account)
        db.flush()

    student = Student(
        **payload.dict(),
        user_id=user_account.id if user_account else None
    )
    db.add(student)
    db.commit()
    db.refresh(student)

    # Automatically enroll in semester subjects
    semester_subjects = db.query(Subject).filter(Subject.semester_id == payload.semester_id).all()
    for sub in semester_subjects:
        ss = StudentSubject(student_id=student.id, subject_id=sub.id, semester_id=payload.semester_id)
        db.add(ss)
    db.commit()

    return _format_student(student)

@router.put("/{student_id}", response_model=StudentResponse)
def update_student(
    student_id: int,
    payload: StudentUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(auth_service.require_roles(["Super Admin", "College Admin", "HOD", "Class Coordinator"]))
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    update_data = payload.dict(exclude_unset=True)
    for k, v in update_data.items():
        setattr(student, k, v)
    
    db.commit()
    db.refresh(student)
    return _format_student(student)

@router.post("/bulk-import", response_model=StudentBulkImportResult)
async def bulk_import_students(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(auth_service.require_roles(["Super Admin", "College Admin", "HOD"]))
):
    content = await file.read()
    try:
        decoded = content.decode('utf-8')
    except Exception:
        decoded = content.decode('latin-1')

    reader = csv.DictReader(io.StringIO(decoded))
    imported = 0
    failed_rows = []
    student_role = db.query(Role).filter(Role.name == "Student").first()

    for row_idx, row in enumerate(reader, start=2):
        enrollment = row.get("enrollment_number", "").strip()
        email = row.get("email", "").strip()
        name = row.get("full_name", "").strip()
        roll = row.get("roll_number", "").strip()
        dept_id = row.get("department_id")
        course_id = row.get("course_id")
        sem_id = row.get("semester_id")
        class_id = row.get("class_id")
        div_id = row.get("division_id")

        if not (enrollment and email and name and roll and dept_id and course_id and sem_id and class_id and div_id):
            failed_rows.append({"row": row_idx, "enrollment": enrollment, "error": "Missing mandatory fields"})
            continue

        existing = db.query(Student).filter((Student.enrollment_number == enrollment) | (Student.email == email)).first()
        if existing:
            failed_rows.append({"row": row_idx, "enrollment": enrollment, "error": "Duplicate enrollment or email"})
            continue

        try:
            # Create user account
            user_acc = User(
                email=email,
                username=enrollment.lower(),
                hashed_password=auth_service.get_password_hash("Student@123"),
                full_name=name,
                role_id=student_role.id if student_role else 6,
                is_active=True
            )
            db.add(user_acc)
            db.flush()

            student = Student(
                enrollment_number=enrollment,
                roll_number=roll,
                full_name=name,
                email=email,
                phone=row.get("phone", ""),
                department_id=int(dept_id),
                course_id=int(course_id),
                academic_year_id=int(row.get("academic_year_id", 1)),
                semester_id=int(sem_id),
                class_id=int(class_id),
                division_id=int(div_id),
                user_id=user_acc.id,
                admission_date=datetime.date.today()
            )
            db.add(student)
            db.flush()

            # Enrol in subjects
            subjects = db.query(Subject).filter(Subject.semester_id == int(sem_id)).all()
            for sub in subjects:
                db.add(StudentSubject(student_id=student.id, subject_id=sub.id, semester_id=int(sem_id)))

            imported += 1
        except Exception as e:
            db.rollback()
            failed_rows.append({"row": row_idx, "enrollment": enrollment, "error": str(e)})

    db.commit()
    return {
        "total_processed": imported + len(failed_rows),
        "successfully_imported": imported,
        "failed_rows": failed_rows
    }

