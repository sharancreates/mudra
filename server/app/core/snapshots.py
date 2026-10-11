"""
Mudra Portfolio Snapshots Generator (Python 3.10+)
Conformance: PRD FR-36 (Portfolio value history), FR-45 (Daily job writes snapshots), FR-32 (Total equity)
Rules:
1. Stored strictly in integer paise (cash_paise, holdings_value_paise, equity_paise) and basis points (return_bps).
2. Anti-Float Guard: Zero floating-point contamination.
3. return_bps = ((equity_paise - 10_000_000) * 10000) // 10_000_000
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from app.core.logger import get_logger
from app.core.market_adapter import get_market_data_adapter
from app.core.state import get_state_store, PortfolioSnapshot, StateStore

logger = get_logger("app.core.snapshots")

STARTING_CAPITAL_PAISE = 10_000_000  # ₹1,00,000.00


def generate_portfolio_snapshots(
    trade_date: Optional[str] = None,
    state: Optional[StateStore] = None,
    market_adapter: Optional[Any] = None,
) -> List[Dict[str, Any]]:
    """
    Computes and records daily portfolio snapshots for all active users.
    Equity = cash_paise + reserved_paise + SUM(holding.qty * close_paise).
    Return bps = ((equity_paise - STARTING_CAPITAL_PAISE) * 10000) // STARTING_CAPITAL_PAISE.
    """
    store = state or get_state_store()
    adapter = market_adapter or get_market_data_adapter()

    if trade_date is None:
        trade_date = getattr(adapter, "latest_date", "2026-10-12")

    logger.info(f"[SNAPSHOTS] Generating daily portfolio snapshots for trade_date={trade_date}")

    snapshots_created: List[Dict[str, Any]] = []

    # Iterate over all users with a wallet in the store
    for user_id, wallet in store.wallets.items():
        assert isinstance(wallet.cash_paise, int), f"Float contamination in wallet cash: {wallet.cash_paise}"
        assert isinstance(wallet.reserved_paise, int), f"Float contamination in reserved cash: {wallet.reserved_paise}"

        holdings_value_paise = 0

        # Calculate total holdings valuation at closing prices on trade_date
        for holding in store.holdings.values():
            if holding.user_id == user_id and holding.qty > 0:
                sym = holding.symbol
                # Retrieve close price for symbol on trade_date
                dated_close = getattr(adapter, "get_close_on_date", None)
                close_price = dated_close(sym, trade_date) if dated_close else None
                if close_price is None:
                    try:
                        latest = adapter.get_latest_close(sym)
                        close_price = latest["close_paise"]
                    except Exception as e:
                        logger.warning(f"[SNAPSHOTS] Missing close price for {sym}: {e}")
                        close_price = 0

                assert isinstance(close_price, int), f"Float contamination in close price: {close_price}"
                h_val = holding.qty * close_price
                holdings_value_paise += h_val

        assert isinstance(holdings_value_paise, int), f"Float in holdings value: {holdings_value_paise}"

        equity_paise = wallet.cash_paise + wallet.reserved_paise + holdings_value_paise
        assert isinstance(equity_paise, int), f"Float in equity: {equity_paise}"

        # Calculate return in basis points (100 bps = 1.00%, truncate towards zero like SQL integer division)
        diff = equity_paise - STARTING_CAPITAL_PAISE
        if diff >= 0:
            return_bps = (diff * 10_000) // STARTING_CAPITAL_PAISE
        else:
            return_bps = -((-diff * 10_000) // STARTING_CAPITAL_PAISE)
        assert isinstance(return_bps, int), f"Float in return_bps: {return_bps}"

        snapshot = PortfolioSnapshot(
            user_id=user_id,
            snapshot_date=trade_date,
            cash_paise=wallet.cash_paise + wallet.reserved_paise,
            holdings_value_paise=holdings_value_paise,
            equity_paise=equity_paise,
            return_bps=return_bps,
        )

        snapshot_key = f"{user_id}:{trade_date}"
        store.snapshots[snapshot_key] = snapshot

        record = {
            "user_id": user_id,
            "snapshot_date": trade_date,
            "cash_paise": wallet.cash_paise + wallet.reserved_paise,
            "holdings_value_paise": holdings_value_paise,
            "equity_paise": equity_paise,
            "return_bps": return_bps,
        }
        snapshots_created.append(record)

        logger.debug(
            f"[SNAPSHOTS] User {user_id}: equity=Rs.{equity_paise/100:.2f}, "
            f"holdings=Rs.{holdings_value_paise/100:.2f}, return={return_bps/100:+.2f}%"
        )

    logger.info(f"[SNAPSHOTS] Successfully generated {len(snapshots_created)} portfolio snapshots for {trade_date}")
    return snapshots_created


def get_user_snapshots(user_id: str, state: Optional[StateStore] = None) -> List[PortfolioSnapshot]:
    """Returns chronological snapshots for a given user."""
    store = state or get_state_store()
    user_snaps = [
        s for s in store.snapshots.values()
        if s.user_id == user_id
    ]
    user_snaps.sort(key=lambda s: s.snapshot_date)
    return user_snaps
