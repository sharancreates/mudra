---
milestone: MVP v1.0
version: 1.0.0
updated: 2026-10-10T15:37:00+05:30
---

# ROADMAP.md — Mudra

> **Current Phase:** Phase 1: Foundation & Week 1 Frontend Flow
> **Status:** executing
> **Owner (Lead):** Person A (Frontend & UX) with Person B (Backend & Data)

---

## Must-Haves (from SPEC & PRD)

- [ ] Complete trade loop: Auth → ₹1,00,000 Wallet → Stock Search → Market Order at Next Close → Settlement → Holdings & P&L.
- [ ] Strictly integer paise accounting with immutable ledger and nightly reconciliation.
- [ ] End-of-day price transparency with freshness badges (FRESH / DELAYED / OUTDATED) and Practice Market fallback.
- [ ] ₹0 infrastructure cost using Vercel Hobby + Supabase Postgres/Auth + GitHub Actions cron.
- [ ] "No Real Money" safety gate (no payments, bank details, PAN/Aadhaar, or broker APIs).

---

## Phases

### Phase 1: Foundation & Week 1 Trade Loop (Week 1)
**Status:** 🔄 In Progress  
**Objective:** Deliver working frontend prototype with mocked/connected trade loop, design tokens, wireframes, login, stock search, and pending order placement.  
**Person A Scope:**
- Plan 1.1: Project scaffold (Next.js 14 App Router, TypeScript, Tailwind CSS, Lucide icons) + Vercel preview deploy.
- Plan 1.2: API contract freeze (`docs/api.md`) and initial decisions (`docs/decisions.md`).
- Plan 1.3: Core Wireframe prompts & designs for 6 primary screens (Landing, Auth/Modal, Dashboard, Explorer, Stock Detail, Order Sheet).
- Plan 1.4: API Client & Mock Service Worker (MSW) or mock handlers for `/api/instruments` and `/api/orders`.
- Plan 1.5: UI implementation of Landing, Explorer with search, Stock Detail page with charts, and Buy/Sell Order Sheet.
- Plan 1.6: Simulation banner, legal disclaimer component, and 18+ declaration modal.

**Person B Scope (Coordinated):**
- Supabase project, schema migrations (wallets, profiles, instruments, orders, ledger, daily_prices), RLS, Auth triggers, `place_order()` SQL function, and 50-stock sample CSV.

---

### Phase 2: Full Trade Experience & Dashboard (Week 2)
**Status:** ⬜ Not Started  
**Objective:** Connect frontend to live Supabase backend, deliver order settlement integration, complete portfolio dashboard, P&L calculations, transaction history, and watchlist.  
**Depends on:** Phase 1  
**Person A Scope:**
- Plan 2.1: Portfolio overview dashboard with Recharts equity curve and top 5 holdings.
- Plan 2.2: Holdings table with weighted-average cost, realized & unrealized P&L, and "Explain This" calculation popovers.
- Plan 2.3: Order history & immutable ledger transaction viewer with status filters.
- Plan 2.4: Watchlist feature (star toggle & quick buy).
- Plan 2.5: Real-time data freshness alert banners (FRESH / DELAYED / OUTDATED).

---

### Phase 3: Leaderboard, Hardening, Mobile Polish & Launch (Week 3)
**Status:** ⬜ Not Started  
**Objective:** Deploy public-ready MVP on Vercel with leaderboard, comprehensive security checks, Playwright end-to-end tests, mobile responsive polish, and legal disclaimers.  
**Depends on:** Phase 2  
**Person A Scope:**
- Plan 3.1: Leaderboard UI (Top 50 by total return %, pinned user card, eligibility criteria indicator).
- Plan 3.2: Mobile responsiveness audit (360px, 390px, 768px viewports, 44px touch targets).
- Plan 3.3: Playwright E2E test suite covering full user journey (sign-up → search → buy order → fill inspection).
- Plan 3.4: Complete legal copy integration (Terms of Service, Privacy Policy, DPDP compliance notices, SEBI disclaimers).
- Plan 3.5: Production launch checklist audit & bug bash.

---

## Progress Summary

| Phase | Description | Owner | Status | Target |
|-------|-------------|-------|--------|--------|
| Phase 1 | Foundation & Week 1 Trade Loop | Person A & B | 🔄 In Progress | Week 1 |
| Phase 2 | Full Trade Experience & Dashboard | Person A & B | ⬜ Not Started | Week 2 |
| Phase 3 | Leaderboard, Hardening & Launch | Person A & B | ⬜ Not Started | Week 3 |
