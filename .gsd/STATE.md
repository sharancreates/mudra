# STATE.md — Current Project State: Mudra

> **Last Updated:** 2026-10-10
> **Active Persona:** Person A (Frontend and UX)
> **Active Milestone:** v1.0 MVP
> **Active Phase:** Phase 1 (Week 1: Foundation and Trade Loop)

---

## Current Focus
Executing Week 1 deliverables for Person A:
1. Freezing API contracts and project architectural conventions.
2. Formulating high-fidelity AI wireframe prompts for the 6 primary screens to be generated in Stitch / Figma Make.
3. Setting up Next.js 14 App Router project foundation with Tailwind CSS and design tokens.
4. Implementing UI components for Landing, Market Explorer, Stock Detail, and Buy/Sell Order Sheet with mocks.

---

## Known Blockers & Dependencies
- None currently. Person A's frontend flow is decoupled from Person B's database setup using mock JSON contracts defined in `docs/api.md`.

---

## Key Context
- Project: Mudra (Paper Trading Simulator for Indian Equities - NSE/BSE).
- Starting Wallet: ₹1,00,000 virtual rupees.
- Currency rule: All money stored in integer paise (`bigint`), converted to ₹ with Indian formatting (`en-IN`) on display.
- Order type: Next-close market order with 15:30 IST cutoff and 0.1% simulated fee.
