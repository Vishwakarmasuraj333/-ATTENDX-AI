from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.base import TimestampMixin

class Faculty(Base, TimestampMixin):
    __tablename__ = "faculty"

    id = Column(Integer, primary_key=True, index=True)
    faculty_id_code = Column(String(50), unique=True, nullable=False, index=True) # e.g. "FAC-IT-101"
    full_name = Column(String(150), nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    phone = Column(String(30), nullable=True)
    designation = Column(String(100), default="Assistant Professor") # Professor, Associate Professor, Assistant Professor, Lecturer
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="RESTRICT"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, unique=True)
    account_status = Column(String(30), default="Active") # Active, Inactive, On Leave

    # Relationships
    user = relationship("User", back_populates="faculty_profile")
    department = relationship("Department", back_populates="faculty_members")
    assigned_subjects = relationship("FacultySubject", back_populates="faculty", cascade="all, delete-orphan")
    timetable_slots = relationship("TimetableSlot", back_populates="faculty")
    attendance_sessions = relationship("AttendanceSession", back_populates="faculty")


class FacultySubject(Base, TimestampMixin):
    __tablename__ = "faculty_subjects"

    id = Column(Integer, primary_key=True, index=True)
    faculty_id = Column(Integer, ForeignKey("faculty.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    division_id = Column(Integer, ForeignKey("divisions.id", ondelete="CASCADE"), nullable=True)

    faculty = relationship("Faculty", back_populates="assigned_subjects")
    subject = relationship("Subject", back_populates="faculty_allocations")

