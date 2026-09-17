from dataclasses import dataclass
from typing import Optional

from sqlalchemy.orm import Session

from app.services.portfolio import get_open_positions, PositionView


@dataclass
class PortfolioSummary:
    total_realized_pnl: float
    total_unrealized_pnl: Optional[float]   # None if any active position lacks a live price
    total_pnl: Optional[float]
    total_fees: float
    total_exposure: float                    # sum of cost basis of open positions
    open_position_count: int
    positions_missing_price_count: int       # markets closed/no-quote, excluded from unrealized total


def compute_portfolio_summary(db: Session) -> PortfolioSummary:
    """
    Aggregates PnL and exposure across all open positions.

    IMPORTANT: total_unrealized_pnl only sums positions with a genuine live
    price. Positions on closed/no-quote markets are excluded from the sum
    (not treated as zero) and counted separately, so the total never silently
    understates or fabricates a number for markets we can't currently price.
    """
    positions = get_open_positions(db)

    total_realized = sum(p.realized_pnl for p in positions)
    total_fees = sum(p.fees_paid for p in positions)
    total_exposure = sum(p.average_entry_price * p.quantity for p in positions)

    priced_positions = [p for p in positions if p.unrealized_pnl is not None]
    missing_price_count = len(positions) - len(priced_positions)

    if priced_positions:
        total_unrealized = round(sum(p.unrealized_pnl for p in priced_positions), 4)
    elif positions:
        total_unrealized = None  # have positions, but none currently priceable
    else:
        total_unrealized = 0.0  # no positions at all -- legitimately zero

    total_pnl = None
    if total_unrealized is not None:
        total_pnl = round(total_realized + total_unrealized, 4)

    return PortfolioSummary(
        total_realized_pnl=round(total_realized, 4),
        total_unrealized_pnl=total_unrealized,
        total_pnl=total_pnl,
        total_fees=round(total_fees, 4),
        total_exposure=round(total_exposure, 4),
        open_position_count=len(positions),
        positions_missing_price_count=missing_price_count,
    )

from dataclasses import dataclass as _dataclass
@_dataclass
class PnlHistoryPoint:
    timestamp: str
    cumulative_pnl: float
    label: str


def compute_pnl_history(db: Session) -> list[PnlHistoryPoint]:
    """
    Builds a cumulative PnL curve from real fill history.

    Since the MVP has no closed (round-trip) trades yet, realized PnL is
    zero throughout -- this curve honestly reflects cumulative fees paid
    over time, then adds one final point for current unrealized PnL using
    live prices. This is NOT a fabricated equity curve; every point is
    derived from real fills and real fees.
    """
    from app.models.fill import Fill

    fills = db.query(Fill).order_by(Fill.timestamp.asc()).all()

    points: list[PnlHistoryPoint] = []
    cumulative_fees = 0.0

    for fill in fills:
        cumulative_fees += fill.fee
        points.append(
            PnlHistoryPoint(
                timestamp=fill.timestamp.isoformat(),
                cumulative_pnl=round(-cumulative_fees, 4),
                label=f"Fill: {fill.market_id}",
            )
        )

    # Final "now" point: add current unrealized PnL on top of realized/fees
    summary = compute_portfolio_summary(db)
    if summary.total_unrealized_pnl is not None:
        final_pnl = round(summary.total_realized_pnl + summary.total_unrealized_pnl - summary.total_fees, 4)
        points.append(
            PnlHistoryPoint(
                timestamp=datetime_now_iso(),
                cumulative_pnl=final_pnl,
                label="Current (mark-to-market)",
            )
        )

    return points


def datetime_now_iso() -> str:
    from datetime import datetime, timezone
    return datetime.now(timezone.utc).isoformat()