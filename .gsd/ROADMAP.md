---
milestone: MVP v1.0
version: 1.0.0
updated: 2026-10-10T16:30:00+05:30
---

# ROADMAP.md — Mudra

> **Current Phase:** Phase 1: Foundation & Week 1 Backend Trade Loop (Week 1)  
> **Status:** ready_for_execution  
> **Active Lead (Executing):** Person B (Backend & Data)  
> **Collaborator:** Person A (Frontend & UX)

---

## Must-Haves (from SPEC & PRD)

- [ ] Complete trade loop: Auth → ₹1,00,000 Wallet → Stock Search → Market Order at Next Close → Settlement → Holdings & P&L.
- [ ] Strictly integer paise accounting (`bigint`) with immutable ledger and nightly reconciliation (0 discrepancies).
- [ ] Anti-tampering defense: RLS on all tables, direct writes revoked, trading executed strictly via `SECURITY DEFINER` stored procedures.
- [ ] End-of-day price transparency with freshness badges (FRESH / DELAYED / OUTDATED) and Practice Market fallback.
- [ ] ₹0 infrastructure cost using Vercel Hobby + Supabase Postgres/Auth + GitHub Actions cron.
- [ ] "No Real Money" safety gate (no payment gateways, bank/UPI fields, PAN/Aadhaar, or broker APIs).

---

## Phases

### Phase 1: Foundation & Week 1 Trade Loop (Week 1)
**Status:** ✅ Complete (Milestone M1 Verified)  
**Objective:** Establish PostgreSQL schema, RLS anti-tampering perimeter, Supabase auth wallet triggers, 50-stock sample market data adapter, trading math engine, transactional `place_order()` stored procedure, Next.js API routes, and nightly ledger reconciliation.

**Person B Execution Plans (Active):**
- **Plan 1.1: Data Licensing Enquiries & Contract Synchronization** (Wave 1)
  - Formal data licensing enquiries sent to NSE Data & Analytics, BSE, and vendors (`docs/data-licensing/enquiries.md`).
  - Architectural decisions ADR-004 to ADR-007 frozen in `docs/decisions.md`.
- **Plan 1.2: Database Migration Scaffold & Schema DDL Definition** (Wave 1)
  - Supabase configuration `supabase/config.toml`.
  - Schema migration `20261010000001_initial_schema.sql` defining 10 core tables in integer paise with CHECK constraints.
- **Plan 1.3: User Onboarding, Wallet Trigger & Immutable Ledger** (Wave 2)
  - Auth trigger `handle_new_user()` creating profile, ₹1,00,000 wallet (`10,000,000` paise), and `INIT` ledger row.
  - Immutability trigger `prevent_ledger_modification()` rejecting updates/deletions on `ledger_entries`.
- **Plan 1.4: Row Level Security & Anti-Tampering Hardening** (Wave 2)
  - Migration `20261010000003_rls_policies.sql` enabling RLS and revoking client-side write permissions on money tables.
  - Automated security test `tests/security/rls_tamper_test.ts` verifying cheat attempts fail.
- **Plan 1.5: 50-Stock Sample Data & Market Adapter Architecture** (Wave 2)
  - 50 liquid NSE stocks CSV `data/sample_prices.csv` (1-year history in paise) and database seed `supabase/seed.sql`.
  - Market data adapter `src/lib/data-adapter/index.ts` with Sample and Simulated modes, plus freshness logic.
- **Plan 1.6: Trading Math Engine & Acceptance Scenario Unit Tests** (Wave 3)
  - Fee (0.1%), date cutoff (15:30 IST), and holding math in `src/lib/trading/math.ts`.
  - Unit tests in `tests/trading/math.test.ts` reproducing PRD Section 7.3 worked example (+₹242.86 realized, +₹467.34 unrealized).
- **Plan 1.7: Virtual Trading Engine `place_order()` Stored Procedure** (Wave 3)
  - Migration `20261010000004_place_order.sql` with pessimistic wallet locks, 10% buy buffer, idempotency, and pending order creation.
  - Test suite `tests/trading/place_order.test.ts` verifying validations and duplicate request idempotency.
- **Plan 1.8: Next.js Route Handlers & JSON Contract Conformance** (Wave 4)
  - `POST` / `GET` `/api/orders` route handler with standardized error formatting.
  - `GET` `/api/instruments` and `/api/status` route handlers matching `docs/api.md`.
- **Plan 1.9: Week 1 Integration Verification & Ledger Reconciliation** (Wave 5)
  - Nightly reconciliation script `scripts/reconcile_wallets.ts` auditing `wallet = 10,000,000 + sum(ledger)`.
  - End-to-end integration test `tests/integration/week1_trade_loop.test.ts` validating Milestone M1 exit criteria.

**Person A Parallel Scope (Frontend & UX):**
- Wireframes for 6 screens, Landing page, Explorer UI with search, Stock Detail page with charts, and Order Sheet connected to mock/live API.

---

### Phase 2: FastAPI (Python) Backend Conversion with Debugging by Default
**Status:** ✅ Complete (FastAPI Conversion Verified)  
**Objective:** Convert the Mudra backend from TypeScript/Node route handlers to a standalone FastAPI (Python 3.10+) application under `server/`. Preserve all integer paise rules, PRD Section 7.3 reference acceptance criteria, and JSON contract conformance (`docs/api.md`). Equip the server with systematic debugging by default (structured debug request logging, rich traceback exception handling, anti-float assertion guards, and verbose pytest configuration).  
**Depends on:** Phase 1  
**Active Lead (Executing):** Person B (Backend and Data Lead)  
**Plans:**
- **Plan 2.1: FastAPI Backend Conversion with Debugging by Default** (`.gsd/phases/2/01-PLAN.md`) — **COMPLETE ✅**
  * Task 1: Setup Python Environment & Debugging-by-Default Infrastructure (`requirements.txt`, `pytest.ini`, `config.py`, `logger.py`)
  * Task 2: Implement Integer Paise Trading Math Engine with Anti-Float Guards (`app/core/math.py`, `tests/test_math.py`)
  * Task 3: Implement Market Data Adapter & Freshness Evaluator (`app/core/market_adapter.py`)
  * Task 4: Build FastAPI App, Pydantic Schemas, Debug Middleware & Route Handlers (`app/main.py`, `models/schemas.py`, `api/`)
  * Task 5: Author Pytest Test Suites & Nightly Ledger Reconciliation (`tests/test_place_order.py`, `scripts/reconcile.py`)
  * Task 6: Connect Person A's Frontend Proxy to FastAPI Backend (`next.config.mjs`, `client/src/lib/api.ts`)

---

### Phase 3: Full Trade Experience & Dashboard (Settlement & Snapshots)
**Status:** ✅ Complete (Phase 3 Verified)  
**Objective:** Deliver daily closing price settlement job (`settle_orders()`), portfolio dashboard, P&L calculations, transaction history, and watchlist.  
**Depends on:** Phase 2  

**Person A Scope (Frontend & UX):**
- [x] Plan 3.4A: Live Portfolio Curves, Audit Ledger & Watchlist UI (`04A-PLAN.md`) — **Complete ✅**
  * Dynamic SVG equity curve bound to `getPortfolioHistory(range)` with 1M/6M/ALL timeframes.
  * Append-only transaction audit ledger table from `/api/ledger`.
  * Client-side watchlist starring & filter across Explorer and Stock Detail.
  * Next-close 15:30 IST settlement queue banner.

**Person B Scope (Backend & Data):**
- [x] Plan 3.1: Order settlement stored procedure `settle_orders(trade_date)` with sells-before-buys ordering and cash releases.
- [x] Plan 3.2: Daily GitHub Actions price ingestion and settlement cron job (`.github/workflows/daily-prices.yml`).
- [x] Plan 3.3: Daily portfolio snapshot generation and return calculation (`portfolio_snapshots`).
- [x] Plan 3.4: Watchlist backend endpoints (`GET / POST / DELETE /api/watchlist`).
- [x] Plan 3.5: Concurrency load test (20-50 parallel orders leaving no negative balances or duplicate fills).

---

### Phase 4: Leaderboard, Hardening, Mobile Polish & Launch
**Status:** 🟡 In Progress  
**Objective:** Deploy public-ready MVP on Vercel with leaderboard, automated backups, health monitoring, and launch audit.  
**Depends on:** Phase 3  

**Person A Scope (Frontend & UX):**
- [x] Plan 4.1A: Public Leaderboard UI, Trader Rankings & Mobile Polish (`01A-PLAN.md`) — **Complete ✅**
  * Public `/leaderboard` page with Top 3 podium cards & rankings table.
  * PRD Section 2.4 anti-outlier eligibility gate (>= 5 trades, 7+ days).
  * Pinned "Your Standing" progress tracker card.
  * Header and overlay menu navigation integration.
  * Mobile floating action bar on stock detail page.
- [x] Plan 4.2A: Milestone M2 Launch-Readiness Polish & Statutory Compliance (`02A-PLAN.md`) — **Complete ✅**
  * Dedicated Watchlist empty state & filter reset in Explorer (`StockTable.tsx`).
  * Fresh user 0-trade onboarding state on Portfolio Dashboard.
  * Dedicated `/terms` statutory disclaimer page satisfying PRD §15.1 and footer integration.
  * Production OpenGraph, Twitter card, theme color, and mobile PWA viewport metadata (`layout.tsx`).
- [x] Plan 4.3A: Playwright E2E Suite & Multi-Device Mobile QA Verification (`03A-PLAN.md`) — **Complete ✅**
  * Automated headless browser smoke test: Sign-up → Place Market Order → View Queue → Check Ledger (W2-18, W3-14).
  * Multi-viewport assertion suite across 360px, 390px, and 768px viewports with zero horizontal overflow (W3-11).
  * Touch target accessibility verification (>= 44px).

**Person B Scope (Backend & Data):**
- Plan 4.1: Leaderboard SQL query & endpoint (`GET /api/leaderboard`) with 5 trades & 7 days eligibility filter.
- Plan 4.2: Automated weekly database backup workflow (`.github/workflows/weekly-backup.yml` using `pg_dump`).
- Plan 4.3: Health monitor and uptime check (`/api/status` + GitHub workflow).
- Plan 4.4: Rate limiting and abuse protection on API routes.
- Plan 4.5: Section 15.1 Launch Checklist audit and "No Real Money" verification.

---

## Progress Summary

| Phase | Description | Active Lead | Status | Target |
|-------|-------------|-------------|--------|--------|
| Phase 1 | Foundation & Week 1 Backend Trade Loop | Person B & Person A | ✅ Complete | Week 1 |
| Phase 2 | FastAPI (Python) Conversion with Debugging by Default | Person B | ✅ Complete | Week 1.5 |
| Phase 3 | Full Trade Experience & Settlement | Person B & Person A | ✅ Complete | Week 2 |
| Phase 4 | Leaderboard, Hardening & Launch | Person A (Done ✅) / Person B | 🟡 In Progress | Week 3 |
