import uuid
from dataclasses import dataclass

from app.adapters.kalshi import kalshi_client

# Simple fixed fee model for MVP: flat per-contract fee in dollars.
# Kalshi's real fee schedule is tiered and more complex; this is a
# transparent approximation, clearly labeled as such.
PAPER_FEE_PER_CONTRACT = 0.01


@dataclass
class PaperFillResult:
    fill_id: str
    price: float
    quantity: int
    fee: float
    fully_filled: bool
    reason: str


class PaperExchangeAdapter:
    """
    Simulates order execution against REAL Kalshi market data.
    Places no real orders. Fills use the live top-of-book ask price
    (the real price a market-taking order would pay) -- never randomly
    generated and never crossing the wrong side of the book.
    """

    def submit_order(self, market_id: str, side: str, quantity: int, limit_price: float) -> PaperFillResult:
        """
        Simulates a market-taking order fill using the real current top-of-book price.
        side: "yes" or "no"
        limit_price: max price willing to pay, in dollars (0-1)
        """
        market = kalshi_client.get_market(market_id)
        m = market.get("market", market)  # handle either {"market": {...}} or flat response

        price_field = "yes_ask_dollars" if side == "yes" else "no_ask_dollars"
        price_str = m.get(price_field)

        if price_str is None:
            return PaperFillResult(
                fill_id="",
                price=0.0,
                quantity=0,
                fee=0.0,
                fully_filled=False,
                reason=f"NO_QUOTE: market has no {price_field}",
            )

        price = float(price_str)

        if price <= 0 or price >= 1:
            return PaperFillResult(
                fill_id="",
                price=0.0,
                quantity=0,
                fee=0.0,
                fully_filled=False,
                reason=f"NO_LIQUIDITY: {price_field}={price} is not a tradeable quote",
            )

        if price > limit_price:
            return PaperFillResult(
                fill_id="",
                price=0.0,
                quantity=0,
                fee=0.0,
                fully_filled=False,
                reason=f"NO_FILL: ask_price={price} exceeds limit_price={limit_price}",
            )

        fee = round(quantity * PAPER_FEE_PER_CONTRACT, 4)

        return PaperFillResult(
            fill_id=str(uuid.uuid4()),
            price=price,
            quantity=quantity,
            fee=fee,
            fully_filled=True,
            reason=f"PAPER_FILL: {quantity}/{quantity} filled at top-of-book ask={price}",
        )


paper_exchange = PaperExchangeAdapter()