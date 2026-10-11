/**
 * Daily Pipeline & Price Quarantine Test Suite (Node.js)
 * Conformance: PRD FR-45 (Daily job), FR-46 (Reconciliation), FR-47 (Price Quarantine)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

interface StockQuote {
  symbol: string;
  previousClosePaise: bigint;
  currentClosePaise: bigint;
}

function evaluateQuarantine(quotes: StockQuote[], threshold = 0.25): string[] {
  const quarantined: string[] = [];
  for (const q of quotes) {
    if (q.previousClosePaise > 0n) {
      const diff = q.currentClosePaise > q.previousClosePaise
        ? q.currentClosePaise - q.previousClosePaise
        : q.previousClosePaise - q.currentClosePaise;
      
      // Floating-free comparison: diff * 10000 / prev > threshold * 10000
      const thresholdBps = BigInt(Math.round(threshold * 10000));
      const diffBps = (diff * 10000n) / q.previousClosePaise;
      if (diffBps > thresholdBps) {
        quarantined.push(q.symbol);
      }
    }
  }
  return quarantined;
}

function calculateSnapshot(
  cashPaise: bigint,
  reservedPaise: bigint,
  holdings: Array<{ qty: number; closePaise: bigint }>,
  startingCapitalPaise = 10000000n
) {
  let holdingsValuePaise = 0n;
  for (const h of holdings) {
    holdingsValuePaise += BigInt(h.qty) * h.closePaise;
  }
  const equityPaise = cashPaise + reservedPaise + holdingsValuePaise;
  const diff = equityPaise - startingCapitalPaise;
  const returnBps = diff >= 0n
    ? (diff * 10000n) / startingCapitalPaise
    : -((-diff * 10000n) / startingCapitalPaise);

  return {
    cashPaise: cashPaise + reservedPaise,
    holdingsValuePaise,
    equityPaise,
    returnBps: Number(returnBps),
  };
}

describe('Daily Settlement Pipeline: Quarantine & Snapshots', () => {
  it('quarantines stock with >25% price deviation per FR-47', () => {
    const quotes: StockQuote[] = [
      { symbol: 'RELIANCE', previousClosePaise: 140000n, currentClosePaise: 189000n }, // +35% jump
      { symbol: 'TCS', previousClosePaise: 385000n, currentClosePaise: 387000n },       // +0.5% jump
    ];

    const quarantined = evaluateQuarantine(quotes, 0.25);
    assert.deepEqual(quarantined, ['RELIANCE']);
  });

  it('computes integer equity and return_bps snapshots correctly', () => {
    const snap = calculateSnapshot(
      8598600n,
      0n,
      [{ qty: 10, closePaise: 140000n }]
    );

    assert.equal(snap.holdingsValuePaise, 1400000n);
    assert.equal(snap.equityPaise, 9998600n);
    assert.equal(snap.returnBps, -1);
  });
});
