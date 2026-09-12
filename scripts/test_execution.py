import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1] / "backend"))

from app.core.database import SessionLocal
from app.services.execution import execute_signal_order


def main():
    db = SessionLocal()
    try:
        order = execute_signal_order(
            db,
            market_id="KXHIGHNY-26SEP12-B77.5",
            side="yes",
            quantity=10,
            limit_price=0.99,
            signal_id=None,
            strategy="MANUAL_TEST",
        )
        print(f"Order id={order.id} status={order.status} price={order.price} qty={order.quantity}")
    finally:
        db.close()


if __name__ == "__main__":
    main()