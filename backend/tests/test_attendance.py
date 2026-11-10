import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_list_attendance_sessions():
    response = client.get("/api/v1/attendance/sessions")
    assert response.status_code == 200
    sessions = response.json()
    assert len(sessions) >= 1
    # Check session structure
    first_sess = sessions[0]
    assert "session_code" in first_sess
    assert "status" in first_sess
    assert "eligible_students_count" in first_sess

def test_student_attendance_history():
    # Student 1 is Aarav Mehta (Roll 101)
    response = client.get("/api/v1/attendance/student/1/history")
    assert response.status_code == 200
    history = response.json()
    assert history["student_name"] == "Aarav Mehta"
    assert "attendance_percentage" in history
    assert "records" in history
    assert len(history["records"]) >= 1

def test_dashboard_analytics():
    response = client.get("/api/v1/analytics/dashboard")
    assert response.status_code == 200
    data = response.json()
    assert "kpis" in data
    assert data["kpis"]["total_students"] >= 10
    assert data["kpis"]["total_faculty"] >= 2
    assert "daily_trends" in data
    assert "department_comparison" in data

def test_model_benchmarks():
    response = client.get("/api/v1/analytics/model-benchmarks")
    assert response.status_code == 200
    bench = response.json()
    assert "operating_threshold" in bench
    assert "at_default_operating_point" in bench
    assert "threshold_sweep" in bench

