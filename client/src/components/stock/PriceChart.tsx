"use client";

import React, { useState } from "react";
import { formatINR } from "@/lib/formatters";

interface PriceChartProps {
  symbol: string;
  currentClosePaise: number;
}

const TIMEFRAMES = ["1D", "1W", "1M", "6M", "1Y"] as const;
type Timeframe = (typeof TIMEFRAMES)[number];

export const PriceChart: React.FC<PriceChartProps> = ({
  symbol,
  currentClosePaise,
}) => {
  const [selectedTf, setSelectedTf] = useState<Timeframe>("1M");

  // Synthetic price points tailored to stock reference close
  const points = React.useMemo(() => {
    const base = currentClosePaise;
    const offsets = {
      "1D": [-1.2, -0.8, -0.4, 0.2, 0.6, 0.4, 0.9, 1.2, 1.39],
      "1W": [-2.5, -1.8, -0.5, 0.3, -0.2, 0.8, 1.39],
      "1M": [-5.4, -4.2, -2.8, -1.5, -0.8, 1.2, 0.4, 2.1, 1.39],
      "6M": [-12.0, -9.5, -4.0, 2.0, 6.5, 3.2, 8.4, 11.2, 14.5],
      "1Y": [-18.0, -12.0, -6.5, 1.0, 8.5, 14.0, 18.5, 22.0, 26.4],
    }[selectedTf];

    return offsets.map((pct, idx) => ({
      step: idx,
      price: Math.round(base * (1 + pct / 100)),
    }));
  }, [currentClosePaise, selectedTf]);

  const minPrice = Math.min(...points.map((p) => p.price));
  const maxPrice = Math.max(...points.map((p) => p.price));
  const range = maxPrice - minPrice || 1;

  // SVG coordinate calculations
  const width = 800;
  const height = 280;
  const paddingX = 40;
  const paddingY = 30;

  const svgPoints = points.map((p, idx) => {
    const x = paddingX + (idx / (points.length - 1)) * (width - 2 * paddingX);
    const y = height - paddingY - ((p.price - minPrice) / range) * (height - 2 * paddingY);
    return `${x},${y}`;
  });

  const polylineStr = svgPoints.join(" ");
  const polygonStr = `${paddingX},${height - paddingY} ${polylineStr} ${width - paddingX},${height - paddingY}`;

  return (
    <div className="w-full bg-graphite/70 border border-yaleBlue/40 rounded-2xl p-4 sm:p-6 shadow-xl">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <span className="text-xs uppercase font-mono tracking-wider text-alabaster/60">
            Interactive Price Chart
          </span>
          <span className="text-xs text-white font-medium block mt-0.5">
            {symbol} Closing History • Timeframe: {selectedTf}
          </span>
        </div>

        {/* Timeframe Buttons */}
        <div className="flex items-center gap-1 bg-graphite-dark p-1 rounded-xl border border-yaleBlue/50 text-xs">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              onClick={() => setSelectedTf(tf)}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                selectedTf === tf
                  ? "bg-stormyTeal text-white shadow-sm"
                  : "text-alabaster/60 hover:text-white hover:bg-yaleBlue/30"
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Responsive SVG Chart Canvas */}
      <div className="relative w-full h-[260px] sm:h-[300px] overflow-hidden select-none">
        {/* Horizontal reference gridlines */}
        <div className="absolute inset-x-0 top-4 border-b border-yaleBlue/20 flex justify-end pr-2 text-[10px] font-mono text-alabaster/40">
          {formatINR(maxPrice)}
        </div>
        <div className="absolute inset-x-0 top-1/2 border-b border-yaleBlue/20 flex justify-end pr-2 text-[10px] font-mono text-alabaster/40">
          {formatINR(Math.round((maxPrice + minPrice) / 2))}
        </div>
        <div className="absolute inset-x-0 bottom-6 border-b border-yaleBlue/20 flex justify-end pr-2 text-[10px] font-mono text-alabaster/40">
          {formatINR(minPrice)}
        </div>

        <svg
          className="w-full h-full overflow-visible"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3c6e71" stopOpacity="0.4" />
              <stop offset="70%" stopColor="#3c6e71" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#3c6e71" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Area fill */}
          <polygon fill="url(#chartGradient)" points={polygonStr} />

          {/* Price line */}
          <polyline
            fill="none"
            stroke="#3c6e71"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polylineStr}
          />

          {/* Latest point circle */}
          {svgPoints.length > 0 && (
            <circle
              cx={width - paddingX}
              cy={svgPoints[svgPoints.length - 1].split(",")[1]}
              r="4.5"
              fill="#3c6e71"
              stroke="#ffffff"
              strokeWidth="2"
            />
          )}
        </svg>
      </div>

      {/* Chart Footer Notice */}
      <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-alabaster/50 border-t border-alabaster/10 pt-3">
        <span>Source: EOD Reference Archive</span>
        <span>Next execution executes at official 15:30 IST close</span>
      </div>
    </div>
  );
};
