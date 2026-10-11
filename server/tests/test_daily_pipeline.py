"""
Tests for Daily Post-Market Ingestion & Settlement Pipeline (Python 3.10+)
Conformance: PRD FR-45 (Daily job), FR-46 (Reconciliation), FR-47 (Price Quarantine), FR-32, FR-36
"""

import pytest
from app.core.market_adapter import get_market_data_adapter
from app.core.settlement import settle_orders
from app.core.snapshots import generate_portfolio_snapshots, get_user_snapshots
from app.core.state import get_state_store, OrderRecord, UserHolding
from app.scripts.daily_settlement import evaluate_price_quarantine, run_daily_pipeline


@pytest.fixture(autouse=True)
def reset_state():
    """Ensure clean transactional state before every test."""
    store = get_state_store()
    store.reset()
    yield
    store.reset()


def test_price_quarantine_detects_25_pct_jump():
    """
    PRD FR-47: A close differing more than 25% from the previous close is held for manual review.
    """
    adapter = get_market_data_adapter()
    store = get_state_store()
    user_id = "usr_quarantine_test"
    wallet = store.get_or_create_wallet(user_id)

    # Place order on RELIANCE
    order = OrderRecord(
        order_id="ord_spike",
        user_id=user_id,
        symbol="RELIANCE",
        side="BUY",
        qty=5,
        status="PENDING",
        reserved_paise=140000 * 5 * 110 // 100,
        target_trade_date="2026-10-12",
        client_order_id="client_spike_1",
    )
    store.orders[order.id] = order
    wallet.reserved_paise += order.reserved_paise
    wallet.cash_paise -= order.reserved_paise

    # Inject mock price history where RELIANCE jumps 35% from 140000 to 189000 paise
    adapter.price_history_map["RELIANCE"].append({
        "date": "2026-10-12",
        "open_paise": 185000,
        "high_paise": 190000,
        "low_paise": 184000,
        "close_paise": 189000,
        "volume": 600000,
    })

    try:
        report = evaluate_price_quarantine(adapter, trade_date="2026-10-12", threshold=0.25)
        assert "RELIANCE" in report["quarantined_symbols"]
        assert report["quarantine_count"] >= 1

        # Run pipeline with quarantine active
        pipeline_res = run_daily_pipeline(
            trade_date="2026-10-12",
            quarantine_threshold=0.25,
            force=False,
            state=store,
            adapter=adapter,
        )

        # Assert RELIANCE was quarantined and order skipped
        assert "RELIANCE" in pipeline_res["quarantined_symbols"]
        assert store.orders["ord_spike"].status == "PENDING"
        assert pipeline_res["settlement"]["skipped"] == 1
        assert pipeline_res["settlement"]["total_filled"] == 0

        # Now run with force=True and verify it settles
        forced_res = run_daily_pipeline(
            trade_date="2026-10-12",
            quarantine_threshold=0.25,
            force=True,
            state=store,
            adapter=adapter,
        )
        assert store.orders["ord_spike"].status == "FILLED"
        assert forced_res["settlement"]["total_filled"] == 1
    finally:
        # Pop the temporary injected history row
        adapter.price_history_map["RELIANCE"].pop()


def test_portfolio_snapshots_integer_math_and_returns():
    """
    PRD FR-32, FR-36, FR-45:
    Daily portfolio snapshots calculate equity and return_bps in integer units.
    """
    store = get_state_store()
    adapter = get_market_data_adapter()
    user_id = "usr_investor_alice"

    wallet = store.get_or_create_wallet(user_id)
    # Starting state: ₹1,00,000 cash
    assert wallet.cash_paise == 10000000
    assert wallet.reserved_paise == 0

    # User owns 10 RELIANCE shares (cost ₹14,014.00, remaining cash ₹85,986.00)
    wallet.cash_paise = 8598600
    store.holdings[f"{user_id}:RELIANCE"] = UserHolding(
        user_id=user_id,
        symbol="RELIANCE",
        qty=10,
        cost_basis_paise=1401400,
    )

    # Closing price on 2026-10-09 is 140000 paise (₹1,400.00)
    snapshots = generate_portfolio_snapshots(
        trade_date="2026-10-09",
        state=store,
        market_adapter=adapter,
    )

    assert len(snapshots) == 1
    snap = snapshots[0]
    assert snap["user_id"] == user_id
    assert snap["cash_paise"] == 8598600
    assert snap["holdings_value_paise"] == 1400000  # 10 * 140000
    assert snap["equity_paise"] == 9998600  # 8598600 + 1400000 (after 0.1% fee: down ₹14.00)
    assert snap["return_bps"] == -1  # (9998600 - 10000000) * 10000 // 10000000 = -1 bps (-0.01%)

    # Verify query helper
    history = get_user_snapshots(user_id, state=store)
    assert len(history) == 1
    assert history[0].equity_paise == 9998600


def test_pipeline_aborts_on_reconciliation_mismatch():
    """
    PRD FR-46: Any ledger vs wallet reconciliation mismatch halts pipeline with critical failure.
    """
    store = get_state_store()
    adapter = get_market_data_adapter()
    user_id = "usr_tampered"

    wallet = store.get_or_create_wallet(user_id)
    # Artificially tamper with wallet cash without a ledger entry
    wallet.cash_paise += 500000  # +₹5,000 drift

    with pytest.raises(RuntimeError, match="Nightly reconciliation failed"):
        run_daily_pipeline(
            trade_date="2026-10-09",
            state=store,
            adapter=adapter,
        )
