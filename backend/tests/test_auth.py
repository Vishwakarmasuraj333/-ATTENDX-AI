import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"

def test_login_success():
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@trinity.edu.in", "password": "Admin@123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "admin@trinity.edu.in"
    assert data["user"]["role"] == "College Admin"

def test_login_invalid_password():
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@trinity.edu.in", "password": "WrongPassword999"}
    )
    assert response.status_code == 401

def test_get_roles():
    response = client.get("/api/v1/auth/roles")
    assert response.status_code == 200
    roles = response.json()
    assert len(roles) >= 6
    role_names = [r["name"] for r in roles]
    assert "Super Admin" in role_names
    assert "Faculty" in role_names
    assert "Student" in role_names

