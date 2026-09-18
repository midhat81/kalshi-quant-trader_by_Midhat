import google.generativeai as genai
from sqlalchemy.orm import Session

from app.core.config import settings
from app.services.portfolio import get_open_positions
from app.services.pnl import compute_portfolio_summary
from app.models.signal import Signal
from app.models.risk_decision import RiskDecision

genai.configure(api_key=settings.gemini_api_key)

SYSTEM_PROMPT = """You are a portfolio assistant for a real (paper trading) prediction-market trading system connected to Kalshi.

You will be given the user's REAL current portfolio data: positions, PnL, recent signals, and risk decisions.

Rules:
- Only answer using the data provided below. Never invent numbers.
- This is PAPER TRADING. Never imply real money is at risk or that this is live profitable trading.
- Be concise and direct. Use actual numbers from the data.
- If asked about something not in the provided data, say so honestly.
"""


def _build_context(db: Session) -> str:
    positions = get_open_positions(db)
    summary = compute_portfolio_summary(db)
    recent_signals = db.query(Signal).order_by(Signal.timestamp.desc()).limit(10).all()
    recent_risk = db.query(RiskDecision).order_by(RiskDecision.timestamp.desc()).limit(10).all()

    lines = ["=== PORTFOLIO SUMMARY ==="]
    lines.append(f"Total PnL: {summary.total_pnl}")
    lines.append(f"Realized PnL: {summary.total_realized_pnl}")
    lines.append(f"Unrealized PnL: {summary.total_unrealized_pnl}")
    lines.append(f"Total Exposure: ${summary.total_exposure}")
    lines.append(f"Open Positions: {summary.open_position_count}")
    lines.append(f"Total Fees Paid: ${summary.total_fees}")

    lines.append("\n=== OPEN POSITIONS ===")
    if not positions:
        lines.append("No open positions.")
    for p in positions:
        lines.append(
            f"- {p.market_id} | side={p.side} qty={p.quantity} "
            f"avg_entry={p.average_entry_price} current={p.current_price} "
            f"unrealized_pnl={p.unrealized_pnl} status={p.market_status}"
        )

    lines.append("\n=== RECENT SIGNALS (last 10) ===")
    if not recent_signals:
        lines.append("No signals yet.")
    for s in recent_signals:
        lines.append(
            f"- {s.market_id} | side={s.side} edge={s.edge:+.4f} "
            f"confidence={s.confidence} strategy={s.strategy_name}"
        )

    lines.append("\n=== RECENT RISK DECISIONS (last 10) ===")
    if not recent_risk:
        lines.append("No risk decisions yet.")
    for r in recent_risk:
        status = "APPROVED" if r.approved else "REJECTED"
        lines.append(f"- {r.market_id} | {status} | {r.reason}")

    return "\n".join(lines)


def ask_portfolio_question(db: Session, question: str) -> str:
    context = _build_context(db)
    full_prompt = f"{SYSTEM_PROMPT}\n\n{context}\n\n=== USER QUESTION ===\n{question}"

    model = genai.GenerativeModel("gemini-3.6-flash")
    response = model.generate_content(full_prompt)
    return response.text