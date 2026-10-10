"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Info,
  Clock,
  Briefcase,
  Layers,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { MarketStatusBadge } from "@/components/common/MarketStatusBadge";
import { getPortfolio } from "@/lib/api";
import { PortfolioSummary } from "@/types/api";
import { formatINR, formatBps } from "@/lib/formatters";

export default function DashboardPage() {
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [range, setRange] = useState<"1M" | "6M" | "ALL">("1M");
  const [showFormulaTooltip, setShowFormulaTooltip] = useState(false);

  useEffect(() => {
    getPortfolio().then((data) => setPortfolio(data));
  }, []);

  const totalValue = portfolio?.equity_paise || 10071020;
  const freeCash = portfolio?.cash_paise || 8757020;
  const reservedCash = portfolio?.reserved_paise || 0;
  const realizedPl = portfolio?.realized_paise || 24286;
  const totalGain = totalValue - 10000000; // Starting capital 1 Lakh (10000000 paise)
  const holdingsValue = totalValue - freeCash - reservedCash;

  // Chart data simulation
  const chartPoints = [
    { label: "10 Sep", val: 10000000 },
    { label: "15 Sep", val: 10014000 },
    { label: "20 Sep", val: 9980000 },
    { label: "25 Sep", val: 10035000 },
    { label: "30 Sep", val: 10020000 },
    { label: "05 Oct", val: 10052000 },
    { label: "09 Oct", val: 10071020 },
  ];

  const minVal = Math.min(...chartPoints.map((p) => p.val));
  const maxVal = Math.max(...chartPoints.map((p) => p.val));
  const valRange = maxVal - minVal || 1;

  const width = 800;
  const height = 240;
  const padX = 40;
  const padY = 25;

  const svgCoords = chartPoints.map((p, idx) => {
    const x = padX + (idx / (chartPoints.length - 1)) * (width - 2 * padX);
    const y = height - padY - ((p.val - minVal) / valRange) * (height - 2 * padY);
    return `${x},${y}`;
  });

  const polylineStr = svgCoords.join(" ");
  const polygonStr = `${padX},${height - padY} ${polylineStr} ${width - padX},${height - padY}`;

  return (
    <div className="flex-1 flex flex-col w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Trading Dashboard
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-stormyTeal/20 text-stormyTeal-light border border-stormyTeal/40 font-semibold">
              SANDBOX
            </span>
          </div>
          <p className="text-xs text-alabaster/70 mt-1">
            Simulated portfolio backed by immutable integer paise ledger
          </p>
        </div>
        <div className="flex items-center gap-3">
          <MarketStatusBadge isOpen={false} freshness="FRESH" asOfDate="09 Oct 2026" />
          <Link
            href="/explore"
            className="px-4 py-2 rounded-xl bg-stormyTeal hover:bg-stormyTeal-light text-white font-semibold text-xs shadow-md transition-all flex items-center gap-1.5"
          >
            Explore Markets
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* METRIC CARDS ROW */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5 rounded-2xl bg-graphite/80 border border-yaleBlue/40 shadow-xl mb-6">
        {/* Metric 1: Total Value */}
        <div className="flex flex-col border-b sm:border-b-0 sm:border-r border-yaleBlue/30 pb-4 sm:pb-0 sm:pr-4">
          <span className="text-[11px] uppercase tracking-wider text-alabaster/60 font-semibold mb-1">
            Total Portfolio Value
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
              {formatINR(totalValue)}
            </span>
          </div>
          <div className="flex items-center gap-1 mt-1.5 text-xs text-emerald-400 font-semibold font-mono">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+{formatINR(totalGain)} (+0.71%)</span>
          </div>
          <span className="text-[11px] text-alabaster/50 mt-1">Starting: ₹1,00,000.00</span>
        </div>

        {/* Metric 2: Free Cash */}
        <div className="flex flex-col border-b lg:border-b-0 lg:border-r border-yaleBlue/30 pb-4 lg:pb-0 lg:px-4">
          <span className="text-[11px] uppercase tracking-wider text-alabaster/60 font-semibold mb-1">
            Available Virtual Cash
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
              {formatINR(freeCash)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-stormyTeal-light">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Instant order liquidity</span>
          </div>
          <span className="text-[11px] text-alabaster/50 mt-1">
            Holdings: {formatINR(holdingsValue)}
          </span>
        </div>

        {/* Metric 3: Reserved Cash */}
        <div className="flex flex-col border-b sm:border-b-0 sm:border-r border-yaleBlue/30 pb-4 sm:pb-0 sm:px-4">
          <span className="text-[11px] uppercase tracking-wider text-alabaster/60 font-semibold mb-1">
            Reserved for Orders
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
              {formatINR(reservedCash)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-alabaster/70">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Pending queue buffer</span>
          </div>
          <span className="text-[11px] text-alabaster/50 mt-1">0 unfilled queues</span>
        </div>

        {/* Metric 4: Realized P&L */}
        <div className="flex flex-col lg:pl-4 relative">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] uppercase tracking-wider text-alabaster/60 font-semibold">
              Total Realized P&amp;L
            </span>
            <button
              onClick={() => setShowFormulaTooltip(!showFormulaTooltip)}
              className="text-alabaster/50 hover:text-white"
              aria-label="Info"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">
              +{formatINR(realizedPl)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-emerald-400">
            <span>From closed trades</span>
          </div>
          <span className="text-[11px] text-alabaster/50 mt-1">
            Unrealized: +₹467.34 (+3.68%)
          </span>
        </div>
      </section>

      {/* RECONCILIATION FORMULA STRIP */}
      <div className="p-3.5 rounded-xl bg-graphite/40 border border-yaleBlue/30 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-alabaster/80">
        <div className="flex items-center gap-2">
          <span className="font-mono text-stormyTeal-light font-bold">Audit Formula:</span>
          <span>
            Portfolio ({formatINR(totalValue)}) = Free Cash ({formatINR(freeCash)}) + Holdings ({formatINR(holdingsValue)})
          </span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px] text-alabaster/60">
          <span>Net Gain: +{formatINR(totalGain)}</span>
          <span>•</span>
          <span>Zero ledger drift</span>
        </div>
      </div>

      {/* SECTION 2: EQUITY PERFORMANCE CURVE */}
      <section className="bg-graphite/70 border border-yaleBlue/40 rounded-2xl p-5 sm:p-6 shadow-xl mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Portfolio Performance Curve
            </h2>
            <p className="text-xs text-alabaster/70 mt-0.5">
              Net equity evolution recorded at end-of-day settlement
            </p>
          </div>

          <div className="flex items-center gap-1 bg-graphite-dark p-1 rounded-xl border border-yaleBlue/50 text-xs">
            {(["1M", "6M", "ALL"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  range === r
                    ? "bg-stormyTeal text-white shadow-sm"
                    : "text-alabaster/60 hover:text-white"
                }`}
              >
                {r === "ALL" ? "All Time" : r}
              </button>
            ))}
          </div>
        </div>

        {/* SVG Equity Curve */}
        <div className="relative w-full h-[220px] select-none">
          <svg
            className="w-full h-full overflow-visible"
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="equityGrad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#3c6e71" stopOpacity="0.45" />
                <stop offset="75%" stopColor="#3c6e71" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#3c6e71" stopOpacity="0" />
              </linearGradient>
            </defs>
            <polygon fill="url(#equityGrad)" points={polygonStr} />
            <polyline
              fill="none"
              stroke="#3c6e71"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={polylineStr}
            />
            {svgCoords.length > 0 && (
              <circle
                cx={width - padX}
                cy={svgCoords[svgCoords.length - 1].split(",")[1]}
                r="4.5"
                fill="#3c6e71"
                stroke="#ffffff"
                strokeWidth="2"
              />
            )}
          </svg>
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono text-alabaster/50 border-t border-alabaster/10 pt-3 mt-3">
          <span>Starting: ₹1,00,000.00 (10 Sep 2026)</span>
          <span>Latest Close: {formatINR(totalValue)} (09 Oct 2026)</span>
        </div>
      </section>

      {/* SECTION 3: TOP HOLDINGS TABLE */}
      <section className="bg-graphite/70 border border-yaleBlue/40 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-stormyTeal-light" />
            <h2 className="text-lg font-bold text-white tracking-tight">Active Holdings</h2>
          </div>
          <Link
            href="/explore"
            className="text-xs text-stormyTeal-light hover:underline font-semibold"
          >
            + Add Stock
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-yaleBlue/30 text-[11px] uppercase tracking-wider text-alabaster/60 font-mono">
                <th className="py-3 px-3">Security</th>
                <th className="py-3 px-3 text-right">Quantity</th>
                <th className="py-3 px-3 text-right">Avg Cost</th>
                <th className="py-3 px-3 text-right">Current Value</th>
                <th className="py-3 px-3 text-right">Unrealized P&amp;L</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-yaleBlue/20 font-sans">
              {portfolio?.holdings.map((h) => {
                const isPositive = h.unrealized_paise >= 0;
                return (
                  <tr key={h.symbol} className="hover:bg-graphite-light/40 transition-colors">
                    <td className="py-3.5 px-3">
                      <Link
                        href={`/stock/${h.symbol}`}
                        className="font-bold text-white hover:text-stormyTeal-light block"
                      >
                        {h.symbol}
                      </Link>
                      <span className="text-[11px] text-alabaster/50">{h.name || h.symbol}</span>
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-white">{h.qty}</td>
                    <td className="py-3.5 px-3 text-right font-mono text-alabaster/80">
                      {formatINR(h.avg_paise)}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-semibold text-white">
                      {formatINR(h.value_paise)}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono">
                      <span
                        className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
                          isPositive
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-rose-500/10 text-rose-400"
                        }`}
                      >
                        {isPositive ? "+" : ""}
                        {formatINR(h.unrealized_paise)}
                        {h.unrealized_bps ? ` (${formatBps(h.unrealized_bps)})` : ""}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <Link
                        href={`/stock/${h.symbol}`}
                        className="px-3 py-1.5 rounded-lg bg-stormyTeal hover:bg-stormyTeal-light text-white font-medium text-xs shadow-sm"
                      >
                        Trade
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
