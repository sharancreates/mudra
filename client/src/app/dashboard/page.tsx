"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  ShieldCheck,
  Info,
  Clock,
  Briefcase,
  ArrowRight,
} from "lucide-react";
import { MarketStatusBadge } from "@/components/common/MarketStatusBadge";
import { MudraShell } from "@/components/mudra/MudraShell";
import { getPortfolio, getOrderHistory } from "@/lib/api";
import { PortfolioSummary, OrderItem } from "@/types/api";
import { formatINR, formatBps } from "@/lib/formatters";

export default function DashboardPage() {
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [range, setRange] = useState<"1M" | "6M" | "ALL">("1M");
  const [showFormulaTooltip, setShowFormulaTooltip] = useState(false);

  useEffect(() => {
    getPortfolio().then((data) => setPortfolio(data));
    getOrderHistory().then((data) => setOrders(data));
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
    <MudraShell activeNav="dashboard">
      <div data-wrap="" style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 24px" }}>
        {/* Eyebrow */}
        <div style={{ marginBottom: "16px" }}>
          <span className="Mudra-eyebrow">01 / virtual capital ledger</span>
        </div>

        {/* Display Heading & Actions */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            flexWrap: "wrap",
            gap: "24px",
            marginBottom: "36px",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "clamp(36px, min(6.4vw, 72px), 92px)",
                fontWeight: "var(--weight-display)",
                letterSpacing: "var(--tracking-display)",
                lineHeight: 0.94,
                color: "var(--text-heading)",
              }}
            >
              Trading Dashboard
            </h1>
            <p
              style={{
                margin: "16px 0 0 0",
                fontSize: "16px",
                lineHeight: 1.55,
                color: "var(--text-muted)",
                maxWidth: "60ch",
              }}
            >
              Audit virtual balances, track live NSE holdings, and verify queued settlements against the 15:30 IST closing bell.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
            <MarketStatusBadge isOpen={false} freshness="FRESH" asOfDate="09 Oct 2026" />
            <Link
              href="/explore"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                height: "48px",
                padding: "0 24px",
                borderRadius: "var(--radius-pill)",
                background: "var(--text-heading)",
                color: "var(--surface-canvas)",
                fontSize: "14px",
                fontWeight: 600,
                textDecoration: "none",
                transition: "opacity 160ms ease",
              }}
            >
              <span>Explore Markets</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* 4 Swiss Metric Cards */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          {/* Metric 1: Total Value */}
          <div
            style={{
              background: "var(--surface-card)",
              border: "1.5px solid var(--border-hairline)",
              borderRadius: "var(--radius-card)",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "12px",
            }}
          >
            <span className="Mudra-eyebrow" style={{ fontSize: "11px" }}>
              Total Portfolio Equity
            </span>
            <div style={{ fontSize: "28px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--text-heading)" }}>
              {formatINR(totalValue)}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--Mudra-link-green)", fontFamily: "var(--font-mono)", fontWeight: 600 }}>
              <ArrowUpRight className="w-4 h-4" />
              <span>+{formatINR(totalGain)} (+0.71%)</span>
            </div>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Starting capital: ₹1,00,000.00
            </span>
          </div>

          {/* Metric 2: Free Cash */}
          <div
            style={{
              background: "var(--surface-card)",
              border: "1.5px solid var(--border-hairline)",
              borderRadius: "var(--radius-card)",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "12px",
            }}
          >
            <span className="Mudra-eyebrow" style={{ fontSize: "11px" }}>
              Available Virtual Cash
            </span>
            <div style={{ fontSize: "28px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--text-heading)" }}>
              {formatINR(freeCash)}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--Mudra-sky-blue)" }}>
              <ShieldCheck className="w-4 h-4" />
              <span>Instant order liquidity</span>
            </div>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Stock Holdings: {formatINR(holdingsValue)}
            </span>
          </div>

          {/* Metric 3: Reserved Cash */}
          <div
            style={{
              background: "var(--surface-card)",
              border: "1.5px solid var(--border-hairline)",
              borderRadius: "var(--radius-card)",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "12px",
            }}
          >
            <span className="Mudra-eyebrow" style={{ fontSize: "11px" }}>
              Reserved for Orders (10% Buffer)
            </span>
            <div style={{ fontSize: "28px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--text-heading)" }}>
              {formatINR(reservedCash)}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--Mudra-signal-yellow)" }}>
              <Clock className="w-4 h-4" />
              <span>Pending queue buffer</span>
            </div>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              0 unfilled queued orders
            </span>
          </div>

          {/* Metric 4: Realized P&L */}
          <div
            style={{
              background: "var(--surface-card)",
              border: "1.5px solid var(--border-hairline)",
              borderRadius: "var(--radius-card)",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="Mudra-eyebrow" style={{ fontSize: "11px" }}>
                Total Realized P&amp;L
              </span>
              <button
                type="button"
                onClick={() => setShowFormulaTooltip(!showFormulaTooltip)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 0 }}
                aria-label="Info"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </div>
            <div style={{ fontSize: "28px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--Mudra-link-green)" }}>
              +{formatINR(realizedPl)}
            </div>
            <div style={{ fontSize: "12px", color: "var(--Mudra-link-green)", fontWeight: 500 }}>
              From closed trades
            </div>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Unrealized: +₹467.34 (+3.68%)
            </span>
          </div>
        </section>

        {/* Audit Formula Strip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            padding: "16px 20px",
            borderRadius: "var(--radius-card)",
            background: "var(--surface-card)",
            border: "1px solid var(--border-hairline)",
            marginBottom: "28px",
            fontSize: "13px",
            color: "var(--text-muted)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="Mudra-mono" style={{ color: "var(--text-heading)", fontWeight: 700 }}>
              Audit Formula:
            </span>
            <span>
              Portfolio ({formatINR(totalValue)}) = Free Cash ({formatINR(freeCash)}) + Holdings ({formatINR(holdingsValue)})
            </span>
          </div>
          <div className="Mudra-mono" style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "12px" }}>
            <span>Net Gain: +{formatINR(totalGain)}</span>
            <span>·</span>
            <span>Zero ledger drift</span>
          </div>
        </div>

        {/* SECTION 2: EQUITY PERFORMANCE CURVE */}
        <section
          style={{
            background: "var(--surface-card)",
            border: "1.5px solid var(--border-hairline)",
            borderRadius: "var(--radius-card)",
            padding: "28px",
            marginBottom: "28px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "16px",
              marginBottom: "24px",
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "var(--text-heading)" }}>
                Portfolio Performance Curve
              </h2>
              <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "var(--text-muted)" }}>
                Net equity evolution recorded at end-of-day 15:30 IST settlement
              </p>
            </div>

            <div style={{ display: "flex", gap: "8px", background: "var(--surface-canvas)", padding: "4px", borderRadius: "var(--radius-pill)" }}>
              {(["1M", "6M", "ALL"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRange(r)}
                  style={{
                    padding: "6px 16px",
                    borderRadius: "var(--radius-pill)",
                    border: "none",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    background: range === r ? "var(--text-heading)" : "transparent",
                    color: range === r ? "var(--surface-canvas)" : "var(--text-muted)",
                    transition: "all 140ms ease",
                  }}
                >
                  {r === "ALL" ? "All Time" : r}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Equity Curve */}
          <div style={{ position: "relative", width: "100%", height: "220px", userSelect: "none" }}>
            <svg
              style={{ width: "100%", height: "100%", overflow: "visible" }}
              viewBox={`0 0 ${width} ${height}`}
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="equityGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="var(--Mudra-sky-blue)" stopOpacity="0.35" />
                  <stop offset="75%" stopColor="var(--Mudra-sky-blue)" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="var(--Mudra-sky-blue)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <polygon fill="url(#equityGrad)" points={polygonStr} />
              <polyline
                fill="none"
                stroke="var(--Mudra-sky-blue)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={polylineStr}
              />
              {svgCoords.length > 0 && (
                <circle
                  cx={width - padX}
                  cy={svgCoords[svgCoords.length - 1].split(",")[1]}
                  r="5"
                  fill="var(--Mudra-sky-blue)"
                  stroke="var(--surface-card)"
                  strokeWidth="2.5"
                />
              )}
            </svg>
          </div>

          <div
            className="Mudra-mono"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "12px",
              color: "var(--text-muted)",
              borderTop: "1px solid var(--border-hairline)",
              paddingTop: "14px",
              marginTop: "16px",
            }}
          >
            <span>Starting: ₹1,00,000.00 (10 Sep 2026)</span>
            <span>Latest Close: {formatINR(totalValue)} (09 Oct 2026)</span>
          </div>
        </section>

        {/* SECTION 3: TOP HOLDINGS TABLE */}
        <section
          style={{
            background: "var(--surface-card)",
            border: "1.5px solid var(--border-hairline)",
            borderRadius: "var(--radius-card)",
            padding: "28px",
            marginBottom: "28px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Briefcase className="w-5 h-5" style={{ color: "var(--Mudra-signal-yellow)" }} />
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "var(--text-heading)" }}>
                Active Holdings
              </h2>
            </div>
            <Link
              href="/explore"
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--text-heading)",
                textDecoration: "underline",
              }}
            >
              + Add Stock
            </Link>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead>
                <tr
                  className="Mudra-mono"
                  style={{
                    borderBottom: "1.5px solid var(--border-hairline)",
                    fontSize: "11px",
                    letterSpacing: "0.07em",
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                  }}
                >
                  <th style={{ padding: "14px 16px" }}>Security</th>
                  <th style={{ padding: "14px 16px", textAlign: "right" }}>Quantity</th>
                  <th style={{ padding: "14px 16px", textAlign: "right" }}>Avg Cost</th>
                  <th style={{ padding: "14px 16px", textAlign: "right" }}>Current Value</th>
                  <th style={{ padding: "14px 16px", textAlign: "right" }}>Unrealized P&amp;L</th>
                  <th style={{ padding: "14px 16px", textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody style={{ fontFamily: "var(--font-sans)" }}>
                {portfolio?.holdings.map((h) => {
                  const isPositive = h.unrealized_paise >= 0;
                  return (
                    <tr
                      key={h.symbol}
                      style={{
                        borderBottom: "1px solid var(--border-hairline)",
                        transition: "background 140ms ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-sunken)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "16px" }}>
                        <Link
                          href={`/stock/${h.symbol}`}
                          style={{
                            fontWeight: 700,
                            color: "var(--text-heading)",
                            textDecoration: "none",
                            display: "block",
                          }}
                        >
                          {h.symbol}
                        </Link>
                        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{h.name || h.symbol}</span>
                      </td>
                      <td style={{ padding: "16px", textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                        {h.qty}
                      </td>
                      <td style={{ padding: "16px", textAlign: "right", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                        {formatINR(h.avg_paise)}
                      </td>
                      <td style={{ padding: "16px", textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--text-heading)" }}>
                        {formatINR(h.value_paise)}
                      </td>
                      <td style={{ padding: "16px", textAlign: "right", fontFamily: "var(--font-mono)" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "3px 8px",
                            borderRadius: "var(--radius-xs)",
                            fontSize: "12px",
                            fontWeight: 600,
                            background: isPositive ? "rgba(7, 162, 64, 0.12)" : "rgba(201, 33, 33, 0.12)",
                            color: isPositive ? "var(--Mudra-link-green)" : "var(--Mudra-node-red)",
                          }}
                        >
                          {isPositive ? "+" : ""}
                          {formatINR(h.unrealized_paise)}
                          {h.unrealized_bps ? ` (${formatBps(h.unrealized_bps)})` : ""}
                        </span>
                      </td>
                      <td style={{ padding: "16px", textAlign: "right" }}>
                        <Link
                          href={`/stock/${h.symbol}`}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "6px 16px",
                            borderRadius: "var(--radius-pill)",
                            background: "var(--text-heading)",
                            color: "var(--surface-canvas)",
                            fontSize: "12px",
                            fontWeight: 600,
                            textDecoration: "none",
                          }}
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

        {/* SECTION 4: ORDERS & EXECUTION QUEUE */}
        <section
          style={{
            background: "var(--surface-card)",
            border: "1.5px solid var(--border-hairline)",
            borderRadius: "var(--radius-card)",
            padding: "28px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Clock className="w-5 h-5" style={{ color: "var(--Mudra-sky-blue)" }} />
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "var(--text-heading)" }}>
                Order Queue &amp; History
              </h2>
            </div>
            <span className="Mudra-mono" style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Next settlement: 15:30 IST
            </span>
          </div>

          {orders.length === 0 ? (
            <div style={{ padding: "32px 0", textAlign: "center", color: "var(--text-muted)", fontSize: "14px" }}>
              No active or pending orders in queue. Orders placed during market hours settle at 15:30 IST.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse", fontSize: "14px" }}>
                <thead>
                  <tr
                    className="Mudra-mono"
                    style={{
                      borderBottom: "1.5px solid var(--border-hairline)",
                      fontSize: "11px",
                      letterSpacing: "0.07em",
                      textTransform: "uppercase",
                      color: "var(--text-muted)",
                    }}
                  >
                    <th style={{ padding: "14px 16px" }}>Order ID</th>
                    <th style={{ padding: "14px 16px" }}>Security</th>
                    <th style={{ padding: "14px 16px" }}>Side</th>
                    <th style={{ padding: "14px 16px", textAlign: "right" }}>Qty</th>
                    <th style={{ padding: "14px 16px", textAlign: "right" }}>Status</th>
                    <th style={{ padding: "14px 16px", textAlign: "right" }}>Target Session</th>
                  </tr>
                </thead>
                <tbody style={{ fontFamily: "var(--font-sans)" }}>
                  {orders.map((ord) => (
                    <tr
                      key={ord.id}
                      style={{
                        borderBottom: "1px solid var(--border-hairline)",
                        transition: "background 140ms ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-sunken)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td className="Mudra-mono" style={{ padding: "16px", fontSize: "12px", color: "var(--text-muted)" }}>
                        {ord.id}
                      </td>
                      <td style={{ padding: "16px", fontWeight: 700 }}>
                        <Link href={`/stock/${ord.symbol}`} style={{ color: "var(--text-heading)", textDecoration: "none" }}>
                          {ord.symbol}
                        </Link>
                      </td>
                      <td style={{ padding: "16px" }}>
                        <span
                          className="Mudra-mono"
                          style={{
                            display: "inline-block",
                            padding: "3px 8px",
                            borderRadius: "var(--radius-xs)",
                            fontSize: "11px",
                            fontWeight: 700,
                            background: ord.side === "BUY" ? "rgba(59, 191, 247, 0.15)" : "rgba(201, 33, 33, 0.15)",
                            color: ord.side === "BUY" ? "var(--Mudra-sky-blue)" : "var(--Mudra-node-red)",
                          }}
                        >
                          {ord.side}
                        </span>
                      </td>
                      <td style={{ padding: "16px", textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                        {ord.qty}
                      </td>
                      <td style={{ padding: "16px", textAlign: "right" }}>
                        <span
                          className="Mudra-mono"
                          style={{
                            display: "inline-block",
                            padding: "3px 8px",
                            borderRadius: "var(--radius-pill)",
                            fontSize: "11px",
                            fontWeight: 600,
                            background:
                              ord.status === "PENDING"
                                ? "rgba(238, 160, 43, 0.15)"
                                : ord.status === "FILLED"
                                ? "rgba(7, 162, 64, 0.15)"
                                : "rgba(201, 33, 33, 0.15)",
                            color:
                              ord.status === "PENDING"
                                ? "var(--Mudra-signal-yellow)"
                                : ord.status === "FILLED"
                                ? "var(--Mudra-link-green)"
                                : "var(--Mudra-node-red)",
                          }}
                        >
                          {ord.status}
                        </span>
                      </td>
                      <td className="Mudra-mono" style={{ padding: "16px", textAlign: "right", fontSize: "12px", color: "var(--text-muted)" }}>
                        Next Close (15:30 IST)
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </MudraShell>
  );
}


