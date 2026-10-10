"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, TrendingUp, AlertCircle, ShoppingBag, ArrowRight } from "lucide-react";
import { StockHeader } from "@/components/stock/StockHeader";
import { PriceChart } from "@/components/stock/PriceChart";
import { KeyStatistics } from "@/components/stock/KeyStatistics";
import { OrderModal } from "@/components/trade/OrderModal";
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
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <h2 className="text-xl font-bold text-white mb-2">Instrument Not Found</h2>
        <p className="text-xs text-alabaster/60 mb-6">
          Could not find ticker symbol &quot;{symbol}&quot; in our master list.
        </p>
        <Link
          href="/explore"
          className="px-4 py-2 rounded-xl bg-stormyTeal text-white text-xs font-semibold"
        >
          Return to Market Explorer
        </Link>
      </div>
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
    <div className="flex-1 flex flex-col w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-28">
      {/* Stock Header */}
      <StockHeader instrument={instrument} />

      {/* User Position Banner if owned */}
      {currentHolding && (
        <div className="my-6 p-4 rounded-2xl bg-graphite/80 border border-stormyTeal/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stormyTeal/20 text-stormyTeal-light flex items-center justify-center font-bold">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">Your Holding</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 font-semibold">
                  LONG
                </span>
              </div>
              <span className="text-xs text-alabaster/70">
                {currentHolding.qty} shares @ Avg Cost {formatINR(currentHolding.avg_paise)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-6 text-xs font-mono">
            <div>
              <span className="text-alabaster/60 block text-[11px]">Unrealized P&amp;L</span>
              <span className="font-semibold text-emerald-400">
                +{formatINR(currentHolding.unrealized_paise)}
              </span>
            </div>
            <div>
              <span className="text-alabaster/60 block text-[11px]">Current Value</span>
              <span className="font-semibold text-white">
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
          <div className="p-5 rounded-2xl bg-graphite/50 border border-yaleBlue/30 text-xs space-y-2 text-alabaster/70">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span>How mudra Orders Work</span>
            </div>
            <p className="leading-relaxed">
              Mudra fills orders at official 15:30 IST market close prices. When you place a BUY order, your cash is reserved with a 10% safety buffer. Any unused reservation is automatically refunded upon execution.
            </p>
          </div>
        </div>
      </div>

      {/* Floating Bottom Action Bar on Mobile / Fixed for desktop */}
      <div className="fixed bottom-0 inset-x-0 z-30 bg-graphite/95 border-t border-yaleBlue/50 p-4 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="hidden sm:flex flex-col">
            <span className="text-xs text-alabaster/60 font-mono">Reference Price</span>
            <span className="text-lg font-bold text-white font-mono">
              {formatINR(instrument.last_close_paise)}
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => openOrder("SELL")}
              className="flex-1 sm:flex-initial px-6 py-3 rounded-xl bg-graphite-dark hover:bg-graphite-light text-alabaster border border-alabaster/20 font-bold text-xs sm:text-sm transition-all"
            >
              Sell / Exit
            </button>
            <button
              onClick={() => openOrder("BUY")}
              className="flex-1 sm:flex-initial px-8 py-3 rounded-xl bg-stormyTeal hover:bg-stormyTeal-light text-white font-bold text-xs sm:text-sm transition-all shadow-lg flex items-center justify-center gap-2"
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
    </div>
  );
}
