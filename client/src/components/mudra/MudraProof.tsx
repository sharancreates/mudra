import React from "react";
import { NseLogoBadge } from "./MudraLogos";

interface MudraProofProps {
  theme: "light" | "dark";
}

export function MudraProof({ theme }: MudraProofProps) {
  const altTheme = theme === "dark" ? "light" : "dark";

  return (
    <section
      data-theme={altTheme}
      data-screen-label="08 Proof"
      className="mudra-block"
      style={{
        position: "relative",
        background: altTheme === "dark" ? "#181A1D" : "var(--surface-canvas)",
        color: altTheme === "dark" ? "#FAFAF9" : "var(--text-body)",
        padding: "var(--section) 0",
      }}
    >
      <div data-wrap="">
        {/* Eyebrow & Headline */}
        <div data-g="" style={{ rowGap: "24px", marginBottom: "clamp(40px, 6vh, 72px)" }}>
          <div data-col="half">
            <span className="mudra-eyebrow">08 / proof</span>
            <h2
              data-reveal=""
              style={{
                margin: "20px 0 0 0",
                fontSize: "clamp(32px, min(5vw, 66.4px), 88px)",
                fontWeight: "var(--weight-display)",
                letterSpacing: "var(--tracking-display)",
                lineHeight: 0.96,
                color: "var(--text-heading)",
              }}
            >
              What Indian traders
              <br />
              are saying
            </h2>
          </div>
        </div>

        {/* 3 Quote Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Quote 1 (Sky Blue hover) */}
          <div
            data-quote=""
            data-spine-under=""
            className="hover-card-sky"
            style={{
              position: "relative",
              zIndex: 6,
              color: "var(--text-heading)",
              background: "var(--surface-card)",
              borderRadius: "var(--radius-card-lg)",
              padding: "clamp(28px, min(4vw, 53.1px), 72px)",
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) minmax(0, 280px)",
              gap: "clamp(24px, min(4vw, 53.1px), 64px)",
              alignItems: "end",
              transition: "background 220ms ease, color 220ms ease",
              cursor: "pointer",
            }}
          >
            <blockquote
              style={{
                margin: 0,
                fontSize: "clamp(22px, min(3.2vw, 42.5px), 58px)",
                fontWeight: "var(--weight-heading)",
                letterSpacing: "var(--tracking-heading)",
                lineHeight: 1.08,
                color: "inherit",
              }}
            >
              "Mudra is the first simulator that didn't let me cheat by gaming delayed feeds. The 15:30 next-close discipline completely changed how I pick swing entries."
            </blockquote>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "inherit" }}>
                Swing Trader
              </span>
              <span style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "inherit" }}>
                Bengaluru, Karnataka
              </span>
            </div>
          </div>

          {/* Quote 2 (Signal Yellow hover) */}
          <div
            data-quote=""
            data-spine-under=""
            className="hover-card-yellow"
            style={{
              position: "relative",
              zIndex: 6,
              color: "var(--text-heading)",
              background: "var(--surface-card)",
              borderRadius: "var(--radius-card-lg)",
              padding: "clamp(28px, min(4vw, 53.1px), 72px)",
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) minmax(0, 280px)",
              gap: "clamp(24px, min(4vw, 53.1px), 64px)",
              alignItems: "end",
              transition: "background 220ms ease, color 220ms ease",
              cursor: "pointer",
            }}
          >
            <blockquote
              style={{
                margin: 0,
                fontSize: "clamp(22px, min(3.2vw, 42.5px), 58px)",
                fontWeight: "var(--weight-heading)",
                letterSpacing: "var(--tracking-heading)",
                lineHeight: 1.08,
                color: "inherit",
              }}
            >
              "The integer paise ledger and 0.1% simulated brokerage fee made me realize how much churn eats into returns. Invaluable for learning realistic position sizing."
            </blockquote>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ marginBottom: "10px" }}>
                <NseLogoBadge />
              </div>
              <span style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "inherit" }}>
                NISM Aspirant &amp; Analyst
              </span>
            </div>
          </div>

          {/* Quote 3 (Link Green hover) */}
          <div
            data-quote=""
            data-spine-under=""
            className="hover-card-green"
            style={{
              position: "relative",
              zIndex: 6,
              color: "var(--text-heading)",
              background: "var(--surface-card)",
              borderRadius: "var(--radius-card-lg)",
              padding: "clamp(28px, min(4vw, 53.1px), 72px)",
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) minmax(0, 280px)",
              gap: "clamp(24px, min(4vw, 53.1px), 64px)",
              alignItems: "end",
              transition: "background 220ms ease, color 220ms ease",
              cursor: "pointer",
            }}
          >
            <blockquote
              style={{
                margin: 0,
                fontSize: "clamp(22px, min(3.2vw, 42.5px), 58px)",
                fontWeight: "var(--weight-heading)",
                letterSpacing: "var(--tracking-heading)",
                lineHeight: 1.08,
                color: "inherit",
              }}
            >
              "I test my momentum thesis on NSE 50 constituents for 3 weeks before executing on Zerodha. Zero balance drift, zero guesswork."
            </blockquote>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "inherit" }}>
                Active Portfolio Trader
              </span>
              <span style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "inherit" }}>
                Hyderabad, Telangana
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
