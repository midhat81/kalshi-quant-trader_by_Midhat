from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class BacktestTradeOut(BaseModel):
    market_id: str
    timestamp: datetime
    side: str
    entry_price: float
    quantity: int
    edge: float
    confidence: float


class BacktestResultOut(BaseModel):
    sample_size: int
    date_range_start: Optional[datetime]
    date_range_end: Optional[datetime]
    market_series_covered: list[str]
    total_signals_generated: int
    total_signals_approved: int
    total_signals_rejected: int
    trades: list[BacktestTradeOut]
    data_warning: Optional[str]