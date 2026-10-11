# STATE.md — Current Project State: Mudra

> **Last Updated:** 2026-10-11 08:45 IST  
> **Active Persona:** Person B (Backend and Data Lead) — Ready for Handoff  
> **Previous Persona:** Person A (Frontend and UX Lead) — Week 1 Debugged & Plans Prepared  
> **Active Milestone:** v1.0 MVP  
> **Active Phase:** Phase 2 (FastAPI (Python) Backend Conversion with Debugging by Default)  
> **Status:** Paused for Session Handoff to Person B (FastAPI Conversion)

---

## Current Position
- **Phase**: Phase 2 (FastAPI Backend Conversion with Debugging by Default) — **READY FOR EXECUTION 🔄**
- **Plan to Execute**: `.gsd/phases/2/01-PLAN.md`
- **Goal for Person B**: Convert the Mudra backend from TypeScript/Node route handlers to a standalone FastAPI (Python 3.10+) service in `server/`, keeping all integer paise financial calculations, reproducing PRD Section 7.3 reference scenario, conforming to `docs/api.md`, and enabling systematic debugging by default.
- **Frontend Status (Person A)**: 100% verified and operational. Next.js frontend is decoupled and ready to connect to FastAPI via `docs/api.md`.

---

## Codebase Architecture
```
mudra/
├── client/                     # 🌐 Person A: React / Next.js 14 Frontend
│   ├── src/app/
│   │   ├── page.tsx            # Landing Page with ₹1,00,000 CTA (Stitch 01)
│   │   ├── dashboard/          # Authenticated Portfolio & Performance Curve (Stitch 03)
│   │   ├── explore/            # Market Explorer with search & sector filters (Stitch 05)
│   │   ├── stock/[symbol]/     # Stock Detail with PriceChart & OrderModal (Stitch 04)
│   │   └── api/                # Next.js App Router route handlers (/api/orders, /api/instruments, /api/status)
│   ├── src/components/
│   │   ├── auth/AuthModal.tsx  # Google/Email Auth with 18+ DPDP checkboxes (Stitch 02)
│   │   └── trade/OrderModal.tsx# Buy/Sell Order Sheet with 0.1% fee breakdown (Stitch 06, 07)
│   ├── src/lib/formatters.ts   # formatINR() (Lakh/Crore), paiseToRupees(), rupeesToPaise()
│   ├── src/lib/api.ts          # Typed client API client adhering to docs/api.md
│   └── src/mocks/              # 50-stock NSE fixtures & reference portfolio
│
├── server/                     # ⚙️ Person B: Backend, Data, & Database Logic
│   ├── src/data-adapter/       # Market data adapter abstraction & freshness evaluation
│   ├── src/trading/math.ts     # Integer paise fee (0.1%), reservation (10%), and trade calendar math
│   ├── supabase/               # Migrations (DDL, auth triggers, RLS, place_order) & seed data
│   │   ├── migrations/20261010000001_initial_schema.sql
│   │   ├── migrations/20261010000002_auth_triggers.sql
│   │   ├── migrations/20261010000003_rls_policies.sql
│   │   └── migrations/20261010000004_place_order.sql
│   ├── data/sample_prices.csv  # 12,501 rows of 1-year historical EOD data for 50 stocks
│   ├── tests/
│   │   ├── security/           # rls_tamper_test.ts (anti-tampering proof)
│   │   ├── trading/            # math.test.ts, place_order.test.ts
│   │   └── integration/        # week1_trade_loop.test.ts (Milestone M1 E2E)
│   └── scripts/
│       ├── generate_sample_data.mjs
│       └── reconcile_wallets.ts # Nightly zero-discrepancy ledger audit (PRD FR-46)
│
└── package.json                # Root proxy runner (runs `npm run dev` for client)
```

---

## Work Status Breakdown

### Person A — Frontend Progress (`.gsd/phases/frontend/1/`)
- [x] **Plan 1.1**: Project Scaffolding & Custom 5-Color Design System Tokens — `1-SUMMARY.md`
- [x] **Plan 1.2**: 50-Stock NSE Fixtures & Typed API Client (`docs/api.md` conformance) — `2-SUMMARY.md`
- [x] **Plan 1.3**: Landing Page, 18+ DPDP Auth Modal & Market Explorer — `3-SUMMARY.md`
- [x] **Plan 1.4**: Stock Detail Page & Buy/Sell Order Modals — `4-SUMMARY.md`
- [x] **Dashboard Added**: `/dashboard` route with live portfolio metrics and equity curve.

### Person B — Backend Status (`.gsd/phases/1/`)
- [x] **Plan 1.1**: Data Licensing Enquiries & Contract Synchronization (`01-PLAN.md`) — **Done**
- [x] **Plan 1.2**: Database Migration Scaffold & Schema DDL Definition (`02-PLAN.md`) — **Done**
- [x] **Plan 1.3**: User Onboarding, Wallet Trigger & Immutable Ledger (`03-PLAN.md`) — **Done**
- [x] **Plan 1.4**: Row Level Security & Anti-Tampering Hardening (`04-PLAN.md`) — **Done**
- [x] **Plan 1.5**: 50-Stock Sample Data & Market Adapter Architecture (`05-PLAN.md`) — **Done**
- [x] **Plan 1.6**: Trading Math Engine & Acceptance Scenario Unit Tests (`06-PLAN.md`) — **Done (All 7 Tests Passed)**
- [x] **Plan 1.7**: Virtual Trading Engine `place_order()` Stored Procedure (`07-PLAN.md`) — **Done (All 5 Tests Passed)**
- [x] **Plan 1.8**: Next.js Route Handlers & JSON Contract Conformance (`08-PLAN.md`) — **Done (Route Handlers Verified)**
- [x] **Plan 1.9**: Week 1 Integration Verification & Ledger Reconciliation (`09-PLAN.md`) — **Done (Milestone M1 Verified)**

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
