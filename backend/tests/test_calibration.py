from unittest.mock import patch

from app.models.signal import Signal
from app.services.calibration import check_and_record_resolutions, compute_calibration_summary
from app.models.calibration import CalibrationRecord


def make_signal(db_session, market_id="TEST-MKT", side="yes", model_probability=0.65):
    signal = Signal(
        market_id=market_id,
        side=side,
        market_probability=0.55,
        model_probability=model_probability,
        edge=0.10,
        confidence=0.8,
        strategy_name="TEST",
        reason="test",
    )
    db_session.add(signal)
    db_session.commit()
    db_session.refresh(signal)
    return signal


def test_compute_calibration_summary_empty(db_session):
    summary = compute_calibration_summary(db_session)

    assert summary.total_resolved == 0
    assert summary.brier_score is None
    assert summary.accuracy is None


@patch("app.services.calibration.kalshi_client")
def test_check_and_record_resolutions_skips_unsettled_markets(mock_kalshi, db_session):
    mock_kalshi.get_market.return_value = {"market": {"status": "active", "result": ""}}

    make_signal(db_session)
    new_records = check_and_record_resolutions(db_session)

    assert new_records == 0
    assert db_session.query(CalibrationRecord).count() == 0


@patch("app.services.calibration.kalshi_client")
def test_check_and_record_resolutions_records_correct_prediction(mock_kalshi, db_session):
    mock_kalshi.get_market.return_value = {"market": {"status": "settled", "result": "yes"}}

    make_signal(db_session, side="yes", model_probability=0.80)
    new_records = check_and_record_resolutions(db_session)

    assert new_records == 1
    record = db_session.query(CalibrationRecord).first()
    assert record.actual_outcome is True
    assert record.resolution_value == "yes"
    assert abs(record.brier_component - 0.04) < 0.0001


@patch("app.services.calibration.kalshi_client")
def test_check_and_record_resolutions_records_incorrect_prediction(mock_kalshi, db_session):
    mock_kalshi.get_market.return_value = {"market": {"status": "settled", "result": "no"}}

    make_signal(db_session, side="yes", model_probability=0.80)
    check_and_record_resolutions(db_session)

    record = db_session.query(CalibrationRecord).first()
    assert record.actual_outcome is False
    assert abs(record.brier_component - 0.64) < 0.0001


@patch("app.services.calibration.kalshi_client")
def test_check_and_record_resolutions_never_rechecks_same_signal(mock_kalshi, db_session):
    mock_kalshi.get_market.return_value = {"market": {"status": "settled", "result": "yes"}}

    make_signal(db_session)
    first_run = check_and_record_resolutions(db_session)
    second_run = check_and_record_resolutions(db_session)

    assert first_run == 1
    assert second_run == 0