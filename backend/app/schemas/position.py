from pydantic import BaseModel
from typing import Optional


class PositionOut(BaseModel):
    market_id: str
    side: str
    quantity: int
    average_entry_price: float
    current_price: Optional[float]
    market_value: Optional[float]
    unrealized_pnl: Optional[float]
    realized_pnl: float
    fees_paid: float
    market_status: Optional[str]


class PortfolioSummaryOut(BaseModel):
    total_realized_pnl: float
    total_unrealized_pnl: Optional[float]
    total_pnl: Optional[float]
    total_fees: float
    total_exposure: float
    open_position_count: int
    positions_missing_price_count: int