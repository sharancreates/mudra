# STATE.md — Current Project State: Mudra

> **Last Updated:** 2026-10-10 20:00 IST  
> **Active Persona:** Person B (Backend and Data Lead) — Ready for Handoff  
> **Previous Persona:** Person A (Frontend and UX Lead) — Week 1 Completed  
> **Active Milestone:** v1.0 MVP  
> **Active Phase:** Phase 1 (Week 1: Foundation and Trade Loop)  
> **Status:** Paused for Session Handoff to Person B

---

## Current Position
- **Phase**: Phase 1 (Week 1: Foundation & Trade Loop)
- **Status**: Frontend Week 1 complete & verified; Backend Week 1 partially complete (Plans 1.1–1.5 done, Plans 1.6–1.9 ready to resume).
- **Target for Person B**: Complete the virtual trading engine SQL stored procedures (`place_order()`), settlement math tests, and Next.js route handlers.

---

## Codebase Architecture
```
mudra/
├── client/                     # 🌐 Person A: React / Next.js 14 Frontend
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
├── server/                     # ⚙️ Person B: Backend, Data, & Database Logic
│   ├── src/data-adapter/       # Market data adapter abstraction & freshness evaluation
│   ├── supabase/               # Migrations (DDL, auth triggers, RLS) & seed data
│   │   ├── migrations/20261010000001_initial_schema.sql
│   │   ├── migrations/20261010000002_auth_triggers.sql
│   │   └── migrations/20261010000003_rls_policies.sql
│   ├── data/sample_prices.csv  # 12,501 rows of 1-year historical EOD data for 50 stocks
│   ├── tests/security/         # rls_tamper_test.ts (anti-tampering proof)
│   └── scripts/                # generate_sample_data.mjs
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
- [x] **Plan 1.1**: Data Licensing Enquiries & Contract Synchronization (`01-PLAN.md`)
- [x] **Plan 1.2**: Database Migration Scaffold & Schema DDL Definition (`02-PLAN.md`)
- [x] **Plan 1.3**: User Onboarding, Wallet Trigger & Immutable Ledger (`03-PLAN.md`)
- [x] **Plan 1.4**: Row Level Security & Anti-Tampering Hardening (`04-PLAN.md`)
- [x] **Plan 1.5**: 50-Stock Sample Data & Market Adapter Architecture (`05-PLAN.md`)
- [ ] **Plan 1.6**: Trading Math Engine & Acceptance Scenario Unit Tests (`06-PLAN.md`) — **NEXT UP**
- [ ] **Plan 1.7**: Virtual Trading Engine `place_order()` Stored Procedure (`07-PLAN.md`)
- [ ] **Plan 1.8**: Next.js Route Handlers & JSON Contract Conformance (`08-PLAN.md`)
- [ ] **Plan 1.9**: Week 1 Integration Verification & Ledger Reconciliation (`09-PLAN.md`)

---

## Handoff Instructions for Person B
1. **Next Plan to Execute**: `.gsd/phases/1/06-PLAN.md` (Trading Math Engine & Acceptance Scenario Unit Tests).
2. **Key Math Formulas to Test**:
   - `trade_value = price_paise * qty`
   - `fee = round(0.001 * trade_value)`
   - Buy reservation: `est_price = last_close * 110 / 100`, `cost = est_price * qty + fee`
   - Reference scenario check (Section 9.3 of PRD): BUY 10 @ 1,400 -> BUY 5 @ 1,420 -> SELL 6 @ 1,450 produces +₹242.86 realized P&L and ₹1,408.07 average cost.
3. **Database Stored Procedure**: After 1.6, implement Plan 1.7 (`place_order()` SQL function in `server/supabase/migrations/20261010000004_place_order.sql`).
4. **Client-Server Integration**: When writing route handlers (`server/` or `client/src/app/api/`), adhere strictly to [`docs/api.md`](file:///c:/Users/Sharanya%20Nagar/Desktop/Projects/mudra/docs/api.md) — Person A's frontend is already wired to these exact contracts.
