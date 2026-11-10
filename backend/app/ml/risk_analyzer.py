import datetime
from typing import List, Dict, Any

class AttendanceRiskAnalyzer:
    """
    Explainable AI Attendance Analytics:
    - Evaluates institutional attendance threshold criteria (default 75% UGC/AICTE compliance).
    - Detects negative trajectory patterns and repeated absence anomalies.
    - Generates human-understandable risk factor explanations.
    """

    @staticmethod
    def calculate_attendance_percentage(present_count: int, late_count: int, total_eligible: int, late_weight: float = 1.0) -> float:
        if total_eligible <= 0:
            return 100.0
        # institutional policy: late may count as 1.0 or 0.8 present session
        effective_present = present_count + (late_count * late_weight)
        pct = (effective_present / total_eligible) * 100.0
        return round(min(100.0, max(0.0, pct)), 2)

    @staticmethod
    def evaluate_student_risk(
        student_id: int, 
        student_name: str, 
        records: List[Dict[str, Any]], 
        total_sessions: int
    ) -> Dict[str, Any]:
        """
        Calculates student absenteeism risk indicator and generates explainable risk factors.
        """
        if not records:
            return {
                "student_id": student_id,
                "student_name": student_name,
                "attendance_percentage": 0.0,
                "risk_level": "High",
                "risk_color": "#F05D6C",
                "risk_score": 0.85,
                "trajectory": "Insufficient Data",
                "risk_factors": ["No attendance records registered yet for the current term."],
                "recommended_action": "Verify student enrollment status and send advisory notice."
            }

        # Filter out excused sessions
        eligible_records = [r for r in records if not r.get("is_excused", False)]
        total_eligible = len(eligible_records)
        
        present_count = sum(1 for r in eligible_records if r.get("status") in ("Present", "Verified"))
        late_count = sum(1 for r in eligible_records if r.get("status") == "Late")
        absent_count = sum(1 for r in eligible_records if r.get("status") in ("Absent", "Unexcused"))

        pct = AttendanceRiskAnalyzer.calculate_attendance_percentage(present_count, late_count, total_eligible)

        # Risk Classification
        if pct < 65.0:
            risk_level = "Critical"
            risk_color = "#F05D6C" # Danger Red
            risk_score = round(1.0 - (pct / 100.0), 3)
        elif pct < 75.0:
            risk_level = "High"
            risk_color = "#F5A524" # Warning Amber
            risk_score = round(1.0 - (pct / 100.0), 3)
        elif pct < 85.0:
            risk_level = "Moderate"
            risk_color = "#55A6FF" # Electric Blue
            risk_score = round(1.0 - (pct / 100.0), 3)
        else:
            risk_level = "Low"
            risk_color = "#22C987" # Success Green
            risk_score = round(1.0 - (pct / 100.0), 3)

        # Trajectory analysis (compare first half vs second half or last 5 records)
        risk_factors = []
        if len(eligible_records) >= 4:
            sorted_records = sorted(eligible_records, key=lambda x: str(x.get("date", "")))
            recent_records = sorted_records[-4:]
            recent_presents = sum(1 for r in recent_records if r.get("status") in ("Present", "Late"))
            recent_rate = (recent_presents / len(recent_records)) * 100.0
            
            if recent_rate < pct - 15.0:
                trajectory = "Deteriorating"
                risk_factors.append(f"Recent attendance rate ({recent_rate:.1f}%) is significantly below historical average ({pct:.1f}%).")
            elif recent_rate > pct + 10.0:
                trajectory = "Improving"
            else:
                trajectory = "Stable"
        else:
            trajectory = "Stable"

        # Check for consecutive absences
        if len(eligible_records) >= 3:
            last_3 = eligible_records[-3:]
            if all(r.get("status") == "Absent" for r in last_3):
                risk_factors.append("3 consecutive sessions missed in recent schedule.")

        # Check overall statutory deficit
        if pct < 75.0:
            deficit_classes = int(round((0.75 * total_eligible - present_count) / 0.25))
            if deficit_classes > 0:
                risk_factors.append(f"Student needs to attend {max(1, deficit_classes)} consecutive upcoming lectures to regain minimum 75% compliance.")

        if not risk_factors:
            risk_factors.append("Attendance performance conforms to statutory academic prerequisites.")

        recommended_action = "Routine monitoring"
        if risk_level == "Critical":
            recommended_action = "Trigger Dean warning letter and summon for counseling."
        elif risk_level == "High":
            recommended_action = "Send SMS/Email advisory to student and faculty coordinator."
        elif risk_level == "Moderate":
            recommended_action = "Display low-attendance banner in student portal."

        return {
            "student_id": student_id,
            "student_name": student_name,
            "attendance_percentage": pct,
            "total_sessions": total_eligible,
            "present_count": present_count,
            "late_count": late_count,
            "absent_count": absent_count,
            "risk_level": risk_level,
            "risk_color": risk_color,
            "risk_score": risk_score,
            "trajectory": trajectory,
            "risk_factors": risk_factors,
            "recommended_action": recommended_action
        }

risk_analyzer = AttendanceRiskAnalyzer()

