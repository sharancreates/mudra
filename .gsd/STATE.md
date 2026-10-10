# STATE.md — Current Project State: Mudra

> **Last Updated:** 2026-10-10 20:00 IST  
> **Active Persona:** Person B (Backend and Data Lead) — Ready for Handoff  
> **Previous Persona:** Person A (Frontend and UX Lead) — Week 1 Completed  
> **Active Milestone:** v1.0 MVP  
> **Active Phase:** Phase 1 (Week 1: Foundation and Trade Loop)  
> **Status:** Paused for Session Handoff to Person B

---

## Current Position
- **Phase**: Phase 1 (Week 1: Foundation & Trade Loop) — **COMPLETE ✅**
- **Status**: Milestone M1 (Week 1) fully verified end-to-end across both Frontend (Person A) and Backend (Person B).
- **Target for Next Sprint**: Phase 2 (Week 2: Order Settlement, Portfolio Snapshots, Watchlist, and Concurrency Load Testing).

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
All 6 exit criteria of Milestone M1 (PRD Section 15.1) have been implemented and verified:
1. User registration trigger creates profile, ₹1,00,000 wallet, and `INIT` ledger row.
2. 50 NSE stocks explorer with EOD closing prices and freshness evaluation.
3. Order placement reserves 10% cash buffer + 0.1% fee with next-close execution date.
4. Pending orders visible in order history.
5. Direct client table modifications blocked by PostgreSQL RLS perimeter.
6. Nightly ledger reconciliation audits 0 discrepancies across all accounts.
2. **Key Math Formulas to Test**:
   - `trade_value = price_paise * qty`
   - `fee = round(0.001 * trade_value)`
   - Buy reservation: `est_price = last_close * 110 / 100`, `cost = est_price * qty + fee`
   - Reference scenario check (Section 9.3 of PRD): BUY 10 @ 1,400 -> BUY 5 @ 1,420 -> SELL 6 @ 1,450 produces +₹242.86 realized P&L and ₹1,408.07 average cost.
3. **Database Stored Procedure**: After 1.6, implement Plan 1.7 (`place_order()` SQL function in `server/supabase/migrations/20261010000004_place_order.sql`).
4. **Client-Server Integration**: When writing route handlers (`server/` or `client/src/app/api/`), adhere strictly to [`docs/api.md`](file:///c:/Users/Sharanya%20Nagar/Desktop/Projects/mudra/docs/api.md) — Person A's frontend is already wired to these exact contracts.
