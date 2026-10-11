from fastapi import APIRouter
from app.core.market_adapter import get_market_data_adapter
from app.models.schemas import StatusResponse

router = APIRouter(prefix="/api", tags=["Status"])


@router.get("/status", response_model=StatusResponse)
async def get_status():
    adapter = get_market_data_adapter()
    status_data = adapter.get_status()
    return StatusResponse(
        prices_as_of=status_data["prices_as_of"],
        state=status_data["state"],
        market_open=status_data["market_open"],
    )
