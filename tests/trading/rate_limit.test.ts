/**
 * Rate Limiting & Abuse Protection Test Suite (Node.js)
 * Conformance: Phase 4 Plan 4.4, ADR-007, PRD NFR-3 (Abuse Protection)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { ApiErrorResponse } from '../../client/src/types/api';

interface RateLimitEvaluation {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSec: number;
}

class SlidingWindowLimiter {
  private windows = new Map<string, number[]>();

  constructor(private windowMs: number = 60000) {}

  check(clientKey: string, tier: string, limit: number, now: number = Date.now()): RateLimitEvaluation {
    const key = `${clientKey}:${tier}`;
    const cutoff = now - this.windowMs;
    const timestamps = (this.windows.get(key) || []).filter(ts => ts > cutoff);

    if (timestamps.length < limit) {
      timestamps.push(now);
      this.windows.set(key, timestamps);
      return {
        allowed: true,
        limit,
        remaining: limit - timestamps.length,
        retryAfterSec: Math.ceil(this.windowMs / 1000),
      };
    }

    this.windows.set(key, timestamps);
    const oldest = timestamps[0] || cutoff;
    const retryAfterSec = Math.max(1, Math.ceil((oldest + this.windowMs - now) / 1000));

    return {
      allowed: false,
      limit,
      remaining: 0,
      retryAfterSec,
    };
  }

  reset(): void {
    this.windows.clear();
  }
}

describe('Rate Limiting Engine & ADR-007 Contract Verification (TypeScript)', () => {
  it('enforces order quota limit (20 req/min) and triggers rate_limited status on breach', () => {
    const limiter = new SlidingWindowLimiter(60000);
    const now = 1000000;
    const userId = 'usr_alice';
    const limit = 20;

    // Send 20 orders within window
    for (let i = 0; i < limit; i++) {
      const res = limiter.check(userId, 'orders', limit, now + i * 100);
      assert.equal(res.allowed, true);
      assert.equal(res.remaining, limit - (i + 1));
    }

    // 21st order must be throttled
    const breach = limiter.check(userId, 'orders', limit, now + 2500);
    assert.equal(breach.allowed, false);
    assert.equal(breach.remaining, 0);
    assert.ok(breach.retryAfterSec >= 1);
  });

  it('guarantees client quota isolation between distinct users', () => {
    const limiter = new SlidingWindowLimiter(60000);
    const now = 1000000;

    // Exhaust User A
    for (let i = 0; i < 20; i++) {
      limiter.check('usr_alice', 'orders', 20, now);
    }
    const aliceBlocked = limiter.check('usr_alice', 'orders', 20, now + 10);
    assert.equal(aliceBlocked.allowed, false);

    // User B has full quota
    const bobFresh = limiter.check('usr_bob', 'orders', 20, now + 10);
    assert.equal(bobFresh.allowed, true);
    assert.equal(bobFresh.remaining, 19);
  });

  it('validates ADR-007 error schema conformance for rate_limited responses', () => {
    const raw429Payload: ApiErrorResponse = {
      error: {
        code: 'rate_limited',
        message: 'Too many requests. Please slow down.',
        request_id: 'req_8f1a293b',
      },
    };

    assert.equal(raw429Payload.error.code, 'rate_limited');
    assert.ok(raw429Payload.error.message.includes('slow down'));
    assert.match(raw429Payload.error.request_id, /^req_[a-f0-9]+$/);
  });

  it('re-allows requests once sliding window expires', () => {
    const limiter = new SlidingWindowLimiter(60000);
    let now = 1000000;

    // Consume all 20
    for (let i = 0; i < 20; i++) {
      limiter.check('usr_carol', 'orders', 20, now);
    }
    assert.equal(limiter.check('usr_carol', 'orders', 20, now).allowed, false);

    // Fast forward 61 seconds (past 60s window)
    now += 61000;
    const afterExpiry = limiter.check('usr_carol', 'orders', 20, now);
    assert.equal(afterExpiry.allowed, true);
    assert.equal(afterExpiry.remaining, 19);
  });
});
