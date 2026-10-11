"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShoppingBag, AlertCircle, ArrowRight } from "lucide-react";
import { StockHeader } from "@/components/stock/StockHeader";
import { PriceChart } from "@/components/stock/PriceChart";
import { KeyStatistics } from "@/components/stock/KeyStatistics";
import { OrderModal } from "@/components/trade/OrderModal";
import { MudraShell } from "@/components/mudra/MudraShell";
import { getInstrumentDetail, getPortfolio } from "@/lib/api";
import { Instrument, OrderSide, PortfolioSummary } from "@/types/api";
import { formatINR } from "@/lib/formatters";

export default function StockDetailPage() {
  const params = useParams();
  const symbol = (params?.symbol as string)?.toUpperCase() || "RELIANCE";

  const [instrument, setInstrument] = useState<Instrument | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderSide, setOrderSide] = useState<OrderSide>("BUY");

  useEffect(() => {
    getInstrumentDetail(symbol).then((inst) => setInstrument(inst));
    getPortfolio().then((port) => setPortfolio(port));
  }, [symbol]);

  if (!instrument) {
    return (
      <MudraShell activeNav="explore">
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-[var(--surface-muted)] text-[var(--mudra-signal-yellow)] flex items-center justify-center mb-4 border border-[var(--border-hairline)] font-mono text-xl">
            !
          </div>
          <h2 className="text-xl font-bold text-[var(--text-heading)] mb-2">
            Instrument Not Found
          </h2>
          <p className="text-xs text-[var(--text-muted)] mb-6">
            Could not find ticker symbol &quot;{symbol}&quot; in our NSE 50 master registry.
          </p>
          <Link
            href="/explore"
            className="px-6 py-2.5 rounded-full bg-[var(--mudra-sky-blue)] text-[#0A0D10] text-xs font-bold tracking-wide transition-transform hover:scale-[1.02]"
          >
            Return to Market Explorer
          </Link>
        </div>
      </MudraShell>
    );
  }

  // Active holding check for this stock
  const currentHolding = portfolio?.holdings.find(
    (h) => h.symbol.toUpperCase() === symbol
  );

  const openOrder = (side: OrderSide) => {
    setOrderSide(side);
    setIsOrderModalOpen(true);
  };

  return (
    <MudraShell activeNav="explore">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32">
        {/* Back Link Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-heading)] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>BACK TO DIRECTORY</span>
          </Link>
        </div>

        {/* Stock Header */}
        <StockHeader instrument={instrument} />

        {/* User Position Banner if owned */}
        {currentHolding && (
          <div className="my-6 p-5 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-hairline)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--mudra-link-green)]/10 text-[var(--mudra-link-green)] border border-[var(--mudra-link-green)]/20 flex items-center justify-center font-bold">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[var(--text-heading)]">Your Position</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-[var(--mudra-link-green)]/15 text-[var(--mudra-link-green)] font-bold border border-[var(--mudra-link-green)]/30">
                    LONG
                  </span>
                </div>
                <span className="text-xs text-[var(--text-muted)] font-mono">
                  {currentHolding.qty} shares @ Avg Cost {formatINR(currentHolding.avg_paise)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-6 text-xs font-mono">
              <div>
                <span className="text-[var(--text-muted)] block text-[11px]">Unrealized P&amp;L</span>
                <span className="font-semibold text-[var(--mudra-link-green)]">
                  +{formatINR(currentHolding.unrealized_paise)}
                </span>
              </div>
              <div>
                <span className="text-[var(--text-muted)] block text-[11px]">Current Value</span>
                <span className="font-semibold text-[var(--text-heading)]">
                  {formatINR(currentHolding.value_paise)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Main Grid: Chart & Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
          <div className="lg:col-span-8">
            <PriceChart
              symbol={instrument.symbol}
              currentClosePaise={instrument.last_close_paise}
            />
          </div>
          <div className="lg:col-span-4 flex flex-col gap-6">
            <KeyStatistics instrument={instrument} />

            {/* Educational Explainer */}
            <div className="p-6 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-hairline)] text-xs space-y-2.5 text-[var(--text-body)] shadow-sm">
              <div className="flex items-center gap-2 text-[var(--text-heading)] font-bold text-sm">
                <AlertCircle className="w-4 h-4 text-[var(--mudra-signal-yellow)]" />
                <span>Deterministic 15:30 IST Execution</span>
              </div>
              <p className="leading-relaxed text-[var(--text-muted)]">
                Mudra settles virtual orders against official NSE closing auction prices at 15:30 IST. When placing a BUY order, your cash ledger reserves a 10% safety buffer to absorb daytime price fluctuations. Any unused reserve is automatically returned upon execution.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Bottom Action Bar */}
      <div className="fixed bottom-0 inset-x-0 z-30 bg-[var(--surface-card)]/90 border-t border-[var(--border-hairline)] p-4 backdrop-blur-md shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="hidden sm:flex flex-col">
            <span className="text-[11px] text-[var(--text-muted)] font-mono uppercase tracking-wider">Reference NSE EOD</span>
            <span className="text-xl font-bold text-[var(--text-heading)] font-mono">
              {formatINR(instrument.last_close_paise)}
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => openOrder("SELL")}
              className="flex-1 sm:flex-initial px-6 py-3 rounded-full bg-[var(--surface-card)] hover:bg-[var(--surface-muted)] text-[var(--text-heading)] border border-[var(--border-hairline)] font-bold text-xs sm:text-sm tracking-wide transition-all shadow-sm"
            >
              Sell / Exit
            </button>
            <button
              onClick={() => openOrder("BUY")}
              className="flex-1 sm:flex-initial px-8 py-3 rounded-full bg-[var(--mudra-sky-blue)] hover:brightness-105 text-[#0A0D10] font-bold text-xs sm:text-sm tracking-wide transition-all shadow-sm flex items-center justify-center gap-2"
            >
              Buy / Long
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Order Modal */}
      <OrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        instrument={instrument}
        initialSide={orderSide}
        availableCashPaise={portfolio?.cash_paise || 8757020}
        availableHoldingQty={currentHolding?.qty || 0}
      />
    </MudraShell>
  );
}
