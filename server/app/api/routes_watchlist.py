"""
FastAPI Watchlist Route Handlers (Python 3.10+)
Conformance: PRD FR-38 (Watchlist add, remove, list, max 50 items), docs/api.md
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, Field

from app.core.logger import get_logger, request_id_ctx
from app.core.market_adapter import get_market_data_adapter
from app.core.state import get_state_store, StateStore

logger = get_logger("app.api.routes_watchlist")
router = APIRouter(prefix="/api/watchlist", tags=["watchlist"])


def get_current_user_id(authorization: Optional[str] = Header(None)) -> str:
    """Extracts user_id from Bearer token or falls back to default test user."""
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split("Bearer ", 1)[1].strip()
        if token and token != "mock_token":
            return token
    return "usr_test_default"


class WatchlistAddRequest(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=20, description="Stock ticker symbol")


@router.get("")
def get_watchlist(
    user_id: str = Depends(get_current_user_id),
    store: StateStore = Depends(get_state_store),
) -> Dict[str, Any]:
    """
    Returns user's watchlisted stocks enriched with closing price and day change %.
    """
    adapter = get_market_data_adapter()
    entries = store.get_user_watchlist(user_id)

    items: List[Dict[str, Any]] = []
    for entry in entries:
        sym = entry["symbol"]
        inst = adapter.get_instrument(sym)
        if inst:
            items.append({
                "symbol": sym,
                "name": inst.get("name", sym),
                "exchange": inst.get("exchange", "NSE"),
                "sector": inst.get("sector", "Equities"),
                "last_close_paise": inst.get("last_close_paise", 0),
                "change_bps": inst.get("change_bps", 0),
                "as_of": inst.get("as_of", "2026-10-09"),
                "tradable": inst.get("tradable", True),
                "added_at": entry["added_at"],
            })

    return {"items": items}


@router.post("", status_code=status.HTTP_201_CREATED)
def add_to_watchlist(
    body: WatchlistAddRequest,
    user_id: str = Depends(get_current_user_id),
    store: StateStore = Depends(get_state_store),
) -> Dict[str, Any]:
    """
    Adds a stock to the user's watchlist. Enforces 50-item limit per FR-38.
    """
    req_id = request_id_ctx.get() or "req_watchlist"
    sym = body.symbol.strip().upper()
    adapter = get_market_data_adapter()

    # Validate instrument exists
    inst = adapter.get_instrument(sym)
    if not inst:
        logger.warning(f"[WATCHLIST] Unknown instrument rejected: {sym}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": {
                    "code": "unknown_instrument",
                    "message": f"Instrument '{sym}' not found.",
                    "request_id": req_id,
                }
            },
        )

    try:
        res = store.add_to_watchlist(user_id, sym)
        return {
            "symbol": sym,
            "status": res["status"],
            "watchlist_count": res["watchlist_count"],
        }
    except ValueError as e:
        if str(e) == "watchlist_limit_reached":
            logger.warning(f"[WATCHLIST] User {user_id} hit max 50 items limit.")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "error": {
                        "code": "watchlist_limit_reached",
                        "message": "Watchlist limit of 50 stocks reached.",
                        "request_id": req_id,
                    }
                },
            )
        raise


@router.delete("/{symbol}")
def remove_from_watchlist_path(
    symbol: str,
    user_id: str = Depends(get_current_user_id),
    store: StateStore = Depends(get_state_store),
) -> Dict[str, Any]:
    """
    Removes a stock from user's watchlist by path parameter.
    """
    sym = symbol.strip().upper()
    res = store.remove_from_watchlist(user_id, sym)
    return {
        "symbol": sym,
        "status": "removed",
        "watchlist_count": res["watchlist_count"],
    }


@router.delete("")
def remove_from_watchlist_body(
    body: Optional[WatchlistAddRequest] = None,
    symbol: Optional[str] = None,
    user_id: str = Depends(get_current_user_id),
    store: StateStore = Depends(get_state_store),
) -> Dict[str, Any]:
    """
    Removes a stock from user's watchlist by body payload or query parameter.
    """
    target = body.symbol if body else symbol
    if not target:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": {
                    "code": "missing_symbol",
                    "message": "Please specify a symbol to remove.",
                    "request_id": request_id_ctx.get() or "req_watchlist",
                }
            },
        )
    sym = target.strip().upper()
    res = store.remove_from_watchlist(user_id, sym)
    return {
        "symbol": sym,
        "status": "removed",
        "watchlist_count": res["watchlist_count"],
    }
