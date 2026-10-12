# Plan 3.4A Summary: Person A Frontend Integration — Live Portfolio Curves, Audit Ledger & Watchlist UI

> **Status:** Completed ✅  
> **Wave:** 1  
> **Lead:** Person A (Frontend & UX Lead)  
> **Target:** Live `/api/portfolio/history` SVG equity curves, `/api/ledger` transaction audit table, client-side Watchlist starring and filtering across Explorer and Stock Detail, and 15:30 IST next-close settlement queue transparency.

---

## 1. What Was Built

1. **Dynamic SVG Portfolio Equity Curve**:
   - Location: [client/src/app/dashboard/page.tsx](file:///c:/Users/Sharanya%20Nagar/Desktop/Projects/mudra/client/src/app/dashboard/page.tsx)
   - Replaced hardcoded mock date points with live `getPortfolioHistory(range)` integration querying Person B's `/api/portfolio/history?range=` endpoint.
   - Dynamic timeframe switching (`1M`, `6M`, `ALL`) with loading state and automatic SVG recalculation.
   - Built resilient safeguards for new accounts with minimal history (interpolates baseline Day 1 ₹1,00,000 so the SVG polyline never produces `NaN` or crashes).
   - Interactive hover tracking with crosshair targets and floating tooltip displaying formatted INR equity and percentage return.
   - Range statistics summary calculating exact period gain and percentage return.

2. **Immutable Transaction Audit Ledger UI**:
   - Location: [client/src/app/dashboard/page.tsx](file:///c:/Users/Sharanya%20Nagar/Desktop/Projects/mudra/client/src/app/dashboard/page.tsx)
   - Created a tabbed switcher between **Order Queue & Execution** and **Immutable Audit Ledger**.
   - Integrated `getLedger(1, 30)` to render chronological append-only records with:
     * IST-formatted timestamp
     * Color-coded transaction badges (`ORDER_BUY`, `ORDER_SELL`, `BROKERAGE_FEE`, `RESERVATION_REFUND`, `INITIAL_BALANCE`)
     * Instrument name and share quantity
     * Paise credit/debit formatted in INR (`+₹...` in Link Green, `-₹...` in Obsidian/Red)
     * Resulting cash balance after transaction
     * "Zero-Drift Immutable Ledger" guarantee seal

3. **Global Watchlist Management & UI**:
   - Location: [client/src/lib/watchlist.ts](file:///c:/Users/Sharanya%20Nagar/Desktop/Projects/mudra/client/src/lib/watchlist.ts)
   - Created `useWatchlist()` hook with reactive `localStorage` persistence and cross-tab/cross-component synchronization via custom window events.
   - Pre-wired with optimistic sync to Person B's upcoming Plan 3.4 endpoints (`POST /api/watchlist` and `DELETE /api/watchlist/{symbol}`).
   - Connected [StockTable.tsx](file:///c:/Users/Sharanya%20Nagar/Desktop/Projects/mudra/client/src/components/explorer/StockTable.tsx) with active star toggle buttons.
   - Added **"Watchlist"** filter pill to [explore/page.tsx](file:///c:/Users/Sharanya%20Nagar/Desktop/Projects/mudra/client/src/app/explore/page.tsx) allowing users to filter market instruments to only starred securities.
   - Connected [StockHeader.tsx](file:///c:/Users/Sharanya%20Nagar/Desktop/Projects/mudra/client/src/components/stock/StockHeader.tsx) to display persistent star status on Stock Detail pages.

4. **15:30 IST Settlement Queue Transparency**:
   - Added prominent Next Settlement Batch banner to the dashboard highlighting the daily 15:30 IST closing bell execution model.
   - Cleaned up special character encoding in [OrderModal.tsx](file:///c:/Users/Sharanya%20Nagar/Desktop/Projects/mudra/client/src/components/trade/OrderModal.tsx) and [OrderCalculationBreakdown.tsx](file:///c:/Users/Sharanya%20Nagar/Desktop/Projects/mudra/client/src/components/trade/OrderCalculationBreakdown.tsx).

---

## 2. Verification & Empirical Evidence

- **Dynamic History Binding**: Verified that switching `range` from `1M` to `6M` to `ALL` triggers `getPortfolioHistory()`, recalculating `minVal`, `maxVal`, and `svgCoords` without layout shifts or NaN SVG points.
- **Ledger Conformance**: Verified `getLedger()` mapping matches Person B's backend schema (`entry_type`, `amount_paise`, `balance_after_paise`, `created_at`, `symbol`, `qty`).
- **Watchlist Persistence**: Verified starring a stock on Explorer retains its starred state on the Stock Detail page and across page refreshes via `localStorage`.

---

## 3. Key Decisions & Architecture

- **Tabbed Order/Ledger Workspace**: Rather than burying the ledger under a long scroll, a clean pill-tab switcher (`Orders Queue` vs. `Audit Ledger`) keeps the dashboard compact, fast, and institutional-grade.
- **Zero Division Protection**: When `maxVal === minVal` (e.g. single Day 1 snapshot of ₹1,00,000), `valRange` defaults to `1` to avoid `0/0` division errors in SVG normalization.
