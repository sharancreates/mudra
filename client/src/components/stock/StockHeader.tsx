"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Star, ArrowUpRight, ArrowDownRight } from "lucide-react";
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
    <div style={{ width: "100%", paddingBottom: "28px", borderBottom: "1.5px solid var(--border-hairline)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "20px" }}>
        <Link
          href="/explore"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "13px",
            fontWeight: 500,
            color: "var(--text-muted)",
            textDecoration: "none",
          }}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Explorer</span>
        </Link>
        <MarketStatusBadge isOpen={false} freshness="FRESH" asOfDate={instrument.as_of} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "20px" }}>
        {/* Left: Symbol & Name */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <h1
              style={{
                margin: 0,
                fontSize: "clamp(32px, min(5.4vw, 56px), 72px)",
                fontWeight: "var(--weight-display)",
                letterSpacing: "var(--tracking-display)",
                lineHeight: 1,
                color: "var(--text-heading)",
              }}
            >
              {instrument.symbol}
            </h1>
            <span
              className="mudra-mono"
              style={{
                fontSize: "12px",
                fontWeight: 700,
                padding: "3px 8px",
                borderRadius: "var(--radius-xs)",
                background: "var(--surface-sunken)",
                color: "var(--text-heading)",
              }}
            >
              {instrument.exchange}
            </span>
            <span
              className="mudra-eyebrow"
              style={{
                fontSize: "11px",
                padding: "3px 10px",
                borderRadius: "var(--radius-pill)",
                border: "1px solid var(--border-hairline)",
                background: "var(--surface-card)",
              }}
            >
              {instrument.sector}
            </span>
            <button
              type="button"
              onClick={() => setIsStarred(!isStarred)}
              style={{
                background: "none",
                border: "none",
                color: isStarred ? "var(--mudra-signal-yellow)" : "var(--text-muted)",
                cursor: "pointer",
                padding: 0,
              }}
              aria-label="Star"
            >
              <Star
                className="w-5 h-5"
                style={{
                  fill: isStarred ? "var(--mudra-signal-yellow)" : "none",
                }}
              />
            </button>
          </div>
          <p style={{ margin: "6px 0 0 0", fontSize: "15px", color: "var(--text-muted)" }}>
            {instrument.name}
          </p>
        </div>

        {/* Right: Closing Price & Day Change */}
        <div style={{ textAlign: "right" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "flex-end", gap: "12px" }}>
            <span
              style={{
                fontSize: "clamp(28px, min(4vw, 42px), 52px)",
                fontWeight: 700,
                fontFamily: "var(--font-mono)",
                color: "var(--text-heading)",
                lineHeight: 1,
              }}
            >
              {formatINR(instrument.last_close_paise)}
            </span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "3px",
                padding: "4px 10px",
                borderRadius: "var(--radius-xs)",
                fontFamily: "var(--font-mono)",
                fontSize: "13px",
                fontWeight: 600,
                background: isPositive ? "rgba(7, 162, 64, 0.12)" : "rgba(201, 33, 33, 0.12)",
                color: isPositive ? "var(--mudra-link-green)" : "var(--mudra-node-red)",
              }}
            >
              {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              {formatBps(instrument.change_bps)}
            </span>
          </div>
          <span className="mudra-mono" style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
            NSE Official Close · As of {instrument.as_of}
          </span>
        </div>
      </div>
    </div>
  );
};


