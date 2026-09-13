from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db
from app.models.signal import Signal
from app.schemas.signal import SignalOut

router = APIRouter(prefix="/api/signals", tags=["signals"])


@router.get("", response_model=list[SignalOut])
def list_signals(limit: int = Query(20, le=200), db: Session = Depends(get_db)):
    return db.query(Signal).order_by(desc(Signal.timestamp)).limit(limit).all()