/**
 * Order Placement & Idempotency Test Suite
 * Conformance: PRD FR-16 to FR-21, FR-26 (Order Limits), ADR-004, ADR-005
 * 
 * Tests the virtual trading engine place_order logic:
 * - Happy path buy order reservation (10% buffer + 0.1% fee)
 * - Strict client_order_id idempotency (5 identical calls -> 1 order)
 * - Insufficient cash rejection
 * - Quantity boundary validation (1 to 100,000)
 * - Short-selling / insufficient holdings rejection
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateBuyReservation, calculateFee, getNextExecutionDate } from '../../server/src/trading/math.ts';

export interface OrderRecord {
  id: string;
  user_id: string;
  instrument_id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  qty: number;
  status: 'PENDING' | 'FILLED' | 'REJECTED' | 'CANCELLED';
  reserved_paise: bigint;
  target_trade_date: string;
  client_order_id: string;
}

export interface UserWallet {
  user_id: string;
  cash_paise: bigint;
  reserved_paise: bigint;
}

export interface UserHolding {
  user_id: string;
  symbol: string;
  qty: number;
  reserved_qty: number;
}

/**
 * High-fidelity simulator replicating PostgreSQL place_order() stored procedure
 */
export class TradingEngineSimulator {
  public wallets = new Map<string, UserWallet>();
  public holdings = new Map<string, UserHolding>(); // key: `${userId}:${symbol}`
  public orders = new Map<string, OrderRecord>();
  public clientOrderMap = new Map<string, string>(); // key: `${userId}:${clientOrderId}` -> orderId
  public prices = new Map<string, bigint>([
    ['RELIANCE', 140000n],
    ['TCS', 385000n],
    ['INFY', 155000n]
  ]);

  constructor(userId: string) {
    this.wallets.set(userId, {
      user_id: userId,
      cash_paise: 10000000n, // ₹1,00,000.00
      reserved_paise: 0n
    });
  }

  public placeOrder(
    userId: string,
    symbol: string,
    side: 'BUY' | 'SELL',
    qty: number,
    clientOrderId: string,
    currentTime: Date = new Date('2026-10-12T08:00:00Z') // Monday 13:30 IST
  ): string {
    if (!userId) throw new Error('not_authenticated');
    if (!['BUY', 'SELL'].includes(side)) throw new Error('bad_side');
    if (!Number.isInteger(qty) || qty < 1 || qty > 100000) throw new Error('bad_quantity');
    if (!clientOrderId) throw new Error('bad_client_id');

    // 1. Idempotency Check
    const idempotencyKey = `${userId}:${clientOrderId}`;
    if (this.clientOrderMap.has(idempotencyKey)) {
      return this.clientOrderMap.get(idempotencyKey)!;
    }

    // 2. Instrument Check
    const sym = symbol.toUpperCase().trim();
    const lastClose = this.prices.get(sym);
    if (!lastClose) throw new Error('unknown_instrument');

    // 3. Wallet Lock & Check
    const wallet = this.wallets.get(userId);
    if (!wallet) throw new Error('wallet_not_found');

    const targetTradeDate = getNextExecutionDate(currentTime);
    let reservedPaise = 0n;

    if (side === 'BUY') {
      const reservation = calculateBuyReservation(lastClose, qty);
      reservedPaise = reservation.totalReservedPaise;

      if (wallet.cash_paise < reservedPaise) {
        throw new Error('insufficient_cash');
      }

      // Lock & Reserve Cash
      wallet.cash_paise -= reservedPaise;
      wallet.reserved_paise += reservedPaise;
    } else {
      // SELL Check
      const holdingKey = `${userId}:${sym}`;
      const holding = this.holdings.get(holdingKey);
      if (!holding || (holding.qty - holding.reserved_qty) < qty) {
        throw new Error('insufficient_holdings');
      }

      // Lock & Reserve Shares
      holding.reserved_qty += qty;
    }

    // 4. Create Order
    const orderId = `ord_${Math.random().toString(36).substring(2, 10)}`;
    const order: OrderRecord = {
      id: orderId,
      user_id: userId,
      instrument_id: `inst_${sym}`,
      symbol: sym,
      side,
      qty,
      status: 'PENDING',
      reserved_paise: reservedPaise,
      target_trade_date: targetTradeDate,
      client_order_id: clientOrderId
    };

    this.orders.set(orderId, order);
    this.clientOrderMap.set(idempotencyKey, orderId);

    return orderId;
  }
}

describe('Virtual Trading Engine: place_order() Functionality', () => {
  const userId = 'usr_alice_123';

  it('Happy Path BUY: places order with status PENDING and reserves 10% safety buffer', () => {
    const engine = new TradingEngineSimulator(userId);
    const clientUuid = 'a0000000-0000-0000-0000-000000000001';

    // Buy 10 RELIANCE at ₹1,400.00 (140,000 paise)
    // est_price = 154,000 paise (10% buffer)
    // trade_val = 1,540,000 paise; fee = 1,540 paise; total = 1,541,540 paise
    const orderId = engine.placeOrder(userId, 'RELIANCE', 'BUY', 10, clientUuid);

    const order = engine.orders.get(orderId)!;
    assert.ok(order);
    assert.equal(order.status, 'PENDING');
    assert.equal(order.symbol, 'RELIANCE');
    assert.equal(order.qty, 10);
    assert.equal(order.reserved_paise, 1541540n);
    assert.equal(order.target_trade_date, '2026-10-12');

    const wallet = engine.wallets.get(userId)!;
    assert.equal(wallet.reserved_paise, 1541540n);
    assert.equal(wallet.cash_paise, 10000000n - 1541540n);
  });

  it('Idempotency Guarantee: repeating identical client_order_id 5 times creates exactly 1 order without mutating wallet balances', () => {
    const engine = new TradingEngineSimulator(userId);
    const clientUuid = 'b0000000-0000-0000-0000-000000000002';

    const order1 = engine.placeOrder(userId, 'RELIANCE', 'BUY', 5, clientUuid);
    const order2 = engine.placeOrder(userId, 'RELIANCE', 'BUY', 5, clientUuid);
    const order3 = engine.placeOrder(userId, 'RELIANCE', 'BUY', 5, clientUuid);
    const order4 = engine.placeOrder(userId, 'RELIANCE', 'BUY', 5, clientUuid);
    const order5 = engine.placeOrder(userId, 'RELIANCE', 'BUY', 5, clientUuid);

    assert.equal(order1, order2);
    assert.equal(order1, order3);
    assert.equal(order1, order4);
    assert.equal(order1, order5);

    // Only 1 order created in database
    assert.equal(engine.orders.size, 1);

    // Wallet reserved only once
    const expectedReserved = calculateBuyReservation(140000n, 5).totalReservedPaise;
    const wallet = engine.wallets.get(userId)!;
    assert.equal(wallet.reserved_paise, expectedReserved);
  });

  it('Insufficient Cash: rejects BUY order when required reservation exceeds free cash', () => {
    const engine = new TradingEngineSimulator(userId);
    const clientUuid = 'c0000000-0000-0000-0000-000000000003';

    // 100 shares of RELIANCE need > 15,000,000 paise (wallet only has 10,000,000)
    assert.throws(() => {
      engine.placeOrder(userId, 'RELIANCE', 'BUY', 100, clientUuid);
    }, /insufficient_cash/);

    const wallet = engine.wallets.get(userId)!;
    assert.equal(wallet.cash_paise, 10000000n);
    assert.equal(wallet.reserved_paise, 0n);
    assert.equal(engine.orders.size, 0);
  });

  it('Quantity Validations: rejects non-positive, fractional, or over-limit quantities with bad_quantity', () => {
    const engine = new TradingEngineSimulator(userId);

    assert.throws(() => engine.placeOrder(userId, 'RELIANCE', 'BUY', 0, 'u1'), /bad_quantity/);
    assert.throws(() => engine.placeOrder(userId, 'RELIANCE', 'BUY', -5, 'u2'), /bad_quantity/);
    assert.throws(() => engine.placeOrder(userId, 'RELIANCE', 'BUY', 1.5, 'u3'), /bad_quantity/);
    assert.throws(() => engine.placeOrder(userId, 'RELIANCE', 'BUY', 100001, 'u4'), /bad_quantity/);
  });

  it('Sell Validations: prevents short-selling unowned or already-reserved shares', () => {
    const engine = new TradingEngineSimulator(userId);

    // Attempt to sell without owning
    assert.throws(() => {
      engine.placeOrder(userId, 'TCS', 'SELL', 10, 'u5');
    }, /insufficient_holdings/);

    // Add 10 shares of TCS to holding
    engine.holdings.set(`${userId}:TCS`, {
      user_id: userId,
      symbol: 'TCS',
      qty: 10,
      reserved_qty: 0
    });

    // Successfully place pending sell for 6 shares
    const sellOrder1 = engine.placeOrder(userId, 'TCS', 'SELL', 6, 'u6');
    assert.ok(sellOrder1);

    const holding = engine.holdings.get(`${userId}:TCS`)!;
    assert.equal(holding.reserved_qty, 6);

    // Attempt to sell 5 more (only 4 available: 10 - 6 = 4)
    assert.throws(() => {
      engine.placeOrder(userId, 'TCS', 'SELL', 5, 'u7');
    }, /insufficient_holdings/);

    // Can sell the remaining 4
    const sellOrder2 = engine.placeOrder(userId, 'TCS', 'SELL', 4, 'u8');
    assert.ok(sellOrder2);
    assert.equal(holding.reserved_qty, 10);
  });
});
