from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Date, Float, Text, UniqueConstraint
from sqlalchemy.orm import relationship
import datetime
from app.database import Base
from app.models.base import TimestampMixin

class AttendanceSession(Base, TimestampMixin):
    __tablename__ = "attendance_sessions"

    id = Column(Integer, primary_key=True, index=True)
    timetable_slot_id = Column(Integer, ForeignKey("timetables.id", ondelete="SET NULL"), nullable=True)
    faculty_id = Column(Integer, ForeignKey("faculty.id", ondelete="RESTRICT"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="RESTRICT"), nullable=False)
    class_id = Column(Integer, ForeignKey("classes.id", ondelete="RESTRICT"), nullable=False)
    division_id = Column(Integer, ForeignKey("divisions.id", ondelete="RESTRICT"), nullable=False)
    
    session_date = Column(Date, default=datetime.date.today, nullable=False, index=True)
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    session_code = Column(String(30), unique=True, nullable=False, index=True) # e.g. "SES-20261110-001"
    status = Column(String(30), default="Scheduled") # Scheduled, Active, Completed, Cancelled
    room = Column(String(50), nullable=True)
    eligible_students_count = Column(Integer, default=0)
    present_count = Column(Integer, default=0)
    absent_count = Column(Integer, default=0)
    late_count = Column(Integer, default=0)

    # Relationships
    timetable_slot = relationship("TimetableSlot", back_populates="sessions")
    faculty = relationship("Faculty", back_populates="attendance_sessions")
    subject = relationship("Subject", back_populates="attendance_sessions")
    class_group = relationship("ClassGroup", back_populates="attendance_sessions")
    division = relationship("Division", back_populates="attendance_sessions")
    records = relationship("AttendanceRecord", back_populates="session", cascade="all, delete-orphan")
    verification_events = relationship("FaceVerificationEvent", back_populates="session")


class AttendanceRecord(Base, TimestampMixin):
    __tablename__ = "attendance_records"
    __table_args__ = (
        UniqueConstraint("session_id", "student_id", name="uq_attendance_session_student"),
    )

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("attendance_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="RESTRICT"), nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="RESTRICT"), nullable=False, index=True)
    date = Column(Date, default=datetime.date.today, nullable=False, index=True)
    check_in_time = Column(DateTime, nullable=True)
    
    # Statuses: Present, Absent, Late, Excused, Pending Verification
    status = Column(String(30), default="Absent", nullable=False, index=True)
    
    # Source: "Face Recognition", "Manual Faculty", "Admin Correction"
    attendance_source = Column(String(50), default="Face Recognition", nullable=False)
    
    faculty_approval = Column(String(30), default="Approved") # Approved, Pending, Rejected
    confidence_score = Column(Float, nullable=True) # e.g. 0.942
    liveness_verified = Column(Boolean, default=False)
    is_excused = Column(Boolean, default=False)
    remarks = Column(String(255), nullable=True)

    # Relationships
    session = relationship("AttendanceSession", back_populates="records")
    student = relationship("Student", back_populates="attendance_records")
    subject = relationship("Subject", back_populates="attendance_records")
    correction_requests = relationship("AttendanceCorrectionRequest", back_populates="attendance_record", cascade="all, delete-orphan")


class AttendanceCorrectionRequest(Base, TimestampMixin):
    __tablename__ = "attendance_corrections"

    id = Column(Integer, primary_key=True, index=True)
    attendance_record_id = Column(Integer, ForeignKey("attendance_records.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    requested_status = Column(String(30), nullable=False) # e.g. "Present", "Excused"
    reason = Column(Text, nullable=False)
    evidence_document_url = Column(String(500), nullable=True)
    
    status = Column(String(30), default="Pending") # Pending, Approved, Rejected
    reviewed_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    review_remarks = Column(Text, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)

    attendance_record = relationship("AttendanceRecord", back_populates="correction_requests")

