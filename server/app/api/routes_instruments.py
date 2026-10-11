from typing import Optional
from fastapi import APIRouter, HTTPException, Query, status
from app.core.logger import request_id_ctx
from app.core.market_adapter import get_market_data_adapter
from app.models.schemas import InstrumentSchema, InstrumentsListResponse

router = APIRouter(prefix="/api/instruments", tags=["Instruments"])


@router.get("", response_model=InstrumentsListResponse)
async def list_instruments(
    q: Optional[str] = Query(None, description="Search query by symbol or company name"),
    sector: Optional[str] = Query(None, description="Filter by sector"),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
):
    adapter = get_market_data_adapter()
    offset = max(0, (page - 1) * limit)
    instruments = adapter.search_instruments(query=q, sector=sector, limit=limit, offset=offset)

    items = [
        InstrumentSchema(
            symbol=inst["symbol"],
            name=inst["name"],
            exchange=inst.get("exchange", "NSE"),
            sector=inst.get("sector", "Equities"),
            last_close_paise=inst["last_close_paise"],
            change_bps=inst.get("change_bps", 0),
            as_of=inst["as_of"],
            source=inst.get("source", "SAMPLE_EOD"),
            tradable=inst.get("tradable", True),
        )
        for inst in instruments
    ]

    return InstrumentsListResponse(items=items)


@router.get("/{symbol}", response_model=InstrumentSchema)
async def get_instrument(symbol: str):
    adapter = get_market_data_adapter()
    inst = adapter.get_instrument(symbol)

    if not inst:
        req_id = request_id_ctx.get() or "req_default"
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "unknown_instrument",
                "message": f"Instrument {symbol.upper()} not found or inactive.",
                "request_id": req_id,
            },
        )

    return InstrumentSchema(
        symbol=inst["symbol"],
        name=inst["name"],
        exchange=inst.get("exchange", "NSE"),
        sector=inst.get("sector", "Equities"),
        last_close_paise=inst["last_close_paise"],
        change_bps=inst.get("change_bps", 0),
        as_of=inst["as_of"],
        source=inst.get("source", "SAMPLE_EOD"),
        tradable=inst.get("tradable", True),
    )
