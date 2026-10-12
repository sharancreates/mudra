import uuid
from typing import Optional
from fastapi import APIRouter, Header, HTTPException, Query, status
from app.core.logger import request_id_ctx, get_logger
from app.core.market_adapter import get_market_data_adapter
from app.core.math import calculate_buy_reservation, get_next_execution_date
from app.core.state import get_state_store, OrderRecord
from app.models.schemas import OrderRequest, OrderResponse, OrderItem, OrdersListResponse

logger = get_logger(__name__)
router = APIRouter(prefix="/api/orders", tags=["Orders"])


def _extract_user_id(authorization: Optional[str] = None) -> str:
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:].strip()
        if token:
            return token.split(".")[0] or "usr_demo"
    return "usr_demo"


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def place_order(
    req: OrderRequest,
    authorization: Optional[str] = Header(None),
):
    req_id = request_id_ctx.get() or f"req_{uuid.uuid4().hex[:8]}"
    user_id = _extract_user_id(authorization)
    store = get_state_store()
    adapter = get_market_data_adapter()

    symbol = req.symbol.strip().upper()
    side = req.side.upper()
    qty = req.qty
    client_order_id = req.client_order_id.strip()

    # 1. Validation: Quantity bounds
    if qty < 1 or qty > 100000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "bad_quantity",
                "message": "Quantity must be an integer between 1 and 100,000.",
                "request_id": req_id,
            },
        )

    # 2. Validation: Instrument lookup
    inst = adapter.get_instrument(symbol)
    if not inst:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "unknown_instrument",
                "message": f"Instrument {symbol} not found or inactive.",
                "request_id": req_id,
            },
        )

    last_close_paise = inst["last_close_paise"]

    # 3. Order Limit Check (PRD FR-26: Max ₹25,000 per order = 2,500,000 paise)
    trade_estimate_paise = last_close_paise * qty
    if trade_estimate_paise > 2500000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "bad_quantity",
                "message": "Order value exceeds ₹25,000 limit.",
                "request_id": req_id,
            },
        )

    with store.lock:
        # 4. Idempotency Check
        idempotency_key = f"{user_id}:{client_order_id}"
        if idempotency_key in store.client_orders:
            existing_order_id = store.client_orders[idempotency_key]
            existing_order = store.orders[existing_order_id]
            logger.info(f"Idempotent replay detected for order {existing_order_id}")
            return OrderResponse(
                order_id=existing_order.id,
                status=existing_order.status,
                target_trade_date=existing_order.target_trade_date,
                reserved_paise=existing_order.reserved_paise,
            )

        wallet = store.get_or_create_wallet(user_id)
        target_trade_date = get_next_execution_date()
        reserved_paise = 0

        if side == "BUY":
            reservation = calculate_buy_reservation(last_close_paise, qty)
            reserved_paise = reservation["total_reserved_paise"]

            if wallet.cash_paise < reserved_paise:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "code": "insufficient_cash",
                        "message": "Not enough virtual cash in wallet.",
                        "request_id": req_id,
                    },
                )

            # Mutate wallet cash reservation
            wallet.cash_paise -= reserved_paise
            wallet.reserved_paise += reserved_paise
        else:
            # SELL: Verify holdings
            holding_key = f"{user_id}:{symbol}"
            holding = store.holdings.get(holding_key)
            available_qty = (holding.qty - holding.reserved_qty) if holding else 0
            if available_qty < qty:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "code": "insufficient_holdings",
                        "message": "Not enough unreserved shares to place sell order.",
                        "request_id": req_id,
                    },
                )
            holding.reserved_qty += qty

        order_id = str(uuid.uuid4())
        order_record = OrderRecord(
            order_id=order_id,
            user_id=user_id,
            symbol=symbol,
            side=side,
            qty=qty,
            status="PENDING",
            reserved_paise=reserved_paise,
            target_trade_date=target_trade_date,
            client_order_id=client_order_id,
        )

        store.orders[order_id] = order_record
        store.client_orders[idempotency_key] = order_id

        return OrderResponse(
            order_id=order_id,
            status="PENDING",
            target_trade_date=target_trade_date,
            reserved_paise=reserved_paise,
        )


@router.get("", response_model=OrdersListResponse)
async def list_orders(
    status: Optional[str] = Query(None),
    symbol: Optional[str] = Query(None),
    authorization: Optional[str] = Header(None),
):
    user_id = _extract_user_id(authorization)
    store = get_state_store()

    with store.lock:
        user_orders = [o for o in store.orders.values() if o.user_id == user_id]

    if status:
        st = status.upper().strip()
        user_orders = [o for o in user_orders if o.status == st]

    if symbol:
        sym = symbol.upper().strip()
        user_orders = [o for o in user_orders if o.symbol == sym]

    # Sort descending by created_at
    user_orders.sort(key=lambda o: o.created_at, reverse=True)

    items = [
        OrderItem(
            id=o.id,
            symbol=o.symbol,
            side=o.side,
            qty=o.qty,
            status=o.status,
            reason=o.reason,
            fill_price_paise=o.fill_price_paise,
            created_at=o.created_at,
        )
        for o in user_orders
    ]

    return OrdersListResponse(items=items, next=None)
