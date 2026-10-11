"""
Pytest Integration Test Suite: End-to-End Milestone M1 Trade Loop
Conformance: PRD Section 15.1 Milestone M1 Exit Criteria
"""

from fastapi.testclient import TestClient
from app.core.state import get_state_store


def test_end_to_end_trade_loop(client: TestClient):
    user_id = "usr_integration_lead"
    auth_header = {"Authorization": f"Bearer {user_id}"}
    store = get_state_store()

    # Step 1: User initialization & ₹1,00,000 starting cash
    wallet = store.get_or_create_wallet(user_id)
    assert wallet.cash_paise == 10000000
    assert wallet.reserved_paise == 0

    init_ledger = [l for l in store.ledger if l.user_id == user_id and l.entry_type == "INIT"]
    assert len(init_ledger) == 1
    assert init_ledger[0].cash_delta_paise == 10000000

    # Step 2: GET /api/status
    res_status = client.get("/api/status")
    assert res_status.status_code == 200
    status_data = res_status.json()
    assert "prices_as_of" in status_data
    assert "state" in status_data
    assert "market_open" in status_data

    # Step 3: GET /api/instruments (Search for RELIANCE)
    res_inst = client.get("/api/instruments?q=RELIANCE")
    assert res_inst.status_code == 200
    inst_items = res_inst.json()["items"]
    assert len(inst_items) >= 1
    reliance = next(i for i in inst_items if i["symbol"] == "RELIANCE")
    assert reliance["exchange"] == "NSE"
    assert reliance["last_close_paise"] > 0
    assert reliance["tradable"] is True

    # Step 4: POST /api/orders (Buy 10 shares of RELIANCE)
    order_payload = {
        "symbol": "RELIANCE",
        "side": "BUY",
        "qty": 10,
        "client_order_id": "c1000000-0000-0000-0000-000000000099",
    }
    res_order = client.post("/api/orders", json=order_payload, headers=auth_header)
    assert res_order.status_code == 201
    order_data = res_order.json()
    assert order_data["status"] == "PENDING"
    assert order_data["reserved_paise"] == 1541540
    assert "target_trade_date" in order_data

    # Verify wallet funds moved from cash to reserved
    assert wallet.reserved_paise == 1541540
    assert wallet.cash_paise == 10000000 - 1541540
    assert wallet.cash_paise + wallet.reserved_paise == 10000000

    # Step 5: GET /api/orders (Check pending order in history)
    res_orders = client.get("/api/orders", headers=auth_header)
    assert res_orders.status_code == 200
    orders_list = res_orders.json()["items"]
    assert len(orders_list) == 1
    assert orders_list[0]["id"] == order_data["order_id"]
    assert orders_list[0]["symbol"] == "RELIANCE"
    assert orders_list[0]["side"] == "BUY"
    assert orders_list[0]["qty"] == 10
    assert orders_list[0]["status"] == "PENDING"

    # Step 6: Single Instrument Detail GET /api/instruments/RELIANCE
    res_detail = client.get("/api/instruments/RELIANCE")
    assert res_detail.status_code == 200
    assert res_detail.json()["symbol"] == "RELIANCE"
    assert res_detail.json()["last_close_paise"] == reliance["last_close_paise"]
