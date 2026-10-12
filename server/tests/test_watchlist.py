"""
Tests for Watchlist API Endpoints (Python 3.10+)
Conformance: PRD FR-38 (Watchlist add, remove, list, max 50 items)
"""

import pytest
from fastapi.testclient import TestClient

from app.core.market_adapter import get_market_data_adapter
from app.core.state import get_state_store
from app.main import app

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_state():
    store = get_state_store()
    store.reset()
    yield
    store.reset()


def test_watchlist_happy_path_crud():
    user_id = "usr_wl_user_1"
    headers = {"Authorization": f"Bearer {user_id}"}

    # 1. Initially empty
    res_get = client.get("/api/watchlist", headers=headers)
    assert res_get.status_code == 200
    assert res_get.json() == {"items": []}

    # 2. Add RELIANCE
    res_add = client.post("/api/watchlist", json={"symbol": "RELIANCE"}, headers=headers)
    assert res_add.status_code == 201
    add_data = res_add.json()
    assert add_data["symbol"] == "RELIANCE"
    assert add_data["status"] == "added"
    assert add_data["watchlist_count"] == 1

    # 3. Add TCS
    res_add2 = client.post("/api/watchlist", json={"symbol": "TCS"}, headers=headers)
    assert res_add2.status_code == 201
    assert res_add2.json()["watchlist_count"] == 2

    # 4. List enriched watchlist
    res_list = client.get("/api/watchlist", headers=headers)
    assert res_list.status_code == 200
    items = res_list.json()["items"]
    assert len(items) == 2
    symbols = [it["symbol"] for it in items]
    assert "RELIANCE" in symbols
    assert "TCS" in symbols

    rel = next(it for it in items if it["symbol"] == "RELIANCE")
    assert rel["name"] == "Reliance Industries Limited"
    assert rel["last_close_paise"] == 140000
    assert rel["exchange"] == "NSE"
    assert rel["tradable"] is True
    assert "added_at" in rel

    # 5. Delete RELIANCE via path parameter
    res_del = client.delete("/api/watchlist/RELIANCE", headers=headers)
    assert res_del.status_code == 200
    assert res_del.json()["status"] == "removed"
    assert res_del.json()["watchlist_count"] == 1

    # 6. Delete TCS via body
    res_del2 = client.request("DELETE", "/api/watchlist", json={"symbol": "TCS"}, headers=headers)
    assert res_del2.status_code == 200
    assert res_del2.json()["watchlist_count"] == 0

    # 7. Verify empty again
    res_final = client.get("/api/watchlist", headers=headers)
    assert len(res_final.json()["items"]) == 0


def test_watchlist_50_item_limit_enforced():
    """
    PRD FR-38: Limit of 50 items must be strictly enforced.
    """
    user_id = "usr_wl_limit_tester"
    headers = {"Authorization": f"Bearer {user_id}"}
    adapter = get_market_data_adapter()
    symbols = list(adapter.instruments_map.keys())
    assert len(symbols) >= 50, "Sample data must provide at least 50 instruments"

    # Add 50 stocks
    for sym in symbols[:50]:
        res = client.post("/api/watchlist", json={"symbol": sym}, headers=headers)
        assert res.status_code in (200, 201)

    # Verify count is 50
    res_list = client.get("/api/watchlist", headers=headers)
    assert len(res_list.json()["items"]) == 50

    # Attempt to add a 51st stock (if extra symbol exists, else test error directly)
    store = get_state_store()
    # Inject a 51st fake valid stock into adapter temporarily
    adapter.instruments_map["EXTRA51"] = {
        "id": "EXTRA51",
        "symbol": "EXTRA51",
        "name": "Extra 51",
        "exchange": "NSE",
        "sector": "Misc",
        "last_close_paise": 10000,
        "change_bps": 0,
        "as_of": "2026-10-09",
        "tradable": True,
    }
    try:
        res_overflow = client.post("/api/watchlist", json={"symbol": "EXTRA51"}, headers=headers)
        assert res_overflow.status_code == 400
        err = res_overflow.json()["error"]
        assert err["code"] == "watchlist_limit_reached"
        assert "50" in err["message"]
    finally:
        adapter.instruments_map.pop("EXTRA51", None)


def test_watchlist_unknown_instrument_rejected():
    user_id = "usr_wl_user_unknown"
    headers = {"Authorization": f"Bearer {user_id}"}

    res = client.post("/api/watchlist", json={"symbol": "NOT_A_REAL_STOCK_123"}, headers=headers)
    assert res.status_code == 400
    err = res.json()["error"]
    assert err["code"] == "unknown_instrument"


def test_watchlist_idempotent_operations():
    user_id = "usr_wl_idempotent"
    headers = {"Authorization": f"Bearer {user_id}"}

    # Add TCS
    res1 = client.post("/api/watchlist", json={"symbol": "TCS"}, headers=headers)
    assert res1.status_code == 201
    assert res1.json()["status"] == "added"

    # Add TCS again
    res2 = client.post("/api/watchlist", json={"symbol": "TCS"}, headers=headers)
    assert res2.status_code == 201
    assert res2.json()["status"] == "already_present"
    assert res2.json()["watchlist_count"] == 1

    # Delete twice
    del1 = client.delete("/api/watchlist/TCS", headers=headers)
    assert del1.status_code == 200
    assert del1.json()["watchlist_count"] == 0

    del2 = client.delete("/api/watchlist/TCS", headers=headers)
    assert del2.status_code == 200
    assert del2.json()["watchlist_count"] == 0
