# STATE.md — Current Project State: Mudra

> **Last Updated:** 2026-10-11 16:40 IST  
> **Active Milestone:** v1.0 MVP (Milestone M1 Complete)  
> **Active Persona:** Collaborative (Person A & Person B)  
> **Status:** Milestone M1 (Week 1 Trade Loop) Fully Verified & Tested ✅

---

## Current Position
- **Phase**: Mudra Swiss Design System & Core Trade Loop — **VERIFIED & OPERATIONAL ✅**
- **Verification Reports**:
  * Phase 1 (Core Trade Loop): [.gsd/phases/1/VERIFICATION.md](file:///c:/Users/Sharanya%20Nagar/Desktop/Projects/mudra/.gsd/phases/1/VERIFICATION.md) — **PASS (10/10 Must-Haves)**
  * Mudra Swiss UI & Rebranding: [.gsd/phases/mudra-swiss/VERIFICATION.md](file:///c:/Users/Sharanya%20Nagar/Desktop/Projects/mudra/.gsd/phases/mudra-swiss/VERIFICATION.md) — **PASS (7/7 Must-Haves)**
- **Test Suite Health**:
  * Python FastAPI: 14/14 pytest tests passed in 0.67s with request tracing and debugging enabled by default.
  * Node.js / Integration: 18/18 tests passed in 983ms.
  * Next.js Frontend: `tsc --noEmit` and `next build` 100% clean (0 errors, 9/9 pages generated).
  * Brand Integrity: 0 occurrences of "indisea" in any file or path across the repository.
  * Nightly Reconciliation: 0 ledger discrepancies across all user wallets.
- **Next Step**: Phase 3 (Settlement Execution Engine `settle_orders()`, Portfolio Snapshots & Daily Cron).

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
│   │   │   └── state.py        # Transactional in-memory ledger and wallet state store
│   │   ├── models/schemas.py   # Pydantic schemas conforming to docs/api.md
│   │   ├── api/
│   │   │   ├── routes_status.py      # GET /api/status
│   │   │   ├── routes_instruments.py # GET /api/instruments, GET /api/instruments/{symbol}
│   │   │   └── routes_orders.py      # POST /api/orders, GET /api/orders
│   │   └── scripts/reconcile.py      # Nightly zero-discrepancy ledger audit
│   ├── tests/
│   │   ├── conftest.py         # TestClient fixture
│   │   ├── test_math.py        # Section 7.3 worked example unit tests
│   │   ├── test_place_order.py # Order placement, idempotency, validations
│   │   ├── test_trade_loop.py  # End-to-end integration test
│   │   └── test_reconciliation.py # Ledger reconciliation audit test
│   ├── data/sample_prices.csv  # 12,501 rows of 1-year historical EOD data for 50 stocks
│   └── supabase/               # SQL Migrations (DDL, auth triggers, RLS, place_order)
│
└── package.json                # Root proxy runner
```

---

## Work Status Breakdown

### Phase 2 Progress (`.gsd/phases/2/`)
- [x] **Plan 2.1**: FastAPI (Python) Backend Conversion with Debugging by Default (`01-PLAN.md`) — **Complete (14/14 Pytest Tests Passing)**
- [ ] **Plan 2.2**: Order Settlement Stored Procedure & Daily Price Ingestion Cron (`02-PLAN.md`)
- [ ] **Plan 2.3**: Daily Portfolio Snapshot Generation & Return Curves (`03-PLAN.md`)
- [ ] **Plan 2.4**: Watchlist Backend Endpoints (`04-PLAN.md`)
- [ ] **Plan 2.5**: Concurrency Load Testing (`05-PLAN.md`)

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
