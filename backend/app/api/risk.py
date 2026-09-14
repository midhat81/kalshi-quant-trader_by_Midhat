from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db
from app.models.risk_decision import RiskDecision
from app.schemas.risk import RiskDecisionOut
from app.services import risk as risk_service

router = APIRouter(prefix="/api/risk", tags=["risk"])


@router.get("/decisions", response_model=list[RiskDecisionOut])
def list_risk_decisions(limit: int = Query(20, le=200), db: Session = Depends(get_db)):
    return db.query(RiskDecision).order_by(desc(RiskDecision.timestamp)).limit(limit).all()


@router.get("/limits")
def get_risk_limits():
    return {
        "max_position_size": risk_service.MAX_POSITION_SIZE,
        "max_market_exposure_usd": risk_service.MAX_MARKET_EXPOSURE_USD,
        "max_portfolio_exposure_usd": risk_service.MAX_PORTFOLIO_EXPOSURE_USD,
        "max_daily_loss_usd": risk_service.MAX_DAILY_LOSS_USD,
        "max_open_positions": risk_service.MAX_OPEN_POSITIONS,
        "default_order_size": risk_service.DEFAULT_ORDER_SIZE,
    }