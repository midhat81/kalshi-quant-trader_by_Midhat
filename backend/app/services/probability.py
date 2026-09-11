from dataclasses import dataclass
from typing import Optional

from app.adapters.kalshi import kalshi_client
from app.models.market_snapshot import MarketSnapshot


@dataclass
class ProbabilityEstimate:
    market_id: str
    market_probability: float      # implied by current mid-price
    model_probability: float       # our transparent estimate
    edge: float                    # model - market
    confidence: float              # 0-1, based on data quality (spread, volume)
    reason: str


def _mid_price(yes_bid: Optional[float], yes_ask: Optional[float]) -> Optional[float]:
    if yes_bid is None or yes_ask is None:
        return None
    return round((yes_bid + yes_ask) / 2, 4)


def _orderbook_imbalance(ticker: str, depth_levels: int = 5) -> float:
    """
    Real order-book imbalance signal.
    Compares total size on the YES-bid ladder vs the NO-bid ladder,
    using the top N price levels closest to the market on each side.
    Returns a value in [-1, 1]: positive = more YES-side demand.
    """
    try:
        ob = kalshi_client.get_orderbook(ticker)
        book = ob.get("orderbook_fp", {})
        yes_levels = book.get("yes_dollars", []) or []
        no_levels = book.get("no_dollars", []) or []

        yes_top = sorted(yes_levels, key=lambda lvl: float(lvl[0]), reverse=True)[:depth_levels]
        no_top = sorted(no_levels, key=lambda lvl: float(lvl[0]), reverse=True)[:depth_levels]

        yes_depth = sum(float(size) for _, size in yes_top)
        no_depth = sum(float(size) for _, size in no_top)

        total = yes_depth + no_depth
        if total == 0:
            return 0.0

        return round((yes_depth - no_depth) / total, 4)
    except Exception:
        return 0.0


def estimate_probability(snapshot: MarketSnapshot, use_orderbook: bool = True) -> Optional[ProbabilityEstimate]:
    """
    Transparent, explainable probability model for MVP purposes.

    market_probability = mid-price of yes_bid/yes_ask (the market's own implied probability)

    model_probability = market_probability adjusted by real order-book imbalance.

    This is intentionally simple and auditable. It is NOT a trained ML model.
    A trained model can replace this function later without changing its interface.
    """
    yes_bid = snapshot.yes_bid
    yes_ask = snapshot.yes_ask
    spread = snapshot.spread
    volume = snapshot.volume or 0.0

    market_probability = _mid_price(yes_bid, yes_ask)
    if market_probability is None:
        return None

    spread_penalty = min((spread or 0.0) * 2, 0.3)
    volume_boost = min(volume / 10000, 0.3)
    confidence = max(0.1, min(1.0, 0.5 - spread_penalty + volume_boost))

    imbalance = _orderbook_imbalance(snapshot.market_id) if use_orderbook else 0.0

    max_adjustment = 0.05
    adjustment = round(imbalance * max_adjustment, 4)

    model_probability = market_probability + adjustment
    model_probability = max(0.01, min(0.99, round(model_probability, 4)))

    edge = round(model_probability - market_probability, 4)

    reason = (
        f"mid={market_probability}, spread={spread}, volume={volume}, "
        f"confidence={round(confidence, 2)}, imbalance={imbalance}, adjustment={adjustment}"
    )

    return ProbabilityEstimate(
        market_id=snapshot.market_id,
        market_probability=market_probability,
        model_probability=model_probability,
        edge=edge,
        confidence=round(confidence, 2),
        reason=reason,
    )