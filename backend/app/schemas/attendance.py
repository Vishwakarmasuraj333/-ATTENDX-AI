from pydantic import BaseModel
from typing import Optional, List
import datetime

class AttendanceSessionCreate(BaseModel):
    timetable_slot_id: Optional[int] = None
    faculty_id: int
    subject_id: int
    class_id: int
    division_id: int
    session_date: Optional[datetime.date] = None
    room: Optional[str] = None

class AttendanceSessionResponse(BaseModel):
    id: int
    timetable_slot_id: Optional[int] = None
    faculty_id: int
    faculty_name: Optional[str] = None
    subject_id: int
    subject_name: Optional[str] = None
    subject_code: Optional[str] = None
    class_id: int
    class_name: Optional[str] = None
    division_id: int
    division_name: Optional[str] = None
    session_date: datetime.date
    start_time: Optional[datetime.datetime] = None
    end_time: Optional[datetime.datetime] = None
    session_code: str
    status: str
    room: Optional[str] = None
    eligible_students_count: int = 0
    present_count: int = 0
    absent_count: int = 0
    late_count: int = 0
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class AttendanceRecordResponse(BaseModel):
    id: int
    session_id: int
    student_id: int
    student_name: Optional[str] = None
    enrollment_number: Optional[str] = None
    roll_number: Optional[str] = None
    subject_id: int
    subject_name: Optional[str] = None
    date: datetime.date
    check_in_time: Optional[datetime.datetime] = None
    status: str
    attendance_source: str
    faculty_approval: str
    confidence_score: Optional[float] = None
    liveness_verified: bool = False
    is_excused: bool = False
    remarks: Optional[str] = None

    class Config:
        from_attributes = True

class ManualAttendanceRequest(BaseModel):
    session_id: int
    student_id: int
    status: str # Present, Absent, Late, Excused
    remarks: Optional[str] = "Manual entry by faculty"

class BulkManualAttendanceRequest(BaseModel):
    session_id: int
    records: List[ManualAttendanceRequest]

class AttendanceCorrectionCreate(BaseModel):
    attendance_record_id: int
    requested_status: str
    reason: str
    evidence_document_url: Optional[str] = None

class AttendanceCorrectionReview(BaseModel):
    status: str # Approved, Rejected
    review_remarks: Optional[str] = None

class AttendanceCorrectionResponse(BaseModel):
    id: int
    attendance_record_id: int
    student_id: int
    student_name: Optional[str] = None
    requested_status: str
    reason: str
    evidence_document_url: Optional[str] = None
    status: str
    reviewed_by: Optional[int] = None
    review_remarks: Optional[str] = None
    reviewed_at: Optional[datetime.datetime] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True

