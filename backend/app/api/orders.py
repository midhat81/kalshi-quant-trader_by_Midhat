from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db
from app.models.order import Order
from app.schemas.order import OrderOut, OrderCreateRequest
from app.services.execution import execute_signal_order

router = APIRouter(prefix="/api/orders", tags=["orders"])


@router.get("", response_model=list[OrderOut])
def list_orders(limit: int = Query(20, le=200), db: Session = Depends(get_db)):
    return db.query(Order).order_by(desc(Order.created_at)).limit(limit).all()


@router.post("", response_model=OrderOut)
def create_order(payload: OrderCreateRequest, db: Session = Depends(get_db)):
    if payload.side not in ("yes", "no"):
        raise HTTPException(status_code=400, detail="side must be 'yes' or 'no'")

    order = execute_signal_order(
        db,
        market_id=payload.market_id,
        side=payload.side,
        quantity=payload.quantity,
        limit_price=payload.limit_price,
        signal_id=payload.signal_id,
        strategy="API_MANUAL",
    )
    return order


@router.post("/{order_id}/cancel")
def cancel_order(order_id: str):
    # Paper orders fill immediately in the MVP -- nothing to cancel once filled/rejected.
    raise HTTPException(status_code=400, detail="Paper orders resolve immediately; cancellation not applicable in MVP.")