# Plan 1.4 Summary: Stock Detail Page & Buy/Sell Order Modals

## Deliverables Completed
1. **Stock Detail Page (`src/app/stock/[symbol]/page.tsx`)**:
   - Dynamic route for any ticker symbol (e.g. `RELIANCE`, `TCS`, `INFY`).
   - `src/components/stock/StockHeader.tsx`: Symbol, Exchange badge, Sector badge, Starred toggle, and formatted EOD price with Day Change percentage.
   - `src/components/stock/PriceChart.tsx`: Vector SVG sparkline chart with Stormy Teal (`#3c6e71`) gradient fill, timeframe selector toggles (`1D`, `1W`, `1M`, `6M`, `1Y`), gridlines, and EOD labels.
   - `src/components/stock/KeyStatistics.tsx`: Previous close, Lot size (1 share), 52-week High/Low, Settlement rule, and 0.1% simulated fee notice.
   - User active holding summary card showing current shares, average cost, unrealized P&L, and position value.
   - Fixed bottom action bar on mobile and desktop with instant "Buy / Long" and "Sell / Exit" triggers.
2. **Buy & Sell Order Modals (`src/components/trade/`)**:
   - Extracted and converted from `designs/stitch/06-sell-order-modal.html` and `07-buy-order-modal.html`.
   - `OrderModal.tsx`: Buy/Sell tab toggle, integer quantity stepper with [-] and [+] controls, cash/holding pre-submission validations.
   - `OrderCalculationBreakdown.tsx`: Real-time calculation of gross trade value, simulated brokerage fee (0.1%), safety reservation buffer (+10% for BUY), and remaining virtual wallet balance.
   - Next-close callout banner: "Orders fill at official next market close (15:30 IST)."
   - `OrderSuccessState.tsx`: Interactive confirmation showing generated `order_id`, `PENDING` status, target execution date, and return action.

## Verification
- `npm run type-check` (`tsc --noEmit`) passes with 0 errors.
- `npm run build` compiled all routes (`/`, `/explore`, `/stock/[symbol]`).
- Phase 1 (Week 1 Frontend Deliverables for Person A) is now 100% complete!
