import React from "react";

interface MudraProblemProps {
  theme: "light" | "dark";
}

export function MudraProblem({ theme }: MudraProblemProps) {
  // Alt theme: opposite of current theme
  const altTheme = theme === "dark" ? "light" : "dark";

  return (
    <section
      data-manifesto=""
      data-theme={altTheme}
      data-screen-label="04 The problem"
      className="mudra-block"
      style={{
        position: "relative",
        background: altTheme === "dark" ? "#181A1D" : "var(--surface-canvas)",
        color: altTheme === "dark" ? "#FAFAF9" : "var(--text-body)",
        padding: "var(--section) 0",
      }}
    >
      <div data-spine-front="" data-wrap="">
        {/* Eyebrow */}
        <div data-g="" style={{ marginBottom: "var(--section-half)" }}>
          <div data-col="wide">
            <span className="mudra-eyebrow">04 / the problem</span>
          </div>
        </div>

        {/* Display Heading */}
        <h2
          style={{
            margin: 0,
            fontSize: "clamp(40px, min(7.4vw, 98.3px), 158px)",
            fontWeight: "var(--weight-display)",
            letterSpacing: "var(--tracking-display)",
            lineHeight: 0.94,
            color: "var(--text-heading)",
          }}
        >
          Most paper trading
          <br />
          apps teach you how
          <br />
          to lose real money
        </h2>

        {/* Fine Copy Column */}
        <div data-g="" style={{ marginTop: "var(--section-half)" }}>
          <div
            data-col="fine"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <span
              aria-hidden="true"
              style={{
                display: "block",
                width: "72px",
                height: "4px",
                borderRadius: "999px",
                background: "var(--mudra-signal-yellow)",
              }}
            />
            <p
              style={{
                margin: 0,
                fontSize: "15px",
                lineHeight: 1.6,
                color: "var(--text-muted)",
              }}
            >
              Traditional paper trading tools fill orders instantaneously at stale bid-ask prices, creating an illusion of effortless intra-day profits. When traders transition to real brokerages with real order books, slippage and latency cause immediate losses.
            </p>
            <p
              style={{
                margin: 0,
                fontSize: "15px",
                lineHeight: 1.6,
                color: "var(--text-muted)",
              }}
            >
              Mudra enforces realistic 15:30 IST next-close settlement, strict 10% headroom buffers, and accurate 0.1% simulated brokerage fees. If your strategy works here, it will work in the real market.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
