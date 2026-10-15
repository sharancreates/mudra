"use client";

import React from "react";
import Link from "next/link";
import { MudraLogoPrimary } from "./MudraLogos";
import { MarketStatusBadge } from "@/components/common/MarketStatusBadge";

interface MudraHeaderProps {
  theme: "light" | "dark";
  menuOpen: boolean;
  onToggleMenu: () => void;
  headerPolarity: "light" | "dark";
  onOpenAuth: () => void;
  user: { email: string; displayName: string } | null;
  activeNav?: "home" | "explore" | "dashboard" | "stock" | "leaderboard";
  onSignOut?: () => void;
}

export function MudraHeader({
  theme,
  menuOpen,
  onToggleMenu,
  headerPolarity,
  onOpenAuth,
  user,
  activeNav = "home",
  onSignOut,
}: MudraHeaderProps) {
  // Dynamic polarity: when over dark sections, text is #FAFAF9; when over stone canvas, text is #262626
  const effectiveTheme = menuOpen ? (theme === "dark" ? "light" : "dark") : headerPolarity;
  const isDark = effectiveTheme === "dark";

  return (
    <header
      data-theme={effectiveTheme}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 130,
        background: "transparent",
        color: isDark ? "#FAFAF9" : "#262626",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
    >
      <div
        data-wrap=""
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: "16px",
          paddingBottom: "16px",
        }}
      >
        {/* Brand Logo Link */}
        <Link
          data-logo-slot=""
          href="/"
          aria-label="Mudra home"
          style={{
            display: "flex",
            alignItems: "center",
            textDecoration: "none",
            color: "inherit",
            transition: "transform 420ms cubic-bezier(0.16,1,0.3,1), opacity 260ms linear",
          }}
        >
          <MudraLogoPrimary style={{ color: isDark ? "#FAFAF9" : "#262626" }} />
        </Link>

        {/* Right Navigation & Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Market Status Badge (desktop) */}
          <div className="hidden md:block">
            <MarketStatusBadge isOpen={false} freshness="FRESH" asOfDate="09 Oct 2026" />
          </div>

          {/* Quick Direct Links */}
          <Link
            href="/explore"
            style={{
              fontSize: "14px",
              fontWeight: activeNav === "explore" ? 700 : 500,
              color: "inherit",
              textDecoration: "none",
              padding: "6px 14px",
              borderRadius: "var(--radius-pill)",
              background: activeNav === "explore" ? (isDark ? "rgba(250, 250, 249, 0.12)" : "rgba(38, 38, 38, 0.08)") : "transparent",
              transition: "all 160ms ease",
            }}
            className="hidden sm:inline-block hover:opacity-80"
          >
            Explore
          </Link>

          <Link
            href="/leaderboard"
            style={{
              fontSize: "14px",
              fontWeight: activeNav === "leaderboard" ? 700 : 500,
              color: "inherit",
              textDecoration: "none",
              padding: "6px 14px",
              borderRadius: "var(--radius-pill)",
              background: activeNav === "leaderboard" ? (isDark ? "rgba(250, 250, 249, 0.12)" : "rgba(38, 38, 38, 0.08)") : "transparent",
              transition: "all 160ms ease",
            }}
            className="hidden md:inline-block hover:opacity-80"
          >
            Leaderboard
          </Link>

          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Link
                href="/dashboard"
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#262626",
                  background: "var(--mudra-signal-yellow)",
                  textDecoration: "none",
                  padding: "8px 16px",
                  borderRadius: "var(--radius-pill)",
                  transition: "opacity 160ms ease",
                }}
                className="hover:opacity-90"
              >
                Portfolio
              </Link>
              <button
                type="button"
                onClick={onSignOut}
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "inherit",
                  background: isDark ? "rgba(250, 250, 249, 0.08)" : "rgba(38, 38, 38, 0.06)",
                  border: isDark ? "1px solid rgba(250, 250, 249, 0.2)" : "1px solid rgba(38, 38, 38, 0.15)",
                  padding: "7px 14px",
                  borderRadius: "var(--radius-pill)",
                  cursor: "pointer",
                  transition: "all 160ms ease",
                }}
                className="hidden sm:inline-block hover:opacity-80"
                title={`Signed in as ${user.displayName}`}
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: isDark ? "#262626" : "#FAFAF9",
                background: isDark ? "#FAFAF9" : "#262626",
                border: "none",
                padding: "8px 16px",
                borderRadius: "var(--radius-pill)",
                cursor: "pointer",
                transition: "opacity 160ms ease, transform 160ms ease",
              }}
              className="hover:opacity-90"
            >
              Sign In
            </button>
          )}

          {/* Circular Hamburger Toggle */}
          <button
            data-menu-toggle=""
            onClick={onToggleMenu}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            style={{
              position: "relative",
              flex: "none",
              width: "44px",
              height: "44px",
              borderRadius: "999px",
              border: "2px solid currentColor",
              background: isDark ? "rgba(24, 26, 29, 0.9)" : "var(--surface-canvas, #F0EDEA)",
              color: isDark ? "#FAFAF9" : "#262626",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 220ms ease, color 220ms ease",
            }}
          >
            <span
              data-bar="1"
              style={{
                position: "absolute",
                width: "16px",
                height: "2px",
                borderRadius: "999px",
                background: "currentColor",
                transform: menuOpen
                  ? "translateY(0px) rotate(45deg)"
                  : "translateY(-4px) rotate(0deg)",
                transition: "transform 320ms cubic-bezier(0.16,1,0.3,1)",
              }}
            />
            <span
              data-bar="2"
              style={{
                position: "absolute",
                width: "16px",
                height: "2px",
                borderRadius: "999px",
                background: "currentColor",
                transform: menuOpen
                  ? "translateY(0px) rotate(-45deg)"
                  : "translateY(4px) rotate(0deg)",
                transition: "transform 320ms cubic-bezier(0.16,1,0.3,1)",
              }}
            />
          </button>
        </div>
      </div>
    </header>
  );
}

