import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1] / "backend"))

from app.adapters.kalshi import kalshi_client


def main():
    response = kalshi_client.get_markets(limit=20, series_ticker="KXHIGHNY")
    markets = response.get("markets", [])

    print(f"Found {len(markets)} markets for series KXHIGHNY")

    for m in markets:
        ticker = m.get("ticker")
        yes_bid = m.get("yes_bid_dollars")
        yes_ask = m.get("yes_ask_dollars")
        volume = m.get("volume_fp")
        mtype = m.get("market_type")
        print(f"{ticker[:50]:50} | type={mtype} | bid={yes_bid} ask={yes_ask} vol={volume}")


if __name__ == "__main__":
    main()