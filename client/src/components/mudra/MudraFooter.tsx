"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MudraLogoPrimary } from "./MudraLogos";

interface MudraFooterProps {
  theme: "light" | "dark";
  onBackToTop: () => void;
}

export function MudraFooter({ theme, onBackToTop }: MudraFooterProps) {
  const [copied, setCopied] = useState(false);
  const altTheme = theme === "dark" ? "light" : "dark";

  const handleCopy = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText("support@mudraequities.in");
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
  };

  return (
    <footer
      data-footer=""
      data-theme={altTheme}
      className="mudra-block"
      style={{
        position: "relative",
        background: altTheme === "dark" ? "#181A1D" : "var(--surface-canvas)",
        color: altTheme === "dark" ? "#FAFAF9" : "var(--text-body)",
        padding: "var(--section) 0 24px 0",
      }}
    >
      <div data-wrap="">
        {/* 4-Column Footer Grid */}
        <div
          data-g=""
          style={{
            rowGap: "32px",
            paddingBottom: "clamp(40px, 6vh, 72px)",
          }}
        >
          {/* Brand Column */}
          <div data-col="brand">
            <MudraLogoPrimary
              style={{
                color: altTheme === "dark" ? "#F0EDEA" : "#262626",
              }}
            />
            <p
              style={{
                margin: "20px 0 0 0",
                fontSize: "15px",
                lineHeight: 1.55,
                color: "var(--text-muted)",
                maxWidth: "28ch",
              }}
            >
              Authentic Indian equities simulator. 15:30 IST next-close execution, integer paise ledger, zero risk.
            </p>
          </div>

          {/* Navigation Column */}
          <div data-col="foot" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <span className="mudra-eyebrow">Platform</span>
            <Link href="/" style={{ fontSize: "15px", color: "var(--text-body)", textDecoration: "none" }}>
              Home
            </Link>
            <Link href="/explore" style={{ fontSize: "15px", color: "var(--text-body)", textDecoration: "none" }}>
              Explore 50 Stocks
            </Link>
            <Link href="/dashboard" style={{ fontSize: "15px", color: "var(--text-body)", textDecoration: "none" }}>
              Portfolio Dashboard
            </Link>
            <Link href="/stock/RELIANCE" style={{ fontSize: "15px", color: "var(--text-body)", textDecoration: "none" }}>
              Trade Benchmark
            </Link>
          </div>

          {/* Rules & Compliance Column */}
          <div data-col="foot" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <span className="mudra-eyebrow">Rules &amp; Terms</span>
            <span style={{ fontSize: "15px", color: "var(--text-body)" }}>
              Next-Close 15:30 IST
            </span>
            <span style={{ fontSize: "15px", color: "var(--text-body)" }}>
              10% Headroom Buffer
            </span>
            <span style={{ fontSize: "15px", color: "var(--text-body)" }}>
              DPDP Act 2023 Compliant
            </span>
            <Link
              href="/terms"
              style={{
                fontSize: "15px",
                color: "var(--mudra-sky-blue)",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Terms &amp; Disclaimers →
            </Link>
            <span className="mudra-mono" style={{ color: "var(--text-muted)", marginTop: "4px", fontSize: "12px" }}>
              STRICTLY-18-PLUS
            </span>
          </div>

          {/* Contact Column */}
          <div data-col="foot" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <span className="mudra-eyebrow">Contact &amp; Support</span>
            <button
              data-copy-mail=""
              onClick={handleCopy}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "transparent",
                border: 0,
                padding: 0,
                color: "var(--text-body)",
                fontFamily: "var(--font-sans)",
                fontSize: "15px",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <span data-copy-label="">{copied ? "Copied" : "support@mudraequities.in"}</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--mudra-sky-blue)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            </button>
            <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.55, color: "var(--text-muted)" }}>
              Mudra is an educational simulator and does not offer financial advice or real brokerage services.
            </p>
          </div>
        </div>

        {/* Sub-Footer Row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "24px",
            paddingTop: "24px",
            borderTop: "2px solid var(--border-hairline)",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 24px", alignItems: "center" }}>
            <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              Copyright 2026 Mudra Equities Lab · Virtual ₹1,00,000 capital has no real monetary value
            </span>
            <Link
              href="/terms"
              style={{
                fontSize: "13px",
                color: "var(--text-muted)",
                textDecoration: "underline",
              }}
            >
              Statutory Disclaimers
            </Link>
          </div>

          <button
            onClick={onBackToTop}
            style={{
              flex: "none",
              whiteSpace: "nowrap",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "transparent",
              border: 0,
              padding: 0,
              color: "var(--text-body)",
              fontFamily: "var(--font-sans)",
              fontSize: "13px",
              fontWeight: 500,
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Back to top
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="19" x2="12" y2="5" />
              <polyline points="5 12 12 5 19 12" />
            </svg>
          </button>
        </div>
      </div>
    </footer>
  );
}


