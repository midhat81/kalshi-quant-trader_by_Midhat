from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db
from app.models.fill import Fill
from app.schemas.fill import FillOut

router = APIRouter(prefix="/api/trades", tags=["trades"])


@router.get("", response_model=list[FillOut])
def list_trades(limit: int = Query(20, le=200), db: Session = Depends(get_db)):
    return db.query(Fill).order_by(desc(Fill.timestamp)).limit(limit).all()