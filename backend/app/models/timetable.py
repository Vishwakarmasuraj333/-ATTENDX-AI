from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Time
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.base import TimestampMixin

class TimetableSlot(Base, TimestampMixin):
    __tablename__ = "timetables"

    id = Column(Integer, primary_key=True, index=True)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="CASCADE"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    semester_id = Column(Integer, ForeignKey("semesters.id", ondelete="CASCADE"), nullable=False)
    class_id = Column(Integer, ForeignKey("classes.id", ondelete="CASCADE"), nullable=False)
    division_id = Column(Integer, ForeignKey("divisions.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    faculty_id = Column(Integer, ForeignKey("faculty.id", ondelete="CASCADE"), nullable=False)
    
    room = Column(String(50), nullable=False) # e.g. "Hall 301", "Lab 2"
    day_of_week = Column(String(20), nullable=False) # "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
    start_time = Column(String(10), nullable=False) # "09:00"
    end_time = Column(String(10), nullable=False) # "10:00"
    is_active = Column(Boolean, default=True)

    # Relationships
    division = relationship("Division", back_populates="timetable_slots")
    subject = relationship("Subject", back_populates="timetable_slots")
    faculty = relationship("Faculty", back_populates="timetable_slots")
    sessions = relationship("AttendanceSession", back_populates="timetable_slot")

