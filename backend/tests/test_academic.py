import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_list_colleges():
    response = client.get("/api/v1/academic/colleges")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert data[0]["code"] == "TIT-AI"

def test_list_departments():
    response = client.get("/api/v1/academic/departments")
    assert response.status_code == 200
    depts = response.json()
    assert len(depts) >= 4
    codes = [d["code"] for d in depts]
    assert "IT" in codes
    assert "AIML" in codes

def test_list_courses():
    response = client.get("/api/v1/academic/courses")
    assert response.status_code == 200
    courses = response.json()
    assert len(courses) >= 2
    codes = [c["code"] for c in courses]
    assert "MSC_IT" in codes

def test_list_subjects():
    response = client.get("/api/v1/academic/subjects")
    assert response.status_code == 200
    subjects = response.json()
    assert len(subjects) >= 3
    codes = [s["subject_code"] for s in subjects]
    assert "MIT101" in codes

