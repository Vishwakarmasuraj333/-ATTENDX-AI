from pydantic import BaseModel
from typing import Optional, List
import datetime

# College
class CollegeBase(BaseModel):
    name: str
    code: str
    address: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    current_academic_year: Optional[str] = "2025-2026"
    logo_url: Optional[str] = None
    is_active: bool = True

class CollegeCreate(CollegeBase):
    pass

class CollegeResponse(CollegeBase):
    id: int
    created_at: datetime.datetime
    class Config:
        from_attributes = True

# Department
class DepartmentBase(BaseModel):
    college_id: int
    name: str
    code: str
    description: Optional[str] = None
    hod_name: Optional[str] = None
    is_active: bool = True

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentResponse(DepartmentBase):
    id: int
    created_at: datetime.datetime
    class Config:
        from_attributes = True

# Course
class CourseBase(BaseModel):
    department_id: int
    name: str
    code: str
    degree_level: str = "Postgraduate"
    total_semesters: int = 4
    is_active: bool = True

class CourseCreate(CourseBase):
    pass

class CourseResponse(CourseBase):
    id: int
    created_at: datetime.datetime
    class Config:
        from_attributes = True

# Academic Year
class AcademicYearBase(BaseModel):
    college_id: int
    year_label: str
    is_current: bool = True

class AcademicYearCreate(AcademicYearBase):
    pass

class AcademicYearResponse(AcademicYearBase):
    id: int
    class Config:
        from_attributes = True

# Semester
class SemesterBase(BaseModel):
    course_id: int
    academic_year_id: int
    semester_number: int
    title: Optional[str] = None
    is_active: bool = True

class SemesterCreate(SemesterBase):
    pass

class SemesterResponse(SemesterBase):
    id: int
    class Config:
        from_attributes = True

# Class Group
class ClassGroupBase(BaseModel):
    course_id: int
    semester_id: int
    name: str
    code: Optional[str] = None
    is_active: bool = True

class ClassGroupCreate(ClassGroupBase):
    pass

class ClassGroupResponse(ClassGroupBase):
    id: int
    class Config:
        from_attributes = True

# Division
class DivisionBase(BaseModel):
    class_id: int
    division_name: str
    room_number: Optional[str] = None
    capacity: int = 60
    is_active: bool = True

class DivisionCreate(DivisionBase):
    pass

class DivisionResponse(DivisionBase):
    id: int
    class Config:
        from_attributes = True

# Subject
class SubjectBase(BaseModel):
    department_id: int
    course_id: int
    semester_id: int
    subject_code: str
    subject_name: str
    credit_hours: int = 4
    total_lectures_planned: int = 45
    is_elective: bool = False
    is_active: bool = True

class SubjectCreate(SubjectBase):
    pass

class SubjectResponse(SubjectBase):
    id: int
    created_at: datetime.datetime
    class Config:
        from_attributes = True

