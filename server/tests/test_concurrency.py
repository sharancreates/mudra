"""
Pytest Test Suite: Concurrency Load Testing & Anti-Race Thread Hardening
Conformance: PRD Section 13.1 & 15.1, ADR-002, ADR-004

Tests:
1. test_single_user_50_concurrent_orders:
   - 50 concurrent BUY orders from 1 user with finite capital (₹1,00,000).
   - Verifies cash never goes negative, unfunded orders get clean 400 insufficient_cash,
     accepted + reserved + cash equals initial capital, and reconciliation audit passes.
2. test_multi_user_200_concurrent_orders:
   - 10 distinct users firing 20 concurrent orders each (200 total) across BUY and SELL.
   - Verifies no crashes, race conditions or deadlocks, and reconciliation reports 0 discrepancies.
3. test_parallel_idempotency_swarm:
   - 10 threads submitting the exact same client_order_id concurrently.
   - Verifies exactly 1 order created, identical response payload across all 10, and no double reservation.
"""

from concurrent.futures import ThreadPoolExecutor, as_completed
import uuid
from fastapi.testclient import TestClient

from app.core.math import get_next_execution_date
from app.core.settlement import settle_orders
from app.core.state import get_state_store, UserHolding
from app.scripts.reconcile import audit_ledger_integrity, run_reconciliation


def test_single_user_50_concurrent_orders(client: TestClient):
    store = get_state_store()
    store.reset()
    user_id = "usr_stress_50"

    # User initialized with ₹1,00,000 (10,000,000 paise)
    wallet = store.get_or_create_wallet(user_id)
    initial_cash_paise = wallet.cash_paise
    assert initial_cash_paise == 10000000

    # 50 concurrent BUY orders: 10 shares of RELIANCE (last close ~₹1,400 = 140,000 paise)
    # Trade estimate: 1,400,000 paise
    # 10% buffer + 0.1% fee: 154,000 * 10 = 1,540,000 paise + fee 1,540 = 1,541,540 paise reserved per order
    # Total demand across 50 orders: 50 * 1,541,540 = 77,077,000 paise (₹7,70,770)
    # With 10,000,000 paise starting capital, exactly 6 orders can be funded (6 * 1,541,540 = 9,249,240 paise)
    # The remaining 44 orders must be rejected with 400 insufficient_cash.
    order_requests = [
        {
            "symbol": "RELIANCE",
            "side": "BUY",
            "qty": 10,
            "client_order_id": f"c-stress-50-{i:03d}",
        }
        for i in range(50)
    ]

    def submit_order(payload):
        resp = client.post(
            "/api/orders",
            json=payload,
            headers={"Authorization": f"Bearer {user_id}"},
        )
        return resp.status_code, resp.json()

    results = []
    with ThreadPoolExecutor(max_workers=20) as executor:
        futures = [executor.submit(submit_order, req) for req in order_requests]
        for f in as_completed(futures):
            results.append(f.result())

    status_codes = [r[0] for r in results]
    success_count = status_codes.count(201)
    rejected_count = status_codes.count(400)

    # 1. Assert no crashes / unhandled exceptions
    assert success_count + rejected_count == 50, f"Unexpected status codes: {status_codes}"
    assert success_count == 6, f"Expected exactly 6 successful orders, got {success_count}"
    assert rejected_count == 44, f"Expected 44 rejected orders, got {rejected_count}"

    # 2. Check rejected responses have clean error code 'insufficient_cash'
    for code, body in results:
        if code == 400:
            assert body["error"]["code"] == "insufficient_cash"

    # 3. Assert invariant: cash_paise NEVER went negative
    assert wallet.cash_paise >= 0
    assert wallet.cash_paise == 10000000 - (6 * 1541540)
    assert wallet.reserved_paise == 6 * 1541540
    assert wallet.cash_paise + wallet.reserved_paise == initial_cash_paise

    # 4. Settle pending orders and run reconciliation audit
    settlement_report = settle_orders(trade_date=get_next_execution_date())
    assert settlement_report["settled_buys"] == 6
    assert settlement_report["rejected"] == 0

    clean, count, mismatches = audit_ledger_integrity()
    assert clean is True, f"Ledger reconciliation failed: {mismatches}"
    assert len(mismatches) == 0
    assert run_reconciliation() == 0


def test_multi_user_200_concurrent_orders(client: TestClient):
    store = get_state_store()
    store.reset()

    # 10 users: usr_multi_0 .. usr_multi_9
    num_users = 10
    users = [f"usr_multi_{i}" for i in range(num_users)]

    # Seed holdings for each user so SELL orders are valid
    # 50 shares of TCS and 50 shares of INFY each
    for u in users:
        store.get_or_create_wallet(u)
        store.holdings[f"{u}:TCS"] = UserHolding(user_id=u, symbol="TCS", qty=50, reserved_qty=0, cost_basis_paise=17500000)
        store.holdings[f"{u}:INFY"] = UserHolding(user_id=u, symbol="INFY", qty=50, reserved_qty=0, cost_basis_paise=8500000)

    # Prepare 20 orders per user = 200 orders total
    # Mix of BUY (1 share of RELIANCE, 1 share of HDFCBANK) and SELL (1 share of TCS, 1 share of INFY)
    orders_to_submit = []
    for user_idx, u in enumerate(users):
        for o_idx in range(20):
            if o_idx % 4 == 0:
                side, sym, qty = "BUY", "RELIANCE", 1
            elif o_idx % 4 == 1:
                side, sym, qty = "BUY", "HDFCBANK", 1
            elif o_idx % 4 == 2:
                side, sym, qty = "SELL", "TCS", 1
            else:
                side, sym, qty = "SELL", "INFY", 1

            orders_to_submit.append((
                u,
                {
                    "symbol": sym,
                    "side": side,
                    "qty": qty,
                    "client_order_id": f"c-multi-{user_idx}-{o_idx}-{uuid.uuid4().hex[:6]}",
                }
            ))

    def submit_user_order(args):
        u_id, payload = args
        resp = client.post(
            "/api/orders",
            json=payload,
            headers={"Authorization": f"Bearer {u_id}"},
        )
        return resp.status_code, resp.json()

    results = []
    with ThreadPoolExecutor(max_workers=30) as executor:
        futures = [executor.submit(submit_user_order, item) for item in orders_to_submit]
        for f in as_completed(futures):
            results.append(f.result())

    assert len(results) == 200
    # Every order should have been accepted (201 Created) because each user had ₹1,00,000 cash and 50 shares
    created_count = sum(1 for code, _ in results if code == 201)
    assert created_count == 200, f"Expected 200 created orders, got {created_count}"

    # Verify no wallet cash is negative
    for u in users:
        w = store.wallets[u]
        assert w.cash_paise >= 0
        assert w.reserved_paise >= 0

    # Execute settlement
    report = settle_orders(trade_date=get_next_execution_date())
    assert report["total_filled"] == 200
    assert report["rejected"] == 0

    # Zero-discrepancy reconciliation audit
    clean, count, mismatches = audit_ledger_integrity()
    assert clean is True, f"Reconciliation mismatches found: {mismatches}"
    assert count >= num_users
    assert len(mismatches) == 0
    assert run_reconciliation() == 0


def test_parallel_idempotency_swarm(client: TestClient):
    store = get_state_store()
    store.reset()
    user_id = "usr_swarm_idemp"
    wallet = store.get_or_create_wallet(user_id)
    initial_cash = wallet.cash_paise

    shared_client_order_id = "swarm-idempotency-unique-key-999"
    payload = {
        "symbol": "RELIANCE",
        "side": "BUY",
        "qty": 5,
        "client_order_id": shared_client_order_id,
    }

    def fire_same_order(thread_id):
        resp = client.post(
            "/api/orders",
            json=payload,
            headers={"Authorization": f"Bearer {user_id}"},
        )
        return resp.status_code, resp.json()

    # 10 threads hammer the endpoint at the exact same moment
    results = []
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = [executor.submit(fire_same_order, i) for i in range(10)]
        for f in as_completed(futures):
            results.append(f.result())

    # All 10 must succeed with 201 Created
    for code, body in results:
        assert code == 201, f"Expected 201, got {code}: {body}"

    # All 10 must return the EXACT same order_id
    order_ids = [body["order_id"] for _, body in results]
    assert len(set(order_ids)) == 1, f"Multiple order IDs created: {set(order_ids)}"

    # Exactly 1 order in store
    assert len(store.orders) == 1

    # Wallet reserved cash must be deducted exactly ONCE
    # 5 shares of RELIANCE @ 140,000 = 700,000. 10% buffer = 770,000 + 770 fee = 770,770 paise
    expected_reserved = 770770
    assert wallet.reserved_paise == expected_reserved
    assert wallet.cash_paise == initial_cash - expected_reserved

    # Settle and verify reconciliation
    settle_orders(trade_date=get_next_execution_date())
    clean, _, mismatches = audit_ledger_integrity()
    assert clean is True
    assert len(mismatches) == 0
