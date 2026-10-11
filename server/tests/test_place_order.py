"""
Pytest Test Suite: Order Placement & Idempotency Functionality
Conformance: PRD FR-16 to FR-21, FR-26 (Order Limits), docs/api.md
"""

from fastapi.testclient import TestClient
from app.core.state import get_state_store, UserHolding


def test_place_order_happy_path_buy(client: TestClient):
    # 10 shares of RELIANCE @ 140,000 paise (₹1,400.00)
    # 10% safety buffer: 154,000 paise
    # Trade value: 1,540,000 paise, Fee: 1,540 paise -> Total reserved: 1,541,540 paise
    payload = {
        "symbol": "RELIANCE",
        "side": "BUY",
        "qty": 10,
        "client_order_id": "c0000000-0000-0000-0000-000000000001",
    }
    response = client.post("/api/orders", json=payload, headers={"Authorization": "Bearer usr_alice"})
    assert response.status_code == 201

    data = response.json()
    assert "order_id" in data
    assert data["status"] == "PENDING"
    assert data["reserved_paise"] == 1541540
    assert "target_trade_date" in data

    # Verify wallet balances
    store = get_state_store()
    wallet = store.wallets["usr_alice"]
    assert wallet.reserved_paise == 1541540
    assert wallet.cash_paise == 10000000 - 1541540


def test_place_order_idempotency_guarantee(client: TestClient):
    payload = {
        "symbol": "RELIANCE",
        "side": "BUY",
        "qty": 5,
        "client_order_id": "c0000000-0000-0000-0000-000000000002",
    }

    # Send 5 identical requests
    responses = [
        client.post("/api/orders", json=payload, headers={"Authorization": "Bearer usr_bob"})
        for _ in range(5)
    ]

    # All must return 201 with identical order_id
    order_ids = [r.json()["order_id"] for r in responses]
    assert len(set(order_ids)) == 1

    # Wallet reserved only once
    store = get_state_store()
    wallet = store.wallets["usr_bob"]
    # 5 shares of RELIANCE: 154,000 * 5 = 770,000 paise + 770 fee = 770,770 paise
    assert wallet.reserved_paise == 770770
    assert len(store.orders) == 1


def test_place_order_insufficient_cash(client: TestClient):
    store = get_state_store()
    wallet = store.get_or_create_wallet("usr_charlie")
    wallet.cash_paise = 50000  # Only ₹500.00 left

    payload = {
        "symbol": "RELIANCE",
        "side": "BUY",
        "qty": 1,
        "client_order_id": "c0000000-0000-0000-0000-000000000003",
    }
    response = client.post("/api/orders", json=payload, headers={"Authorization": "Bearer usr_charlie"})
    assert response.status_code == 400

    err = response.json()["error"]
    assert err["code"] == "insufficient_cash"
    assert "request_id" in err


def test_place_order_quantity_validations(client: TestClient):
    # Non-positive quantity
    res_zero = client.post(
        "/api/orders",
        json={"symbol": "RELIANCE", "side": "BUY", "qty": 0, "client_order_id": "c4"},
    )
    assert res_zero.status_code == 400
    assert res_zero.json()["error"]["code"] == "bad_quantity"

    # Order exceeding ₹25,000 cap (e.g. 20 shares of RELIANCE @ ₹1,400 = ₹28,000 > ₹25,000)
    res_cap = client.post(
        "/api/orders",
        json={"symbol": "RELIANCE", "side": "BUY", "qty": 20, "client_order_id": "c5"},
    )
    assert res_cap.status_code == 400
    assert res_cap.json()["error"]["code"] == "bad_quantity"
    assert "limit" in res_cap.json()["error"]["message"].lower()


def test_place_order_unknown_instrument(client: TestClient):
    res = client.post(
        "/api/orders",
        json={"symbol": "NONEXISTENT", "side": "BUY", "qty": 1, "client_order_id": "c6"},
    )
    assert res.status_code == 404
    assert res.json()["error"]["code"] == "unknown_instrument"


def test_place_order_sell_validations(client: TestClient):
    store = get_state_store()

    # Attempt to sell without holding
    res_no_stock = client.post(
        "/api/orders",
        json={"symbol": "TCS", "side": "SELL", "qty": 5, "client_order_id": "c7"},
        headers={"Authorization": "Bearer usr_david"},
    )
    assert res_no_stock.status_code == 400
    assert res_no_stock.json()["error"]["code"] == "insufficient_holdings"

    # Seed 10 shares of TCS
    store.holdings["usr_david:TCS"] = UserHolding(user_id="usr_david", symbol="TCS", qty=10, reserved_qty=0)

    # Valid sell order for 6 shares
    res_sell = client.post(
        "/api/orders",
        json={"symbol": "TCS", "side": "SELL", "qty": 6, "client_order_id": "c8"},
        headers={"Authorization": "Bearer usr_david"},
    )
    assert res_sell.status_code == 201
    assert store.holdings["usr_david:TCS"].reserved_qty == 6
