"""
Pytest Test Suite: Leaderboard & PRD Section 2.4 Anti-Outlier Eligibility
Conformance: PRD Section 2.4 (Anti-Outlier Gate: >= 5 filled trades & >= 7 active days), docs/api.md
"""

from fastapi.testclient import TestClient

from app.core.state import get_state_store, OrderRecord, UserHolding


def test_leaderboard_basic_response(client: TestClient):
    store = get_state_store()
    store.reset()

    response = client.get("/api/leaderboard")
    assert response.status_code == 200

    data = response.json()
    assert "items" in data
    assert "as_of" in data
    assert isinstance(data["items"], list)
    assert len(data["items"]) >= 1

    for item in data["items"]:
        assert isinstance(item["rank"], int)
        assert item["rank"] >= 1
        assert "user_id" in item
        assert "display_name" in item
        assert isinstance(item["equity_paise"], int)
        assert isinstance(item["return_bps"], int)
        assert isinstance(item["trades_count"], int)
        assert isinstance(item["days_active"], int)
        assert isinstance(item["is_eligible"], bool)
        assert item["is_eligible"] is True  # Ranked items must be eligible per PRD §2.4


def test_leaderboard_anti_outlier_filtering(client: TestClient):
    """
    Empirically proves that lucky traders with < 5 trades or < 7 days active
    are filtered out by the anti-outlier gate per PRD Section 2.4.
    """
    store = get_state_store()
    store.reset()

    # User 1 (Lucky YOLO): 1 single trade, +50% return, 1 active day
    w1 = store.get_or_create_wallet("usr_yolo")
    w1.cash_paise = 15000000  # ₹1.5L
    store.get_or_create_profile("usr_yolo", "YOLO Lucky Trader")
    store.orders["ord_y1"] = OrderRecord(
        order_id="ord_y1", user_id="usr_yolo", symbol="RELIANCE", side="BUY", qty=1,
        status="FILLED", reserved_paise=0, target_trade_date="2026-10-09", client_order_id="c_y1"
    )

    # User 2 (Eligible Consistent Trader): 5 filled trades across 7 active dates, +10% return
    w2 = store.get_or_create_wallet("usr_grinder")
    w2.cash_paise = 11000000  # ₹1.1L
    store.get_or_create_profile("usr_grinder", "Consistent Grinder")
    dates_grinder = ["2026-10-01", "2026-10-02", "2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08", "2026-10-09"]
    for i in range(5):
        store.orders[f"ord_g_{i}"] = OrderRecord(
            order_id=f"ord_g_{i}", user_id="usr_grinder", symbol="TCS", side="BUY", qty=1,
            status="FILLED", reserved_paise=0, target_trade_date=dates_grinder[i], client_order_id=f"c_g_{i}"
        )
    # Add snapshots or trades on the remaining 2 dates
    store.orders["ord_g_extra1"] = OrderRecord(
        order_id="ord_g_extra1", user_id="usr_grinder", symbol="INFY", side="BUY", qty=1,
        status="FILLED", reserved_paise=0, target_trade_date=dates_grinder[5], client_order_id="c_g_extra1"
    )
    store.orders["ord_g_extra2"] = OrderRecord(
        order_id="ord_g_extra2", user_id="usr_grinder", symbol="INFY", side="SELL", qty=1,
        status="FILLED", reserved_paise=0, target_trade_date=dates_grinder[6], client_order_id="c_g_extra2"
    )

    # User 3 (Champion Trader): 8 trades across 8 active dates, +25% return
    w3 = store.get_or_create_wallet("usr_champ")
    w3.cash_paise = 12500000  # ₹1.25L
    store.get_or_create_profile("usr_champ", "Alpha Champion")
    dates_champ = ["2026-09-28", "2026-09-29", "2026-09-30", "2026-10-01", "2026-10-02", "2026-10-05", "2026-10-06", "2026-10-07"]
    for i in range(8):
        store.orders[f"ord_c_{i}"] = OrderRecord(
            order_id=f"ord_c_{i}", user_id="usr_champ", symbol="HDFCBANK", side="BUY", qty=1,
            status="FILLED", reserved_paise=0, target_trade_date=dates_champ[i], client_order_id=f"c_c_{i}"
        )

    # Query leaderboard
    res = client.get("/api/leaderboard")
    assert res.status_code == 200
    items = res.json()["items"]

    user_ranks = {it["user_id"]: it["rank"] for it in items}

    # Invariant 1: usr_champ (+25%) is ranked #1 among real users
    assert "usr_champ" in user_ranks
    assert user_ranks["usr_champ"] == 1

    # Invariant 2: usr_grinder (+10%) is ranked #2
    assert "usr_grinder" in user_ranks
    assert user_ranks["usr_grinder"] == 2

    # Invariant 3: usr_yolo (+50%) is NOT ranked at all because is_eligible is False (< 5 trades, < 7 days)
    assert "usr_yolo" not in user_ranks


def test_leaderboard_user_standing(client: TestClient):
    store = get_state_store()
    store.reset()

    # User with partial progress: 3 filled trades across 2 days
    user_id = "usr_student_progress"
    w = store.get_or_create_wallet(user_id)
    w.cash_paise = 10050000  # +50 bps
    store.orders["ord_p1"] = OrderRecord(
        order_id="ord_p1", user_id=user_id, symbol="RELIANCE", side="BUY", qty=1,
        status="FILLED", reserved_paise=0, target_trade_date="2026-10-08", client_order_id="c_p1"
    )
    store.orders["ord_p2"] = OrderRecord(
        order_id="ord_p2", user_id=user_id, symbol="TCS", side="BUY", qty=1,
        status="FILLED", reserved_paise=0, target_trade_date="2026-10-08", client_order_id="c_p2"
    )
    store.orders["ord_p3"] = OrderRecord(
        order_id="ord_p3", user_id=user_id, symbol="INFY", side="BUY", qty=1,
        status="FILLED", reserved_paise=0, target_trade_date="2026-10-09", client_order_id="c_p3"
    )

    # Authenticated call
    res = client.get("/api/leaderboard", headers={"Authorization": f"Bearer {user_id}"})
    assert res.status_code == 200

    standing = res.json()["user_standing"]
    assert standing is not None
    assert standing["trades_count"] == 3
    assert standing["days_active"] == 2
    assert standing["is_eligible"] is False
    assert standing["rank"] is None
    assert standing["equity_paise"] == 10050000
    assert standing["return_bps"] == 50


def test_leaderboard_timeframe_parameter(client: TestClient):
    res_all = client.get("/api/leaderboard?range=ALL")
    assert res_all.status_code == 200

    res_1m = client.get("/api/leaderboard?range=1M")
    assert res_1m.status_code == 200

    res_1w = client.get("/api/leaderboard?range=1W")
    assert res_1w.status_code == 200
