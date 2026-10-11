import React from "react";

export function MudraReasons() {
  return (
    <section
      data-screen-label="06 Why traders choose Mudra"
      style={{
        position: "relative",
        padding: "var(--section) 0 0 0",
      }}
    >
      <div data-wrap="">
        {/* Eyebrow */}
        <div data-spine-wp="reasons" data-g="" style={{ marginBottom: "40px" }}>
          <div data-col="wide">
            <span className="Mudra-eyebrow">06 / why traders choose mudra</span>
          </div>
        </div>

        {/* 3 Reason Cards Grid */}
        <div
          data-reasons=""
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: "var(--gutter)",
          }}
        >
          {/* Reason 1 (Sky Blue) */}
          <div
            data-reason=""
            data-spine-under=""
            style={{
              position: "relative",
              zIndex: 6,
              borderRadius: "var(--radius-card-lg)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              background: "var(--Mudra-sky-blue)",
              paddingTop: "12px",
            }}
          >
            <div
              style={{
                flex: 1,
                background: "var(--Mudra-blue-800)",
                color: "#FAFAF9",
                padding: "clamp(24px, min(2.6vw, 34.5px), 44px)",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                borderRadius: "var(--radius-card) var(--radius-card) 0 0",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.07em",
                  textTransform: "uppercase",
                }}
              >
                Reason 1
              </span>
              <h3
                style={{
                  margin: 0,
                  fontSize: "clamp(24px, min(2.3vw, 30.5px), 38px)",
                  fontWeight: "var(--weight-heading)",
                  letterSpacing: "var(--tracking-heading)",
                  lineHeight: 1.04,
                  color: "#FAFAF9",
                }}
              >
                Eliminating stale-price fantasy fills
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: "clamp(15px, min(1.1vw, 14.6px), 17px)",
                  lineHeight: 1.55,
                  color: "#FAFAF9",
                }}
              >
                Toy simulators fill orders immediately against static feeds, rewarding reckless scalping habits that ruin retail accounts. Mudra enforces the official NSE closing auction.
              </p>
            </div>
          </div>

          {/* Reason 2 (Signal Yellow) */}
          <div
            data-reason=""
            data-spine-under=""
            style={{
              position: "relative",
              zIndex: 6,
              borderRadius: "var(--radius-card-lg)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              background: "var(--Mudra-signal-yellow)",
              paddingTop: "12px",
            }}
          >
            <div
              style={{
                flex: 1,
                background: "var(--Mudra-yellow-800)",
                color: "#FAFAF9",
                padding: "clamp(24px, min(2.6vw, 34.5px), 44px)",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                borderRadius: "var(--radius-card) var(--radius-card) 0 0",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.07em",
                  textTransform: "uppercase",
                }}
              >
                Reason 2
              </span>
              <h3
                style={{
                  margin: 0,
                  fontSize: "clamp(24px, min(2.3vw, 30.5px), 38px)",
                  fontWeight: "var(--weight-heading)",
                  letterSpacing: "var(--tracking-heading)",
                  lineHeight: 1.04,
                  color: "#FAFAF9",
                }}
              >
                Protecting capital with 10% headroom
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: "clamp(15px, min(1.1vw, 14.6px), 17px)",
                  lineHeight: 1.55,
                  color: "#FAFAF9",
                }}
              >
                Avoid catastrophic over-allocation before market close. Mudra reserves a 10% cash buffer on pending orders, instilling professional risk management from day one.
              </p>
            </div>
          </div>

          {/* Reason 3 (Link Green) */}
          <div
            data-reason=""
            data-spine-under=""
            style={{
              position: "relative",
              zIndex: 6,
              borderRadius: "var(--radius-card-lg)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              background: "var(--Mudra-link-green)",
              paddingTop: "12px",
            }}
          >
            <div
              style={{
                flex: 1,
                background: "var(--Mudra-green-800)",
                color: "#FAFAF9",
                padding: "clamp(24px, min(2.6vw, 34.5px), 44px)",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                borderRadius: "var(--radius-card) var(--radius-card) 0 0",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.07em",
                  textTransform: "uppercase",
                }}
              >
                Reason 3
              </span>
              <h3
                style={{
                  margin: 0,
                  fontSize: "clamp(24px, min(2.3vw, 30.5px), 38px)",
                  fontWeight: "var(--weight-heading)",
                  letterSpacing: "var(--tracking-heading)",
                  lineHeight: 1.04,
                  color: "#FAFAF9",
                }}
              >
                Transition to real brokerages with confidence
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: "clamp(15px, min(1.1vw, 14.6px), 17px)",
                  lineHeight: 1.55,
                  color: "#FAFAF9",
                }}
              >
                Test your swing strategies and thesis sizing across 50 liquid Nifty constituents with ₹1,00,000 virtual capital. What works here works in live markets.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


