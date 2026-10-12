/**
 * Concurrency Load & Anti-Race Simulation Suite (Node.js)
 * Conformance: PRD Section 13.1 & 15.1, ADR-002, ADR-004
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateBuyReservation, calculateFee, getNextExecutionDate } from '../../server/src/trading/math.ts';

interface OrderRecord {
  id: string;
  user_id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  qty: number;
  status: 'PENDING' | 'FILLED' | 'REJECTED';
  reserved_paise: bigint;
  target_trade_date: string;
  client_order_id: string;
  fill_price_paise?: bigint;
}

interface UserWallet {
  user_id: string;
  cash_paise: bigint;
  reserved_paise: bigint;
}

interface UserHolding {
  user_id: string;
  symbol: string;
  qty: number;
  reserved_qty: number;
  cost_basis_paise: bigint;
}

class AsyncMutex {
  private queue = Promise.resolve();

  async lock(): Promise<() => void> {
    let unlock!: () => void;
    const next = new Promise<void>(resolve => {
      unlock = resolve;
    });
    const wait = this.queue.then(() => unlock);
    this.queue = this.queue.then(() => next);
    return wait;
  }
}

class ThreadSafeTradingEngine {
  public wallets = new Map<string, UserWallet>();
  public holdings = new Map<string, UserHolding>();
  public orders = new Map<string, OrderRecord>();
  public clientOrders = new Map<string, string>();
  public ledger = new Map<string, bigint>(); // userId -> balanceAfter
  private mutex = new AsyncMutex();

  public prices = new Map<string, bigint>([
    ['RELIANCE', 140000n],
    ['TCS', 385000n],
    ['INFY', 155000n],
    ['HDFCBANK', 165000n],
  ]);

  constructor() {}

  public getOrCreateWallet(userId: string): UserWallet {
    if (!this.wallets.has(userId)) {
      this.wallets.set(userId, {
        user_id: userId,
        cash_paise: 10000000n, // ₹1,00,000
        reserved_paise: 0n,
      });
      this.ledger.set(userId, 10000000n);
    }
    return this.wallets.get(userId)!;
  }

  public async placeOrder(
    userId: string,
    symbol: string,
    side: 'BUY' | 'SELL',
    qty: number,
    clientOrderId: string,
    currentTime: Date = new Date('2026-10-12T08:00:00Z')
  ): Promise<{ orderId: string; status: string; reservedPaise: bigint }> {
    const sym = symbol.toUpperCase().trim();
    const lastClose = this.prices.get(sym);
    if (!lastClose) throw new Error('unknown_instrument');

    // Simulate async network jitter / task yield
    await new Promise(resolve => setTimeout(resolve, Math.random() * 5));

    // Acquire lock for critical section
    const unlock = await this.mutex.lock();
    try {
      // 1. Idempotency Check
      const idempotencyKey = `${userId}:${clientOrderId}`;
      if (this.clientOrders.has(idempotencyKey)) {
        const existingId = this.clientOrders.get(idempotencyKey)!;
        const existingOrder = this.orders.get(existingId)!;
        return {
          orderId: existingOrder.id,
          status: existingOrder.status,
          reservedPaise: existingOrder.reserved_paise,
        };
      }

      const wallet = this.getOrCreateWallet(userId);
      let reservedPaise = 0n;

      if (side === 'BUY') {
        const reservation = calculateBuyReservation(lastClose, qty);
        reservedPaise = reservation.totalReservedPaise;

        if (wallet.cash_paise < reservedPaise) {
          throw new Error('insufficient_cash');
        }

        wallet.cash_paise -= reservedPaise;
        wallet.reserved_paise += reservedPaise;
      } else {
        const holdingKey = `${userId}:${sym}`;
        const holding = this.holdings.get(holdingKey);
        const availableQty = holding ? holding.qty - holding.reserved_qty : 0;
        if (availableQty < qty) {
          throw new Error('insufficient_holdings');
        }
        holding!.reserved_qty += qty;
      }

      const orderId = `ord_${Math.random().toString(36).substring(2, 10)}`;
      const targetDate = getNextExecutionDate(currentTime);
      const order: OrderRecord = {
        id: orderId,
        user_id: userId,
        symbol: sym,
        side,
        qty,
        status: 'PENDING',
        reserved_paise: reservedPaise,
        target_trade_date: targetDate,
        client_order_id: clientOrderId,
      };

      this.orders.set(orderId, order);
      this.clientOrders.set(idempotencyKey, orderId);

      return {
        orderId,
        status: 'PENDING',
        reservedPaise,
      };
    } finally {
      unlock();
    }
  }

  public async settleOrders(): Promise<{ settledBuys: number; settledSells: number }> {
    const unlock = await this.mutex.lock();
    try {
      const pending = [...this.orders.values()].filter(o => o.status === 'PENDING');
      // Sells before Buys
      pending.sort((a, b) => {
        if (a.side === 'SELL' && b.side === 'BUY') return -1;
        if (a.side === 'BUY' && b.side === 'SELL') return 1;
        return 0;
      });

      let settledBuys = 0;
      let settledSells = 0;

      for (const order of pending) {
        const price = this.prices.get(order.symbol)!;
        const wallet = this.wallets.get(order.user_id)!;
        const tradeVal = price * BigInt(order.qty);
        const fee = calculateFee(tradeVal);

        if (order.side === 'SELL') {
          const netProceeds = tradeVal - fee;
          const holding = this.holdings.get(`${order.user_id}:${order.symbol}`)!;
          const costOfSold = (holding.cost_basis_paise * BigInt(order.qty)) / BigInt(holding.qty);

          holding.qty -= order.qty;
          holding.reserved_qty = Math.max(0, holding.reserved_qty - order.qty);
          holding.cost_basis_paise -= costOfSold;

          wallet.cash_paise += netProceeds;
          order.status = 'FILLED';
          order.fill_price_paise = price;
          settledSells++;

          const curLedger = this.ledger.get(order.user_id)!;
          this.ledger.set(order.user_id, curLedger + netProceeds);
        } else {
          const actualCost = tradeVal + fee;
          if (wallet.cash_paise + order.reserved_paise < actualCost) {
            wallet.cash_paise += order.reserved_paise;
            wallet.reserved_paise -= order.reserved_paise;
            order.status = 'REJECTED';
            continue;
          }

          // Unreserve and deduct actual cost
          wallet.cash_paise += (order.reserved_paise - actualCost);
          wallet.reserved_paise -= order.reserved_paise;

          const holdingKey = `${order.user_id}:${order.symbol}`;
          if (!this.holdings.has(holdingKey)) {
            this.holdings.set(holdingKey, {
              user_id: order.user_id,
              symbol: order.symbol,
              qty: order.qty,
              reserved_qty: 0,
              cost_basis_paise: actualCost,
            });
          } else {
            const h = this.holdings.get(holdingKey)!;
            h.qty += order.qty;
            h.cost_basis_paise += actualCost;
          }

          order.status = 'FILLED';
          order.fill_price_paise = price;
          settledBuys++;

          const curLedger = this.ledger.get(order.user_id)!;
          this.ledger.set(order.user_id, curLedger - actualCost);
        }
      }

      return { settledBuys, settledSells };
    } finally {
      unlock();
    }
  }

  public auditReconciliation(): { clean: boolean; mismatches: string[] } {
    const mismatches: string[] = [];
    for (const [userId, wallet] of this.wallets.entries()) {
      const ledgerBal = this.ledger.get(userId) || 0n;
      const totalWalletCash = wallet.cash_paise + wallet.reserved_paise;
      if (totalWalletCash !== ledgerBal) {
        mismatches.push(
          `User ${userId} drift: wallet=${totalWalletCash} paise, ledger=${ledgerBal} paise`
        );
      }
    }
    return { clean: mismatches.length === 0, mismatches };
  }
}

describe('Concurrency Load Testing & Thread Safety (TypeScript)', () => {
  it('Single User 50 Concurrent Orders: never goes negative and rejects over-budget orders cleanly', async () => {
    const engine = new ThreadSafeTradingEngine();
    const userId = 'usr_ts_stress_50';
    const wallet = engine.getOrCreateWallet(userId);
    const initialCash = wallet.cash_paise;

    // 50 concurrent BUY orders of 10 shares of RELIANCE (1,541,540 paise each)
    // Starting capital: 10,000,000 paise (₹1,00,000)
    // 6 * 1,541,540 = 9,249,240 paise
    // Remaining cash = 750,760 paise -> exactly 6 succeed, 44 fail with insufficient_cash
    const tasks = Array.from({ length: 50 }, (_, i) => {
      return engine
        .placeOrder(userId, 'RELIANCE', 'BUY', 10, `c-ts-stress-50-${i}`)
        .then(res => ({ status: 'success', data: res }))
        .catch(err => ({ status: 'rejected', error: err.message }));
    });

    const results = await Promise.all(tasks);

    const successful = results.filter(r => r.status === 'success');
    const rejected = results.filter(r => r.status === 'rejected');

    assert.equal(successful.length, 6, `Expected exactly 6 successful orders, got ${successful.length}`);
    assert.equal(rejected.length, 44, `Expected exactly 44 rejected orders, got ${rejected.length}`);

    // All rejections must be insufficient_cash
    for (const rej of rejected) {
      assert.equal(rej.error, 'insufficient_cash');
    }

    // Invariant: wallet cash is non-negative and balanced
    assert.ok(wallet.cash_paise >= 0n, 'Wallet cash went negative!');
    assert.equal(wallet.cash_paise, 10000000n - 6n * 1541540n);
    assert.equal(wallet.reserved_paise, 6n * 1541540n);
    assert.equal(wallet.cash_paise + wallet.reserved_paise, initialCash);

    // Settle orders and verify reconciliation
    const settlement = await engine.settleOrders();
    assert.equal(settlement.settledBuys, 6);

    const audit = engine.auditReconciliation();
    assert.equal(audit.clean, true, `Audit mismatches: ${audit.mismatches.join(', ')}`);
  });

  it('Multi-User 200 Concurrent Orders: 10 users process 200 orders without deadlock or drift', async () => {
    const engine = new ThreadSafeTradingEngine();
    const users = Array.from({ length: 10 }, (_, i) => `usr_ts_multi_${i}`);

    // Seed wallets and holdings for 10 users
    for (const u of users) {
      engine.getOrCreateWallet(u);
      engine.holdings.set(`${u}:TCS`, {
        user_id: u,
        symbol: 'TCS',
        qty: 50,
        reserved_qty: 0,
        cost_basis_paise: 17500000n,
      });
      engine.holdings.set(`${u}:INFY`, {
        user_id: u,
        symbol: 'INFY',
        qty: 50,
        reserved_qty: 0,
        cost_basis_paise: 8500000n,
      });
    }

    // Prepare 20 orders per user = 200 orders
    const orderPromises: Promise<any>[] = [];
    for (const u of users) {
      for (let oIdx = 0; oIdx < 20; oIdx++) {
        let sym = 'RELIANCE';
        let side: 'BUY' | 'SELL' = 'BUY';
        if (oIdx % 4 === 0) {
          sym = 'RELIANCE';
          side = 'BUY';
        } else if (oIdx % 4 === 1) {
          sym = 'HDFCBANK';
          side = 'BUY';
        } else if (oIdx % 4 === 2) {
          sym = 'TCS';
          side = 'SELL';
        } else {
          sym = 'INFY';
          side = 'SELL';
        }

        orderPromises.push(
          engine.placeOrder(u, sym, side, 1, `c-multi-ts-${u}-${oIdx}`)
        );
      }
    }

    const results = await Promise.all(orderPromises);
    assert.equal(results.length, 200);

    // Verify all wallets have non-negative balances
    for (const u of users) {
      const w = engine.wallets.get(u)!;
      assert.ok(w.cash_paise >= 0n);
      assert.ok(w.reserved_paise >= 0n);
    }

    // Settle all 200 orders
    const report = await engine.settleOrders();
    assert.equal(report.settledBuys + report.settledSells, 200);

    // Check reconciliation
    const audit = engine.auditReconciliation();
    assert.equal(audit.clean, true, `Audit mismatches: ${audit.mismatches.join(', ')}`);
  });

  it('Parallel Idempotency Swarm: 10 parallel identical requests yield exactly 1 order', async () => {
    const engine = new ThreadSafeTradingEngine();
    const userId = 'usr_ts_swarm';
    const wallet = engine.getOrCreateWallet(userId);
    const initialCash = wallet.cash_paise;

    const sharedClientId = 'ts-swarm-idemp-001';
    const swarmTasks = Array.from({ length: 10 }, () =>
      engine.placeOrder(userId, 'RELIANCE', 'BUY', 5, sharedClientId)
    );

    const swarmResults = await Promise.all(swarmTasks);

    // All return identical order ID
    const orderIds = new Set(swarmResults.map(r => r.orderId));
    assert.equal(orderIds.size, 1, 'Multiple order IDs created for same client_order_id');

    // Exactly 1 order in store
    assert.equal(engine.orders.size, 1);

    // Reserved cash deducted once: 5 * 140,000 = 700,000 + 10% buffer = 770,000 + 770 fee = 770,770 paise
    const expectedReserved = 770770n;
    assert.equal(wallet.reserved_paise, expectedReserved);
    assert.equal(wallet.cash_paise, initialCash - expectedReserved);

    // Settle and verify reconciliation
    await engine.settleOrders();
    const audit = engine.auditReconciliation();
    assert.equal(audit.clean, true);
  });
});
