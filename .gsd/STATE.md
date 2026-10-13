# STATE.md — Current Project State: Mudra

> **Last Updated:** 2026-10-13 12:25 IST  
> **Active Milestone:** v1.0 MVP (Milestone M2 Launch-Readiness)  
> **Active Persona:** Collaborative (Person A & Person B)  
> **Status:** Plan 4.3A Complete ✅ — Playwright E2E Suite & Multi-Device Mobile QA Verified

---

## Current Position
- **Phase**: Phase 4 (Leaderboard, Hardening, Mobile Polish & Launch)
- **Status**: Plan 4.3A (Playwright E2E Suite & Multi-Device Mobile QA Verification) — **COMPLETE ✅**
- **Person A Deliverables**: **100% COMPLETE & VERIFIED** across all milestones:
  * Public `/leaderboard` live with Section 2.4 anti-outlier rankings and user standing card.
  * Explorer Watchlist empty state with 1-click filter reset.
  * Dashboard 0-trade onboarding card ("Getting Started with Mudra" 3 pillars) and empty holding fallbacks.
  * Dedicated [`/terms`](file:///client/src/app/terms/page.tsx) statutory disclaimer page compliant with PRD §15.1.
  * Production OpenGraph, Twitter card, theme color (`#0B0E14`), and mobile viewport metadata.
  * W2-18 / W3-14: Playwright E2E Golden Path smoke test suite authored (`tests/e2e/smoke.spec.ts`).
  * W3-11: Multi-device mobile QA assertion suite for 360px, 390px, and 768px viewports (`tests/e2e/mobile_qa.spec.ts`).
  * Standalone zero-dependency contract test runner (`tests/e2e/e2e_smoke.test.ts`).
- **Next Target**: Plan 4.1 (Person B: Leaderboard SQL query & endpoint `GET /api/leaderboard` with 5 trades & 7 days eligibility filter).

## Last Session Summary (Person A)
1. **Plan 4.3A Execution**:
   - Created `playwright.config.ts` configuring Chromium Desktop, Android (360px), iPhone (390px), and Tablet (768px).
   - Authored `tests/e2e/smoke.spec.ts` covering Sign-up → Explore Search → Order Placement with 10% headroom → Orders Queue → Ledger audit.
   - Authored `tests/e2e/mobile_qa.spec.ts` testing all 6 core routes for strictly 0 horizontal overflow and touch targets >= 44px.
   - Added `tests/e2e/e2e_smoke.test.ts` for native Node test runner.
   - Configured `npm run test:e2e`, `npm run test:e2e:smoke`, `npm run test:e2e:mobile` in `package.json`.
2. **Commit Manifest**:
   - `13482f0`: feat(test): add playwright e2e smoke suite and multi-device mobile qa assertions

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

---

## Phase 1 (Week 1) Milestone M1 Status: COMPLETE ✅
All 6 exit criteria of Milestone M1 (PRD Section 15.1) have been implemented and verified.

---

## Handoff Instructions for Person B (FastAPI Backend Conversion)

1. **Active Phase**: Phase 2 — `.gsd/phases/2/01-PLAN.md` (`Plan 2.1: FastAPI Backend Conversion with Debugging by Default`).
2. **Architecture Blueprint**: Review `.gsd/phases/2/RESEARCH.md`.
3. **Core Mandates for Person B**:
   - **Convert to FastAPI (Python 3.10+)**: Port backend logic from Next.js route handlers (`client/src/app/api/`) and TypeScript services (`server/src/`) into idiomatic FastAPI in `server/`.
   - **Debugging by Default**:
     * Configure `DEBUG = True` and log level `DEBUG` in `server/app/config.py`.
     * Add request tracing middleware generating `request_id` (`req_...`) and logging duration, method, path, and errors.
     * Attach global exception handler capturing full Python tracebacks in debug mode.
     * Configure `pytest.ini` with `-v -s --tb=short`.
     * Zero float tolerance: assert `isinstance(val, int)` on all monetary fields (integer paise).
   - **Contract Preservation**: Fulfill `docs/api.md` exactly:
     * `GET /api/status` (freshness evaluation)
     * `GET /api/instruments` (query, sector, pagination)
     * `GET /api/instruments/{symbol}`
     * `POST /api/orders` (10% buy buffer, 0.1% fee, next close cutoff, idempotency on `client_order_id`)
     * `GET /api/orders`
   - **Trading Math Verification**:
     * Reproduce PRD Section 7.3 reference acceptance scenario in `server/tests/test_math.py`:
     * BUY 10 @ ₹1,400 -> BUY 5 @ ₹1,420 -> SELL 6 @ ₹1,450 yielding `+₹242.86` realized P&L and `₹1,408.07` average cost.
   - **Nightly Reconciliation Audit**:
     * Port `scripts/reconcile_wallets.ts` to `server/app/scripts/reconcile.py` confirming 0 ledger discrepancies.
   - **Systematic Debugging Protocol**:
     * If any conversion step encounters unexpected behavior or failing tests, follow the GSD Debugger Protocol (`.agents/skills/debugger/SKILL.md`) and record persistent state in `.gsd/DEBUG.md`.
4. **How to Resume**:
   - Run `/execute 2.1` or execute tasks sequentially in `.gsd/phases/2/01-PLAN.md`.
