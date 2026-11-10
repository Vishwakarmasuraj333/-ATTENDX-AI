import cv2
import numpy as np
from typing import Dict, Any, Tuple

class LivenessDetector:
    """
    Presentation Attack Detection (PAD) and Passive Liveness Verification.
    Implements multi-cue passive anti-spoofing using:
    1. Texture Analysis via Laplacian Variance & Gradient Magnitude
    2. 2D FFT Frequency Domain Analysis (Moiré pattern & digital screen artifact detection)
    3. Chrominance & Color Distribution (YCrCb skin reflection modeling)
    4. Specular Reflection & Dynamic Range Analysis
    """

    def __init__(self, liveness_threshold: float = 0.70):
        self.liveness_threshold = liveness_threshold

    def evaluate_liveness(self, face_bgr: np.ndarray) -> Dict[str, Any]:
        """
        Evaluates a cropped face BGR image and computes an aggregate anti-spoofing score.
        Returns:
            Dict containing:
            - is_live: bool
            - score: float (0.0 to 1.0)
            - status: "Passed", "Failed", "Inconclusive"
            - checks: dictionary of individual cue scores
        """
        if face_bgr is None or face_bgr.size == 0:
            return {
                "is_live": False,
                "score": 0.0,
                "status": "Failed",
                "reason": "Empty face region",
                "checks": {}
            }

        h, w = face_bgr.shape[:2]
        if h < 50 or w < 50:
            return {
                "is_live": False,
                "score": 0.3,
                "status": "Inconclusive",
                "reason": "Face region too small for reliable anti-spoofing",
                "checks": {}
            }

        # 1. Texture / Sharpness Analysis (Laplacian Variance)
        gray = cv2.cvtColor(face_bgr, cv2.COLOR_BGR2GRAY)
        laplacian = cv2.Laplacian(gray, cv2.CV_64F)
        lap_var = float(laplacian.var())
        # Genuine live camera face typically has lap_var in [80, 800]. Below 50 is blurry, above 1200 is often digital pixel grid
        if lap_var < 40.0:
            texture_score = max(0.1, lap_var / 40.0 * 0.5)
        elif lap_var > 1500.0:
            # High pixel grid or artificial grain
            texture_score = 0.5
        else:
            # Ideal live sharpness range
            texture_score = min(1.0, 0.6 + min(lap_var, 500) / 1000.0)

        # 2. 2D FFT High Frequency Analysis (Screen moiré detection)
        # Digital screens (phones/tablets/laptops) show periodic frequency peaks
        fft = np.fft.fft2(gray)
        fft_shift = np.fft.fftshift(fft)
        magnitude_spectrum = np.log(np.abs(fft_shift) + 1e-7)
        
        # Center coordinates
        cy, cx = h // 2, w // 2
        r = min(cy, cx) // 3
        # Mask out center DC component
        mask = np.ones((h, w), dtype=bool)
        y, x = np.ogrid[:h, :w]
        mask_area = (x - cx)**2 + (y - cy)**2 <= r**2
        mask[mask_area] = False
        
        high_freq_energy = float(np.mean(magnitude_spectrum[mask]))
        total_energy = float(np.mean(magnitude_spectrum))
        freq_ratio = high_freq_energy / (total_energy + 1e-6)
        
        # Natural human skin has smooth gradients (ratio typically 0.6 - 0.88)
        # Display screens often have ratio > 0.95 or printed paper < 0.45
        if 0.55 <= freq_ratio <= 0.92:
            freq_score = 0.90
        elif freq_ratio > 0.95:
            freq_score = 0.35 # Potential digital screen grid
        else:
            freq_score = 0.50

        # 3. Color Space Chrominance Analysis (YCrCb Skin Sub-surface reflection)
        ycrcb = cv2.cvtColor(face_bgr, cv2.COLOR_BGR2YCrCb)
        cr = ycrcb[:, :, 1]
        cb = ycrcb[:, :, 2]
        
        # Genuine human faces exhibit natural chrominance variation across cheeks, lips, forehead
        cr_std = float(np.std(cr))
        cb_std = float(np.std(cb))
        chroma_std = (cr_std + cb_std) / 2.0
        
        # Low chroma variance indicates black-and-white or low-gamut paper prints
        if chroma_std < 4.0:
            chroma_score = 0.25
        elif chroma_std > 28.0:
            chroma_score = 0.60 # Over-saturated screen
        else:
            chroma_score = min(1.0, 0.5 + (chroma_std / 30.0))

        # 4. Specular Glare & Luminance Saturation Check
        hsv = cv2.cvtColor(face_bgr, cv2.COLOR_BGR2HSV)
        v = hsv[:, :, 2]
        s = hsv[:, :, 1]
        
        # Percentage of pixels that are near pure white / screen glare reflection (V > 240, S < 30)
        glare_pixels = np.sum((v > 245) & (s < 25))
        glare_ratio = float(glare_pixels) / float(h * w)
        
        if glare_ratio > 0.15: # Heavy glass reflection or phone screen reflection
            reflection_score = 0.30
        else:
            reflection_score = max(0.6, 1.0 - (glare_ratio * 3.0))

        # Calibrated Weighted Aggregate Score
        aggregate_score = (
            texture_score * 0.35 +
            freq_score * 0.25 +
            chroma_score * 0.25 +
            reflection_score * 0.15
        )
        aggregate_score = float(np.clip(aggregate_score, 0.0, 1.0))

        is_live = aggregate_score >= self.liveness_threshold
        status = "Passed" if is_live else ("Failed" if aggregate_score < (self.liveness_threshold - 0.15) else "Inconclusive")

        return {
            "is_live": is_live,
            "score": round(aggregate_score, 4),
            "status": status,
            "checks": {
                "texture_sharpness": round(texture_score, 3),
                "frequency_spectrum": round(freq_score, 3),
                "chrominance_distribution": round(chroma_score, 3),
                "reflection_analysis": round(reflection_score, 3),
                "laplacian_variance": round(lap_var, 2)
            }
        }

liveness_detector = LivenessDetector()

