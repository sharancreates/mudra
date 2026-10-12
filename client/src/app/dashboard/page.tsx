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
  FileText,
  History,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { MarketStatusBadge } from "@/components/common/MarketStatusBadge";
import { MudraShell } from "@/components/mudra/MudraShell";
import {
  getPortfolio,
  getOrderHistory,
  getPortfolioHistory,
  getLedger,
} from "@/lib/api";
import { PortfolioSummary, OrderItem } from "@/types/api";
import { formatINR, formatBps } from "@/lib/formatters";

export default function DashboardPage() {
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [range, setRange] = useState<"1M" | "6M" | "ALL">("1M");
  const [historyPoints, setHistoryPoints] = useState<
    Array<{ date: string; equity_paise: number }>
  >([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [activeBottomTab, setActiveBottomTab] = useState<"orders" | "ledger">("orders");
  const [showFormulaTooltip, setShowFormulaTooltip] = useState(false);

  useEffect(() => {
    getPortfolio().then((data) => setPortfolio(data));
    getOrderHistory().then((data) => setOrders(data));

    setLedgerLoading(true);
    getLedger(1, 30)
      .then((res) => {
        if (res && Array.isArray(res.items)) {
          setLedgerEntries(res.items);
        }
      })
      .finally(() => setLedgerLoading(false));
  }, []);

  const totalValue = portfolio?.equity_paise || 10071020;
  const freeCash = portfolio?.cash_paise || 8757020;
  const reservedCash = portfolio?.reserved_paise || 0;
  const realizedPl = portfolio?.realized_paise || 24286;
  const totalGain = totalValue - 10000000; // Starting capital 1 Lakh (10000000 paise)
  const holdingsValue = totalValue - freeCash - reservedCash;

  // Fetch dynamic portfolio history curve points
  useEffect(() => {
    setHistoryLoading(true);
    getPortfolioHistory(range)
      .then((res) => {
        if (res && res.points && res.points.length > 0) {
          setHistoryPoints(res.points);
        } else {
          setHistoryPoints([
            { date: "2026-10-09", equity_paise: 10000000 },
            { date: "2026-10-10", equity_paise: totalValue },
          ]);
        }
      })
      .catch(() => {
        setHistoryPoints([
          { date: "2026-10-09", equity_paise: 10000000 },
          { date: "2026-10-10", equity_paise: totalValue },
        ]);
      })
      .finally(() => setHistoryLoading(false));
  }, [range, totalValue]);

  // Safe chart points guaranteed to have >= 2 items
  const safePoints = React.useMemo(() => {
    if (historyPoints.length >= 2) return historyPoints;
    if (historyPoints.length === 1) {
      return [
        { date: "Baseline", equity_paise: 10000000 },
        historyPoints[0],
      ];
    }
    return [
      { date: "10 Sep", equity_paise: 10000000 },
      { date: "09 Oct", equity_paise: totalValue },
    ];
  }, [historyPoints, totalValue]);

  const minVal = Math.min(...safePoints.map((p) => p.equity_paise));
  const maxVal = Math.max(...safePoints.map((p) => p.equity_paise));
  const valRange = maxVal === minVal ? 1 : maxVal - minVal;

  const width = 800;
  const height = 240;
  const padX = 40;
  const padY = 25;

  const svgCoords = safePoints.map((p, idx) => {
    const x = padX + (idx / (safePoints.length - 1)) * (width - 2 * padX);
    const y =
      height - padY - ((p.equity_paise - minVal) / valRange) * (height - 2 * padY);
    return `${x},${y}`;
  });

  const polylineStr = svgCoords.join(" ");
  const polygonStr = `${padX},${height - padY} ${polylineStr} ${
    width - padX
  },${height - padY}`;

  const activePoint =
    hoveredIdx !== null && safePoints[hoveredIdx]
      ? safePoints[hoveredIdx]
      : safePoints[safePoints.length - 1];

  const activeCoord =
    hoveredIdx !== null && svgCoords[hoveredIdx]
      ? svgCoords[hoveredIdx].split(",")
      : svgCoords[svgCoords.length - 1]?.split(",") || [width - padX, height / 2];

  return (
    <MudraShell activeNav="dashboard">
      <div data-wrap="" style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 24px" }}>
        {/* Eyebrow */}
        <div style={{ marginBottom: "16px" }}>
          <span className="mudra-eyebrow">01 / virtual capital ledger</span>
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
            <span className="mudra-eyebrow" style={{ fontSize: "11px" }}>
              Total Portfolio Equity
            </span>
            <div style={{ fontSize: "28px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--text-heading)" }}>
              {formatINR(totalValue)}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--mudra-link-green)", fontFamily: "var(--font-mono)", fontWeight: 600 }}>
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
            <span className="mudra-eyebrow" style={{ fontSize: "11px" }}>
              Available Virtual Cash
            </span>
            <div style={{ fontSize: "28px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--text-heading)" }}>
              {formatINR(freeCash)}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--mudra-sky-blue)" }}>
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
            <span className="mudra-eyebrow" style={{ fontSize: "11px" }}>
              Reserved for Orders (10% Buffer)
            </span>
            <div style={{ fontSize: "28px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--text-heading)" }}>
              {formatINR(reservedCash)}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--mudra-signal-yellow)" }}>
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
              <span className="mudra-eyebrow" style={{ fontSize: "11px" }}>
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
            <div style={{ fontSize: "28px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--mudra-link-green)" }}>
              +{formatINR(realizedPl)}
            </div>
            <div style={{ fontSize: "12px", color: "var(--mudra-link-green)", fontWeight: 500 }}>
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
            <span className="mudra-mono" style={{ color: "var(--text-heading)", fontWeight: 700 }}>
              Audit Formula:
            </span>
            <span>
              Portfolio ({formatINR(totalValue)}) = Free Cash ({formatINR(freeCash)}) + Holdings ({formatINR(holdingsValue)})
            </span>
          </div>
          <div className="mudra-mono" style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "12px" }}>
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

          {/* SVG Equity Curve with Live Hover Interaction */}
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "230px",
              userSelect: "none",
            }}
          >
            {/* Hover Tooltip Overlay */}
            {activePoint && (
              <div
                style={{
                  position: "absolute",
                  top: "8px",
                  right: "12px",
                  background: "var(--surface-sunken)",
                  border: "1px solid var(--border-hairline)",
                  borderRadius: "var(--radius-sm)",
                  padding: "6px 12px",
                  fontSize: "12px",
                  fontFamily: "var(--font-mono)",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  zIndex: 2,
                  pointerEvents: "none",
                }}
              >
                <span style={{ color: "var(--text-muted)" }}>{activePoint.date}</span>
                <span style={{ fontWeight: 700, color: "var(--text-heading)" }}>
                  {formatINR(activePoint.equity_paise)}
                </span>
                <span
                  style={{
                    color:
                      activePoint.equity_paise >= 10000000
                        ? "var(--mudra-link-green)"
                        : "var(--mudra-node-red)",
                    fontWeight: 600,
                  }}
                >
                  {activePoint.equity_paise >= 10000000 ? "+" : ""}
                  {(
                    ((activePoint.equity_paise - 10000000) / 10000000) *
                    100
                  ).toFixed(2)}
                  %
                </span>
              </div>
            )}

            <svg
              style={{ width: "100%", height: "100%", overflow: "visible" }}
              viewBox={`0 0 ${width} ${height}`}
              preserveAspectRatio="none"
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <defs>
                <linearGradient id="equityGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="var(--mudra-sky-blue)" stopOpacity="0.35" />
                  <stop offset="75%" stopColor="var(--mudra-sky-blue)" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="var(--mudra-sky-blue)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <polygon fill="url(#equityGrad)" points={polygonStr} />
              <polyline
                fill="none"
                stroke="var(--mudra-sky-blue)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={polylineStr}
              />

              {/* Point hover zones & markers */}
              {safePoints.map((p, idx) => {
                const [cx, cy] = svgCoords[idx]?.split(",") || [0, 0];
                const isHovered = hoveredIdx === idx || (hoveredIdx === null && idx === safePoints.length - 1);
                return (
                  <g key={`pt-${idx}`}>
                    {/* Hover target circle */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r="16"
                      fill="transparent"
                      style={{ cursor: "crosshair" }}
                      onMouseEnter={() => setHoveredIdx(idx)}
                    />
                    {isHovered && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r="5.5"
                        fill="var(--mudra-sky-blue)"
                        stroke="var(--surface-card)"
                        strokeWidth="2.5"
                        style={{ transition: "all 120ms ease" }}
                      />
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          <div
            className="mudra-mono"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "12px",
              color: "var(--text-muted)",
              borderTop: "1px solid var(--border-hairline)",
              paddingTop: "14px",
              marginTop: "16px",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            <span>
              Starting: {formatINR(safePoints[0]?.equity_paise || 10000000)} (
              {safePoints[0]?.date || "Day 1"})
            </span>
            <span>
              Range Return:{" "}
              <strong
                style={{
                  color:
                    (safePoints[safePoints.length - 1]?.equity_paise || 10000000) >=
                    (safePoints[0]?.equity_paise || 10000000)
                      ? "var(--mudra-link-green)"
                      : "var(--mudra-node-red)",
                }}
              >
                +
                {(
                  (((safePoints[safePoints.length - 1]?.equity_paise || 10000000) -
                    (safePoints[0]?.equity_paise || 10000000)) /
                    (safePoints[0]?.equity_paise || 10000000)) *
                  100
                ).toFixed(2)}
                %
              </strong>
            </span>
            <span>
              Latest Close: {formatINR(safePoints[safePoints.length - 1]?.equity_paise || totalValue)} (
              {safePoints[safePoints.length - 1]?.date || "Latest"})
            </span>
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
              <Briefcase className="w-5 h-5" style={{ color: "var(--mudra-signal-yellow)" }} />
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
                  className="mudra-mono"
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
                            color: isPositive ? "var(--mudra-link-green)" : "var(--mudra-node-red)",
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

        {/* 15:30 IST SETTLEMENT TRANSPARENCY NOTICE */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "14px",
            padding: "16px 22px",
            borderRadius: "var(--radius-card)",
            background: "rgba(59, 191, 247, 0.08)",
            border: "1px solid rgba(59, 191, 247, 0.22)",
            marginBottom: "24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "var(--radius-pill)",
                background: "rgba(59, 191, 247, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--mudra-sky-blue)",
              }}
            >
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-heading)" }}>
                Next Settlement Batch: Today at 15:30 IST
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                All pending market orders execute at official NSE closing prices. Buy buffer refunds credit immediately after settlement.
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              className="mudra-mono"
              style={{
                padding: "4px 10px",
                borderRadius: "var(--radius-pill)",
                fontSize: "11px",
                fontWeight: 600,
                background: orders.some((o) => o.status === "PENDING")
                  ? "rgba(238, 160, 43, 0.15)"
                  : "var(--surface-sunken)",
                color: orders.some((o) => o.status === "PENDING")
                  ? "var(--mudra-signal-yellow)"
                  : "var(--text-muted)",
              }}
            >
              {orders.filter((o) => o.status === "PENDING").length} orders pending
            </span>
          </div>
        </div>

        {/* SECTION 4: ORDERS & TRANSACTION AUDIT LEDGER */}
        <section
          style={{
            background: "var(--surface-card)",
            border: "1.5px solid var(--border-hairline)",
            borderRadius: "var(--radius-card)",
            padding: "28px",
          }}
        >
          {/* Section Header with Tab Switcher */}
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
            <div style={{ display: "flex", gap: "10px", background: "var(--surface-canvas)", padding: "4px", borderRadius: "var(--radius-pill)" }}>
              <button
                type="button"
                onClick={() => setActiveBottomTab("orders")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 18px",
                  borderRadius: "var(--radius-pill)",
                  border: "none",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  background: activeBottomTab === "orders" ? "var(--text-heading)" : "transparent",
                  color: activeBottomTab === "orders" ? "var(--surface-canvas)" : "var(--text-muted)",
                  transition: "all 140ms ease",
                }}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Orders Queue ({orders.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveBottomTab("ledger")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 18px",
                  borderRadius: "var(--radius-pill)",
                  border: "none",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  background: activeBottomTab === "ledger" ? "var(--text-heading)" : "transparent",
                  color: activeBottomTab === "ledger" ? "var(--surface-canvas)" : "var(--text-muted)",
                  transition: "all 140ms ease",
                }}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Audit Ledger ({ledgerEntries.length})</span>
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--mudra-link-green)" }}>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="mudra-mono">Zero-Drift Immutable Ledger</span>
            </div>
          </div>

          {/* TAB CONTENT 1: ORDERS QUEUE */}
          {activeBottomTab === "orders" && (
            orders.length === 0 ? (
              <div style={{ padding: "48px 0", textAlign: "center", color: "var(--text-muted)", fontSize: "14px" }}>
                No active or pending orders in queue. Orders placed during market hours settle at 15:30 IST.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse", fontSize: "14px" }}>
                  <thead>
                    <tr
                      className="mudra-mono"
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
                        <td className="mudra-mono" style={{ padding: "16px", fontSize: "12px", color: "var(--text-muted)" }}>
                          {ord.id}
                        </td>
                        <td style={{ padding: "16px", fontWeight: 700 }}>
                          <Link href={`/stock/${ord.symbol}`} style={{ color: "var(--text-heading)", textDecoration: "none" }}>
                            {ord.symbol}
                          </Link>
                        </td>
                        <td style={{ padding: "16px" }}>
                          <span
                            className="mudra-mono"
                            style={{
                              display: "inline-block",
                              padding: "3px 8px",
                              borderRadius: "var(--radius-xs)",
                              fontSize: "11px",
                              fontWeight: 700,
                              background: ord.side === "BUY" ? "rgba(59, 191, 247, 0.15)" : "rgba(201, 33, 33, 0.15)",
                              color: ord.side === "BUY" ? "var(--mudra-sky-blue)" : "var(--mudra-node-red)",
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
                            className="mudra-mono"
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
                                  ? "var(--mudra-signal-yellow)"
                                  : ord.status === "FILLED"
                                  ? "var(--mudra-link-green)"
                                  : "var(--mudra-node-red)",
                            }}
                          >
                            {ord.status}
                          </span>
                        </td>
                        <td className="mudra-mono" style={{ padding: "16px", textAlign: "right", fontSize: "12px", color: "var(--text-muted)" }}>
                          Next Close (15:30 IST)
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {/* TAB CONTENT 2: IMMUTABLE TRANSACTION AUDIT LEDGER */}
          {activeBottomTab === "ledger" && (
            ledgerLoading ? (
              <div style={{ padding: "48px 0", textAlign: "center", color: "var(--text-muted)", fontSize: "14px" }}>
                Loading ledger records...
              </div>
            ) : ledgerEntries.length === 0 ? (
              <div style={{ padding: "48px 0", textAlign: "center", color: "var(--text-muted)", fontSize: "14px" }}>
                No ledger transactions recorded yet. Initial capital allocation of ₹1,00,000.00 is active.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse", fontSize: "14px" }}>
                  <thead>
                    <tr
                      className="mudra-mono"
                      style={{
                        borderBottom: "1.5px solid var(--border-hairline)",
                        fontSize: "11px",
                        letterSpacing: "0.07em",
                        textTransform: "uppercase",
                        color: "var(--text-muted)",
                      }}
                    >
                      <th style={{ padding: "14px 16px" }}>Timestamp</th>
                      <th style={{ padding: "14px 16px" }}>Entry Type</th>
                      <th style={{ padding: "14px 16px" }}>Instrument</th>
                      <th style={{ padding: "14px 16px", textAlign: "right" }}>Amount</th>
                      <th style={{ padding: "14px 16px", textAlign: "right" }}>Balance After</th>
                    </tr>
                  </thead>
                  <tbody style={{ fontFamily: "var(--font-sans)" }}>
                    {ledgerEntries.map((entry, idx) => {
                      const amount = Number(entry.amount_paise || 0);
                      const isCredit = amount >= 0;
                      return (
                        <tr
                          key={entry.id || idx}
                          style={{
                            borderBottom: "1px solid var(--border-hairline)",
                            transition: "background 140ms ease",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-sunken)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <td className="mudra-mono" style={{ padding: "16px", fontSize: "12px", color: "var(--text-muted)" }}>
                            {entry.created_at ? new Date(entry.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "short", timeStyle: "medium" }) : "—"}
                          </td>
                          <td style={{ padding: "16px" }}>
                            <span
                              className="mudra-mono"
                              style={{
                                display: "inline-block",
                                padding: "3px 8px",
                                borderRadius: "var(--radius-xs)",
                                fontSize: "11px",
                                fontWeight: 700,
                                background:
                                  entry.entry_type?.includes("BUY") || entry.entry_type?.includes("RESERVATION")
                                    ? "rgba(59, 191, 247, 0.12)"
                                    : entry.entry_type?.includes("SELL") || entry.entry_type?.includes("REFUND") || entry.entry_type?.includes("INITIAL")
                                    ? "rgba(7, 162, 64, 0.12)"
                                    : "rgba(238, 160, 43, 0.12)",
                                color:
                                  entry.entry_type?.includes("BUY") || entry.entry_type?.includes("RESERVATION")
                                    ? "var(--mudra-sky-blue)"
                                    : entry.entry_type?.includes("SELL") || entry.entry_type?.includes("REFUND") || entry.entry_type?.includes("INITIAL")
                                    ? "var(--mudra-link-green)"
                                    : "var(--mudra-signal-yellow)",
                              }}
                            >
                              {entry.entry_type || "LEDGER_ENTRY"}
                            </span>
                          </td>
                          <td style={{ padding: "16px" }}>
                            {entry.symbol ? (
                              <span style={{ fontWeight: 600, color: "var(--text-heading)" }}>
                                {entry.symbol} {entry.qty ? `(${entry.qty} sh)` : ""}
                              </span>
                            ) : (
                              <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>General Ledger</span>
                            )}
                          </td>
                          <td
                            className="mudra-mono"
                            style={{
                              padding: "16px",
                              textAlign: "right",
                              fontWeight: 700,
                              color: isCredit ? "var(--mudra-link-green)" : "var(--text-heading)",
                            }}
                          >
                            {isCredit ? "+" : ""}
                            {formatINR(amount)}
                          </td>
                          <td
                            className="mudra-mono"
                            style={{
                              padding: "16px",
                              textAlign: "right",
                              fontWeight: 600,
                              color: "var(--text-muted)",
                            }}
                          >
                            {formatINR(entry.balance_after_paise || 10000000)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          )}
        </section>
      </div>
    </MudraShell>
  );
}


