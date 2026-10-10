---
phase: 1
plan: 7
wave: 3
depends_on:
  - 1.3
  - 1.4
  - 1.6
files_modified:
  - supabase/migrations/20261010000004_place_order.sql
  - tests/trading/place_order.test.ts
autonomous: true
user_setup: []
must_haves:
  truths:
    - "place_order() stored procedure runs with SECURITY DEFINER and locks the wallet row FOR UPDATE"
    - "Submitting duplicate client_order_id returns the existing order ID without duplicating reservations"
    - "BUY orders verify free cash and reserve estimated cost + fee + 10% buffer; SELL orders verify owned unreserved shares"
  artifacts:
    - supabase/migrations/20261010000004_place_order.sql
    - tests/trading/place_order.test.ts
---

# Plan 1.7: Virtual Trading Engine `place_order()` Stored Procedure

<objective>
Implement the central transactional order placement function in PostgreSQL. `place_order()` executes inside a single database transaction with row-level locks, enforces quantity bounds, idempotency via client UUIDs, calculates target execution dates based on the 15:30 IST cutoff, and atomically reserves cash (for buys with a 10% safety buffer) or shares (for sells) per PRD FR-16 to FR-21 and Proposal Section 8 & 9.
</objective>

<context>
Load for context:
- .gsd/SPEC.md
- docs/api.md
- .gsd/phases/1/RESEARCH.md
- supabase/migrations/20261010000001_initial_schema.sql
- supabase/migrations/20261010000003_rls_policies.sql
</context>

<tasks>

<task type="auto">
  <name>Author the place_order stored procedure migration</name>
  <files>supabase/migrations/20261010000004_place_order.sql</files>
  <action>
    Create `supabase/migrations/20261010000004_place_order.sql`:
    
    Steps:
    1. Define helper SQL functions if needed:
       - `get_next_trade_date(p_time timestamptz)` returning `date`: computes Asia/Kolkata date, checks 15:30 cutoff and `trading_calendar.is_open`.
       - `latest_close_paise(p_instrument_id uuid)` returning `bigint`: gets most recent closing price.
    2. Define `public.place_order(p_symbol text, p_side text, p_qty int, p_client_id uuid) RETURNS uuid`:
       - `LANGUAGE plpgsql SECURITY DEFINER SET search_path = public`.
       - Validate auth: `uid := auth.uid()`. If null, `RAISE EXCEPTION 'not_authenticated'`.
       - Validate side: `IF p_side NOT IN ('BUY', 'SELL') THEN RAISE EXCEPTION 'bad_side'; END IF;`.
       - Validate quantity: `IF p_qty < 1 OR p_qty > 100000 THEN RAISE EXCEPTION 'bad_quantity'; END IF;`.
       - Idempotency check:
         `SELECT id INTO oid FROM orders WHERE user_id = uid AND client_order_id = p_client_id;`
         `IF FOUND THEN RETURN oid; END IF;`
       - Instrument lookup:
         `SELECT * INTO inst FROM instruments WHERE symbol = upper(p_symbol) AND is_active;`
         `IF NOT FOUND THEN RAISE EXCEPTION 'unknown_instrument'; END IF;`
       - Row lock wallet:
         `SELECT * INTO w FROM wallets WHERE user_id = uid FOR UPDATE;`
       - Compute `tdate := get_next_trade_date(now());`
       - **BUY side:**
         * `last_close := latest_close_paise(inst.id);`
         * `est_price := (last_close * 110) / 100;` (10% safety buffer)
         * `est_cost := est_price * p_qty + ((est_price * p_qty * 1 + 500) / 1000);`
         * `IF w.cash_paise < est_cost THEN RAISE EXCEPTION 'insufficient_cash'; END IF;`
         * `UPDATE wallets SET cash_paise = cash_paise - est_cost, reserved_paise = reserved_paise + est_cost WHERE user_id = uid;`
       - **SELL side:**
         * `SELECT * INTO h FROM holdings WHERE user_id = uid AND instrument_id = inst.id FOR UPDATE;`
         * `IF NOT FOUND OR (h.qty - h.reserved_qty) < p_qty THEN RAISE EXCEPTION 'insufficient_holdings'; END IF;`
         * `UPDATE holdings SET reserved_qty = reserved_qty + p_qty WHERE user_id = uid AND instrument_id = inst.id;`
       - Insert into `orders`:
         `INSERT INTO orders (user_id, instrument_id, side, qty, status, reserved_paise, target_trade_date, client_order_id) VALUES (uid, inst.id, p_side, p_qty, 'PENDING', coalesce(est_cost, 0), tdate, p_client_id) RETURNING id INTO oid;`
       - Return `oid`.
    3. Grant execute privilege on `place_order` to `authenticated`.
    
    AVOID: Allowing unauthenticated calls, client-specified prices, or unlocked wallet rows during balance mutation.
    USE: Strict `SECURITY DEFINER` function with pessimistic row lock (`FOR UPDATE`).
  </action>
  <verify>
    Select-String -Path "supabase/migrations/20261010000004_place_order.sql" -Pattern "create or replace function place_order", "insufficient_cash", "FOR UPDATE"
  </verify>
  <done>
    `place_order` stored procedure migration is created with locking, validations, idempotency, and cash/holding reservations.
  </done>
</task>

<task type="auto">
  <name>Create automated order placement and idempotency test suite</name>
  <files>tests/trading/place_order.test.ts</files>
  <action>
    Create `tests/trading/place_order.test.ts` testing the order lifecycle:
    
    Steps:
    1. Test 1 (Happy Path Buy): Place buy order for 10 shares of RELIANCE with valid client UUID. Assert status `PENDING`, reserved paise moved from `cash_paise` to `reserved_paise`, and `target_trade_date` assigned.
    2. Test 2 (Idempotency): Submit same client UUID 5 consecutive times. Assert all calls return the exact same order UUID without altering wallet balances again.
    3. Test 3 (Insufficient Cash): Attempt buy order for 1,000 shares when wallet cash is insufficient. Assert exception `insufficient_cash` and zero balance changes.
    4. Test 4 (Invalid Quantities): Attempt orders with qty 0, negative (-5), fractional, and over-limit (> 100,000). Assert rejection with `bad_quantity`.
    5. Test 5 (Sell Validation): Attempt sell order for unowned stock. Assert exception `insufficient_holdings`.
    
    AVOID: Shallow mocking of stored procedure outputs.
    USE: Integration tests executing against database functions or SQL test harness.
  </action>
  <verify>
    Select-String -Path "tests/trading/place_order.test.ts" -Pattern "place_order", "insufficient_cash", "idempotency"
  </verify>
  <done>
    `tests/trading/place_order.test.ts` covers happy path buy, idempotency, insufficient cash, bad quantity, and sell validation.
  </done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] `supabase/migrations/20261010000004_place_order.sql` implements `place_order` with row locking and idempotency
- [ ] `tests/trading/place_order.test.ts` tests idempotency and validation edge cases
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
- [ ] Virtual trading engine core is bulletproof
</success_criteria>
