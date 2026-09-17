from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.position import PositionOut, PortfolioSummaryOut, PnlHistoryPointOut
from app.services.portfolio import get_open_positions
from app.services.pnl import compute_portfolio_summary, compute_pnl_history

router = APIRouter(prefix="/api", tags=["positions"])


@router.get("/positions", response_model=list[PositionOut])
def list_positions(db: Session = Depends(get_db)):
    positions = get_open_positions(db)
    return [
        PositionOut(
            market_id=p.market_id,
            side=p.side,
            quantity=p.quantity,
            average_entry_price=p.average_entry_price,
            current_price=p.current_price,
            market_value=p.market_value,
            unrealized_pnl=p.unrealized_pnl,
            realized_pnl=p.realized_pnl,
            fees_paid=p.fees_paid,
            market_status=p.market_status,
        )
        for p in positions
    ]


@router.get("/pnl", response_model=PortfolioSummaryOut)
def get_pnl(db: Session = Depends(get_db)):
    summary = compute_portfolio_summary(db)
    return PortfolioSummaryOut(**summary.__dict__)


@router.get("/pnl/history", response_model=list[PnlHistoryPointOut])
def get_pnl_history(db: Session = Depends(get_db)):
    return compute_pnl_history(db)