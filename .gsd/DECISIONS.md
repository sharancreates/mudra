# Architecture & Design Decisions (ADRs) — Mudra

> **Document Status:** Active  
> **Last Synchronized:** 10 October 2026  
> **Applicability:** All frontend, backend, database, and scheduled pipeline tasks

---

## ADR-001: Project Renaming to Mudra
- **Date**: 2026-10-10
- **Status**: Accepted
- **Context**: The working title "StockSim India" was a placeholder. The project is officially named **Mudra**.
- **Decision**: Update all branding, documentation, and user-facing copy to "Mudra".

---

## ADR-002: Next-Close Execution Model
- **Date**: 2026-10-10
- **Status**: Accepted
- **Context**: Real-time tick and intraday NSE data feeds require commercial licensing tariffs (~₹1,00,000+ per medium) which violates the ₹0 budget constraint. Additionally, execution at historical or stale prices creates cheating loopholes.
- **Decision**: Mudra operates as an honest Closing-Price Simulator. Orders placed before 15:30 IST execute at that day's official closing price; orders placed after 15:30 IST or on market holidays execute at the next trading day's close.

---

## ADR-003: Paise Representation of Currency
- **Date**: 2026-10-10
- **Status**: Accepted
- **Context**: Floating-point math (`FLOAT`/`DOUBLE` or JavaScript `Number`) creates rounding errors and penny discrepancies in financial ledgers.
- **Decision**: All money fields in the database (`cash_paise`, `reserved_paise`, `cost_basis_paise`, etc.) and all API payloads are strictly stored and communicated as integer paise (`bigint`). Conversion to Rupees occurs exclusively at the UI presentation layer.

---

## ADR-004: Security Definer Stored Procedures for Order Mutation
- **Date**: 2026-10-10
- **Status**: Accepted
- **Context**: The browser client is inherently untrusted. If users have direct table write access (INSERT/UPDATE/DELETE), they can modify cash balances or invent transactions via browser dev tools.
- **Decision**: Revoke all INSERT, UPDATE, and DELETE privileges on money tables (`wallets`, `holdings`, `orders`, `ledger_entries`, `portfolio_snapshots`) from client/authenticated roles. All mutations must pass through PostgreSQL stored procedures declared `SECURITY DEFINER` with fixed `search_path = public` (e.g. `place_order()`), extracting `user_id` strictly from `auth.uid()`.

---

## ADR-005: 10% Cash Reservation Buffer on Market Buy Orders
- **Date**: 2026-10-10
- **Status**: Accepted
- **Context**: In a closing-price simulation, the execution price is unknown when a user places a market order during the day. If the price moves upward between order placement and the 15:30 IST close, the fill cost could exceed the user's available cash, producing illegal negative balances.
- **Decision**: On buy order creation, the system reserves estimated cost with a 10% headroom safety buffer: `est_price = latest_close * 110 / 100`, plus simulated fees. When the order settles at the actual close, any unspent reservation is refunded to free cash.

---

## ADR-006: 50-Stock Static CSV Seed with Swappable Data Adapter Pattern
- **Date**: 2026-10-10
- **Status**: Accepted
- **Context**: Relying on live external data during early development creates external failure points and potential terms-of-service violations.
- **Decision**: Development and testing run entirely against a static 50-stock, 1-year historical EOD dataset (`sample_prices.csv`) and a synthetic random-walk generator. Data ingestion is wrapped behind `IMarketDataAdapter` so transitioning to a cleared real-time/EOD feed requires zero schema changes.

---

## ADR-007: Standardized Machine-Readable Error Payload Format
- **Date**: 2026-10-10
- **Status**: Accepted
- **Context**: Person A (Frontend) and Person B (Backend) require a deterministic error contract to deliver friendly user feedback on invalid orders or failed requests.
- **Decision**: All HTTP 4xx responses return a standardized JSON structure:
  ```json
  {
    "error": {
      "code": "insufficient_cash",
      "message": "Not enough virtual cash in wallet.",
      "request_id": "req_12345"
    }
  }
  ```
  Permitted error codes: `not_authenticated`, `bad_quantity`, `unknown_instrument`, `insufficient_cash`, `insufficient_holdings`, `market_data_unavailable`, `rate_limited`, `duplicate_ignored`.

---

## ADR-008: Mudra Swiss Design System Architecture
- **Date**: 2026-10-11
- **Status**: Accepted
- **Context**: Deliver a high-contrast, institutional-grade Swiss design language for Mudra across all routes.
- **Decision**: Implement as a Next.js 14 client application with exact CSS tokens, fluid clamp scales, Google Fonts IBM Plex, and interactive SVG diagrams.

---

## ADR-009: Interactive Geometric Swiss Snake Companion ("Mudra Navigator")
- **Date**: 2026-10-11
- **Status**: Superseded by ADR-010
- **Context**: User requested an interactive web snake or virtual avatar that dynamically accompanies navigation, scrolling, and interaction.
- **Decision**: Implemented initial kinematic prototype.

---

## ADR-010: Removal of Snake Companion
- **Date**: 2026-10-11
- **Status**: Accepted
- **Context**: User explicitly directed to remove the snake animation ("remove the snake i do not want it") in favor of a clean, distraction-free institutional fintech interface.
- **Decision**: Completely removed `<MudraSnake />` from DOM, unmounted from all shells and landing pages, and neutralized background animation listeners.

---


## ADR-011: Person A Phase 3 Frontend Plan (Approach A)
- **Date**: 2026-10-12
- **Status**: Accepted
- **Context**: Person B completed Plan 3.3 (portfolio snapshots, equity curve history API `/api/portfolio/history`, and transaction ledger `/api/ledger`). Person A's frontend must consume these live endpoints, eliminate hardcoded mock curves, expose the immutable transaction audit ledger, and prepare the watchlist interaction for Plan 3.4.
- **Decision**:
  1. **Dynamic Equity Curve**: Replace hardcoded points with real data from `getPortfolioHistory(range)`. Handle single-point / empty-history states gracefully with baseline zero-division safeguards.
  2. **Audit Ledger UI**: Implement tabbed or dedicated transaction ledger in `client/src/app/dashboard/page.tsx` displaying exact paise credits/debits, 0.1% fees, and timestamps.
  3. **Watchlist Scaffold**: Implement star/bookmark toggles on Explorer and Stock Detail pages, with in-memory / local storage persistence ready for Person B's Plan 3.4 API sync.
  4. **15:30 IST Settlement Transparency**: Add next-close execution banner and timer for pending orders.

---

## ADR-012: Launch-Readiness Polish & Statutory Compliance (Plan 4.2A)
- **Date**: 2026-10-12
- **Status**: Accepted
- **Context**: To achieve Milestone M2 Launch-Readiness per PRD §15.1, Person A has 4 targeted frontend requirements: empty-state handling for watchlists, 0-trade onboarding guidance on the dashboard, statutory SEBI/DPDP disclaimers via a dedicated `/terms` route, and production OpenGraph/PWA metadata.
- **Decision**:
  1. **Option A Selected**: Bundle all 4 tasks into a unified, high-polish Plan 4.2A (`02A-PLAN.md`).
  2. **Watchlist UX**: Implement dedicated empty state in `StockTable.tsx` when user has 0 starred stocks, offering clear explanatory text and 1-click filter reset.
  3. **New User Onboarding**: Provide a "Getting Started with Mudra" 3-pillar guide on the Dashboard for users with 0 trades, clarifying ₹1L virtual money, 15:30 IST close, and 10% risk headroom.
  4. **Statutory & Legal Clarity**: Implement `/terms` route with comprehensive PRD §15.1 compliance disclaimers (no SEBI registration, no real money, 18+ requirement, no banking integrations), linked from `MudraFooter`.
  5. **SEO & PWA**: Expand `layout.tsx` with full OpenGraph, Twitter card metadata, and mobile viewport configuration.


