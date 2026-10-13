"""
Pytest Test Suite: Rate Limiting & Abuse Protection Engine
Conformance: Phase 4 Plan 4.4, ADR-007, PRD NFR-3 (Abuse Protection)
"""

from fastapi.testclient import TestClient
import pytest

from app.core.rate_limit import get_rate_limiter
from app.core.state import get_state_store


@pytest.fixture(autouse=True)
def reset_limiter_and_state():
    """Resets rate limiter and state store before every test."""
    limiter = get_rate_limiter()
    limiter.reset()
    store = get_state_store()
    store.reset()
    yield
    limiter.reset()


def test_rate_limit_headers_decrement(client: TestClient):
    """
    Verifies that rate limit headers are present on tiered routes and
    X-RateLimit-Remaining decrements on each successive call.
    """
    res1 = client.get("/api/instruments")
    assert res1.status_code == 200
    assert "X-RateLimit-Limit" in res1.headers
    assert "X-RateLimit-Remaining" in res1.headers
    assert "X-RateLimit-Reset" in res1.headers

    limit = int(res1.headers["X-RateLimit-Limit"])
    rem1 = int(res1.headers["X-RateLimit-Remaining"])
    assert limit == 120
    assert rem1 == 119

    res2 = client.get("/api/instruments")
    assert res2.status_code == 200
    rem2 = int(res2.headers["X-RateLimit-Remaining"])
    assert rem2 == 118


def test_rate_limit_orders_quota_breach(client: TestClient):
    """
    Empirically verifies that exceeding the 20 orders/minute quota triggers
    HTTP 429 Too Many Requests with ADR-007 compliant error payload and headers.
    """
    user_id = "usr_rate_tester_1"
    store = get_state_store()
    w = store.get_or_create_wallet(user_id)
    w.cash_paise = 100000000  # ₹10 Lakhs so cash is never an issue

    headers = {"Authorization": f"Bearer {user_id}"}

    # Order limit is 20 per minute
    for i in range(20):
        order_payload = {
            "symbol": "RELIANCE",
            "side": "BUY",
            "qty": 1,
            "client_order_id": f"c_rl_{i}_{user_id}",
        }
        res = client.post("/api/orders", json=order_payload, headers=headers)
        assert res.status_code in (200, 201), f"Request {i} failed unexpectedly with {res.status_code}"
        assert res.headers.get("X-RateLimit-Remaining") == str(19 - i)

    # 21st request MUST be rejected with HTTP 429
    breach_payload = {
        "symbol": "RELIANCE",
        "side": "BUY",
        "qty": 1,
        "client_order_id": f"c_rl_breach_{user_id}",
    }
    breach_res = client.post("/api/orders", json=breach_payload, headers=headers)

    assert breach_res.status_code == 429
    assert breach_res.headers.get("Retry-After") is not None
    assert int(breach_res.headers.get("Retry-After")) >= 1
    assert breach_res.headers.get("X-RateLimit-Remaining") == "0"

    # ADR-007 error payload format verification
    err_body = breach_res.json()
    assert "error" in err_body
    assert err_body["error"]["code"] == "rate_limited"
    assert "request_id" in err_body["error"]
    assert "slow down" in err_body["error"]["message"].lower()


def test_rate_limit_user_isolation(client: TestClient):
    """
    Verifies that rate limiting is strictly isolated per authenticated user_id;
    exhausting User A's quota has zero impact on User B.
    """
    user_a = "usr_alice_quota"
    user_b = "usr_bob_quota"

    store = get_state_store()
    store.get_or_create_wallet(user_a).cash_paise = 100000000
    store.get_or_create_wallet(user_b).cash_paise = 100000000

    # Exhaust User A's orders quota (20)
    for i in range(20):
        client.post(
            "/api/orders",
            json={"symbol": "TCS", "side": "BUY", "qty": 1, "client_order_id": f"c_a_{i}"},
            headers={"Authorization": f"Bearer {user_a}"},
        )

    # User A is now throttled
    res_a = client.post(
        "/api/orders",
        json={"symbol": "TCS", "side": "BUY", "qty": 1, "client_order_id": "c_a_blocked"},
        headers={"Authorization": f"Bearer {user_a}"},
    )
    assert res_a.status_code == 429
    assert res_a.json()["error"]["code"] == "rate_limited"

    # User B should have full quota and succeed cleanly!
    res_b = client.post(
        "/api/orders",
        json={"symbol": "TCS", "side": "BUY", "qty": 1, "client_order_id": "c_b_clean"},
        headers={"Authorization": f"Bearer {user_b}"},
    )
    assert res_b.status_code in (200, 201)
    assert res_b.headers.get("X-RateLimit-Remaining") == "19"


def test_rate_limit_ip_isolation_for_anonymous(client: TestClient):
    """
    Verifies that anonymous callers are isolated by client IP address
    via X-Forwarded-For header.
    """
    ip_1 = "198.51.100.1"
    ip_2 = "198.51.100.2"

    # Call from IP 1
    res1 = client.get("/api/instruments", headers={"X-Forwarded-For": ip_1})
    assert res1.status_code == 200
    assert res1.headers.get("X-RateLimit-Remaining") == "119"

    # Call from IP 2
    res2 = client.get("/api/instruments", headers={"X-Forwarded-For": ip_2})
    assert res2.status_code == 200
    assert res2.headers.get("X-RateLimit-Remaining") == "119"


def test_rate_limit_exempt_endpoints(client: TestClient):
    """
    Verifies that critical health probes (/api/health and /api/status)
    are exempt from rate limiting headers and throttling.
    """
    for _ in range(25):
        h_res = client.get("/api/health")
        assert h_res.status_code == 200
        assert "X-RateLimit-Limit" not in h_res.headers

        s_res = client.get("/api/status")
        assert s_res.status_code == 200
        assert "X-RateLimit-Limit" not in s_res.headers


def test_rate_limiter_manual_reset(client: TestClient):
    """
    Verifies that limiter.reset() restores quotas immediately.
    """
    user_id = "usr_reset_tester"
    store = get_state_store()
    store.get_or_create_wallet(user_id).cash_paise = 100000000

    headers = {"Authorization": f"Bearer {user_id}"}

    # Exhaust quota
    for i in range(20):
        client.post(
            "/api/orders",
            json={"symbol": "INFY", "side": "BUY", "qty": 1, "client_order_id": f"c_rst_{i}"},
            headers=headers,
        )

    # 21st fails with 429
    blocked = client.post(
        "/api/orders",
        json={"symbol": "INFY", "side": "BUY", "qty": 1, "client_order_id": "c_rst_block"},
        headers=headers,
    )
    assert blocked.status_code == 429

    # Reset limiter
    get_rate_limiter().reset()

    # Next call succeeds!
    unblocked = client.post(
        "/api/orders",
        json={"symbol": "INFY", "side": "BUY", "qty": 1, "client_order_id": "c_rst_unblock"},
        headers=headers,
    )
    assert unblocked.status_code in (200, 201)
    assert unblocked.headers.get("X-RateLimit-Remaining") == "19"
