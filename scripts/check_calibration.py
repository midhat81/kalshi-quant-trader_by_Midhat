import sys
from pathlib import Path
from datetime import datetime, timezone

sys.path.append(str(Path(__file__).resolve().parents[1] / "backend"))

from app.core.database import SessionLocal
from app.services.calibration import check_and_record_resolutions


def main():
    db = SessionLocal()
    try:
        new_records = check_and_record_resolutions(db)
        now = datetime.now(timezone.utc).isoformat()
        print(f"[{now}] Checked resolutions, {new_records} new calibration records.")
    finally:
        db.close()


if __name__ == "__main__":
    main()