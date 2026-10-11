import React from "react";

export function MudraWhoWeAre() {
  return (
    <section
      data-screen-label="03 What is Mudra"
      style={{
        padding: "var(--section) 0 var(--section-half) 0",
      }}
    >
      <div data-wrap="">
        <div data-g="" style={{ alignItems: "start", rowGap: "32px" }}>
          {/* Left Rail */}
          <div data-col="rail">
            <span className="Mudra-eyebrow">03 / what is mudra</span>
          </div>

          {/* Main Statement */}
          <div
            data-col="main"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "32px",
            }}
          >
            <p
              data-reveal=""
              style={{
                margin: 0,
                fontSize: "clamp(22px, min(2.9vw, 38.5px), 46px)",
                fontWeight: "var(--weight-heading)",
                letterSpacing: "var(--tracking-heading)",
                lineHeight: 1.28,
                color: "var(--text-heading)",
              }}
            >
              Mudra is an authentic equity market sandbox built for Indian traders, students, and engineers who want real-world market discipline without risking real capital.
            </p>

            <p
              data-reveal=""
              style={{
                margin: 0,
                fontSize: "clamp(22px, min(2.9vw, 38.5px), 46px)",
                fontWeight: "var(--weight-heading)",
                letterSpacing: "var(--tracking-heading)",
                lineHeight: 1.28,
                color: "var(--text-heading)",
              }}
            >
              Unlike toy simulators with fantasy instant fills, Mudra mirrors the exact mechanics of the National Stock Exchange: orders queue until the{" "}
              <span
                data-mark=""
                style={{
                  background: "var(--Mudra-signal-yellow)",
                  color: "#262626",
                  padding: "0.02em 0.16em",
                  margin: "0 -0.04em",
                  borderRadius: "var(--radius-xs)",
                  boxDecorationBreak: "clone",
                  WebkitBoxDecorationBreak: "clone",
                }}
              >
                15:30 IST Next-Close
              </span>
              , settled in an integer paise ledger across the{" "}
              <span
                data-mark=""
                style={{
                  background: "var(--Mudra-signal-yellow)",
                  color: "#262626",
                  padding: "0.02em 0.16em",
                  margin: "0 -0.04em",
                  borderRadius: "var(--radius-xs)",
                  boxDecorationBreak: "clone",
                  WebkitBoxDecorationBreak: "clone",
                }}
              >
                NSE 50 benchmark
              </span>
              .
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}


