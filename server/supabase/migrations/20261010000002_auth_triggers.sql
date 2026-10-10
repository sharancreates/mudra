-- Migration: 20261010000002_auth_triggers.sql
-- Description: Automatic user onboarding, wallet initialization, and append-only ledger security
-- Conformance: PRD FR-7 (Wallet Initialization) & NFR-4 (Financial Correctness)

-- 1. USER ONBOARDING TRIGGER FUNCTION
-- Automatically provisions profile, wallet (₹1,00,000 / 10,000,000 paise), and INIT ledger entry
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    default_display_name text;
    user_is_adult boolean;
    terms_accepted timestamptz;
begin
    -- Extract display name from metadata or fallback to user_xxxxxxxx
    default_display_name := coalesce(
        new.raw_user_meta_data->>'display_name',
        new.raw_user_meta_data->>'full_name',
        'user_' || substring(new.id::text from 1 for 8)
    );

    -- Extract 18+ and terms acceptance from signup metadata
    user_is_adult := coalesce((new.raw_user_meta_data->>'is_adult')::boolean, true);
    terms_accepted := coalesce((new.raw_user_meta_data->>'accepted_terms_at')::timestamptz, now());

    -- 1. Create Profile
    insert into public.profiles (
        user_id,
        display_name,
        is_adult,
        accepted_terms_at,
        created_at
    ) values (
        new.id,
        default_display_name,
        user_is_adult,
        terms_accepted,
        now()
    )
    on conflict (user_id) do nothing;

    -- 2. Create Wallet with ₹1,00,000 virtual cash (10,000,000 paise)
    insert into public.wallets (
        user_id,
        cash_paise,
        reserved_paise,
        starting_paise,
        version
    ) values (
        new.id,
        10000000,
        0,
        10000000,
        1
    )
    on conflict (user_id) do nothing;

    -- 3. Record INIT ledger movement atomically (Idempotent: exactly one INIT per user)
    if not exists (
        select 1 from public.ledger_entries 
        where user_id = new.id and type = 'INIT'
    ) then
        insert into public.ledger_entries (
            user_id,
            order_id,
            instrument_id,
            type,
            qty,
            price_paise,
            cash_delta_paise,
            realized_pl_paise,
            created_at
        ) values (
            new.id,
            null,
            null,
            'INIT',
            null,
            null,
            10000000,
            0,
            now()
        );
    end if;

    return new;
end;
$$;

-- Drop trigger if already exists and bind to auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row
    execute procedure public.handle_new_user();

-- 2. LEDGER IMMUTABILITY TRIGGER
-- Enforces that ledger_entries cannot be updated or deleted by any user or administrator
create or replace function public.prevent_ledger_modification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    raise exception 'ledger_entries is append-only and cannot be updated or deleted';
end;
$$;

drop trigger if exists prevent_ledger_update_or_delete on public.ledger_entries;
create trigger prevent_ledger_update_or_delete
    before update or delete on public.ledger_entries
    for each row
    execute function public.prevent_ledger_modification();
