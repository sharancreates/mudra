"""
Pydantic v2 Models & Schemas
Conformance: docs/api.md frozen contracts
All monetary quantities strictly modeled as integer paise.
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class InstrumentSchema(BaseModel):
    symbol: str
    name: str
    exchange: str = "NSE"
    sector: str = "Equities"
    last_close_paise: int
    change_bps: int = 0
    as_of: str
    source: Optional[str] = "SAMPLE_EOD"
    tradable: Optional[bool] = True


class InstrumentsListResponse(BaseModel):
    items: List[InstrumentSchema]


class OrderRequest(BaseModel):
    symbol: str = Field(..., min_length=1)
    side: str = Field(..., pattern="^(BUY|SELL)$")
    qty: int = Field(..., ge=1, le=100000)
    client_order_id: str = Field(..., min_length=1)


class OrderResponse(BaseModel):
    order_id: str
    status: str = "PENDING"
    target_trade_date: str
    reserved_paise: int


class OrderItem(BaseModel):
    id: str
    symbol: str
    side: str
    qty: int
    status: str
    reason: Optional[str] = None
    fill_price_paise: Optional[int] = None
    created_at: str


class OrdersListResponse(BaseModel):
    items: List[OrderItem]
    next: Optional[str] = None


class StatusResponse(BaseModel):
    prices_as_of: str
    state: str
    market_open: bool


class ApiErrorDetail(BaseModel):
    code: str
    message: str
    request_id: str
    detail: Optional[str] = None


class ApiErrorResponse(BaseModel):
    error: ApiErrorDetail


class LeaderboardItem(BaseModel):
    rank: Optional[int] = None
    user_id: str
    display_name: str
    equity_paise: int
    return_bps: int
    trades_count: int
    days_active: int
    is_eligible: bool
    as_of: str


class UserStanding(BaseModel):
    rank: Optional[int] = None
    equity_paise: int
    return_bps: int
    trades_count: int
    days_active: int
    is_eligible: bool


class LeaderboardResponse(BaseModel):
    items: List[LeaderboardItem]
    user_standing: Optional[UserStanding] = None
    as_of: str
