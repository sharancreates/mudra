-- Migration: 20261010000003_rls_policies.sql
-- Description: Row Level Security (RLS) policies and privilege hardening for Mudra
-- Conformance: PRD NFR-5 (Security), FR-9 (Permission Isolation) & ADR-004

-- Ensure standard roles exist for standalone/test environments
do $$
begin
    if not exists (select from pg_roles where rolname = 'authenticated') then
        create role authenticated;
    end if;
    if not exists (select from pg_roles where rolname = 'anon') then
        create role anon;
    end if;
end
$$;

-- 1. ENABLE ROW LEVEL SECURITY ON ALL PUBLIC TABLES
alter table public.profiles enable row level security;
alter table public.wallets enable row level security;
alter table public.instruments enable row level security;
alter table public.daily_prices enable row level security;
alter table public.orders enable row level security;
alter table public.ledger_entries enable row level security;
alter table public.holdings enable row level security;
alter table public.watchlist_items enable row level security;
alter table public.portfolio_snapshots enable row level security;
alter table public.trading_calendar enable row level security;

-- 2. PUBLIC & DISCOVERY READ POLICIES
-- Instruments, closing prices, and trading calendar are publicly viewable
drop policy if exists select_instruments on public.instruments;
create policy select_instruments on public.instruments
    for select to authenticated, anon
    using (true);

drop policy if exists select_daily_prices on public.daily_prices;
create policy select_daily_prices on public.daily_prices
    for select to authenticated, anon
    using (true);

drop policy if exists select_trading_calendar on public.trading_calendar;
create policy select_trading_calendar on public.trading_calendar
    for select to authenticated, anon
    using (true);

-- Profiles: display names are readable for leaderboard and social discovery
drop policy if exists select_profiles on public.profiles;
create policy select_profiles on public.profiles
    for select to authenticated, anon
    using (true);

-- User can update their own display name (subject to 30-day throttle at API layer)
drop policy if exists update_own_profile on public.profiles;
create policy update_own_profile on public.profiles
    for update to authenticated
    using (user_id = auth.uid())
    with check (user_id = auth.uid());

-- 3. USER-ISOLATED FINANCIAL READ POLICIES (AUTHENTICATED ONLY)
drop policy if exists select_own_wallet on public.wallets;
create policy select_own_wallet on public.wallets
    for select to authenticated
    using (user_id = auth.uid());

drop policy if exists select_own_orders on public.orders;
create policy select_own_orders on public.orders
    for select to authenticated
    using (user_id = auth.uid());

drop policy if exists select_own_holdings on public.holdings;
create policy select_own_holdings on public.holdings
    for select to authenticated
    using (user_id = auth.uid());

drop policy if exists select_own_ledger on public.ledger_entries;
create policy select_own_ledger on public.ledger_entries
    for select to authenticated
    using (user_id = auth.uid());

drop policy if exists select_own_snapshots on public.portfolio_snapshots;
create policy select_own_snapshots on public.portfolio_snapshots
    for select to authenticated
    using (user_id = auth.uid());

-- 4. WATCHLIST USER POLICIES (READ, ADD, REMOVE)
drop policy if exists select_own_watchlist on public.watchlist_items;
create policy select_own_watchlist on public.watchlist_items
    for select to authenticated
    using (user_id = auth.uid());

drop policy if exists insert_own_watchlist on public.watchlist_items;
create policy insert_own_watchlist on public.watchlist_items
    for insert to authenticated
    with check (user_id = auth.uid());

drop policy if exists delete_own_watchlist on public.watchlist_items;
create policy delete_own_watchlist on public.watchlist_items
    for delete to authenticated
    using (user_id = auth.uid());

-- 5. ANTI-TAMPERING DEFENSE: REVOKE DIRECT MUTATION ON MONEY TABLES
-- Revoke all direct INSERT, UPDATE, DELETE privileges on money tables from client roles.
-- Mutations must only occur via SECURITY DEFINER stored procedures (ADR-004).
revoke insert, update, delete on public.wallets from authenticated, anon;
revoke insert, update, delete on public.holdings from authenticated, anon;
revoke insert, update, delete on public.orders from authenticated, anon;
revoke insert, update, delete on public.ledger_entries from authenticated, anon;
revoke insert, update, delete on public.portfolio_snapshots from authenticated, anon;
revoke insert, update, delete on public.instruments from authenticated, anon;
revoke insert, update, delete on public.daily_prices from authenticated, anon;
revoke insert, update, delete on public.trading_calendar from authenticated, anon;

-- Explicitly grant SELECT where appropriate
grant select on public.instruments, public.daily_prices, public.trading_calendar, public.profiles to anon, authenticated;
grant select on public.wallets, public.orders, public.holdings, public.ledger_entries, public.portfolio_snapshots, public.watchlist_items to authenticated;
grant insert, delete on public.watchlist_items to authenticated;
grant update (display_name) on public.profiles to authenticated;
