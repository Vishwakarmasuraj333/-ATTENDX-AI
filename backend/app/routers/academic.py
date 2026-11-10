from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.academic import College, Department, Course, AcademicYear, Semester, ClassGroup, Division, Subject
from app.models.users import User
from app.schemas.academic import (
    CollegeCreate, CollegeResponse,
    DepartmentCreate, DepartmentResponse,
    CourseCreate, CourseResponse,
    AcademicYearCreate, AcademicYearResponse,
    SemesterCreate, SemesterResponse,
    ClassGroupCreate, ClassGroupResponse,
    DivisionCreate, DivisionResponse,
    SubjectCreate, SubjectResponse
)
from app.services.auth_service import auth_service

router = APIRouter(prefix="/api/v1/academic", tags=["Academic Governance"])

# --- Colleges ---
@router.get("/colleges", response_model=List[CollegeResponse])
def list_colleges(db: Session = Depends(get_db)):
    return db.query(College).all()

@router.post("/colleges", response_model=CollegeResponse)
def create_college(
    payload: CollegeCreate,
    db: Session = Depends(get_db),
    user: User = Depends(auth_service.require_roles(["Super Admin"]))
):
    exists = db.query(College).filter(College.code == payload.code).first()
    if exists:
        raise HTTPException(status_code=400, detail="College with this code already exists.")
    col = College(**payload.dict())
    db.add(col)
    db.commit()
    db.refresh(col)
    return col

# --- Departments ---
@router.get("/departments", response_model=List[DepartmentResponse])
def list_departments(college_id: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(Department)
    if college_id:
        q = q.filter(Department.college_id == college_id)
    return q.all()

@router.post("/departments", response_model=DepartmentResponse)
def create_department(
    payload: DepartmentCreate,
    db: Session = Depends(get_db),
    user: User = Depends(auth_service.require_roles(["Super Admin", "College Admin"]))
):
    exists = db.query(Department).filter(Department.code == payload.code).first()
    if exists:
        raise HTTPException(status_code=400, detail="Department with this code already exists.")
    dept = Department(**payload.dict())
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return dept

# --- Courses ---
@router.get("/courses", response_model=List[CourseResponse])
def list_courses(department_id: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(Course)
    if department_id:
        q = q.filter(Course.department_id == department_id)
    return q.all()

@router.post("/courses", response_model=CourseResponse)
def create_course(
    payload: CourseCreate,
    db: Session = Depends(get_db),
    user: User = Depends(auth_service.require_roles(["Super Admin", "College Admin"]))
):
    course = Course(**payload.dict())
    db.add(course)
    db.commit()
    db.refresh(course)
    return course

# --- Academic Years ---
@router.get("/academic-years", response_model=List[AcademicYearResponse])
def list_academic_years(college_id: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(AcademicYear)
    if college_id:
        q = q.filter(AcademicYear.college_id == college_id)
    return q.all()

# --- Semesters ---
@router.get("/semesters", response_model=List[SemesterResponse])
def list_semesters(course_id: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(Semester)
    if course_id:
        q = q.filter(Semester.course_id == course_id)
    return q.all()

# --- Classes ---
@router.get("/classes", response_model=List[ClassGroupResponse])
def list_classes(course_id: Optional[int] = None, semester_id: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(ClassGroup)
    if course_id:
        q = q.filter(ClassGroup.course_id == course_id)
    if semester_id:
        q = q.filter(ClassGroup.semester_id == semester_id)
    return q.all()

@router.post("/classes", response_model=ClassGroupResponse)
def create_class(
    payload: ClassGroupCreate,
    db: Session = Depends(get_db),
    user: User = Depends(auth_service.require_roles(["Super Admin", "College Admin", "HOD"]))
):
    cl = ClassGroup(**payload.dict())
    db.add(cl)
    db.commit()
    db.refresh(cl)
    return cl

# --- Divisions ---
@router.get("/divisions", response_model=List[DivisionResponse])
def list_divisions(class_id: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(Division)
    if class_id:
        q = q.filter(Division.class_id == class_id)
    return q.all()

@router.post("/divisions", response_model=DivisionResponse)
def create_division(
    payload: DivisionCreate,
    db: Session = Depends(get_db),
    user: User = Depends(auth_service.require_roles(["Super Admin", "College Admin", "HOD"]))
):
    div = Division(**payload.dict())
    db.add(div)
    db.commit()
    db.refresh(div)
    return div

# --- Subjects ---
@router.get("/subjects", response_model=List[SubjectResponse])
def list_subjects(
    department_id: Optional[int] = None, 
    course_id: Optional[int] = None, 
    semester_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    q = db.query(Subject)
    if department_id:
        q = q.filter(Subject.department_id == department_id)
    if course_id:
        q = q.filter(Subject.course_id == course_id)
    if semester_id:
        q = q.filter(Subject.semester_id == semester_id)
    return q.all()

@router.post("/subjects", response_model=SubjectResponse)
def create_subject(
    payload: SubjectCreate,
    db: Session = Depends(get_db),
    user: User = Depends(auth_service.require_roles(["Super Admin", "College Admin", "HOD"]))
):
    exists = db.query(Subject).filter(Subject.subject_code == payload.subject_code).first()
    if exists:
        raise HTTPException(status_code=400, detail="Subject with this code already exists.")
    sub = Subject(**payload.dict())
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub

