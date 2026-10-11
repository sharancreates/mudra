# Plan 3.3 Summary: Portfolio Snapshots Generation & Historical Return Curves API

> **Status:** Completed ✅  
> **Wave:** 1  
> **Target:** PostgreSQL snapshots migration (`generate_portfolio_snapshots`), FastAPI portfolio and ledger endpoints (`/api/portfolio`, `/api/portfolio/history`, `/api/ledger`), client API client integration, and mathematical validation of PRD Section 7.3 to the paisa.

---

## 1. What Was Built

1. **PostgreSQL Migration (`public.generate_portfolio_snapshots(p_snapshot_date date)`)**:
   - Location: [20261010000006_portfolio_snapshots.sql](file:///c:/Users/MANAV/Desktop/Adani%20Uni/Projects/mudra/server/supabase/migrations/20261010000006_portfolio_snapshots.sql) (mirrored in [supabase/migrations/20261010000006_portfolio_snapshots.sql](file:///c:/Users/MANAV/Desktop/Adani%20Uni/Projects/mudra/supabase/migrations/20261010000006_portfolio_snapshots.sql)).
   - Stored procedure (`SECURITY DEFINER`) joining `holdings` with `daily_prices` on or before `p_snapshot_date`.
   - Computes total equity and `return_bps = ((equity - 10000000) * 10000) / 10000000`.
   - Upserts into `public.portfolio_snapshots` with primary key `(user_id, snapshot_date)`.

2. **FastAPI Portfolio & Ledger Route Handlers**:
   - Location: [routes_portfolio.py](file:///c:/Users/MANAV/Desktop/Adani%20Uni/Projects/mudra/server/app/api/routes_portfolio.py)
   - `GET /api/portfolio`: Returns user's free cash, reserved cash, active holdings (with `avg_paise`, `invested_paise`, `value_paise`, `unrealized_paise`, `unrealized_bps`), total equity, cumulative realized P&L, and prices as-of date. Conforms to `docs/api.md` Section 3.
   - `GET /api/portfolio/history?range=`: Returns historical daily equity snapshot points filtered by `1M`, `6M`, or `ALL`.
   - `GET /api/ledger?page=&limit=`: Returns append-only transaction history newest first.
   - Registered in [main.py](file:///c:/Users/MANAV/Desktop/Adani%20Uni/Projects/mudra/server/app/main.py).

3. **Client API Layer Integration**:
   - Updated [client/src/lib/api.ts](file:///c:/Users/MANAV/Desktop/Adani%20Uni/Projects/mudra/client/src/lib/api.ts) to query live `/api/portfolio`, `/api/portfolio/history`, and `/api/ledger` with offline fallback safety.

4. **Ledger Enhancement in State & Settlement**:
   - Updated [state.py](file:///c:/Users/MANAV/Desktop/Adani%20Uni/Projects/mudra/server/app/core/state.py) and [settlement.py](file:///c:/Users/MANAV/Desktop/Adani%20Uni/Projects/mudra/server/app/core/settlement.py) to store `realized_pl_paise`, `symbol`, `qty`, and `price_paise` on `LedgerEntry` for exact realized P&L aggregation.

---

## 2. Verification & Empirical Evidence

- **Python Pytest Suite**: **23/23 tests passed in 0.20s** ([server/tests/test_portfolio.py](file:///c:/Users/MANAV/Desktop/Adani%20Uni/Projects/mudra/server/tests/test_portfolio.py)):
  - `test_prd_section_7_3_portfolio_api_walkthrough`: Empirically validated all 4 steps of PRD Section 7.3:
    * Step 1: BUY 10 @ 1,400 -> Cash ₹85,986.00, Holding 10, Avg ₹1,401.40.
    * Step 2: BUY 5 @ 1,420 -> Cash ₹78,878.90, Holding 15, Avg ₹1,408.07.
    * Step 3: SELL 6 @ 1,450 -> Cash ₹87,570.20, Realized P&L +₹242.86.
    * Step 4: Close @ 1,460 -> Unrealized P&L +₹467.34, Equity ₹1,00,710.20 (+0.71% return).
    * Reconciliation audit passes with 0 mismatches.
  - `test_portfolio_history_and_ledger_endpoints`: Verified chronological snapshot curve points and paginated ledger entries.
- **Node.js Test Suite**: **22/22 tests passed in 280ms** ([tests/trading/portfolio.test.ts](file:///c:/Users/MANAV/Desktop/Adani%20Uni/Projects/mudra/tests/trading/portfolio.test.ts)).
- **Nightly Reconciliation Audit**: Confirms 0 discrepancies between wallet balances and ledger entries.

---

## 3. Key Decisions

- **Singleton Isolation in Test Fixtures**: Reset and restore instrument prices altered during scenario tests in a `try...finally` block to prevent downstream test price cross-contamination.
- **Pure Integer Paise Accounting**: All portfolio metrics (invested, value, unrealized, realized, equity) and basis points are strictly integer types with zero float contamination.
