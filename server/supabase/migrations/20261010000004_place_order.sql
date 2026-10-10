-- Migration: 20261010000004_place_order.sql
-- Description: Virtual Trading Engine order placement stored procedure with row locking, 10% buy reservation, and idempotency
-- Conformance: PRD FR-16 to FR-21, FR-26 to FR-28, and ADR-004, ADR-005

-- 1. HELPER: Calculate latest closing price for an instrument
create or replace function public.latest_close_paise(p_instrument_id uuid)
returns bigint
language sql
stable
security definer
set search_path = public
as $$
    select close_paise 
    from public.daily_prices 
    where instrument_id = p_instrument_id 
    order by trade_date desc 
    limit 1;
$$;

-- 2. HELPER: Determine next market execution date (15:30 IST cutoff + holiday check)
create or replace function public.get_next_trade_date(p_time timestamptz default now())
returns date
language plpgsql
stable
security definer
set search_path = public
as $$
declare
    t_ist timestamp;
    t_date date;
    t_hour int;
    t_min int;
    t_sec int;
    is_closed boolean;
begin
    -- Convert given timestamp to Asia/Kolkata local time
    t_ist := p_time at time zone 'Asia/Kolkata';
    t_date := t_ist::date;
    t_hour := extract(hour from t_ist);
    t_min := extract(minute from t_ist);
    t_sec := extract(second from t_ist);

    -- 15:30:00 IST cutoff
    if t_hour > 15 or (t_hour = 15 and (t_min > 30 or (t_min = 30 and t_sec > 0))) then
        t_date := t_date + interval '1 day';
    end if;

    -- Loop to skip weekends (dow 0 = Sunday, 6 = Saturday) and calendar holidays
    loop
        -- Check weekend
        if extract(dow from t_date) in (0, 6) then
            t_date := t_date + interval '1 day';
            continue;
        end if;

        -- Check trading_calendar table if date is marked closed
        select exists (
            select 1 from public.trading_calendar 
            where trade_date = t_date and is_open = false
        ) into is_closed;

        if is_closed then
            t_date := t_date + interval '1 day';
            continue;
        end if;

        exit;
    end loop;

    return t_date;
end;
$$;

-- 3. CORE STORED PROCEDURE: place_order()
create or replace function public.place_order(
    p_symbol text,
    p_side text,
    p_qty int,
    p_client_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    uid uuid := auth.uid();
    inst public.instruments%rowtype;
    w public.wallets%rowtype;
    h public.holdings%rowtype;
    last_close bigint;
    est_price bigint;
    trade_val bigint;
    est_fee bigint;
    est_cost bigint := 0;
    oid uuid;
    tdate date;
begin
    -- 1. Authentication check
    if uid is null then
        raise exception 'not_authenticated';
    end if;

    -- 2. Input validation
    if p_side not in ('BUY', 'SELL') then
        raise exception 'bad_side';
    end if;

    if p_qty < 1 or p_qty > 100000 then
        raise exception 'bad_quantity';
    end if;

    if p_client_id is null then
        raise exception 'bad_client_id';
    end if;

    -- 3. Idempotency check: replay of same client_order_id returns existing order
    select id into oid 
    from public.orders 
    where user_id = uid and client_order_id = p_client_id;
    if found then
        return oid;
    end if;

    -- 4. Instrument verification
    select * into inst 
    from public.instruments 
    where symbol = upper(trim(p_symbol)) and is_active = true;
    if not found then
        raise exception 'unknown_instrument';
    end if;

    -- 5. Acquire pessimistic row lock on user wallet
    select * into w 
    from public.wallets 
    where user_id = uid 
    for update;
    if not found then
        raise exception 'wallet_not_found';
    end if;

    -- 6. Compute execution date
    tdate := public.get_next_trade_date(now());

    -- 7. Execute side-specific reservation logic
    if p_side = 'BUY' then
        last_close := public.latest_close_paise(inst.id);
        if last_close is null or last_close <= 0 then
            raise exception 'market_data_unavailable';
        end if;

        -- 10% safety buffer reservation
        est_price := (last_close * 110) / 100;
        trade_val := est_price * p_qty;
        est_fee := (trade_val + 500) / 1000; -- 0.1% fee rounded to nearest paisa
        est_cost := trade_val + est_fee;

        if w.cash_paise < est_cost then
            raise exception 'insufficient_cash';
        end if;

        -- Move funds from free cash to reserved cash
        update public.wallets 
        set 
            cash_paise = cash_paise - est_cost,
            reserved_paise = reserved_paise + est_cost,
            version = version + 1
        where user_id = uid;

    else -- SELL
        -- Acquire pessimistic lock on holding
        select * into h 
        from public.holdings 
        where user_id = uid and instrument_id = inst.id 
        for update;

        if not found or (h.qty - h.reserved_qty) < p_qty then
            raise exception 'insufficient_holdings';
        end if;

        -- Reserve shares to prevent double-selling
        update public.holdings 
        set 
            reserved_qty = reserved_qty + p_qty,
            updated_at = now()
        where user_id = uid and instrument_id = inst.id;
    end if;

    -- 8. Insert order record with status PENDING
    insert into public.orders (
        user_id,
        instrument_id,
        side,
        qty,
        status,
        reserved_paise,
        target_trade_date,
        client_order_id,
        created_at
    ) values (
        uid,
        inst.id,
        p_side,
        p_qty,
        'PENDING',
        coalesce(est_cost, 0),
        tdate,
        p_client_id,
        now()
    )
    returning id into oid;

    return oid;
end;
$$;

-- Grant execution privileges
grant execute on function public.place_order(text, text, int, uuid) to authenticated;
grant execute on function public.latest_close_paise(uuid) to authenticated, anon;
grant execute on function public.get_next_trade_date(timestamptz) to authenticated, anon;
