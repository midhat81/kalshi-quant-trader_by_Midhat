from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class RiskDecisionOut(BaseModel):
    id: str
    signal_id: Optional[str]
    market_id: str
    timestamp: datetime
    approved: bool
    reason: Optional[str]
    proposed_side: str
    proposed_size: float

    class Config:
        from_attributes = True