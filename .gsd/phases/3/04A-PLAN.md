---
phase: 3
plan: "4A"
wave: 1
lead: "Person A (Frontend & UX Lead)"
collaborator: "Person B (Backend & Data Lead)"
depends_on: ["3.3"]
---

# Plan 3.4A: Person A Frontend Integration — Live Portfolio Curves, Audit Ledger & Watchlist UI

## Objective
Implement Approach A for Person A: Wire the Next.js 14 frontend directly to Person B's newly delivered Plan 3.3 APIs. Replace hardcoded mock equity curves with dynamic responsive SVG historical curves from `/api/portfolio/history`, expose the immutable transaction audit ledger from `/api/ledger`, implement client-side Watchlist starring and filtering across Explorer and Stock Detail, and add clear visual cues for 15:30 IST next-close settlement.

## Context
- [`.gsd/phases/3/03-SUMMARY.md`](file:///c:/Users/Sharanya%20Nagar/Desktop/Projects/mudra/.gsd/phases/3/03-SUMMARY.md) (Person B's API deliverables)
- [`client/src/lib/api.ts`](file:///c:/Users/Sharanya%20Nagar/Desktop/Projects/mudra/client/src/lib/api.ts) (`getPortfolioHistory`, `getLedger`, `getPortfolio`)
- [`client/src/app/dashboard/page.tsx`](file:///c:/Users/Sharanya%20Nagar/Desktop/Projects/mudra/client/src/app/dashboard/page.tsx)
- [`client/src/app/explore/page.tsx`](file:///c:/Users/Sharanya%20Nagar/Desktop/Projects/mudra/client/src/app/explore/page.tsx)
- [`client/src/app/stock/[symbol]/page.tsx`](file:///c:/Users/Sharanya%20Nagar/Desktop/Projects/mudra/client/src/app/stock/[symbol]/page.tsx)

---

## Tasks

<task type="auto">
  <name>Bind Dashboard Equity Curve to Live getPortfolioHistory() with Range Selection</name>
  <files>client/src/app/dashboard/page.tsx</files>
  <action>
    - Remove hardcoded `chartPoints = [{ label: "10 Sep", val: 10000000 }, ...]`.
    - Fetch points dynamically using `getPortfolioHistory(range)` whenever `range` ('1M' | '6M' | 'ALL') changes.
    - Provide robust safeguards for initial/empty user history (minimum 2 points rendered so SVG polyline never produces `NaN` or single-point crashes).
    - Add interactive hover state / SVG tooltips displaying the date and exact formatted INR equity (`formatINR(equity_paise)`).
    - Calculate and display total range return percentage and absolute rupee gain dynamically from selected range data.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>Equity curve updates dynamically when clicking 1M, 6M, and ALL, displaying accurate historical portfolio points.</done>
</task>

<task type="auto">
  <name>Implement Immutable Transaction Audit Ledger Section on Dashboard</name>
  <files>client/src/app/dashboard/page.tsx</files>
  <action>
    - Query `getLedger(1, 20)` in `client/src/app/dashboard/page.tsx`.
    - Add a tabbed switcher or dedicated section for **Transaction Audit Ledger**:
      * Display chronological rows with timestamp, transaction type badge (`ORDER_BUY`, `ORDER_SELL`, `FEE_0_1_PCT`, `RESERVATION_REFUND`, `INITIAL_DEPOSIT`), symbol & quantity (if applicable), and paise change.
      * Format credit transactions in `var(--mudra-link-green)` (`+₹...`) and debits in `var(--text-heading)` or `var(--mudra-node-red)`.
      * Show zero-discrepancy proof guarantee badge ("Audit-Verified Immutable Ledger").
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>Transaction ledger renders chronological append-only records from the backend API.</done>
</task>

<task type="auto">
  <name>Implement Watchlist Starring & Filter on Explorer and Stock Detail Pages</name>
  <files>client/src/app/explore/page.tsx, client/src/app/stock/[symbol]/page.tsx, client/src/lib/api.ts</files>
  <action>
    - Create a client-side watchlist state helper in `client/src/lib/watchlist.ts` (with `localStorage` persistence and fallback, structured to easily sync with Person B's Plan 3.4 `/api/watchlist` endpoints once active).
    - Add interactive star toggle button (`★` / `☆`) to stock cards on `client/src/app/explore/page.tsx`.
    - Add "Watchlist" filter pill alongside existing sector tabs ("All", "IT", "Banking", "Energy", "Automobile", "Watchlist").
    - Add star toggle button to the stock header in `client/src/app/stock/[symbol]/page.tsx`.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>Users can star/unstar stocks from Explorer and Stock Detail, and filter to view only watchlisted stocks.</done>
</task>

<task type="auto">
  <name>Add 15:30 IST Settlement Countdown & Next-Close Execution Transparency</name>
  <files>client/src/app/dashboard/page.tsx, client/src/components/trade/OrderModal.tsx</files>
  <action>
    - Add a next-close execution banner on the dashboard showing the next settlement date (next weekday at 15:30 IST) and pending order count.
    - Provide clear educational tooltip explaining why orders queue until 15:30 IST (closing-price execution model preventing market impact & licensing costs).
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>Next-close settlement timeline and queued order status are clearly communicated to the user.</done>
</task>

---

## Success Criteria
- [ ] Dashboard equity curve loads and transitions smoothly across 1M, 6M, and ALL ranges using `getPortfolioHistory`.
- [ ] Ledger audit table accurately displays transactions with exact paise amounts and fee breakdowns.
- [ ] Watchlist toggle works across Explorer and Stock Detail pages and persists across page reloads.
- [ ] `npx tsc --noEmit` passes with 0 errors.
