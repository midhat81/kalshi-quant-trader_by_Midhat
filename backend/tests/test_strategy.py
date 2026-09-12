from app.services.probability import ProbabilityEstimate
from app.services.strategy import generate_signal, EDGE_THRESHOLD, MIN_CONFIDENCE


def make_estimate(market_probability, model_probability, confidence=0.8, market_id="TEST-MKT"):
    edge = round(model_probability - market_probability, 4)
    return ProbabilityEstimate(
        market_id=market_id,
        market_probability=market_probability,
        model_probability=model_probability,
        edge=edge,
        confidence=confidence,
        reason="test",
    )


def test_generate_signal_buy_yes_on_positive_edge():
    estimate = make_estimate(0.50, 0.50 + EDGE_THRESHOLD + 0.01)
    signal = generate_signal(estimate)

    assert signal is not None
    assert signal.side == "yes"
    assert signal.edge > EDGE_THRESHOLD


def test_generate_signal_buy_no_on_negative_edge():
    estimate = make_estimate(0.50, 0.50 - EDGE_THRESHOLD - 0.01)
    signal = generate_signal(estimate)

    assert signal is not None
    assert signal.side == "no"
    assert signal.edge < -EDGE_THRESHOLD


def test_generate_signal_none_when_edge_too_small():
    estimate = make_estimate(0.50, 0.50 + EDGE_THRESHOLD / 2)
    assert generate_signal(estimate) is None


def test_generate_signal_none_when_confidence_too_low():
    estimate = make_estimate(0.50, 0.50 + EDGE_THRESHOLD + 0.05, confidence=MIN_CONFIDENCE - 0.1)
    assert generate_signal(estimate) is None


def test_generate_signal_none_when_estimate_is_none():
    assert generate_signal(None) is None


def test_generate_signal_edge_exactly_at_threshold_not_signaled():
    estimate = make_estimate(0.50, 0.50 + EDGE_THRESHOLD)
    assert generate_signal(estimate) is None