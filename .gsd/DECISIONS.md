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
- **Status**: Accepted
- **Context**: User requested an interactive web snake or virtual avatar that dynamically accompanies navigation, scrolling, and interaction.
- **Decision**:
  1. **Visual Form**: Articulated multi-segment geometric ribbon snake with calibrated node segments, styled in Mudra Sky Blue (`#3BBFF7`) and Signal Yellow (`#EEA02B`) with hairline node borders.
  2. **Kinematic Behavior**: Smooth scroll-driven progression that glides along the vertical spine as the user scrolls, combined with elastic spring-damped momentum toward cursor movement on desktop.
  3. **Omnipresent Deployment**: Embedded inside `MudraShell` and `page.tsx` so it follows users across all application routes (`/`, `/explore`, `/dashboard`, `/stock/[symbol]`).
  4. **Non-Intrusive Performance**: Rendered on a hardware-accelerated 2D canvas with `pointer-events: none` (zero click interference), adaptive frame throttling, and mobile touch support.
