"use client";

import React, { useEffect, useRef, useState } from "react";
import { MudraIconMark } from "./MudraLogos";

export function MudraImpact() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const srcRef = useRef<HTMLDivElement>(null);
  const hubRef = useRef<HTMLDivElement>(null);
  const t0Ref = useRef<HTMLDivElement>(null);
  const t1Ref = useRef<HTMLDivElement>(null);
  const t2Ref = useRef<HTMLDivElement>(null);
  const t3Ref = useRef<HTMLDivElement>(null);

  const [svgPaths, setSvgPaths] = useState<{ d: string; color: string; len: number }[]>([]);
  const [isDrawn, setIsDrawn] = useState(false);

  // Measure nodes and calculate orthogonal SVG paths matching route() algorithm
  useEffect(() => {
    const updatePaths = () => {
      if (!containerRef.current || !srcRef.current || !hubRef.current || !t0Ref.current || !t1Ref.current || !t2Ref.current || !t3Ref.current) return;

      const box = containerRef.current.getBoundingClientRect();
      if (!box.width || !box.height) return;

      const rel = (el: HTMLElement) => {
        const r = el.getBoundingClientRect();
        return {
          l: r.left - box.left,
          r: r.right - box.left,
          cx: r.left + r.width / 2 - box.left,
          cy: r.top + r.height / 2 - box.top,
        };
      };

      const S = rel(srcRef.current);
      const H = rel(hubRef.current);
      const targets = [t0Ref.current, t1Ref.current, t2Ref.current, t3Ref.current].map(rel);

      const radius = 16;

      // Orthogonal routing function
      const route = (points: [number, number][], r: number) => {
        if (!points.length) return "";
        let d = `M ${points[0][0]} ${points[0][1]}`;
        for (let i = 1; i < points.length - 1; i++) {
          const p = points[i - 1], c = points[i], n = points[i + 1];
          const inD = [Math.sign(c[0] - p[0]), Math.sign(c[1] - p[1])];
          const outD = [Math.sign(n[0] - c[0]), Math.sign(n[1] - c[1])];
          const runIn = Math.abs(c[0] - p[0]) + Math.abs(c[1] - p[1]);
          const runOut = Math.abs(n[0] - c[0]) + Math.abs(n[1] - c[1]);
          const rad = Math.min(r, runIn / 2, runOut / 2);
          d += ` L ${c[0] - inD[0] * rad} ${c[1] - inD[1] * rad}`;
          d += ` Q ${c[0]} ${c[1]} ${c[0] + outD[0] * rad} ${c[1] + outD[1] * rad}`;
        }
        const last = points[points.length - 1];
        return `${d} L ${last[0]} ${last[1]}`;
      };

      const trunkX = S.r + Math.max(16, (H.l - S.r) / 2);
      const trunkPath = route([[S.r, S.cy], [trunkX, S.cy], [trunkX, H.cy], [H.l, H.cy]], radius);

      const hues = [
        "var(--Mudra-sky-blue)",
        "var(--Mudra-link-green)",
        "var(--Mudra-signal-yellow)",
        "var(--Mudra-node-red)",
      ];

      const minTargetLeft = Math.min(...targets.map((t) => t.l));
      const branchX = H.r + Math.max(20, (minTargetLeft - H.r) / 2);

      const computed: { d: string; color: string; len: number }[] = [
        { d: trunkPath, color: "var(--text-heading)", len: 300 },
      ];

      targets.forEach((T, i) => {
        const branchPath = route([[H.r, H.cy], [branchX, H.cy], [branchX, T.cy], [T.l, T.cy]], radius);
        computed.push({ d: branchPath, color: hues[i], len: 350 });
      });

      setSvgPaths(computed);
    };

    updatePaths();
    window.addEventListener("resize", updatePaths);

    // Intersection observer to animate drawing
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsDrawn(true);
        }
      },
      { threshold: 0.3 }
    );

    if (containerRef.current) observer.observe(containerRef.current);

    return () => {
      window.removeEventListener("resize", updatePaths);
      observer.disconnect();
    };
  }, []);

  return (
    <section
      data-screen-label="05 Mudra Engine"
      style={{
        padding: "var(--section) 0",
      }}
    >
      <div data-wrap="">
        {/* Eyebrow */}
        <div data-g="" style={{ marginBottom: "var(--section-half)" }}>
          <div data-col="wide">
            <span className="Mudra-eyebrow">05 / the mudra engine</span>
          </div>
        </div>

        {/* Top 2-Column: Headline + Diagram */}
        <div data-g="" style={{ alignItems: "center", rowGap: "var(--section-half)" }}>
          {/* Left Column Copy */}
          <div
            data-col="half"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "32px",
              paddingRight: "clamp(0px, min(3vw, 39.8px), 64px)",
            }}
          >
            <h2
              data-reveal=""
              style={{
                margin: 0,
                fontSize: "clamp(32px, min(4.4vw, 58.4px), 76px)",
                fontWeight: "var(--weight-display)",
                letterSpacing: "var(--tracking-display)",
                lineHeight: 0.98,
                color: "var(--text-heading)",
              }}
            >
              We sit between your order intent and the closing bell
            </h2>
            <p
              data-reveal=""
              style={{
                margin: 0,
                fontSize: "clamp(17px, min(1.3vw, 17.3px), 20px)",
                lineHeight: 1.6,
                color: "var(--text-muted)",
                maxWidth: "62ch",
              }}
            >
              Every trade on Mudra is validated against Indian market rules. Your orders don't fill fantasy intra-day prices â€” they queue for the official NSE 15:30 IST closing auction.
            </p>
            <p
              data-reveal=""
              style={{
                margin: 0,
                fontSize: "clamp(17px, min(1.3vw, 17.3px), 20px)",
                lineHeight: 1.6,
                color: "var(--text-muted)",
                maxWidth: "62ch",
              }}
            >
              Our ledger reserves a 10% headroom buffer and accounts for 0.1% simulated brokerage fees, ensuring mathematically sound capital management without floating-point error.
            </p>
          </div>

          {/* Right Column: Connection Diagram */}
          <div
            ref={containerRef}
            data-conn=""
            data-spine-wp="illo"
            data-spine-under=""
            data-col="half"
            style={{
              position: "relative",
              zIndex: 6,
              padding: "clamp(28px, min(3vw, 39.8px), 56px) clamp(32px, min(3.4vw, 45.2px), 56px)",
              background: "var(--surface-card)",
              borderRadius: "var(--radius-card-lg)",
            }}
          >
            {/* SVG Routing Overlay */}
            <svg
              ref={svgRef}
              data-conn-svg=""
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                overflow: "visible",
                pointerEvents: "none",
              }}
            >
              {svgPaths.map((sg, i) => (
                <path
                  key={i}
                  d={sg.d}
                  fill="none"
                  stroke={sg.color}
                  strokeWidth="4"
                  strokeLinecap="round"
                  style={{
                    strokeDasharray: 500,
                    strokeDashoffset: isDrawn ? 0 : 500,
                    transition: `stroke-dashoffset 900ms cubic-bezier(0.16, 1, 0.3, 1) ${i * 120}ms`,
                  }}
                />
              ))}
            </svg>

            <div
              style={{
                position: "relative",
                display: "grid",
                gridTemplateColumns: "auto minmax(24px, 1fr) auto minmax(24px, 1fr) auto",
                alignItems: "center",
                width: "100%",
              }}
            >
              {/* 1. Source: Order Intent */}
              <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div
                  ref={srcRef}
                  data-node="source"
                  style={{
                    width: "clamp(56px, min(5vw, 66.4px), 84px)",
                    height: "clamp(56px, min(5vw, 66.4px), 84px)",
                    borderRadius: "999px",
                    border: "4px solid var(--text-heading)",
                    background: "var(--surface-card)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--text-heading)",
                  }}
                >
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="20" x2="12" y2="10" />
                    <line x1="18" y1="20" x2="18" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="16" />
                  </svg>
                </div>
                <span
                  style={{
                    position: "absolute",
                    top: "calc(100% + 12px)",
                    left: "50%",
                    transform: "translateX(-50%)",
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: "0.07em",
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                    textAlign: "center",
                    whiteSpace: "nowrap",
                  }}
                >
                  Order Intent
                </span>
              </div>

              <div aria-hidden="true" />

              {/* 2. Hub: Mudra Engine Hub */}
              <div
                ref={hubRef}
                data-node="hub"
                style={{
                  width: "clamp(56px, min(5vw, 66.4px), 84px)",
                  height: "clamp(56px, min(5vw, 66.4px), 84px)",
                  borderRadius: "999px",
                  border: "4px solid var(--text-heading)",
                  background: "var(--surface-card)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "clamp(13px, min(1.1vw, 14.6px), 19px)",
                }}
              >
                <MudraIconMark fill="var(--text-heading)" />
              </div>

              <div aria-hidden="true" />

              {/* 3. Four Settlement Targets */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "clamp(38px, min(4.4vw, 58.4px), 62px)",
                  alignItems: "center",
                  paddingBottom: "26px",
                }}
              >
                {/* 15:30 IST Cutoff */}
                <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div
                    ref={t0Ref}
                    data-node="t0"
                    style={{
                      flex: "none",
                      width: "clamp(56px, min(5vw, 66.4px), 84px)",
                      height: "clamp(56px, min(5vw, 66.4px), 84px)",
                      borderRadius: "999px",
                      border: "4px solid var(--Mudra-sky-blue)",
                      background: "var(--surface-card)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "clamp(13px, min(1.1vw, 14.6px), 19px)",
                    }}
                  >
                    <span style={{ fontSize: "12px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--Mudra-sky-blue)" }}>15:30</span>
                  </div>
                  <span
                    style={{
                      position: "absolute",
                      top: "calc(100% + 10px)",
                      left: "50%",
                      transform: "translateX(-50%)",
                      fontSize: "11px",
                      fontWeight: 600,
                      letterSpacing: "0.07em",
                      textTransform: "uppercase",
                      color: "var(--text-muted)",
                      textAlign: "center",
                      whiteSpace: "nowrap",
                    }}
                  >
                    IST CUTOFF
                  </span>
                </div>

                {/* 10% Headroom Buffer */}
                <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div
                    ref={t1Ref}
                    data-node="t1"
                    style={{
                      flex: "none",
                      width: "clamp(56px, min(5vw, 66.4px), 84px)",
                      height: "clamp(56px, min(5vw, 66.4px), 84px)",
                      borderRadius: "999px",
                      border: "4px solid var(--Mudra-link-green)",
                      background: "var(--surface-card)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "clamp(13px, min(1.1vw, 14.6px), 19px)",
                    }}
                  >
                    <span style={{ fontSize: "14px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--Mudra-link-green)" }}>10%</span>
                  </div>
                  <span
                    style={{
                      position: "absolute",
                      top: "calc(100% + 10px)",
                      left: "50%",
                      transform: "translateX(-50%)",
                      fontSize: "11px",
                      fontWeight: 600,
                      letterSpacing: "0.07em",
                      textTransform: "uppercase",
                      color: "var(--text-muted)",
                      textAlign: "center",
                      whiteSpace: "nowrap",
                    }}
                  >
                    HEADROOM BUFFER
                  </span>
                </div>

                {/* NSE Official Close */}
                <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div
                    ref={t2Ref}
                    data-node="t2"
                    style={{
                      flex: "none",
                      width: "clamp(56px, min(5vw, 66.4px), 84px)",
                      height: "clamp(56px, min(5vw, 66.4px), 84px)",
                      borderRadius: "999px",
                      border: "4px solid var(--Mudra-signal-yellow)",
                      background: "var(--surface-card)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "clamp(13px, min(1.1vw, 14.6px), 19px)",
                    }}
                  >
                    <span style={{ fontSize: "13px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--Mudra-signal-yellow)" }}>NSE</span>
                  </div>
                  <span
                    style={{
                      position: "absolute",
                      top: "calc(100% + 10px)",
                      left: "50%",
                      transform: "translateX(-50%)",
                      fontSize: "11px",
                      fontWeight: 600,
                      letterSpacing: "0.07em",
                      textTransform: "uppercase",
                      color: "var(--text-muted)",
                      textAlign: "center",
                      whiteSpace: "nowrap",
                    }}
                  >
                    OFFICIAL CLOSE
                  </span>
                </div>

                {/* Integer Paise Ledger */}
                <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div
                    ref={t3Ref}
                    data-node="t3"
                    style={{
                      flex: "none",
                      width: "clamp(56px, min(5vw, 66.4px), 84px)",
                      height: "clamp(56px, min(5vw, 66.4px), 84px)",
                      borderRadius: "999px",
                      border: "4px solid var(--Mudra-node-red)",
                      background: "var(--surface-card)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "clamp(13px, min(1.1vw, 14.6px), 19px)",
                    }}
                  >
                    <span style={{ fontSize: "15px", fontWeight: 700, color: "var(--Mudra-node-red)" }}>₹</span>
                  </div>
                  <span
                    style={{
                      position: "absolute",
                      top: "calc(100% + 10px)",
                      left: "50%",
                      transform: "translateX(-50%)",
                      fontSize: "11px",
                      fontWeight: 600,
                      letterSpacing: "0.07em",
                      textTransform: "uppercase",
                      color: "var(--text-muted)",
                      textAlign: "center",
                      whiteSpace: "nowrap",
                    }}
                  >
                    PAISE LEDGER
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom 3 Feature Cards */}
        <div
          data-g=""
          style={{
            marginTop: "var(--section-half)",
            rowGap: "var(--gutter)",
          }}
        >
          {/* Card 01 (Sky Blue hover) */}
          <div
            data-col="third"
            data-reveal=""
            className="hover-card-sky"
            style={{
              background: "var(--surface-card)",
              borderRadius: "var(--radius-card-lg)",
              padding: "clamp(28px, min(3vw, 39.8px), 48px)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "clamp(48px, min(8vw, 106.2px), 140px)",
              minHeight: "clamp(300px, min(30vw, 398.4px), 520px)",
              transition: "background 220ms ease, color 220ms ease",
              cursor: "pointer",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "48px",
                height: "48px",
                borderRadius: "999px",
                border: "2px solid currentColor",
                fontSize: "15px",
                fontWeight: 600,
              }}
            >
              01
            </span>
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: "clamp(26px, min(2.7vw, 35.9px), 46px)",
                  fontWeight: "var(--weight-heading)",
                  letterSpacing: "var(--tracking-heading)",
                  lineHeight: 1,
                  color: "inherit",
                }}
              >
                Next-close settlement,
                <br />
                zero fantasy fills
              </h3>
              <p
                style={{
                  margin: "16px 0 0 0",
                  fontSize: "clamp(15px, min(1.1vw, 14.6px), 18px)",
                  lineHeight: 1.55,
                  color: "inherit",
                }}
              >
                Orders placed before 15:30 IST execute at the official closing print. No exploiting 2-minute latency.
              </p>
            </div>
          </div>

          {/* Card 02 (Signal Yellow hover) */}
          <div
            data-col="third"
            data-reveal=""
            className="hover-card-yellow"
            style={{
              background: "var(--surface-card)",
              borderRadius: "var(--radius-card-lg)",
              padding: "clamp(28px, min(3vw, 39.8px), 48px)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "clamp(48px, min(8vw, 106.2px), 140px)",
              minHeight: "clamp(300px, min(30vw, 398.4px), 520px)",
              transition: "background 220ms ease, color 220ms ease",
              cursor: "pointer",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "48px",
                height: "48px",
                borderRadius: "999px",
                border: "2px solid currentColor",
                fontSize: "15px",
                fontWeight: 600,
              }}
            >
              02
            </span>
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: "clamp(26px, min(2.7vw, 35.9px), 46px)",
                  fontWeight: "var(--weight-heading)",
                  letterSpacing: "var(--tracking-heading)",
                  lineHeight: 1,
                  color: "inherit",
                }}
              >
                Immutable integer
                <br />
                paise balance
              </h3>
              <p
                style={{
                  margin: "16px 0 0 0",
                  fontSize: "clamp(15px, min(1.1vw, 14.6px), 18px)",
                  lineHeight: 1.55,
                  color: "inherit",
                }}
              >
                Every cash debit, stock allotment, and 0.1% simulated fee is stored in exact paise with zero float drift.
              </p>
            </div>
          </div>

          {/* Card 03 (Link Green hover) */}
          <div
            data-col="third"
            data-reveal=""
            className="hover-card-green"
            style={{
              background: "var(--surface-card)",
              borderRadius: "var(--radius-card-lg)",
              padding: "clamp(28px, min(3vw, 39.8px), 48px)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "clamp(48px, min(8vw, 106.2px), 140px)",
              minHeight: "clamp(300px, min(30vw, 398.4px), 520px)",
              transition: "background 220ms ease, color 220ms ease",
              cursor: "pointer",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "48px",
                height: "48px",
                borderRadius: "999px",
                border: "2px solid currentColor",
                fontSize: "15px",
                fontWeight: 600,
              }}
            >
              03
            </span>
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: "clamp(26px, min(2.7vw, 35.9px), 46px)",
                  fontWeight: "var(--weight-heading)",
                  letterSpacing: "var(--tracking-heading)",
                  lineHeight: 1,
                  color: "inherit",
                }}
              >
                100% explainable
                <br />
                P&amp;L and risk
              </h3>
              <p
                style={{
                  margin: "16px 0 0 0",
                  fontSize: "clamp(15px, min(1.1vw, 14.6px), 18px)",
                  lineHeight: 1.55,
                  color: "inherit",
                }}
              >
                Audit your realized returns, average acquisition prices, and headroom buffer with total mathematical clarity.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


