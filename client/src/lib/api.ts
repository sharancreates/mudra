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
  LeaderboardItem,
  LeaderboardResponse,
} from "@/types/api";
import instrumentsFixture from "@/mocks/instruments.json";
import portfolioFixture from "@/mocks/portfolio.json";
import leaderboardFixture from "@/mocks/leaderboard.json";

// In-memory orders store for client-side persistence and instant feedback
let localOrdersStore: OrderItem[] = [];

export async function getInstruments(
  query = "",
  sector = ""
): Promise<Instrument[]> {
  try {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (sector && sector !== "All") params.set("sector", sector);

    const res = await fetch(`/api/instruments?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.items) && data.items.length > 0) {
        return data.items.map((inst: any) => ({
          id: inst.symbol,
          symbol: inst.symbol,
          name: inst.name || inst.symbol,
          exchange: inst.exchange || "NSE",
          sector: inst.sector || "Equities",
          last_close_paise: Number(inst.last_close_paise),
          change_bps: inst.change_bps || 0,
          as_of: inst.as_of,
          tradable: inst.tradable !== false,
        }));
      }
    }
  } catch {
    // Network / SSR fallback
  }

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
  try {
    const res = await fetch(`/api/instruments/${encodeURIComponent(symbol)}`);
    if (res.ok) {
      const inst = await res.json();
      return {
        id: inst.symbol,
        symbol: inst.symbol,
        name: inst.name || inst.symbol,
        exchange: inst.exchange || "NSE",
        sector: inst.sector || "Equities",
        last_close_paise: Number(inst.last_close_paise),
        change_bps: inst.change_bps || 0,
        as_of: inst.as_of,
        tradable: inst.tradable !== false,
      };
    }
  } catch {
    // Fallback
  }

  const list = instrumentsFixture as Instrument[];
  const found = list.find(
    (inst) => inst.symbol.toUpperCase() === symbol.toUpperCase()
  );
  return found || null;
}

export async function getPortfolio(): Promise<PortfolioSummary> {
  try {
    const res = await fetch("/api/portfolio");
    if (res.ok) {
      const data = await res.json();
      return {
        cash_paise: Number(data.cash_paise),
        reserved_paise: Number(data.reserved_paise),
        holdings: data.holdings || [],
        equity_paise: Number(data.equity_paise),
        realized_paise: Number(data.realized_paise || 0),
        prices_as_of: data.prices_as_of || "2026-10-09",
      };
    }
  } catch {
    // Network / SSR fallback
  }

  const basePortfolio = { ...(portfolioFixture as PortfolioSummary) };

  // Calculate dynamic reserved cash from pending buy orders
  const pendingBuyOrders = localOrdersStore.filter(
    (o) => o.status === "PENDING" && o.side === "BUY"
  );

  if (pendingBuyOrders.length > 0) {
    let pendingReserved = 0;
    for (const ord of pendingBuyOrders) {
      const inst = (instrumentsFixture as Instrument[]).find(
        (i) => i.symbol === ord.symbol
      );
      const price = inst?.last_close_paise || 140000;
      const tradeValue = Math.round(price * 1.1) * ord.qty;
      const fee = Math.round(tradeValue * 0.001);
      pendingReserved += tradeValue + fee;
    }

    basePortfolio.reserved_paise += pendingReserved;
    basePortfolio.cash_paise = Math.max(
      0,
      basePortfolio.cash_paise - pendingReserved
    );
  }

  return basePortfolio;
}

export async function getPortfolioHistory(
  range = "ALL"
): Promise<{ points: Array<{ date: string; equity_paise: number }> }> {
  try {
    const res = await fetch(`/api/portfolio/history?range=${encodeURIComponent(range)}`);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Fallback
  }
  return {
    points: [
      { date: "2026-10-09", equity_paise: 10000000 }
    ]
  };
}

export async function getLedger(
  page = 1,
  limit = 50
): Promise<{ items: any[]; next: number | null }> {
  try {
    const res = await fetch(`/api/ledger?page=${page}&limit=${limit}`);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Fallback
  }
  return { items: [], next: null };
}

export async function getStatus(): Promise<StatusResponse> {
  try {
    const res = await fetch("/api/status");
    if (res.ok) {
      const data = await res.json();
      return {
        prices_as_of: data.prices_as_of,
        state: data.state,
        market_open: data.market_open,
      };
    }
  } catch {
    // Fallback
  }
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

  // Attempt backend API call
  try {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        symbol: req.symbol,
        side: req.side,
        qty: req.qty,
        client_order_id:
          req.client_order_id ||
          `cli_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const orderItem: OrderItem = {
        id: data.order_id,
        symbol: req.symbol.toUpperCase(),
        side: req.side,
        qty: req.qty,
        status: data.status,
        reason: null,
        fill_price_paise: null,
        created_at: new Date().toISOString(),
      };
      localOrdersStore.unshift(orderItem);
      return data;
    } else {
      const errJson = await res.json().catch(() => null);
      if (errJson?.error?.message) {
        throw new Error(errJson.error.message);
      }
    }
  } catch (err: any) {
    if (err.message && !err.message.includes("fetch")) {
      throw err;
    }
  }

  // Fallback in-memory handler
  const inst = await getInstrumentDetail(req.symbol);
  if (!inst) {
    throw new Error(`Unknown instrument: ${req.symbol}`);
  }

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

  localOrdersStore.unshift(orderItem);

  return {
    order_id: orderId,
    status: "PENDING",
    target_trade_date: targetDate,
    reserved_paise: req.side === "BUY" ? reservedPaise : 0,
  };
}

export async function getOrderHistory(): Promise<OrderItem[]> {
  try {
    const res = await fetch("/api/orders");
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.items) && data.items.length > 0) {
        return data.items;
      }
    }
  } catch {
    // Fallback
  }
  return localOrdersStore;
}

export async function getLeaderboard(
  range = "ALL"
): Promise<LeaderboardResponse> {
  try {
    const res = await fetch(`/api/leaderboard?range=${encodeURIComponent(range)}`);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Offline / dev fallback
  }

  return {
    items: leaderboardFixture as LeaderboardItem[],
    user_standing: {
      rank: 8,
      equity_paise: 10071020,
      return_bps: 71,
      trades_count: 5,
      days_active: 7,
      is_eligible: true,
    },
    as_of: "2026-10-09",
  };
}

