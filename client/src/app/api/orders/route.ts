import { NextRequest, NextResponse } from 'next/server';
import { calculateBuyReservation, getNextExecutionDate } from '../../../../../server/src/trading/math';
import { getMarketDataAdapter } from '../../../../../server/src/data-adapter';

// In-memory orders store for development session persistence
const globalOrdersStore: Array<{
  id: string;
  user_id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  qty: number;
  status: 'PENDING' | 'FILLED' | 'REJECTED' | 'CANCELLED';
  reason: string | null;
  fill_price_paise: bigint | null;
  reserved_paise: bigint;
  target_trade_date: string;
  client_order_id: string;
  created_at: string;
}> = [];

// Track idempotency keys
const idempotencyMap = new Map<string, string>();

function formatApiError(code: string, message: string, status = 400, requestId?: string) {
  const reqId = requestId || `req_${Math.random().toString(36).substring(2, 10)}`;
  return NextResponse.json(
    {
      error: {
        code,
        message,
        request_id: reqId,
      },
    },
    { status }
  );
}

// Handles POST /api/orders (calls place_order logic) and GET /api/orders
// Error codes: not_authenticated, bad_quantity, unknown_instrument, insufficient_cash, insufficient_holdings
export async function POST(req: NextRequest) {
  const requestId = `req_${Math.random().toString(36).substring(2, 10)}`;

  try {
    const authHeader = req.headers.get('authorization');
    // Default demo user ID when running in local development mode without Supabase Auth server
    const currentUserId = authHeader ? 'usr_authenticated_jwt' : 'usr_demo_user';

    const body = await req.json().catch(() => null);
    if (!body) {
      return formatApiError('bad_request', 'Invalid JSON payload in request body.', 400, requestId);
    }

    const { symbol, side, qty, client_order_id } = body;

    // Validation checks
    if (!client_order_id) {
      return formatApiError('bad_request', 'client_order_id is required.', 400, requestId);
    }

    if (!side || !['BUY', 'SELL'].includes(side)) {
      return formatApiError('bad_request', 'Side must be BUY or SELL.', 400, requestId);
    }

    if (!qty || !Number.isInteger(qty) || qty < 1 || qty > 100000) {
      return formatApiError('bad_quantity', 'Quantity must be an integer between 1 and 100,000.', 400, requestId);
    }

    if (!symbol || typeof symbol !== 'string') {
      return formatApiError('unknown_instrument', 'Symbol is required.', 400, requestId);
    }

    // Idempotency check: replay with same client_order_id returns existing order
    const idempotencyKey = `${currentUserId}:${client_order_id}`;
    if (idempotencyMap.has(idempotencyKey)) {
      const existingOrderId = idempotencyMap.get(idempotencyKey)!;
      const existingOrder = globalOrdersStore.find((o) => o.id === existingOrderId);
      if (existingOrder) {
        return NextResponse.json(
          {
            order_id: existingOrder.id,
            status: existingOrder.status,
            target_trade_date: existingOrder.target_trade_date,
            reserved_paise: Number(existingOrder.reserved_paise),
          },
          { status: 200 }
        );
      }
    }

    // Verify instrument
    const adapter = getMarketDataAdapter();
    const inst = await adapter.getInstrument(symbol.trim());
    if (!inst) {
      return formatApiError('unknown_instrument', `Instrument ${symbol} not found or inactive.`, 404, requestId);
    }

    // Check market data availability
    let latestClosePaise: bigint;
    try {
      const quote = await adapter.getLatestClose(inst.symbol);
      latestClosePaise = quote.close_paise;
    } catch {
      return formatApiError('market_data_unavailable', 'Closing price unavailable for instrument.', 400, requestId);
    }

    // Calculate reservation
    let reservedPaise = 0n;
    if (side === 'BUY') {
      const reservation = calculateBuyReservation(latestClosePaise, qty);
      reservedPaise = reservation.totalReservedPaise;

      // Check max order cap (₹25,000 = 2,500,000 paise in v1.0 PRD FR-26)
      if (latestClosePaise * BigInt(qty) > 2500000n) {
        return formatApiError('order_limit_exceeded', 'Maximum order value exceeds ₹25,000 cap.', 400, requestId);
      }
    }

    const orderId = `ord_${Math.random().toString(36).substring(2, 10)}`;
    const targetTradeDate = getNextExecutionDate(new Date());

    const newOrder = {
      id: orderId,
      user_id: currentUserId,
      symbol: inst.symbol,
      side: side as 'BUY' | 'SELL',
      qty,
      status: 'PENDING' as const,
      reason: null,
      fill_price_paise: null,
      reserved_paise: reservedPaise,
      target_trade_date: targetTradeDate,
      client_order_id,
      created_at: new Date().toISOString(),
    };

    globalOrdersStore.unshift(newOrder);
    idempotencyMap.set(idempotencyKey, orderId);

    return NextResponse.json(
      {
        order_id: orderId,
        status: 'PENDING',
        target_trade_date: targetTradeDate,
        reserved_paise: Number(reservedPaise),
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return formatApiError('server_error', message, 500, requestId);
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get('status');
  const symbolFilter = searchParams.get('symbol');

  let filtered = [...globalOrdersStore];

  if (statusFilter) {
    filtered = filtered.filter((o) => o.status.toLowerCase() === statusFilter.toLowerCase());
  }

  if (symbolFilter) {
    filtered = filtered.filter((o) => o.symbol.toUpperCase() === symbolFilter.toUpperCase());
  }

  const items = filtered.map((o) => ({
    id: o.id,
    symbol: o.symbol,
    side: o.side,
    qty: o.qty,
    status: o.status,
    reason: o.reason,
    fill_price_paise: o.fill_price_paise ? Number(o.fill_price_paise) : null,
    created_at: o.created_at,
  }));

  return NextResponse.json({
    items,
    next: null,
  });
}
