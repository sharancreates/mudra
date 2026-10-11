/**
 * Portfolio & Historical Curve Unit Test Suite (Node.js)
 * Conformance: PRD Section 7.3, FR-29, FR-30, FR-31, FR-32, FR-35, FR-36
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

interface Holding {
  symbol: string;
  qty: number;
  costBasisPaise: bigint;
}

class PortfolioSimulator {
  public cashPaise = 10000000n; // ₹1,00,000.00
  public reservedPaise = 0n;
  public holdings = new Map<string, Holding>();
  public realizedPlPaise = 0n;
  public ledgerDeltas: bigint[] = [10000000n];

  public buy(symbol: string, qty: number, pricePaise: bigint) {
    const tradeVal = pricePaise * BigInt(qty);
    const fee = (tradeVal + 500n) / 1000n;
    const actualCost = tradeVal + fee;

    this.cashPaise -= actualCost;
    this.ledgerDeltas.push(-actualCost);

    const existing = this.holdings.get(symbol);
    if (!existing) {
      this.holdings.set(symbol, { symbol, qty, costBasisPaise: actualCost });
    } else {
      existing.qty += qty;
      existing.costBasisPaise += actualCost;
    }
  }

  public sell(symbol: string, qty: number, pricePaise: bigint) {
    const tradeVal = pricePaise * BigInt(qty);
    const fee = (tradeVal + 500n) / 1000n;
    const netProceeds = tradeVal - fee;

    const h = this.holdings.get(symbol)!;
    const costOfSold = (h.costBasisPaise * BigInt(qty)) / BigInt(h.qty);
    const realizedPl = netProceeds - costOfSold;

    h.qty -= qty;
    h.costBasisPaise -= costOfSold;
    this.realizedPlPaise += realizedPl;

    this.cashPaise += netProceeds;
    this.ledgerDeltas.push(netProceeds);
  }

  public getSummary(closingPrices: Map<string, bigint>) {
    let holdingsValue = 0n;
    let totalInvested = 0n;

    for (const h of this.holdings.values()) {
      if (h.qty > 0) {
        const close = closingPrices.get(h.symbol) || 0n;
        holdingsValue += BigInt(h.qty) * close;
        totalInvested += h.costBasisPaise;
      }
    }

    const unrealizedPl = holdingsValue - totalInvested;
    const equity = this.cashPaise + this.reservedPaise + holdingsValue;
    const diff = equity - 10000000n;
    const returnBps = diff >= 0n ? (diff * 10000n) / 10000000n : -((-diff * 10000n) / 10000000n);

    return {
      cashPaise: this.cashPaise,
      holdingsValuePaise: holdingsValue,
      unrealizedPaise: unrealizedPl,
      realizedPaise: this.realizedPlPaise,
      equityPaise: equity,
      returnBps: Number(returnBps),
    };
  }
}

describe('Portfolio Calculations & Equity Metrics (PRD Section 7.3)', () => {
  it('reproduces Section 7.3 reference numbers through all 4 steps to the paisa', () => {
    const sim = new PortfolioSimulator();

    // Step 1: BUY 10 @ 1,400.00
    sim.buy('RELIANCE', 10, 140000n);
    assert.equal(sim.cashPaise, 8598600n);
    assert.equal(sim.holdings.get('RELIANCE')!.costBasisPaise, 1401400n);

    // Step 2: BUY 5 @ 1,420.00
    sim.buy('RELIANCE', 5, 142000n);
    assert.equal(sim.cashPaise, 7887890n);
    assert.equal(sim.holdings.get('RELIANCE')!.costBasisPaise, 2112110n);
    assert.equal(sim.holdings.get('RELIANCE')!.costBasisPaise / 15n, 140807n); // Avg 1,408.07

    // Step 3: SELL 6 @ 1,450.00
    sim.sell('RELIANCE', 6, 145000n);
    assert.equal(sim.cashPaise, 8757020n);
    assert.equal(sim.realizedPlPaise, 24286n); // +₹242.86
    assert.equal(sim.holdings.get('RELIANCE')!.qty, 9);
    assert.equal(sim.holdings.get('RELIANCE')!.costBasisPaise, 1267266n);

    // Step 4: Close @ 1,460.00
    const summary = sim.getSummary(new Map([['RELIANCE', 146000n]]));
    assert.equal(summary.holdingsValuePaise, 1314000n); // 9 * 1,460 = ₹13,140.00
    assert.equal(summary.unrealizedPaise, 46734n);       // +₹467.34
    assert.equal(summary.equityPaise, 10071020n);        // ₹1,00,710.20
    assert.equal(summary.returnBps, 71);                // +0.71%
    assert.equal(summary.realizedPaise + summary.unrealizedPaise, 71020n); // Check: 242.86 + 467.34 = 710.20

    // Check ledger delta conservation
    const sumLedger = sim.ledgerDeltas.reduce((a, b) => a + b, 0n);
    assert.equal(sim.cashPaise, sumLedger);
  });
});
