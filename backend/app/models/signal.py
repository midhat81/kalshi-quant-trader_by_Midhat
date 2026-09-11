import uuid

from sqlalchemy import Column, String, Float, DateTime
from sqlalchemy.sql import func

from app.core.database import Base


class Signal(Base):
    __tablename__ = "signals"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    market_id = Column(String, index=True, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    side = Column(String, nullable=False)              # "yes" or "no"
    market_probability = Column(Float, nullable=False)
    model_probability = Column(Float, nullable=False)
    edge = Column(Float, nullable=False)
    confidence = Column(Float, nullable=False)

    strategy_name = Column(String, nullable=False)
    reason = Column(String, nullable=True)