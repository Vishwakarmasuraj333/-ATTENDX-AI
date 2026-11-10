import os
import urllib.request
import logging
import cv2
from app.config import settings

logger = logging.getLogger("attendx.ml")

YUNET_URL = "https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx"
SFACE_URL = "https://github.com/opencv/opencv_zoo/raw/main/models/face_recognition_sface/face_recognition_sface_2021dec.onnx"

YUNET_FILENAME = "face_detection_yunet_2023mar.onnx"
SFACE_FILENAME = "face_recognition_sface_2021dec.onnx"

class ModelManager:
    def __init__(self):
        self.weights_dir = settings.MODEL_WEIGHTS_DIR
        os.makedirs(self.weights_dir, exist_ok=True)
        self.yunet_path = os.path.join(self.weights_dir, YUNET_FILENAME)
        self.sface_path = os.path.join(self.weights_dir, SFACE_FILENAME)
        
        self.detector = None
        self.recognizer = None
        self.use_fallback = False
        
        self.initialize_models()

    def download_file(self, url: str, target_path: str):
        if not os.path.exists(target_path) or os.path.getsize(target_path) < 1000:
            logger.info(f"Downloading model from {url} to {target_path}...")
            try:
                opener = urllib.request.build_opener()
                opener.addheaders = [('User-Agent', 'Mozilla/5.0 (AttendX-AI Project Downloader)')]
                urllib.request.install_opener(opener)
                urllib.request.urlretrieve(url, target_path)
                logger.info(f"Downloaded model to {target_path}")
            except Exception as e:
                logger.warning(f"Could not download model {url}: {e}. Will operate in robust fallback mode.")

    def initialize_models(self):
        # Attempt to download if not present
        if not os.path.exists(self.yunet_path):
            self.download_file(YUNET_URL, self.yunet_path)
        if not os.path.exists(self.sface_path):
            self.download_file(SFACE_URL, self.sface_path)

        # Initialize YuNet detector
        if os.path.exists(self.yunet_path) and os.path.getsize(self.yunet_path) > 10000:
            try:
                self.detector = cv2.FaceDetectorYN.create(
                    model=self.yunet_path,
                    config="",
                    input_size=(320, 320),
                    score_threshold=0.6,
                    nms_threshold=0.3,
                    top_k=5000
                )
                logger.info("OpenCV YuNet Face Detector successfully loaded.")
            except Exception as e:
                logger.warning(f"Failed to initialize YuNet: {e}")
                self.detector = None

        # Initialize SFace recognizer
        if os.path.exists(self.sface_path) and os.path.getsize(self.sface_path) > 10000:
            try:
                self.recognizer = cv2.FaceRecognizerSF.create(
                    model=self.sface_path,
                    config=""
                )
                logger.info("OpenCV SFace Face Recognizer successfully loaded.")
            except Exception as e:
                logger.warning(f"Failed to initialize SFace: {e}")
                self.recognizer = None

        if self.detector is None or self.recognizer is None:
            logger.info("Using OpenCV Haar & Deep Feature Extractor fallback mode.")
            self.use_fallback = True

model_manager = ModelManager()

