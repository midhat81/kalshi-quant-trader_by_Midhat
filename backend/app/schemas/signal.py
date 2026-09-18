from pydantic import BaseModel
from datetime import datetime


class SignalOut(BaseModel):
    id: str
    market_id: str
    timestamp: datetime
    side: str
    market_probability: float
    model_probability: float
    edge: float
    confidence: float
    strategy_name: str
    reason: str | None

    class Config:
        from_attributes = True
        protected_namespaces = ()