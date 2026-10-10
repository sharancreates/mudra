/**
 * Unit Test Suite: Mudra Virtual Trading Math & PRD Section 7.3 Reference Scenario
 * Conformance: PRD Section 7.3 & Section 9.3 Acceptance Criteria
 * 
 * Verifies that all calculations match the worked example to the paisa.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateFee,
  calculateBuyReservation,
  getNextExecutionDate,
  updateHoldingOnBuy,
  updateHoldingOnSell,
  calculateUnrealizedPl,
  calculatePortfolioEquity
} from '../../server/src/trading/math.ts';

describe('Trading Math: Fee & Reservation Calculations', () => {
  it('calculates 0.1% simulated fee with correct rounding to nearest paisa', () => {
    // 14,000.00 rupees = 1,400,000 paise -> 0.1% = 14.00 rupees = 1,400 paise
    assert.equal(calculateFee(1400000n), 1400n);

    // 7,100.00 rupees = 710,000 paise -> 0.1% = 7.10 rupees = 710 paise
    assert.equal(calculateFee(710000n), 710n);

    // 8,700.00 rupees = 870,000 paise -> 0.1% = 8.70 rupees = 870 paise
    assert.equal(calculateFee(870000n), 870n);

    // Fractional paisa rounding: 1,455 paise * 0.001 = 1.455 paise -> rounds to 1 paisa
    assert.equal(calculateFee(1455n), 1n);

    // Fractional paisa rounding: 1,550 paise * 0.001 = 1.550 paise -> rounds to 2 paise
    assert.equal(calculateFee(1550n), 2n);
  });

  it('calculates buy reservation with 10% safety buffer and fee', () => {
    // 10 shares at 1,400.00 (140,000 paise)
    // est_price = 140,000 * 1.10 = 154,000 paise (₹1,540.00)
    // trade_value = 154,000 * 10 = 1,540,000 paise
    // fee = 1,540 paise
    // total = 1,541,540 paise
    const res = calculateBuyReservation(140000n, 10);
    assert.equal(res.estPricePaise, 154000n);
    assert.equal(res.estFeePaise, 1540n);
    assert.equal(res.totalReservedPaise, 1541540n);
  });
});

describe('PRD Section 7.3 Reference Acceptance Scenario Walkthrough', () => {
  it('reproduces Section 7.3 reference scenario to the paisa through all 4 steps', () => {
    // Step 0: Starting cash = ₹1,00,000.00 (10,000,000 paise)
    let cashPaise = 10000000n;
    let holdingQty = 0;
    let costBasisPaise = 0n;

    // STEP 1: Buy 10 shares at ₹1,400.00 (fill price = 140,000 paise)
    // Fee = 0.1% of 14,000.00 = ₹14.00 (1,400 paise)
    const step1Fee = calculateFee(140000n * 10n);
    assert.equal(step1Fee, 1400n); // fee ₹14.00

    const step1 = updateHoldingOnBuy(holdingQty, costBasisPaise, 10, 140000n, step1Fee);
    cashPaise -= step1.cashOutPaise;
    holdingQty = step1.newQty;
    costBasisPaise = step1.newCostBasisPaise;

    assert.equal(cashPaise, 8598600n); // Cash ₹85,986.00
    assert.equal(holdingQty, 10); // Holding 10
    assert.equal(costBasisPaise, 1401400n); // Cost ₹14,014.00
    assert.equal(step1.avgPricePaise, 140140n); // Avg price ₹1,401.40

    // STEP 2: Buy 5 more at ₹1,420.00 (fill price = 142,000 paise)
    // Fee = 0.1% of 7,100.00 = ₹7.10 (710 paise)
    const step2Fee = calculateFee(142000n * 5n);
    assert.equal(step2Fee, 710n); // fee ₹7.10

    const step2 = updateHoldingOnBuy(holdingQty, costBasisPaise, 5, 142000n, step2Fee);
    cashPaise -= step2.cashOutPaise;
    holdingQty = step2.newQty;
    costBasisPaise = step2.newCostBasisPaise;

    assert.equal(cashPaise, 7887890n); // Cash ₹78,878.90
    assert.equal(holdingQty, 15); // Holding 15
    assert.equal(costBasisPaise, 2112110n); // Total cost basis ₹21,121.10
    assert.equal(step2.avgPricePaise, 140807n); // Avg price ₹1,408.07 (21,121.10 / 15)

    // STEP 3: Sell 6 shares at ₹1,450.00 (fill price = 145,000 paise)
    // Fee = 0.1% of 8,700.00 = ₹8.70 (870 paise)
    const step3Fee = calculateFee(145000n * 6n);
    assert.equal(step3Fee, 870n); // fee ₹8.70

    const step3 = updateHoldingOnSell(holdingQty, costBasisPaise, 6, 145000n, step3Fee);
    cashPaise += step3.cashInPaise;
    holdingQty = step3.newQty;
    costBasisPaise = step3.newCostBasisPaise;

    assert.equal(step3.cashInPaise, 869130n); // Proceeds ₹8,691.30
    assert.equal(step3.costOfSoldPaise, 844844n); // Cost of sold ₹8,448.44
    assert.equal(step3.realizedPlPaise, 24286n); // Realized +₹242.86
    assert.equal(cashPaise, 8757020n); // Cash ₹87,570.20
    assert.equal(holdingQty, 9); // Holding 9
    assert.equal(costBasisPaise, 1267266n); // Cost basis ₹12,672.66

    // STEP 4: Market close moves to ₹1,460.00 (146,000 paise)
    const step4 = calculateUnrealizedPl(holdingQty, 146000n, costBasisPaise);
    assert.equal(step4.currentValuePaise, 1314000n); // Holding value ₹13,140.00
    assert.equal(step4.unrealizedPlPaise, 46734n); // Unrealized +₹467.34

    // STEP 5: Portfolio valuation and reconciliation check
    const portfolio = calculatePortfolioEquity(cashPaise, 0n, step4.currentValuePaise, 10000000n);
    assert.equal(portfolio.totalEquityPaise, 10071020n); // Equity ₹1,00,710.20
    assert.equal(portfolio.returnBps, 71); // +71 bps = +0.71%
    assert.equal(portfolio.returnPct, 0.71);

    // Sanity check: Realized (24,286) + Unrealized (46,734) = Total gain (71,020)
    assert.equal(step3.realizedPlPaise + step4.unrealizedPlPaise, 71020n);
  });
});

describe('Market Timing & Execution Cutoff Rules (15:30 IST)', () => {
  it('routes orders placed before 15:30 IST on a trading day to that day close', () => {
    // 2026-10-12 (Monday) at 14:15:00 IST -> targets 2026-10-12
    // 14:15 IST = 08:45 UTC
    const orderTime = new Date('2026-10-12T08:45:00Z');
    const targetDate = getNextExecutionDate(orderTime);
    assert.equal(targetDate, '2026-10-12');
  });

  it('routes orders placed at or after 15:30 IST to the next open trading day', () => {
    // 2026-10-12 (Monday) at 15:30:05 IST -> targets 2026-10-13 (Tuesday)
    // 15:30:05 IST = 10:00:05 UTC
    const orderTime = new Date('2026-10-12T10:00:05Z');
    const targetDate = getNextExecutionDate(orderTime);
    assert.equal(targetDate, '2026-10-13');
  });

  it('routes Friday post-cutoff orders over the weekend to Monday close', () => {
    // 2026-10-16 (Friday) at 16:00:00 IST -> targets 2026-10-19 (Monday)
    const fridayEvening = new Date('2026-10-16T10:30:00Z');
    const targetDate = getNextExecutionDate(fridayEvening);
    assert.equal(targetDate, '2026-10-19');
  });

  it('skips scheduled market holidays in trading calendar', () => {
    // 2026-10-19 is an open trading day, but suppose 2026-10-20 is a holiday (Dussehra)
    const holidays = new Set(['2026-10-20']);
    // Order placed 2026-10-19 at 16:00 IST (post-cutoff) -> would be 20th, but 20th is holiday -> rolls to 21st
    const mondayEvening = new Date('2026-10-19T10:30:00Z');
    const targetDate = getNextExecutionDate(mondayEvening, holidays);
    assert.equal(targetDate, '2026-10-21');
  });
});
