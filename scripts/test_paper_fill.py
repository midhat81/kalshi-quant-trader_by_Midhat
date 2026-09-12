import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1] / "backend"))

from app.adapters.paper_exchange import paper_exchange


def main():
    result = paper_exchange.submit_order(
        market_id="KXHIGHNY-26SEP12-B77.5",
        side="yes",
        quantity=10,
        limit_price=0.99,
)
    print(result)


if __name__ == "__main__":
    main()