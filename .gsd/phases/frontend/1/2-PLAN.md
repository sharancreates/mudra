---
phase: 1
plan: 2
wave: 1
---

# Plan 1.2: Mock Data Fixtures & Typed Client-Side API Layer

## Objective
Establish high-fidelity mock data fixtures for 50 representative NSE instruments, closing price histories, user wallet state, and order tracking, backed by a typed API client (`src/lib/api.ts`) complying directly with the frozen `docs/api.md` contract.

## Context
- [`docs/api.md`](file:///c:/Users/Sharanya%20Nagar/Desktop/Projects/mudra/docs/api.md)
- [`.gsd/SPEC.md`](file:///c:/Users/Sharanya%20Nagar/Desktop/Projects/mudra/.gsd/SPEC.md)

## Tasks

<task type="auto">
  <name>Create 50-stock NSE market fixture and mock portfolio state</name>
  <files>src/mocks/instruments.json, src/mocks/portfolio.json, src/mocks/quotes.json</files>
  <action>
    Create realistic mock data structures for Indian equities:
    - 50 top NSE stocks across sectors (NIFTY 50 blue-chips: RELIANCE, TCS, HDFCBANK, INFY, ICICIBANK, ITC, BHARTIARTL, etc.) with symbols, names, sectors, lot_size=1, last_close_paise, and change_bps.
    - Initial virtual portfolio mock with ₹1,00,000 virtual cash (`10000000` paise), reserved paise, and reference holdings matching Section 9.3 of proposal (e.g. RELIANCE 10 shares @ ₹1,401.40).
    - Historical price points (1M, 6M, 1Y) for chart rendering.
  </action>
  <verify>node -e "const d = require('./src/mocks/instruments.json'); if (d.length < 20) throw new Error('Not enough instruments');"</verify>
  <done>JSON fixtures are syntactically valid and contain 50 realistic instruments with paise values.</done>
</task>

<task type="auto">
  <name>Implement typed API client and Next.js mock route handlers</name>
  <files>src/lib/api.ts, src/types/api.ts, src/app/api/instruments/route.ts, src/app/api/orders/route.ts</files>
  <action>
    1. Define TypeScript interfaces in `src/types/api.ts`:
       - `Instrument`, `OrderRequest`, `OrderResponse`, `PortfolioSummary`, `StatusResponse`.
    2. Build `src/lib/api.ts`:
       - `getInstruments(query?: string, sector?: string)`
       - `getInstrumentDetail(symbol: string)`
       - `placeOrder(req: OrderRequest): Promise<OrderResponse>`
       - `getPortfolio(): Promise<PortfolioSummary>`
       - `getStatus(): Promise<StatusResponse>`
    3. Implement Next.js route handlers (`/api/instruments`, `/api/orders`) returning the mock fixtures with simulated latency and idempotency checks.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>API client compiles without type errors and returns properly formatted JSON matching docs/api.md.</done>
</task>

## Success Criteria
- [ ] TypeScript types mirror `docs/api.md` with integer paise fields.
- [ ] Mock API routes return 200/201 responses for instruments and order submission.
