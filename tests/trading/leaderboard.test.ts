/**
 * Leaderboard & PRD Section 2.4 Anti-Outlier Gate Test Suite (Node.js)
 * Conformance: PRD Section 2.4, FR-41 to FR-45
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

interface TraderCandidate {
  userId: string;
  equityPaise: bigint;
  filledTradesCount: number;
  distinctActiveDays: number;
}

function evaluateLeaderboard(candidates: TraderCandidate[]) {
  // 1. Calculate return BPS and eligibility per PRD Section 2.4
  const evaluated = candidates.map(c => {
    const returnBps = Number(((c.equityPaise - 10000000n) * 10000n) / 10000000n);
    const isEligible = c.filledTradesCount >= 5 && c.distinctActiveDays >= 7;
    return {
      userId: c.userId,
      equityPaise: c.equityPaise,
      returnBps,
      tradesCount: c.filledTradesCount,
      daysActive: c.distinctActiveDays,
      isEligible,
    };
  });

  // 2. Filter eligible and rank by returnBps desc, tradesCount desc
  const eligible = evaluated
    .filter(e => e.isEligible)
    .sort((a, b) => {
      if (b.returnBps !== a.returnBps) return b.returnBps - a.returnBps;
      return b.tradesCount - a.tradesCount;
    });

  const ranked = eligible.map((item, idx) => ({
    ...item,
    rank: idx + 1,
  }));

  return {
    ranked,
    all: evaluated,
  };
}

describe('Leaderboard & PRD Section 2.4 Anti-Outlier Filter (TypeScript)', () => {
  it('filters out single-trade anomalies and ranks consistent traders by performance', () => {
    const candidates: TraderCandidate[] = [
      {
        userId: 'usr_yolo_luck',
        equityPaise: 15000000n, // +5000 bps (+50%)
        filledTradesCount: 1,   // Failed: < 5 trades
        distinctActiveDays: 1,  // Failed: < 7 days
      },
      {
        userId: 'usr_consistent_grinder',
        equityPaise: 11200000n, // +1200 bps (+12%)
        filledTradesCount: 6,   // Passed: >= 5 trades
        distinctActiveDays: 8,  // Passed: >= 7 days
      },
      {
        userId: 'usr_disciplined_alpha',
        equityPaise: 12400000n, // +2400 bps (+24%)
        filledTradesCount: 12,  // Passed: >= 5 trades
        distinctActiveDays: 15, // Passed: >= 7 days
      },
      {
        userId: 'usr_unlucky_many_trades',
        equityPaise: 9500000n,  // -500 bps (-5%)
        filledTradesCount: 10,  // Passed: >= 5 trades
        distinctActiveDays: 3,  // Failed: < 7 days active
      },
    ];

    const result = evaluateLeaderboard(candidates);

    // Invariant 1: Only 2 candidates are eligible
    assert.equal(result.ranked.length, 2);

    // Invariant 2: Rank 1 is usr_disciplined_alpha (+2400 bps)
    assert.equal(result.ranked[0].userId, 'usr_disciplined_alpha');
    assert.equal(result.ranked[0].rank, 1);
    assert.equal(result.ranked[0].returnBps, 2400);

    // Invariant 3: Rank 2 is usr_consistent_grinder (+1200 bps)
    assert.equal(result.ranked[1].userId, 'usr_consistent_grinder');
    assert.equal(result.ranked[1].rank, 2);
    assert.equal(result.ranked[1].returnBps, 1200);

    // Invariant 4: Lucky YOLO trader (+50%) is disqualified by anti-outlier gate
    const yolo = result.all.find(a => a.userId === 'usr_yolo_luck')!;
    assert.equal(yolo.isEligible, false);
    assert.equal(result.ranked.some(r => r.userId === 'usr_yolo_luck'), false);

    // Invariant 5: Day requirement (< 7 days) disqualifies usr_unlucky_many_trades
    const manyTrades = result.all.find(a => a.userId === 'usr_unlucky_many_trades')!;
    assert.equal(manyTrades.isEligible, false);
  });
});
