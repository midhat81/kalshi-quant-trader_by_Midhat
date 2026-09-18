from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.schemas.backtest import BacktestResultOut
from app.services.backtest import run_backtest

router = APIRouter(prefix="/api/backtest", tags=["backtest"])


@router.get("", response_model=BacktestResultOut)
def get_backtest(series_prefix: Optional[str] = Query(default="KXHIGHNY"), db: Session = Depends(get_db)):
    result = run_backtest(db, series_prefix=series_prefix)
    return BacktestResultOut(
        sample_size=result.sample_size,
        date_range_start=result.date_range_start,
        date_range_end=result.date_range_end,
        market_series_covered=result.market_series_covered,
        total_signals_generated=result.total_signals_generated,
        total_signals_approved=result.total_signals_approved,
        total_signals_rejected=result.total_signals_rejected,
        trades=result.trades,
        data_warning=result.data_warning,
    )