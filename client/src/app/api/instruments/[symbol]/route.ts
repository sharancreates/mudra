import { NextRequest, NextResponse } from 'next/server';
import { getMarketDataAdapter } from '../../../../../../server/src/data-adapter';

// Handles GET /api/instruments/:symbol
export async function GET(
  _req: NextRequest,
  { params }: { params: { symbol: string } }
) {
  try {
    const symbol = params.symbol?.trim().toUpperCase();
    if (!symbol) {
      return NextResponse.json(
        {
          error: {
            code: 'bad_request',
            message: 'Symbol parameter is required.',
            request_id: `req_${Math.random().toString(36).substring(2, 10)}`,
          },
        },
        { status: 400 }
      );
    }

    const adapter = getMarketDataAdapter();
    const inst = await adapter.getInstrument(symbol);

    if (!inst) {
      return NextResponse.json(
        {
          error: {
            code: 'unknown_instrument',
            message: `Instrument ${symbol} not found.`,
            request_id: `req_${Math.random().toString(36).substring(2, 10)}`,
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      symbol: inst.symbol,
      name: inst.name,
      sector: inst.sector,
      exchange: inst.exchange,
      last_close_paise: Number(inst.last_close_paise),
      as_of: inst.as_of,
      source: inst.source,
      tradable: inst.tradable,
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
