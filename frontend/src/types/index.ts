export type UserRole = 'Super Admin' | 'College Admin' | 'HOD' | 'Faculty' | 'Class Coordinator' | 'Student';

export interface User {
  id: number;
  email: string;
  username?: string;
  full_name: string;
  role: UserRole;
  role_id: number;
  avatar_url?: string;
}

export interface Student {
  id: number;
  enrollment_number: string;
  roll_number: string;
  full_name: string;
  email: string;
  phone?: string;
  department_id: number;
  course_id: number;
  semester_id: number;
  class_id: number;
  division_id: number;
  account_status: string;
  biometric_enrolled: boolean;
  biometric_enrolled_at?: string;
  manual_attendance_opt_in: boolean;
  department_name?: string;
  course_name?: string;
  class_name?: string;
  division_name?: string;
  created_at: string;
}

export interface Faculty {
  id: number;
  faculty_id_code: string;
  full_name: string;
  email: string;
  phone?: string;
  designation: string;
  department_id: number;
  department_name?: string;
  account_status: string;
  assigned_subjects: {
    subject_id: number;
    subject_name?: string;
    subject_code?: string;
    division_id?: number;
  }[];
  created_at: string;
}

export interface Department {
  id: number;
  college_id: number;
  name: string;
  code: string;
  description?: string;
  hod_name?: string;
  is_active: boolean;
}

export interface Course {
  id: number;
  department_id: number;
  name: string;
  code: string;
  degree_level: string;
  total_semesters: number;
  is_active: boolean;
}

export interface Semester {
  id: number;
  course_id: number;
  semester_number: number;
  title?: string;
  is_active: boolean;
}

export interface ClassGroup {
  id: number;
  course_id: number;
  semester_id: number;
  name: string;
  code?: string;
  is_active: boolean;
}

export interface Division {
  id: number;
  class_id: number;
  division_name: string;
  room_number?: string;
  capacity: number;
  is_active: boolean;
}

export interface Subject {
  id: number;
  department_id: number;
  course_id: number;
  semester_id: number;
  subject_code: string;
  subject_name: string;
  credit_hours: number;
  total_lectures_planned: number;
  is_active: boolean;
}

export interface TimetableSlot {
  id: number;
  department_id: number;
  course_id: number;
  semester_id: number;
  class_id: number;
  division_id: number;
  subject_id: number;
  faculty_id: number;
  room: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
  subject_name?: string;
  subject_code?: string;
  faculty_name?: string;
  class_name?: string;
  division_name?: string;
}

export interface AttendanceSession {
  id: number;
  timetable_slot_id?: number;
  faculty_id: number;
  faculty_name?: string;
  subject_id: number;
  subject_name?: string;
  subject_code?: string;
  class_id: number;
  class_name?: string;
  division_id: number;
  division_name?: string;
  session_date: string;
  start_time?: string;
  end_time?: string;
  session_code: string;
  status: 'Scheduled' | 'Active' | 'Completed' | 'Cancelled';
  room?: string;
  eligible_students_count: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  created_at: string;
}

export interface AttendanceRecord {
  id: number;
  session_id: number;
  student_id: number;
  student_name?: string;
  enrollment_number?: string;
  roll_number?: string;
  subject_id: number;
  subject_name?: string;
  date: string;
  check_in_time?: string;
  status: 'Present' | 'Absent' | 'Late' | 'Excused' | 'Pending Verification';
  attendance_source: string;
  faculty_approval: string;
  confidence_score?: number;
  liveness_verified: boolean;
  is_excused: boolean;
  remarks?: string;
}

export interface DashboardKPIs {
  total_students: number;
  total_faculty: number;
  total_departments: number;
  total_classes: number;
  active_attendance_sessions: number;
  present_students_today: number;
  absent_students_today: number;
  late_arrivals_today: number;
  overall_attendance_percentage: number;
}

export interface TrendDataPoint {
  label: string;
  present: number;
  absent: number;
  late: number;
  rate: number;
}

export interface DepartmentComparison {
  department_name: string;
  department_code: string;
  total_students: number;
  attendance_rate: number;
}

export interface SubjectAttendanceStat {
  subject_code: string;
  subject_name: string;
  total_sessions: number;
  average_attendance: number;
}

export interface AttendanceDistribution {
  present_pct: number;
  absent_pct: number;
  late_pct: number;
  excused_pct: number;
}

export interface DashboardAnalyticsResponse {
  kpis: DashboardKPIs;
  daily_trends: TrendDataPoint[];
  weekly_trends: TrendDataPoint[];
  department_comparison: DepartmentComparison[];
  subject_stats: SubjectAttendanceStat[];
  distribution: AttendanceDistribution;
}

export interface StudentRiskAssessment {
  student_id: number;
  student_name: string;
  enrollment_number: string;
  roll_number: string;
  department_name: string;
  class_name: string;
  attendance_percentage: number;
  total_sessions: number;
  present_count: number;
  late_count: number;
  absent_count: number;
  risk_level: 'Critical' | 'High' | 'Moderate' | 'Low';
  risk_color: string;
  risk_score: number;
  trajectory: string;
  risk_factors: string[];
  recommended_action: string;
}

