from sqlalchemy.orm import Session

from app.services.market_data import fetch_and_store_snapshots

# Real, liquid series to track over time. Extend this list as you want
# broader historical coverage across market categories.
TRACKED_SERIES = ["KXHIGHNY", "KXCPIYOY"]


def collect_snapshots(db: Session) -> dict:
    """
    Fetches and stores one fresh snapshot batch per tracked series.
    Intended to be called repeatedly over time (via scheduler or manual
    runs) to build up genuine historical data for backtesting.
    Returns a summary of what was stored this run.
    """
    results = {}
    for series in TRACKED_SERIES:
        count = fetch_and_store_snapshots(db, limit=20, series_ticker=series)
        results[series] = count
    return results