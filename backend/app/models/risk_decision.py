import uuid

from sqlalchemy import Column, String, Float, DateTime, Boolean
from sqlalchemy.sql import func

from app.core.database import Base


class RiskDecision(Base):
    __tablename__ = "risk_decisions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    signal_id = Column(String, index=True, nullable=True)
    market_id = Column(String, index=True, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    approved = Column(Boolean, nullable=False)
    reason = Column(String, nullable=True)

    proposed_side = Column(String, nullable=False)
    proposed_size = Column(Float, nullable=False)