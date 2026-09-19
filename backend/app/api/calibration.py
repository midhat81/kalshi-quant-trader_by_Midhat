from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.calibration import CalibrationSummaryOut
from app.services.calibration import compute_calibration_summary, check_and_record_resolutions

router = APIRouter(prefix="/api/calibration", tags=["calibration"])


@router.get("", response_model=CalibrationSummaryOut)
def get_calibration(db: Session = Depends(get_db)):
    summary = compute_calibration_summary(db)
    return CalibrationSummaryOut(**summary.__dict__)


@router.post("/check")
def trigger_resolution_check(db: Session = Depends(get_db)):
    """
    Manually triggers a check for newly-resolved markets. In production
    this would also run on a schedule (same pattern as the snapshot
    collector), but exposing it as an endpoint allows checking on demand.
    """
    new_records = check_and_record_resolutions(db)
    return {"new_records": new_records}