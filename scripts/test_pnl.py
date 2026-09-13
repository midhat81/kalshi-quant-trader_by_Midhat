import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1] / "backend"))

from app.core.database import SessionLocal
from app.services.pnl import compute_portfolio_summary


def main():
    db = SessionLocal()
    try:
        summary = compute_portfolio_summary(db)
        print(f"Open positions:        {summary.open_position_count}")
        print(f"  (unpriced/closed):   {summary.positions_missing_price_count}")
        print(f"Total realized PnL:    ${summary.total_realized_pnl}")
        print(f"Total unrealized PnL:  {summary.total_unrealized_pnl}")
        print(f"Total PnL:             {summary.total_pnl}")
        print(f"Total fees paid:       ${summary.total_fees}")
        print(f"Total exposure:        ${summary.total_exposure}")
    finally:
        db.close()


if __name__ == "__main__":
    main()