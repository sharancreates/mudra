/**
 * Watchlist Management Unit Test Suite (Node.js)
 * Conformance: PRD FR-38 (Watchlist add, remove, list, max 50 items)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class WatchlistManager {
  private watchlist = new Set<string>();
  private readonly MAX_LIMIT = 50;

  constructor(initialSymbols: string[] = []) {
    for (const s of initialSymbols) {
      this.watchlist.add(s.toUpperCase());
    }
  }

  public add(symbol: string): { status: 'added' | 'already_present'; count: number } {
    const sym = symbol.toUpperCase();
    if (this.watchlist.has(sym)) {
      return { status: 'already_present', count: this.watchlist.size };
    }
    if (this.watchlist.size >= this.MAX_LIMIT) {
      throw new Error('watchlist_limit_reached');
    }
    this.watchlist.add(sym);
    return { status: 'added', count: this.watchlist.size };
  }

  public remove(symbol: string): { status: 'removed'; count: number } {
    const sym = symbol.toUpperCase();
    this.watchlist.delete(sym);
    return { status: 'removed', count: this.watchlist.size };
  }

  public isStarred(symbol: string): boolean {
    return this.watchlist.has(symbol.toUpperCase());
  }

  public list(): string[] {
    return Array.from(this.watchlist);
  }
}

describe('Watchlist Management & Constraints (PRD FR-38)', () => {
  it('adds and removes stocks idempotently', () => {
    const wl = new WatchlistManager();
    assert.equal(wl.isStarred('RELIANCE'), false);

    const res1 = wl.add('RELIANCE');
    assert.equal(res1.status, 'added');
    assert.equal(res1.count, 1);
    assert.equal(wl.isStarred('RELIANCE'), true);

    // Repeat add returns already_present without incrementing count
    const res2 = wl.add('RELIANCE');
    assert.equal(res2.status, 'already_present');
    assert.equal(res2.count, 1);

    // Remove
    const del1 = wl.remove('RELIANCE');
    assert.equal(del1.status, 'removed');
    assert.equal(del1.count, 0);
    assert.equal(wl.isStarred('RELIANCE'), false);

    // Repeat remove
    const del2 = wl.remove('RELIANCE');
    assert.equal(del2.count, 0);
  });

  it('strictly enforces the 50-stock capacity limit (FR-38)', () => {
    const wl = new WatchlistManager();

    // Fill to 50 stocks
    for (let i = 1; i <= 50; i++) {
      wl.add(`STOCK_${i}`);
    }
    assert.equal(wl.list().length, 50);

    // 51st stock throws watchlist_limit_reached
    assert.throws(() => {
      wl.add('STOCK_51');
    }, /watchlist_limit_reached/);
  });
});
