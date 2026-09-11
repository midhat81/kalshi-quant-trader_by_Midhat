import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1] / "backend"))

from app.adapters.kalshi import kalshi_client


def main():
    ob = kalshi_client.get_orderbook("KXHIGHNY-26SEP11-T79")
    print(ob)


if __name__ == "__main__":
    main()