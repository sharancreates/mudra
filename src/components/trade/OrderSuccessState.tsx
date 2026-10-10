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
    <div className="py-6 text-center space-y-4 text-white">
      <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
        <CheckCircle2 className="w-8 h-8" />
      </div>

      <div>
        <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold block mb-1">
          Order Queued Successfully
        </span>
        <h3 className="text-xl font-bold">
          {side} {qty} Shares of {symbol}
        </h3>
        <span className="text-xs text-alabaster/60 font-mono block mt-1">
          Order ID: {order.order_id}
        </span>
      </div>

      <div className="p-4 rounded-xl bg-graphite-dark/80 border border-yaleBlue/40 text-left text-xs space-y-2.5 max-w-sm mx-auto">
        <div className="flex items-center justify-between">
          <span className="text-alabaster/60 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            Execution Status:
          </span>
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            {order.status}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-alabaster/60 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-stormyTeal-light" />
            Execution Target Date:
          </span>
          <span className="font-mono text-white font-semibold">
            {order.target_trade_date} (15:30 IST)
          </span>
        </div>

        <p className="text-[11px] text-alabaster/50 pt-1 border-t border-alabaster/10 leading-relaxed">
          Your order will execute against the official closing price during the scheduled market settlement window.
        </p>
      </div>

      <button
        type="button"
        onClick={onDone}
        className="w-full py-3 px-4 rounded-xl bg-stormyTeal hover:bg-stormyTeal-light text-white font-semibold text-sm transition-all shadow-md flex items-center justify-center gap-2 mt-4"
      >
        <span>Back to Instrument</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};
