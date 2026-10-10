import { NextRequest, NextResponse } from 'next/server';
import { getMarketDataAdapter } from '../../../../../server/src/data-adapter';

// Handles GET /api/instruments?q=&sector=&page=
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const sector = searchParams.get('sector') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = Math.max(0, (page - 1) * limit);

    const adapter = getMarketDataAdapter();
    const instruments = await adapter.searchInstruments(query, sector, limit, offset);

    const items = instruments.map((inst) => ({
      symbol: inst.symbol,
      name: inst.name,
      exchange: inst.exchange,
      sector: inst.sector,
      last_close_paise: Number(inst.last_close_paise),
      change_bps: inst.change_bps,
      as_of: inst.as_of,
    }));

    return NextResponse.json({ items });
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
