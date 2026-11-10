import time
import concurrent.futures
import pytest
import numpy as np
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models.attendance import AttendanceSession, AttendanceRecord
from app.ml.face_pipeline import face_pipeline

client = TestClient(app)

def test_controlled_performance_embedding_extraction():
    """Verify facial embedding extraction executes within controlled latency bounds (< 150ms)."""
    dummy_face = np.random.randint(0, 255, (112, 112, 3), dtype=np.uint8)
    
    latencies = []
    # Warmup
    face_pipeline.extract_embedding({"aligned_face": dummy_face})

    # Benchmark 20 iterations
    for _ in range(20):
        t0 = time.perf_counter()
        emb = face_pipeline.extract_embedding({"aligned_face": dummy_face})
        lat = (time.perf_counter() - t0) * 1000.0
        latencies.append(lat)

    avg_lat = float(np.mean(latencies))
    p95_lat = float(np.percentile(latencies, 95))
    print(f"\nEmbedding extraction average latency: {avg_lat:.2f}ms, P95: {p95_lat:.2f}ms")
    
    assert avg_lat < 150.0, f"Average embedding extraction too slow: {avg_lat:.2f}ms"
    assert p95_lat < 250.0, f"P95 embedding extraction too slow: {p95_lat:.2f}ms"

def test_controlled_performance_vector_matching():
    """Verify 1:N vector matching against 500 enrolled templates executes in under 20ms."""
    # Synthesize 500 128-d enrolled student templates
    templates = []
    for i in range(500):
        vec = np.random.randn(128).astype(np.float32)
        vec /= np.linalg.norm(vec)
        templates.append({
            "student_id": i + 1,
            "student_name": f"Student {i+1}",
            "enrollment_number": f"EN2026_{i:04d}",
            "embedding": vec
        })

    query = np.random.randn(128).astype(np.float32)
    query /= np.linalg.norm(query)

    latencies = []
    for _ in range(25):
        t0 = time.perf_counter()
        res = face_pipeline.match_face(query, templates)
        lat = (time.perf_counter() - t0) * 1000.0
        latencies.append(lat)

    avg_match_lat = float(np.mean(latencies))
    print(f"\n1:500 Face matching average latency: {avg_match_lat:.2f}ms")
    assert avg_match_lat < 20.0, f"1:500 matching too slow: {avg_match_lat:.2f}ms"

def test_concurrent_manual_attendance_marking():
    """Verify simultaneous concurrent requests do not corrupt state or cause race condition crashes."""
    res_login = client.post("/api/v1/auth/login", json={
        "email": "sharma.it@trinity.edu.in",
        "password": "Faculty@123"
    })
    token = res_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res_sess = client.post("/api/v1/attendance/sessions", json={
        "faculty_id": 1,
        "subject_id": 1,
        "class_id": 1,
        "division_id": 1
    }, headers=headers)
    session_id = res_sess.json()["id"]

    def submit_mark(st_id):
        return client.post("/api/v1/attendance/manual-record", json={
            "session_id": session_id,
            "student_id": st_id,
            "status": "Present",
            "remarks": f"Concurrent thread for student {st_id}"
        }, headers=headers)

    # Fire 5 concurrent requests for different students
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        futures = [executor.submit(submit_mark, sid) for sid in range(1, 6)]
        results = [f.result() for f in futures]

    for r in results:
        assert r.status_code == 200

    db = SessionLocal()
    marked_count = db.query(AttendanceRecord).filter(
        AttendanceRecord.session_id == session_id,
        AttendanceRecord.status == "Present"
    ).count()
    assert marked_count == 5
    db.close()
