"use client";

import React, { useState } from "react";
import { X, Clock, AlertCircle } from "lucide-react";
import { Instrument, OrderSide, OrderResponse } from "@/types/api";
import { OrderCalculationBreakdown } from "./OrderCalculationBreakdown";
import { OrderSuccessState } from "./OrderSuccessState";
import { placeOrder } from "@/lib/api";

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  instrument: Instrument;
  initialSide?: OrderSide;
  availableCashPaise?: number;
  availableHoldingQty?: number;
}

export const OrderModal: React.FC<OrderModalProps> = ({
  isOpen,
  onClose,
  instrument,
  initialSide = "BUY",
  availableCashPaise = 8757020, // ₹87,570.20
  availableHoldingQty = 9,      // 9 shares of RELIANCE in mock
}) => {
  const [side, setSide] = useState<OrderSide>(initialSide);
  const [qty, setQty] = useState<number>(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<OrderResponse | null>(null);

  if (!isOpen) return null;

  const handleQtyChange = (delta: number) => {
    setQty((prev) => Math.max(1, Math.min(1000, prev + delta)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation checks
    const tradeValue = instrument.last_close_paise * qty;
    const estFee = Math.round(tradeValue * 0.001);
    const safetyBuffer = side === "BUY" ? Math.round(tradeValue * 0.1) : 0;
    const totalRequired = tradeValue + estFee + safetyBuffer;

    if (side === "BUY" && totalRequired > availableCashPaise) {
      setError("Insufficient virtual cash in wallet for this order.");
      return;
    }

    if (side === "SELL" && qty > availableHoldingQty) {
      setError(`Cannot sell ${qty} shares. You only own ${availableHoldingQty} unreserved shares.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await placeOrder({
        symbol: instrument.symbol,
        side,
        qty,
        client_order_id: `cli_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      });
      setCompletedOrder(response);
    } catch (err: any) {
      setError(err?.message || "Failed to submit virtual order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[var(--surface-card)] border border-[var(--border-hairline)] rounded-2xl p-6 sm:p-7 shadow-2xl text-[var(--text-heading)] max-h-[92vh] overflow-y-auto">
        {/* Modal Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[var(--surface-muted)] transition-colors border border-[var(--border-hairline)]"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {completedOrder ? (
          <OrderSuccessState
            order={completedOrder}
            symbol={instrument.symbol}
            side={side}
            qty={qty}
            onDone={() => {
              setCompletedOrder(null);
              onClose();
            }}
          />
        ) : (
          <>
            {/* Modal Header */}
            <div className="border-b border-[var(--border-hairline)] pb-4 mb-5">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold font-mono tracking-tight">{instrument.symbol}</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-[var(--surface-muted)] text-[var(--text-muted)] font-mono border border-[var(--border-hairline)]">
                  {instrument.exchange}
                </span>
                <span className="text-xs text-[var(--text-muted)] truncate max-w-[220px]">
                  {instrument.name}
                </span>
              </div>
            </div>

            {/* Next-Close Execution Info Strip */}
            <div className="mb-5 p-3.5 rounded-xl bg-[var(--surface-muted)]/70 border border-[var(--border-hairline)] flex items-start gap-2.5 text-xs text-[var(--text-body)]">
              <Clock className="w-4 h-4 text-[var(--mudra-sky-blue)] shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-[var(--text-heading)]">Deterministic Next-Close: </span>
                Orders clear against official 15:30 IST NSE closing auction. Free cash is held in reserve until settlement.
              </div>
            </div>

            {/* Buy / Sell Toggle Tabs */}
            <div className="grid grid-cols-2 p-1 rounded-full bg-[var(--surface-muted)] border border-[var(--border-hairline)] mb-5">
              <button
                type="button"
                onClick={() => setSide("BUY")}
                className={`py-2 rounded-full text-xs font-bold transition-all shadow-sm ${
                  side === "BUY"
                    ? "bg-[var(--mudra-sky-blue)] text-[#0A0D10]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-heading)]"
                }`}
              >
                BUY / LONG
              </button>
              <button
                type="button"
                onClick={() => setSide("SELL")}
                className={`py-2 rounded-full text-xs font-bold transition-all shadow-sm ${
                  side === "SELL"
                    ? "bg-[var(--mudra-node-red)] text-white"
                    : "text-[var(--text-muted)] hover:text-[var(--text-heading)]"
                }`}
              >
                SELL / EXIT
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Quantity Stepper */}
              <div>
                <div className="flex justify-between items-center mb-1.5 text-xs">
                  <label htmlFor="order-qty-input" className="font-medium text-[var(--text-body)]">
                    Quantity (Shares)
                  </label>
                  <span className="font-mono text-[var(--text-muted)] text-[11px]">Lot size: 1 share</span>
                </div>
                <div className="flex items-stretch rounded-full bg-[var(--surface-canvas)] border border-[var(--border-hairline)] overflow-hidden focus-within:border-[var(--mudra-sky-blue)] transition-colors">
                  <button
                    type="button"
                    onClick={() => handleQtyChange(-1)}
                    className="px-4 py-2.5 text-[var(--text-heading)] hover:bg-[var(--surface-muted)] text-base font-bold transition-colors select-none"
                  >
                    -
                  </button>
                  <input
                    id="order-qty-input"
                    type="number"
                    min={1}
                    max={1000}
                    value={qty}
                    onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-transparent text-center font-mono font-bold text-[var(--text-heading)] text-base focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleQtyChange(1)}
                    className="px-4 py-2.5 text-[var(--text-heading)] hover:bg-[var(--surface-muted)] text-base font-bold transition-colors select-none"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Dynamic Calculation Breakdown */}
              <OrderCalculationBreakdown
                side={side}
                qty={qty}
                lastClosePaise={instrument.last_close_paise}
                availableCashPaise={availableCashPaise}
                availableHoldingQty={availableHoldingQty}
              />

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3.5 px-4 rounded-full font-bold text-xs sm:text-sm tracking-wide transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                  side === "BUY"
                    ? "bg-[var(--mudra-sky-blue)] hover:brightness-105 text-[#0A0D10]"
                    : "bg-[var(--mudra-node-red)] hover:brightness-110 text-white"
                } ${isSubmitting ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                {isSubmitting ? (
                  <span>Queuing Order in Ledger...</span>
                ) : (
                  <span>
                    Confirm Virtual {side} ({qty} Shares)
                  </span>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

