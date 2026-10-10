---
phase: 1
plan: 4
wave: 2
depends_on: [1, 2]
---

# Plan 1.4: Stock Detail Page & Buy/Sell Order Modals

## Objective
Implement the interactive Stock Detail page with price charts and the core Buy/Sell Order Modals, implementing the exact mathematical formulas (0.1% simulated brokerage fee, 10% safety buffer for buys, integer paise calculations, and 15:30 IST next-close execution notifications) adapted from Stitch screens 04, 06, and 07.

## Context
- [`designs/stitch/04-stock-detail.html`](file:///c:/Users/Sharanya%20Nagar/Desktop/Projects/mudra/designs/stitch/04-stock-detail.html)
- [`designs/stitch/06-sell-order-modal.html`](file:///c:/Users/Sharanya%20Nagar/Desktop/Projects/mudra/designs/stitch/06-sell-order-modal.html)
- [`designs/stitch/07-buy-order-modal.html`](file:///c:/Users/Sharanya%20Nagar/Desktop/Projects/mudra/designs/stitch/07-buy-order-modal.html)
- [`.gsd/SPEC.md`](file:///c:/Users/Sharanya%20Nagar/Desktop/Projects/mudra/.gsd/SPEC.md) (Section 2 & 5)

## Tasks

<task type="auto">
  <name>Build Stock Detail page with historical line chart and key stats</name>
  <files>src/components/stock/StockHeader.tsx, src/components/stock/PriceChart.tsx, src/components/stock/KeyStatistics.tsx, src/app/stock/[symbol]/page.tsx</files>
  <action>
    Extract and adapt structure from `designs/stitch/04-stock-detail.html`:
    - Stock Header: Company name, symbol, exchange badge ("NSE"), sector, and watchlist star toggle.
    - Hero price display: Last close price in ₹ with date ("Close, 09 Oct 2026") and Freshness badge ("FRESH").
    - PriceChart: Responsive SVG or Recharts line chart with timeframe selector buttons (1D, 1W, 1M, 6M, 1Y).
    - Educational Callout: "💡 How Mudra trades: Orders placed now execute at next market close (15:30 IST)."
    - Key Statistics: Previous close, 52-week High/Low, Volume, and Lot size (1 share).
    - Fixed bottom action bar on mobile with Buy (emerald) and Sell (secondary) buttons opening the Order Sheet.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>Stock detail page renders for any symbol with chart and opens order sheets on action button clicks.</done>
</task>

<task type="auto">
  <name>Build Buy and Sell Order Sheet modals with real-time fee and reservation calculation</name>
  <files>src/components/trade/OrderModal.tsx, src/components/trade/OrderCalculationBreakdown.tsx, src/components/trade/OrderSuccessState.tsx</files>
  <action>
    Extract and adapt modals from `designs/stitch/06-sell-order-modal.html` and `designs/stitch/07-buy-order-modal.html`:
    - Tab toggle between BUY and SELL.
    - Quantity stepper input with [-] and [+] controls and whole share validation (integer >= 1).
    - Real-time calculation breakdown:
      - Trade Value = price × qty
      - Simulated Fee = round(0.001 × trade_value)
      - For BUY: Cash Reservation Buffer (10% safety margin) -> checks available free cash.
      - For SELL: Holdings check -> ensures user has sufficient unreserved shares.
    - Prominent Next-Close Notice: "Your order will enter the queue as PENDING and execute at the official closing price on 10 Oct 2026 at 15:30 IST. Final fill price may vary."
    - Submit button calls `placeOrder()` from API client, displays loading spinner, and transitions to OrderSuccessState with order id, pending badge, and target trade date.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>Order sheet accurately calculates fees, validates funds/holdings, submits pending orders, and displays success state.</done>
</task>

## Success Criteria
- [ ] Calculations match PRD formulas exactly (0.1% fee rounded to nearest paisa).
- [ ] Order submission creates a PENDING order with a UUID `client_order_id`.
- [ ] User receives clear feedback that order executes at 15:30 IST next close.
