import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1] / "backend"))

from app.adapters.kalshi import kalshi_client


def main():
    market = kalshi_client.get_market("KXHIGHNY-26SEP12-B77.5")
    m = market.get("market", market)
    print(f"yes_bid_dollars: {m.get('yes_bid_dollars')}")
    print(f"yes_ask_dollars: {m.get('yes_ask_dollars')}")
    print(f"no_bid_dollars: {m.get('no_bid_dollars')}")
    print(f"no_ask_dollars: {m.get('no_ask_dollars')}")
    print(f"status: {m.get('status')}")


if __name__ == "__main__":
    main()