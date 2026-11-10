from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.base import TimestampMixin

class College(Base, TimestampMixin):
    __tablename__ = "colleges"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    code = Column(String(50), unique=True, nullable=False, index=True)
    address = Column(Text, nullable=True)
    email = Column(String(100), nullable=True)
    phone = Column(String(30), nullable=True)
    current_academic_year = Column(String(30), default="2025-2026")
    logo_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)

    departments = relationship("Department", back_populates="college", cascade="all, delete-orphan")
    academic_years = relationship("AcademicYear", back_populates="college", cascade="all, delete-orphan")


class Department(Base, TimestampMixin):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    college_id = Column(Integer, ForeignKey("colleges.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(150), nullable=False) # e.g. Information Technology, Computer Science
    code = Column(String(30), unique=True, nullable=False, index=True) # e.g. IT, CS, AIML
    description = Column(Text, nullable=True)
    hod_name = Column(String(150), nullable=True)
    is_active = Column(Boolean, default=True)

    college = relationship("College", back_populates="departments")
    courses = relationship("Course", back_populates="department", cascade="all, delete-orphan")
    faculty_members = relationship("Faculty", back_populates="department")
    students = relationship("Student", back_populates="department")
    subjects = relationship("Subject", back_populates="department")


class Course(Base, TimestampMixin):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(150), nullable=False) # e.g. Master of Science in Information Technology
    code = Column(String(50), nullable=False) # e.g. MSC_IT, BSC_IT, MCA, BTECH_CS
    degree_level = Column(String(50), default="Postgraduate") # Undergraduate, Postgraduate, Diploma
    total_semesters = Column(Integer, default=4)
    is_active = Column(Boolean, default=True)

    department = relationship("Department", back_populates="courses")
    semesters = relationship("Semester", back_populates="course", cascade="all, delete-orphan")
    classes = relationship("ClassGroup", back_populates="course", cascade="all, delete-orphan")
    students = relationship("Student", back_populates="course")


class AcademicYear(Base, TimestampMixin):
    __tablename__ = "academic_years"

    id = Column(Integer, primary_key=True, index=True)
    college_id = Column(Integer, ForeignKey("colleges.id", ondelete="CASCADE"), nullable=False)
    year_label = Column(String(30), nullable=False) # e.g. 2025-2026
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    is_current = Column(Boolean, default=True)

    college = relationship("College", back_populates="academic_years")
    semesters = relationship("Semester", back_populates="academic_year")
    students = relationship("Student", back_populates="academic_year")


class Semester(Base, TimestampMixin):
    __tablename__ = "semesters"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    academic_year_id = Column(Integer, ForeignKey("academic_years.id", ondelete="CASCADE"), nullable=False)
    semester_number = Column(Integer, nullable=False) # 1, 2, 3, 4 ...
    title = Column(String(50), nullable=True) # e.g. Semester I, Semester II
    is_active = Column(Boolean, default=True)

    course = relationship("Course", back_populates="semesters")
    academic_year = relationship("AcademicYear", back_populates="semesters")
    classes = relationship("ClassGroup", back_populates="semester")
    subjects = relationship("Subject", back_populates="semester")
    students = relationship("Student", back_populates="semester")


class ClassGroup(Base, TimestampMixin):
    __tablename__ = "classes"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    semester_id = Column(Integer, ForeignKey("semesters.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False) # e.g. "MSc IT - Year 1", "BSc IT - Sem 5"
    code = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True)

    course = relationship("Course", back_populates="classes")
    semester = relationship("Semester", back_populates="classes")
    divisions = relationship("Division", back_populates="class_group", cascade="all, delete-orphan")
    students = relationship("Student", back_populates="class_group")
    attendance_sessions = relationship("AttendanceSession", back_populates="class_group")


class Division(Base, TimestampMixin):
    __tablename__ = "divisions"

    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("classes.id", ondelete="CASCADE"), nullable=False)
    division_name = Column(String(20), nullable=False) # e.g. "A", "B", "Div-1"
    room_number = Column(String(50), nullable=True) # e.g. "Lab 402", "Hall 101"
    capacity = Column(Integer, default=60)
    is_active = Column(Boolean, default=True)

    class_group = relationship("ClassGroup", back_populates="divisions")
    students = relationship("Student", back_populates="division")
    timetable_slots = relationship("TimetableSlot", back_populates="division")
    attendance_sessions = relationship("AttendanceSession", back_populates="division")


class Subject(Base, TimestampMixin):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="CASCADE"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    semester_id = Column(Integer, ForeignKey("semesters.id", ondelete="CASCADE"), nullable=False)
    subject_code = Column(String(50), unique=True, nullable=False, index=True) # e.g. "MIT201", "CS304"
    subject_name = Column(String(150), nullable=False) # e.g. "Advanced Machine Learning & Computer Vision"
    credit_hours = Column(Integer, default=4)
    total_lectures_planned = Column(Integer, default=45)
    is_elective = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)

    department = relationship("Department", back_populates="subjects")
    semester = relationship("Semester", back_populates="subjects")
    faculty_allocations = relationship("FacultySubject", back_populates="subject", cascade="all, delete-orphan")
    timetable_slots = relationship("TimetableSlot", back_populates="subject")
    attendance_sessions = relationship("AttendanceSession", back_populates="subject")
    attendance_records = relationship("AttendanceRecord", back_populates="subject")

