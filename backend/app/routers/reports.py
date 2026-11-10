from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional
import datetime
import io

from app.database import get_db
from app.models.academic import College, Department, Subject, ClassGroup
from app.models.attendance import AttendanceRecord, AttendanceSession
from app.models.students import Student
from app.services.report_service import report_service
from app.ml.risk_analyzer import risk_analyzer

router = APIRouter(prefix="/api/v1/reports", tags=["Report Generation Engine"])

@router.get("/export")
def export_attendance_report(
    report_type: str = Query("daily"),
    format: str = Query("pdf"),
    department_id: Optional[int] = None,
    subject_id: Optional[int] = None,
    class_id: Optional[int] = None,
    date: Optional[datetime.date] = None,
    db: Session = Depends(get_db)
):
    college = db.query(College).first()
    college_name = college.name if college else "Trinity Institute of Technology & AI"
    
    target_date = date or datetime.date.today()
    q = db.query(AttendanceRecord).join(Student)
    
    filters_desc = []
    if department_id:
        dept = db.query(Department).filter(Department.id == department_id).first()
        if dept:
            q = q.filter(Student.department_id == department_id)
            filters_desc.append(f"Dept: {dept.name}")
    if subject_id:
        sub = db.query(Subject).filter(Subject.id == subject_id).first()
        if sub:
            q = q.filter(AttendanceRecord.subject_id == subject_id)
            filters_desc.append(f"Subject: {sub.subject_name}")
    if class_id:
        cl = db.query(ClassGroup).filter(ClassGroup.id == class_id).first()
        if cl:
            q = q.filter(Student.class_id == class_id)
            filters_desc.append(f"Class: {cl.name}")

    if report_type == "daily":
        q = q.filter(AttendanceRecord.date == target_date)
        report_title = f"Daily Attendance Roster ({target_date.strftime('%d-%b-%Y')})"
        filters_desc.append(f"Date: {target_date}")
    elif report_type == "monthly":
        start_month = target_date.replace(day=1)
        q = q.filter(AttendanceRecord.date >= start_month)
        report_title = f"Monthly Attendance Ledger ({target_date.strftime('%B %Y')})"
        filters_desc.append(f"Month: {target_date.strftime('%B %Y')}")
    elif report_type == "low_attendance":
        report_title = "Defaulters / Low Attendance Risk Audit (<75%)"
        filters_desc.append("Criteria: Attendance < 75%")
    else:
        report_title = f"Institutional Attendance Summary ({report_type.capitalize()})"

    records = q.order_by(Student.roll_number.asc()).all()

    # Calculate summary KPIs
    total_records = len(records)
    presents = sum(1 for r in records if r.status in ("Present", "Verified"))
    absents = sum(1 for r in records if r.status == "Absent")
    lates = sum(1 for r in records if r.status == "Late")
    excused = sum(1 for r in records if r.is_excused)
    
    overall_rate = round(((presents + lates) / max(1, total_records - excused)) * 100.0, 1) if (total_records - excused) > 0 else 0.0

    summary_stats = {
        "Total Count": total_records,
        "Present": presents,
        "Absent": absents,
        "Late": lates,
        "Excused": excused,
        "Compliance Rate": f"{overall_rate}%"
    }

    # Prepare table columns and rows
    columns = ["Roll No", "Enrollment", "Student Name", "Subject", "Date", "Status", "Source", "Confidence"]
    rows = []
    for r in records:
        rows.append([
            r.student.roll_number if r.student else "-",
            r.student.enrollment_number if r.student else "-",
            r.student.full_name if r.student else "-",
            r.subject.subject_code if r.subject else "-",
            str(r.date),
            r.status,
            r.attendance_source,
            f"{int((r.confidence_score or 0) * 100)}%" if r.confidence_score else "Manual"
        ])

    filters_str = " | ".join(filters_desc) if filters_desc else "All Institutional Cohorts"

    if format == "pdf":
        pdf_stream = report_service.generate_pdf(
            report_title=report_title,
            college_name=college_name,
            filters_desc=filters_str,
            summary_stats=summary_stats,
            columns=columns,
            rows=rows
        )
        filename = f"AttendX_{report_type}_{datetime.date.today().strftime('%Y%m%d')}.pdf"
        return StreamingResponse(
            pdf_stream,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    else:
        excel_stream = report_service.generate_excel(
            report_title=report_title,
            college_name=college_name,
            filters_desc=filters_str,
            summary_stats=summary_stats,
            columns=columns,
            rows=rows
        )
        filename = f"AttendX_{report_type}_{datetime.date.today().strftime('%Y%m%d')}.xlsx"
        return StreamingResponse(
            excel_stream,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
