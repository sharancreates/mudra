# Plan 1.2 Summary: Mock Data Fixtures & Typed Client-Side API Layer

## Deliverables Completed
1. **Mock Data Fixtures**:
   - `src/mocks/instruments.json`: 50 top NSE companies across all major sectors with symbols, names, sectors, lot sizes, `last_close_paise`, and `change_bps`.
   - `src/mocks/portfolio.json`: Mock portfolio state matching the Proposal Section 9.3 reference scenario (₹1,00,710.20 equity, RELIANCE 9 shares @ ₹1,408.07 avg cost, +₹242.86 realized P&L, +₹467.34 unrealized P&L).
   - `src/mocks/quotes.json`: Historical price data for chart rendering.
2. **Typed Interfaces (`src/types/api.ts`)**:
   - `Instrument`, `OrderRequest`, `OrderResponse`, `OrderItem`, `PortfolioSummary`, `StatusResponse`, `ApiErrorResponse`.
3. **Client API Layer (`src/lib/api.ts`)**:
   - `getInstruments(query, sector)`: Case-insensitive search and sector filtering.
   - `getInstrumentDetail(symbol)`: Stock lookup.
   - `placeOrder(req)`: In-memory simulation with 10% reservation calculation and 0.1% simulated fee, returning PENDING order targeting next close.
   - `getPortfolio()` & `getStatus()`.

## Verification
- `npm run type-check` (`tsc --noEmit`) passes with 0 errors.
- Both Plan 1.1 and Plan 1.2 in Wave 1 are now completed!
