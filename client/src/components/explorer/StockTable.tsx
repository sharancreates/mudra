"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ArrowDownRight, Star } from "lucide-react";
import { Instrument } from "@/types/api";
import { formatINR, formatBps } from "@/lib/formatters";

import { useWatchlist } from "@/lib/watchlist";

interface StockTableProps {
  instruments: Instrument[];
  activeSector?: string;
  searchQuery?: string;
  onSelectInstrument?: (instrument: Instrument) => void;
  onResetFilters?: () => void;
}

export const StockTable: React.FC<StockTableProps> = ({
  instruments,
  activeSector,
  searchQuery,
  onResetFilters,
}) => {
  const { isStarred, toggle } = useWatchlist();

  if (instruments.length === 0) {
    const isWatchlist = activeSector === "Watchlist";

    return (
      <div
        style={{
          padding: "72px 24px",
          textAlign: "center",
          background: "var(--surface-card)",
          border: "1.5px solid var(--border-hairline)",
          borderRadius: "var(--radius-card)",
        }}
      >
        {isWatchlist ? (
          <div>
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "50%",
                background: "rgba(238, 160, 43, 0.12)",
                border: "1.5px solid rgba(238, 160, 43, 0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 18px",
                color: "var(--mudra-signal-yellow)",
              }}
            >
              <Star className="w-6 h-6" style={{ fill: "var(--mudra-signal-yellow)" }} />
            </div>
            <h3 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-heading)", margin: 0 }}>
              Your Watchlist is Empty
            </h3>
            <p
              style={{
                fontSize: "14px",
                color: "var(--text-muted)",
                marginTop: "10px",
                maxWidth: "48ch",
                marginInline: "auto",
                lineHeight: 1.55,
              }}
            >
              You haven&apos;t pinned any securities yet. Click the star icon next to any of the 50 liquid Nifty 50 stocks in the market table to monitor priority securities here.
            </p>
            {onResetFilters && (
              <button
                type="button"
                onClick={onResetFilters}
                style={{
                  marginTop: "20px",
                  padding: "10px 24px",
                  borderRadius: "var(--radius-pill)",
                  border: "none",
                  background: "var(--text-heading)",
                  color: "var(--surface-canvas)",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "opacity 140ms ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                Browse All 50 Stocks
              </button>
            )}
          </div>
        ) : (
          <div>
            <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-heading)", margin: 0 }}>
              {searchQuery?.trim()
                ? `No instruments matching "${searchQuery.trim()}"`
                : "No matching instruments found"}
            </h3>
            <p style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "8px" }}>
              Try adjusting your search query or selecting &quot;All&quot; sectors.
            </p>
            {onResetFilters && (
              <button
                type="button"
                onClick={onResetFilters}
                style={{
                  marginTop: "16px",
                  padding: "8px 20px",
                  borderRadius: "var(--radius-pill)",
                  border: "1.5px solid var(--border-hairline)",
                  background: "var(--surface-canvas)",
                  color: "var(--text-heading)",
                  fontSize: "12px",
                  fontWeight: 600,
                  fontFamily: "var(--font-mono)",
                  cursor: "pointer",
                }}
              >
                Reset Filters
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        overflowX: "auto",
        borderRadius: "var(--radius-card)",
        border: "1.5px solid var(--border-hairline)",
        background: "var(--surface-card)",
      }}
    >
      <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse", fontSize: "14px" }}>
        <thead>
          <tr
            style={{
              borderBottom: "1.5px solid var(--border-hairline)",
              fontSize: "11px",
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              color: "var(--text-muted)",
              fontFamily: "var(--font-mono)",
            }}
          >
            <th style={{ padding: "14px 16px", width: "48px", textAlign: "center" }}>★</th>
            <th style={{ padding: "14px 16px", fontWeight: 600 }}>Instrument</th>
            <th className="hidden md:table-cell" style={{ padding: "14px 16px", fontWeight: 600 }}>Sector</th>
            <th style={{ padding: "14px 16px", fontWeight: 600, textAlign: "right" }}>EOD Close</th>
            <th style={{ padding: "14px 16px", fontWeight: 600, textAlign: "right" }}>Day Change</th>
          </tr>
        </thead>
        <tbody style={{ fontFamily: "var(--font-sans)" }}>
          {instruments.map((stock) => {
            const starred = isStarred(stock.symbol);
            const isPositive = stock.change_bps >= 0;

            return (
              <tr
                key={stock.symbol}
                style={{
                  borderBottom: "1px solid var(--border-hairline)",
                  transition: "background 140ms ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-sunken)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {/* Watchlist star */}
                <td style={{ padding: "16px", textAlign: "center" }}>
                  <button
                    type="button"
                    onClick={(e) => toggle(stock.symbol, e)}
                    style={{
                      background: "none",
                      border: "none",
                      color: starred ? "var(--mudra-signal-yellow)" : "var(--text-muted)",
                      cursor: "pointer",
                      padding: 0,
                    }}
                    aria-label={`Toggle watchlist for ${stock.symbol}`}
                  >
                    <Star
                      className="w-4 h-4"
                      style={{
                        fill: starred ? "var(--mudra-signal-yellow)" : "none",
                      }}
                    />
                  </button>
                </td>

                {/* Symbol & Name */}
                <td style={{ padding: "16px" }}>
                  <Link
                    href={`/stock/${stock.symbol}`}
                    style={{ textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontWeight: 700, fontSize: "15px", color: "var(--text-heading)" }}>
                        {stock.symbol}
                      </span>
                      <span
                        className="mudra-mono"
                        style={{
                          fontSize: "10px",
                          fontWeight: 600,
                          padding: "1px 6px",
                          borderRadius: "var(--radius-xs)",
                          background: "var(--surface-sunken)",
                          color: "var(--text-muted)",
                        }}
                      >
                        {stock.exchange}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: "12px",
                        color: "var(--text-muted)",
                        marginTop: "2px",
                        maxWidth: "260px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {stock.name}
                    </span>
                  </Link>
                </td>

                {/* Sector */}
                <td className="hidden md:table-cell" style={{ padding: "16px" }}>
                  <span
                    className="mudra-eyebrow"
                    style={{
                      fontSize: "11px",
                      padding: "3px 10px",
                      borderRadius: "var(--radius-pill)",
                      border: "1px solid var(--border-hairline)",
                      background: "var(--surface-canvas)",
                    }}
                  >
                    {stock.sector}
                  </span>
                </td>

                {/* Last Close Price */}
                <td
                  style={{
                    padding: "16px",
                    textAlign: "right",
                    fontFamily: "var(--font-mono)",
                    fontWeight: 700,
                    fontSize: "15px",
                    color: "var(--text-heading)",
                  }}
                >
                  {formatINR(stock.last_close_paise)}
                </td>

                {/* Day Change % */}
                <td style={{ padding: "16px", textAlign: "right" }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "2px",
                      padding: "3px 8px",
                      borderRadius: "var(--radius-xs)",
                      fontFamily: "var(--font-mono)",
                      fontSize: "12px",
                      fontWeight: 600,
                      background: isPositive ? "rgba(7, 162, 64, 0.12)" : "rgba(201, 33, 33, 0.12)",
                      color: isPositive ? "var(--mudra-link-green)" : "var(--mudra-node-red)",
                    }}
                  >
                    {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    {formatBps(stock.change_bps)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};


