# Plan 4.2A Summary: Milestone M2 Launch-Readiness Polish & Statutory Compliance

> **Status:** Completed ✅  
> **Wave:** 1  
> **Lead:** Person A (Frontend & UX Lead)  
> **Collaborator:** Person B (Backend & Data Lead)  
> **Target:** Watchlist dedicated empty state & filter UX in Explorer, fresh user 0-trade onboarding state on Dashboard, dedicated statutory disclaimers `/terms` page (PRD §15.1), global footer integration, and production OpenGraph/PWA metadata.

---

## 1. What Was Built

1. **Watchlist & Search Dedicated Empty States (Explorer)**:
   - Location: [`client/src/components/explorer/StockTable.tsx`](file:///c:/Users/Sharanya%20Nagar/Desktop/Projects/mudra/client/src/components/explorer/StockTable.tsx), [`client/src/app/explore/page.tsx`](file:///c:/Users/Sharanya%20Nagar/Desktop/Projects/mudra/client/src/app/explore/page.tsx)
   - When the user selects the "Watchlist" filter pill with 0 bookmarked stocks:
     * Renders an institutional Swiss empty state with a gold Star badge (`rgba(238, 160, 43, 0.12)`).
     * Clear guidance: *"You haven't pinned any securities yet. Click the star icon next to any of the 50 liquid Nifty 50 stocks in the market table to monitor priority securities here."*
     * Action CTA: *"Browse All 50 Stocks"* button that resets the sector filter to `"All"` and clears search.
   - When a search query yields 0 results, displays *"No instruments matching \"{searchQuery}\""* with a *"Reset Filters"* button.

2. **Fresh User 0-Trade Onboarding State & Table Fallbacks (Dashboard)**:
   - Location: [`client/src/app/dashboard/page.tsx`](file:///c:/Users/Sharanya%20Nagar/Desktop/Projects/mudra/client/src/app/dashboard/page.tsx)
   - **"Getting Started with Mudra" Guide Card**: Automatically displayed for users with 0 holdings and 0 pending orders.
     * Highlights the 3 core simulation pillars:
       1. **Virtual ₹1,00,000 Capital**: Integer paise ledger, permanent zero financial risk.
       2. **15:30 IST Next-Close Settlement**: Honest closing-bell order execution.
       3. **10% Risk Safety Headroom**: Protects wallets from intraday price volatility.
     * Primary CTA: *"Place Your First Simulated Trade →"* linking directly to `/explore`.
     * Dismissible with an `X` button for seasoned traders.
   - **Active Holdings Empty State**: Instead of an empty `<tbody>`, displays a helpful empty row: *"No active stock positions in your portfolio yet."* with an *"Explore 50 Nifty Equities"* button.
   - **Orders Queue Empty State**: Instead of an empty `<tbody>`, displays *"No orders currently queued for 15:30 IST settlement."*

3. **Statutory Disclaimers & Regulatory Transparency Page (`/terms`)**:
   - Location: [`client/src/app/terms/page.tsx`](file:///c:/Users/Sharanya%20Nagar/Desktop/Projects/mudra/client/src/app/terms/page.tsx)
   - Comprehensive PRD §15.1 and SEBI-unregistered simulation disclosures:
     * **Statutory SEBI Disclosure**: Mudra is strictly an educational simulator and NOT a SEBI-registered broker, research analyst, or investment adviser.
     * **Virtual Capital & "No Real Money" Guarantee**: Virtual ₹1,00,000 has zero fiat/monetary value and cannot be withdrawn or converted.
     * **Closing-Price Execution Mechanics**: Explains 15:30 IST settlement, 10% headroom buffer, and 0.1% simulated brokerage fee.
     * **DPDP Act 2023 Compliance**: Zero storage of PAN, Aadhaar, bank details, or Demat credentials.
     * **18+ Age Restriction & User Conduct**: Strict age boundary and Section 2.4 gamification rules.
     * **Limitation of Liability**: Paper trading does not equal real market psychological or financial results.
   - Wrapped in `<MudraShell activeNav="terms">` with bottom navigation CTAs to Explore, Dashboard, and Leaderboard.

4. **Global Footer Integration & Production Metadata**:
   - Location: [`client/src/components/mudra/MudraFooter.tsx`](file:///c:/Users/Sharanya%20Nagar/Desktop/Projects/mudra/client/src/components/mudra/MudraFooter.tsx), [`client/src/components/mudra/MudraShell.tsx`](file:///c:/Users/Sharanya%20Nagar/Desktop/Projects/mudra/client/src/components/mudra/MudraShell.tsx), [`client/src/app/layout.tsx`](file:///c:/Users/Sharanya%20Nagar/Desktop/Projects/mudra/client/src/app/layout.tsx)
   - Added `"Terms & Disclaimers →"` link under Rules & Terms column in `MudraFooter`.
   - Added `"Statutory Disclaimers"` link in the sub-footer copyright row.
   - Exported `viewport: Viewport` in `layout.tsx` with `themeColor: "#0B0E14"`, `width: "device-width"`, `initialScale: 1`.
   - Expanded `metadata: Metadata` with OpenGraph (`og:title`, `og:description`, `og:url`, `og:siteName`, `locale: "en_IN"`), Twitter summary cards, keywords, robots (`index, follow`), and title templates.

---

## 2. Commit Manifest

- `a7b37b5`: `feat(ui): add dedicated watchlist and search empty states in explorer`
- `1f350cb`: `feat(ui): add fresh user 0-trade onboarding guide and empty state tables to dashboard`
- `4c2871f`: `feat(legal): add statutory /terms page, footer compliance links, and production metadata`

---

## 3. Verification & Compliance Checklist

- [x] **Watchlist Empty State**: Selecting "Watchlist" with 0 starred stocks renders the Swiss gold star empty state with "Browse All 50 Stocks" reset button.
- [x] **New User Onboarding**: 0-trade user receives the 3-pillar "Getting Started" guide and empty holding prompts on Dashboard.
- [x] **Statutory Compliance (PRD §15.1)**: Dedicated `/terms` page clearly discloses non-SEBI status, zero fiat value, and DPDP compliance.
- [x] **Production Metadata**: OpenGraph, Twitter card, and theme-color viewport exported from `layout.tsx`.
