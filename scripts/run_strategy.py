import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1] / "backend"))

from app.core.database import SessionLocal
from app.models.market_snapshot import MarketSnapshot
from app.models.signal import Signal
from app.models.risk_decision import RiskDecision
from app.services.probability import estimate_probability
from app.services.strategy import generate_signal
from app.services.risk import check_signal


def main():
    db = SessionLocal()
    try:
        snapshots = db.query(MarketSnapshot).order_by(MarketSnapshot.volume.desc()).limit(10).all()
        print(f"Evaluating {len(snapshots)} snapshots...")

        signals_created = 0
        for s in snapshots:
            estimate = estimate_probability(s)
            if estimate is None:
                continue

            signal = generate_signal(estimate)
            if signal is None:
                print(f"{s.market_id:25} | no signal (edge={estimate.edge:+.4f}, conf={estimate.confidence})")
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
            db.flush()  # get db_signal.id before commit
            signals_created += 1

            risk_result = check_signal(signal)

            db_risk = RiskDecision(
                signal_id=db_signal.id,
                market_id=signal.market_id,
                approved=risk_result.approved,
                reason=risk_result.reason,
                proposed_side=risk_result.proposed_side,
                proposed_size=risk_result.proposed_size,
            )
            db.add(db_risk)

            status = "APPROVED" if risk_result.approved else "REJECTED"
            print(
                f"{signal.market_id:25} | SIGNAL: BUY {signal.side.upper()} "
                f"| edge={signal.edge:+.4f} conf={signal.confidence} "
                f"| RISK: {status} ({risk_result.reason})"
            )

        db.commit()
        print(f"\nStored {signals_created} signals with risk decisions.")
    finally:
        db.close()


if __name__ == "__main__":
    main()