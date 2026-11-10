import os
import json
import logging
from typing import Dict, Any

logger = logging.getLogger("attendx.evaluation")

class ModelEvaluator:
    """
    Biometric Performance and Anti-Spoofing Model Benchmark Engine.
    Provides dynamically evaluated empirical benchmark figures from 
    standard independent evaluation datasets and presentation-attack testing.
    """

    @staticmethod
    def get_benchmark_metrics() -> Dict[str, Any]:
        """
        Returns empirical benchmark metrics computed from independent validation observations.
        Distinguishes face recognition performance from liveness detection performance.
        Does not present heuristic texture analysis as certified PAD.
        """
        results_path = os.path.join(os.path.dirname(__file__), "benchmark_results.json")
        
        if os.path.exists(results_path):
            try:
                with open(results_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    return data
            except Exception as e:
                logger.warning(f"Could not load benchmark_results.json: {e}")

        # Fallback to running empirical evaluation if file missing
        try:
            from app.ml.run_benchmark_validation import run_empirical_validation
            return run_empirical_validation()
        except Exception as e:
            logger.error(f"Error computing empirical benchmarks: {e}")
            return {
                "error": "Empirical benchmark execution failed",
                "details": str(e)
            }

model_evaluator = ModelEvaluator()
