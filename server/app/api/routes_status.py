from datetime import datetime, timezone
import os
from fastapi import APIRouter

from app.core.market_adapter import get_market_data_adapter
from app.core.state import get_state_store
from app.models.schemas import HealthResponse, StatusResponse

router = APIRouter(prefix="/api", tags=["Status"])


@router.get("/status", response_model=StatusResponse)
async def get_status():
    from app.main import get_app_uptime_seconds

    adapter = get_market_data_adapter()
    status_data = adapter.get_status()
    store = get_state_store()

    now_iso = datetime.now(timezone.utc).isoformat()
    uptime = get_app_uptime_seconds()

    db_mode = "postgresql" if os.getenv("DATABASE_URL") or os.getenv("SUPABASE_DB_URL") else "in_memory"

    components_data = {
        "market_adapter": {
            "status": "healthy" if status_data["state"] == "FRESH" else "degraded",
            "instruments_count": len(adapter.instruments_map),
            "prices_as_of": status_data["prices_as_of"],
        },
        "state_store": {
            "status": "healthy",
            "wallets_count": len(store.wallets),
            "orders_count": len(store.orders),
            "holdings_count": len(store.holdings),
            "profiles_count": len(store.profiles),
        },
    }

    return StatusResponse(
        prices_as_of=status_data["prices_as_of"],
        state=status_data["state"],
        market_open=status_data["market_open"],
        status="ok",
        version="0.2.0",
        uptime_seconds=uptime,
        timestamp=now_iso,
        database={
            "status": "connected",
            "mode": db_mode,
        },
        components=components_data,
    )


@router.get("/health", response_model=HealthResponse)
async def get_health():
    return HealthResponse(
        status="ok",
        timestamp=datetime.now(timezone.utc).isoformat(),
        version="0.2.0",
    )
