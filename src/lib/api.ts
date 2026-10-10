/**
 * Mudra API Client Layer
 * Complies with docs/api.md
 */

import {
  Instrument,
  OrderRequest,
  OrderResponse,
  OrderItem,
  PortfolioSummary,
  StatusResponse,
} from "@/types/api";
import instrumentsFixture from "@/mocks/instruments.json";
import portfolioFixture from "@/mocks/portfolio.json";

// In-memory orders store for mock interactivity during Week 1
let ordersStore: OrderItem[] = [];

export async function getInstruments(
  query = "",
  sector = ""
): Promise<Instrument[]> {
  let list = instrumentsFixture as Instrument[];

  if (query.trim()) {
    const q = query.toLowerCase().trim();
    list = list.filter(
      (inst) =>
        inst.symbol.toLowerCase().includes(q) ||
        inst.name.toLowerCase().includes(q)
    );
  }

  if (sector && sector !== "All") {
    list = list.filter(
      (inst) => inst.sector.toLowerCase() === sector.toLowerCase()
    );
  }

  return list;
}

export async function getInstrumentDetail(
  symbol: string
): Promise<Instrument | null> {
  const list = instrumentsFixture as Instrument[];
  const found = list.find(
    (inst) => inst.symbol.toUpperCase() === symbol.toUpperCase()
  );
  return found || null;
}

export async function getPortfolio(): Promise<PortfolioSummary> {
  return portfolioFixture as PortfolioSummary;
}

export async function getStatus(): Promise<StatusResponse> {
  return {
    prices_as_of: "2026-10-09",
    state: "FRESH",
    market_open: false,
  };
}

export async function placeOrder(req: OrderRequest): Promise<OrderResponse> {
  if (req.qty < 1 || !Number.isInteger(req.qty)) {
    throw new Error("Invalid quantity: must be an integer greater than 0");
  }

  const inst = await getInstrumentDetail(req.symbol);
  if (!inst) {
    throw new Error(`Unknown instrument: ${req.symbol}`);
  }

  // Calculate reservation with 10% safety buffer + 0.1% fee
  const estPrice = Math.round(inst.last_close_paise * 1.1);
  const tradeValue = estPrice * req.qty;
  const estFee = Math.round(tradeValue * 0.001);
  const reservedPaise = tradeValue + estFee;

  const orderId = `ord_${Math.random().toString(36).substring(2, 10)}`;
  const targetDate = "2026-10-12"; // Next trading session close

  const orderItem: OrderItem = {
    id: orderId,
    symbol: req.symbol.toUpperCase(),
    side: req.side,
    qty: req.qty,
    status: "PENDING",
    reason: null,
    fill_price_paise: null,
    created_at: new Date().toISOString(),
  };

  ordersStore.unshift(orderItem);

  return {
    order_id: orderId,
    status: "PENDING",
    target_trade_date: targetDate,
    reserved_paise: req.side === "BUY" ? reservedPaise : 0,
  };
}

export async function getOrderHistory(): Promise<OrderItem[]> {
  return ordersStore;
}
