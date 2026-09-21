from unittest.mock import patch

from app.models.fill import Fill
from app.models.order import Order
from app.services.pnl import compute_portfolio_summary


def make_order_and_fill(db_session, market_id="TEST-MKT", side="yes", price=0.50, quantity=10, fee=0.1):
    order = Order(market_id=market_id, side=side, price=price, quantity=quantity, status="filled")
    db_session.add(order)
    db_session.flush()

    fill = Fill(order_id=order.id, market_id=market_id, price=price, quantity=quantity, fee=fee)
    db_session.add(fill)
    db_session.commit()
    return order, fill


def test_compute_portfolio_summary_no_positions(db_session):
    summary = compute_portfolio_summary(db_session)

    assert summary.open_position_count == 0
    assert summary.total_unrealized_pnl == 0.0
    assert summary.total_pnl == 0.0


@patch("app.services.portfolio.kalshi_client")
def test_compute_portfolio_summary_with_priced_position(mock_kalshi, db_session):
    mock_kalshi.get_market.return_value = {
        "market": {"status": "active", "yes_bid_dollars": "0.60"}
    }

    make_order_and_fill(db_session, price=0.50, quantity=10, fee=0.1)

    summary = compute_portfolio_summary(db_session)

    assert summary.open_position_count == 1
    assert summary.total_unrealized_pnl == 1.0
    assert summary.total_fees == 0.1
    assert summary.positions_missing_price_count == 0


@patch("app.services.portfolio.kalshi_client")
def test_compute_portfolio_summary_excludes_unpriceable_from_unrealized_total(mock_kalshi, db_session):
    def market_side_effect(ticker):
        if ticker == "PRICED-MKT":
            return {"market": {"status": "active", "yes_bid_dollars": "0.60"}}
        return {"market": {"status": "closed", "yes_bid_dollars": "0.0000"}}

    mock_kalshi.get_market.side_effect = market_side_effect

    make_order_and_fill(db_session, market_id="PRICED-MKT", price=0.50, quantity=10)
    make_order_and_fill(db_session, market_id="CLOSED-MKT", price=0.30, quantity=10)

    summary = compute_portfolio_summary(db_session)

    assert summary.open_position_count == 2
    assert summary.positions_missing_price_count == 1
    assert summary.total_unrealized_pnl == 1.0
