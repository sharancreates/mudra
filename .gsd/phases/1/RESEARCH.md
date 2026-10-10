# Phase 1 Technical Research & Architectural Blueprint (Person B: Backend & Data)

> **Context:** Phase 1 (Week 1: Foundation and Trade Loop)  
> **Role:** Person B (Backend & Data Lead)  
> **Authority:** PRD v0.1 & Mudra Project Proposal (10 October 2026)

---

## 1. Domain & Architecture Overview

Mudra is an educational, virtual stock market simulator for NSE/BSE equities. Person B is responsible for the entire data backbone, database schema, security boundaries (RLS), trading engine core (`place_order()`), market data adapter, and API routes.

```
Browser / Frontend (Person A)
     │
     ▼  POST /api/orders  {symbol, side, qty, client_order_id}
Next.js Route Handlers (Person B)
     │
     ▼  RPC: place_order() (as authenticated user)
Supabase PostgreSQL (Person B)
  ├── profiles (1:1 with auth.users)
  ├── wallets (cash_paise, reserved_paise)
  ├── instruments (symbol, exchange, lot_size)
  ├── daily_prices (EOD closing prices in paise)
  ├── orders (status: PENDING, reserved_paise, target_trade_date)
  ├── ledger_entries (append-only cash movements: INIT, BUY, SELL, FEE)
  └── holdings (qty, reserved_qty, cost_basis_paise)
```

---

## 2. Core Technical Decisions & Rules

### 2.1 Currency & Precision: Strictly Integer Paise
- Floating-point representations (`FLOAT`, `DOUBLE`, or JS `number`) are **strictly prohibited** for financial balances.
- All monetary amounts are stored in database columns as `bigint` paise:
  * Starting balance: ₹1,00,000.00 = `10000000` paise (`100000_00`).
  * Buy reservation buffer: `est_price = latest_close * 110 / 100` (10% headroom for price drift).
  * Simulated fee: `0.1%` of trade value per side, rounded to the nearest paisa: `round(0.001 * trade_value)`.
- Conversions to Rupees occur **only** at the presentation layer.

### 2.2 Security & Anti-Tampering Perimeter
1. **Row Level Security (RLS)** is enabled on all tables.
2. Authenticated users (`authenticated` role) have **only `SELECT`** access to their own records (`user_id = auth.uid()`).
3. Direct `INSERT`, `UPDATE`, and `DELETE` on money tables (`wallets`, `holdings`, `orders`, `ledger_entries`, `portfolio_snapshots`) are explicitly **REVOKED** from browser roles.
4. Mutation of trading state is strictly routed through PostgreSQL functions declared `SECURITY DEFINER set search_path = public`.
5. The `auth.uid()` is extracted directly from the execution context, never passed as an argument.
6. Trigger on `ledger_entries` raises an exception on any attempt to `UPDATE` or `DELETE`, ensuring an immutable audit trail.
7. Database constraints provide defense-in-depth:
   * `CHECK (cash_paise >= 0)`
   * `CHECK (reserved_paise >= 0)`
   * `CHECK (qty >= 0)`
   * `UNIQUE(exchange, symbol)`
   * `UNIQUE(user_id, client_order_id)` (idempotency key)

### 2.3 Order Submission Engine: `place_order()`
- **Signature:** `place_order(p_symbol text, p_side text, p_qty int, p_client_id uuid) RETURNS uuid`
- **Execution Lifecycle:**
  1. Authenticate user (`uid := auth.uid()`). Raise `not_authenticated` if null.
  2. Validate quantity: must be an integer between 1 and 100,000. Raise `bad_quantity` otherwise.
  3. Check idempotency: if `client_order_id` already exists for this user in `orders`, return existing `order_id` immediately.
  4. Lookup active instrument: raise `unknown_instrument` if missing or inactive.
  5. Acquire pessimistic lock on wallet: `SELECT * FROM wallets WHERE user_id = uid FOR UPDATE`.
  6. Calculate `target_trade_date`: if submitted before 15:30 IST on an open trading day, target that day's close; otherwise target the next open trading day.
  7. **BUY side:**
     * `est_price = latest_close * 110 / 100`
     * `est_cost = est_price * p_qty + round(0.001 * est_price * p_qty)`
     * If `wallet.cash_paise < est_cost`: raise `insufficient_cash`.
     * Move estimated funds: `cash_paise = cash_paise - est_cost`, `reserved_paise = reserved_paise + est_cost`.
  8. **SELL side:**
     * Lock holdings: `SELECT * FROM holdings WHERE user_id = uid AND instrument_id = inst.id FOR UPDATE`.
     * Check unreserved shares: `qty - reserved_qty >= p_qty`. If not, raise `insufficient_holdings`.
     * Increment reserved shares: `reserved_qty = reserved_qty + p_qty`.
  9. Insert order with status `PENDING`, `reserved_paise = est_cost`, `target_trade_date`, and `client_order_id`. Return new order ID.

### 2.4 Reference Scenario for Test Verification
Tests must assert arithmetic matches Section 7.3 / 9.3 to the paisa:
- Starting cash: ₹1,00,000.00 (`10,000,000` paise).
- **Step 1:** Buy 10 @ ₹1,400.00 (fee ₹14.00, cost ₹14,014.00)  
  → Cash: ₹85,986.00, Holding: 10, Avg: ₹1,401.40.
- **Step 2:** Buy 5 @ ₹1,420.00 (fee ₹7.10, cost ₹7,107.10)  
  → Cash: ₹78,878.90, Holding: 15, Cost basis: ₹21,121.10, Avg: ₹1,408.07.
- **Step 3:** Sell 6 @ ₹1,450.00 (fee ₹8.70, proceeds ₹8,691.30)  
  → Cost of sold: ₹21,121.10 × 6 / 15 = ₹8,448.44.  
  → Realized P&L: ₹8,691.30 - ₹8,448.44 = **+₹242.86**.  
  → Cash: ₹87,570.20, Holding: 9, Remaining cost basis: ₹12,672.66.
- **Step 4:** Close moves to ₹1,460.00  
  → Holding value: 9 × ₹1,460 = ₹13,140.00.  
  → Unrealized P&L: ₹13,140.00 - ₹12,672.66 = **+₹467.34**.  
  → Total Equity: ₹87,570.20 + ₹13,140.00 = **₹1,00,710.20** (+0.71%).  
  → Sanity Check: Realized (+242.86) + Unrealized (+467.34) = +710.20.

### 2.5 Market Data Adapter & Freshness Protocol
- **Adapter Interface:**
  * `getDailyCloses(date: string): Promise<Record<string, bigint>>`
  * `getLatestClose(symbol: string): Promise<{ close_paise: bigint, as_of: string }>`
  * `getFreshnessState(): 'FRESH' | 'DELAYED' | 'OUTDATED'`
- **Freshness rules:**
  * `FRESH`: Today's close loaded.
  * `DELAYED`: After 21:00 IST on a trading day without today's close.
  * `OUTDATED`: No new close for >= 2 trading days. UI displays amber/red banners; orders pause if outdated.
- **Sample Data:** 50 liquid NSE tickers (NIFTY 50 top components) across diverse sectors with 1 year of daily historical prices in integer paise.

---

## 3. Plan Decomposition for Week 1 (Person B)

- **Wave 1 (Foundation):**
  * `01-PLAN.md`: Data Licensing Inquiries & Contract Synchronization
  * `02-PLAN.md`: Database Migration Scaffold & Schema DDL Definition
- **Wave 2 (Security, Auth & Data):**
  * `03-PLAN.md`: User Onboarding, Wallet Trigger & Immutable Ledger
  * `04-PLAN.md`: Row Level Security & Anti-Tampering Hardening
  * `05-PLAN.md`: 50-Stock Sample Data & Market Adapter Architecture
- **Wave 3 (Trading Engine Core):**
  * `06-PLAN.md`: Trading Math Engine & Acceptance Scenario Unit Tests
  * `07-PLAN.md`: Virtual Trading Engine `place_order()` Stored Procedure
- **Wave 4 (API Routes):**
  * `08-PLAN.md`: Next.js Route Handlers & JSON Contract Conformance
- **Wave 5 (Verification):**
  * `09-PLAN.md`: End-to-End Trade Loop Verification & Reconciliation Audit
