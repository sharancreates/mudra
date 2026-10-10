# TODO.md — Active Task Board

## Week 1 Tasks (Person B: Backend & Data Lead)

- [x] **Day 1: Enquiries & Contract Freeze (Wave 1)**
  - [x] Draft & track data licensing enquiries in `docs/data-licensing/enquiries.md` (Plan 1.1)
  - [x] Freeze ADRs (ADR-004 to ADR-007) and API contracts in `docs/decisions.md` (Plan 1.1)
- [x] **Day 1-2: Database Foundation & Schema DDL (Wave 1)**
  - [x] Initialize Supabase configuration in `supabase/config.toml` (Plan 1.2)
  - [x] Author core tables migration `supabase/migrations/20261010000001_initial_schema.sql` (Plan 1.2)
- [x] **Day 2-3: User Onboarding & Auth Triggers (Wave 2)**
  - [x] Author auth trigger `handle_new_user()` creating profile, ₹1,00,000 wallet, and `INIT` ledger row (Plan 1.3)
  - [x] Implement `prevent_ledger_modification()` trigger for append-only ledger security (Plan 1.3)
- [x] **Day 3: Anti-Tampering & RLS Policies (Wave 2)**
  - [x] Enable RLS and revoke direct write privileges on money tables (Plan 1.4)
  - [x] Write automated security test `tests/security/rls_tamper_test.ts` (Plan 1.4)
- [x] **Day 3-4: 50-Stock Sample Data & Market Adapter (Wave 2)**
  - [x] Generate `data/sample_prices.csv` (50 stocks, 1-year history in paise) and `supabase/seed.sql` (Plan 1.5)
  - [x] Implement `IMarketDataAdapter` with Sample/Simulated modes and Freshness calculation (Plan 1.5)
- [ ] **Day 4-5: Trading Math & Acceptance Scenario Tests (Wave 3)**
  - [ ] Implement `calculateFee()`, `getNextExecutionDate()`, and holding math in `src/lib/trading/math.ts` (Plan 1.6)
  - [ ] Author unit tests in `tests/trading/math.test.ts` reproducing PRD Section 7.3 reference scenario to the paisa (Plan 1.6)
- [ ] **Day 5-6: Virtual Trading Engine `place_order()` (Wave 3)**
  - [ ] Author `place_order()` stored procedure with row locks, 10% buy buffer, and idempotency (Plan 1.7)
  - [ ] Author tests for order placement, idempotency, and balance checks in `tests/trading/place_order.test.ts` (Plan 1.7)
- [ ] **Day 6: Next.js Route Handlers & API Integration (Wave 4)**
  - [ ] Implement `POST` and `GET` `/api/orders` with error formatting (Plan 1.8)
  - [ ] Implement `GET` `/api/instruments` and `GET` `/api/status` route handlers (Plan 1.8)
- [ ] **Day 7: Integration Verification & Ledger Reconciliation (Wave 5)**
  - [ ] Implement nightly ledger reconciliation audit script `scripts/reconcile_wallets.ts` (Plan 1.9)
  - [ ] Execute full end-to-end integration test `tests/integration/week1_trade_loop.test.ts` (Plan 1.9)
