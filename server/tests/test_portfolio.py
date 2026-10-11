"""
Tests for Portfolio, Snapshots, Equity History, and Ledger Endpoints (Python 3.10+)
Conformance: PRD Section 7.3 (Reference Scenario), FR-29, FR-30, FR-31, FR-32, FR-35, FR-36
"""

import pytest
from fastapi.testclient import TestClient

from app.core.market_adapter import get_market_data_adapter
from app.core.settlement import settle_orders
from app.core.snapshots import generate_portfolio_snapshots
from app.core.state import get_state_store, OrderRecord
from app.main import app
from app.scripts.reconcile import audit_ledger_integrity

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_state():
    store = get_state_store()
    store.reset()
    yield
    store.reset()


def test_prd_section_7_3_portfolio_api_walkthrough():
    """
    Empirically verifies that GET /api/portfolio reproduces PRD Section 7.3 numbers to the paisa:
    1. BUY 10 @ 1,400 -> Cash 85,986.00, Holding 10, Avg 1,401.40
    2. BUY 5 @ 1,420  -> Cash 78,878.90, Holding 15, Avg 1,408.07
    3. SELL 6 @ 1,450 -> Cash 87,570.20, Holding 9, Realized +242.86
    4. Close @ 1,460  -> Unrealized +467.34, Equity 1,00,710.20, Return +0.71%
    """
    store = get_state_store()
    user_id = "usr_section_7_3_lead"
    headers = {"Authorization": f"Bearer {user_id}"}

    # Step 0: Initial Wallet
    wallet = store.get_or_create_wallet(user_id)
    assert wallet.cash_paise == 10000000

    # Step 1: BUY 10 RELIANCE @ 1,400.00
    store.orders["ord_1"] = OrderRecord(
        order_id="ord_1",
        user_id=user_id,
        symbol="RELIANCE",
        side="BUY",
        qty=10,
        status="PENDING",
        reserved_paise=1541540,
        target_trade_date="2026-10-12",
        client_order_id="cli_step_1",
    )
    wallet.reserved_paise += 1541540
    wallet.cash_paise -= 1541540

    settle_orders(trade_date="2026-10-12", price_overrides={"RELIANCE": 140000})

    res1 = client.get("/api/portfolio", headers=headers)
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1["cash_paise"] == 8598600  # ₹85,986.00
    assert len(data1["holdings"]) == 1
    h1 = data1["holdings"][0]
    assert h1["qty"] == 10
    assert h1["avg_paise"] == 140140  # ₹1,401.40
    assert h1["invested_paise"] == 1401400  # ₹14,014.00

    # Step 2: BUY 5 RELIANCE @ 1,420.00
    store.orders["ord_2"] = OrderRecord(
        order_id="ord_2",
        user_id=user_id,
        symbol="RELIANCE",
        side="BUY",
        qty=5,
        status="PENDING",
        reserved_paise=781781,
        target_trade_date="2026-10-13",
        client_order_id="cli_step_2",
    )
    wallet.reserved_paise += 781781
    wallet.cash_paise -= 781781

    settle_orders(trade_date="2026-10-13", price_overrides={"RELIANCE": 142000})

    res2 = client.get("/api/portfolio", headers=headers)
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["cash_paise"] == 7887890  # ₹78,878.90
    h2 = data2["holdings"][0]
    assert h2["qty"] == 15
    assert h2["avg_paise"] == 140807  # ₹1,408.07
    assert h2["invested_paise"] == 2112110  # ₹21,121.10

    # Step 3: SELL 6 RELIANCE @ 1,450.00
    store.orders["ord_3"] = OrderRecord(
        order_id="ord_3",
        user_id=user_id,
        symbol="RELIANCE",
        side="SELL",
        qty=6,
        status="PENDING",
        reserved_paise=0,
        target_trade_date="2026-10-14",
        client_order_id="cli_step_3",
    )
    store.holdings[f"{user_id}:RELIANCE"].reserved_qty += 6

    settle_orders(trade_date="2026-10-14", price_overrides={"RELIANCE": 145000})

    res3 = client.get("/api/portfolio", headers=headers)
    assert res3.status_code == 200
    data3 = res3.json()
    assert data3["cash_paise"] == 8757020  # ₹87,570.20
    assert data3["realized_paise"] == 24286  # +₹242.86
    h3 = data3["holdings"][0]
    assert h3["qty"] == 9
    assert h3["invested_paise"] == 1267266  # ₹12,672.66
    assert h3["avg_paise"] == 140807  # ₹1,408.07

    # Step 4: Close moves to 1,460.00
    adapter = get_market_data_adapter()
    orig_close = adapter.instruments_map["RELIANCE"]["last_close_paise"]
    try:
        adapter.instruments_map["RELIANCE"]["last_close_paise"] = 146000

        res4 = client.get("/api/portfolio", headers=headers)
        assert res4.status_code == 200
        data4 = res4.json()
        assert data4["cash_paise"] == 8757020
        assert data4["realized_paise"] == 24286
        h4 = data4["holdings"][0]
        assert h4["value_paise"] == 1314000  # 9 * 146000 = ₹13,140.00
        assert h4["unrealized_paise"] == 46734  # +₹467.34
        assert data4["equity_paise"] == 10071020  # ₹1,00,710.20 (+0.71% return)

        # Reconciliation audit confirms zero discrepancy
        clean, count, mismatches = audit_ledger_integrity(store)
        assert clean is True
        assert len(mismatches) == 0
    finally:
        adapter.instruments_map["RELIANCE"]["last_close_paise"] = orig_close


def test_portfolio_history_and_ledger_endpoints():
    """
    Verifies GET /api/portfolio/history and GET /api/ledger contracts.
    """
    store = get_state_store()
    adapter = get_market_data_adapter()
    user_id = "usr_history_test"
    headers = {"Authorization": f"Bearer {user_id}"}

    store.get_or_create_wallet(user_id)

    # Day 1 Snapshot
    generate_portfolio_snapshots(trade_date="2026-10-12", state=store, market_adapter=adapter)
    # Day 2 Snapshot
    generate_portfolio_snapshots(trade_date="2026-10-13", state=store, market_adapter=adapter)

    # Query history
    res_hist = client.get("/api/portfolio/history?range=ALL", headers=headers)
    assert res_hist.status_code == 200
    points = res_hist.json()["points"]
    assert len(points) == 2
    assert points[0]["date"] == "2026-10-12"
    assert points[0]["equity_paise"] == 10000000
    assert points[1]["date"] == "2026-10-13"

    # Query ledger
    res_ledger = client.get("/api/ledger?page=1&limit=10", headers=headers)
    assert res_ledger.status_code == 200
    ledger_data = res_ledger.json()
    assert "items" in ledger_data
    assert len(ledger_data["items"]) >= 1
    assert ledger_data["items"][0]["type"] == "INIT"
    assert ledger_data["items"][0]["cash_delta_paise"] == 10000000
