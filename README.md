# Kalshi Quant Trader

A real, auditable prediction-market trading system built on Kalshi's API — not a demo, not a backtest-only toy. Every number in this system traces back to a real market snapshot, a real signal, a real (paper) fill, or a real settled outcome. Nothing is fabricated.

**This is paper trading.** No real money is at risk. The goal of this project is to demonstrate honest, end-to-end trading infrastructure and forecasting methodology — not to claim a profitable trading strategy.

---

## Why this project is different

Most open-source "trading bot" repositories fall into one of two categories: closed black boxes with no verifiable results, or demos with fabricated PnL that looks good in a screenshot but means nothing. This project takes a different approach:

- **Every signal is graded against reality.** The system tracks each prediction's calibration — when the model says 70% probability, does that market actually resolve YES 70% of the time? This is measured with a running Brier score, computed only from markets that have genuinely settled on Kalshi. See docs/calibration.md.
- **PnL is never invented.** Positions on closed/unpriced markets are explicitly reported as null, not zero. Unrealized PnL only reflects markets with a live, current quote.
- **Backtests report their own limitations.** If the sample size is small, the system says so, out loud, in the API response — rather than presenting thin data as a robust conclusion.
- **The audit trail is complete.** Every signal, risk decision, order, and fill is logged as a discrete event, so any number in the dashboard can be traced back to the exact chain of real events that produced it.

---

## Architecture

Kalshi REST + WebSocket (real, authenticated) leads to the Market Data Service, which writes into Postgres market_snapshots. That feeds the Probability Engine (transparent, order-book-imbalance based), which feeds the Strategy Engine (probability-edge signal generation), which feeds the Risk Engine (position/exposure/loss limits), which feeds the Paper Execution Engine (fills against real top-of-book prices), which feeds the Portfolio and PnL Engine (derived strictly from real fills), exposed through FastAPI (REST plus a WebSocket relay) and rendered in the React Dashboard.

Full detail in docs/architecture.md.

---

## What's real vs. what's simulated

| Component | Status |
|---|---|
| Market data (prices, order books) | Real — live from Kalshi's authenticated REST + WebSocket API |
| Probability model | Real, transparent — a documented heuristic (mid-price + order-book imbalance), not a black box |
| Signal generation | Real — rule-based edge threshold, fully auditable |
| Risk checks | Real — actual position/exposure/loss limits enforced |
| Order execution | Simulated (paper) — fills use real market prices and real fees, but no real money moves |
| PnL | Real, derived — computed strictly from recorded fills and live prices, never hardcoded |
| Calibration / Brier score | Real — computed only from markets that have genuinely settled |
| Backtest | Real, honestly bounded — runs the live strategy code against real stored history; reports sample size and warns when data is thin |

---

## Tech stack

- Backend: Python, FastAPI, SQLAlchemy, PostgreSQL, Redis
- Quant: Transparent probability modeling (no black-box ML in the MVP, by design)
- Frontend: React, TypeScript, Vite, Tailwind CSS
- AI: Gemini-powered portfolio assistant, grounded only in real stored data
- Infra: Docker Compose, scheduled background data collection

---

## Running locally

### Prerequisites
- Python 3.13+, Node.js, Docker Desktop
- A Kalshi account with API credentials (see Kalshi's API docs: https://trading-api.readme.io/reference/getting-started)

### Setup

Clone and enter the repo:
    git clone https://github.com/midhat81/kalshi-quant-trader_by_Midhat.git
    cd kalshi-quant-trader_by_Midhat

Set up environment variables:
    cp .env.example .env
    (Fill in KALSHI_API_KEY, KALSHI_PRIVATE_KEY_PATH, GEMINI_API_KEY)

Start Postgres + Redis:
    docker compose up -d

Set up the backend:
    cd backend
    python -m venv venv
    .\venv\Scripts\Activate.ps1
    pip install -r requirements.txt
    python ../scripts/init_db.py

Run the backend:
    uvicorn app.main:app --reload --port 8000

In a separate terminal, run the frontend:
    cd frontend
    npm install
    npm run dev

Visit http://localhost:5173.

---

## Data collection (background jobs)

Two scheduled jobs keep the system's historical and calibration data growing over time, entirely hands-off:

- scripts/collect_snapshots.py — saves real market snapshots (every 15 min)
- scripts/check_calibration.py — checks for newly-resolved markets and records real outcomes (hourly)

See docs/data-collection.md for setup via Windows Task Scheduler / cron.

---

## Project structure

- backend/app/adapters/ — Kalshi REST + WebSocket client
- backend/app/services/ — probability, strategy, risk, execution, portfolio, pnl, calibration, backtest
- backend/app/models/ — SQLAlchemy tables
- backend/app/api/ — FastAPI routers
- frontend/src/pages/ — Dashboard, Markets, Positions, Trades, Signals, Risk
- frontend/src/components/ — Reusable UI
- scripts/ — Runnable pipeline scripts + scheduled jobs
- docs/ — Architecture, strategy, risk, calibration methodology

---

## Limitations (stated honestly)

- Single market series (KXHIGHNY, NYC daily high temperature) in the current MVP
- Probability model is a transparent heuristic, not a trained ML model — by design, for auditability
- Historical dataset is still growing; backtest results should be read with the sample-size warning the API provides
- Paper trading only — no live capital at risk, no profitability claims

---

## License

MIT