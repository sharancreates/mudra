"""
FastAPI Leaderboard Endpoints (Python 3.10+)
Conformance: PRD Section 2.4 (Anti-Outlier Gate: >= 5 filled trades & >= 7 active days), docs/api.md
"""

from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, Header, Query

from app.core.logger import get_logger
from app.core.state import get_state_store, StateStore
from app.models.schemas import LeaderboardResponse

logger = get_logger("app.api.routes_leaderboard")
router = APIRouter(prefix="/api/leaderboard", tags=["Leaderboard"])


def extract_optional_user_id(authorization: Optional[str] = Header(None)) -> Optional[str]:
    """Extracts user_id from Bearer token if present; returns None for public anonymous queries."""
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split("Bearer ", 1)[1].strip()
        if token and token not in ("null", "undefined"):
            return token.split(".")[0]
    return None


@router.get("", response_model=LeaderboardResponse)
def get_leaderboard_endpoint(
    range: str = Query("ALL", description="Timeframe filter (ALL, 1M, 1W)"),
    timeframe: Optional[str] = Query(None, description="Alternative timeframe parameter"),
    user_id: Optional[str] = Depends(extract_optional_user_id),
    store: StateStore = Depends(get_state_store),
) -> Dict[str, Any]:
    """
    Returns verified trader rankings sorted by return_bps descending.
    Applies PRD Section 2.4 anti-outlier gate: only users with >= 5 filled trades
    and >= 7 distinct trading days are assigned official ranks.
    If authenticated, includes personalized user_standing progress.
    """
    tf = timeframe or range or "ALL"
    logger.debug(f"[LEADERBOARD] Querying leaderboard for timeframe={tf}, user_id={user_id}")
    return store.get_leaderboard(timeframe=tf, user_id=user_id)
