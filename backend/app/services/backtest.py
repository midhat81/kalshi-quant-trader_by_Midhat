from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from app.models.market_snapshot import MarketSnapshot
from app.services.probability import estimate_probability
from app.services.strategy import generate_signal
from app.services.risk import check_signal, DEFAULT_ORDER_SIZE


@dataclass
class BacktestTrade:
    market_id: str
    timestamp: datetime
    side: str
    entry_price: float
    quantity: int
    edge: float
    confidence: float


@dataclass
class BacktestResult:
    sample_size: int
    date_range_start: Optional[datetime]
    date_range_end: Optional[datetime]
    market_series_covered: list[str]
    total_signals_generated: int
    total_signals_approved: int
    total_signals_rejected: int
    trades: list[BacktestTrade] = field(default_factory=list)
    data_warning: Optional[str] = None


def run_backtest(db: Session, series_prefix: Optional[str] = None) -> BacktestResult:
    """
    Walks through REAL stored market_snapshots in chronological order and
    runs each one through the actual live probability/strategy/risk
    pipeline -- the same functions used by the real system, not a
    reimplementation. This avoids lookahead bias: each snapshot is only
    ever evaluated using the data available at that single point in time.

    This is explicitly a backtest over whatever real data has been
    collected so far, not a claim of statistical robustness. Sample size
    and date range are always reported so results are never presented as
    more meaningful than the underlying data supports.
    """
    query = db.query(MarketSnapshot).order_by(MarketSnapshot.timestamp.asc())
    if series_prefix:
        query = query.filter(MarketSnapshot.market_id.like(f"{series_prefix}%"))

    snapshots = query.all()

    sample_size = len(snapshots)
    date_start = snapshots[0].timestamp if snapshots else None
    date_end = snapshots[-1].timestamp if snapshots else None
    markets_covered = sorted(set(s.market_id for s in snapshots))

    data_warning = None
    if sample_size < 30:
        data_warning = (
            f"Only {sample_size} snapshots available -- results are illustrative of the "
            f"pipeline's mechanics, not statistically meaningful. Real backtesting requires "
            f"substantially more historical data collected over time."
        )

    signals_generated = 0
    signals_approved = 0
    signals_rejected = 0
    trades: list[BacktestTrade] = []

    # Track open positions per market to avoid pyramiding into the same
    # signal repeatedly on nearly-identical consecutive snapshots.
    open_markets: set[str] = set()

    for snapshot in snapshots:
        estimate = estimate_probability(snapshot, use_orderbook=False)
        # use_orderbook=False: historical snapshots don't carry a live
        # orderbook to replay, so the imbalance signal is unavailable
        # for backtesting -- this is an honest limitation, not hidden.
        if estimate is None:
            continue

        signal = generate_signal(estimate)
        if signal is None:
            continue

        signals_generated += 1

        if snapshot.market_id in open_markets:
            continue  # don't re-enter a market we already have an open position in

        risk_result = check_signal(signal)

        if not risk_result.approved:
            signals_rejected += 1
            continue

        signals_approved += 1
        open_markets.add(snapshot.market_id)

        entry_price = signal.market_probability if signal.side == "yes" else (1 - signal.market_probability)

        trades.append(
            BacktestTrade(
                market_id=snapshot.market_id,
                timestamp=snapshot.timestamp,
                side=signal.side,
                entry_price=round(entry_price, 4),
                quantity=DEFAULT_ORDER_SIZE,
                edge=signal.edge,
                confidence=signal.confidence,
            )
        )

    return BacktestResult(
        sample_size=sample_size,
        date_range_start=date_start,
        date_range_end=date_end,
        market_series_covered=markets_covered,
        total_signals_generated=signals_generated,
        total_signals_approved=signals_approved,
        total_signals_rejected=signals_rejected,
        trades=trades,
        data_warning=data_warning,
    )