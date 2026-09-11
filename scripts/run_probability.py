import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1] / "backend"))

from app.core.database import SessionLocal
from app.models.market_snapshot import MarketSnapshot
from app.services.probability import estimate_probability


def main():
    db = SessionLocal()
    try:
        snapshots = db.query(MarketSnapshot).order_by(MarketSnapshot.volume.desc()).limit(10).all()
        print(f"Fetched {len(snapshots)} snapshots from DB")

        for s in snapshots:

            try:
                est = estimate_probability(s)
            except Exception as e:
                print(f"ERROR estimating {s.market_id}: {e}")
                continue

            if est is None:
                print(f"{s.market_id}: estimate_probability returned None (missing bid/ask)")
                continue

            print(
                f"{est.market_id:25} | market={est.market_probability:.3f} "
                f"model={est.model_probability:.3f} edge={est.edge:+.3f} "
                f"conf={est.confidence:.2f} | {est.reason}"
            )
    finally:
        db.close()


if __name__ == "__main__":
    main()