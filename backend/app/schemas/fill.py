from pydantic import BaseModel
from datetime import datetime


class FillOut(BaseModel):
    id: str
    order_id: str
    market_id: str
    price: float
    quantity: int
    fee: float
    timestamp: datetime

    class Config:
        from_attributes = True