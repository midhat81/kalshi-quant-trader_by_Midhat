import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1] / "backend"))

from app.core.database import SessionLocal
from app.services.backtest import run_backtest


def main():
    db = SessionLocal()
    try:
        result = run_backtest(db, series_prefix="KXHIGHNY")

        print(f"Sample size: {result.sample_size} snapshots")
        print(f"Date range: {result.date_range_start} to {result.date_range_end}")
        print(f"Markets covered: {len(result.market_series_covered)}")
        if result.data_warning:
            print(f"\n⚠️  {result.data_warning}\n")

        print(f"Signals generated: {result.total_signals_generated}")
        print(f"Signals approved:  {result.total_signals_approved}")
        print(f"Signals rejected:  {result.total_signals_rejected}")
        print(f"\nTrades taken: {len(result.trades)}")
        for t in result.trades:
            print(f"  {t.timestamp} | {t.market_id} | {t.side.upper()} @ {t.entry_price} | edge={t.edge:+.4f}")
    finally:
        db.close()


if __name__ == "__main__":
    main()