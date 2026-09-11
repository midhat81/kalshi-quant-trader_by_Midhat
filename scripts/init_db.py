import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1] / "backend"))

from app.core.database import Base, engine
from app.models.market_snapshot import MarketSnapshot  # noqa: F401
from app.models.signal import Signal  # noqa: F401


def init_db():
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully.")


if __name__ == "__main__":
    init_db()