"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Trophy,
  Medal,
  Award,
  ShieldCheck,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  User,
  Sparkles,
} from "lucide-react";
import { MarketStatusBadge } from "@/components/common/MarketStatusBadge";
import { MudraShell } from "@/components/mudra/MudraShell";
import { getLeaderboard, getPortfolio } from "@/lib/api";
import { LeaderboardItem, LeaderboardResponse, PortfolioSummary } from "@/types/api";
import { formatINR, formatBps } from "@/lib/formatters";

export default function LeaderboardPage() {
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [timeframe, setTimeframe] = useState<"ALL" | "1M" | "1W">("ALL");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ email: string; displayName: string } | null>(null);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("mudra_user");
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch {}

    getPortfolio().then((p) => setPortfolio(p));
  }, []);

  useEffect(() => {
    setLoading(true);
    getLeaderboard(timeframe)
      .then((res) => setData(res))
      .finally(() => setLoading(false));
  }, [timeframe]);

  const items = data?.items || [];
  const top1 = items[0];
  const top2 = items[1];
  const top3 = items[2];
  const remaining = items.slice(3);

  const userEquity = portfolio?.equity_paise || 10071020;
  const userReturnBps = Math.round(((userEquity - 10000000) * 10000) / 10000000);

  return (
    <MudraShell activeNav="leaderboard">
      <div data-wrap="" style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 24px 64px 24px" }}>
        {/* Eyebrow */}
        <div style={{ marginBottom: "16px" }}>
          <span className="mudra-eyebrow">01 / verified performance registry</span>
        </div>

        {/* Display Heading & Timeframe Controls */}
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
              Trader Leaderboard
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
              Institutional rankings of simulated equity growth. Strict anti-outlier filters eliminate lucky single-trade anomalies.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
            <MarketStatusBadge isOpen={false} freshness="FRESH" asOfDate={data?.as_of || "09 Oct 2026"} />
            
            {/* Timeframe selector pills */}
            <div
              style={{
                display: "flex",
                gap: "6px",
                background: "var(--surface-canvas)",
                border: "1px solid var(--border-hairline)",
                padding: "4px",
                borderRadius: "var(--radius-pill)",
              }}
            >
              {(
                [
                  { id: "ALL", label: "All-Time" },
                  { id: "1M", label: "Monthly" },
                  { id: "1W", label: "Weekly" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTimeframe(tab.id)}
                  style={{
                    padding: "8px 18px",
                    borderRadius: "var(--radius-pill)",
                    border: "none",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    background: timeframe === tab.id ? "var(--text-heading)" : "transparent",
                    color: timeframe === tab.id ? "var(--surface-canvas)" : "var(--text-muted)",
                    transition: "all 140ms ease",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* PRD Section 2.4 Anti-Outlier Eligibility Banner */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "14px",
            padding: "16px 22px",
            borderRadius: "var(--radius-card)",
            background: "var(--surface-card)",
            border: "1.5px solid var(--border-hairline)",
            marginBottom: "32px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "var(--radius-pill)",
                background: "rgba(238, 160, 43, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--mudra-signal-yellow)",
              }}
            >
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-heading)" }}>
                Anti-Outlier Gate (PRD §2.4)
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                Traders qualify for public rankings only after completing at least <strong>5 filled trades</strong> across <strong>7+ active trading days</strong>.
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
                background: "rgba(7, 162, 64, 0.12)",
                color: "var(--mudra-link-green)",
              }}
            >
              Zero Real Money · Pure Merit
            </span>
          </div>
        </div>

        {/* Top 3 Podium Cards */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "20px",
            marginBottom: "36px",
          }}
        >
          {/* Rank 2 (Silver / Sky Blue) */}
          {top2 && (
            <div
              style={{
                background: "var(--surface-card)",
                border: "1.5px solid var(--border-hairline)",
                borderRadius: "var(--radius-card)",
                padding: "28px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                position: "relative",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <span
                  className="mudra-mono"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px 12px",
                    borderRadius: "var(--radius-pill)",
                    background: "rgba(59, 191, 247, 0.15)",
                    color: "var(--mudra-sky-blue)",
                    fontSize: "12px",
                    fontWeight: 700,
                  }}
                >
                  <Medal className="w-3.5 h-3.5" />
                  RANK #2
                </span>
                <span className="mudra-mono" style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  {top2.trades_count} trades · {top2.days_active}d active
                </span>
              </div>

              <div>
                <h3 style={{ margin: "0 0 6px 0", fontSize: "20px", fontWeight: 700, color: "var(--text-heading)" }}>
                  {top2.display_name}
                </h3>
                <div style={{ fontSize: "32px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--text-heading)" }}>
                  {formatINR(top2.equity_paise)}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: "20px",
                  paddingTop: "14px",
                  borderTop: "1px solid var(--border-hairline)",
                }}
              >
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Net Simulated Return</span>
                <span
                  className="mudra-mono"
                  style={{
                    fontWeight: 700,
                    fontSize: "14px",
                    color: "var(--mudra-link-green)",
                  }}
                >
                  +{formatBps(top2.return_bps)}
                </span>
              </div>
            </div>
          )}

          {/* Rank 1 (Gold / Signal Yellow) */}
          {top1 && (
            <div
              style={{
                background: "var(--surface-card)",
                border: "2px solid var(--mudra-signal-yellow)",
                borderRadius: "var(--radius-card)",
                padding: "28px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                position: "relative",
                boxShadow: "0 8px 30px rgba(238, 160, 43, 0.12)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <span
                  className="mudra-mono"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px 14px",
                    borderRadius: "var(--radius-pill)",
                    background: "var(--mudra-signal-yellow)",
                    color: "#0A0D10",
                    fontSize: "12px",
                    fontWeight: 700,
                  }}
                >
                  <Trophy className="w-4 h-4" />
                  RANK #1 · LEADER
                </span>
                <span className="mudra-mono" style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  {top1.trades_count} trades · {top1.days_active}d active
                </span>
              </div>

              <div>
                <h3 style={{ margin: "0 0 6px 0", fontSize: "22px", fontWeight: 700, color: "var(--text-heading)" }}>
                  {top1.display_name}
                </h3>
                <div style={{ fontSize: "36px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--text-heading)" }}>
                  {formatINR(top1.equity_paise)}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: "20px",
                  paddingTop: "14px",
                  borderTop: "1px solid var(--border-hairline)",
                }}
              >
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Net Simulated Return</span>
                <span
                  className="mudra-mono"
                  style={{
                    fontWeight: 700,
                    fontSize: "16px",
                    color: "var(--mudra-link-green)",
                  }}
                >
                  +{formatBps(top1.return_bps)}
                </span>
              </div>
            </div>
          )}

          {/* Rank 3 (Bronze / Slate) */}
          {top3 && (
            <div
              style={{
                background: "var(--surface-card)",
                border: "1.5px solid var(--border-hairline)",
                borderRadius: "var(--radius-card)",
                padding: "28px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                position: "relative",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <span
                  className="mudra-mono"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px 12px",
                    borderRadius: "var(--radius-pill)",
                    background: "var(--surface-sunken)",
                    color: "var(--text-heading)",
                    fontSize: "12px",
                    fontWeight: 700,
                  }}
                >
                  <Award className="w-3.5 h-3.5" />
                  RANK #3
                </span>
                <span className="mudra-mono" style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  {top3.trades_count} trades · {top3.days_active}d active
                </span>
              </div>

              <div>
                <h3 style={{ margin: "0 0 6px 0", fontSize: "20px", fontWeight: 700, color: "var(--text-heading)" }}>
                  {top3.display_name}
                </h3>
                <div style={{ fontSize: "32px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--text-heading)" }}>
                  {formatINR(top3.equity_paise)}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: "20px",
                  paddingTop: "14px",
                  borderTop: "1px solid var(--border-hairline)",
                }}
              >
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Net Simulated Return</span>
                <span
                  className="mudra-mono"
                  style={{
                    fontWeight: 700,
                    fontSize: "14px",
                    color: "var(--mudra-link-green)",
                  }}
                >
                  +{formatBps(top3.return_bps)}
                </span>
              </div>
            </div>
          )}
        </section>

        {/* Pinned "Your Standing" Progress Bar */}
        <section
          style={{
            background: "var(--surface-card)",
            border: "1.5px solid var(--border-hairline)",
            borderRadius: "var(--radius-card)",
            padding: "24px 28px",
            marginBottom: "36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "var(--radius-pill)",
                background: "var(--text-heading)",
                color: "var(--surface-canvas)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "18px",
              }}
            >
              #8
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-heading)" }}>
                  Your Account Standing: {user?.displayName || "Meera Iyer (You)"}
                </span>
                <span
                  className="mudra-mono"
                  style={{
                    padding: "2px 8px",
                    borderRadius: "var(--radius-xs)",
                    fontSize: "11px",
                    fontWeight: 600,
                    background: "rgba(7, 162, 64, 0.12)",
                    color: "var(--mudra-link-green)",
                  }}
                >
                  Qualified for Rankings
                </span>
              </div>
              <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>
                Total Virtual Equity: <strong style={{ color: "var(--text-heading)" }}>{formatINR(userEquity)}</strong> (+{formatBps(userReturnBps)}) · 5 settled trades · 7 active days
              </div>
            </div>
          </div>

          <Link
            href="/dashboard"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              height: "42px",
              padding: "0 20px",
              borderRadius: "var(--radius-pill)",
              background: "var(--surface-sunken)",
              color: "var(--text-heading)",
              fontSize: "13px",
              fontWeight: 600,
              textDecoration: "none",
              border: "1px solid var(--border-hairline)",
            }}
          >
            <span>View Full Portfolio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </section>

        {/* Full Rankings Table */}
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
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "var(--text-heading)" }}>
              Top Qualified Traders
            </h2>
            <span className="mudra-mono" style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Updated daily at 15:30 IST close
            </span>
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
                  <th style={{ padding: "14px 16px", width: "80px" }}>Rank</th>
                  <th style={{ padding: "14px 16px" }}>Trader</th>
                  <th style={{ padding: "14px 16px", textAlign: "right" }}>Total Equity</th>
                  <th style={{ padding: "14px 16px", textAlign: "right" }}>Return</th>
                  <th style={{ padding: "14px 16px", textAlign: "right" }}>Trades</th>
                  <th style={{ padding: "14px 16px", textAlign: "right" }}>Days Active</th>
                  <th style={{ padding: "14px 16px", textAlign: "right" }}>Status</th>
                </tr>
              </thead>
              <tbody style={{ fontFamily: "var(--font-sans)" }}>
                {items.map((trader) => {
                  const isTop3 = trader.rank <= 3;
                  const isCurrentUser = trader.rank === 8;

                  return (
                    <tr
                      key={trader.user_id}
                      style={{
                        borderBottom: "1px solid var(--border-hairline)",
                        background: isCurrentUser ? "rgba(59, 191, 247, 0.06)" : "transparent",
                        transition: "background 140ms ease",
                      }}
                      onMouseEnter={(e) => {
                        if (!isCurrentUser) e.currentTarget.style.background = "var(--surface-sunken)";
                      }}
                      onMouseLeave={(e) => {
                        if (!isCurrentUser) e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <td style={{ padding: "16px" }}>
                        <span
                          className="mudra-mono"
                          style={{
                            fontWeight: 700,
                            fontSize: "13px",
                            color:
                              trader.rank === 1
                                ? "var(--mudra-signal-yellow)"
                                : trader.rank === 2
                                ? "var(--mudra-sky-blue)"
                                : isCurrentUser
                                ? "var(--mudra-sky-blue)"
                                : "var(--text-heading)",
                          }}
                        >
                          #{trader.rank}
                        </span>
                      </td>
                      <td style={{ padding: "16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "var(--radius-pill)",
                              background: isCurrentUser ? "var(--mudra-sky-blue)" : "var(--surface-sunken)",
                              color: isCurrentUser ? "#0A0D10" : "var(--text-heading)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "12px",
                              fontWeight: 700,
                              fontFamily: "var(--font-mono)",
                            }}
                          >
                            {trader.display_name.charAt(0)}
                          </div>
                          <div>
                            <span style={{ fontWeight: 600, color: "var(--text-heading)" }}>
                              {trader.display_name}
                            </span>
                            {isCurrentUser && (
                              <span
                                className="mudra-mono"
                                style={{
                                  marginLeft: "8px",
                                  fontSize: "10px",
                                  padding: "2px 6px",
                                  borderRadius: "var(--radius-xs)",
                                  background: "var(--text-heading)",
                                  color: "var(--surface-canvas)",
                                  fontWeight: 700,
                                }}
                              >
                                YOU
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "16px", textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--text-heading)" }}>
                        {formatINR(trader.equity_paise)}
                      </td>
                      <td style={{ padding: "16px", textAlign: "right", fontFamily: "var(--font-mono)" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "3px 8px",
                            borderRadius: "var(--radius-xs)",
                            fontSize: "12px",
                            fontWeight: 600,
                            background: "rgba(7, 162, 64, 0.12)",
                            color: "var(--mudra-link-green)",
                          }}
                        >
                          +{formatBps(trader.return_bps)}
                        </span>
                      </td>
                      <td style={{ padding: "16px", textAlign: "right", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                        {trader.trades_count}
                      </td>
                      <td style={{ padding: "16px", textAlign: "right", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                        {trader.days_active}d
                      </td>
                      <td style={{ padding: "16px", textAlign: "right" }}>
                        <span
                          className="mudra-mono"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            fontSize: "11px",
                            color: "var(--mudra-link-green)",
                            fontWeight: 600,
                          }}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>AUDITED</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </MudraShell>
  );
}
