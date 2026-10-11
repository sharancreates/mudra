from typing import Optional
from fastapi import APIRouter
from pydantic import BaseModel
from app.core.settlement import settle_orders

router = APIRouter(prefix="/api/settlement", tags=["Settlement"])


class SettlementRunRequest(BaseModel):
    trade_date: Optional[str] = None


@router.post("/run")
async def run_settlement(req: Optional[SettlementRunRequest] = None):
    trade_date = req.trade_date if req else None
    result = settle_orders(trade_date=trade_date)
    return result
