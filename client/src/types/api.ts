/**
 * Mudra API Types
 * In strict conformance with docs/api.md and PRD specifications
 */

export interface Instrument {
  id: string;
  symbol: string;
  name: string;
  exchange: "NSE" | "BSE";
  sector: string;
  last_close_paise: number;
  change_bps: number;
  as_of: string;
  tradable: boolean;
  source?: string;
}

export type OrderSide = "BUY" | "SELL";
export type OrderStatus = "PENDING" | "FILLED" | "REJECTED" | "CANCELLED";

export interface OrderRequest {
  symbol: string;
  side: OrderSide;
  qty: number;
  client_order_id: string;
}

export interface OrderResponse {
  order_id: string;
  status: OrderStatus;
  target_trade_date: string;
  reserved_paise: number;
}

export interface OrderItem {
  id: string;
  symbol: string;
  side: OrderSide;
  qty: number;
  status: OrderStatus;
  reason: string | null;
  fill_price_paise: number | null;
  created_at: string;
}

export interface HoldingItem {
  symbol: string;
  name?: string;
  qty: number;
  avg_paise: number;
  invested_paise: number;
  value_paise: number;
  unrealized_paise: number;
  unrealized_bps?: number;
}

export interface PortfolioSummary {
  cash_paise: number;
  reserved_paise: number;
  holdings: HoldingItem[];
  equity_paise: number;
  realized_paise: number;
  prices_as_of: string;
}

export interface StatusResponse {
  prices_as_of: string;
  state: "FRESH" | "DELAYED" | "OUTDATED";
  market_open: boolean;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    request_id: string;
  };
}
