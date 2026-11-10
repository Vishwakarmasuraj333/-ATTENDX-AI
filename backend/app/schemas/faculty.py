from pydantic import BaseModel, EmailStr
from typing import Optional, List
import datetime

class FacultyBase(BaseModel):
    faculty_id_code: str
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    designation: str = "Assistant Professor"
    department_id: int
    account_status: str = "Active"

class FacultyCreate(FacultyBase):
    pass

class FacultyUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    designation: Optional[str] = None
    department_id: Optional[int] = None
    account_status: Optional[str] = None

class SubjectAllocationItem(BaseModel):
    subject_id: int
    division_id: Optional[int] = None

class FacultyResponse(FacultyBase):
    id: int
    user_id: Optional[int] = None
    department_name: Optional[str] = None
    assigned_subjects: List[dict] = []
    created_at: datetime.datetime

    class Config:
        from_attributes = True

