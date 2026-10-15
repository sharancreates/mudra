# STATE.md — Current Project State: Mudra

> **Last Updated:** 2026-10-15 20:25 IST  
> **Active Milestone:** v1.0 MVP Polish & Hardening  
> **Active Persona:** Collaborative (Person A & Person B)  
> **Status:** Phase 5 Complete ✅ — Auth & Navigation Flow Polish

---

## Current Position
- **Phase**: Phase 5 (Auth & Navigation Flow Polish) — **COMPLETE ✅**
- **Status**: Plan 5.3 (Protected Routes & Auth-Gated Leaderboard Verification) — **COMPLETE ✅**
- **Phase 5 Deliverables (All 7 Requirements Implemented & Verified)**:
  1. **Sign-Out Route Redirection**: Signing out in [`MudraHeader.tsx`](file:///c:/Users/MANAV/Desktop/Adani%20Uni/Projects/mudra/client/src/components/mudra/MudraHeader.tsx) or [`MudraMenu.tsx`](file:///c:/Users/MANAV/Desktop/Adani%20Uni/Projects/mudra/client/src/components/mudra/MudraMenu.tsx) clears `mudra_user` from `localStorage`, signs out of Supabase, and redirects directly to home (`/`) via [`MudraShell.tsx`](file:///c:/Users/MANAV/Desktop/Adani%20Uni/Projects/mudra/client/src/components/mudra/MudraShell.tsx).
  2. **Market Explorer Clean-up**: Removed "Action" column header and "Trade" action button cells from Market Explorer ([`StockTable.tsx`](file:///c:/Users/MANAV/Desktop/Adani%20Uni/Projects/mudra/client/src/components/explorer/StockTable.tsx)). All rows navigate to `/stock/[symbol]`.
  3. **Auth-Gated Leaderboard**: Unauthenticated visitors on [`/leaderboard`](file:///c:/Users/MANAV/Desktop/Adani%20Uni/Projects/mudra/client/src/app/leaderboard/page.tsx) are gated by an access-restricted card (`data-auth-gate`) with a direct "Sign In / Join Sandbox" CTA button. Rankings are visible exclusively to logged-in users.
  4. **Hamburger Navigation Clean-up**: Removed "Trade Stock" link from [`MudraMenu.tsx`](file:///c:/Users/MANAV/Desktop/Adani%20Uni/Projects/mudra/client/src/components/mudra/MudraMenu.tsx); menu is numbered 01 to 04 (Home, Explore Market, Portfolio, Leaderboard) with trader profile card and Sign Out.
  5. **Enhanced Credentials**: [`AuthModal.tsx`](file:///c:/Users/MANAV/Desktop/Adani%20Uni/Projects/mudra/client/src/components/auth/AuthModal.tsx) strictly requires email address, password (>= 6 chars), and leaderboard pseudonym (>= 3 chars) across both sign-in and register modes.
  6. **Supabase Google OAuth**: "Continue with Google" in `AuthModal.tsx` integrates with `supabase.auth.signInWithOAuth` via [`supabase.ts`](file:///c:/Users/MANAV/Desktop/Adani%20Uni/Projects/mudra/client/src/lib/supabase.ts).
  7. **Post-Sign-In Landing on /dashboard**: Successful authentication instantly navigates to `/dashboard` both from `AuthModal.tsx` and via Supabase `SIGNED_IN` event in `MudraShell.tsx`.
- **Automated Test Suite**: [`tests/trading/auth_navigation.test.ts`](file:///c:/Users/MANAV/Desktop/Adani%20Uni/Projects/mudra/tests/trading/auth_navigation.test.ts) passing all 7 requirement assertions.
- **Regression Parity**: `npm test` (62/62 passing), `pytest server/tests/` (52/52 passing), `launch_audit.py` (5/5 pillars passing).

---

## Codebase Architecture
```
mudra/
├── client/                     # 🌐 Person A: React / Next.js 14 Frontend
│   ├── next.config.mjs         # API proxy rewrites to FastAPI backend (http://127.0.0.1:8000)
│   ├── src/app/
│   │   ├── page.tsx            # Landing Page with ₹1,00,000 CTA (Stitch 01)
│   │   ├── dashboard/          # Authenticated Portfolio & Performance Curve (Stitch 03)
│   │   ├── explore/            # Market Explorer with search & sector filters (Stitch 05)
│   │   └── stock/[symbol]/     # Stock Detail with PriceChart & OrderModal (Stitch 04)
│   ├── src/components/
│   │   ├── auth/AuthModal.tsx  # Google/Email Auth with 18+ DPDP checkboxes (Stitch 02)
│   │   └── trade/OrderModal.tsx# Buy/Sell Order Sheet with 0.1% fee breakdown (Stitch 06, 07)
│   ├── src/lib/formatters.ts   # formatINR() (Lakh/Crore), paiseToRupees(), rupeesToPaise()
│   ├── src/lib/api.ts          # Typed client API client adhering to docs/api.md
│   └── src/mocks/              # 50-stock NSE fixtures & reference portfolio
│
├── server/                     # ⚙️ Person B: FastAPI Python Backend & Database Logic
│   ├── requirements.txt        # FastAPI, Uvicorn, Pydantic v2, Pytest, HTTPX, Pytz
│   ├── pytest.ini              # Verbose debug test configuration (-v -s --tb=short)
│   ├── app/
│   │   ├── main.py             # FastAPI app with CORS, debug logging middleware & exception handlers
│   │   ├── config.py           # Settings: DEBUG=True by default, multi-path CSV resolution
│   │   ├── core/
│   │   │   ├── logger.py       # Contextual request-ID logging
│   │   │   ├── math.py         # Integer paise engine with runtime anti-float guards
│   │   │   ├── market_adapter.py # 50-stock EOD adapter & IST freshness evaluator
│   │   │   ├── state.py        # Transactional in-memory ledger, wallet, and holding store
│   │   │   └── settlement.py   # Closing-price order settlement engine (sells before buys)
│   │   ├── models/schemas.py   # Pydantic schemas conforming to docs/api.md
│   │   ├── api/
│   │   │   ├── routes_status.py      # GET /api/status
│   │   │   ├── routes_instruments.py # GET /api/instruments, GET /api/instruments/{symbol}
│   │   │   ├── routes_orders.py      # POST /api/orders, GET /api/orders
│   │   │   └── routes_settlement.py  # POST /api/settlement/run
│   │   └── scripts/reconcile.py      # Nightly zero-discrepancy ledger audit
│   ├── tests/
│   │   ├── conftest.py         # TestClient fixture
│   │   ├── test_math.py        # Section 7.3 worked example unit tests
│   │   ├── test_place_order.py # Order placement, idempotency, validations
│   │   ├── test_trade_loop.py  # End-to-end integration test
│   │   ├── test_reconciliation.py # Ledger reconciliation audit test
│   │   └── test_settlement.py  # Order settlement & buffer refund tests
│   ├── data/sample_prices.csv  # 12,501 rows of 1-year historical EOD data for 50 stocks
│   └── supabase/migrations/    # Migrations (DDL, auth triggers, RLS, place_order, settle_orders)
│
└── package.json                # Root proxy runner
```

---

## Work Status Breakdown

### Phase 3 Progress (`.gsd/phases/3/`)
- [x] **Plan 3.1**: Order Settlement Engine `settle_orders()` with Sells-Before-Buys Execution (`01-PLAN.md`) — **Complete (18/18 Pytest Tests Passing)**
- [x] **Plan 3.2**: Daily Price Ingestion & Settlement GitHub Actions Cron (`02-PLAN.md`) — **Complete (21/21 Pytest Tests Passing)**
- [x] **Plan 3.3**: Daily Portfolio Snapshot Generation & Return Curves (`03-PLAN.md`) — **Complete (23/23 Pytest Tests Passing)**
- [x] **Plan 3.4A**: Person A Frontend Integration — Live Portfolio Curves, Audit Ledger & Watchlist UI (`04A-PLAN.md`) — **Complete ✅**
- [x] **Plan 3.4**: Watchlist Backend Endpoints (`04-PLAN.md`) — **Complete (27/27 Pytest Tests Passing)**
- [x] **Plan 3.5**: Concurrency Load Testing (`05-PLAN.md`) — **Complete (30/30 Pytest & 27/27 Node Tests Passing) ✅**

### Phase 4 Progress (`.gsd/phases/4/`)
- [x] **Plan 4.1**: Leaderboard SQL Query & Endpoint (`01-PLAN.md`) — **Complete (32/32 Pytest Tests Passing) ✅**
- [x] **Plan 4.2**: Automated Weekly Database Backups (`02-PLAN.md`) — **Complete (Workflow & pg_dump Verified) ✅**
- [x] **Plan 4.3**: Health Monitor & Uptime Cron (`03-PLAN.md`) — **Complete (36/36 Pytest & 34/34 Node Tests Passing) ✅**
- [x] **Plan 4.4**: Rate Limiting & Abuse Protection (`04-PLAN.md`) — **Complete (48/48 Pytest & 50/50 Node Tests Passing) ✅**
- [x] **Plan 4.5**: Section 15.1 Launch Checklist & "No Real Money" Audit (`05-PLAN.md`) — **Complete (52/52 Pytest & 55/55 Node Tests Passing) ✅**
- [x] **Plan 4.1A**: Public Leaderboard UI & Mobile Polish (`01A-PLAN.md`) — **Complete ✅**
- [x] **Plan 4.2A**: Milestone M2 Launch Polish & Statutory Compliance (`02A-PLAN.md`) — **Complete ✅**
- [x] **Plan 4.3A**: Playwright E2E Suite & Multi-Device Mobile QA (`03A-PLAN.md`) — **Complete ✅**

### Phase 5 Progress (`.gsd/phases/5/`)
- [x] **Plan 5.1**: Enhanced Authentication — Email, Password, Pseudonym & Google OAuth (`01-PLAN.md`) — **Complete ✅**
- [x] **Plan 5.2**: Navigation Clean-up & Sign-Out Redirection (`02-PLAN.md`) — **Complete ✅**
- [ ] **Plan 5.3**: Protected Routes & Auth-Gated Leaderboard Verification (`03-PLAN.md`) — **Ready**

---

## Milestone M1 Status: COMPLETE ✅
All 6 exit criteria of Milestone M1 (PRD Section 15.1) have been implemented and verified.

## Milestone M2 Status: COMPLETE ✅
All Milestone M2 launch-readiness criteria are 100% satisfied:
1. Public leaderboard ranking with anti-outlier filters (>= 5 trades, 7+ days).
2. End-to-end trading loop with 10% buy buffer and 0.1% transaction fee.
3. Daily settlement and nightly zero-discrepancy ledger reconciliation.
4. Production hardening: rate limiting, health probes, automated backups.
5. PRD Section 15.1 compliance: zero payment rails, zero banking PII, zero wallet cheat backdoors.
6. Statutory SEBI disclosures, DPDP compliance, and 18+ age verification gate.
7. 100% automated test parity (52 Pytest tests, 55 Node.js tests, Playwright E2E suite).
