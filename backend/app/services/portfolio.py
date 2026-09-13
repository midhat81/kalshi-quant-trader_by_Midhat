from dataclasses import dataclass
from typing import Optional

from sqlalchemy.orm import Session

from app.adapters.kalshi import kalshi_client
from app.models.fill import Fill
from app.models.position import Position


@dataclass
class PositionView:
    market_id: str
    side: str
    quantity: int
    average_entry_price: float
    current_price: Optional[float]
    market_value: Optional[float]
    unrealized_pnl: Optional[float]
    realized_pnl: float
    fees_paid: float
    market_status: Optional[str]


def rebuild_positions_from_fills(db: Session) -> int:
    """
    Placeholder -- superseded by get_open_positions(), which computes
    positions live from the Fill + Order join. Kept for interface
    compatibility; not used in the MVP flow.
    """
    return 0


def get_open_positions(db: Session) -> list[PositionView]:
    """
    Computes current open positions directly from Fill + Order join,
    fetching live current price from Kalshi for unrealized PnL.

    If a market has closed/settled since the fill occurred, current_price
    and unrealized_pnl are reported as None rather than a misleading 0.0 --
    a closed market with no live quote is not the same as a $0 valuation.
    """
    from app.models.order import Order

    rows = (
        db.query(Fill, Order)
        .join(Order, Fill.order_id == Order.id)
        .order_by(Fill.timestamp.asc())
        .all()
    )

    book: dict[str, dict] = {}

    for fill, order in rows:
        key = f"{fill.market_id}:{order.side}"
        entry = book.setdefault(
            key,
            {"market_id": fill.market_id, "side": order.side, "quantity": 0, "cost_basis": 0.0, "fees": 0.0},
        )
        entry["quantity"] += fill.quantity
        entry["cost_basis"] += fill.quantity * fill.price
        entry["fees"] += fill.fee

    positions: list[PositionView] = []

    for entry in book.values():
        if entry["quantity"] <= 0:
            continue

        avg_price = round(entry["cost_basis"] / entry["quantity"], 4)

        current_price = None
        market_value = None
        unrealized_pnl = None
        market_status = None

        try:
            market = kalshi_client.get_market(entry["market_id"])
            m = market.get("market", market)
            market_status = m.get("status")

            price_field = "yes_bid_dollars" if entry["side"] == "yes" else "no_bid_dollars"
            price_str = m.get(price_field)

            # Only trust the quote if the market is actually active/open --
            # closed/settled markets report a placeholder 0/1, not a real price.
            if market_status == "active" and price_str is not None:
                price_val = float(price_str)
                if price_val > 0:  # a genuine 0.0 bid on an active market is still "no bid" -- skip it
                    current_price = price_val
                    market_value = round(current_price * entry["quantity"], 4)
                    unrealized_pnl = round((current_price - avg_price) * entry["quantity"], 4)
        except Exception as e:
            print(f"WARNING: could not fetch live price for {entry['market_id']}: {e}")

        positions.append(
            PositionView(
                market_id=entry["market_id"],
                side=entry["side"],
                quantity=entry["quantity"],
                average_entry_price=avg_price,
                current_price=current_price,
                market_value=market_value,
                unrealized_pnl=unrealized_pnl,
                realized_pnl=0.0,
                fees_paid=round(entry["fees"], 4),
                market_status=market_status,
            )
        )

    return positions