---
phase: 3
plan: 5
wave: 1
depends_on:
  - 3.4
files_modified:
  - server/app/core/state.py
  - server/app/api/routes_orders.py
  - server/app/core/settlement.py
  - server/app/scripts/load_test.py
  - server/tests/test_concurrency.py
  - tests/trading/concurrency.test.ts
autonomous: true
user_setup: []
must_haves:
  truths:
    - "50 concurrent orders from a single user with finite cash leave no negative balances and no duplicate fills"
    - "200 parallel orders across multiple users process without deadlocks or accounting drift"
    - "Parallel swarm of identical client_order_ids creates exactly 1 order without duplicate reservation"
    - "Nightly reconciliation confirms 0 discrepancies across all accounts following heavy concurrent bursts"
  artifacts:
    - server/tests/test_concurrency.py
    - server/app/scripts/load_test.py
    - tests/trading/concurrency.test.ts
---

# Plan 3.5: Concurrency Load Testing & Anti-Race Thread Hardening

<objective>
Harden the trading engine against race conditions using thread-safe state locks, and validate with exhaustive concurrency tests: 50 parallel orders from one user, 200 parallel orders across multiple users, and parallel idempotency swarms. Prove that virtual cash never goes negative and ledger reconciliation passes with 0 mismatches per PRD Section 13.1 and 15.1.
</objective>

<context>
Load for context:
- docs/api.md
- .gsd/SPEC.md (PRD Section 13.1, 15.1)
- server/app/core/state.py
- server/app/api/routes_orders.py
- server/app/core/settlement.py
- server/app/scripts/reconcile.py
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add RLock Thread Synchronization to StateStore & Critical Sections</name>
  <files>
    server/app/core/state.py
    server/app/api/routes_orders.py
    server/app/core/settlement.py
  </files>
  <action>
    1. Update `StateStore` in `server/app/core/state.py` to initialize `self._lock = threading.RLock()`.
    2. Expose `lock` property and context manager helper.
    3. Wrap critical balance verification, reservation mutation, and order insertion in `server/app/api/routes_orders.py` inside `with store.lock:`.
    4. Wrap settlement loop in `server/app/core/settlement.py` inside `with store.lock:`.
  </action>
  <verify>
    `python -c "from app.core.state import get_state_store; s = get_state_store(); s.lock.acquire(); s.lock.release(); print('Lock OK')"` exits 0.
  </verify>
  <done>
    `StateStore` is thread-safe and protected against concurrent race conditions in Python.
  </done>
</task>

<task type="auto">
  <name>Task 2: Author Python Concurrency Load Test Suite</name>
  <files>
    server/tests/test_concurrency.py
  </files>
  <action>
    Create `server/tests/test_concurrency.py`:
    1. `test_single_user_50_concurrent_orders`:
       - User has ₹1,00,000 cash.
       - Launch 50 concurrent threads firing BUY orders (each asking ₹15,400).
       - Total demand: ₹7,70,000 (7.7x starting capital).
       - Assert that `wallet.cash_paise >= 0` at all times.
       - Assert that accepted orders + reserved cash + free cash == 10,000,000 paise.
       - Assert remaining orders cleanly fail with 400 `insufficient_cash`.
       - Execute settlement and verify `audit_ledger_integrity` reports 0 discrepancies.
    2. `test_multi_user_200_concurrent_orders`:
       - 10 distinct users firing 20 concurrent orders each (200 orders total) in parallel thread pool.
       - Mixture of BUY and SELL orders across various stocks.
       - Assert 0 unhandled exceptions or crashes.
       - Settle and verify reconciliation across all 10 users confirms 0 discrepancies.
    3. `test_parallel_idempotency_swarm`:
       - Send the same `client_order_id` simultaneously across 10 threads.
       - Assert exactly 1 order created, all 10 return identical `order_id`, and cash deducted only once.
  </action>
  <verify>
    `python -m pytest server/tests/test_concurrency.py -v -s` passes 100%.
  </verify>
  <done>
    Python concurrency suite proves zero race conditions, negative balances, or duplicate fills under stress.
  </done>
</task>

<task type="auto">
  <name>Task 3: Author TypeScript Concurrency Test Suite</name>
  <files>
    tests/trading/concurrency.test.ts
  </files>
  <action>
    Create `tests/trading/concurrency.test.ts`:
    1. Parallel execution with `Promise.all` simulating 50 concurrent orders on finite wallet.
    2. 200 parallel orders across multiple users.
    3. Parallel idempotency verification.
  </action>
  <verify>
    `npm test` passes all test suites.
  </verify>
  <done>
    Node.js test suite achieves parity with Python concurrency verification.
  </done>
</task>

<task type="auto">
  <name>Task 4: Implement Standalone Load Test Script</name>
  <files>
    server/app/scripts/load_test.py
  </files>
  <action>
    Create `server/app/scripts/load_test.py`:
    - CLI options: `--users`, `--orders-per-user`, `--concurrency`.
    - Simulates parallel requests against TestClient / live API.
    - Measures latency percentiles (p50, p95, p99), throughput (req/s), and error rates.
    - Executes settlement and performs zero-discrepancy reconciliation audit at completion.
  </action>
  <verify>
    `python -m app.scripts.load_test --users 5 --orders-per-user 10 --concurrency 20` runs and exits 0.
  </verify>
  <done>
    Standalone load test script available for benchmarking and CI audits.
  </done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] Pytest suite passes 100% including `test_concurrency.py`
- [ ] Node suite passes 100% including `concurrency.test.ts`
- [ ] Standalone `load_test.py` executes cleanly and confirms 0 reconciliation discrepancies
</verification>

<success_criteria>
- [ ] PRD Section 13.1 & 15.1 Concurrency exit criteria verified
- [ ] Zero negative cash balances under concurrent load
- [ ] Zero duplicate fills from idempotent replays
</success_criteria>
