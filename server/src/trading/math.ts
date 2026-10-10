/**
 * Mudra Virtual Trading Math Engine
 * Conformance: PRD Section 7 (Trading Rules) & Section 9 (Formulas & Worked Example)
 * 
 * Stored and calculated strictly in integer paise (bigint).
 */

export interface BuyReservation {
  estPricePaise: bigint;
  estFeePaise: bigint;
  totalReservedPaise: bigint;
}

export interface BuyResult {
  newQty: number;
  newCostBasisPaise: bigint;
  avgPricePaise: bigint;
  cashOutPaise: bigint;
}

export interface SellResult {
  newQty: number;
  newCostBasisPaise: bigint;
  avgPricePaise: bigint;
  cashInPaise: bigint;
  costOfSoldPaise: bigint;
  realizedPlPaise: bigint;
}

/**
 * Calculates 0.1% simulated fee, rounded to the nearest paisa.
 * Formula: round(0.001 * tradeValuePaise)
 */
export function calculateFee(tradeValuePaise: bigint): bigint {
  if (tradeValuePaise <= 0n) return 0n;
  // (tradeValuePaise * 1n + 500n) / 1000n performs round-half-up on integer math
  return (tradeValuePaise + 500n) / 1000n;
}

/**
 * Calculates estimated buy cost with a 10% safety buffer for price movements.
 * est_price = latest_close * 110 / 100
 * est_cost = est_price * qty + fee(est_price * qty)
 */
export function calculateBuyReservation(lastClosePaise: bigint, qty: number): BuyReservation {
  if (qty <= 0) {
    throw new Error('Quantity must be greater than zero');
  }
  const estPricePaise = (lastClosePaise * 110n) / 100n;
  const tradeValuePaise = estPricePaise * BigInt(qty);
  const estFeePaise = calculateFee(tradeValuePaise);
  const totalReservedPaise = tradeValuePaise + estFeePaise;

  return {
    estPricePaise,
    estFeePaise,
    totalReservedPaise
  };
}

/**
 * Determines target trade execution date based on 15:30 IST market cutoff
 * and exchange holiday calendar.
 */
export function getNextExecutionDate(currentTime: Date, closedDates: Set<string> = new Set()): string {
  // Format current time into Asia/Kolkata (IST) parts
  const istFormatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const parts = istFormatter.formatToParts(currentTime);
  const getPart = (type: string) => parts.find(p => p.type === type)?.value || '';

  const year = parseInt(getPart('year'), 10);
  const month = parseInt(getPart('month'), 10) - 1;
  const day = parseInt(getPart('day'), 10);
  const hour = parseInt(getPart('hour'), 10);
  const minute = parseInt(getPart('minute'), 10);
  const second = parseInt(getPart('second'), 10);

  // UTC Date representation of IST midnight
  const targetDate = new Date(Date.UTC(year, month, day));

  // 15:30:00 IST cutoff
  const isPastCutoff = hour > 15 || (hour === 15 && (minute > 30 || (minute === 30 && second > 0)));

  if (isPastCutoff) {
    targetDate.setUTCDate(targetDate.getUTCDate() + 1);
  }

  // Helper checking if given date is a non-trading day (weekend or holiday)
  const isNonTradingDay = (d: Date): boolean => {
    const dayOfWeek = d.getUTCDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) return true; // Sunday or Saturday
    const isoDateStr = d.toISOString().split('T')[0];
    return closedDates.has(isoDateStr);
  };

  while (isNonTradingDay(targetDate)) {
    targetDate.setUTCDate(targetDate.getUTCDate() + 1);
  }

  return targetDate.toISOString().split('T')[0];
}

/**
 * Updates equity holdings after a BUY fill.
 * Cost basis includes buy fees.
 */
export function updateHoldingOnBuy(
  oldQty: number,
  oldCostBasisPaise: bigint,
  buyQty: number,
  fillPricePaise: bigint,
  feePaise: bigint
): BuyResult {
  const tradeValuePaise = fillPricePaise * BigInt(buyQty);
  const cashOutPaise = tradeValuePaise + feePaise;
  const newCostBasisPaise = oldCostBasisPaise + cashOutPaise;
  const newQty = oldQty + buyQty;
  const avgPricePaise = newQty > 0 ? newCostBasisPaise / BigInt(newQty) : 0n;

  return {
    newQty,
    newCostBasisPaise,
    avgPricePaise,
    cashOutPaise
  };
}

/**
 * Updates equity holdings after a SELL fill.
 * Deducts weighted average cost basis and records realized P&L.
 */
export function updateHoldingOnSell(
  oldQty: number,
  oldCostBasisPaise: bigint,
  sellQty: number,
  fillPricePaise: bigint,
  feePaise: bigint
): SellResult {
  if (oldQty < sellQty) {
    throw new Error('Cannot sell more shares than currently owned');
  }

  const tradeValuePaise = fillPricePaise * BigInt(sellQty);
  const cashInPaise = tradeValuePaise - feePaise;
  const costOfSoldPaise = (oldCostBasisPaise * BigInt(sellQty)) / BigInt(oldQty);
  const realizedPlPaise = cashInPaise - costOfSoldPaise;
  const newCostBasisPaise = oldCostBasisPaise - costOfSoldPaise;
  const newQty = oldQty - sellQty;
  const avgPricePaise = newQty > 0 ? newCostBasisPaise / BigInt(newQty) : 0n;

  return {
    newQty,
    newCostBasisPaise,
    avgPricePaise,
    cashInPaise,
    costOfSoldPaise,
    realizedPlPaise
  };
}

/**
 * Calculates unrealized P&L for a holding at last closing price.
 */
export function calculateUnrealizedPl(
  qtyHeld: number,
  lastClosePaise: bigint,
  costBasisPaise: bigint
): { currentValuePaise: bigint; unrealizedPlPaise: bigint } {
  const currentValuePaise = BigInt(qtyHeld) * lastClosePaise;
  const unrealizedPlPaise = currentValuePaise - costBasisPaise;
  return {
    currentValuePaise,
    unrealizedPlPaise
  };
}

/**
 * Calculates total equity and total return percentage.
 */
export function calculatePortfolioEquity(
  freeCashPaise: bigint,
  reservedCashPaise: bigint,
  holdingsValuePaise: bigint,
  startingCashPaise: bigint = 10000000n
): { totalEquityPaise: bigint; returnBps: number; returnPct: number } {
  const totalEquityPaise = freeCashPaise + reservedCashPaise + holdingsValuePaise;
  const returnPaise = totalEquityPaise - startingCashPaise;
  // Return in basis points (1% = 100 bps)
  const returnBps = Number((returnPaise * 10000n) / startingCashPaise);
  const returnPct = returnBps / 100;

  return {
    totalEquityPaise,
    returnBps,
    returnPct
  };
}
