from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db
from app.models.market_snapshot import MarketSnapshot
from app.schemas.market import MarketSnapshotOut

router = APIRouter(prefix="/api/markets", tags=["markets"])


@router.get("", response_model=list[MarketSnapshotOut])
def list_markets(limit: int = Query(20, le=200), db: Session = Depends(get_db)):
    return (
        db.query(MarketSnapshot)
        .order_by(desc(MarketSnapshot.timestamp))
        .limit(limit)
        .all()
    )


@router.get("/{market_id}", response_model=MarketSnapshotOut)
def get_market(market_id: str, db: Session = Depends(get_db)):
    snapshot = (
        db.query(MarketSnapshot)
        .filter(MarketSnapshot.market_id == market_id)
        .order_by(desc(MarketSnapshot.timestamp))
        .first()
    )
    return snapshot