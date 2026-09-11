from typing import Optional
from sqlalchemy.orm import Session

from app.adapters.kalshi import kalshi_client
from app.models.market_snapshot import MarketSnapshot


def _to_float(value) -> Optional[float]:
    if value is None or value == "":
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def fetch_and_store_snapshots(
    db: Session,
    limit: int = 50,
    status: Optional[str] = None,
    series_ticker: Optional[str] = "KXHIGHNY",
) -> int:
    """
    Pulls markets from Kalshi and writes one snapshot row per market.
    Defaults to the KXHIGHNY series (liquid, always-on) for the MVP.
    Returns the number of snapshots stored.
    """
    response = kalshi_client.get_markets(limit=limit, status=status, series_ticker=series_ticker)
    markets = response.get("markets", [])

    stored = 0
    for m in markets:
        yes_bid = _to_float(m.get("yes_bid_dollars"))
        yes_ask = _to_float(m.get("yes_ask_dollars"))
        no_bid = _to_float(m.get("no_bid_dollars"))
        no_ask = _to_float(m.get("no_ask_dollars"))

        spread = None
        if yes_bid is not None and yes_ask is not None:
            spread = round(yes_ask - yes_bid, 4)

        snapshot = MarketSnapshot(
            market_id=m.get("ticker"),
            yes_bid=yes_bid,
            yes_ask=yes_ask,
            no_bid=no_bid,
            no_ask=no_ask,
            spread=spread,
            volume=_to_float(m.get("volume_fp")),
            open_interest=_to_float(m.get("open_interest_fp")),
            status=m.get("status"),
            raw_data=m,
        )
        db.add(snapshot)
        stored += 1

    db.commit()
    return stored