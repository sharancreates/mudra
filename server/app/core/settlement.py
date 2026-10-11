"""
Mudra Order Settlement Engine (Python 3.10+)
Conformance: PRD Section 7 (Trading Rules), ADR-002, ADR-004, ADR-005
Rule 1: Priority Execution — SELLS before BUYS to unlock cash liquidity.
Rule 2: Anti-Float Guard — All financial math strictly in integer paise.
Rule 3: Safety Buffer Refund — Unspent buy reservation refunded to free cash.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import uuid

from app.core.logger import get_logger
from app.core.market_adapter import get_market_data_adapter
from app.core.math import calculate_fee
from app.core.state import get_state_store, LedgerEntry, UserHolding

logger = get_logger("app.core.settlement")


def settle_orders(
    trade_date: Optional[str] = None,
    price_overrides: Optional[Dict[str, int]] = None,
) -> Dict[str, Any]:
    """
    Settles pending orders targeting trade_date or earlier.
    Executes SELLS before BUYS to ensure cash proceeds from sales are immediately available.
    """
    store = get_state_store()
    adapter = get_market_data_adapter()

    if trade_date is None:
        trade_date = getattr(adapter, "latest_date", "2026-10-12")

    logger.info(f"[SETTLEMENT] Beginning order settlement run for trade_date={trade_date}")

    # Gather pending orders targeting trade_date or earlier
    pending_orders = [
        o for o in store.orders.values()
        if o.status == "PENDING" and o.target_trade_date <= trade_date
    ]

    # Crucial Rule: SELLS before BUYS (priority 1 vs 2), then created_at
    pending_orders.sort(key=lambda o: (1 if o.side == "SELL" else 2, o.created_at))

    settled_sells = 0
    settled_buys = 0
    rejected_orders = 0
    skipped_orders = 0
    total_trade_volume_paise = 0
    total_fees_paise = 0

    for order in pending_orders:
        symbol = order.symbol.upper()

        # 1. Determine Closing Price
        if price_overrides and symbol in price_overrides:
            close_price_paise = price_overrides[symbol]
        else:
            try:
                latest = adapter.get_latest_close(symbol)
                close_price_paise = latest["close_paise"]
            except Exception as e:
                logger.warning(f"[SETTLEMENT] Missing close price for {symbol}: {e}")
                skipped_orders += 1
                continue

        assert isinstance(close_price_paise, int), f"Float contamination: {close_price_paise}"
        wallet = store.get_or_create_wallet(order.user_id)
        holding_key = f"{order.user_id}:{symbol}"

        if order.side == "SELL":
            # Trade value and fee calculation
            trade_val_paise = close_price_paise * order.qty
            fee_paise = calculate_fee(trade_val_paise)
            net_proceeds_paise = trade_val_paise - fee_paise

            holding = store.holdings.get(holding_key)
            if not holding or holding.qty < order.qty:
                order.status = "REJECTED"
                order.reason = "insufficient_holdings_at_settlement"
                rejected_orders += 1
                logger.warning(f"[SETTLEMENT] Order {order.id} rejected: insufficient holdings")
                continue

            # Calculate cost basis of sold shares
            cost_of_sold_paise = (holding.cost_basis_paise * order.qty) // holding.qty
            realized_pl_paise = net_proceeds_paise - cost_of_sold_paise

            # Mutate holdings
            holding.qty -= order.qty
            holding.reserved_qty = max(0, holding.reserved_qty - order.qty)
            holding.cost_basis_paise -= cost_of_sold_paise

            # Credit net cash proceeds to user wallet
            wallet.cash_paise += net_proceeds_paise

            # Mark order filled
            order.status = "FILLED"
            order.fill_price_paise = close_price_paise

            # Record immutable ledger rows
            now_iso = datetime.now(timezone.utc).isoformat()
            store.ledger.append(
                LedgerEntry(
                    entry_id=f"led_{uuid.uuid4().hex[:8]}",
                    user_id=order.user_id,
                    entry_type="TRADE_SELL",
                    cash_delta_paise=trade_val_paise,
                    balance_after_paise=wallet.cash_paise + fee_paise,
                    created_at=now_iso,
                )
            )
            store.ledger.append(
                LedgerEntry(
                    entry_id=f"led_{uuid.uuid4().hex[:8]}",
                    user_id=order.user_id,
                    entry_type="FEE",
                    cash_delta_paise=-fee_paise,
                    balance_after_paise=wallet.cash_paise,
                    created_at=now_iso,
                )
            )

            settled_sells += 1
            total_trade_volume_paise += trade_val_paise
            total_fees_paise += fee_paise
            logger.info(
                f"[SETTLEMENT] Filled SELL {order.qty} {symbol} @ Rs.{close_price_paise/100:.2f} "
                f"(Realized P&L: Rs.{realized_pl_paise/100:.2f})"
            )

        else:  # BUY
            trade_val_paise = close_price_paise * order.qty
            fee_paise = calculate_fee(trade_val_paise)
            actual_cost_paise = trade_val_paise + fee_paise

            # Check if total available cash covers actual cost
            if (wallet.cash_paise + order.reserved_paise) < actual_cost_paise:
                # Exceeded 10% safety buffer and user has no additional cash
                wallet.cash_paise += order.reserved_paise
                wallet.reserved_paise -= order.reserved_paise
                order.status = "REJECTED"
                order.reason = "price_exceeded_cash"
                rejected_orders += 1
                logger.warning(f"[SETTLEMENT] Order {order.id} rejected: price exceeded reserved cash")
                continue

            # Fill BUY:
            # Unreserve initial buffer and deduct actual cost
            # Equivalent to: wallet.cash_paise += (order.reserved_paise - actual_cost_paise)
            wallet.cash_paise += (order.reserved_paise - actual_cost_paise)
            wallet.reserved_paise -= order.reserved_paise

            # Upsert holding
            if holding_key not in store.holdings:
                store.holdings[holding_key] = UserHolding(
                    user_id=order.user_id,
                    symbol=symbol,
                    qty=order.qty,
                    reserved_qty=0,
                    cost_basis_paise=actual_cost_paise,
                )
            else:
                holding = store.holdings[holding_key]
                holding.qty += order.qty
                holding.cost_basis_paise += actual_cost_paise

            order.status = "FILLED"
            order.fill_price_paise = close_price_paise

            # Record immutable ledger rows
            now_iso = datetime.now(timezone.utc).isoformat()
            store.ledger.append(
                LedgerEntry(
                    entry_id=f"led_{uuid.uuid4().hex[:8]}",
                    user_id=order.user_id,
                    entry_type="TRADE_BUY",
                    cash_delta_paise=-trade_val_paise,
                    balance_after_paise=wallet.cash_paise + fee_paise,
                    created_at=now_iso,
                )
            )
            store.ledger.append(
                LedgerEntry(
                    entry_id=f"led_{uuid.uuid4().hex[:8]}",
                    user_id=order.user_id,
                    entry_type="FEE",
                    cash_delta_paise=-fee_paise,
                    balance_after_paise=wallet.cash_paise,
                    created_at=now_iso,
                )
            )

            settled_buys += 1
            total_trade_volume_paise += trade_val_paise
            total_fees_paise += fee_paise
            logger.info(
                f"[SETTLEMENT] Filled BUY {order.qty} {symbol} @ Rs.{close_price_paise/100:.2f} "
                f"(Actual cost: Rs.{actual_cost_paise/100:.2f}, Refunded: Rs.{(order.reserved_paise - actual_cost_paise)/100:.2f})"
            )

    report = {
        "trade_date": trade_date,
        "settled_sells": settled_sells,
        "settled_buys": settled_buys,
        "total_filled": settled_sells + settled_buys,
        "rejected": rejected_orders,
        "skipped": skipped_orders,
        "total_volume_paise": total_trade_volume_paise,
        "total_fees_paise": total_fees_paise,
    }

    logger.info(f"[SETTLEMENT] Settlement run completed: {report}")
    return report
