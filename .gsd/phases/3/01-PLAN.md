---
phase: 3
plan: 1
wave: 1
depends_on:
  - 2.1
files_modified:
  - server/supabase/migrations/20261010000005_settle_orders.sql
  - supabase/migrations/20261010000005_settle_orders.sql
  - server/app/core/settlement.py
  - server/app/api/routes_settlement.py
  - server/app/main.py
  - server/tests/test_settlement.py
  - tests/trading/settle_orders.test.ts
autonomous: true
user_setup: []
must_haves:
  truths:
    - "settle_orders executes all pending orders targeting trade_date strictly processing SELLS before BUYS"
    - "Excess buy reservation buffer is accurately refunded to free cash upon fill"
    - "Holding cost basis updates include buy fees and realized P&L is recorded on sales"
    - "Ledger entries are created for every filled trade and fee, conserving total equity with zero discrepancies in reconciliation"
  artifacts:
    - server/supabase/migrations/20261010000005_settle_orders.sql
    - server/app/core/settlement.py
    - server/tests/test_settlement.py
---

# Plan 3.1: Order Settlement Engine (settle_orders) with Sells-Before-Buys Execution

<objective>
Implement the daily closing-price settlement engine `settle_orders(trade_date)`. Settle all pending orders targeting the trade date by fetching official closing prices, prioritizing SELL fills before BUY fills to unlock liquidity, releasing and refunding excess reservation buffers, updating weighted-average holding cost basis, and writing immutable ledger entries for trades and fees with zero accounting drift.
</objective>

<context>
Load for context:
- docs/api.md
- .gsd/SPEC.md
- docs/decisions.md (ADR-002, ADR-003, ADR-004, ADR-005)
- server/app/core/math.py
- server/app/core/state.py
- server/supabase/migrations/20261010000004_place_order.sql
</context>

<tasks>

<task type="auto">
  <name>Task 1: Author PostgreSQL settle_orders() Stored Procedure Migration</name>
  <files>
    server/supabase/migrations/20261010000005_settle_orders.sql
    supabase/migrations/20261010000005_settle_orders.sql
  </files>
  <action>
    Create migration `20261010000005_settle_orders.sql`:
    1. Define `public.settle_orders(p_trade_date date)` with `SECURITY DEFINER` and `set search_path = public`.
    2. Query all `PENDING` orders where `target_trade_date <= p_trade_date`.
    3. Order processing: `ORDER BY (case when side = 'SELL' then 1 else 2 end), created_at ASC`.
    4. Sells:
       - Lookup closing price for instrument on `p_trade_date`.
       - Calculate trade value (`close_paise * qty`) and 0.1% simulated fee (`(trade_val + 500) / 1000`).
       - Compute net cash proceeds (`trade_val - fee`).
       - Update holdings: decrement `qty` and `reserved_qty`, calculate cost of sold, calculate realized P&L, update `cost_basis_paise`.
       - Update wallet: increment `cash_paise` by net proceeds.
       - Update order: status = `'FILLED'`, `fill_price_paise = close_paise`, `fill_qty = qty`.
       - Insert ledger entries for `TRADE_SELL` and `FEE`.
    5. Buys:
       - Lookup closing price for instrument on `p_trade_date`.
       - Calculate trade value and 0.1% fee.
       - Calculate actual cost (`trade_val + fee`).
       - If `wallet.cash_paise + order.reserved_paise < actual_cost`:
         * Mark order `REJECTED`, reason = `'price_exceeded_cash'`.
         * Refund full `reserved_paise` back to `cash_paise`.
       - Else:
         * Deduct actual cost: `wallet.reserved_paise -= order.reserved_paise`, `wallet.cash_paise += (order.reserved_paise - actual_cost)`.
         * Upsert holding: increment `qty`, add `actual_cost` to `cost_basis_paise`.
         * Update order: status = `'FILLED'`, `fill_price_paise = close_paise`, `fill_qty = qty`.
         * Insert ledger entries for `TRADE_BUY` and `FEE`.
    6. Return JSON summary: `{"settled_sells": count_sells, "settled_buys": count_buys, "rejected": count_rejected}`.
  </action>
  <verify>
    Select-String -Path "server/supabase/migrations/20261010000005_settle_orders.sql" -Pattern "create or replace function public.settle_orders", "case when side = 'SELL'", "reserved_paise"
  </verify>
  <done>
    `20261010000005_settle_orders.sql` implements transactional order settlement with row locks and liquidity-first ordering.
  </done>
</task>

<task type="auto">
  <name>Task 2: Implement Settlement Engine in FastAPI & Expose Settlement Endpoint</name>
  <files>
    server/app/core/settlement.py
    server/app/api/routes_settlement.py
    server/app/main.py
  </files>
  <action>
    1. Create `server/app/core/settlement.py`:
       - `settle_orders(trade_date: Optional[str] = None) -> Dict[str, Any]`
       - Fetch closing prices from `market_adapter` for `trade_date`.
       - Process all pending orders in `state_store`:
         * Priority: SELLS first, then BUYS.
         * Enforce integer paise calculations via `app/core/math.py` with anti-float assertion guards.
         * Release reservation and refund excess buffer: `wallet.reserved_paise -= o.reserved_paise; wallet.cash_paise += (o.reserved_paise - actual_cost)`.
         * Update holdings (qty, cost basis, average price).
         * Insert immutable `LedgerEntry` rows for trades and fees.
       - Return summary dict with filled counts, total trade value, and fees collected.
    2. Create `server/app/api/routes_settlement.py`:
       - `POST /api/settlement/run`: Accepts `{ "trade_date": Optional[str] }`, invokes `settle_orders`, logs structured audit output, and returns settlement report.
    3. Register `routes_settlement` router in `server/app/main.py`.
  </action>
  <verify>
    `python -c "from app.core.settlement import settle_orders; print('Settlement module OK')"` exits 0.
  </verify>
  <done>
    FastAPI settlement engine and API endpoint are operational with structured debug logging.
  </done>
</task>

<task type="auto">
  <name>Task 3: Author Settlement Pytest & Node Test Suites Validating Section 7.3 Reference Flow</name>
  <files>
    server/tests/test_settlement.py
    tests/trading/settle_orders.test.ts
  </files>
  <action>
    1. Create `server/tests/test_settlement.py`:
       - **Sells-Before-Buys Test**: Place SELL and BUY in same session, verify sell cash proceeds are unlocked before buy settlement executes.
       - **Buffer Refund Test**: Buy order with 10% headroom buffer settles at closing price; assert excess buffer is refunded to cash.
       - **PRD Section 7.3 End-to-End Multi-Day Settlement**:
         * Day 1: Place BUY 10 RELIANCE @ 1,400 -> Settle -> verify cash, holdings, and ledger.
         * Day 2: Place BUY 5 RELIANCE @ 1,420 -> Settle -> verify updated cost basis ₹21,121.10 and avg ₹1,408.07.
         * Day 3: Place SELL 6 RELIANCE @ 1,450 -> Settle -> verify realized profit +₹242.86.
         * Verify `audit_ledger_integrity()` confirms zero discrepancies across all accounts.
    2. Create `tests/trading/settle_orders.test.ts` for Node test suite parity.
  </action>
  <verify>
    `pytest server/tests/test_settlement.py -v -s` passes 100%. `python -m pytest tests/ -v -s` passes all 18+ tests.
  </verify>
  <done>
    Settlement test suites pass with 0 failures, proving exact mathematical determinism and liquidity ordering.
  </done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] `server/supabase/migrations/20261010000005_settle_orders.sql` exists and defines `settle_orders`
- [ ] `pytest tests/test_settlement.py` passes all tests
- [ ] `python -m app.scripts.reconcile` reports 0 mismatches
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Sells-before-buys execution order empirically proven
- [ ] Section 7.3 multi-day settlement reproducing +₹242.86 realized P&L and 0 ledger discrepancies
</success_criteria>
