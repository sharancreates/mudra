# JOURNAL.md — Project Activity & Session Log

## Session: 2026-10-10 20:00 IST (Person A: Frontend & UX Lead)

### Objective
Initialize Project Mudra, establish custom 5-color palette design system, download and adapt 7 Stitch wireframe screens, implement Next.js 14 frontend trade loop, and prepare clean handoff for Person B.

### Accomplished
1. **Design System & Assets**:
   - Downloaded and saved all 7 Stitch screens (PNG screenshots and HTML code) to `designs/stitch/`.
   - Established custom palette tokens (`Graphite: #353535`, `Stormy Teal: #3c6e71`, `White: #ffffff`, `Alabaster Grey: #d9d9d9`, `Yale Blue: #284b63`).
   - Authored Indian Rupee formatters (`formatINR()` in ₹ Lakh/Crore) and persistent disclaimer warning banners.
2. **Frontend Implementation (Wave 1 & Wave 2)**:
   - Built 50-stock NSE market fixture and typed API client (`src/lib/api.ts`).
   - Implemented Landing Page (`/`), Statutory 18+ DPDP Auth Modal, Market Explorer (`/explore`) with live search & sector filters.
   - Implemented Stock Detail Page (`/stock/[symbol]`) with interactive timeframe charts, key stats, and Buy/Sell Order Modals (`OrderModal.tsx`).
   - Added Authenticated Trading Dashboard (`/dashboard`) with live portfolio metrics, equity performance curve, and active holdings table.
3. **Repository Architecture**:
   - Reorganized into clean client-server architecture:
     - `client/` for all Next.js React frontend code, styles, and components.
     - `server/` for market data adapter, Supabase migrations, seed data, and tests.
   - Root `package.json` proxy scripts (`npm run dev`, `npm run build`, `npm run type-check`).
4. **Verification**:
   - `npm run type-check` passed with 0 errors.
   - `npm run build` compiled all routes successfully (`/`, `/dashboard`, `/explore`, `/stock/[symbol]`).

### Paused Because
Week 1 Frontend deliverables for Person A are 100% complete. Handing off session to Person B (Backend and Data Lead) to execute remaining backend trading engine plans.

### Handoff Notes for Person B
- Person B's pending plans are in `.gsd/phases/1/06-PLAN.md` through `09-PLAN.md`.
- Next task to execute: Plan 1.6 (`06-PLAN.md` - Trading Math Engine & Acceptance Scenario Unit Tests).
- Backend files are located in `server/` (`server/supabase/`, `server/src/data-adapter/`, `server/data/`, `server/tests/`).
- Person A's frontend is completely decoupled via `docs/api.md` mock contracts and ready for integration.

---

## Session: 2026-10-11 08:30 IST (Person A: Frontend & UX Lead - Week 1 Debugging)

### Objective
Systematically investigate, debug, and verify end-to-end integration between Person A's frontend (`client/`) and Person B's newly delivered backend route handlers, trading engine, and data adapter (`server/`).

### Root Causes Found & Fixed
1. **Market Data Adapter CWD Path Resolution**:
   - *Bug*: `SampleMarketDataAdapter.loadData` looked strictly at `path.resolve(process.cwd(), 'data', 'sample_prices.csv')`. When running Next.js inside `client/`, `process.cwd()` is `.../client`, causing silent return without loading 50 stocks (returning 0 instruments and rejecting orders with `404 unknown_instrument`).
   - *Fix*: Added multi-candidate path resolution searching `data/`, `server/data/`, `../data/`, `../server/data/`, and `__dirname` references.
2. **Instrument Metadata Loss**:
   - *Bug*: In `SampleMarketDataAdapter`, `name` was set to `symbol` and `sector` was hardcoded to `'Equities'`, dropping the real company name and sector from `sample_prices.csv`.
   - *Fix*: Added `metadataMap` to preserve genuine company names ("Reliance Industries Limited", "Tata Consultancy Services Limited") and sectors ("Energy", "Information Technology", "Financial Services").
3. **Frontend API Client Wire-Up**:
   - *Bug*: `client/src/lib/api.ts` was relying exclusively on in-memory arrays and static JSON, never dispatching HTTP requests to Person B's `/api/instruments`, `/api/orders`, and `/api/status` handlers.
   - *Fix*: Wired `getInstruments`, `getInstrumentDetail`, `getStatus`, `placeOrder`, and `getOrderHistory` to live Next.js route handlers with instant local fallback.
4. **Order History Visibility on Dashboard**:
   - *Bug*: While orders could be submitted, the Dashboard lacked an Orders queue to inspect pending trades and next 15:30 IST settlement dates.
   - *Fix*: Added Section 4 "Order Queue & History" to `dashboard/page.tsx` displaying order ID, side, quantity, pending badge, and scheduled close session.

### Verification
- [x] `tsc --noEmit` / `npm run type-check`: 0 TypeScript errors.
- [x] `npm run build`: Production build succeeded across all routes.
- [x] Backend test suites: 18/18 tests passed in 246ms (`math.test.ts`, `place_order.test.ts`, `week1_trade_loop.test.ts`).
- [x] Live Dev Server HTTP Verification (`http://localhost:3000`):
  - `GET /api/status` -> 200 OK (`{"prices_as_of":"2026-10-09","state":"FRESH","market_open":false}`)
  - `GET /api/instruments` -> 200 OK (50 NSE equities with real company names and sectors)
  - `POST /api/orders` -> 201 Created (`order_id: ord_pdwcnxsa`, `status: PENDING`, `reserved_paise: 770770`)
  - `POST /api/orders` (Idempotent replay) -> 200 OK (returned same order without re-reserving cash)
  - `GET /api/orders` -> 200 OK (order history retrieved correctly)

---

## Session: 2026-10-11 08:45 IST (Handoff to Person B: FastAPI Backend Conversion)

### Objective
Update project roadmap, state, and phase plans to hand over backend conversion to Person B (Backend & Data Lead) for migration to **FastAPI (Python 3.10+)** with systematic **debugging by default**.

### Accomplished
1. **Phase 2 Research Prepared** (`.gsd/phases/2/RESEARCH.md`):
   - Defined FastAPI + Uvicorn + Pydantic v2 technology stack.
   - Preserved all integer paise accounting rules and `docs/api.md` JSON contracts.
   - Specified debugging-by-default architecture: request ID tracing middleware, ISO logging, rich traceback exception handling, and anti-float assertion guards.
2. **Phase 2 Execution Plan Authored** (`.gsd/phases/2/01-PLAN.md`):
   - Task breakdown for Person B covering requirements, pytest setup (`-v -s --tb=short`), integer paise trading math port, CSV market data adapter, FastAPI routes, and nightly reconciliation script.
   - Embedded GSD debugging protocol instructions.
3. **Roadmap & State Synchronized**:
   - Updated `.gsd/ROADMAP.md` inserting Phase 2 (FastAPI Backend Conversion with Debugging by Default) and renumbering subsequent phases.
   - Updated `.gsd/STATE.md` with handoff notes for Person B to execute Plan 2.1 via `/execute 2.1`.

### Handoff Notes for Person B
- Plan file ready at `.gsd/phases/2/01-PLAN.md`.
- Ensure Python 3.10+ is available.
- Execute via `/execute 2.1`.


