import React from "react";
import Link from "next/link";

export function MudraClients() {
  return (
    <section
      data-screen-label="07 Market Sectors"
      style={{
        position: "relative",
        background: "var(--surface-canvas)",
        padding: "var(--section) 0 var(--section) 0",
      }}
    >
      <div data-wrap="">
        {/* Rail and Main Split */}
        <div data-spine-front="" data-g="" style={{ alignItems: "start", rowGap: "32px" }}>
          <div data-col="rail">
            <span className="mudra-eyebrow">07 / market sectors</span>
          </div>
          <p
            data-col="main"
            data-reveal=""
            style={{
              margin: 0,
              fontSize: "clamp(22px, min(2.9vw, 38.5px), 46px)",
              fontWeight: "var(--weight-heading)",
              letterSpacing: "var(--tracking-heading)",
              lineHeight: 1.36,
              color: "var(--text-heading)",
            }}
          >
            Practice across India's highest liquidity sectors and market leaders. Master{" "}
            <span
              data-mark=""
              style={{
                background: "var(--mudra-signal-yellow)",
                color: "#262626",
                padding: "0.02em 0.16em",
                margin: "0 -0.04em",
                borderRadius: "var(--radius-xs)",
                boxDecorationBreak: "clone",
                WebkitBoxDecorationBreak: "clone",
              }}
            >
              sector rotation and allocation
            </span>{" "}
            across 50 benchmark equities with zero capital risk.
          </p>
        </div>

        {/* 5 Sector Cards: 3 over 2 */}
        <div
          data-spine-wp="clients"
          data-clients=""
          data-g=""
          style={{
            marginTop: "var(--section-half)",
          }}
        >
          {/* 1. Energy */}
          <Link
            href="/stock/RELIANCE"
            data-col="quarter"
            data-reveal=""
            style={{
              background: "var(--surface-card)",
              color: "var(--text-heading)",
              borderRadius: "var(--radius-card)",
              padding: "clamp(20px, min(2vw, 26.6px), 32px)",
              minHeight: "clamp(130px, min(12vw, 159.4px), 190px)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "24px",
              textDecoration: "none",
            }}
          >
            <div>
              <span style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.01em" }}>RELIANCE</span>
              <span style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                Reliance Industries Ltd
              </span>
            </div>
            <span className="mudra-eyebrow">Energy &amp; Conglomerate</span>
          </Link>

          {/* 2. IT */}
          <Link
            href="/stock/TCS"
            data-col="quarter"
            data-reveal=""
            style={{
              background: "var(--surface-card)",
              color: "var(--text-heading)",
              borderRadius: "var(--radius-card)",
              padding: "clamp(20px, min(2vw, 26.6px), 32px)",
              minHeight: "clamp(130px, min(12vw, 159.4px), 190px)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "24px",
              textDecoration: "none",
            }}
          >
            <div>
              <span style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.01em" }}>TCS &amp; INFY</span>
              <span style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                Tata Consultancy &amp; Infosys
              </span>
            </div>
            <span className="mudra-eyebrow">Information Tech</span>
          </Link>

          {/* 3. Banking */}
          <Link
            href="/stock/HDFCBANK"
            data-col="quarter"
            data-reveal=""
            style={{
              background: "var(--surface-card)",
              color: "var(--text-heading)",
              borderRadius: "var(--radius-card)",
              padding: "clamp(20px, min(2vw, 26.6px), 32px)",
              minHeight: "clamp(130px, min(12vw, 159.4px), 190px)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "24px",
              textDecoration: "none",
            }}
          >
            <div>
              <span style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.01em" }}>HDFCBANK &amp; ICICI</span>
              <span style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                HDFC Bank &amp; ICICI Bank
              </span>
            </div>
            <span className="mudra-eyebrow">Banking &amp; Finance</span>
          </Link>

          {/* 4. Automobile */}
          <Link
            href="/stock/TATAMOTORS"
            data-col="quarter"
            data-reveal=""
            style={{
              background: "var(--surface-card)",
              color: "var(--text-heading)",
              borderRadius: "var(--radius-card)",
              padding: "clamp(20px, min(2vw, 26.6px), 32px)",
              minHeight: "clamp(130px, min(12vw, 159.4px), 190px)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "24px",
              textDecoration: "none",
            }}
          >
            <div>
              <span style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.01em" }}>TATAMOTORS</span>
              <span style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                Tata Motors &amp; Maruti Suzuki
              </span>
            </div>
            <span className="mudra-eyebrow">Automobile &amp; EV</span>
          </Link>

          {/* 5. FMCG */}
          <Link
            href="/stock/ITC"
            data-col="quarter"
            data-reveal=""
            style={{
              background: "var(--surface-card)",
              color: "var(--text-heading)",
              borderRadius: "var(--radius-card)",
              padding: "clamp(20px, min(2vw, 26.6px), 32px)",
              minHeight: "clamp(130px, min(12vw, 159.4px), 190px)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "24px",
              textDecoration: "none",
            }}
          >
            <div>
              <span style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.01em" }}>ITC &amp; HINDUNILVR</span>
              <span style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                ITC Ltd &amp; Hindustan Unilever
              </span>
            </div>
            <span className="mudra-eyebrow">FMCG &amp; Consumption</span>
          </Link>
        </div>
      </div>
    </section>
  );
}


