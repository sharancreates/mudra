"""
FastAPI Portfolio, Equity Curves, and Transaction Ledger Endpoints (Python 3.10+)
Conformance: PRD FR-29 to FR-36, docs/api.md Section 3, Section 11.3
"""

from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Header, Query

from app.core.logger import get_logger
from app.core.market_adapter import get_market_data_adapter
from app.core.snapshots import get_user_snapshots
from app.core.state import get_state_store, StateStore

logger = get_logger("app.api.routes_portfolio")
router = APIRouter(prefix="/api", tags=["portfolio"])


def get_current_user_id(authorization: Optional[str] = Header(None)) -> str:
    """Extracts user_id from Bearer token or falls back to default test user."""
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split("Bearer ", 1)[1].strip()
        if token and token != "mock_token":
            return token
    return "usr_test_default"


@router.get("/portfolio")
def get_portfolio(
    user_id: str = Depends(get_current_user_id),
    store: StateStore = Depends(get_state_store),
) -> Dict[str, Any]:
    """
    Returns current user's wallet balances, active holdings, total equity,
    weighted average prices, and realized & unrealized P&L.
    """
    adapter = get_market_data_adapter()
    wallet = store.get_or_create_wallet(user_id)
    as_of = getattr(adapter, "latest_date", "2026-10-09")

    holdings_list: List[Dict[str, Any]] = []
    total_holdings_value_paise = 0

    # User active holdings
    for holding in store.holdings.values():
        if holding.user_id == user_id and holding.qty > 0:
            sym = holding.symbol
            inst = adapter.get_instrument(sym)
            name = inst.get("name", sym) if inst else sym

            # Close price
            try:
                latest_close = adapter.get_latest_close(sym)["close_paise"]
            except Exception:
                latest_close = holding.cost_basis_paise // holding.qty

            avg_paise = holding.cost_basis_paise // holding.qty
            invested_paise = holding.cost_basis_paise
            value_paise = holding.qty * latest_close
            unrealized_paise = value_paise - invested_paise

            diff_bps = 0
            if invested_paise > 0:
                diff = value_paise - invested_paise
                diff_bps = ((diff * 10000) // invested_paise) if diff >= 0 else -((-diff * 10000) // invested_paise)

            holdings_list.append({
                "symbol": sym,
                "name": name,
                "qty": holding.qty,
                "avg_paise": avg_paise,
                "invested_paise": invested_paise,
                "value_paise": value_paise,
                "unrealized_paise": unrealized_paise,
                "unrealized_bps": diff_bps,
            })
            total_holdings_value_paise += value_paise

    total_equity_paise = wallet.cash_paise + wallet.reserved_paise + total_holdings_value_paise

    # Cumulative realized P&L from sales
    realized_paise = sum(
        e.realized_pl_paise for e in store.ledger
        if e.user_id == user_id and e.realized_pl_paise is not None
    )

    return {
        "cash_paise": wallet.cash_paise,
        "reserved_paise": wallet.reserved_paise,
        "holdings": holdings_list,
        "equity_paise": total_equity_paise,
        "realized_paise": realized_paise,
        "prices_as_of": as_of,
    }


@router.get("/portfolio/history")
def get_portfolio_history(
    range: str = Query("ALL", pattern="^(1M|6M|ALL|all|1m|6m)$"),
    user_id: str = Depends(get_current_user_id),
    store: StateStore = Depends(get_state_store),
) -> Dict[str, Any]:
    """
    Returns historical daily equity snapshots for charting (1M, 6M, or ALL).
    """
    raw_snapshots = get_user_snapshots(user_id, state=store)
    range_upper = range.upper()

    if not raw_snapshots:
        # Fallback initial baseline point
        wallet = store.get_or_create_wallet(user_id)
        today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        return {
            "points": [
                {
                    "date": today_str,
                    "equity_paise": wallet.cash_paise + wallet.reserved_paise,
                }
            ]
        }

    points = [
        {
            "date": s.snapshot_date,
            "equity_paise": s.equity_paise,
        }
        for s in raw_snapshots
    ]

    # Filter by range
    if range_upper == "1M" and len(points) > 30:
        points = points[-30:]
    elif range_upper == "6M" and len(points) > 180:
        points = points[-180:]

    return {"points": points}


@router.get("/ledger")
def get_ledger(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    user_id: str = Depends(get_current_user_id),
    store: StateStore = Depends(get_state_store),
) -> Dict[str, Any]:
    """
    Returns append-only transaction ledger entries for user in reverse chronological order.
    """
    user_entries = [e for e in store.ledger if e.user_id == user_id]
    user_entries.reverse()  # Newest first

    start_idx = (page - 1) * limit
    end_idx = start_idx + limit
    page_items = user_entries[start_idx:end_idx]

    items = [
        {
            "id": e.id,
            "type": e.entry_type,
            "symbol": e.symbol,
            "qty": e.qty,
            "price_paise": e.price_paise,
            "cash_delta_paise": e.cash_delta_paise,
            "balance_after_paise": e.balance_after_paise,
            "realized_pl_paise": e.realized_pl_paise,
            "created_at": e.created_at,
        }
        for e in page_items
    ]

    next_page = page + 1 if end_idx < len(user_entries) else None

    return {
        "items": items,
        "next": next_page,
    }
