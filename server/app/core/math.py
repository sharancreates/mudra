"""
Mudra Virtual Trading Math Engine (Python 3.10+)
Conformance: PRD Section 7 (Trading Rules) & Section 9 (Formulas & Worked Example)
Anti-Float Guard: All monetary quantities strictly enforced as Python arbitrary-precision integers (paise).
"""

from datetime import datetime, time, timedelta
from typing import Dict, Optional, Set, Tuple
import pytz

IST = pytz.timezone("Asia/Kolkata")


def calculate_fee(trade_value_paise: int) -> int:
    """
    Calculates 0.1% simulated fee, rounded to the nearest paisa.
    Formula: round(0.001 * tradeValuePaise) => (tradeValuePaise + 500) // 1000
    """
    assert isinstance(trade_value_paise, int), f"Float contamination: {trade_value_paise}"
    if trade_value_paise <= 0:
        return 0
    return (trade_value_paise + 500) // 1000


def calculate_buy_reservation(last_close_paise: int, qty: int) -> Dict[str, int]:
    """
    Calculates estimated buy cost with a 10% safety buffer for price movements.
    est_price = latest_close * 110 // 100
    trade_value = est_price * qty
    fee = calculate_fee(trade_value)
    total_reserved = trade_value + fee
    """
    assert isinstance(last_close_paise, int), f"Float contamination in last_close: {last_close_paise}"
    assert isinstance(qty, int), f"Float contamination in qty: {qty}"
    if qty <= 0:
        raise ValueError("Quantity must be greater than zero")

    est_price_paise = (last_close_paise * 110) // 100
    trade_value_paise = est_price_paise * qty
    est_fee_paise = calculate_fee(trade_value_paise)
    total_reserved_paise = trade_value_paise + est_fee_paise

    return {
        "estimated_price_paise": est_price_paise,
        "estimated_fee_paise": est_fee_paise,
        "total_reserved_paise": total_reserved_paise,
        # Aliases for backward/interface compatibility
        "est_price_paise": est_price_paise,
        "est_fee_paise": est_fee_paise,
    }


def get_next_execution_date(
    current_time: Optional[datetime] = None,
    closed_dates: Optional[Set[str]] = None,
) -> str:
    """
    Determines target trade execution date based on 15:30:00 IST market cutoff
    and exchange holiday calendar.
    """
    if closed_dates is None:
        closed_dates = set()

    if current_time is None:
        current_time = datetime.now(pytz.utc)

    # Ensure timezone aware in IST
    if current_time.tzinfo is None:
        ist_time = IST.localize(current_time)
    else:
        ist_time = current_time.astimezone(IST)

    target_date = ist_time.date()
    cutoff_time = time(15, 30, 0)

    # If orders are placed at or after 15:30:00 IST, advance to next day
    if ist_time.time() >= cutoff_time:
        target_date += timedelta(days=1)

    # Advance over weekends (Saturday=5, Sunday=6) and holidays
    while target_date.weekday() in (5, 6) or target_date.isoformat() in closed_dates:
        target_date += timedelta(days=1)

    return target_date.isoformat()


def update_holding_on_buy(
    old_qty: int,
    old_cost_basis_paise: int,
    buy_qty: int,
    fill_price_paise: int,
    fee_paise: int,
) -> Dict[str, int]:
    """
    Updates equity holdings after a BUY fill. Cost basis includes buy fees.
    """
    assert isinstance(old_qty, int)
    assert isinstance(old_cost_basis_paise, int)
    assert isinstance(buy_qty, int)
    assert isinstance(fill_price_paise, int)
    assert isinstance(fee_paise, int)

    trade_value_paise = fill_price_paise * buy_qty
    cash_out_paise = trade_value_paise + fee_paise
    new_cost_basis_paise = old_cost_basis_paise + cash_out_paise
    new_qty = old_qty + buy_qty
    avg_price_paise = (new_cost_basis_paise // new_qty) if new_qty > 0 else 0

    return {
        "new_qty": new_qty,
        "new_cost_basis_paise": new_cost_basis_paise,
        "avg_price_paise": avg_price_paise,
        "cash_out_paise": cash_out_paise,
    }


def update_holding_on_sell(
    old_qty: int,
    old_cost_basis_paise: int,
    sell_qty: int,
    fill_price_paise: int,
    fee_paise: int,
) -> Dict[str, int]:
    """
    Updates equity holdings after a SELL fill.
    Deducts weighted average cost basis and records realized P&L.
    """
    assert isinstance(old_qty, int)
    assert isinstance(old_cost_basis_paise, int)
    assert isinstance(sell_qty, int)
    assert isinstance(fill_price_paise, int)
    assert isinstance(fee_paise, int)

    if old_qty < sell_qty:
        raise ValueError("Cannot sell more shares than currently owned")

    trade_value_paise = fill_price_paise * sell_qty
    cash_in_paise = trade_value_paise - fee_paise
    cost_of_sold_paise = (old_cost_basis_paise * sell_qty) // old_qty
    realized_pl_paise = cash_in_paise - cost_of_sold_paise
    new_cost_basis_paise = old_cost_basis_paise - cost_of_sold_paise
    new_qty = old_qty - sell_qty
    avg_price_paise = (new_cost_basis_paise // new_qty) if new_qty > 0 else 0

    return {
        "new_qty": new_qty,
        "new_cost_basis_paise": new_cost_basis_paise,
        "avg_price_paise": avg_price_paise,
        "cash_in_paise": cash_in_paise,
        "cost_of_sold_paise": cost_of_sold_paise,
        "realized_pl_paise": realized_pl_paise,
    }


def calculate_unrealized_pl(
    qty_held: int,
    last_close_paise: int,
    cost_basis_paise: int,
) -> Tuple[int, int]:
    """
    Calculates unrealized P&L for a holding at last closing price.
    Returns: (current_value_paise, unrealized_pl_paise)
    """
    assert isinstance(qty_held, int)
    assert isinstance(last_close_paise, int)
    assert isinstance(cost_basis_paise, int)

    current_val_paise = qty_held * last_close_paise
    unrealized_pl_paise = current_val_paise - cost_basis_paise
    return current_val_paise, unrealized_pl_paise


def calculate_portfolio_equity(
    free_cash_paise: int,
    reserved_cash_paise: int,
    holdings_value_paise: int,
    starting_cash_paise: int = 10000000,
) -> Dict[str, float]:
    """
    Calculates total equity and total return percentage.
    """
    assert isinstance(free_cash_paise, int)
    assert isinstance(reserved_cash_paise, int)
    assert isinstance(holdings_value_paise, int)
    assert isinstance(starting_cash_paise, int)

    total_equity_paise = free_cash_paise + reserved_cash_paise + holdings_value_paise
    return_paise = total_equity_paise - starting_cash_paise
    return_bps = (return_paise * 10000) // starting_cash_paise
    return_pct = return_bps / 100.0

    return {
        "total_equity_paise": total_equity_paise,
        "return_bps": return_bps,
        "return_pct": return_pct,
    }
