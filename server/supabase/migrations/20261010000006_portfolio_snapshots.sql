-- Migration: 20261010000006_portfolio_snapshots.sql
-- Description: Implement generate_portfolio_snapshots stored procedure
-- Conformance: PRD FR-32 (Total equity), FR-36 (Portfolio history), FR-45 (Daily snapshots)

create or replace function public.generate_portfolio_snapshots(p_snapshot_date date)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    r_wallet record;
    v_holdings_val bigint;
    v_equity bigint;
    v_diff bigint;
    v_return_bps int;
    v_count int := 0;
begin
    -- Iterate through all users with wallets
    for r_wallet in
        select user_id, cash_paise, reserved_paise
        from public.wallets
    loop
        -- Sum holdings valuation at closing prices on or before p_snapshot_date
        select coalesce(sum(h.qty * coalesce(dp.close_paise, 0)), 0)
        into v_holdings_val
        from public.holdings h
        left join lateral (
            select close_paise
            from public.daily_prices
            where instrument_id = h.instrument_id
              and trade_date <= p_snapshot_date
            order by trade_date desc
            limit 1
        ) dp on true
        where h.user_id = r_wallet.user_id
          and h.qty > 0;

        -- Compute total equity and return in basis points
        v_equity := r_wallet.cash_paise + r_wallet.reserved_paise + v_holdings_val;
        v_diff := v_equity - 10000000; -- 10,000,000 paise starting capital (₹1,00,000)
        v_return_bps := (v_diff * 10000) / 10000000;

        -- Upsert snapshot row
        insert into public.portfolio_snapshots (
            user_id,
            snapshot_date,
            cash_paise,
            holdings_value_paise,
            equity_paise,
            return_bps
        )
        values (
            r_wallet.user_id,
            p_snapshot_date,
            r_wallet.cash_paise + r_wallet.reserved_paise,
            v_holdings_val,
            v_equity,
            v_return_bps
        )
        on conflict (user_id, snapshot_date)
        do update set
            cash_paise = excluded.cash_paise,
            holdings_value_paise = excluded.holdings_value_paise,
            equity_paise = excluded.equity_paise,
            return_bps = excluded.return_bps;

        v_count := v_count + 1;
    end loop;

    return jsonb_build_object(
        'snapshot_date', p_snapshot_date,
        'snapshots_generated', v_count
    );
end;
$$;

revoke all on function public.generate_portfolio_snapshots(date) from public;
grant execute on function public.generate_portfolio_snapshots(date) to authenticated, service_role;
