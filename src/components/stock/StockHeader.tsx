"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Star, ArrowUpRight, ArrowDownRight, ShieldCheck } from "lucide-react";
import { Instrument } from "@/types/api";
import { formatINR, formatBps } from "@/lib/formatters";
import { MarketStatusBadge } from "@/components/common/MarketStatusBadge";

interface StockHeaderProps {
  instrument: Instrument;
}

export const StockHeader: React.FC<StockHeaderProps> = ({ instrument }) => {
  const [isStarred, setIsStarred] = useState(false);
  const isPositive = instrument.change_bps >= 0;

  return (
    <div className="w-full pb-6 border-b border-yaleBlue/30">
      <div className="flex items-center justify-between gap-3 mb-4">
        <Link
          href="/explore"
          className="inline-flex items-center gap-1.5 text-xs text-alabaster/70 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Explorer
        </Link>
        <MarketStatusBadge isOpen={false} freshness="FRESH" asOfDate={instrument.as_of} />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Symbol & Name */}
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {instrument.symbol}
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-graphite-dark text-alabaster/80 border border-alabaster/10">
              {instrument.exchange}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] bg-yaleBlue/30 text-stormyTeal-light border border-yaleBlue/40">
              {instrument.sector}
            </span>
            <button
              onClick={() => setIsStarred(!isStarred)}
              className="p-1 text-alabaster/40 hover:text-amber-400 transition-colors"
              aria-label="Star"
            >
              <Star
                className={`w-5 h-5 ${
                  isStarred ? "text-amber-400 fill-amber-400" : ""
                }`}
              />
            </button>
          </div>
          <p className="text-xs sm:text-sm text-alabaster/70 mt-1">
            {instrument.name}
          </p>
        </div>

        {/* Right: Closing Price & Day Change */}
        <div className="text-left sm:text-right">
          <div className="flex items-baseline sm:justify-end gap-3">
            <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono">
              {formatINR(instrument.last_close_paise)}
            </span>
            <span
              className={`inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full text-xs font-semibold font-mono ${
                isPositive
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
              }`}
            >
              {isPositive ? (
                <ArrowUpRight className="w-3.5 h-3.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5" />
              )}
              {formatBps(instrument.change_bps)}
            </span>
          </div>
          <span className="text-[11px] text-alabaster/50 font-mono block mt-1">
            Official Close Price • {instrument.as_of}
          </span>
        </div>
      </div>
    </div>
  );
};
