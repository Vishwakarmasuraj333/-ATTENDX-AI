from pydantic import BaseModel, EmailStr
from typing import Optional, List
import datetime

class StudentBase(BaseModel):
    enrollment_number: str
    roll_number: str
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    department_id: int
    course_id: int
    academic_year_id: int
    semester_id: int
    class_id: int
    division_id: int
    admission_date: Optional[datetime.date] = None
    profile_photo_url: Optional[str] = None
    account_status: str = "Active"
    manual_attendance_opt_in: bool = False

class StudentCreate(StudentBase):
    pass

class StudentUpdate(BaseModel):
    roll_number: Optional[str] = None
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    department_id: Optional[int] = None
    course_id: Optional[int] = None
    semester_id: Optional[int] = None
    class_id: Optional[int] = None
    division_id: Optional[int] = None
    account_status: Optional[str] = None
    manual_attendance_opt_in: Optional[bool] = None

class StudentResponse(StudentBase):
    id: int
    user_id: Optional[int] = None
    biometric_enrolled: bool = False
    biometric_enrolled_at: Optional[datetime.datetime] = None
    department_name: Optional[str] = None
    course_name: Optional[str] = None
    class_name: Optional[str] = None
    division_name: Optional[str] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class StudentBulkImportResult(BaseModel):
    total_processed: int
    successfully_imported: int
    failed_rows: List[dict]

