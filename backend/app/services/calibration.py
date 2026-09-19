from dataclasses import dataclass
from typing import Optional

from sqlalchemy.orm import Session

from app.adapters.kalshi import kalshi_client
from app.models.signal import Signal
from app.models.calibration import CalibrationRecord


def check_and_record_resolutions(db: Session) -> int:
    """
    For every Signal that doesn't yet have a CalibrationRecord, checks
    whether its market has genuinely resolved on Kalshi. If so, records
    the real outcome and computes the Brier component for that prediction.

    Never guesses or estimates a resolution -- only records when Kalshi's
    own API reports the market as settled with a real result.
    Returns the number of new calibration records created this run.
    """
    already_checked_signal_ids = {
        row[0] for row in db.query(CalibrationRecord.signal_id).all()
    }

    unchecked_signals = (
        db.query(Signal)
        .filter(~Signal.id.in_(already_checked_signal_ids) if already_checked_signal_ids else True)
        .all()
    )

    new_records = 0

    for signal in unchecked_signals:
        try:
            market = kalshi_client.get_market(signal.market_id)
        except Exception:
            continue  # market may no longer exist or be temporarily unreachable; skip, retry later

        m = market.get("market", market)
        status = m.get("status")
        result = m.get("result")  # "yes" or "no" once settled, empty otherwise

        if status != "settled" or not result:
            continue  # not resolved yet -- check again on a future run

        predicted_side = signal.side
        actual_outcome = predicted_side == result

        # Brier score component: (forecast_probability - actual)^2
        # forecast_probability is the model's stated probability of YES;
        # actual is 1 if market resolved YES, else 0.
        model_prob_of_yes = signal.model_probability if predicted_side == "yes" else (1 - signal.model_probability)
        actual_yes = 1.0 if result == "yes" else 0.0
        brier_component = (model_prob_of_yes - actual_yes) ** 2

        record = CalibrationRecord(
            signal_id=signal.id,
            market_id=signal.market_id,
            predicted_probability=signal.model_probability,
            predicted_side=predicted_side,
            actual_outcome=actual_outcome,
            resolution_value=result,
            brier_component=round(brier_component, 6),
        )
        db.add(record)
        new_records += 1

    db.commit()
    return new_records


@dataclass
class CalibrationSummary:
    total_resolved: int
    total_correct: int
    accuracy: Optional[float]
    brier_score: Optional[float]  # average of all brier_components -- lower is better, 0 is perfect
    calibration_note: str


def compute_calibration_summary(db: Session) -> CalibrationSummary:
    records = db.query(CalibrationRecord).all()
    total = len(records)

    if total == 0:
        return CalibrationSummary(
            total_resolved=0,
            total_correct=0,
            accuracy=None,
            brier_score=None,
            calibration_note="No resolved markets yet -- calibration data accumulates as signals' markets settle.",
        )

    correct = sum(1 for r in records if r.actual_outcome)
    accuracy = round(correct / total, 4)
    brier = round(sum(r.brier_component for r in records) / total, 4)

    note = (
        f"Based on {total} resolved market(s). "
        f"Brier score of 0.0 is perfect calibration; 0.25 is what a coin-flip forecaster achieves; "
        f"1.0 is maximally wrong. "
    )
    if total < 20:
        note += "Sample size is still small -- treat as early signal, not a robust conclusion."

    return CalibrationSummary(
        total_resolved=total,
        total_correct=correct,
        accuracy=accuracy,
        brier_score=brier,
        calibration_note=note,
    )