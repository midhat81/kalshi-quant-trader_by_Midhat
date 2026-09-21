from unittest.mock import patch

from app.models.fill import Fill
from app.models.order import Order
from app.services.portfolio import get_open_positions


def make_order_and_fill(db_session, market_id="TEST-MKT", side="yes", price=0.50, quantity=10):
    order = Order(market_id=market_id, side=side, price=price, quantity=quantity, status="filled")
    db_session.add(order)
    db_session.flush()

    fill = Fill(order_id=order.id, market_id=market_id, price=price, quantity=quantity, fee=0.1)
    db_session.add(fill)
    db_session.commit()
    return order, fill


@patch("app.services.portfolio.kalshi_client")
def test_get_open_positions_computes_avg_entry(mock_kalshi, db_session):
    mock_kalshi.get_market.return_value = {
        "market": {"status": "active", "yes_bid_dollars": "0.55"}
    }

    make_order_and_fill(db_session, price=0.40, quantity=10)
    make_order_and_fill(db_session, price=0.60, quantity=10)

    positions = get_open_positions(db_session)

    assert len(positions) == 1
    p = positions[0]
    assert p.quantity == 20
    assert p.average_entry_price == 0.50  # (0.40*10 + 0.60*10) / 20


@patch("app.services.portfolio.kalshi_client")
def test_get_open_positions_handles_closed_market(mock_kalshi, db_session):
    mock_kalshi.get_market.return_value = {
        "market": {"status": "closed", "yes_bid_dollars": "0.0000"}
    }

    make_order_and_fill(db_session)

    positions = get_open_positions(db_session)

    assert len(positions) == 1
    assert positions[0].current_price is None
    assert positions[0].unrealized_pnl is None
    assert positions[0].market_status == "closed"


@patch("app.services.portfolio.kalshi_client")
def test_get_open_positions_computes_unrealized_pnl(mock_kalshi, db_session):
    mock_kalshi.get_market.return_value = {
        "market": {"status": "active", "yes_bid_dollars": "0.70"}
    }

    make_order_and_fill(db_session, price=0.50, quantity=10)

    positions = get_open_positions(db_session)

    assert positions[0].current_price == 0.70
    assert positions[0].unrealized_pnl == 2.0  # (0.70 - 0.50) * 10


def test_get_open_positions_empty_when_no_fills(db_session):
    positions = get_open_positions(db_session)
    assert positions == []
