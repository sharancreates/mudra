"use client";

import React, { useState } from "react";
import Link from "next/link";

interface MudraMenuProps {
  isOpen: boolean;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onClose: () => void;
}

export function MudraMenu({
  isOpen,
  theme,
  onToggleTheme,
  onClose,
}: MudraMenuProps) {
  const [activeField, setActiveField] = useState<string | null>(null);

  const menuItems = [
    { num: "01", label: "Home", href: "/", field: "blue", color: "var(--accent-type-blue)" },
    { num: "02", label: "Explore Market", href: "/explore", field: "yellow", color: "var(--accent-type-yellow)" },
    { num: "03", label: "Portfolio", href: "/dashboard", field: "green", color: "var(--accent-type-green)" },
    { num: "04", label: "Trade Stock", href: "/stock/RELIANCE", field: "red", color: "var(--mudra-node-red)" },
    { num: "05", label: "Leaderboard", href: "/leaderboard", field: "yellow", color: "var(--mudra-signal-yellow)" },
  ];

  const getFieldBg = () => {
    switch (activeField) {
      case "blue": return "var(--mudra-sky-blue)";
      case "yellow": return "var(--mudra-signal-yellow)";
      case "green": return "var(--mudra-link-green)";
      case "red": return "var(--mudra-node-red)";
      default: return "var(--surface-card)";
    }
  };

  const altTheme = theme === "dark" ? "light" : "dark";

  return (
    <div
      data-menu=""
      data-theme={altTheme}
      role="dialog"
      aria-modal="true"
      aria-label="Site menu"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 110,
        background: "var(--surface-canvas)",
        color: "var(--text-body)",
        transform: isOpen ? "translateY(0)" : "translateY(-100%)",
        visibility: isOpen ? "visible" : "hidden",
        display: "flex",
        flexDirection: "column",
        transition: "transform 800ms cubic-bezier(0.16, 1, 0.3, 1), visibility 800ms",
      }}
    >
      {/* 2-Column Grid */}
      <div
        data-menu-cols=""
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr",
          minHeight: 0,
        }}
      >
        <nav
          data-menu-list=""
          onMouseLeave={() => setActiveField(null)}
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: "4px",
            padding: "112px var(--margin) 24px var(--margin)",
            minHeight: 0,
            overflowY: "auto",
          }}
        >
          {menuItems.map((item, i) => (
            <Link
              key={item.num}
              data-menu-item=""
              data-field={item.field}
              href={item.href}
              onClick={() => onClose()}
              onMouseEnter={() => setActiveField(item.field)}
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: "24px",
                padding: "8px 0",
                color: activeField && activeField !== item.field ? "var(--text-faint)" : "var(--text-heading)",
                transition: "color 200ms linear, transform 400ms cubic-bezier(0.16, 1, 0.3, 1), opacity 400ms ease",
                transform: isOpen ? "translateY(0)" : "translateY(24px)",
                opacity: isOpen ? 1 : 0,
                transitionDelay: isOpen ? `${200 + i * 60}ms` : "0ms",
                textDecoration: "none",
              }}
            >
              <span
                data-menu-num=""
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  letterSpacing: "0.07em",
                  color: item.color,
                }}
              >
                {item.num}
              </span>
              <span
                style={{
                  fontSize: "clamp(28px, min(min(6vw, 80px), 8vh), 86px)",
                  fontWeight: "var(--weight-display)",
                  letterSpacing: "var(--tracking-display)",
                  lineHeight: 1.02,
                }}
              >
                {item.label}
              </span>
            </Link>
          ))}
        </nav>

        {/* Right side canvas reacting to menu hover */}
        <div
          data-menu-field=""
          style={{
            background: getFieldBg(),
            transition: "background 220ms linear",
          }}
        />
      </div>

      {/* Bottom Metadata & Theme Toggle */}
      <div
        data-wrap=""
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
          gap: "24px",
          paddingTop: "32px",
          paddingBottom: "32px",
          borderTop: "1px solid var(--border-hairline)",
        }}
      >
        <div>
          <div className="mudra-eyebrow">Virtual Capital</div>
          <span style={{ display: "block", marginTop: "8px", fontSize: "15px", fontWeight: 600, color: "var(--text-heading)" }}>
            ₹1,00,000.00 Credit
          </span>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>10,000,000 integer paise</span>
        </div>

        <div>
          <div className="mudra-eyebrow">Settlement Cutoff</div>
          <span style={{ display: "block", marginTop: "8px", fontSize: "15px", color: "var(--text-body)" }}>
            15:30 IST Daily Close
          </span>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Next-close execution model</span>
        </div>

        <div>
          <div className="mudra-eyebrow">Sandbox Policy</div>
          <p style={{ margin: "8px 0 0 0", fontSize: "14px", lineHeight: 1.4, color: "var(--text-muted)" }}>
            Educational simulation.
            <br />
            No real broker or deposit.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <button
            data-theme-toggle=""
            onClick={onToggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "48px",
              height: "48px",
              padding: 0,
              border: "2px solid var(--border-strong)",
              borderRadius: "999px",
              background: "transparent",
              color: "var(--text-body)",
              cursor: "pointer",
            }}
          >
            {theme === "dark" ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

