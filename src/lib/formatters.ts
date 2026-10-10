/**
 * Mudra Financial Formatter Utilities
 * Follows PRD Section 9: Indian Number Formatting (Lakh/Crore) and Paise Accounting
 */

/**
 * Converts integer paise into Indian Rupee string format.
 * E.g., 10000000 paise -> "₹1,00,000.00"
 */
export function formatINR(
  paise: number | bigint,
  options: {
    showSign?: boolean;
    compact?: boolean;
    includeSymbol?: boolean;
  } = {}
): string {
  const { showSign = false, compact = false, includeSymbol = true } = options;

  const numPaise = typeof paise === "bigint" ? Number(paise) : paise;
  const isNegative = numPaise < 0;
  const absRupees = Math.abs(numPaise) / 100;

  let formattedNumber: string;

  if (compact && absRupees >= 10000000) {
    // Crores (>= 1 Cr)
    const cr = absRupees / 10000000;
    formattedNumber = `${cr.toFixed(2)} Cr`;
  } else if (compact && absRupees >= 100000) {
    // Lakhs (>= 1 L)
    const lk = absRupees / 100000;
    formattedNumber = `${lk.toFixed(2)} L`;
  } else {
    // Full Indian formatting (e.g. 1,00,000.00)
    formattedNumber = new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(absRupees);
  }

  const symbol = includeSymbol ? "₹" : "";
  let sign = "";

  if (isNegative) {
    sign = "-";
  } else if (showSign && numPaise > 0) {
    sign = "+";
  }

  return `${sign}${symbol}${formattedNumber}`;
}

/**
 * Converts integer paise to float rupees for internal math when needed.
 */
export function paiseToRupees(paise: number | bigint): number {
  return Number(paise) / 100;
}

/**
 * Converts rupee amount to integer paise (bigint) avoiding floating point loss.
 */
export function rupeesToPaise(rupees: number): bigint {
  return BigInt(Math.round(rupees * 100));
}

/**
 * Formats basis points (bps) into percentage string (e.g., 125 bps -> "+1.25%").
 */
export function formatBps(bps: number, showSign = true): string {
  const percent = bps / 100;
  const formatted = percent.toFixed(2);
  if (showSign && percent > 0) {
    return `+${formatted}%`;
  }
  return `${formatted}%`;
}
