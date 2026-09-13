from sqlalchemy import Column, String, Float, Integer, DateTime
from sqlalchemy.sql import func

from app.core.database import Base


class Position(Base):
    __tablename__ = "positions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    market_id = Column(String, index=True, nullable=False, unique=True)

    side = Column(String, nullable=False)               # "yes" or "no" -- net direction held
    quantity = Column(Integer, nullable=False, default=0)
    average_entry_price = Column(Float, nullable=False, default=0.0)

    realized_pnl = Column(Float, nullable=False, default=0.0)
    fees_paid = Column(Float, nullable=False, default=0.0)

    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())