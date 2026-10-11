import React from "react";
import { OrderSide } from "@/types/api";
import { formatINR } from "@/lib/formatters";

interface OrderCalculationBreakdownProps {
  side: OrderSide;
  qty: number;
  lastClosePaise: number;
  availableCashPaise: number;
  availableHoldingQty: number;
}

export const OrderCalculationBreakdown: React.FC<OrderCalculationBreakdownProps> = ({
  side,
  qty,
  lastClosePaise,
  availableCashPaise,
  availableHoldingQty,
}) => {
  const tradeValue = lastClosePaise * qty;
  const simulatedFee = Math.round(tradeValue * 0.001); // 0.1% fee
  const safetyBuffer = side === "BUY" ? Math.round(tradeValue * 0.1) : 0; // 10% cash reservation buffer
  const totalReserved = tradeValue + simulatedFee + safetyBuffer;
  const netProceeds = tradeValue - simulatedFee;

  const cashAfterOrder = availableCashPaise - totalReserved;
  const isCashInsufficient = side === "BUY" && cashAfterOrder < 0;
  const isHoldingsInsufficient = side === "SELL" && qty > availableHoldingQty;

  return (
    <div className="p-4 rounded-xl bg-[var(--surface-muted)]/70 border border-[var(--border-hairline)] space-y-2.5 text-xs text-[var(--text-body)]">
      <div className="flex justify-between items-center text-[var(--text-muted)]">
        <span>Reference Gross Value:</span>
        <span className="font-mono text-[var(--text-heading)] font-semibold">
          {formatINR(tradeValue)}
        </span>
      </div>

      <div className="flex justify-between items-center text-[var(--text-muted)]">
        <span>Simulated Brokerage Fee (0.1%):</span>
        <span className="font-mono text-[var(--text-heading)] font-semibold">
          {formatINR(simulatedFee)}
        </span>
      </div>

      {side === "BUY" ? (
        <>
          <div className="flex justify-between items-center text-[var(--text-muted)]">
            <span>Safety Headroom Buffer (+10%):</span>
            <span className="font-mono text-[var(--mudra-signal-yellow)] font-semibold">
              {formatINR(safetyBuffer)}
            </span>
          </div>

          <div className="pt-2 border-t border-[var(--border-hairline)] flex justify-between items-center font-bold text-[var(--text-heading)] text-sm">
            <span>Total Cash to Reserve:</span>
            <span className="font-mono text-[var(--mudra-sky-blue)]">
              {formatINR(totalReserved)}
            </span>
          </div>

          <div className="flex justify-between items-center text-[11px] pt-1">
            <span className="text-[var(--text-muted)]">Free Cash in Ledger:</span>
            <span className="font-mono text-[var(--text-heading)]">
              {formatINR(availableCashPaise)}
            </span>
          </div>

          {isCashInsufficient ? (
            <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-[11px]">
              âš ï¸ Insufficient free cash. Reduce share quantity or free up capital from other holdings.
            </div>
          ) : (
            <div className="flex justify-between items-center text-[11px] text-[var(--text-muted)]">
              <span>Free Cash After Order:</span>
              <span className="font-mono text-[var(--text-heading)]">
                {formatINR(cashAfterOrder)}
              </span>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="pt-2 border-t border-[var(--border-hairline)] flex justify-between items-center font-bold text-[var(--text-heading)] text-sm">
            <span>Estimated Net Proceeds:</span>
            <span className="font-mono text-[var(--mudra-link-green)]">
              {formatINR(netProceeds)}
            </span>
          </div>

          <div className="flex justify-between items-center text-[11px] pt-1">
            <span className="text-[var(--text-muted)]">Shares Available to Sell:</span>
            <span className="font-mono text-[var(--text-heading)]">
              {availableHoldingQty} shares
            </span>
          </div>

          {isHoldingsInsufficient && (
            <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-[11px]">
              âš ï¸ Insufficient shares owned. You currently hold {availableHoldingQty} shares. Short selling is disabled.
            </div>
          )}
        </>
      )}
    </div>
  );
};

