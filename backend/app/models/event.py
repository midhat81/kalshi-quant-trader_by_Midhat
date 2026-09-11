import uuid

from sqlalchemy import Column, String, DateTime, JSON
from sqlalchemy.sql import func

from app.core.database import Base


class Event(Base):
    __tablename__ = "events"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    event_type = Column(String, index=True, nullable=False)   # e.g. SIGNAL_CREATED, RISK_CHECKED
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    market_id = Column(String, index=True, nullable=True)
    signal_id = Column(String, index=True, nullable=True)
    order_id = Column(String, index=True, nullable=True)
    fill_id = Column(String, index=True, nullable=True)

    payload = Column(JSON, nullable=True)