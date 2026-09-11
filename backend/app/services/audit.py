from typing import Optional
from sqlalchemy.orm import Session

from app.models.event import Event

# Standard event types used across the pipeline
SIGNAL_CREATED = "SIGNAL_CREATED"
RISK_CHECKED = "RISK_CHECKED"
ORDER_CREATED = "ORDER_CREATED"
ORDER_SUBMITTED = "ORDER_SUBMITTED"
ORDER_ACKNOWLEDGED = "ORDER_ACKNOWLEDGED"
PARTIAL_FILL = "PARTIAL_FILL"
FILL = "FILL"
POSITION_UPDATED = "POSITION_UPDATED"
PNL_UPDATED = "PNL_UPDATED"
ORDER_REJECTED = "ORDER_REJECTED"


def log_event(
    db: Session,
    event_type: str,
    market_id: Optional[str] = None,
    signal_id: Optional[str] = None,
    order_id: Optional[str] = None,
    fill_id: Optional[str] = None,
    payload: Optional[dict] = None,
) -> Event:
    """
    Writes a single audit event row. Does not commit -- caller controls
    the transaction boundary so this can be batched with other writes.
    """
    event = Event(
        event_type=event_type,
        market_id=market_id,
        signal_id=signal_id,
        order_id=order_id,
        fill_id=fill_id,
        payload=payload,
    )
    db.add(event)
    return event