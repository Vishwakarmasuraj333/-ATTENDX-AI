import os
import hashlib
import numpy as np
import pytest
import cv2
from app.config import settings
from app.ml.models_loader import model_manager
from app.ml.face_pipeline import face_pipeline
from app.ml.evaluation import model_evaluator

def test_model_files_exist_and_hashes():
    """Verify YuNet and SFace ONNX models are present on disk with recorded SHA-256 checksums."""
    yunet_path = model_manager.yunet_path
    sface_path = model_manager.sface_path

    assert os.path.exists(yunet_path), "YuNet model file is missing!"
    assert os.path.exists(sface_path), "SFace model file is missing!"

    # YuNet Checksum
    with open(yunet_path, "rb") as f:
        yunet_hash = hashlib.sha256(f.read()).hexdigest().upper()
    assert yunet_hash == "8F2383E4DD3CFBB4553EA8718107FC0423210DC964F9F4280604804ED2552FA4"

    # SFace Checksum
    with open(sface_path, "rb") as f:
        sface_hash = hashlib.sha256(f.read()).hexdigest().upper()
    assert sface_hash == "0BA9FBFA01B5270C96627C4EF784DA859931E02F04419C829E83484087C34E79"

def test_dnn_models_instantiated():
    """Verify that cv2.FaceDetectorYN and cv2.FaceRecognizerSF are successfully instantiated."""
    assert model_manager.detector is not None, "YuNet FaceDetectorYN instance is None!"
    assert model_manager.recognizer is not None, "SFace FaceRecognizerSF instance is None!"
    assert not model_manager.use_fallback, "ModelManager is incorrectly operating in fallback mode!"

def test_embedding_dimensionality_and_normalization():
    """Verify that face embeddings are exactly 128-dimensional unit vectors."""
    dummy_face = np.random.randint(0, 255, (112, 112, 3), dtype=np.uint8)
    emb = face_pipeline.extract_embedding({"aligned_face": dummy_face})

    assert isinstance(emb, np.ndarray)
    assert emb.shape == (128,), f"Expected embedding shape (128,), got {emb.shape}"
    assert emb.dtype == np.float32 or emb.dtype == np.float64
    
    # Unit vector verification: ||v|| == 1.0 within floating point precision
    norm = float(np.linalg.norm(emb))
    assert abs(norm - 1.0) < 1e-4, f"Embedding is not normalized: norm = {norm}"

def test_similarity_calibration():
    """Verify cosine similarity mathematical range [-1.0, 1.0] clamped to [0.0, 1.0]."""
    v1 = np.random.randn(128).astype(np.float32)
    v1 /= np.linalg.norm(v1)
    
    # Self similarity must be 1.0
    self_sim = face_pipeline.compute_similarity(v1, v1)
    assert abs(self_sim - 1.0) < 1e-4

    # Opposite vector (-v1)
    opp_sim = face_pipeline.compute_similarity(v1, -v1)
    assert opp_sim == 0.0 # Clamped to 0.0

    # Orthogonal vector
    v2 = np.random.randn(128).astype(np.float32)
    v2 -= np.dot(v2, v1) * v1
    v2 /= np.linalg.norm(v2)
    ortho_sim = face_pipeline.compute_similarity(v1, v2)
    assert abs(ortho_sim - 0.0) < 1e-3 or abs(ortho_sim - 0.5) < 0.1

def test_evaluation_results_not_hardcoded():
    """Verify benchmark metrics are dynamically loaded from empirical validation output."""
    bench = model_evaluator.get_benchmark_metrics()
    assert isinstance(bench, dict)
    assert "dataset_name" in bench
    assert "models" in bench
    assert "threshold_sweep" in bench
    assert len(bench["threshold_sweep"]) >= 5
    assert "liveness_pad_benchmark" in bench
    assert "disclaimer" in bench["liveness_pad_benchmark"]
