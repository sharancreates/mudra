"""
Pytest Unit Test Suite: Mudra Virtual Trading Math & PRD Section 7.3 Reference Scenario
Conformance: PRD Section 7.3 & Section 9.3 Acceptance Criteria
Anti-Float Verification: Ensures exact integer determinism to the paisa.
"""

from datetime import datetime
import pytest
import pytz
from app.core.math import (
    calculate_fee,
    calculate_buy_reservation,
    get_next_execution_date,
    update_holding_on_buy,
    update_holding_on_sell,
    calculate_unrealized_pl,
    calculate_portfolio_equity,
)


def test_calculate_fee_rounding():
    # 14,000.00 rupees = 1,400,000 paise -> 0.1% = 14.00 rupees = 1,400 paise
    assert calculate_fee(1400000) == 1400

    # 7,100.00 rupees = 710,000 paise -> 0.1% = 7.10 rupees = 710 paise
    assert calculate_fee(710000) == 710

    # 8,700.00 rupees = 870,000 paise -> 0.1% = 8.70 rupees = 870 paise
    assert calculate_fee(870000) == 870

    # Fractional paisa rounding: 1,455 paise * 0.001 = 1.455 paise -> rounds to 1 paisa
    assert calculate_fee(1455) == 1

    # Fractional paisa rounding: 1,550 paise * 0.001 = 1.550 paise -> rounds to 2 paise
    assert calculate_fee(1550) == 2

    # Zero or negative
    assert calculate_fee(0) == 0
    assert calculate_fee(-100) == 0


def test_calculate_buy_reservation():
    # 10 shares at ₹1,400.00 (140,000 paise)
    # est_price = 140,000 * 1.10 = 154,000 paise (₹1,540.00)
    # trade_value = 154,000 * 10 = 1,540,000 paise
    # fee = 1,540 paise
    # total = 1,541,540 paise
    res = calculate_buy_reservation(140000, 10)
    assert res["estimated_price_paise"] == 154000
    assert res["estimated_fee_paise"] == 1540
    assert res["total_reserved_paise"] == 1541540


def test_anti_float_assertion_guards():
    # Passing floats instead of integer paise MUST trigger AssertionError
    with pytest.raises(AssertionError, match="Float contamination"):
        calculate_fee(1400.50)  # type: ignore

    with pytest.raises(AssertionError, match="Float contamination"):
        calculate_buy_reservation(140000.0, 10)  # type: ignore


def test_prd_section_7_3_reference_acceptance_scenario():
    """
    Direct reproduction of PRD Section 7.3 worked example to the paisa.
    """
    # Step 0: Starting cash = ₹1,00,000.00 (10,000,000 paise)
    cash_paise = 10000000
    holding_qty = 0
    cost_basis_paise = 0

    # STEP 1: Buy 10 shares at ₹1,400.00 (fill price = 140,000 paise)
    # Fee = 0.1% of 14,000.00 = ₹14.00 (1,400 paise)
    step1_fee = calculate_fee(140000 * 10)
    assert step1_fee == 1400  # ₹14.00

    step1 = update_holding_on_buy(holding_qty, cost_basis_paise, 10, 140000, step1_fee)
    cash_paise -= step1["cash_out_paise"]
    holding_qty = step1["new_qty"]
    cost_basis_paise = step1["new_cost_basis_paise"]

    assert cash_paise == 8598600  # Cash ₹85,986.00
    assert holding_qty == 10  # Holding 10
    assert cost_basis_paise == 1401400  # Cost ₹14,014.00
    assert step1["avg_price_paise"] == 140140  # Avg price ₹1,401.40

    # STEP 2: Buy 5 more at ₹1,420.00 (fill price = 142,000 paise)
    # Fee = 0.1% of 7,100.00 = ₹7.10 (710 paise)
    step2_fee = calculate_fee(142000 * 5)
    assert step2_fee == 710  # ₹7.10

    step2 = update_holding_on_buy(holding_qty, cost_basis_paise, 5, 142000, step2_fee)
    cash_paise -= step2["cash_out_paise"]
    holding_qty = step2["new_qty"]
    cost_basis_paise = step2["new_cost_basis_paise"]

    assert cash_paise == 7887890  # Cash ₹78,878.90
    assert holding_qty == 15  # Holding 15
    assert cost_basis_paise == 2112110  # Total cost basis ₹21,121.10
    assert step2["avg_price_paise"] == 140807  # Avg price ₹1,408.07 (21,121.10 / 15)

    # STEP 3: Sell 6 shares at ₹1,450.00 (fill price = 145,000 paise)
    # Fee = 0.1% of 8,700.00 = ₹8.70 (870 paise)
    step3_fee = calculate_fee(145000 * 6)
    assert step3_fee == 870  # ₹8.70

    step3 = update_holding_on_sell(holding_qty, cost_basis_paise, 6, 145000, step3_fee)
    cash_paise += step3["cash_in_paise"]
    holding_qty = step3["new_qty"]
    cost_basis_paise = step3["new_cost_basis_paise"]

    assert step3["cash_in_paise"] == 869130  # Proceeds ₹8,691.30
    assert step3["cost_of_sold_paise"] == 844844  # Cost of sold ₹8,448.44
    assert step3["realized_pl_paise"] == 24286  # Realized +₹242.86 (24,286 paise)
    assert cash_paise == 8757020  # Cash ₹87,570.20
    assert holding_qty == 9  # Holding 9
    assert cost_basis_paise == 1267266  # Cost basis ₹12,672.66

    # STEP 4: Market close moves to ₹1,460.00 (146,000 paise)
    current_val, unrealized_pl = calculate_unrealized_pl(holding_qty, 146000, cost_basis_paise)
    assert current_val == 1314000  # Holding value ₹13,140.00
    assert unrealized_pl == 46734  # Unrealized +₹467.34 (46,734 paise)

    # STEP 5: Portfolio valuation and reconciliation check
    portfolio = calculate_portfolio_equity(cash_paise, 0, current_val, 10000000)
    assert portfolio["total_equity_paise"] == 10071020  # Equity ₹1,00,710.20
    assert portfolio["return_bps"] == 71  # +71 bps = +0.71%
    assert portfolio["return_pct"] == 0.71

    # Sanity check: Realized (24,286) + Unrealized (46,734) = Total gain (71,020)
    assert step3["realized_pl_paise"] + unrealized_pl == 71020


def test_market_timing_and_execution_cutoffs():
    # 2026-10-12 (Monday) at 14:15:00 IST -> targets 2026-10-12
    # 14:15 IST = 08:45 UTC
    order_time = datetime(2026, 10, 12, 8, 45, 0, tzinfo=pytz.utc)
    assert get_next_execution_date(order_time) == "2026-10-12"

    # 2026-10-12 (Monday) at 15:30:05 IST -> targets 2026-10-13 (Tuesday)
    # 15:30:05 IST = 10:00:05 UTC
    order_time_post = datetime(2026, 10, 12, 10, 0, 5, tzinfo=pytz.utc)
    assert get_next_execution_date(order_time_post) == "2026-10-13"

    # 2026-10-16 (Friday) at 16:00:00 IST -> targets 2026-10-19 (Monday)
    friday_evening = datetime(2026, 10, 16, 10, 30, 0, tzinfo=pytz.utc)
    assert get_next_execution_date(friday_evening) == "2026-10-19"

    # Holiday test: 2026-10-19 post-cutoff targets 2026-10-20, but 20 is holiday -> targets 2026-10-21
    holidays = {"2026-10-20"}
    monday_evening = datetime(2026, 10, 19, 10, 30, 0, tzinfo=pytz.utc)
    assert get_next_execution_date(monday_evening, holidays) == "2026-10-21"
