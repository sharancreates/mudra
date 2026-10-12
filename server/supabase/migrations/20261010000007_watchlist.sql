-- Migration: 20261010000007_watchlist.sql
-- Description: Implement add_to_watchlist and remove_from_watchlist stored procedures
-- Conformance: PRD FR-38 (Watchlist add, remove, list, max 50 items)

create or replace function public.add_to_watchlist(p_symbol text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_uid uuid := auth.uid();
    v_inst_id uuid;
    v_count int;
    v_exists boolean;
begin
    if v_uid is null then
        raise exception 'not_authenticated';
    end if;

    -- Lookup instrument
    select id into v_inst_id
    from public.instruments
    where symbol = upper(trim(p_symbol)) and is_active;

    if not found then
        raise exception 'unknown_instrument';
    end if;

    -- Check if already watchlisted
    select exists (
        select 1 from public.watchlist_items
        where user_id = v_uid and instrument_id = v_inst_id
    ) into v_exists;

    if v_exists then
        return jsonb_build_object(
            'symbol', upper(trim(p_symbol)),
            'status', 'already_present'
        );
    end if;

    -- Check 50-item limit per FR-38
    select count(*) into v_count
    from public.watchlist_items
    where user_id = v_uid;

    if v_count >= 50 then
        raise exception 'watchlist_limit_reached';
    end if;

    insert into public.watchlist_items (user_id, instrument_id, added_at)
    values (v_uid, v_inst_id, now())
    on conflict (user_id, instrument_id) do nothing;

    return jsonb_build_object(
        'symbol', upper(trim(p_symbol)),
        'status', 'added',
        'watchlist_count', v_count + 1
    );
end;
$$;

create or replace function public.remove_from_watchlist(p_symbol text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_uid uuid := auth.uid();
    v_inst_id uuid;
    v_count int;
begin
    if v_uid is null then
        raise exception 'not_authenticated';
    end if;

    select id into v_inst_id
    from public.instruments
    where symbol = upper(trim(p_symbol));

    if found then
        delete from public.watchlist_items
        where user_id = v_uid and instrument_id = v_inst_id;
    end if;

    select count(*) into v_count
    from public.watchlist_items
    where user_id = v_uid;

    return jsonb_build_object(
        'symbol', upper(trim(p_symbol)),
        'status', 'removed',
        'watchlist_count', v_count
    );
end;
$$;

revoke all on function public.add_to_watchlist(text) from public;
grant execute on function public.add_to_watchlist(text) to authenticated;

revoke all on function public.remove_from_watchlist(text) from public;
grant execute on function public.remove_from_watchlist(text) to authenticated;
