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
    <div className="p-4 rounded-xl bg-graphite-dark border border-yaleBlue/40 space-y-2.5 text-xs text-alabaster">
      <div className="flex justify-between items-center text-alabaster/70">
        <span>Reference Gross Value:</span>
        <span className="font-mono text-white font-semibold">
          {formatINR(tradeValue)}
        </span>
      </div>

      <div className="flex justify-between items-center text-alabaster/70">
        <span>Simulated Brokerage Fee (0.1%):</span>
        <span className="font-mono text-white font-semibold">
          {formatINR(simulatedFee)}
        </span>
      </div>

      {side === "BUY" ? (
        <>
          <div className="flex justify-between items-center text-alabaster/70">
            <span>Safety Reservation Buffer (+10%):</span>
            <span className="font-mono text-amber-300 font-semibold">
              {formatINR(safetyBuffer)}
            </span>
          </div>

          <div className="pt-2 border-t border-alabaster/10 flex justify-between items-center font-bold text-white text-sm">
            <span>Total Cash to Reserve:</span>
            <span className="font-mono text-stormyTeal-light">
              {formatINR(totalReserved)}
            </span>
          </div>

          <div className="flex justify-between items-center text-[11px] pt-1">
            <span className="text-alabaster/60">Free Virtual Cash in Wallet:</span>
            <span className="font-mono text-white">
              {formatINR(availableCashPaise)}
            </span>
          </div>

          {isCashInsufficient ? (
            <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px]">
              ⚠️ Insufficient virtual cash. Reduce share quantity or sell existing holdings.
            </div>
          ) : (
            <div className="flex justify-between items-center text-[11px] text-alabaster/60">
              <span>Cash Remaining After Order:</span>
              <span className="font-mono text-white">
                {formatINR(cashAfterOrder)}
              </span>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="pt-2 border-t border-alabaster/10 flex justify-between items-center font-bold text-white text-sm">
            <span>Estimated Net Proceeds:</span>
            <span className="font-mono text-emerald-400">
              {formatINR(netProceeds)}
            </span>
          </div>

          <div className="flex justify-between items-center text-[11px] pt-1">
            <span className="text-alabaster/60">Shares Available to Sell:</span>
            <span className="font-mono text-white">
              {availableHoldingQty} shares
            </span>
          </div>

          {isHoldingsInsufficient && (
            <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px]">
              ⚠️ Insufficient shares owned. You currently hold {availableHoldingQty} shares. Short selling is not permitted.
            </div>
          )}
        </>
      )}
    </div>
  );
};
