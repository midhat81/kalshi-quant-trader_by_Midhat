import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1] / "backend"))

from app.core.database import SessionLocal
from app.services.market_data import fetch_and_store_snapshots


def main():
    db = SessionLocal()
    try:
        count = fetch_and_store_snapshots(db, limit=20, series_ticker="KXHIGHNY")
        print(f"Stored {count} market snapshots.")
    finally:
        db.close()


if __name__ == "__main__":
    main()