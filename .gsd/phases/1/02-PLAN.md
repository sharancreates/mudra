---
phase: 1
plan: 2
wave: 1
depends_on:
  - 1.1
files_modified:
  - supabase/config.toml
  - supabase/migrations/20261010000001_initial_schema.sql
autonomous: true
user_setup: []
must_haves:
  truths:
    - "All 10 core tables defined in PRD Section 8.1 are declared in a version-controlled SQL migration"
    - "Every financial column is defined as bigint paise with non-negative check constraints"
  artifacts:
    - supabase/config.toml
    - supabase/migrations/20261010000001_initial_schema.sql
---

# Plan 1.2: Database Migration Scaffold & Schema DDL Definition

<objective>
Establish the version-controlled Supabase PostgreSQL migration harness and write the foundational schema DDL migration defining all 10 core tables, foreign keys, unique indexes, and integer paise constraints per PRD Section 8 and Proposal Section 8.
</objective>

<context>
Load for context:
- .gsd/SPEC.md
- docs/api.md
- .gsd/phases/1/RESEARCH.md
</context>

<tasks>

<task type="auto">
  <name>Initialize Supabase configuration and migration structure</name>
  <files>supabase/config.toml</files>
  <action>
    Create the `supabase/` directory layout with `supabase/config.toml` configuring local and project settings.
    
    Steps:
    1. Create `supabase/config.toml` with project id `mudra`, db port `54322`, api port `54321`, and auth settings enabled.
    2. Configure external redirect URLs for local development (`http://localhost:3000/**`).
    3. Ensure standard directories `supabase/migrations/` and `supabase/seeds/` exist.
    
    AVOID: Unversioned or ad-hoc database schemas applied outside git migrations.
    USE: Numbered, idempotent SQL migration files following timestamp prefixes (`YYYYMMDDHHMMSS_name.sql`).
  </action>
  <verify>
    Test-Path "supabase/config.toml"
  </verify>
  <done>
    `supabase/config.toml` exists with valid project configuration and migrations directory ready.
  </done>
</task>

<task type="auto">
  <name>Create initial schema DDL migration</name>
  <files>supabase/migrations/20261010000001_initial_schema.sql</files>
  <action>
    Author `supabase/migrations/20261010000001_initial_schema.sql` implementing the core schema tables:
    
    Tables to create:
    1. `profiles`: `user_id` uuid PK references auth.users(id), `display_name` text unique, `is_adult` boolean default false, `accepted_terms_at` timestamptz, `created_at` timestamptz.
    2. `wallets`: `user_id` uuid PK references profiles(user_id), `cash_paise` bigint not null default 10000000 check (cash_paise >= 0), `reserved_paise` bigint not null default 0 check (reserved_paise >= 0), `starting_paise` bigint not null default 10000000, `version` int not null default 1.
    3. `instruments`: `id` uuid PK default gen_random_uuid(), `symbol` text not null, `exchange` text not null check (exchange in ('NSE', 'BSE')), `name` text not null, `isin` text, `sector` text not null, `lot_size` int not null default 1, `is_active` boolean not null default true, constraint uq_instrument_exchange_symbol unique(exchange, symbol).
    4. `daily_prices`: `instrument_id` uuid references instruments(id), `trade_date` date not null, `open_paise` bigint, `high_paise` bigint, `low_paise` bigint, `close_paise` bigint not null, `volume` bigint, `source` text not null, `loaded_at` timestamptz not null default now(), primary key(instrument_id, trade_date).
    5. `orders`: `id` uuid PK default gen_random_uuid(), `user_id` uuid not null references profiles(user_id), `instrument_id` uuid not null references instruments(id), `side` text not null check (side in ('BUY', 'SELL')), `qty` int not null check (qty > 0 and qty <= 100000), `status` text not null check (status in ('PENDING', 'FILLED', 'REJECTED', 'CANCELLED')), `reason` text, `reserved_paise` bigint not null default 0, `target_trade_date` date not null, `client_order_id` uuid not null, `fill_price_paise` bigint, `fee_paise` bigint, `created_at` timestamptz not null default now(), `filled_at` timestamptz, constraint uq_user_client_order unique(user_id, client_order_id).
    6. `ledger_entries`: `id` bigserial PK, `user_id` uuid not null references profiles(user_id), `order_id` uuid references orders(id), `instrument_id` uuid references instruments(id), `type` text not null check (type in ('INIT', 'BUY', 'SELL', 'FEE')), `qty` int, `price_paise` bigint, `cash_delta_paise` bigint not null, `realized_pl_paise` bigint, `created_at` timestamptz not null default now().
    7. `holdings`: `user_id` uuid references profiles(user_id), `instrument_id` uuid references instruments(id), `qty` int not null check (qty >= 0), `reserved_qty` int not null default 0 check (reserved_qty >= 0), `cost_basis_paise` bigint not null default 0, `updated_at` timestamptz not null default now(), primary key(user_id, instrument_id).
    8. `watchlist_items`: `user_id` uuid references profiles(user_id), `instrument_id` uuid references instruments(id), `added_at` timestamptz not null default now(), primary key(user_id, instrument_id).
    9. `portfolio_snapshots`: `user_id` uuid references profiles(user_id), `snapshot_date` date not null, `cash_paise` bigint not null, `holdings_value_paise` bigint not null, `equity_paise` bigint not null, `return_bps` int not null, primary key(user_id, snapshot_date).
    10. `trading_calendar`: `trade_date` date PK, `is_open` boolean not null default true, `note` text.
    
    Add essential b-tree indexes on `orders(user_id, status)`, `daily_prices(trade_date)`, and `instruments(symbol)`.
    
    AVOID: Using float or numeric columns for monetary amounts.
    USE: Strictly `bigint` columns named with `_paise` suffix.
  </action>
  <verify>
    Select-String -Path "supabase/migrations/20261010000001_initial_schema.sql" -Pattern "create table if not exists wallets", "cash_paise bigint"
  </verify>
  <done>
    `20261010000001_initial_schema.sql` contains clean, error-free PostgreSQL DDL with all 10 tables, check constraints, foreign keys, and indexes.
  </done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] `supabase/config.toml` exists
- [ ] `supabase/migrations/20261010000001_initial_schema.sql` has all 10 tables defined with `bigint` paise columns
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
- [ ] DDL passes PostgreSQL syntax validation
</success_criteria>
