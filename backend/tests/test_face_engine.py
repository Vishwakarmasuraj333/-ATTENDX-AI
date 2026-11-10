import pytest
import numpy as np
from app.services.crypto_service import crypto_service
from app.ml.liveness_detector import liveness_detector
from app.ml.face_pipeline import face_pipeline

def test_biometric_template_encryption():
    # 128-dimensional embedding vector
    raw_vector = np.random.randn(128).astype(np.float32)
    raw_vector /= np.linalg.norm(raw_vector)

    # Encrypt
    encrypted_str = crypto_service.encrypt_embedding(raw_vector)
    assert isinstance(encrypted_str, str)
    assert len(encrypted_str) > 100
    # Must not contain plaintext vector values directly
    assert str(raw_vector[0]) not in encrypted_str

    # Decrypt
    decrypted_vector = crypto_service.decrypt_embedding(encrypted_str)
    assert decrypted_vector.shape == (128,)
    assert np.allclose(raw_vector, decrypted_vector, atol=1e-5)

def test_liveness_detection_empty():
    res = liveness_detector.evaluate_liveness(np.zeros((10, 10, 3), dtype=np.uint8))
    assert res["is_live"] is False
    assert res["status"] in ("Failed", "Inconclusive")

def test_face_quality_assessment():
    # Synthetic face crop (112x112 with gradient)
    synthetic_face = np.ones((112, 112, 3), dtype=np.uint8) * 128
    res = face_pipeline.assess_quality(synthetic_face, [0, 0, 112, 112], (480, 640))
    assert "score" in res
    assert "sharpness" in res
    assert "brightness" in res

