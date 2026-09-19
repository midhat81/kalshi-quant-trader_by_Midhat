import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1] / "backend"))

from app.adapters.kalshi import kalshi_client


def inspect(series_ticker: str, limit: int = 10):
    print(f"\n=== {series_ticker} ===")
    response = kalshi_client.get_markets(limit=limit, series_ticker=series_ticker)
    markets = response.get("markets", [])
    if not markets:
        print("No markets found.")
        return
    for m in markets:
        ticker = m.get("ticker")
        bid = m.get("yes_bid_dollars")
        ask = m.get("yes_ask_dollars")
        vol = m.get("volume_fp")
        status = m.get("status")
        print(f"{ticker[:45]:45} | bid={bid} ask={ask} vol={vol} status={status}")


if __name__ == "__main__":
    inspect("KXFED")
    inspect("KXCPIYOY")