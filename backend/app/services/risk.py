from dataclasses import dataclass

from app.services.strategy import TradeSignal

# ---- Risk limits (MVP config, hardcoded for now; move to settings/DB later) ----

MAX_POSITION_SIZE = 100          # max contracts per single position
MAX_MARKET_EXPOSURE_USD = 50.0   # max dollars exposed to a single market
MAX_PORTFOLIO_EXPOSURE_USD = 500.0  # max total dollars exposed across all open positions
MAX_DAILY_LOSS_USD = 100.0       # max allowed daily loss before trading halts
MAX_OPEN_POSITIONS = 10          # max number of distinct open positions
DEFAULT_ORDER_SIZE = 10          # contracts per signal for MVP (fixed sizing, not yet dynamic)


@dataclass
class RiskCheckResult:
    approved: bool
    reason: str
    proposed_side: str
    proposed_size: int


def check_signal(
    signal: TradeSignal,
    current_open_positions: int = 0,
    current_portfolio_exposure_usd: float = 0.0,
    current_daily_pnl_usd: float = 0.0,
) -> RiskCheckResult:
    """
    Runs a signal through risk limits and returns an approve/reject decision.
    This does NOT execute anything — it only evaluates whether an order
    derived from this signal would be allowed to proceed.

    Portfolio state (open positions, exposure, daily PnL) is passed in by
    the caller for now; in Day 2 this will be pulled from the real
    portfolio engine instead of being supplied manually.
    """
    proposed_size = DEFAULT_ORDER_SIZE
    proposed_price = signal.market_probability  # dollars per contract, approx
    proposed_notional = proposed_size * proposed_price

    # 1. Max position size
    if proposed_size > MAX_POSITION_SIZE:
        return RiskCheckResult(
            approved=False,
            reason=f"MAX_POSITION_SIZE_EXCEEDED: {proposed_size} > {MAX_POSITION_SIZE}",
            proposed_side=signal.side,
            proposed_size=proposed_size,
        )

    # 2. Max exposure to a single market
    if proposed_notional > MAX_MARKET_EXPOSURE_USD:
        return RiskCheckResult(
            approved=False,
            reason=f"MAX_MARKET_EXPOSURE_EXCEEDED: ${proposed_notional:.2f} > ${MAX_MARKET_EXPOSURE_USD}",
            proposed_side=signal.side,
            proposed_size=proposed_size,
        )

    # 3. Max total portfolio exposure
    projected_exposure = current_portfolio_exposure_usd + proposed_notional
    if projected_exposure > MAX_PORTFOLIO_EXPOSURE_USD:
        return RiskCheckResult(
            approved=False,
            reason=f"MAX_PORTFOLIO_EXPOSURE_EXCEEDED: ${projected_exposure:.2f} > ${MAX_PORTFOLIO_EXPOSURE_USD}",
            proposed_side=signal.side,
            proposed_size=proposed_size,
        )

    # 4. Max daily loss (halt new trades if already past the loss limit)
    if current_daily_pnl_usd < -abs(MAX_DAILY_LOSS_USD):
        return RiskCheckResult(
            approved=False,
            reason=f"MAX_DAILY_LOSS_EXCEEDED: ${current_daily_pnl_usd:.2f} <= -${MAX_DAILY_LOSS_USD}",
            proposed_side=signal.side,
            proposed_size=proposed_size,
        )

    # 5. Max open positions
    if current_open_positions >= MAX_OPEN_POSITIONS:
        return RiskCheckResult(
            approved=False,
            reason=f"MAX_OPEN_POSITIONS_EXCEEDED: {current_open_positions} >= {MAX_OPEN_POSITIONS}",
            proposed_side=signal.side,
            proposed_size=proposed_size,
        )

    return RiskCheckResult(
        approved=True,
        reason=(
            f"All checks passed: size={proposed_size}<= {MAX_POSITION_SIZE}, "
            f"market_exposure=${proposed_notional:.2f}<=${MAX_MARKET_EXPOSURE_USD}, "
            f"portfolio_exposure=${projected_exposure:.2f}<=${MAX_PORTFOLIO_EXPOSURE_USD}, "
            f"daily_pnl=${current_daily_pnl_usd:.2f}, open_positions={current_open_positions}<{MAX_OPEN_POSITIONS}"
        ),
        proposed_side=signal.side,
        proposed_size=proposed_size,
    )