import uuid

from sqlalchemy import Column, String, Float, Integer, DateTime
from sqlalchemy.sql import func

from app.core.database import Base


class Fill(Base):
    __tablename__ = "fills"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(String, index=True, nullable=False)
    exchange_fill_id = Column(String, nullable=True)  # None for paper fills

    market_id = Column(String, index=True, nullable=False)
    price = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=False)
    fee = Column(Float, nullable=False, default=0.0)

    timestamp = Column(DateTime(timezone=True), server_default=func.now())