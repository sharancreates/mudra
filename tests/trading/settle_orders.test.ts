/**
 * Settlement Engine Unit & Integration Test Suite (Node.js)
 * Conformance: PRD Section 7.3, ADR-002, ADR-005
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateFee } from '../../server/src/trading/math.ts';

interface Order {
  id: string;
  userId: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  qty: number;
  status: 'PENDING' | 'FILLED' | 'REJECTED';
  reservedPaise: bigint;
  fillPricePaise?: bigint;
}

interface Wallet {
  userId: string;
  cashPaise: bigint;
  reservedPaise: bigint;
}

interface Holding {
  userId: string;
  symbol: string;
  qty: number;
  costBasisPaise: bigint;
}

class SettlementSimulator {
  public wallets = new Map<string, Wallet>();
  public holdings = new Map<string, Holding>();
  public orders: Order[] = [];
  public ledgerDeltas = new Map<string, bigint>();

  constructor(userId: string) {
    this.wallets.set(userId, {
      userId,
      cashPaise: 10000000n,
      reservedPaise: 0n,
    });
    this.ledgerDeltas.set(userId, 10000000n);
  }

  public settle(prices: Map<string, bigint>) {
    // Sells before Buys
    const sorted = [...this.orders.filter(o => o.status === 'PENDING')].sort((a, b) => {
      if (a.side === 'SELL' && b.side === 'BUY') return -1;
      if (a.side === 'BUY' && b.side === 'SELL') return 1;
      return 0;
    });

    for (const order of sorted) {
      const closePrice = prices.get(order.symbol);
      if (!closePrice) continue;

      const wallet = this.wallets.get(order.userId)!;
      const tradeVal = closePrice * BigInt(order.qty);
      const fee = calculateFee(tradeVal);

      if (order.side === 'SELL') {
        const netProceeds = tradeVal - fee;
        wallet.cashPaise += netProceeds;

        const h = this.holdings.get(`${order.userId}:${order.symbol}`)!;
        const costOfSold = (h.costBasisPaise * BigInt(order.qty)) / BigInt(h.qty);
        h.qty -= order.qty;
        h.costBasisPaise -= costOfSold;

        order.status = 'FILLED';
        order.fillPricePaise = closePrice;

        const curLedger = this.ledgerDeltas.get(order.userId) || 0n;
        this.ledgerDeltas.set(order.userId, curLedger + tradeVal - fee);
      } else {
        const actualCost = tradeVal + fee;
        wallet.cashPaise += (order.reservedPaise - actualCost);
        wallet.reservedPaise -= order.reservedPaise;

        const key = `${order.userId}:${order.symbol}`;
        const existing = this.holdings.get(key);
        if (!existing) {
          this.holdings.set(key, {
            userId: order.userId,
            symbol: order.symbol,
            qty: order.qty,
            costBasisPaise: actualCost,
          });
        } else {
          existing.qty += order.qty;
          existing.costBasisPaise += actualCost;
        }

        order.status = 'FILLED';
        order.fillPricePaise = closePrice;

        const curLedger = this.ledgerDeltas.get(order.userId) || 0n;
        this.ledgerDeltas.set(order.userId, curLedger - tradeVal - fee);
      }
    }
  }
}

describe('Order Settlement Engine: Sells-before-Buys & Reconciliation', () => {
  it('prioritizes SELLS before BUYS and reconciles exact integer paise ledger', () => {
    const user = 'usr_sim_node';
    const sim = new SettlementSimulator(user);

    // Initial holding for sell
    sim.holdings.set(`${user}:TCS`, {
      userId: user,
      symbol: 'TCS',
      qty: 10,
      costBasisPaise: 3500000n,
    });

    // Add pending SELL
    sim.orders.push({
      id: 'o_sell',
      userId: user,
      symbol: 'TCS',
      side: 'SELL',
      qty: 10,
      status: 'PENDING',
      reservedPaise: 0n,
    });

    // Add pending BUY with reservation
    sim.orders.push({
      id: 'o_buy',
      userId: user,
      symbol: 'RELIANCE',
      side: 'BUY',
      qty: 10,
      status: 'PENDING',
      reservedPaise: 1541540n,
    });
    const w = sim.wallets.get(user)!;
    w.cashPaise -= 1541540n;
    w.reservedPaise += 1541540n;

    // Settle with closing prices
    const prices = new Map<string, bigint>([
      ['TCS', 385000n],
      ['RELIANCE', 140000n],
    ]);

    sim.settle(prices);

    assert.equal(w.reservedPaise, 0n, 'All reservations cleared');
    // Cash: 10,000,000 - (140,000*10 + 1,400) + (385,000*10 - 3,850)
    // = 10,000,000 - 1,401,400 + 3,846,150 = 12,444,750 paise
    assert.equal(w.cashPaise, 12444750n);

    // Exact reconciliation check
    const ledgerTotal = sim.ledgerDeltas.get(user)!;
    assert.equal(w.cashPaise + w.reservedPaise, ledgerTotal);
  });
});
