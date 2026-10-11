---
phase: 3
plan: 3
wave: 1
depends_on:
  - 3.2
files_modified:
  - server/supabase/migrations/20261010000006_portfolio_snapshots.sql
  - supabase/migrations/20261010000006_portfolio_snapshots.sql
  - server/app/api/routes_portfolio.py
  - server/app/main.py
  - server/tests/test_portfolio.py
  - client/src/lib/api.ts
  - tests/trading/portfolio.test.ts
autonomous: true
user_setup: []
must_haves:
  truths:
    - "GET /api/portfolio returns exact cash, reserved, holdings valuation, realized/unrealized P&L in integer paise conforming to docs/api.md"
    - "GET /api/portfolio/history returns chronological equity curve points from daily snapshots"
    - "GET /api/ledger returns append-only transaction history matching wallet balances"
    - "PRD Section 7.3 worked example reproduces to the paisa through GET /api/portfolio (+₹242.86 realized, +₹467.34 unrealized, ₹1,00,710.20 equity)"
  artifacts:
    - server/supabase/migrations/20261010000006_portfolio_snapshots.sql
    - server/app/api/routes_portfolio.py
    - server/tests/test_portfolio.py
    - tests/trading/portfolio.test.ts
---

# Plan 3.3: Portfolio Snapshots Generation & Historical Return Curves API

<objective>
Implement the portfolio calculation, snapshot storage, and equity history engine. Deliver the PostgreSQL stored procedure `generate_portfolio_snapshots`, FastAPI routes `GET /api/portfolio`, `GET /api/portfolio/history`, and `GET /api/ledger`, and connect the frontend API client. Validate exact reproduction of PRD Section 7.3 numbers to the paisa.
</objective>

<context>
Load for context:
- docs/api.md
- .gsd/SPEC.md (FR-29 to FR-36, Section 7.3)
- server/app/core/snapshots.py
- server/app/core/settlement.py
- server/app/core/state.py
- client/src/lib/api.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Author PostgreSQL Migration for generate_portfolio_snapshots Stored Procedure</name>
  <files>
    server/supabase/migrations/20261010000006_portfolio_snapshots.sql
    supabase/migrations/20261010000006_portfolio_snapshots.sql
  </files>
  <action>
    Create migration `20261010000006_portfolio_snapshots.sql`:
    1. Define `public.generate_portfolio_snapshots(p_snapshot_date date)` with `SECURITY DEFINER` and `set search_path = public`.
    2. For every user profile/wallet:
       - Sum `holdings_value_paise` by joining `holdings` with `daily_prices` on `p_snapshot_date` (or latest available close).
       - Compute `equity_paise = cash_paise + reserved_paise + holdings_value_paise`.
       - Compute `return_bps = ((equity_paise - 10000000) * 10000) / 10000000`.
       - Upsert into `public.portfolio_snapshots (user_id, snapshot_date, cash_paise, holdings_value_paise, equity_paise, return_bps)`.
    3. Grant execute to `authenticated` and `service_role`.
  </action>
  <verify>
    Select-String -Path "server/supabase/migrations/20261010000006_portfolio_snapshots.sql" -Pattern "create or replace function public.generate_portfolio_snapshots", "portfolio_snapshots"
  </verify>
  <done>
    `20261010000006_portfolio_snapshots.sql` created in both server and root migrations directories.
  </done>
</task>

<task type="auto">
  <name>Task 2: Implement FastAPI Portfolio and Ledger Route Handlers</name>
  <files>
    server/app/api/routes_portfolio.py
    server/app/main.py
  </files>
  <action>
    1. Create `server/app/api/routes_portfolio.py`:
       - `GET /api/portfolio`:
         * Identifies user (Bearer JWT or `usr_test_default`).
         * Retrieves wallet (`cash_paise`, `reserved_paise`).
         * For each holding (`qty > 0`):
           - `avg_paise = cost_basis_paise // qty`
           - `invested_paise = cost_basis_paise`
           - `value_paise = qty * close_paise`
           - `unrealized_paise = value_paise - invested_paise`
         * Calculates `equity_paise = cash_paise + reserved_paise + sum(value_paise)`.
         * Calculates `realized_paise` from cumulative SELL trades in ledger.
         * Returns JSON conforming to `docs/api.md` Section 3.
       - `GET /api/portfolio/history?range=`:
         * Reads snapshots for user from `state.snapshots`.
         * If no snapshot exists yet, returns Day 0 point `{"date": today, "equity_paise": 10000000}`.
         * Formats points list: `[{"date": s.snapshot_date, "equity_paise": s.equity_paise}]`.
       - `GET /api/ledger?page=`:
         * Returns user's ledger entries newest first.
    2. Register `portfolio_router` in `server/app/main.py`.
  </action>
  <verify>
    `python -c "from app.api.routes_portfolio import router; print('Portfolio routes OK')"` exits 0.
  </verify>
  <done>
    Portfolio and ledger API endpoints exposed and conforming to `docs/api.md`.
  </done>
</task>

<task type="auto">
  <name>Task 3: Connect Frontend API Client to Portfolio and Ledger Endpoints</name>
  <files>
    client/src/lib/api.ts
  </files>
  <action>
    Update `client/src/lib/api.ts`:
    1. Update `getPortfolio()` to fetch from `/api/portfolio` first, falling back to mock only on network error.
    2. Add `getPortfolioHistory(range?: string)` calling `/api/portfolio/history?range={range}`.
    3. Add `getLedger(page?: number)` calling `/api/ledger?page={page}`.
  </action>
  <verify>
    `npm run build` or type-check passes.
  </verify>
  <done>
    Frontend API client connected to live portfolio, equity history, and transaction ledger endpoints.
  </done>
</task>

<task type="auto">
  <name>Task 4: Author Verification Test Suites for PRD Section 7.3 Multi-Day Portfolio & Curves</name>
  <files>
    server/tests/test_portfolio.py
    tests/trading/portfolio.test.ts
  </files>
  <action>
    1. Create `server/tests/test_portfolio.py`:
       - Test `GET /api/portfolio` matches Section 7.3 worked example exactly:
         * Step 1: BUY 10 RELIANCE @ 1,400 -> Cash ₹85,986, Holding 10, Cost ₹14,014.
         * Step 2: BUY 5 RELIANCE @ 1,420 -> Cash ₹78,878.90, Holding 15, Avg ₹1,408.07.
         * Step 3: SELL 6 RELIANCE @ 1,450 -> Cash ₹87,570.20, Realized P&L +₹242.86.
         * Step 4: Close moves to ₹1,460 -> Unrealized P&L +₹467.34, Equity ₹1,00,710.20 (+0.71%).
       - Test `GET /api/portfolio/history` returns daily equity points.
       - Test `GET /api/ledger` returns all transactions with sums equaling wallet total.
    2. Create `tests/trading/portfolio.test.ts` for Node test suite parity.
  </action>
  <verify>
    `python -m pytest server/tests/test_portfolio.py -v -s` passes 100%. `npm test` passes all tests.
  </verify>
  <done>
    Full mathematical accuracy and API contract empirically proven across Python and TypeScript test suites.
  </done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] `server/supabase/migrations/20261010000006_portfolio_snapshots.sql` exists and defines `generate_portfolio_snapshots`
- [ ] `GET /api/portfolio` reproduces Section 7.3 reference numbers (+₹242.86 realized, +₹467.34 unrealized, ₹1,00,710.20 equity)
- [ ] `GET /api/portfolio/history` returns historical curve points
- [ ] All Pytest and Node tests pass cleanly with 0 failures
</verification>

<success_criteria>
- [ ] PRD FR-29, FR-30, FR-31, FR-32, FR-35, FR-36 fully satisfied
- [ ] Integer paise preserved across all responses and calculations
- [ ] 0 reconciliation discrepancies
</success_criteria>
