from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class MarketSnapshotOut(BaseModel):
    market_id: str
    timestamp: datetime
    yes_bid: Optional[float]
    yes_ask: Optional[float]
    no_bid: Optional[float]
    no_ask: Optional[float]
    spread: Optional[float]
    volume: Optional[float]
    status: Optional[str]

    class Config:
        from_attributes = True