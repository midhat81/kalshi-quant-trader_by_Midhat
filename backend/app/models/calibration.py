import uuid

from sqlalchemy import Column, String, Float, DateTime, Boolean
from sqlalchemy.sql import func

from app.core.database import Base


class CalibrationRecord(Base):
    """
    One row per signal that has been checked against its market's real
    resolution. Never written until the market has genuinely settled --
    no predicted/estimated outcomes, only real ones from Kalshi.
    """
    __tablename__ = "calibration_records"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    signal_id = Column(String, index=True, nullable=False)
    market_id = Column(String, index=True, nullable=False)

    predicted_probability = Column(Float, nullable=False)  # model_probability at signal time
    predicted_side = Column(String, nullable=False)         # "yes" or "no"

    actual_outcome = Column(Boolean, nullable=False)        # True if predicted_side resolved correct
    resolution_value = Column(String, nullable=False)        # raw Kalshi result: "yes" or "no"

    brier_component = Column(Float, nullable=False)          # (predicted_prob - actual)^2 for this single record

    checked_at = Column(DateTime(timezone=True), server_default=func.now())