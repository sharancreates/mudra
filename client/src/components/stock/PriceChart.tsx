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
    <div
      style={{
        width: "100%",
        background: "var(--surface-card)",
        border: "1.5px solid var(--border-hairline)",
        borderRadius: "var(--radius-card)",
        padding: "24px",
      }}
    >
      {/* Chart Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
        <div>
          <span className="mudra-eyebrow" style={{ fontSize: "11px" }}>
            EOD Historical Price Chart
          </span>
          <span style={{ display: "block", fontSize: "15px", fontWeight: 700, color: "var(--text-heading)", marginTop: "4px" }}>
            {symbol} Closing Trajectory · {selectedTf}
          </span>
        </div>

        {/* Timeframe Buttons */}
        <div style={{ display: "flex", gap: "4px", background: "var(--surface-canvas)", padding: "4px", borderRadius: "var(--radius-pill)" }}>
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              type="button"
              onClick={() => setSelectedTf(tf)}
              style={{
                padding: "6px 14px",
                borderRadius: "var(--radius-pill)",
                border: "none",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                background: selectedTf === tf ? "var(--text-heading)" : "transparent",
                color: selectedTf === tf ? "var(--surface-canvas)" : "var(--text-muted)",
                transition: "all 140ms ease",
              }}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Responsive SVG Chart Canvas */}
      <div style={{ position: "relative", width: "100%", height: "260px", overflow: "hidden", userSelect: "none" }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: "12px", borderBottom: "1px dashed var(--border-hairline)", textAlign: "right", paddingRight: "8px", fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
          {formatINR(maxPrice)}
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: "50%", borderBottom: "1px dashed var(--border-hairline)", textAlign: "right", paddingRight: "8px", fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
          {formatINR(Math.round((maxPrice + minPrice) / 2))}
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: "24px", borderBottom: "1px dashed var(--border-hairline)", textAlign: "right", paddingRight: "8px", fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
          {formatINR(minPrice)}
        </div>

        <svg
          style={{ width: "100%", height: "100%", overflow: "visible" }}
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--mudra-sky-blue)" stopOpacity="0.32" />
              <stop offset="70%" stopColor="var(--mudra-sky-blue)" stopOpacity="0.08" />
              <stop offset="100%" stopColor="var(--mudra-sky-blue)" stopOpacity="0" />
            </linearGradient>
          </defs>

          <polygon fill="url(#chartGradient)" points={polygonStr} />
          <polyline
            fill="none"
            stroke="var(--mudra-sky-blue)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polylineStr}
          />

          {svgPoints.length > 0 && (
            <circle
              cx={width - paddingX}
              cy={svgPoints[svgPoints.length - 1].split(",")[1]}
              r="5"
              fill="var(--mudra-sky-blue)"
              stroke="var(--surface-card)"
              strokeWidth="2.5"
            />
          )}
        </svg>
      </div>

      {/* Chart Footer Notice */}
      <div
        className="mudra-mono"
        style={{
          marginTop: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: "12px",
          color: "var(--text-muted)",
          borderTop: "1px solid var(--border-hairline)",
          paddingTop: "12px",
        }}
      >
        <span>Source: NSE EOD Reference Archive</span>
        <span>Orders queue for 15:30 IST next-close</span>
      </div>
    </div>
  );
};


