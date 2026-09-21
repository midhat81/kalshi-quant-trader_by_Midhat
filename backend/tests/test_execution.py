from unittest.mock import patch

from app.adapters.paper_exchange import PaperFillResult
from app.services.execution import execute_signal_order


def make_fill_result(price=0.55, quantity=10, fee=0.1, fully_filled=True):
    return PaperFillResult(
        fill_id="test-fill-id",
        price=price,
        quantity=quantity,
        fee=fee,
        fully_filled=fully_filled,
        reason="test fill",
    )


@patch("app.services.execution.paper_exchange")
def test_execute_signal_order_creates_filled_order(mock_exchange, db_session):
    mock_exchange.submit_order.return_value = make_fill_result()

    order = execute_signal_order(
        db_session,
        market_id="TEST-MKT",
        side="yes",
        quantity=10,
        limit_price=0.99,
        strategy="TEST",
    )

    assert order.status == "filled"
    assert order.market_id == "TEST-MKT"
    assert order.side == "yes"


@patch("app.services.execution.paper_exchange")
def test_execute_signal_order_rejects_on_no_fill(mock_exchange, db_session):
    mock_exchange.submit_order.return_value = make_fill_result(quantity=0, price=0.0, fully_filled=False)

    order = execute_signal_order(
        db_session,
        market_id="TEST-MKT",
        side="yes",
        quantity=10,
        limit_price=0.01,
        strategy="TEST",
    )

    assert order.status == "rejected"


def test_execute_signal_order_rejects_live_mode(db_session, monkeypatch):
    import app.services.execution as execution_module
    monkeypatch.setattr(execution_module.settings, "trading_mode", "live")

    order = execute_signal_order(
        db_session,
        market_id="TEST-MKT",
        side="yes",
        quantity=10,
        limit_price=0.99,
        strategy="TEST",
    )

    assert order.status == "rejected"
