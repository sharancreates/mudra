-- Migration: 20261010000008_leaderboard.sql
-- Description: Implement get_leaderboard function with PRD Section 2.4 anti-outlier filter (>= 5 trades, >= 7 days)
-- Conformance: PRD Section 2.4, FR-41 to FR-45, ADR-002, ADR-005

create or replace function public.get_leaderboard(
    p_user_id uuid default null,
    p_timeframe text default 'ALL'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_as_of text;
    v_items jsonb := '[]'::jsonb;
    v_user_standing jsonb := null;
begin
    -- 1. Determine latest price date as of
    select to_char(coalesce(max(trade_date), current_date), 'YYYY-MM-DD')
    into v_as_of
    from public.daily_prices;

    if v_as_of is null then
        v_as_of := to_char(current_date, 'YYYY-MM-DD');
    end if;

    -- 2. Build ranked leaderboard items using CTE
    with latest_prices as (
        select distinct on (instrument_id)
            instrument_id,
            close_paise
        from public.daily_prices
        order by instrument_id, trade_date desc
    ),
    user_trades as (
        select
            user_id,
            count(*) filter (where status = 'FILLED') as trades_count,
            count(distinct target_trade_date) filter (where status = 'FILLED') as active_days_count
        from public.orders
        group by user_id
    ),
    user_holdings_val as (
        select
            h.user_id,
            coalesce(sum(h.qty * coalesce(lp.close_paise, 0)), 0)::bigint as holdings_value_paise
        from public.holdings h
        left join latest_prices lp on lp.instrument_id = h.instrument_id
        group by h.user_id
    ),
    trader_metrics as (
        select
            p.user_id,
            p.display_name,
            w.cash_paise,
            coalesce(hv.holdings_value_paise, 0)::bigint as holdings_value_paise,
            (w.cash_paise + coalesce(hv.holdings_value_paise, 0))::bigint as equity_paise,
            case
                when (w.cash_paise + coalesce(hv.holdings_value_paise, 0)) = 10000000 then 0
                else round((((w.cash_paise + coalesce(hv.holdings_value_paise, 0)) - 10000000)::numeric * 10000.0) / 10000000.0)::int
            end as return_bps,
            coalesce(ut.trades_count, 0)::int as trades_count,
            greatest(coalesce(ut.active_days_count, 0), 1)::int as days_active,
            (coalesce(ut.trades_count, 0) >= 5 and coalesce(ut.active_days_count, 0) >= 7) as is_eligible
        from public.profiles p
        join public.wallets w on w.user_id = p.user_id
        left join user_holdings_val hv on hv.user_id = p.user_id
        left join user_trades ut on ut.user_id = p.user_id
    ),
    ranked_eligible as (
        select
            user_id,
            display_name,
            equity_paise,
            return_bps,
            trades_count,
            days_active,
            is_eligible,
            row_number() over (order by return_bps desc, trades_count desc, equity_paise desc) as rank
        from trader_metrics
        where is_eligible = true
    ),
    all_combined as (
        select
            coalesce(r.rank, null) as rank,
            tm.user_id,
            tm.display_name,
            tm.equity_paise,
            tm.return_bps,
            tm.trades_count,
            tm.days_active,
            tm.is_eligible
        from trader_metrics tm
        left join ranked_eligible r on r.user_id = tm.user_id
    )
    select coalesce(jsonb_agg(
        jsonb_build_object(
            'rank', r.rank,
            'user_id', r.user_id,
            'display_name', r.display_name,
            'equity_paise', r.equity_paise,
            'return_bps', r.return_bps,
            'trades_count', r.trades_count,
            'days_active', r.days_active,
            'is_eligible', r.is_eligible,
            'as_of', v_as_of
        )
        order by r.rank asc
    ), '[]'::jsonb)
    into v_items
    from ranked_eligible r
    limit 50;

    -- 3. If p_user_id is provided, calculate their individual standing
    if p_user_id is not null then
        with latest_prices as (
            select distinct on (instrument_id)
                instrument_id,
                close_paise
            from public.daily_prices
            order by instrument_id, trade_date desc
        ),
        user_trades as (
            select
                user_id,
                count(*) filter (where status = 'FILLED') as trades_count,
                count(distinct target_trade_date) filter (where status = 'FILLED') as active_days_count
            from public.orders
            where user_id = p_user_id
            group by user_id
        ),
        user_holdings_val as (
            select
                h.user_id,
                coalesce(sum(h.qty * coalesce(lp.close_paise, 0)), 0)::bigint as holdings_value_paise
            from public.holdings h
            left join latest_prices lp on lp.instrument_id = h.instrument_id
            where h.user_id = p_user_id
            group by h.user_id
        ),
        my_metric as (
            select
                w.user_id,
                (w.cash_paise + coalesce(hv.holdings_value_paise, 0))::bigint as equity_paise,
                case
                    when (w.cash_paise + coalesce(hv.holdings_value_paise, 0)) = 10000000 then 0
                    else round((((w.cash_paise + coalesce(hv.holdings_value_paise, 0)) - 10000000)::numeric * 10000.0) / 10000000.0)::int
                end as return_bps,
                coalesce(ut.trades_count, 0)::int as trades_count,
                greatest(coalesce(ut.active_days_count, 0), 1)::int as days_active,
                (coalesce(ut.trades_count, 0) >= 5 and coalesce(ut.active_days_count, 0) >= 7) as is_eligible
            from public.wallets w
            left join user_holdings_val hv on hv.user_id = w.user_id
            left join user_trades ut on ut.user_id = w.user_id
            where w.user_id = p_user_id
        )
        select jsonb_build_object(
            'rank', (
                select r.rank from (
                    select
                        tm.user_id,
                        row_number() over (order by tm.return_bps desc, tm.trades_count desc) as rank
                    from (
                        select
                            p2.user_id,
                            round((((w2.cash_paise + coalesce(hv2.h_val, 0)) - 10000000)::numeric * 10000.0) / 10000000.0)::int as return_bps,
                            coalesce(ut2.trades_count, 0) as trades_count
                        from public.profiles p2
                        join public.wallets w2 on w2.user_id = p2.user_id
                        left join (
                            select h2.user_id, sum(h2.qty * coalesce(lp2.close_paise, 0)) as h_val
                            from public.holdings h2
                            left join latest_prices lp2 on lp2.instrument_id = h2.instrument_id
                            group by h2.user_id
                        ) hv2 on hv2.user_id = p2.user_id
                        left join (
                            select user_id, count(*) filter (where status = 'FILLED') as trades_count,
                                   count(distinct target_trade_date) filter (where status = 'FILLED') as days_active
                            from public.orders
                            group by user_id
                        ) ut2 on ut2.user_id = p2.user_id
                        where (coalesce(ut2.trades_count, 0) >= 5 and coalesce(ut2.days_active, 0) >= 7)
                    ) tm
                ) r where r.user_id = p_user_id
            ),
            'equity_paise', m.equity_paise,
            'return_bps', m.return_bps,
            'trades_count', m.trades_count,
            'days_active', m.days_active,
            'is_eligible', m.is_eligible
        )
        into v_user_standing
        from my_metric m;
    end if;

    return jsonb_build_object(
        'items', v_items,
        'user_standing', v_user_standing,
        'as_of', v_as_of
    );
end;
$$;
