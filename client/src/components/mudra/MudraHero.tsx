"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

interface MudraHeroProps {
  onOpenAuth?: () => void;
}

export function MudraHero({ onOpenAuth }: MudraHeroProps) {
  const [activeVerbIndex, setActiveVerbIndex] = useState(0);
  const verbs = ["simulate", "settle", "master"];

  // Cycle highlighted verb every 2.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveVerbIndex((prev) => (prev + 1) % verbs.length);
    }, 2500);
    return () => clearInterval(timer);
  }, [verbs.length]);

  return (
    <section
      data-screen-label="01 Hero"
      style={{
        position: "relative",
        minHeight: "100svh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        padding: "140px 0 40px 0",
        overflow: "hidden",
      }}
    >
      <div data-wrap="" style={{ position: "relative" }}>
        {/* Eyebrow */}
        <div data-g="" style={{ marginBottom: "clamp(20px, 3vh, 40px)" }}>
          <div data-spine-front="" data-col="wide">
            <span className="mudra-eyebrow">01 / indian equities sandbox</span>
          </div>
        </div>

        {/* 4-Line Headline */}
        <div data-g="">
          <h1
            data-spine-front=""
            data-col="wide"
            style={{
              margin: 0,
              fontSize: "clamp(46px, min(9.4vw, 124.8px), 190px)",
              fontWeight: "var(--weight-display)",
              letterSpacing: "var(--tracking-display)",
              lineHeight: 0.92,
              color: "var(--text-heading)",
            }}
          >
            {/* Line 1 */}
            <span style={{ display: "block", overflow: "hidden" }}>
              <span data-hline="" style={{ display: "block", paddingBottom: "0.06em" }}>
                We{" "}
                <span
                  data-verb=""
                  style={{
                    display: "inline-block",
                    padding: "0 0.08em",
                    margin: "0 -0.08em",
                    borderRadius: "var(--radius-xs)",
                    background: activeVerbIndex === 0 ? "var(--mudra-signal-yellow)" : "transparent",
                    color: activeVerbIndex === 0 ? "#262626" : "inherit",
                    transition: "background 240ms ease, color 240ms ease",
                  }}
                >
                  simulate
                </span>
                ,{" "}
                <span
                  data-verb=""
                  style={{
                    display: "inline-block",
                    padding: "0 0.08em",
                    margin: "0 -0.08em",
                    borderRadius: "var(--radius-xs)",
                    background: activeVerbIndex === 1 ? "var(--mudra-signal-yellow)" : "transparent",
                    color: activeVerbIndex === 1 ? "#262626" : "inherit",
                    transition: "background 240ms ease, color 240ms ease",
                  }}
                >
                  settle
                </span>
                ,
              </span>
            </span>

            {/* Line 2 */}
            <span style={{ display: "block", overflow: "hidden" }}>
              <span data-hline="" style={{ display: "block", paddingBottom: "0.06em" }}>
                and{" "}
                <span
                  data-verb=""
                  style={{
                    display: "inline-block",
                    padding: "0 0.08em",
                    margin: "0 -0.08em",
                    borderRadius: "var(--radius-xs)",
                    background: activeVerbIndex === 2 ? "var(--mudra-signal-yellow)" : "transparent",
                    color: activeVerbIndex === 2 ? "#262626" : "inherit",
                    transition: "background 240ms ease, color 240ms ease",
                  }}
                >
                  master
                </span>
              </span>
            </span>

            {/* Line 3 */}
            <span style={{ display: "block", overflow: "hidden" }}>
              <span data-hline="" style={{ display: "block", paddingBottom: "0.06em" }}>
                NSE 50 equities
              </span>
            </span>

            {/* Line 4 */}
            <span style={{ display: "block", overflow: "hidden" }}>
              <span data-hline="" style={{ display: "block", paddingBottom: "0.12em" }}>
                without risk
              </span>
            </span>
          </h1>
        </div>

        {/* CTA & Scroll Cue Row */}
        <div
          data-spine-front=""
          data-g=""
          style={{
            marginTop: "clamp(32px, 5vh, 64px)",
            alignItems: "end",
          }}
        >
          {/* Action Buttons */}
          <div data-col="half" style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
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
                background: "var(--text-heading)",
                color: "var(--surface-canvas)",
                fontSize: "16px",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                transition: "opacity 160ms ease, transform 160ms ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              <span>Start Trading · ₹1,00,000</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--mudra-sky-blue)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>

            <Link
              href="/explore"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                height: "56px",
                padding: "0 24px",
                borderRadius: "var(--radius-pill)",
                border: "1.5px solid var(--border-hairline)",
                background: "var(--surface-card)",
                color: "var(--text-heading)",
                fontSize: "15px",
                fontWeight: 600,
                textDecoration: "none",
                cursor: "pointer",
                transition: "border-color 160ms ease",
              }}
            >
              <span>Explore 50 Stocks</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="7" y1="17" x2="17" y2="7" />
                <polyline points="7 7 17 7 17 17" />
              </svg>
            </Link>
          </div>

          {/* Scroll Cue */}
          <div
            data-col="half"
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "flex-end",
            }}
          >
            <a
              data-scroll-cue=""
              href="#instruments-wall"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                color: "var(--text-muted)",
                fontSize: "13px",
                fontWeight: 500,
                letterSpacing: "0.07em",
                textTransform: "uppercase",
                textDecoration: "none",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <polyline points="19 12 12 19 5 12" />
              </svg>
              Scroll to instruments
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}


