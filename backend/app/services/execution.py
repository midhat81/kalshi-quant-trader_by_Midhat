from typing import Optional
from sqlalchemy.orm import Session

from app.core.config import settings
from app.adapters.paper_exchange import paper_exchange
from app.models.order import Order
from app.models.fill import Fill
from app.services.audit import (
    log_event,
    ORDER_CREATED,
    ORDER_SUBMITTED,
    FILL,
    ORDER_REJECTED,
)


def execute_signal_order(
    db: Session,
    market_id: str,
    side: str,
    quantity: int,
    limit_price: float,
    signal_id: Optional[str] = None,
    strategy: Optional[str] = None,
) -> Order:
    """
    Creates an Order, submits it for execution (paper or live depending on
    TRADING_MODE), and records the resulting Fill (if any). Every step is
    logged as an audit event. This function commits its own transaction.

    Live mode is not implemented in the MVP -- only paper is wired up.
    Attempting live mode raises clearly rather than silently falling back.
    """
    if settings.trading_mode not in ("paper", "live"):
        raise ValueError(f"Unknown TRADING_MODE: {settings.trading_mode}")

    order = Order(
        signal_id=signal_id,
        market_id=market_id,
        side=side,
        price=limit_price,
        quantity=quantity,
        status="created",
        order_type="limit",
        strategy=strategy,
    )
    db.add(order)
    db.flush()  # get order.id

    log_event(
        db,
        event_type=ORDER_CREATED,
        market_id=market_id,
        signal_id=signal_id,
        order_id=order.id,
        payload={"side": side, "quantity": quantity, "limit_price": limit_price},
    )

    if settings.trading_mode == "live":
        # Explicitly not implemented for MVP -- brief requires paper-first,
        # live mode only after real account/access verification.
        order.status = "rejected"
        log_event(
            db,
            event_type=ORDER_REJECTED,
            market_id=market_id,
            order_id=order.id,
            payload={"reason": "LIVE_MODE_NOT_IMPLEMENTED"},
        )
        db.commit()
        return order

    # ---- Paper execution ----
    order.status = "submitted"
    from datetime import datetime, timezone
    order.submitted_at = datetime.now(timezone.utc)

    log_event(
        db,
        event_type=ORDER_SUBMITTED,
        market_id=market_id,
        order_id=order.id,
        payload={"mode": "paper"},
    )

    result = paper_exchange.submit_order(
        market_id=market_id,
        side=side,
        quantity=quantity,
        limit_price=limit_price,
    )

    if result.quantity == 0:
        order.status = "rejected"
        log_event(
            db,
            event_type=ORDER_REJECTED,
            market_id=market_id,
            order_id=order.id,
            payload={"reason": result.reason},
        )
        db.commit()
        return order

    fill = Fill(
        order_id=order.id,
        exchange_fill_id=result.fill_id,
        market_id=market_id,
        price=result.price,
        quantity=result.quantity,
        fee=result.fee,
    )
    db.add(fill)
    db.flush()

    order.status = "filled" if result.fully_filled else "partial"
    order.filled_at = datetime.now(timezone.utc)

    log_event(
        db,
        event_type=FILL,
        market_id=market_id,
        order_id=order.id,
        fill_id=fill.id,
        payload={
            "price": result.price,
            "quantity": result.quantity,
            "fee": result.fee,
            "fully_filled": result.fully_filled,
            "reason": result.reason,
        },
    )

    db.commit()
    return order