from app.services.strategy import TradeSignal
from app.services.risk import (
    check_signal,
    MAX_MARKET_EXPOSURE_USD,
    MAX_PORTFOLIO_EXPOSURE_USD,
    MAX_DAILY_LOSS_USD,
    MAX_OPEN_POSITIONS,
    DEFAULT_ORDER_SIZE,
)


def make_signal(market_probability=0.30, side="yes", market_id="TEST-MKT"):
    return TradeSignal(
        market_id=market_id,
        side=side,
        market_probability=market_probability,
        model_probability=market_probability + 0.05,
        edge=0.05,
        confidence=0.8,
        strategy_name="TEST_STRATEGY",
        reason="test",
    )


def test_signal_approved_under_normal_conditions():
    result = check_signal(make_signal())
    assert result.approved is True
    assert result.proposed_size == DEFAULT_ORDER_SIZE


def test_signal_rejected_on_market_exposure_limit(monkeypatch):
    # DEFAULT_ORDER_SIZE * max price (0.99) can be well under the real MAX_MARKET_EXPOSURE_USD,
    # so this limit can't always be triggered through price alone. Temporarily lower the limit
    # for this test to prove the check itself works correctly.
    import app.services.risk as risk_module

    monkeypatch.setattr(risk_module, "MAX_MARKET_EXPOSURE_USD", 1.0)

    result = risk_module.check_signal(make_signal(market_probability=0.50))
    assert result.approved is False
    assert "MAX_MARKET_EXPOSURE_EXCEEDED" in result.reason


def test_signal_rejected_on_portfolio_exposure_limit():
    result = check_signal(
        make_signal(market_probability=0.30),
        current_portfolio_exposure_usd=MAX_PORTFOLIO_EXPOSURE_USD,
    )
    assert result.approved is False
    assert "MAX_PORTFOLIO_EXPOSURE_EXCEEDED" in result.reason


def test_signal_rejected_on_daily_loss_limit():
    result = check_signal(
        make_signal(),
        current_daily_pnl_usd=-(MAX_DAILY_LOSS_USD + 1),
    )
    assert result.approved is False
    assert "MAX_DAILY_LOSS_EXCEEDED" in result.reason


def test_signal_rejected_on_max_open_positions():
    result = check_signal(make_signal(), current_open_positions=MAX_OPEN_POSITIONS)
    assert result.approved is False
    assert "MAX_OPEN_POSITIONS_EXCEEDED" in result.reason


def test_signal_approved_just_under_all_limits():
    result = check_signal(
        make_signal(market_probability=0.30),
        current_open_positions=MAX_OPEN_POSITIONS - 1,
        current_portfolio_exposure_usd=MAX_PORTFOLIO_EXPOSURE_USD - 10,
        current_daily_pnl_usd=-(MAX_DAILY_LOSS_USD - 1),
    )
    assert result.approved is True