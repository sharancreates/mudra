import React from "react";

// Mudra Primary Brand Lockup (Mudra Swiss Style: Geometric Symbol + Wordmark)
export function MudraLogoPrimary({ className = "", style = {} }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`flex items-center gap-3 ${className}`} style={{ height: "32px", display: "inline-flex", ...style }}>
      {/* Geometric Rupee Symbol Node */}
      <div
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "999px",
          border: "2.5px solid currentColor",
          background: "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: "17px",
          lineHeight: 1,
          fontFamily: "'IBM Plex Sans', sans-serif",
          color: "inherit",
          flexShrink: 0,
        }}
      >
        ₹
      </div>
      {/* Brand Typography */}
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <span
          style={{
            fontSize: "20px",
            fontWeight: 700,
            letterSpacing: "-0.035em",
            lineHeight: 1,
            color: "currentColor",
            fontFamily: "'IBM Plex Sans', sans-serif",
          }}
        >
          Mudra
        </span>
        <span
          style={{
            fontSize: "10px",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
            lineHeight: 1,
            marginTop: "3px",
            fontFamily: "'IBM Plex Mono', monospace",
          }}
        >
          Equities Lab
        </span>
      </div>
    </div>
  );
}

// Client / Partner Logos & Badges
export function NseLogoBadge({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 font-mono text-xs font-bold ${className}`} style={{ letterSpacing: "0.05em" }}>
      <span style={{ padding: "3px 8px", borderRadius: "4px", background: "var(--mudra-signal-yellow)", color: "#262626" }}>NSE</span>
      <span style={{ color: "var(--text-muted)" }}>National Stock Exchange</span>
    </div>
  );
}

export function BseLogoBadge({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 font-mono text-xs font-bold ${className}`} style={{ letterSpacing: "0.05em" }}>
      <span style={{ padding: "3px 8px", borderRadius: "4px", background: "var(--mudra-sky-blue)", color: "#262626" }}>BSE</span>
      <span style={{ color: "var(--text-muted)" }}>Bombay Stock Exchange</span>
    </div>
  );
}

export function MudraIconMark({ fill = "currentColor", size = 28 }: { fill?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={fill} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 7h8" />
      <path d="M8 11h5.5a2.5 2.5 0 0 0 0-5H8v12" />
      <path d="m11 12 4 6" />
    </svg>
  );
}


