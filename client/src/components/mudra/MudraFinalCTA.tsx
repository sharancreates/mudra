"use client";

import React from "react";

interface MudraFinalCTAProps {
  onOpenAuth?: () => void;
}

export function MudraFinalCTA({ onOpenAuth }: MudraFinalCTAProps) {
  return (
    <section
      data-mode="blue"
      data-cta=""
      data-screen-label="09 Final CTA"
      className="mudra-block"
      style={{
        position: "relative",
        background: "var(--mudra-sky-blue)",
        padding: "var(--section) 0 var(--section-half) 0",
        overflow: "hidden",
      }}
    >
      <div data-wrap="">
        {/* Eyebrow */}
        <span className="mudra-eyebrow" style={{ color: "#262626" }}>
          09 / start trading
        </span>

        {/* 3-Line Large Heading */}
        <h2
          style={{
            margin: "clamp(24px, 4vh, 48px) 0 0 0",
            fontSize: "clamp(40px, min(6.4vw, 85px), 124px)",
            fontWeight: "var(--weight-display)",
            letterSpacing: "var(--tracking-display)",
            lineHeight: 0.94,
            color: "#262626",
          }}
        >
          <span style={{ display: "block", overflow: "hidden" }}>
            <span data-cline="" style={{ display: "block", paddingBottom: "0.06em" }}>
              Let's start
            </span>
          </span>
          <span style={{ display: "block", overflow: "hidden" }}>
            <span data-cline="" style={{ display: "block", paddingBottom: "0.16em" }}>
              mastering the
            </span>
          </span>
          <span style={{ display: "block", overflow: "hidden" }}>
            <span data-cline="" style={{ display: "block", paddingBottom: "0.16em" }}>
              market
            </span>
          </span>
        </h2>

        {/* Actions Row */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "24px",
            marginTop: "clamp(32px, 5vh, 56px)",
          }}
        >
          {/* Claim Capital Button */}
          <button
            type="button"
            onClick={onOpenAuth}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              height: "56px",
              padding: "0 32px",
              borderRadius: "var(--radius-pill)",
              background: "#262626",
              color: "#FAFAF9",
              fontSize: "16px",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              transition: "opacity 160ms ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            <span>Claim ₹1,00,000 Capital</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--mudra-sky-blue)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>

          <a
            href="mailto:support@mudraequities.in"
            style={{
              fontSize: "16px",
              fontWeight: 500,
              color: "#262626",
              borderBottom: "2px solid rgba(38, 38, 38, 0.4)",
              paddingBottom: "3px",
              textDecoration: "none",
            }}
          >
            support@mudraequities.in
          </a>

          <span
            className="mudra-mono"
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "rgba(38, 38, 38, 0.8)",
              letterSpacing: "0.05em",
            }}
          >
            NSE 50 SANDBOX ACTIVE · 15:30 IST CLOSE
          </span>
        </div>
      </div>
    </section>
  );
}


