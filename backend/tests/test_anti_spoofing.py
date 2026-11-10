import pytest
import numpy as np
import cv2
from app.ml.liveness_detector import liveness_detector
from app.config import settings

def test_liveness_detector_empty_or_tiny_input():
    """Verify empty or tiny image inputs return non-live and Inconclusive/Failed."""
    res_none = liveness_detector.evaluate_liveness(None)
    assert res_none["is_live"] is False
    assert res_none["status"] == "Failed"

    res_tiny = liveness_detector.evaluate_liveness(np.zeros((30, 30, 3), dtype=np.uint8))
    assert res_tiny["is_live"] is False
    assert res_tiny["status"] == "Inconclusive"

def test_screen_moire_frequency_detection():
    """Verify 2D FFT detects periodic high-frequency grid artifacts (screen replay)."""
    # Create synthetic face
    base = np.full((120, 120, 3), 130, dtype=np.uint8)
    # Add artificial display periodic grid lines every 2 pixels
    base[::2, :, :] = 250
    base[:, ::2, :] = 250

    res = liveness_detector.evaluate_liveness(base)
    assert res["is_live"] is False
    # Frequency check or reflection check should flag the artifact
    assert "frequency_spectrum" in res["checks"]
    assert res["score"] < settings.FACE_LIVENESS_THRESHOLD

def test_printed_photo_low_chrominance_detection():
    """Verify low chrominance variation (grayscale / monochrome paper print) is rejected."""
    # Pure grayscale face image converted to BGR
    gray = np.full((120, 120), 128, dtype=np.uint8)
    # Add simple gradient to avoid blur flag
    gray = np.linspace(50, 200, 120*120, dtype=np.uint8).reshape((120, 120))
    bgr_mono = cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)

    res = liveness_detector.evaluate_liveness(bgr_mono)
    # Low chrominance should result in low chroma score
    assert res["checks"]["chrominance_distribution"] <= 0.30
    assert res["is_live"] is False

def test_specular_glare_screen_reflection():
    """Verify strong screen glare / light reflection is penalized."""
    img = np.full((120, 120, 3), 120, dtype=np.uint8)
    # Large saturated glare region (25% of image area)
    img[20:80, 20:80, :] = 255

    res = liveness_detector.evaluate_liveness(img)
    assert res["checks"]["reflection_analysis"] <= 0.60
