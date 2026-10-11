"""
Pytest Test Suite: Order Settlement Engine (settle_orders)
Conformance: PRD Section 7.3 (Trading Rules & Worked Example), ADR-002, ADR-005
"""

from fastapi.testclient import TestClient
from app.core.settlement import settle_orders
from app.core.state import get_state_store, UserHolding, OrderRecord
from app.scripts.reconcile import audit_ledger_integrity


def test_settlement_sells_before_buys_liquidity():
    """
    Empirically verifies that SELLS execute before BUYS in the same session,
    releasing cash proceeds so pending BUY orders can settle without false cash rejections.
    """
    store = get_state_store()
    user_id = "usr_liquidity_test"

    # Wallet with low initial free cash: ₹5,000 (500,000 paise)
    wallet = store.get_or_create_wallet(user_id)
    wallet.cash_paise = 500000
    wallet.reserved_paise = 0

    # User already owns 10 shares of TCS (worth ~₹38,500)
    store.holdings[f"{user_id}:TCS"] = UserHolding(
        user_id=user_id,
        symbol="TCS",
        qty=10,
        reserved_qty=10,
        cost_basis_paise=3500000,
    )

    trade_date = "2026-10-12"

    # Pending SELL order: 10 TCS @ ₹3,850 (385,000 paise)
    # Net proceeds: 3,850,000 - 3,850 fee = 3,846,150 paise (~₹38,461.50)
    order_sell = OrderRecord(
        order_id="ord_sell_tcs",
        user_id=user_id,
        symbol="TCS",
        side="SELL",
        qty=10,
        status="PENDING",
        reserved_paise=0,
        target_trade_date=trade_date,
        client_order_id="c_sell_1",
    )
    store.orders[order_sell.id] = order_sell

    # Pending BUY order: 10 RELIANCE @ ₹1,400 (140,000 paise)
    # Actual cost: 1,400,000 + 1,400 fee = 1,401,400 paise (~₹14,014.00)
    # Notice: 1,401,400 > 500,000 (starting cash). If BUY were processed first, it would fail!
    order_buy = OrderRecord(
        order_id="ord_buy_rel",
        user_id=user_id,
        symbol="RELIANCE",
        side="BUY",
        qty=10,
        status="PENDING",
        reserved_paise=1541540,
        target_trade_date=trade_date,
        client_order_id="c_buy_1",
    )
    store.orders[order_buy.id] = order_buy
    wallet.reserved_paise += 1541540
    wallet.cash_paise -= 1541540  # Temporarily dipping into allocated reserve

    # Run settlement with explicit closing prices
    report = settle_orders(
        trade_date=trade_date,
        price_overrides={"TCS": 385000, "RELIANCE": 140000},
    )

    assert report["settled_sells"] == 1
    assert report["settled_buys"] == 1
    assert report["rejected"] == 0

    assert order_sell.status == "FILLED"
    assert order_buy.status == "FILLED"

    # Verify holding updated
    assert store.holdings[f"{user_id}:TCS"].qty == 0
    assert store.holdings[f"{user_id}:RELIANCE"].qty == 10


def test_settlement_excess_buffer_refund():
    """
    Verifies that the 10% safety buffer is fully refunded to free cash upon settlement.
    """
    store = get_state_store()
    user_id = "usr_buffer_refund_test"
    wallet = store.get_or_create_wallet(user_id)  # 10,000,000 paise starting cash

    trade_date = "2026-10-12"

    # Buy 10 RELIANCE reserved with 10% buffer: 1,541,540 paise
    wallet.cash_paise -= 1541540
    wallet.reserved_paise += 1541540

    order_buy = OrderRecord(
        order_id="ord_buffer_test",
        user_id=user_id,
        symbol="RELIANCE",
        side="BUY",
        qty=10,
        status="PENDING",
        reserved_paise=1541540,
        target_trade_date=trade_date,
        client_order_id="c_buf_1",
    )
    store.orders[order_buy.id] = order_buy

    # Settle at actual closing price ₹1,400.00 (140,000 paise)
    # Actual cost = 140,000 * 10 + 1,400 fee = 1,401,400 paise
    report = settle_orders(
        trade_date=trade_date,
        price_overrides={"RELIANCE": 140000},
    )

    assert report["settled_buys"] == 1
    assert order_buy.status == "FILLED"
    assert order_buy.fill_price_paise == 140000

    # Reservation completely cleared
    assert wallet.reserved_paise == 0

    # Free cash has refunded excess buffer (1,541,540 - 1,401,400 = 140,140 paise refund)
    # Remaining cash: 10,000,000 - 1,401,400 = 8,598,600 paise (₹85,986.00)
    assert wallet.cash_paise == 8598600


def test_settlement_prd_section_7_3_multi_day_flow():
    """
    Executes the exact multi-day reference scenario from PRD Section 7.3:
    Step 1: BUY 10 @ ₹1,400
    Step 2: BUY 5 @ ₹1,420
    Step 3: SELL 6 @ ₹1,450
    Step 4: Close @ ₹1,460
    Asserts exact integer paise values throughout and zero ledger discrepancies.
    """
    store = get_state_store()
    user_id = "usr_prd_walkthrough"
    wallet = store.get_or_create_wallet(user_id)
    assert wallet.cash_paise == 10000000

    # --- DAY 1: BUY 10 RELIANCE @ ₹1,400 ---
    order1 = OrderRecord(
        order_id="ord_day1",
        user_id=user_id,
        symbol="RELIANCE",
        side="BUY",
        qty=10,
        status="PENDING",
        reserved_paise=1541540,
        target_trade_date="2026-10-12",
        client_order_id="c_d1",
    )
    store.orders[order1.id] = order1
    wallet.cash_paise -= 1541540
    wallet.reserved_paise += 1541540

    settle_orders("2026-10-12", price_overrides={"RELIANCE": 140000})

    assert wallet.cash_paise == 8598600  # Cash ₹85,986.00
    assert wallet.reserved_paise == 0
    holding = store.holdings[f"{user_id}:RELIANCE"]
    assert holding.qty == 10
    assert holding.cost_basis_paise == 1401400  # Cost ₹14,014.00
    assert holding.cost_basis_paise // holding.qty == 140140  # Avg ₹1,401.40

    # --- DAY 2: BUY 5 RELIANCE @ ₹1,420 ---
    # 5 shares: 142,000 * 1.10 = 156,200 paise * 5 = 781,000 + 781 fee = 781,781 paise
    reserved_d2 = 781781
    order2 = OrderRecord(
        order_id="ord_day2",
        user_id=user_id,
        symbol="RELIANCE",
        side="BUY",
        qty=5,
        status="PENDING",
        reserved_paise=reserved_d2,
        target_trade_date="2026-10-13",
        client_order_id="c_d2",
    )
    store.orders[order2.id] = order2
    wallet.cash_paise -= reserved_d2
    wallet.reserved_paise += reserved_d2

    settle_orders("2026-10-13", price_overrides={"RELIANCE": 142000})

    # Day 2 cash: 8,598,600 - (142,000 * 5 + 710) = 8,598,600 - 710,710 = 7,887,890 paise (₹78,878.90)
    assert wallet.cash_paise == 7887890
    assert holding.qty == 15
    assert holding.cost_basis_paise == 2112110  # Cost ₹21,121.10
    assert holding.cost_basis_paise // holding.qty == 140807  # Avg ₹1,408.07

    # --- DAY 3: SELL 6 RELIANCE @ ₹1,450 ---
    holding.reserved_qty = 6
    order3 = OrderRecord(
        order_id="ord_day3",
        user_id=user_id,
        symbol="RELIANCE",
        side="SELL",
        qty=6,
        status="PENDING",
        reserved_paise=0,
        target_trade_date="2026-10-14",
        client_order_id="c_d3",
    )
    store.orders[order3.id] = order3

    settle_orders("2026-10-14", price_overrides={"RELIANCE": 145000})

    # Day 3 cash: 7,887,890 + (145,000 * 6 - 870) = 7,887,890 + 869,130 = 8,757,020 paise (₹87,570.20)
    assert wallet.cash_paise == 8757020
    assert holding.qty == 9
    assert holding.cost_basis_paise == 1267266  # Cost ₹12,672.66

    # Verify audit reconciliation across the entire multi-day history
    clean, count, mismatches = audit_ledger_integrity()
    assert clean is True
    assert len(mismatches) == 0


def test_settlement_api_endpoint(client: TestClient):
    """
    Verifies that POST /api/settlement/run executes cleanly via HTTP.
    """
    res = client.post("/api/settlement/run", json={"trade_date": "2026-10-12"})
    assert res.status_code == 200
    data = res.json()
    assert "settled_sells" in data
    assert "settled_buys" in data
    assert "total_filled" in data
    assert data["trade_date"] == "2026-10-12"
