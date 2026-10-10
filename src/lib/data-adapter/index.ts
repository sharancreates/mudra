/**
 * Market Data Adapter Implementation
 * Conformance: PRD FR-50 (Data-source adapter), FR-43 (Freshness banner), FR-48 (Status endpoint)
 */

import fs from 'fs';
import path from 'path';
import { IMarketDataAdapter, Instrument, MarketStatus, PricePoint, FreshnessState } from './types';

export * from './types';

interface CsvPriceRow {
  symbol: string;
  exchange: 'NSE' | 'BSE';
  name: string;
  isin: string;
  sector: string;
  trade_date: string;
  open_paise: bigint;
  high_paise: bigint;
  low_paise: bigint;
  close_paise: bigint;
  volume: number;
  source: string;
}

export class SampleMarketDataAdapter implements IMarketDataAdapter {
  private instrumentsMap = new Map<string, Instrument>();
  private priceHistoryMap = new Map<string, PricePoint[]>();
  private latestDate = '2026-10-09';

  constructor(csvPath?: string) {
    this.loadData(csvPath);
  }

  private loadData(explicitPath?: string) {
    const filePath = explicitPath || path.resolve(process.cwd(), 'data', 'sample_prices.csv');
    if (!fs.existsSync(filePath)) {
      return;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim().length > 0);
    if (lines.length <= 1) return;

    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      // Parse CSV line handling potential quoted strings
      const parts = lines[i].match(/(?:\"[^\"]*\"|[^,])+/g);
      if (!parts || parts.length < 12) continue;

      const symbol = parts[0].trim();
      const exchange = parts[1].trim() as 'NSE' | 'BSE';
      const name = parts[2].replace(/^"|"$/g, '').trim();
      const isin = parts[3].trim();
      const sector = parts[4].replace(/^"|"$/g, '').trim();
      const trade_date = parts[5].trim();
      const open_paise = BigInt(parts[6].trim());
      const high_paise = BigInt(parts[7].trim());
      const low_paise = BigInt(parts[8].trim());
      const close_paise = BigInt(parts[9].trim());
      const volume = Number(parts[10].trim());
      const source = parts[11].trim();

      if (!this.priceHistoryMap.has(symbol)) {
        this.priceHistoryMap.set(symbol, []);
      }

      this.priceHistoryMap.get(symbol)!.push({
        date: trade_date,
        open_paise,
        high_paise,
        low_paise,
        close_paise,
        volume
      });

      if (trade_date > this.latestDate) {
        this.latestDate = trade_date;
      }
    }

    // Populate instrument current quotes
    for (const [symbol, history] of this.priceHistoryMap.entries()) {
      (history as PricePoint[]).sort((a: PricePoint, b: PricePoint) => a.date.localeCompare(b.date));
      const latest = history[history.length - 1];
      const prev = history.length > 1 ? history[history.length - 2] : latest;

      let change_bps = 0;
      if (prev.close_paise > 0n) {
        change_bps = Number(((BigInt(latest.close_paise) - BigInt(prev.close_paise)) * 10000n) / BigInt(prev.close_paise));
      }

      const sampleRow = history[0]; // has first metadata
      this.instrumentsMap.set(symbol, {
        id: symbol,
        symbol,
        exchange: 'NSE',
        name: symbol,
        sector: 'Equities',
        last_close_paise: latest.close_paise,
        change_bps,
        as_of: latest.date,
        source: 'SAMPLE_EOD',
        tradable: true
      });
    }
  }

  async getLatestClose(symbol: string): Promise<{ close_paise: bigint; as_of: string; source: string }> {
    const sym = symbol.toUpperCase();
    const inst = this.instrumentsMap.get(sym);
    if (!inst) {
      throw new Error(`Instrument not found: ${symbol}`);
    }
    return {
      close_paise: inst.last_close_paise,
      as_of: inst.as_of,
      source: inst.source
    };
  }

  async getDailyCloses(date: string): Promise<Map<string, bigint>> {
    const result = new Map<string, bigint>();
    for (const [symbol, history] of this.priceHistoryMap.entries()) {
      const match = (history as PricePoint[]).find((p: PricePoint) => p.date === date);
      if (match) {
        result.set(symbol, match.close_paise);
      }
    }
    return result;
  }

  async searchInstruments(query?: string, sector?: string, limit = 50, offset = 0): Promise<Instrument[]> {
    let list = Array.from(this.instrumentsMap.values());

    if (query && query.trim().length > 0) {
      const q = query.trim().toLowerCase();
      list = list.filter(i => i.symbol.toLowerCase().includes(q) || i.name.toLowerCase().includes(q));
    }

    if (sector && sector.trim().length > 0) {
      const s = sector.trim().toLowerCase();
      list = list.filter(i => i.sector.toLowerCase() === s);
    }

    return list.slice(offset, offset + limit);
  }

  async getInstrument(symbol: string): Promise<Instrument | null> {
    const sym = symbol.toUpperCase();
    return this.instrumentsMap.get(sym) || null;
  }

  async getHistoricalPrices(symbol: string, range = '1Y'): Promise<PricePoint[]> {
    const sym = symbol.toUpperCase();
    const history = this.priceHistoryMap.get(sym) || [];
    let count = 250;
    if (range === '1M') count = 22;
    if (range === '6M') count = 125;
    return history.slice(-count);
  }

  async getStatus(): Promise<MarketStatus> {
    return evaluateMarketFreshness(this.latestDate, new Date());
  }
}

export class SimulatedMarketDataAdapter implements IMarketDataAdapter {
  private basePrices = new Map<string, bigint>([
    ['RELIANCE', 140000n],
    ['TCS', 385000n],
    ['INFY', 155000n],
    ['HDFCBANK', 165000n]
  ]);

  async getLatestClose(symbol: string): Promise<{ close_paise: bigint; as_of: string; source: string }> {
    const base = this.basePrices.get(symbol.toUpperCase()) || 100000n;
    return {
      close_paise: base,
      as_of: new Date().toISOString().split('T')[0],
      source: 'SIMULATED'
    };
  }

  async getDailyCloses(date: string): Promise<Map<string, bigint>> {
    return new Map(this.basePrices);
  }

  async searchInstruments(query?: string, sector?: string, limit = 50, offset = 0): Promise<Instrument[]> {
    const today = new Date().toISOString().split('T')[0];
    const results: Instrument[] = Array.from(this.basePrices.entries()).map(([sym, price]) => ({
      id: sym,
      symbol: sym,
      exchange: 'NSE',
      name: `${sym} (Practice Mode)`,
      sector: 'General',
      last_close_paise: price,
      change_bps: 0,
      as_of: today,
      source: 'SIMULATED',
      tradable: true
    }));
    return results.slice(offset, offset + limit);
  }

  async getInstrument(symbol: string): Promise<Instrument | null> {
    const sym = symbol.toUpperCase();
    const price = this.basePrices.get(sym);
    if (!price) return null;
    return {
      id: sym,
      symbol: sym,
      exchange: 'NSE',
      name: `${sym} (Practice Mode)`,
      sector: 'General',
      last_close_paise: price,
      change_bps: 0,
      as_of: new Date().toISOString().split('T')[0],
      source: 'SIMULATED',
      tradable: true
    };
  }

  async getHistoricalPrices(symbol: string, range = '1Y'): Promise<PricePoint[]> {
    const latest = await this.getLatestClose(symbol);
    return [{ date: latest.as_of, close_paise: latest.close_paise }];
  }

  async getStatus(): Promise<MarketStatus> {
    const today = new Date().toISOString().split('T')[0];
    return {
      prices_as_of: today,
      state: 'FRESH',
      market_open: false
    };
  }
}

/**
 * Deterministic freshness evaluator per PRD Section 8.3
 */
export function evaluateMarketFreshness(latestLoadedDateStr: string, currentSystemTime: Date): MarketStatus {
  // Convert current system time to Asia/Kolkata (IST)
  const istFormatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const parts = istFormatter.formatToParts(currentSystemTime);
  const getPart = (type: string) => parts.find(p => p.type === type)?.value || '';

  const istDateStr = `${getPart('year')}-${getPart('month')}-${getPart('day')}`;
  const istHour = parseInt(getPart('hour'), 10);
  const istMinute = parseInt(getPart('minute'), 10);

  const dayOfWeek = currentSystemTime.getUTCDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  // Market hours: 09:15 to 15:30 IST on weekdays
  const totalMinutes = istHour * 60 + istMinute;
  const marketOpenMinutes = 9 * 60 + 15;
  const marketCloseMinutes = 15 * 60 + 30;
  const isMarketOpen = !isWeekend && totalMinutes >= marketOpenMinutes && totalMinutes < marketCloseMinutes;

  // Freshness State logic
  let state: FreshnessState = 'FRESH';

  const diffTime = Math.abs(new Date(istDateStr).getTime() - new Date(latestLoadedDateStr).getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays >= 2 && !isWeekend) {
    state = 'OUTDATED';
  } else if (istDateStr === latestLoadedDateStr) {
    state = 'FRESH';
  } else if (totalMinutes >= 21 * 60) {
    // Past 21:00 IST on trading day without today's close
    state = 'DELAYED';
  } else {
    state = 'FRESH';
  }

  return {
    prices_as_of: latestLoadedDateStr,
    state,
    market_open: isMarketOpen
  };
}

/**
 * Singleton factory returning active adapter based on environment
 */
let adapterInstance: IMarketDataAdapter | null = null;

export function getMarketDataAdapter(mode = process.env.MARKET_DATA_MODE || 'sample'): IMarketDataAdapter {
  if (!adapterInstance) {
    if (mode === 'simulated') {
      adapterInstance = new SimulatedMarketDataAdapter();
    } else {
      adapterInstance = new SampleMarketDataAdapter();
    }
  }
  return adapterInstance;
}
