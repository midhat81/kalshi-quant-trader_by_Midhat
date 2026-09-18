import sys
from pathlib import Path
from datetime import datetime, timezone

sys.path.append(str(Path(__file__).resolve().parents[1] / "backend"))

from app.core.database import SessionLocal
from app.services.snapshot_collector import collect_snapshots


def main():
    db = SessionLocal()
    try:
        results = collect_snapshots(db)
        now = datetime.now(timezone.utc).isoformat()
        total = sum(results.values())
        print(f"[{now}] Collected {total} snapshots: {results}")
    finally:
        db.close()


if __name__ == "__main__":
    main()