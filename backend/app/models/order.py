import uuid

from sqlalchemy import Column, String, Float, Integer, DateTime
from sqlalchemy.sql import func

from app.core.database import Base


class Order(Base):
    __tablename__ = "orders"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    client_order_id = Column(String, index=True, nullable=False, default=lambda: str(uuid.uuid4()))
    exchange_order_id = Column(String, nullable=True)  # None for paper orders

    signal_id = Column(String, index=True, nullable=True)
    market_id = Column(String, index=True, nullable=False)

    side = Column(String, nullable=False)       # "yes" or "no"
    price = Column(Float, nullable=False)         # price per contract at submission
    quantity = Column(Integer, nullable=False)
    status = Column(String, nullable=False, default="created")  # created/submitted/acknowledged/partial/filled/rejected
    order_type = Column(String, nullable=False, default="limit")
    strategy = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    filled_at = Column(DateTime(timezone=True), nullable=True)