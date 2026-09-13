import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1] / "backend"))

from app.core.database import SessionLocal
from app.services.portfolio import get_open_positions


def main():
    db = SessionLocal()
    try:
        positions = get_open_positions(db)
        for p in positions:
            pnl_display = p.unrealized_pnl if p.unrealized_pnl is not None else "N/A (market closed)"
            print(
                f"{p.market_id:25} | side={p.side} qty={p.quantity} "
                f"avg_entry={p.average_entry_price} current={p.current_price} "
                f"unrealized_pnl={pnl_display} fees={p.fees_paid} status={p.market_status}"
            )
    finally:
        db.close()


if __name__ == "__main__":
    main()