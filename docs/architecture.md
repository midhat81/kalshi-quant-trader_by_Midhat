# Architecture

## Pipeline

Every trade decision flows through seven distinct, auditable stages. No stage skips ahead of the one before it.

1. Market Data — backend/app/services/market_data.py pulls real market snapshots from Kalshi's REST API and stores them in market_snapshots. A separate authenticated WebSocket connection (ws_bridge.py) streams live tick updates.

2. Probability Estimate — probability.py computes a transparent fair-value probability: the market's own mid-price (yes_bid + yes_ask) / 2, adjusted by a real order-book imbalance signal (top-N depth on the YES side vs. the NO side). This is intentionally simple and auditable — not a trained model — so every number can be explained in one sentence.

3. Signal — strategy.py compares the model's probability to the market's own implied probability. If the edge exceeds a threshold (default 3%) and confidence clears a minimum bar, a signal fires: BUY YES or BUY NO.

4. Risk Check — risk.py evaluates the signal against hard position, exposure, and daily-loss limits before anything can become an order. Every decision — approved or rejected — is recorded with its reason.

5. Order + Fill — execution.py creates an Order, then (in paper mode) paper_exchange.py fills it against the real live top-of-book ask price, with a transparent flat fee model. No fill is ever randomly generated.

6. Position + PnL — portfolio.py derives open positions strictly from the fill history (never stored independently of fills). pnl.py aggregates realized/unrealized PnL, explicitly excluding markets with no live quote rather than treating them as zero.

7. Audit — every step above writes an Event row (SIGNAL_CREATED, RISK_CHECKED, ORDER_SUBMITTED, FILL, etc.), so the full chain from signal to fill is reconstructable for any trade.

## Why a transparent probability model, not ML

The brief for this project deliberately avoided a black-box ML model in the MVP. A documented heuristic that anyone can verify by hand is more valuable for demonstrating trading infrastructure than a model whose reasoning nobody can audit. A trained model is a natural extension, but it doesn't replace the need for the system underneath it to be honest and traceable.

## Data honesty principles enforced in code

- portfolio.py returns current_price: None (not 0.0) for closed markets — see the market_status == "active" check
- pnl.py's compute_portfolio_summary explicitly separates "unpriceable" positions from zero-valued ones
- backtest.py reports data_warning whenever sample size is below a meaningful threshold
- calibration.py only ever writes a CalibrationRecord when Kalshi's own API reports status == "settled" with a real result