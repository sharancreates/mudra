-- Migration: 20261010000005_settle_orders.sql
-- Description: Daily closing-price order settlement engine with sells-before-buys execution order
-- Conformance: PRD Section 7 (Trading Rules), ADR-002, ADR-004, ADR-005

create or replace function public.settle_orders(p_trade_date date)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    rec record;
    w public.wallets%rowtype;
    h public.holdings%rowtype;
    close_price bigint;
    trade_val bigint;
    fee bigint;
    actual_cost bigint;
    net_proceeds bigint;
    cost_of_sold bigint;
    realized_pl bigint;
    count_sells int := 0;
    count_buys int := 0;
    count_rejected int := 0;
    count_skipped int := 0;
begin
    -- Iterate through all pending orders targeting p_trade_date or earlier.
    -- Crucial Rule: Process SELLS first (priority 1) to credit cash proceeds before processing BUYS (priority 2).
    for rec in (
        select 
            o.*,
            i.symbol as instrument_symbol
        from public.orders o
        join public.instruments i on o.instrument_id = i.id
        where o.status = 'PENDING'
          and o.target_trade_date <= p_trade_date
        order by (case when o.side = 'SELL' then 1 else 2 end), o.created_at asc
        for update of o
    ) loop
        -- 1. Fetch closing price for the target trade date
        select close_paise into close_price
        from public.daily_prices
        where instrument_id = rec.instrument_id
          and trade_date = p_trade_date;

        -- If closing price is not available for this instrument on the date, skip for future settlement
        if close_price is null or close_price <= 0 then
            count_skipped := count_skipped + 1;
            continue;
        end if;

        -- 2. Acquire lock on user wallet
        select * into w 
        from public.wallets 
        where user_id = rec.user_id 
        for update;

        if rec.side = 'SELL' then
            -- Trade value and fee calculation
            trade_val := close_price * rec.qty;
            fee := (trade_val + 500) / 1000; -- 0.1% fee rounded half-up
            net_proceeds := trade_val - fee;

            -- Acquire lock on holdings
            select * into h
            from public.holdings
            where user_id = rec.user_id and instrument_id = rec.instrument_id
            for update;

            if found and h.qty >= rec.qty then
                cost_of_sold := (h.cost_basis_paise * rec.qty) / h.qty;
                realized_pl := net_proceeds - cost_of_sold;

                -- Update holding
                update public.holdings
                set 
                    qty = qty - rec.qty,
                    reserved_qty = reserved_qty - rec.qty,
                    cost_basis_paise = cost_basis_paise - cost_of_sold,
                    updated_at = now()
                where id = h.id;

                -- Update wallet cash
                update public.wallets
                set 
                    cash_paise = cash_paise + net_proceeds,
                    version = version + 1
                where user_id = rec.user_id;

                -- Update order status
                update public.orders
                set 
                    status = 'FILLED',
                    fill_price_paise = close_price,
                    fill_qty = rec.qty,
                    updated_at = now()
                where id = rec.id;

                -- Create immutable ledger records
                insert into public.ledger_entries (
                    user_id, entry_type, order_id, cash_delta_paise, balance_after_paise, created_at
                ) values 
                (rec.user_id, 'TRADE_SELL', rec.id, trade_val, w.cash_paise + trade_val, now()),
                (rec.user_id, 'FEE', rec.id, -fee, w.cash_paise + net_proceeds, now());

                count_sells := count_sells + 1;
            else
                -- Inconsistent holdings state
                update public.orders
                set 
                    status = 'REJECTED',
                    reason = 'insufficient_holdings_at_settlement',
                    updated_at = now()
                where id = rec.id;
                count_rejected := count_rejected + 1;
            end if;

        else -- BUY
            trade_val := close_price * rec.qty;
            fee := (trade_val + 500) / 1000;
            actual_cost := trade_val + fee;

            -- Check if cash + reservation can cover actual cost
            if (w.cash_paise + rec.reserved_paise) < actual_cost then
                -- Price jump exceeded 10% buffer and user has no additional cash
                -- Refund full reserved cash
                update public.wallets
                set 
                    cash_paise = cash_paise + rec.reserved_paise,
                    reserved_paise = reserved_paise - rec.reserved_paise,
                    version = version + 1
                where user_id = rec.user_id;

                update public.orders
                set 
                    status = 'REJECTED',
                    reason = 'price_exceeded_cash',
                    updated_at = now()
                where id = rec.id;

                count_rejected := count_rejected + 1;
            else
                -- Fill buy order:
                -- Unreserve the initial buffer, and apply net deduction:
                -- wallet.reserved_paise -= rec.reserved_paise;
                -- wallet.cash_paise += (rec.reserved_paise - actual_cost);
                update public.wallets
                set 
                    cash_paise = cash_paise + (rec.reserved_paise - actual_cost),
                    reserved_paise = reserved_paise - rec.reserved_paise,
                    version = version + 1
                where user_id = rec.user_id;

                -- Upsert holding
                insert into public.holdings (
                    user_id, instrument_id, qty, reserved_qty, cost_basis_paise, updated_at
                ) values (
                    rec.user_id, rec.instrument_id, rec.qty, 0, actual_cost, now()
                )
                on conflict (user_id, instrument_id) do update
                set 
                    qty = public.holdings.qty + excluded.qty,
                    cost_basis_paise = public.holdings.cost_basis_paise + excluded.cost_basis_paise,
                    updated_at = now();

                -- Update order status
                update public.orders
                set 
                    status = 'FILLED',
                    fill_price_paise = close_price,
                    fill_qty = rec.qty,
                    updated_at = now()
                where id = rec.id;

                -- Create immutable ledger records
                insert into public.ledger_entries (
                    user_id, entry_type, order_id, cash_delta_paise, balance_after_paise, created_at
                ) values 
                (rec.user_id, 'TRADE_BUY', rec.id, -trade_val, w.cash_paise + rec.reserved_paise - trade_val, now()),
                (rec.user_id, 'FEE', rec.id, -fee, w.cash_paise + (rec.reserved_paise - actual_cost), now());

                count_buys := count_buys + 1;
            end if;
        end if;
    end loop;

    return jsonb_build_object(
        'trade_date', p_trade_date,
        'settled_sells', count_sells,
        'settled_buys', count_buys,
        'rejected', count_rejected,
        'skipped', count_skipped
    );
end;
$$;

-- Grant execution privileges to service_role and postgres
grant execute on function public.settle_orders(date) to service_role;
