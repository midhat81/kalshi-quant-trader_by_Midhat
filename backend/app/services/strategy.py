from dataclasses import dataclass
from typing import Optional

from app.services.probability import ProbabilityEstimate

STRATEGY_NAME = "PROBABILITY_EDGE_STRATEGY"
EDGE_THRESHOLD = 0.03  # minimum edge required to generate a signal (3%)
MIN_CONFIDENCE = 0.5   # don't trade on low-confidence estimates


@dataclass
class TradeSignal:
    market_id: str
    side: str              # "yes" or "no"
    market_probability: float
    model_probability: float
    edge: float
    confidence: float
    strategy_name: str
    reason: str


def generate_signal(estimate: ProbabilityEstimate) -> Optional[TradeSignal]:
    """
    PROBABILITY EDGE STRATEGY

    BUY YES when model_probability - market_probability > EDGE_THRESHOLD
    BUY NO  when market_probability - model_probability > EDGE_THRESHOLD

    No signal is generated if edge is below threshold or confidence is too low.
    Does NOT execute anything — signal generation only.
    """
    if estimate is None:
        return None

    if estimate.confidence < MIN_CONFIDENCE:
        return None

    if estimate.edge > EDGE_THRESHOLD:
        side = "yes"
    elif estimate.edge < -EDGE_THRESHOLD:
        side = "no"
    else:
        return None  # edge too small, no actionable signal

    reason = (
        f"edge={estimate.edge:+.4f} exceeds threshold={EDGE_THRESHOLD}, "
        f"confidence={estimate.confidence} >= {MIN_CONFIDENCE}. "
        f"market={estimate.market_probability}, model={estimate.model_probability}."
    )

    return TradeSignal(
        market_id=estimate.market_id,
        side=side,
        market_probability=estimate.market_probability,
        model_probability=estimate.model_probability,
        edge=estimate.edge,
        confidence=estimate.confidence,
        strategy_name=STRATEGY_NAME,
        reason=reason,
    )