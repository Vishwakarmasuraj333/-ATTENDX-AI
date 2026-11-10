from pydantic import BaseModel
from typing import Optional, List
import datetime

class TimetableBase(BaseModel):
    department_id: int
    course_id: int
    semester_id: int
    class_id: int
    division_id: int
    subject_id: int
    faculty_id: int
    room: str
    day_of_week: str # Monday - Saturday
    start_time: str # "09:00"
    end_time: str # "10:00"
    is_active: bool = True

class TimetableCreate(TimetableBase):
    pass

class TimetableConflictCheck(BaseModel):
    has_conflict: bool
    conflict_type: Optional[str] = None # "FACULTY_OVERLAP", "ROOM_OVERLAP", "CLASS_OVERLAP"
    conflict_detail: Optional[str] = None

class TimetableResponse(TimetableBase):
    id: int
    subject_name: Optional[str] = None
    subject_code: Optional[str] = None
    faculty_name: Optional[str] = None
    class_name: Optional[str] = None
    division_name: Optional[str] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True

