from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Date
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.base import TimestampMixin

class Student(Base, TimestampMixin):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    enrollment_number = Column(String(50), unique=True, nullable=False, index=True)
    roll_number = Column(String(30), nullable=False, index=True)
    full_name = Column(String(150), nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    phone = Column(String(30), nullable=True)
    
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="RESTRICT"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="RESTRICT"), nullable=False)
    academic_year_id = Column(Integer, ForeignKey("academic_years.id", ondelete="RESTRICT"), nullable=False)
    semester_id = Column(Integer, ForeignKey("semesters.id", ondelete="RESTRICT"), nullable=False)
    class_id = Column(Integer, ForeignKey("classes.id", ondelete="RESTRICT"), nullable=False)
    division_id = Column(Integer, ForeignKey("divisions.id", ondelete="RESTRICT"), nullable=False)
    
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, unique=True)
    admission_date = Column(Date, nullable=True)
    profile_photo_url = Column(String(500), nullable=True)
    account_status = Column(String(30), default="Active") # Active, Suspended, Graduated, Withdrawn
    
    # Biometric Privacy & Enrollment Status
    biometric_enrolled = Column(Boolean, default=False)
    biometric_enrolled_at = Column(DateTime, nullable=True)
    manual_attendance_opt_in = Column(Boolean, default=False) # Privacy alternative for students who decline face recognition

    # Relationships
    user = relationship("User", back_populates="student_profile")
    department = relationship("Department", back_populates="students")
    course = relationship("Course", back_populates="students")
    academic_year = relationship("AcademicYear", back_populates="students")
    semester = relationship("Semester", back_populates="students")
    class_group = relationship("ClassGroup", back_populates="students")
    division = relationship("Division", back_populates="students")
    
    face_templates = relationship("FaceTemplate", back_populates="student", cascade="all, delete-orphan")
    consents = relationship("ConsentRecord", back_populates="student", cascade="all, delete-orphan")
    attendance_records = relationship("AttendanceRecord", back_populates="student")
    enrolled_subjects = relationship("StudentSubject", back_populates="student", cascade="all, delete-orphan")


class StudentSubject(Base, TimestampMixin):
    __tablename__ = "student_subjects"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    semester_id = Column(Integer, ForeignKey("semesters.id", ondelete="CASCADE"), nullable=False)

    student = relationship("Student", back_populates="enrolled_subjects")

