"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import instrumentsData from "@/mocks/instruments.json";
import { formatINR } from "@/lib/formatters";

interface InstrumentItem {
  id: string;
  symbol: string;
  name: string;
  exchange: string;
  sector: string;
  last_close_paise: number;
  change_bps: number;
  as_of: string;
  tradable: boolean;
}

export function MudraConnectorWall() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const rowARef = useRef<HTMLDivElement>(null);
  const rowBRef = useRef<HTMLDivElement>(null);

  const instruments: InstrumentItem[] = instrumentsData as InstrumentItem[];

  // Split into two sets for row A and row B
  const half = Math.ceil(instruments.length / 2);
  const setA = instruments.slice(0, half);
  const setB = instruments.slice(half);

  // Marquee scroll physics matching original MudraDriver
  useEffect(() => {
    let offset0 = 0;
    let offset1 = 0;
    let lastT = performance.now();
    let animationFrameId: number;

    const row0 = rowARef.current;
    const row1 = rowBRef.current;

    if (row1) {
      offset1 = -row1.scrollWidth / 4;
    }

    const animate = (t: number) => {
      const dt = Math.min(60, t - lastT);
      lastT = t;

      if (row0 && row1) {
        const speed = 0.035 * dt;
        const w0 = row0.scrollWidth / 2;
        const w1 = row1.scrollWidth / 2;

        offset0 -= speed;
        if (offset0 <= -w0) offset0 += w0;

        offset1 += speed;
        if (offset1 >= 0) offset1 -= w1;

        row0.style.transform = `translate3d(${offset0}px, 0, 0)`;
        row1.style.transform = `translate3d(${offset1}px, 0, 0)`;
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Row A: first half duplicated for seamless loop
  const rowA = [...setA, ...setA];
  // Row B: second half duplicated for seamless loop
  const rowB = [...setB, ...setB];

  return (
    <section
      id="instruments-wall"
      data-screen-label="02 Instruments wall"
      style={{
        position: "relative",
        padding: "var(--section) 0",
        overflow: "hidden",
      }}
    >
      <div data-wrap="" style={{ paddingBottom: "40px" }}>
        <span className="mudra-eyebrow">02 / 50 nse instruments, live simulated close</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Row 0 Marquee */}
        <div style={{ overflow: "hidden" }}>
          <div
            ref={rowARef}
            data-marquee="0"
            style={{
              display: "flex",
              gap: "16px",
              width: "max-content",
              willChange: "transform",
            }}
          >
            {rowA.map((item, idx) => {
              const cardId = `row0-${idx}-${item.symbol}`;
              const isHovered = hoveredCard === cardId;
              const hasHover = hoveredCard !== null;
              const isPositive = item.change_bps >= 0;
              const pctChange = (item.change_bps / 100).toFixed(2);

              return (
                <Link
                  key={cardId}
                  href={`/stock/${item.symbol}`}
                  data-logo-cell=""
                  data-spine-under=""
                  onMouseEnter={() => setHoveredCard(cardId)}
                  onMouseLeave={() => setHoveredCard(null)}
                  style={{
                    position: "relative",
                    flex: "none",
                    width: "clamp(220px, min(18vw, 260px), 320px)",
                    height: "clamp(120px, 14vh, 160px)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    padding: "20px 24px",
                    background: "var(--surface-card)",
                    borderRadius: "var(--radius-card)",
                    opacity: hasHover ? (isHovered ? 1 : 0.3) : 1,
                    transition: "opacity 180ms linear, transform 180ms ease",
                    cursor: "pointer",
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: "100%" }}>
                    <div>
                      <span
                        style={{
                          display: "block",
                          fontSize: "17px",
                          fontWeight: 700,
                          letterSpacing: "-0.01em",
                          color: "var(--text-heading)",
                        }}
                      >
                        {item.symbol}
                      </span>
                      <span
                        style={{
                          display: "block",
                          fontSize: "12px",
                          color: "var(--text-muted)",
                          marginTop: "2px",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          maxWidth: "130px",
                        }}
                      >
                        {item.name}
                      </span>
                    </div>

                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        padding: "3px 8px",
                        borderRadius: "var(--radius-xs)",
                        background: isPositive ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
                        color: isPositive ? "#10b981" : "#ef4444",
                      }}
                    >
                      {isPositive ? `+${pctChange}%` : `${pctChange}%`}
                    </span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", width: "100%" }}>
                    <span
                      style={{
                        fontSize: "17px",
                        fontWeight: 700,
                        fontFamily: "var(--font-mono)",
                        color: "var(--text-heading)",
                      }}
                    >
                      {formatINR(item.last_close_paise)}
                    </span>

                    <span className="mudra-eyebrow" style={{ fontSize: "11px" }}>
                      {item.sector}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Row 1 Marquee */}
        <div style={{ overflow: "hidden" }}>
          <div
            ref={rowBRef}
            data-marquee="1"
            style={{
              display: "flex",
              gap: "16px",
              width: "max-content",
              willChange: "transform",
            }}
          >
            {rowB.map((item, idx) => {
              const cardId = `row1-${idx}-${item.symbol}`;
              const isHovered = hoveredCard === cardId;
              const hasHover = hoveredCard !== null;
              const isPositive = item.change_bps >= 0;
              const pctChange = (item.change_bps / 100).toFixed(2);

              return (
                <Link
                  key={cardId}
                  href={`/stock/${item.symbol}`}
                  data-logo-cell=""
                  data-spine-under=""
                  onMouseEnter={() => setHoveredCard(cardId)}
                  onMouseLeave={() => setHoveredCard(null)}
                  style={{
                    position: "relative",
                    flex: "none",
                    width: "clamp(220px, min(18vw, 260px), 320px)",
                    height: "clamp(120px, 14vh, 160px)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    padding: "20px 24px",
                    background: "var(--surface-card)",
                    borderRadius: "var(--radius-card)",
                    opacity: hasHover ? (isHovered ? 1 : 0.3) : 1,
                    transition: "opacity 180ms linear, transform 180ms ease",
                    cursor: "pointer",
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: "100%" }}>
                    <div>
                      <span
                        style={{
                          display: "block",
                          fontSize: "17px",
                          fontWeight: 700,
                          letterSpacing: "-0.01em",
                          color: "var(--text-heading)",
                        }}
                      >
                        {item.symbol}
                      </span>
                      <span
                        style={{
                          display: "block",
                          fontSize: "12px",
                          color: "var(--text-muted)",
                          marginTop: "2px",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          maxWidth: "130px",
                        }}
                      >
                        {item.name}
                      </span>
                    </div>

                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        padding: "3px 8px",
                        borderRadius: "var(--radius-xs)",
                        background: isPositive ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
                        color: isPositive ? "#10b981" : "#ef4444",
                      }}
                    >
                      {isPositive ? `+${pctChange}%` : `${pctChange}%`}
                    </span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", width: "100%" }}>
                    <span
                      style={{
                        fontSize: "17px",
                        fontWeight: 700,
                        fontFamily: "var(--font-mono)",
                        color: "var(--text-heading)",
                      }}
                    >
                      {formatINR(item.last_close_paise)}
                    </span>

                    <span className="mudra-eyebrow" style={{ fontSize: "11px" }}>
                      {item.sector}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}


