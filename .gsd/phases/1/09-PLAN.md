---
phase: 1
plan: 9
wave: 5
depends_on:
  - 1.4
  - 1.8
files_modified:
  - scripts/reconcile_wallets.ts
  - tests/integration/week1_trade_loop.test.ts
autonomous: true
user_setup: []
must_haves:
  truths:
    - "Nightly reconciliation script checks that wallet.cash + reserved = starting_cash + sum(ledger) for all users with 0 mismatches"
    - "End-to-end integration test passes the complete Week 1 trade flow in under 2 minutes"
    - "Section 15.1 Milestone M1 exit criteria are empirically verified"
  artifacts:
    - scripts/reconcile_wallets.ts
    - tests/integration/week1_trade_loop.test.ts
---

# Plan 1.9: Week 1 Integration Verification & Ledger Reconciliation

<objective>
Deliver the automated nightly reconciliation audit script and execute the end-to-end Week 1 integration test suite. Prove that the entire Person B backend foundation satisfies Milestone M1 exit criteria: a user registers, receives ₹1,00,000, searches instruments, places a pending buy order with cash reservation, direct tampering fails, and ledger reconciliation balances to 0 discrepancies per PRD FR-46, NFR-4, and Milestone M1.
</objective>

<context>
Load for context:
- .gsd/SPEC.md
- docs/api.md
- .gsd/phases/1/RESEARCH.md
- supabase/migrations/20261010000001_initial_schema.sql
- supabase/migrations/20261010000004_place_order.sql
</context>

<tasks>

<task type="auto">
  <name>Implement nightly ledger reconciliation script</name>
  <files>scripts/reconcile_wallets.ts</files>
  <action>
    Create `scripts/reconcile_wallets.ts` implementing the PRD FR-46 reconciliation audit:
    
    Steps:
    1. Connect to PostgreSQL with service role / admin context.
    2. Query all wallets and calculate ledger balance:
       ```sql
       SELECT 
         w.user_id,
         w.cash_paise,
         w.reserved_paise,
         (w.cash_paise + w.reserved_paise) AS total_wallet_paise,
         COALESCE(SUM(l.cash_delta_paise), 0) AS total_ledger_delta_paise
       FROM wallets w
       LEFT JOIN ledger_entries l ON w.user_id = l.user_id
       GROUP BY w.user_id, w.cash_paise, w.reserved_paise;
       ```
    3. For every user, verify:
       `total_wallet_paise === total_ledger_delta_paise`.
       (Since initial capital is recorded as an `INIT` ledger row with `+10,000,000` paise, total wallet cash + reserved must equal the sum of all ledger cash deltas).
    4. If any mismatch is found:
       - Log severe error with user ID, wallet total, and ledger sum.
       - Exit with non-zero exit code (`process.exit(1)`).
    5. If all users match:
       - Log: `Reconciliation clean: {N} users audited, 0 mismatches.`
       - Exit with code 0.
    
    AVOID: Ignoring discrepancies or allowing tolerance thresholds for rounding.
    USE: Strict exact integer equality across 100% of wallets.
  </action>
  <verify>
    Select-String -Path "scripts/reconcile_wallets.ts" -Pattern "reconciliation", "cash_delta_paise", "mismatch"
  </verify>
  <done>
    `scripts/reconcile_wallets.ts` executes the nightly reconciliation query and raises an alert if any discrepancy exists.
  </done>
</task>

<task type="auto">
  <name>Author end-to-end Week 1 trade loop test suite</name>
  <files>tests/integration/week1_trade_loop.test.ts</files>
  <action>
    Create `tests/integration/week1_trade_loop.test.ts` validating Milestone M1 end-to-end:
    
    Steps:
    1. Step 1 (Registration): Create new test user in auth. Assert profile is created, wallet has `10,000,000` cash, `0` reserved, and `INIT` entry exists in `ledger_entries`.
    2. Step 2 (Instrument Search): Call `/api/instruments?q=RELIANCE`. Assert RELIANCE is returned with valid last close and date.
    3. Step 3 (Pending Order): Submit `POST /api/orders` for 10 shares of RELIANCE with unique client UUID.
       - Assert response is 201 Created with status `PENDING` and assigned `target_trade_date`.
       - Assert wallet `reserved_paise` equals `est_price * 10 + fee` (including 10% safety buffer).
       - Assert wallet `cash_paise` equals `10,000,000 - reserved_paise`.
    4. Step 4 (Order History): Call `GET /api/orders`. Assert the pending order appears with status `PENDING`.
    5. Step 5 (Anti-Tampering Gate): Attempt to directly update wallet cash via normal client. Assert permission denied.
    6. Step 6 (Reconciliation): Run reconciliation routine. Assert 0 mismatches.
    
    AVOID: Skipping the integration test before declaring Week 1 complete.
    USE: Automated execution proving all Person B exit criteria are met.
  </action>
  <verify>
    Select-String -Path "tests/integration/week1_trade_loop.test.ts" -Pattern "describe", "RELIANCE", "PENDING", "reconciliation"
  </verify>
  <done>
    `tests/integration/week1_trade_loop.test.ts` executes and validates all Milestone M1 criteria end-to-end.
  </done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] `scripts/reconcile_wallets.ts` checks wallet vs ledger sums
- [ ] `tests/integration/week1_trade_loop.test.ts` runs the full lifecycle from signup to pending order and reconciliation
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
- [ ] Milestone M1 exit criteria fully satisfied
</success_criteria>
