import datetime
import numpy as np
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models import (
    Role, Permission, RolePermission, User,
    College, Department, Course, AcademicYear, Semester, ClassGroup, Division, Subject,
    Student, StudentSubject, Faculty, FacultySubject, TimetableSlot,
    AttendanceSession, AttendanceRecord, FaceTemplate, ConsentRecord, Notification
)
from app.services.auth_service import auth_service
from app.services.crypto_service import crypto_service

def seed_database():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # Check if already seeded
        if db.query(College).first():
            print("Database already contains data. Skipping initial seeding.")
            return

        print("Seeding AttendX AI database with realistic institutional structure...")

        # 1. ROLES
        roles_data = [
            ("Super Admin", "Full system governance and multi-tenant management", True),
            ("College Admin", "Campus-wide academic and user administration", True),
            ("HOD", "Departmental head, timetable oversight and curriculum management", True),
            ("Faculty", "Course instructor, attendance session host and grading", True),
            ("Class Coordinator", "Classroom representative and batch supervisor", True),
            ("Student", "Enrolled learner with personal attendance portal access", True)
        ]
        role_map = {}
        for name, desc, sys_role in roles_data:
            role = Role(name=name, description=desc, is_system_role=sys_role)
            db.add(role)
            db.flush()
            role_map[name] = role

        # 2. COLLEGE
        college = College(
            name="Trinity Institute of Technology & AI",
            code="TIT-AI",
            address="Technology Innovation Hub, Mumbai Cyber Corridor, Maharashtra 400076",
            email="registrar@trinity.edu.in",
            phone="+91-22-6890-4100",
            current_academic_year="2025-2026",
            is_active=True
        )
        db.add(college)
        db.flush()

        # 3. ACADEMIC YEAR
        ay = AcademicYear(
            college_id=college.id,
            year_label="2025-2026",
            start_date=datetime.datetime(2025, 7, 1),
            end_date=datetime.datetime(2026, 6, 30),
            is_current=True
        )
        db.add(ay)
        db.flush()

        # 4. DEPARTMENTS
        departments_data = [
            ("Information Technology", "IT", "Department of IT & Distributed Cloud Systems", "Dr. Rajesh Sharma"),
            ("Artificial Intelligence & ML", "AIML", "Department of AI, Machine Vision and Deep Learning", "Dr. Ananya Sen"),
            ("Computer Science", "CS", "Department of Computer Science & Systems Engineering", "Dr. Vikram Kulkarni"),
            ("Data Science", "DS", "Department of Computational Statistics & Big Data", "Dr. Meera Nambiar")
        ]
        dept_map = {}
        for dname, dcode, ddesc, dhod in departments_data:
            dept = Department(
                college_id=college.id,
                name=dname,
                code=dcode,
                description=ddesc,
                hod_name=dhod,
                is_active=True
            )
            db.add(dept)
            db.flush()
            dept_map[dcode] = dept

        # 5. COURSES
        it_dept = dept_map["IT"]
        msc_it = Course(
            department_id=it_dept.id,
            name="Master of Science in Information Technology",
            code="MSC_IT",
            degree_level="Postgraduate",
            total_semesters=4,
            is_active=True
        )
        bsc_it = Course(
            department_id=it_dept.id,
            name="Bachelor of Science in Information Technology",
            code="BSC_IT",
            degree_level="Undergraduate",
            total_semesters=6,
            is_active=True
        )
        db.add_all([msc_it, bsc_it])
        db.flush()

        # 6. SEMESTERS
        sem1 = Semester(course_id=msc_it.id, academic_year_id=ay.id, semester_number=1, title="Semester I", is_active=True)
        sem2 = Semester(course_id=msc_it.id, academic_year_id=ay.id, semester_number=2, title="Semester II", is_active=True)
        db.add_all([sem1, sem2])
        db.flush()

        # 7. CLASSES & DIVISIONS
        class_msc1 = ClassGroup(
            course_id=msc_it.id,
            semester_id=sem1.id,
            name="MSc IT - Part 1 (Batch 2025-27)",
            code="MSC-IT-P1",
            is_active=True
        )
        db.add(class_msc1)
        db.flush()

        div_a = Division(class_id=class_msc1.id, division_name="Div A", room_number="Lab 402 - AI Vision Lab", capacity=40)
        div_b = Division(class_id=class_msc1.id, division_name="Div B", room_number="Lab 403 - Cloud Lab", capacity=40)
        db.add_all([div_a, div_b])
        db.flush()

        # 8. SUBJECTS
        sub_cv = Subject(
            department_id=it_dept.id,
            course_id=msc_it.id,
            semester_id=sem1.id,
            subject_code="MIT101",
            subject_name="Computer Vision & Deep Face Recognition",
            credit_hours=4,
            total_lectures_planned=45
        )
        sub_cloud = Subject(
            department_id=it_dept.id,
            course_id=msc_it.id,
            semester_id=sem1.id,
            subject_code="MIT102",
            subject_name="Cloud Native Microservices & Docker",
            credit_hours=4,
            total_lectures_planned=40
        )
        sub_nlp = Subject(
            department_id=it_dept.id,
            course_id=msc_it.id,
            semester_id=sem1.id,
            subject_code="MIT103",
            subject_name="Natural Language Processing & Generative AI",
            credit_hours=4,
            total_lectures_planned=42
        )
        db.add_all([sub_cv, sub_cloud, sub_nlp])
        db.flush()

        # 9. USERS & FACULTY
        admin_user = User(
            email="admin@trinity.edu.in",
            username="admin",
            hashed_password=auth_service.get_password_hash("Admin@123"),
            full_name="Dr. Alok Verma (Campus Director)",
            role_id=role_map["College Admin"].id,
            is_active=True
        )
        faculty_user1 = User(
            email="sharma.it@trinity.edu.in",
            username="rsharma",
            hashed_password=auth_service.get_password_hash("Faculty@123"),
            full_name="Prof. Rajesh Sharma",
            role_id=role_map["Faculty"].id,
            is_active=True
        )
        faculty_user2 = User(
            email="priya.patel@trinity.edu.in",
            username="ppatel",
            hashed_password=auth_service.get_password_hash("Faculty@123"),
            full_name="Dr. Priya Patel",
            role_id=role_map["Faculty"].id,
            is_active=True
        )
        db.add_all([admin_user, faculty_user1, faculty_user2])
        db.flush()

        faculty1 = Faculty(
            faculty_id_code="FAC-IT-101",
            full_name="Prof. Rajesh Sharma",
            email="sharma.it@trinity.edu.in",
            phone="+91-98201-54321",
            designation="Professor & Head of Vision Lab",
            department_id=it_dept.id,
            user_id=faculty_user1.id,
            account_status="Active"
        )
        faculty2 = Faculty(
            faculty_id_code="FAC-IT-102",
            full_name="Dr. Priya Patel",
            email="priya.patel@trinity.edu.in",
            phone="+91-98202-98765",
            designation="Associate Professor",
            department_id=it_dept.id,
            user_id=faculty_user2.id,
            account_status="Active"
        )
        db.add_all([faculty1, faculty2])
        db.flush()

        # Allocate subjects to faculty
        fs1 = FacultySubject(faculty_id=faculty1.id, subject_id=sub_cv.id, division_id=div_a.id)
        fs2 = FacultySubject(faculty_id=faculty2.id, subject_id=sub_cloud.id, division_id=div_a.id)
        db.add_all([fs1, fs2])
        db.flush()

        # 10. TIMETABLE SLOTS
        today_weekday = datetime.date.today().strftime("%A")
        ts1 = TimetableSlot(
            department_id=it_dept.id,
            course_id=msc_it.id,
            semester_id=sem1.id,
            class_id=class_msc1.id,
            division_id=div_a.id,
            subject_id=sub_cv.id,
            faculty_id=faculty1.id,
            room="Lab 402 - AI Vision Lab",
            day_of_week=today_weekday,
            start_time="09:30",
            end_time="11:30",
            is_active=True
        )
        ts2 = TimetableSlot(
            department_id=it_dept.id,
            course_id=msc_it.id,
            semester_id=sem1.id,
            class_id=class_msc1.id,
            division_id=div_a.id,
            subject_id=sub_cloud.id,
            faculty_id=faculty2.id,
            room="Lab 403 - Cloud Lab",
            day_of_week=today_weekday,
            start_time="12:00",
            end_time="13:30",
            is_active=True
        )
        db.add_all([ts1, ts2])
        db.flush()

        # 11. REALISTIC STUDENTS COHORT
        students_roster = [
            ("Aarav Mehta", "TIT-2025-IT-001", "101", "aarav.mehta@trinity.edu.in", "+91-98331-10001", True),
            ("Diya Sen Sharma", "TIT-2025-IT-002", "102", "diya.sen@trinity.edu.in", "+91-98331-10002", True),
            ("Rohan Iyer", "TIT-2025-IT-003", "103", "rohan.iyer@trinity.edu.in", "+91-98331-10003", True),
            ("Ishita Kapoor", "TIT-2025-IT-004", "104", "ishita.k@trinity.edu.in", "+91-98331-10004", True),
            ("Aditya Verma", "TIT-2025-IT-005", "105", "aditya.v@trinity.edu.in", "+91-98331-10005", True),
            ("Sneha Nair", "TIT-2025-IT-006", "106", "sneha.nair@trinity.edu.in", "+91-98331-10006", True),
            ("Kabir Deshmukh", "TIT-2025-IT-007", "107", "kabir.d@trinity.edu.in", "+91-98331-10007", True),
            ("Ananya Pillai", "TIT-2025-IT-008", "108", "ananya.p@trinity.edu.in", "+91-98331-10008", True),
            ("Vihaan Roy", "TIT-2025-IT-009", "109", "vihaan.roy@trinity.edu.in", "+91-98331-10009", False),
            ("Meera Joshi", "TIT-2025-IT-010", "110", "meera.joshi@trinity.edu.in", "+91-98331-10010", True),
            ("Siddharth Bhat", "TIT-2025-IT-011", "111", "sid.bhat@trinity.edu.in", "+91-98331-10011", True),
            ("Tanvi Kulkarni", "TIT-2025-IT-012", "112", "tanvi.k@trinity.edu.in", "+91-98331-10012", True)
        ]

        created_students = []
        for sname, senroll, sroll, semail, sphone, enrolled_bio in students_roster:
            # Create student user login
            st_user = User(
                email=semail,
                username=senroll.lower(),
                hashed_password=auth_service.get_password_hash("Student@123"),
                full_name=sname,
                role_id=role_map["Student"].id,
                is_active=True
            )
            db.add(st_user)
            db.flush()

            st = Student(
                enrollment_number=senroll,
                roll_number=sroll,
                full_name=sname,
                email=semail,
                phone=sphone,
                department_id=it_dept.id,
                course_id=msc_it.id,
                academic_year_id=ay.id,
                semester_id=sem1.id,
                class_id=class_msc1.id,
                division_id=div_a.id,
                user_id=st_user.id,
                admission_date=datetime.date(2025, 7, 15),
                account_status="Active",
                biometric_enrolled=enrolled_bio,
                biometric_enrolled_at=datetime.datetime.utcnow() if enrolled_bio else None,
                manual_attendance_opt_in=not enrolled_bio
            )
            db.add(st)
            db.flush()
            created_students.append(st)

            # Biometric Consent & Template Generation
            if enrolled_bio:
                consent = ConsentRecord(
                    student_id=st.id,
                    user_id=st_user.id,
                    consent_type="BIOMETRIC_FACE_ENROLLMENT",
                    is_granted=True,
                    consent_version="1.0",
                    consent_statement="I hereby grant voluntary informed consent for AttendX AI to capture and generate facial biometric feature templates for educational attendance governance.",
                    guardian_consent_verified=True,
                    guardian_name=f"Guardian of {sname}"
                )
                db.add(consent)
                db.flush()

                # Generate a real, normalized 128-dimensional embedding vector
                # Deterministic random seed per student roll number so each template is unique and mathematically valid
                rng = np.random.RandomState(int(sroll) * 42)
                vec = rng.randn(128).astype(np.float32)
                vec /= np.linalg.norm(vec)
                enc_vec = crypto_service.encrypt_embedding(vec)

                ft = FaceTemplate(
                    student_id=st.id,
                    encrypted_embedding=enc_vec,
                    embedding_dimension=128,
                    algorithm_name="OpenCV_SFace_v1",
                    sample_index=1,
                    quality_score=0.92,
                    sharpness_score=210.5,
                    brightness_score=115.0,
                    face_bbox_json=[160, 95, 180, 180],
                    consent_id=consent.id,
                    is_active=True
                )
                db.add(ft)

        # 12. HISTORICAL ATTENDANCE SESSIONS & RECORDS (Past 7 Days)
        today = datetime.date.today()
        for day_idx in range(7, 0, -1):
            past_date = today - datetime.timedelta(days=day_idx)
            # Skip Sundays
            if past_date.weekday() == 6:
                continue

            session_code = f"SES-{past_date.strftime('%Y%m%d')}-001"
            past_session = AttendanceSession(
                timetable_slot_id=ts1.id,
                faculty_id=faculty1.id,
                subject_id=sub_cv.id,
                class_id=class_msc1.id,
                division_id=div_a.id,
                session_date=past_date,
                start_time=datetime.datetime.combine(past_date, datetime.time(9, 30)),
                end_time=datetime.datetime.combine(past_date, datetime.time(11, 30)),
                session_code=session_code,
                status="Completed",
                room="Lab 402 - AI Vision Lab",
                eligible_students_count=len(created_students)
            )
            db.add(past_session)
            db.flush()

            p_count = 0
            l_count = 0
            a_count = 0
            for idx, st in enumerate(created_students):
                # Deterministic pattern: student 109 and 111 have higher absence rate for realistic risk analytics
                if st.roll_number in ("109", "111") and (day_idx % 2 == 0):
                    status = "Absent"
                    conf = None
                    src = "System Defaulter"
                    a_count += 1
                elif idx % 5 == 0 and day_idx == 3:
                    status = "Late"
                    conf = 0.94
                    src = "Face Recognition (YuNet + SFace)"
                    l_count += 1
                else:
                    status = "Present"
                    conf = round(0.91 + (idx % 8) * 0.01, 3)
                    src = "Face Recognition (YuNet + SFace)"
                    p_count += 1

                rec = AttendanceRecord(
                    session_id=past_session.id,
                    student_id=st.id,
                    subject_id=sub_cv.id,
                    date=past_date,
                    check_in_time=datetime.datetime.combine(past_date, datetime.time(9, 32 + (idx % 15))) if status != "Absent" else None,
                    status=status,
                    attendance_source=src,
                    faculty_approval="Approved",
                    confidence_score=conf,
                    liveness_verified=status != "Absent",
                    remarks="Historical validated lecture"
                )
                db.add(rec)

            past_session.present_count = p_count
            past_session.late_count = l_count
            past_session.absent_count = a_count

        # 13. TODAY'S ACTIVE ATTENDANCE SESSION
        today_session_code = f"SES-{today.strftime('%Y%m%d')}-LIVE"
        today_session = AttendanceSession(
            timetable_slot_id=ts1.id,
            faculty_id=faculty1.id,
            subject_id=sub_cv.id,
            class_id=class_msc1.id,
            division_id=div_a.id,
            session_date=today,
            start_time=datetime.datetime.now(),
            session_code=today_session_code,
            status="Active",
            room="Lab 402 - AI Vision Lab",
            eligible_students_count=len(created_students),
            present_count=4,
            late_count=1,
            absent_count=len(created_students) - 5
        )
        db.add(today_session)
        db.flush()

        # Seed records for today's active session
        for idx, st in enumerate(created_students):
            if idx < 4:
                status = "Present"
                conf = 0.952
                src = "Face Recognition (YuNet + SFace)"
                check_in = datetime.datetime.now() - datetime.timedelta(minutes=15 - idx*3)
            elif idx == 4:
                status = "Late"
                conf = 0.931
                src = "Face Recognition (YuNet + SFace)"
                check_in = datetime.datetime.now() - datetime.timedelta(minutes=2)
            else:
                status = "Absent"
                conf = None
                src = "System Default"
                check_in = None

            rec = AttendanceRecord(
                session_id=today_session.id,
                student_id=st.id,
                subject_id=sub_cv.id,
                date=today,
                check_in_time=check_in,
                status=status,
                attendance_source=src,
                faculty_approval="Approved" if status != "Absent" else "Pending",
                confidence_score=conf,
                liveness_verified=status != "Absent"
            )
            db.add(rec)

        # 14. SAMPLE NOTIFICATIONS
        notifs = [
            Notification(
                user_id=faculty_user1.id,
                title="Class Attendance Session Activated",
                message="Your lecture 'MIT101 - Computer Vision' in Lab 402 is active. Facial recognition stream online.",
                notification_type="SESSION_STARTED",
                is_read=False,
                action_url=f"/live-attendance?sessionId={today_session.id}"
            ),
            Notification(
                user_id=admin_user.id,
                title="Institutional Biometric Compliance Audit",
                message="Overall attendance compliance across 4 departments stands at 88.5%. 2 students identified in Defaulter Warning bracket.",
                notification_type="SYSTEM",
                is_read=False,
                action_url="/analytics"
            )
        ]
        db.add_all(notifs)

        db.commit()
        print("AttendX AI institutional database initialized successfully with realistic seed data!")

    except Exception as e:
        db.rollback()
        print(f"Error during database seeding: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()

