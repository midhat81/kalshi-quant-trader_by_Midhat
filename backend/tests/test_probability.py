from unittest.mock import patch

from app.models.market_snapshot import MarketSnapshot
from app.services.probability import estimate_probability, _mid_price


def make_snapshot(yes_bid, yes_ask, volume=0.0, market_id="TEST-MKT"):
    spread = round(yes_ask - yes_bid, 4) if yes_bid is not None and yes_ask is not None else None
    return MarketSnapshot(
        market_id=market_id,
        yes_bid=yes_bid,
        yes_ask=yes_ask,
        spread=spread,
        volume=volume,
    )


def test_mid_price_basic():
    assert _mid_price(0.2, 0.4) == 0.3


def test_mid_price_missing_values():
    assert _mid_price(None, 0.4) is None
    assert _mid_price(0.2, None) is None


@patch("app.services.probability._orderbook_imbalance", return_value=0.0)
def test_estimate_probability_no_imbalance(_mock):
    snapshot = make_snapshot(yes_bid=0.30, yes_ask=0.34, volume=5000)
    estimate = estimate_probability(snapshot)

    assert estimate is not None
    assert estimate.market_probability == 0.32
    assert estimate.model_probability == 0.32
    assert estimate.edge == 0.0


@patch("app.services.probability._orderbook_imbalance", return_value=0.5)
def test_estimate_probability_positive_imbalance(_mock):
    snapshot = make_snapshot(yes_bid=0.30, yes_ask=0.34, volume=5000)
    estimate = estimate_probability(snapshot)

    assert estimate.model_probability > estimate.market_probability
    assert estimate.edge > 0


@patch("app.services.probability._orderbook_imbalance", return_value=-0.5)
def test_estimate_probability_negative_imbalance(_mock):
    snapshot = make_snapshot(yes_bid=0.30, yes_ask=0.34, volume=5000)
    estimate = estimate_probability(snapshot)

    assert estimate.model_probability < estimate.market_probability
    assert estimate.edge < 0


def test_estimate_probability_missing_bid_ask():
    snapshot = make_snapshot(yes_bid=None, yes_ask=None)
    assert estimate_probability(snapshot) is None


@patch("app.services.probability._orderbook_imbalance", return_value=0.0)
def test_confidence_increases_with_volume(_mock):
    low = estimate_probability(make_snapshot(0.30, 0.32, volume=100))
    high = estimate_probability(make_snapshot(0.30, 0.32, volume=9000))
    assert high.confidence > low.confidence


@patch("app.services.probability._orderbook_imbalance", return_value=0.0)
def test_confidence_decreases_with_wide_spread(_mock):
    tight = estimate_probability(make_snapshot(0.40, 0.42, volume=1000))
    wide = estimate_probability(make_snapshot(0.10, 0.90, volume=1000))
    assert tight.confidence > wide.confidence