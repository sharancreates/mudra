---
phase: 1
plan: 5
wave: 2
depends_on:
  - 1.2
files_modified:
  - data/sample_prices.csv
  - supabase/seed.sql
  - src/lib/data-adapter/types.ts
  - src/lib/data-adapter/index.ts
autonomous: true
user_setup: []
must_haves:
  truths:
    - "50 prominent NSE stocks across multiple sectors are seeded with valid symbols, ISINs, and 1 year of daily closes"
    - "Market Data Adapter cleanly abstracts price queries with support for Sample and Practice Market (simulated) modes"
    - "Freshness states (FRESH, DELAYED, OUTDATED) are computed deterministically per PRD Section 8.3"
  artifacts:
    - data/sample_prices.csv
    - supabase/seed.sql
    - src/lib/data-adapter/types.ts
    - src/lib/data-adapter/index.ts
---

# Plan 1.5: 50-Stock Sample Data & Market Adapter Architecture

<objective>
Generate the static 50-stock sample historical market dataset (1-year EOD closes in integer paise), author the database seed migration, and build the Market Data Adapter abstraction. This enables fully offline, legal, zero-cost development and testing decoupled from live external APIs per PRD DR-1, DR-2, and Proposal Section 5.
</objective>

<context>
Load for context:
- .gsd/SPEC.md
- docs/api.md
- .gsd/phases/1/RESEARCH.md
- supabase/migrations/20261010000001_initial_schema.sql
</context>

<tasks>

<task type="auto">
  <name>Generate 50-stock sample CSV and database seed script</name>
  <files>
    data/sample_prices.csv
    supabase/seed.sql
  </files>
  <action>
    Create the market dataset and seed script:
    
    Steps:
    1. Generate `data/sample_prices.csv` containing:
       - 50 liquid NSE instruments (e.g. RELIANCE, TCS, INFY, HDFCBANK, ICICIBANK, SBIN, BHARTIARTL, ITC, LT, HINDUNILVR, etc.) across 8+ sectors (IT, Banking, Energy, FMCG, Auto, Pharma, Metals, Infra).
       - Columns: `symbol,exchange,name,isin,sector,trade_date,open_paise,high_paise,low_paise,close_paise,volume,source`.
       - Historical closes covering the past 250 trading days (~1 full calendar year) ending on the current date, using realistic integer paise values.
    2. Author `supabase/seed.sql`:
       - Inserts the 50 instruments into `public.instruments` with `lot_size = 1` and `is_active = true`.
       - Inserts historical daily closing prices into `public.daily_prices`.
       - Populates `public.trading_calendar` with standard trading days and Indian market holidays (Diwali, Republic Day, Independence Day, Gandhi Jayanti, etc.).
    
    AVOID: Unlicensed scraping or hardcoding fluctuating live quotes into unit testing seeds.
    USE: Deterministic, cleanly structured static data in integer paise.
  </action>
  <verify>
    Test-Path "data/sample_prices.csv"
    Select-String -Path "supabase/seed.sql" -Pattern "RELIANCE", "daily_prices", "trading_calendar"
  </verify>
  <done>
    `data/sample_prices.csv` and `supabase/seed.sql` exist, seeding 50 instruments and 1 year of daily price rows.
  </done>
</task>

<task type="auto">
  <name>Implement Market Data Adapter module and freshness evaluator</name>
  <files>
    src/lib/data-adapter/types.ts
    src/lib/data-adapter/index.ts
  </files>
  <action>
    Create the data adapter abstraction in `src/lib/data-adapter/`:
    
    Steps:
    1. In `types.ts`, define:
       - `Instrument`: `id`, `symbol`, `exchange`, `name`, `sector`, `last_close_paise`, `change_bps`, `as_of`.
       - `FreshnessState`: `'FRESH' | 'DELAYED' | 'OUTDATED'`.
       - `MarketStatus`: `{ prices_as_of: string, state: FreshnessState, market_open: boolean }`.
       - Interface `IMarketDataAdapter` with methods:
         * `getLatestClose(symbol: string): Promise<{ close_paise: bigint, as_of: string, source: string }>`
         * `getDailyCloses(date: string): Promise<Map<string, bigint>>`
         * `searchInstruments(query: string, sector?: string): Promise<Instrument[]>`
         * `getStatus(): Promise<MarketStatus>`
    2. In `index.ts`, implement:
       - `SampleMarketDataAdapter`: loads from database/CSV.
       - `SimulatedMarketDataAdapter`: generates random-walk price updates for "Practice Market" mode.
       - Factory function `getMarketDataAdapter()` controlled by environment variable `MARKET_DATA_MODE` (`sample` | `simulated`).
       - Freshness state logic: if latest price is today -> `FRESH`; if past 21:00 IST without today's close -> `DELAYED`; if >= 2 trading days behind -> `OUTDATED`.
    
    AVOID: Exposing raw external vendor shapes to the rest of the application.
    USE: Stable `IMarketDataAdapter` interface adhering to PRD FR-50 and FR-43.
  </action>
  <verify>
    Select-String -Path "src/lib/data-adapter/index.ts" -Pattern "IMarketDataAdapter", "FreshnessState", "getLatestClose"
  </verify>
  <done>
    Market Data Adapter module is implemented with types, sample & simulated implementations, and freshness status calculation.
  </done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] `data/sample_prices.csv` has 50 instruments with 1 year of daily prices
- [ ] `supabase/seed.sql` contains inserts for instruments, prices, and calendar
- [ ] `src/lib/data-adapter/index.ts` exports `IMarketDataAdapter` and freshness logic
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
- [ ] Data layer operates standalone with complete offline portability
</success_criteria>
