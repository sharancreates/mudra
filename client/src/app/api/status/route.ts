import { NextResponse } from 'next/server';
import { getMarketDataAdapter } from '../../../../../server/src/data-adapter';

// Handles GET /api/status (Freshness badge & market state)
export async function GET() {
  try {
    const adapter = getMarketDataAdapter();
    const status = await adapter.getStatus();

    return NextResponse.json({
      prices_as_of: status.prices_as_of,
      state: status.state,
      market_open: status.market_open,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json(
      {
        error: {
          code: 'server_error',
          message,
          request_id: `req_${Math.random().toString(36).substring(2, 10)}`,
        },
      },
      { status: 500 }
    );
  }
}
