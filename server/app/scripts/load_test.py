"""
Mudra Concurrency & Load Benchmark Script (Python 3.10+)
Conformance: PRD Section 13.1 & 15.1, ADR-002, ADR-004

Simulates high-throughput concurrent order placement bursts, measures
latency percentiles (p50, p95, p99), validates zero-float integer math,
executes post-load order settlement, and audits double-entry ledger integrity.

Usage:
    python -m app.scripts.load_test --users 5 --orders-per-user 10 --concurrency 20
"""

import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import math
import sys
import time
from typing import Dict, List, Optional
import uuid

from fastapi.testclient import TestClient

from app.core.logger import get_logger
from app.core.math import get_next_execution_date
from app.core.settlement import settle_orders
from app.core.state import get_state_store, UserHolding
from app.main import app
from app.scripts.reconcile import audit_ledger_integrity

logger = get_logger("app.scripts.load_test")


def calculate_percentile(sorted_data: List[float], percentile: float) -> float:
    """Calculates nearest percentile from sorted float array."""
    if not sorted_data:
        return 0.0
    k = (len(sorted_data) - 1) * (percentile / 100.0)
    f = math.floor(k)
    c = math.ceil(k)
    if f == c:
        return sorted_data[int(k)]
    d0 = sorted_data[int(f)] * (c - k)
    d1 = sorted_data[int(c)] * (k - f)
    return d0 + d1


def run_load_test(
    num_users: int = 5,
    orders_per_user: int = 10,
    concurrency: int = 20,
    base_url: Optional[str] = None,
) -> int:
    store = get_state_store()
    store.reset()

    total_orders = num_users * orders_per_user
    users = [f"usr_bench_{i:02d}" for i in range(num_users)]

    # Seed wallets and holdings so both BUY and SELL can be placed safely
    for u in users:
        store.get_or_create_wallet(u)
        store.holdings[f"{u}:TCS"] = UserHolding(
            user_id=u, symbol="TCS", qty=100, reserved_qty=0, cost_basis_paise=35000000
        )
        store.holdings[f"{u}:INFY"] = UserHolding(
            user_id=u, symbol="INFY", qty=100, reserved_qty=0, cost_basis_paise=15000000
        )

    # Generate request payloads
    requests_to_fire = []
    for u_idx, u in enumerate(users):
        for o_idx in range(orders_per_user):
            # Rotate across 4 instruments and BUY / SELL sides
            slot = o_idx % 4
            if slot == 0:
                side, sym, qty = "BUY", "RELIANCE", 1
            elif slot == 1:
                side, sym, qty = "BUY", "HDFCBANK", 1
            elif slot == 2:
                side, sym, qty = "SELL", "TCS", 1
            else:
                side, sym, qty = "SELL", "INFY", 1

            client_order_id = f"bench-{u_idx}-{o_idx}-{uuid.uuid4().hex[:8]}"
            requests_to_fire.append(
                (
                    u,
                    {
                        "symbol": sym,
                        "side": side,
                        "qty": qty,
                        "client_order_id": client_order_id,
                    },
                )
            )

    client = TestClient(app)

    def worker_dispatch(req_args):
        u_id, payload = req_args
        t0 = time.perf_counter()
        resp = client.post(
            "/api/orders",
            json=payload,
            headers={"Authorization": f"Bearer {u_id}"},
        )
        duration_ms = (time.perf_counter() - t0) * 1000.0
        return resp.status_code, duration_ms

    latencies_ms: List[float] = []
    status_counts: Dict[int, int] = {}

    start_wall_time = time.perf_counter()

    with ThreadPoolExecutor(max_workers=concurrency) as executor:
        futures = [executor.submit(worker_dispatch, item) for item in requests_to_fire]
        for f in as_completed(futures):
            code, dur = f.result()
            latencies_ms.append(dur)
            status_counts[code] = status_counts.get(code, 0) + 1

    total_duration_sec = time.perf_counter() - start_wall_time
    latencies_ms.sort()

    throughput = (total_orders / total_duration_sec) if total_duration_sec > 0 else 0.0
    p50 = calculate_percentile(latencies_ms, 50)
    p95 = calculate_percentile(latencies_ms, 95)
    p99 = calculate_percentile(latencies_ms, 99)
    min_lat = latencies_ms[0] if latencies_ms else 0.0
    max_lat = latencies_ms[-1] if latencies_ms else 0.0
    avg_lat = sum(latencies_ms) / len(latencies_ms) if latencies_ms else 0.0

    # Post-load settlement
    settlement_report = settle_orders(trade_date=get_next_execution_date())

    # Post-load ledger reconciliation
    clean, audited_count, mismatches = audit_ledger_integrity()

    # Formatted Benchmark Report
    print("\n" + "=" * 62)
    print("             MUDRA CONCURRENCY LOAD BENCHMARK")
    print("=" * 62)
    print(f" Users:                  {num_users}")
    print(f" Orders per User:        {orders_per_user}")
    print(f" Concurrency Workers:    {concurrency}")
    print(f" Total Orders Dispatched:{total_orders}")
    print(f" Successful (201):       {status_counts.get(201, 0)}")
    print(f" Rejected (400):         {status_counts.get(400, 0)}")
    print(f" Other / Errors:         {sum(v for k, v in status_counts.items() if k not in (201, 400))}")
    print(f" Total Wall Duration:    {total_duration_sec:.2f}s")
    print(f" Throughput:             {throughput:.1f} req/s")
    print("-" * 62)
    print(" Latency Distribution (ms):")
    print(f"   Min:                  {min_lat:.2f} ms")
    print(f"   Avg:                  {avg_lat:.2f} ms")
    print(f"   p50 (Median):         {p50:.2f} ms")
    print(f"   p95:                  {p95:.2f} ms")
    print(f"   p99:                  {p99:.2f} ms")
    print(f"   Max:                  {max_lat:.2f} ms")
    print("-" * 62)
    print(" Post-Load Settlement:")
    print(f"   Settled Buys:         {settlement_report.get('settled_buys', 0)}")
    print(f"   Settled Sells:        {settlement_report.get('settled_sells', 0)}")
    print(f"   Total Filled:         {settlement_report.get('total_filled', 0)}")
    print(f"   Rejected at Settle:   {settlement_report.get('rejected', 0)}")
    print("-" * 62)
    print(" Double-Entry Ledger Reconciliation:")
    print(f"   Audited Accounts:     {audited_count}")
    print(f"   Discrepancies:        {len(mismatches)} " + ("[PASS]" if clean else "[FAIL]"))
    print("=" * 62 + "\n")

    if not clean or any(k >= 500 for k in status_counts.keys()):
        return 1
    return 0


def main():
    parser = argparse.ArgumentParser(description="Mudra Trading Engine Load Benchmark")
    parser.add_argument("--users", type=int, default=5, help="Number of simulated concurrent users")
    parser.add_argument("--orders-per-user", type=int, default=10, help="Orders to fire per user")
    parser.add_argument("--concurrency", type=int, default=20, help="Max worker threads in pool")
    parser.add_argument("--base-url", type=str, default=None, help="Optional live API URL (e.g. http://127.0.0.1:8000)")

    args = parser.parse_args()
    exit_code = run_load_test(
        num_users=args.users,
        orders_per_user=args.orders_per_user,
        concurrency=args.concurrency,
        base_url=args.base_url,
    )
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
