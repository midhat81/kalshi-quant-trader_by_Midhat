from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class OrderOut(BaseModel):
    id: str
    market_id: str
    side: str
    price: float
    quantity: int
    status: str
    strategy: Optional[str]
    created_at: datetime
    filled_at: Optional[datetime]

    class Config:
        from_attributes = True


class OrderCreateRequest(BaseModel):
    market_id: str
    side: str          # "yes" or "no"
    quantity: int
    limit_price: float
    signal_id: Optional[str] = None