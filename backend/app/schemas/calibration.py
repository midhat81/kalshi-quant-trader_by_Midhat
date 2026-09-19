from pydantic import BaseModel
from typing import Optional


class CalibrationSummaryOut(BaseModel):
    total_resolved: int
    total_correct: int
    accuracy: Optional[float]
    brier_score: Optional[float]
    calibration_note: str