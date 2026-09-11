from sqlalchemy import Column, Integer, String, Float, DateTime, JSON
from sqlalchemy.sql import func

from app.core.database import Base


class MarketSnapshot(Base):
    __tablename__ = "market_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    market_id = Column(String, index=True, nullable=False)   # Kalshi ticker
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    yes_bid = Column(Float, nullable=True)
    yes_ask = Column(Float, nullable=True)
    no_bid = Column(Float, nullable=True)
    no_ask = Column(Float, nullable=True)
    spread = Column(Float, nullable=True)

    volume = Column(Float, nullable=True)
    open_interest = Column(Float, nullable=True)
    status = Column(String, nullable=True)

    raw_data = Column(JSON, nullable=True)