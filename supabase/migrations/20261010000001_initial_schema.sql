-- Migration: 20261010000001_initial_schema.sql
-- Description: Initial schema for Mudra (Virtual Stock Market Simulator for NSE / BSE Equities)
-- Conformance: PRD Section 8 & Architecture Blueprint (Integer Paise Precision)

-- Ensure standard extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Ensure auth schema exists (for local testing environments outside managed Supabase)
create schema if not exists auth;

-- 1. PROFILES
-- 1:1 public user profile linked to Supabase Auth users
create table if not exists public.profiles (
    user_id uuid primary key references auth.users(id) on delete cascade,
    display_name text unique,
    is_adult boolean not null default false,
    accepted_terms_at timestamptz,
    created_at timestamptz not null default now()
);

-- 2. WALLETS
-- Virtual cash balances stored strictly in integer paise (₹1,00,000.00 = 10,000,000 paise)
create table if not exists public.wallets (
    user_id uuid primary key references public.profiles(user_id) on delete cascade,
    cash_paise bigint not null default 10000000 check (cash_paise >= 0),
    reserved_paise bigint not null default 0 check (reserved_paise >= 0),
    starting_paise bigint not null default 10000000,
    version int not null default 1
);

-- 3. INSTRUMENTS
-- Stock master list for NSE / BSE equities
create table if not exists public.instruments (
    id uuid primary key default gen_random_uuid(),
    symbol text not null,
    exchange text not null check (exchange in ('NSE', 'BSE')),
    name text not null,
    isin text,
    sector text not null,
    lot_size int not null default 1,
    is_active boolean not null default true,
    constraint uq_instrument_exchange_symbol unique(exchange, symbol)
);

-- 4. DAILY_PRICES
-- End-of-day price history in integer paise with source tracking and loaded_at timestamp
create table if not exists public.daily_prices (
    instrument_id uuid not null references public.instruments(id) on delete cascade,
    trade_date date not null,
    open_paise bigint,
    high_paise bigint,
    low_paise bigint,
    close_paise bigint not null,
    volume bigint,
    source text not null,
    loaded_at timestamptz not null default now(),
    primary key (instrument_id, trade_date)
);

-- 5. ORDERS
-- Market orders scheduled for execution at next official market close
create table if not exists public.orders (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(user_id) on delete cascade,
    instrument_id uuid not null references public.instruments(id),
    side text not null check (side in ('BUY', 'SELL')),
    qty int not null check (qty > 0 and qty <= 100000),
    status text not null check (status in ('PENDING', 'FILLED', 'REJECTED', 'CANCELLED')),
    reason text,
    reserved_paise bigint not null default 0,
    target_trade_date date not null,
    client_order_id uuid not null,
    fill_price_paise bigint,
    fee_paise bigint,
    created_at timestamptz not null default now(),
    filled_at timestamptz,
    constraint uq_user_client_order unique(user_id, client_order_id)
);

-- 6. LEDGER_ENTRIES
-- Append-only audit record of every cash movement (INIT, BUY, SELL, FEE)
create table if not exists public.ledger_entries (
    id bigserial primary key,
    user_id uuid not null references public.profiles(user_id) on delete cascade,
    order_id uuid references public.orders(id) on delete set null,
    instrument_id uuid references public.instruments(id) on delete set null,
    type text not null check (type in ('INIT', 'BUY', 'SELL', 'FEE')),
    qty int,
    price_paise bigint,
    cash_delta_paise bigint not null,
    realized_pl_paise bigint,
    created_at timestamptz not null default now()
);

-- 7. HOLDINGS
-- Current equity positions with weighted-average cost basis in paise
create table if not exists public.holdings (
    user_id uuid not null references public.profiles(user_id) on delete cascade,
    instrument_id uuid not null references public.instruments(id) on delete cascade,
    qty int not null check (qty >= 0),
    reserved_qty int not null default 0 check (reserved_qty >= 0),
    cost_basis_paise bigint not null default 0,
    updated_at timestamptz not null default now(),
    primary key (user_id, instrument_id)
);

-- 8. WATCHLIST_ITEMS
-- User stock watchlists
create table if not exists public.watchlist_items (
    user_id uuid not null references public.profiles(user_id) on delete cascade,
    instrument_id uuid not null references public.instruments(id) on delete cascade,
    added_at timestamptz not null default now(),
    primary key (user_id, instrument_id)
);

-- 9. PORTFOLIO_SNAPSHOTS
-- Daily historical snapshot per user for equity curve, returns, and leaderboard
create table if not exists public.portfolio_snapshots (
    user_id uuid not null references public.profiles(user_id) on delete cascade,
    snapshot_date date not null,
    cash_paise bigint not null,
    holdings_value_paise bigint not null,
    equity_paise bigint not null,
    return_bps int not null,
    primary key (user_id, snapshot_date)
);

-- 10. TRADING_CALENDAR
-- Market holidays and trading days
create table if not exists public.trading_calendar (
    trade_date date primary key,
    is_open boolean not null default true,
    note text
);

-- Performance Indexes
create index if not exists idx_orders_user_status on public.orders(user_id, status);
create index if not exists idx_orders_target_date_status on public.orders(target_trade_date, status);
create index if not exists idx_daily_prices_date on public.daily_prices(trade_date);
create index if not exists idx_instruments_symbol on public.instruments(symbol);
create index if not exists idx_instruments_active on public.instruments(is_active);
create index if not exists idx_ledger_user_created on public.ledger_entries(user_id, created_at desc);
create index if not exists idx_holdings_user on public.holdings(user_id);
create index if not exists idx_portfolio_snapshots_date on public.portfolio_snapshots(snapshot_date);
