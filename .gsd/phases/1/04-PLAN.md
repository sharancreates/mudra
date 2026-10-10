---
phase: 1
plan: 4
wave: 2
depends_on:
  - 1.2
files_modified:
  - supabase/migrations/20261010000003_rls_policies.sql
  - tests/security/rls_tamper_test.ts
autonomous: true
user_setup: []
must_haves:
  truths:
    - "Row Level Security (RLS) is active on every table in the public schema"
    - "Direct INSERT/UPDATE/DELETE queries to money tables by authenticated or anon roles fail with permission errors"
    - "Automated security tests empirically verify tamper resistance"
  artifacts:
    - supabase/migrations/20261010000003_rls_policies.sql
    - tests/security/rls_tamper_test.ts
---

# Plan 1.4: Row Level Security & Anti-Tampering Hardening

<objective>
Configure comprehensive PostgreSQL Row Level Security (RLS) policies across all database tables, revoke direct mutation privileges from client roles on money tables, and construct an automated security test asserting that client-side tampering attempts are rejected per PRD NFR-5 and Proposal Section 8.3.
</objective>

<context>
Load for context:
- .gsd/SPEC.md
- docs/api.md
- .gsd/phases/1/RESEARCH.md
- supabase/migrations/20261010000001_initial_schema.sql
</context>

<tasks>

<task type="auto">
  <name>Author PostgreSQL Row Level Security migration</name>
  <files>supabase/migrations/20261010000003_rls_policies.sql</files>
  <action>
    Create `supabase/migrations/20261010000003_rls_policies.sql`:
    
    Steps:
    1. Enable RLS on all tables: `profiles`, `wallets`, `instruments`, `daily_prices`, `orders`, `ledger_entries`, `holdings`, `watchlist_items`, `portfolio_snapshots`, `trading_calendar`.
    2. Read policies for public market data:
       - `instruments`, `daily_prices`, `trading_calendar`: `CREATE POLICY select_public_data ON <table> FOR SELECT TO authenticated, anon USING (true);`.
    3. User-isolated read policies:
       - `profiles`: `FOR SELECT USING (true)` (needed for leaderboard/discovery) and `FOR UPDATE USING (user_id = auth.uid())` (display name change only).
       - `wallets`, `holdings`, `orders`, `ledger_entries`, `portfolio_snapshots`: `FOR SELECT TO authenticated USING (user_id = auth.uid());`.
       - `watchlist_items`: `FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());`.
    4. Revoke direct writes from browser roles:
       - `REVOKE INSERT, UPDATE, DELETE ON public.wallets, public.holdings, public.orders, public.ledger_entries, public.portfolio_snapshots FROM authenticated, anon;`.
       - Grant execution on future security definer functions to `authenticated`.
    
    AVOID: Permitting client-side inserts or updates to `orders`, `wallets`, or `ledger_entries`.
    USE: Explicit `REVOKE` statements combined with row-owner `SELECT` policies.
  </action>
  <verify>
    Select-String -Path "supabase/migrations/20261010000003_rls_policies.sql" -Pattern "ENABLE ROW LEVEL SECURITY", "REVOKE INSERT, UPDATE, DELETE"
  </verify>
  <done>
    `20261010000003_rls_policies.sql` contains rigorous RLS rules and write revokes for all money tables.
  </done>
</task>

<task type="auto">
  <name>Create automated anti-tampering security test</name>
  <files>tests/security/rls_tamper_test.ts</files>
  <action>
    Create `tests/security/rls_tamper_test.ts` using Vitest / test runner:
    
    Steps:
    1. Simulate an authenticated user session using Supabase client with standard user JWT / mock auth context.
    2. Attempt direct exploit queries:
       - Exploit 1: `UPDATE wallets SET cash_paise = 999999999 WHERE user_id = auth.uid()`.
       - Exploit 2: `INSERT INTO orders (...) VALUES (...)` directly bypassing `place_order()`.
       - Exploit 3: `DELETE FROM ledger_entries WHERE ...`.
       - Exploit 4: `SELECT * FROM wallets WHERE user_id = 'different-user-id'`.
    3. Assert all exploit attempts are rejected (permission denied / row not found / error returned).
    4. Assert legitimate query `SELECT * FROM wallets WHERE user_id = auth.uid()` succeeds and returns correct balance.
    
    AVOID: Relying on superficial assertions or mocking the database response.
    USE: Direct execution assertions testing SQL policy enforcement.
  </action>
  <verify>
    Select-String -Path "tests/security/rls_tamper_test.ts" -Pattern "insufficient_privilege", "wallets", "test"
  </verify>
  <done>
    `tests/security/rls_tamper_test.ts` defines comprehensive anti-tampering test cases covering all money-table attack vectors.
  </done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] `supabase/migrations/20261010000003_rls_policies.sql` enables RLS and revokes write grants
- [ ] `tests/security/rls_tamper_test.ts` covers wallet updates, direct order insertion, and ledger modification
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
- [ ] Database defense-in-depth security perimeter established
</success_criteria>
