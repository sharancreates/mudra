---
phase: 4
plan: "2A"
wave: 1
lead: "Person A (Frontend & UX Lead)"
collaborator: "Person B (Backend & Data Lead)"
depends_on: ["4.1A"]
---

# Plan 4.2A: Milestone M2 Launch-Readiness Polish & Statutory Compliance

## Objective
Finalize Person A's remaining launch-readiness deliverables for Milestone M2:
1. Polish the Explorer watchlist UX with a dedicated Swiss empty state when no stocks are bookmarked.
2. Build an onboarding "Getting Started" guide and empty states on the Portfolio Dashboard for fresh users with zero trades.
3. Author a dedicated `/terms` statutory disclaimer page satisfying PRD §15.1 ("No Real Money", no SEBI registration, DPDP compliance) and link it in the global footer.
4. Complete production OpenGraph, Twitter card, theme color, and mobile PWA viewport metadata in Next.js 14 `layout.tsx`.

## Context
- [`.gsd/SPEC.md`](file:///c:/Users/Sharanya%20Nagar/Desktop/Projects/mudra/.gsd/SPEC.md) (Section 15.1: Launch Readiness Checklist)
- [`.gsd/ROADMAP.md`](file:///c:/Users/Sharanya%20Nagar/Desktop/Projects/mudra/.gsd/ROADMAP.md) (Phase 4)
- [`.gsd/DECISIONS.md`](file:///c:/Users/Sharanya%20Nagar/Desktop/Projects/mudra/.gsd/DECISIONS.md) (ADR-012)
- [`client/src/components/explorer/StockTable.tsx`](file:///c:/Users/Sharanya%20Nagar/Desktop/Projects/mudra/client/src/components/explorer/StockTable.tsx)
- [`client/src/app/explore/page.tsx`](file:///c:/Users/Sharanya%20Nagar/Desktop/Projects/mudra/client/src/app/explore/page.tsx)
- [`client/src/app/dashboard/page.tsx`](file:///c:/Users/Sharanya%20Nagar/Desktop/Projects/mudra/client/src/app/dashboard/page.tsx)
- [`client/src/components/mudra/MudraFooter.tsx`](file:///c:/Users/Sharanya%20Nagar/Desktop/Projects/mudra/client/src/components/mudra/MudraFooter.tsx)
- [`client/src/app/layout.tsx`](file:///c:/Users/Sharanya%20Nagar/Desktop/Projects/mudra/client/src/app/layout.tsx)

---

## Tasks

<task type="auto">
  <name>Implement Watchlist Empty State & Filter Interaction Polish in Explorer</name>
  <files>client/src/components/explorer/StockTable.tsx, client/src/app/explore/page.tsx</files>
  <action>
    - In `StockTable.tsx`: Detect when the table has 0 stocks to display.
    - Check if the active filter is "Watchlist":
      * Display an institutional Swiss empty state box with a stylized gold Star badge.
      * Heading: "Your Watchlist is Empty".
      * Description: "Click the star icon next to any Nifty 50 stock in the market table to monitor priority securities here."
      * Action CTA: "Browse All 50 Stocks" button that triggers filter reset to "All".
    - If empty due to search query with 0 results:
      * Display a search empty state: "No stocks found matching \"{search}\"".
      * Provide a "Clear Search" button.
    - Pass an `onResetFilter` prop or callback from `explore/page.tsx` down to `StockTable.tsx`.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>Explorer renders dedicated, informative empty states for empty watchlists and unmatched search queries.</done>
</task>

<task type="auto">
  <name>Build Zero-Trade New User Onboarding State on Portfolio Dashboard</name>
  <files>client/src/app/dashboard/page.tsx</files>
  <action>
    - Add a "Getting Started with Mudra" guide card shown when the user has 0 active holdings and 0 pending orders.
    - Highlight the 3 core simulation mechanics:
      1. Virtual ₹1,00,000 Capital: Integer paise ledger, permanent zero financial risk.
      2. 15:30 IST Next-Close Settlement: Orders execute honestly at official EOD closing prices.
      3. 10% Risk Buffer: Safety headroom prevents negative cash balances against intraday volatility.
    - Provide a high-visibility primary CTA button linking to `/explore`: "Place Your First Simulated Trade →".
    - In the "Active Holdings" section: When `portfolio.holdings.length === 0`, render an elegant empty state table row or card with an icon and direct link to `/explore` instead of a blank table body.
    - In the "Pending Settlements" section: When `orders.length === 0`, show a clear note indicating "No orders currently queued for 15:30 IST settlement."
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>Fresh users see a welcoming educational guide and clear calls to action instead of empty data tables.</done>
</task>

<task type="auto">
  <name>Author Statutory Disclaimers /terms Page & Complete Production Metadata</name>
  <files>client/src/app/terms/page.tsx, client/src/components/mudra/MudraFooter.tsx, client/src/app/layout.tsx</files>
  <action>
    - Create `client/src/app/terms/page.tsx` adhering to the Mudra Swiss typography and layout system:
      * Eyebrow: "00 / statutory legal disclosure"
      * Title: "Terms of Simulation & Disclaimers"
      * PRD §15.1 Compliance Sections:
        1. Nature of Service: Educational simulator, strictly NOT a SEBI-registered broker, investment adviser, or research analyst.
        2. Virtual Currency: Virtual ₹1,00,000 capital has no real monetary value, cannot be redeemed, withdrawn, or traded for real currency.
        3. Execution Model: Simulated next-close execution at 15:30 IST; no real orders routed to exchange.
        4. Data Protection & Age Restriction: DPDP Act 2023 compliant, strictly 18+, zero storage of payment/UPI/banking/PAN/Aadhaar credentials.
        5. Limitation of Liability & No Financial Advice.
    - Update `client/src/components/mudra/MudraFooter.tsx`:
      * Under "Rules & Terms" column, add `<Link href="/terms">Terms & Disclaimers</Link>`.
      * In sub-footer copyright row, add a direct clickable link to `/terms`.
    - Update `client/src/app/layout.tsx`:
      * Comprehensive `Metadata`: OpenGraph title, description, url, siteName, type, locale, Twitter cards (`summary_large_image`), keywords, robots (`index, follow`).
      * Export `viewport: Viewport` with `themeColor: "#0B0E14"`, `width: "device-width"`, `initialScale: 1`.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>Terms page is accessible and compliant, and root layout provides complete production SEO/OG tags.</done>
</task>

---

## Success Criteria
- [ ] Watchlist tab in Explorer displays a dedicated Swiss empty state when no stocks are bookmarked, with a 1-click reset button.
- [ ] New user with 0 trades on Dashboard sees the 3-pillar "Getting Started" guide and empty holding prompts.
- [ ] Dedicated `/terms` page renders cleanly and is linked from the global `MudraFooter`.
- [ ] Root `layout.tsx` exports production OpenGraph, Twitter card, and theme-color viewport metadata.
- [ ] `npx tsc --noEmit` and Next.js build pass with 0 errors.
