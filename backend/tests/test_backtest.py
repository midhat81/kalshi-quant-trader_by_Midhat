from app.models.market_snapshot import MarketSnapshot
from app.services.backtest import run_backtest


def make_snapshot(db_session, market_id="TEST-MKT", yes_bid=0.30, yes_ask=0.34, volume=5000.0):
    snapshot = MarketSnapshot(
        market_id=market_id,
        yes_bid=yes_bid,
        yes_ask=yes_ask,
        no_bid=1 - yes_ask if yes_ask else None,
        no_ask=1 - yes_bid if yes_bid else None,
        spread=round(yes_ask - yes_bid, 4) if yes_bid is not None and yes_ask is not None else None,
        volume=volume,
        status="active",
    )
    db_session.add(snapshot)
    db_session.commit()
    return snapshot


def test_run_backtest_reports_data_warning_on_small_sample(db_session):
    make_snapshot(db_session)

    result = run_backtest(db_session)

    assert result.sample_size == 1
    assert result.data_warning is not None
    assert "not statistically meaningful" in result.data_warning


def test_run_backtest_empty_when_no_snapshots(db_session):
    result = run_backtest(db_session)

    assert result.sample_size == 0
    assert result.trades == []
    assert result.total_signals_generated == 0


def test_run_backtest_filters_by_series_prefix(db_session):
    make_snapshot(db_session, market_id="KXHIGHNY-TEST")
    make_snapshot(db_session, market_id="KXCPIYOY-TEST")

    result = run_backtest(db_session, series_prefix="KXHIGHNY")

    assert result.sample_size == 1
    assert result.market_series_covered == ["KXHIGHNY-TEST"]


def test_run_backtest_no_signal_when_no_edge(db_session):
    # Tight spread, mid-price only -- no orderbook imbalance available in
    # backtest mode, so edge should be zero and no signal should fire.
    make_snapshot(db_session, yes_bid=0.50, yes_ask=0.50)

    result = run_backtest(db_session)

    assert result.total_signals_generated == 0
    assert result.trades == []