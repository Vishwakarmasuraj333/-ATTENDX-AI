import os
import pytest
import numpy as np
from fastapi.testclient import TestClient
from app.main import app
from app.services.crypto_service import crypto_service
from app.config import settings
from app.database import SessionLocal
from app.models.biometrics import FaceTemplate, FaceVerificationEvent
from app.models.students import Student
from app.models.users import ConsentRecord

client = TestClient(app)

def test_fernet_aes_roundtrip_integrity():
    """Verify AES-256 Fernet encryption and decryption accurately recovers float32 vectors."""
    test_vec = np.random.uniform(-1.0, 1.0, 128).astype(np.float32)
    test_vec /= np.linalg.norm(test_vec)

    encrypted = crypto_service.encrypt_embedding(test_vec)
    assert isinstance(encrypted, str)
    assert len(encrypted) > 120
    assert "gAAAAA" in encrypted # Standard Fernet ciphertext prefix

    decrypted = crypto_service.decrypt_embedding(encrypted)
    assert decrypted.shape == (128,)
    assert np.allclose(test_vec, decrypted, atol=1e-5)

def test_unauthorized_biometric_template_access():
    """Verify unauthenticated or unauthorized users cannot access biometric routes."""
    # Attempt to enroll face without authentication
    res = client.post("/api/v1/face-engine/enroll", json={"student_id": 1, "samples": []})
    assert res.status_code == 401

    # Attempt to record consent without authentication
    res2 = client.post("/api/v1/face-engine/consent", json={
        "student_id": 1,
        "consent_statement": "Consent test"
    })
    assert res2.status_code == 401

    # Attempt to purge biometrics without authentication
    res3 = client.delete("/api/v1/face-engine/biometrics/1")
    assert res3.status_code == 401

def test_raw_images_not_persisted_in_uploads():
    """Verify raw face capture photos are never written to disk."""
    upload_dir = settings.UPLOAD_DIR
    if os.path.exists(upload_dir):
        files = os.listdir(upload_dir)
        # Any file in uploads must not be raw temporary capture frames
        for f in files:
            assert not f.startswith("raw_frame_"), f"Found raw capture file persisted: {f}"

def test_raw_images_not_in_database_tables():
    """Verify neither FaceTemplate nor FaceVerificationEvent store raw image binary or base64."""
    db = SessionLocal()
    templates = db.query(FaceTemplate).all()
    for t in templates:
        # encrypted_embedding must be fernet string, not raw jpeg or base64 image
        assert not t.encrypted_embedding.startswith("data:image")
        assert not t.encrypted_embedding.startswith("/9j/") # JPEG base64 signature
        assert t.embedding_dimension == 128

    events = db.query(FaceVerificationEvent).all()
    for ev in events:
        assert not hasattr(ev, "image_base64")
        assert not hasattr(ev, "raw_image")
    db.close()
