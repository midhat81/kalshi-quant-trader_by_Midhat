import sys
from pathlib import Path
from datetime import datetime, timezone

sys.path.append(str(Path(__file__).resolve().parents[1] / "backend"))

from app.core.database import SessionLocal
from app.models.market_snapshot import MarketSnapshot
from app.models.signal import Signal
from app.models.risk_decision import RiskDecision
from app.services.probability import estimate_probability
from app.services.strategy import generate_signal
from app.services.risk import check_signal
from app.services.audit import log_event, SIGNAL_CREATED, RISK_CHECKED


def main():
    db = SessionLocal()
    try:
        # Only evaluate the most recent snapshot per market, not the whole history
        subquery = (
            db.query(
                MarketSnapshot.market_id,
                MarketSnapshot.id,
            )
            .order_by(MarketSnapshot.market_id, MarketSnapshot.timestamp.desc())
        )
        recent_ids = {}
        for market_id, snap_id in subquery:
            if market_id not in recent_ids:
                recent_ids[market_id] = snap_id

        snapshots = db.query(MarketSnapshot).filter(MarketSnapshot.id.in_(recent_ids.values())).all()

        signals_created = 0
        for s in snapshots:
            estimate = estimate_probability(s)
            if estimate is None:
                continue

            signal = generate_signal(estimate)
            if signal is None:
                continue

            db_signal = Signal(
                market_id=signal.market_id,
                side=signal.side,
                market_probability=signal.market_probability,
                model_probability=signal.model_probability,
                edge=signal.edge,
                confidence=signal.confidence,
                strategy_name=signal.strategy_name,
                reason=signal.reason,
            )
            db.add(db_signal)
            db.flush()
            signals_created += 1

            log_event(db, event_type=SIGNAL_CREATED, market_id=signal.market_id, signal_id=db_signal.id,
                       payload={"side": signal.side, "edge": signal.edge, "confidence": signal.confidence})

            risk_result = check_signal(signal)
            db.add(RiskDecision(
                signal_id=db_signal.id, market_id=signal.market_id, approved=risk_result.approved,
                reason=risk_result.reason, proposed_side=risk_result.proposed_side, proposed_size=risk_result.proposed_size,
            ))
            log_event(db, event_type=RISK_CHECKED, market_id=signal.market_id, signal_id=db_signal.id,
                       payload={"approved": risk_result.approved, "reason": risk_result.reason})

        db.commit()
        now = datetime.now(timezone.utc).isoformat()
        print(f"[{now}] Evaluated {len(snapshots)} markets, created {signals_created} signals.")
    finally:
        db.close()


if __name__ == "__main__":
    main()