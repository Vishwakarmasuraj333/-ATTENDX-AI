from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class DashboardKPIs(BaseModel):
    total_students: int
    total_faculty: int
    total_departments: int
    total_classes: int
    active_attendance_sessions: int
    present_students_today: int
    absent_students_today: int
    late_arrivals_today: int
    overall_attendance_percentage: float

class TrendDataPoint(BaseModel):
    label: str # e.g. "Mon", "09 Nov", "Week 42"
    present: int
    absent: int
    late: int
    rate: float

class DepartmentComparison(BaseModel):
    department_name: str
    department_code: str
    total_students: int
    attendance_rate: float

class SubjectAttendanceStat(BaseModel):
    subject_code: str
    subject_name: str
    total_sessions: int
    average_attendance: float

class AttendanceDistribution(BaseModel):
    present_pct: float
    absent_pct: float
    late_pct: float
    excused_pct: float

class DashboardAnalyticsResponse(BaseModel):
    kpis: DashboardKPIs
    daily_trends: List[TrendDataPoint]
    weekly_trends: List[TrendDataPoint]
    department_comparison: List[DepartmentComparison]
    subject_stats: List[SubjectAttendanceStat]
    distribution: AttendanceDistribution

