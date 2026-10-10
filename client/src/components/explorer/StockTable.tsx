"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ArrowDownRight, Star, ExternalLink } from "lucide-react";
import { Instrument } from "@/types/api";
import { formatINR, formatBps } from "@/lib/formatters";

interface StockTableProps {
  instruments: Instrument[];
  onSelectInstrument?: (instrument: Instrument) => void;
  onResetFilters?: () => void;
}

export const StockTable: React.FC<StockTableProps> = ({
  instruments,
  onSelectInstrument,
  onResetFilters,
}) => {
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set(["RELIANCE", "TCS"]));

  const toggleWatchlist = (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setWatchlist((prev) => {
      const next = new Set(prev);
      if (next.has(symbol)) {
        next.delete(symbol);
      } else {
        next.add(symbol);
      }
      return next;
    });
  };

  if (instruments.length === 0) {
    return (
      <div className="py-16 text-center bg-graphite/40 border border-yaleBlue/30 rounded-2xl p-8">
        <h3 className="text-lg font-bold text-white">No matching instruments found</h3>
        <p className="text-xs text-alabaster/70 mt-1 max-w-sm mx-auto">
          Try adjusting your search query or selecting &quot;All&quot; sectors.
        </p>
        {onResetFilters && (
          <button
            onClick={onResetFilters}
            className="mt-4 px-4 py-2 rounded-lg bg-graphite-light border border-yaleBlue/60 text-xs font-mono text-alabaster hover:text-white"
          >
            Reset Search Filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-yaleBlue/40 bg-graphite/70 shadow-xl">
      <table className="w-full text-left border-collapse text-xs sm:text-sm">
        <thead>
          <tr className="border-b border-yaleBlue/30 bg-[#1e262b]/80 text-[11px] uppercase tracking-wider text-alabaster/60 font-mono">
            <th className="py-3.5 px-4 w-12 text-center">★</th>
            <th className="py-3.5 px-4 font-semibold">Instrument</th>
            <th className="py-3.5 px-4 font-semibold hidden md:table-cell">Sector</th>
            <th className="py-3.5 px-4 font-semibold text-right">EOD Close</th>
            <th className="py-3.5 px-4 font-semibold text-right">Day Change</th>
            <th className="py-3.5 px-4 font-semibold text-right w-28">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-yaleBlue/20 font-sans">
          {instruments.map((stock) => {
            const isStarred = watchlist.has(stock.symbol);
            const isPositive = stock.change_bps >= 0;

            return (
              <tr
                key={stock.symbol}
                className="hover:bg-graphite-light/40 transition-colors group"
              >
                {/* Watchlist star */}
                <td className="py-3.5 px-4 text-center">
                  <button
                    onClick={(e) => toggleWatchlist(stock.symbol, e)}
                    className="p-1 text-alabaster/40 hover:text-amber-400 transition-colors"
                    aria-label={`Toggle watchlist for ${stock.symbol}`}
                  >
                    <Star
                      className={`w-4 h-4 ${
                        isStarred ? "text-amber-400 fill-amber-400" : ""
                      }`}
                    />
                  </button>
                </td>

                {/* Symbol & Name */}
                <td className="py-3.5 px-4">
                  <Link
                    href={`/stock/${stock.symbol}`}
                    className="flex flex-col group-hover:text-stormyTeal-light transition-colors"
                  >
                    <div className="flex items-center gap-1.5 font-bold text-white group-hover:text-stormyTeal-light">
                      <span>{stock.symbol}</span>
                      <span className="text-[10px] px-1 py-0.2 rounded bg-graphite-dark text-alabaster/60 font-mono">
                        {stock.exchange}
                      </span>
                    </div>
                    <span className="text-xs text-alabaster/60 truncate max-w-[180px] sm:max-w-xs">
                      {stock.name}
                    </span>
                  </Link>
                </td>

                {/* Sector */}
                <td className="py-3.5 px-4 hidden md:table-cell text-xs text-alabaster/70">
                  <span className="px-2 py-0.5 rounded-full bg-yaleBlue/30 text-alabaster/80 text-[11px]">
                    {stock.sector}
                  </span>
                </td>

                {/* Last Close Price */}
                <td className="py-3.5 px-4 text-right font-mono font-semibold text-white">
                  {formatINR(stock.last_close_paise)}
                </td>

                {/* Day Change % */}
                <td className="py-3.5 px-4 text-right font-mono font-semibold">
                  <span
                    className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs ${
                      isPositive
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-rose-500/10 text-rose-400"
                    }`}
                  >
                    {isPositive ? (
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowDownRight className="w-3.5 h-3.5" />
                    )}
                    {formatBps(stock.change_bps)}
                  </span>
                </td>

                {/* Actions */}
                <td className="py-3.5 px-4 text-right">
                  <Link
                    href={`/stock/${stock.symbol}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-stormyTeal hover:bg-stormyTeal-light text-white font-medium text-xs transition-colors shadow-sm"
                  >
                    Trade
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
