/**
 * Market Data Adapter Types & Interfaces
 * Conformance: PRD Section 8 (Data Requirements), DR-1, DR-2, FR-43, FR-50
 */

export type FreshnessState = 'FRESH' | 'DELAYED' | 'OUTDATED';

export interface MarketStatus {
  prices_as_of: string;
  state: FreshnessState;
  market_open: boolean;
}

export interface Instrument {
  id: string;
  symbol: string;
  exchange: 'NSE' | 'BSE';
  name: string;
  isin?: string;
  sector: string;
  last_close_paise: bigint;
  change_bps: number;
  as_of: string;
  source: string;
  tradable: boolean;
}

export interface PricePoint {
  date: string;
  close_paise: bigint;
  open_paise?: bigint;
  high_paise?: bigint;
  low_paise?: bigint;
  volume?: number;
}

export interface IMarketDataAdapter {
  /**
   * Get the most recent closing price for an instrument
   */
  getLatestClose(symbol: string): Promise<{ close_paise: bigint; as_of: string; source: string }>;

  /**
   * Get all closing prices for a specific trade date
   */
  getDailyCloses(date: string): Promise<Map<string, bigint>>;

  /**
   * Search and filter instruments by symbol, company name, or sector
   */
  searchInstruments(query?: string, sector?: string, limit?: number, offset?: number): Promise<Instrument[]>;

  /**
   * Get details and tradability status for a single symbol
   */
  getInstrument(symbol: string): Promise<Instrument | null>;

  /**
   * Get historical closing price points for charting
   */
  getHistoricalPrices(symbol: string, range?: '1M' | '6M' | '1Y' | 'ALL'): Promise<PricePoint[]>;

  /**
   * Determine data freshness and operational market state
   */
  getStatus(): Promise<MarketStatus>;
}
