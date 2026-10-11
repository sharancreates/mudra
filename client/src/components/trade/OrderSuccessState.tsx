import React from "react";
import { CheckCircle2, Clock, Calendar, ArrowRight } from "lucide-react";
import { OrderResponse } from "@/types/api";

interface OrderSuccessStateProps {
  order: OrderResponse;
  symbol: string;
  side: "BUY" | "SELL";
  qty: number;
  onDone: () => void;
}

export const OrderSuccessState: React.FC<OrderSuccessStateProps> = ({
  order,
  symbol,
  side,
  qty,
  onDone,
}) => {
  return (
    <div className="py-6 text-center space-y-4 text-[var(--text-heading)]">
      <div className="w-14 h-14 rounded-full bg-[var(--Mudra-link-green)]/15 border border-[var(--Mudra-link-green)]/30 text-[var(--Mudra-link-green)] flex items-center justify-center mx-auto">
        <CheckCircle2 className="w-8 h-8" />
      </div>

      <div>
        <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--Mudra-link-green)] font-bold block mb-1">
          Order Queued Successfully
        </span>
        <h3 className="text-xl font-bold tracking-tight">
          {side} {qty} Shares of {symbol}
        </h3>
        <span className="text-xs text-[var(--text-muted)] font-mono block mt-1">
          Ref ID: {order.order_id}
        </span>
      </div>

      <div className="p-4 rounded-xl bg-[var(--surface-muted)]/70 border border-[var(--border-hairline)] text-left text-xs space-y-2.5 max-w-sm mx-auto">
        <div className="flex items-center justify-between">
          <span className="text-[var(--text-muted)] flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[var(--Mudra-signal-yellow)]" />
            Execution Status:
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[var(--Mudra-signal-yellow)]/15 text-[var(--Mudra-signal-yellow)] border border-[var(--Mudra-signal-yellow)]/30">
            {order.status}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[var(--text-muted)] flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[var(--Mudra-sky-blue)]" />
            Target Settlement Date:
          </span>
          <span className="font-mono text-[var(--text-heading)] font-semibold">
            {order.target_trade_date} (15:30 IST)
          </span>
        </div>

        <p className="text-[11px] text-[var(--text-muted)] pt-1.5 border-t border-[var(--border-hairline)] leading-relaxed">
          Order is queued in the ledger and will execute against official NSE closing auction prices at 15:30 IST.
        </p>
      </div>

      <button
        type="button"
        onClick={onDone}
        className="w-full py-3 px-6 rounded-full bg-[var(--Mudra-sky-blue)] hover:brightness-105 text-[#0A0D10] font-bold text-xs tracking-wide transition-all shadow-sm flex items-center justify-center gap-2 mt-4"
      >
        <span>Back to Instrument</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};

