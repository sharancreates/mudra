"use client";

import React, { useEffect, useState } from "react";
import { MudraHeader } from "@/components/mudra/MudraHeader";
import { MudraMenu } from "@/components/mudra/MudraMenu";
import { MudraHero } from "@/components/mudra/MudraHero";
import { MudraConnectorWall } from "@/components/mudra/MudraConnectorWall";
import { MudraWhoWeAre } from "@/components/mudra/MudraWhoWeAre";
import { MudraProblem } from "@/components/mudra/MudraProblem";
import { MudraImpact } from "@/components/mudra/MudraImpact";
import { MudraReasons } from "@/components/mudra/MudraReasons";
import { MudraClients } from "@/components/mudra/MudraClients";
import { MudraProof } from "@/components/mudra/MudraProof";
import { MudraFinalCTA } from "@/components/mudra/MudraFinalCTA";
import { MudraFooter } from "@/components/mudra/MudraFooter";
import { MudraSpine } from "@/components/mudra/MudraSpine";
import { MudraSnake } from "@/components/mudra/MudraSnake";
import { AuthModal } from "@/components/auth/AuthModal";

export default function MudraHomePage() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [menuOpen, setMenuOpen] = useState(false);
  const [headerPolarity, setHeaderPolarity] = useState<"light" | "dark">("light");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [user, setUser] = useState<{ email: string; displayName: string } | null>(null);

  // Load saved theme and user session on mount
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("mudra-theme");
      if (savedTheme === "dark" || savedTheme === "light") {
        setTheme(savedTheme);
        document.documentElement.setAttribute("data-theme", savedTheme);
      } else {
        document.documentElement.setAttribute("data-theme", "light");
      }

      const savedUser = localStorage.getItem("mudra_user");
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (e) {
      document.documentElement.setAttribute("data-theme", "light");
    }
  }, []);

  // Update data-theme on html when theme changes
  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try {
      localStorage.setItem("mudra-theme", next);
    } catch (e) {}
    document.documentElement.setAttribute("data-theme", next);
  };

  // Dynamically calculate header polarity based on section passing under it
  useEffect(() => {
    const updateHeaderPolarity = () => {
      const headerProbeY = 36; // Probe Y near top header
      const darkSections = document.querySelectorAll(
        'section[data-screen-label*="The problem"], section[data-screen-label*="Proof"], footer'
      );

      let isOverDark = false;
      darkSections.forEach((sec) => {
        const rect = sec.getBoundingClientRect();
        if (rect.top <= headerProbeY && rect.bottom >= headerProbeY) {
          isOverDark = true;
        }
      });

      if (theme === "dark") {
        setHeaderPolarity("dark");
      } else {
        setHeaderPolarity(isOverDark ? "dark" : "light");
      }
    };

    window.addEventListener("scroll", updateHeaderPolarity, { passive: true });
    updateHeaderPolarity();
    return () => window.removeEventListener("scroll", updateHeaderPolarity);
  }, [theme]);

  // Handle successful authentication
  const handleAuthSuccess = (authedUser: { email: string; displayName: string }) => {
    setUser(authedUser);
    try {
      localStorage.setItem("mudra_user", JSON.stringify(authedUser));
    } catch (e) {}
    setAuthModalOpen(false);
  };

  // Back to top helper
  const handleBackToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div
      data-mudra-home=""
      data-theme={theme}
      style={{
        position: "relative",
        background: "var(--surface-canvas)",
        color: "var(--text-body)",
        fontFamily: "var(--font-sans)",
        letterSpacing: "var(--tracking-body)",
        minHeight: "100vh",
      }}
    >
      {/* Background Orthogonal Spine Line */}
      <MudraSpine />

      {/* Interactive Geometric Swiss Snake Navigator */}
      <MudraSnake />

      {/* Fixed Header */}
      <MudraHeader
        theme={theme}
        menuOpen={menuOpen}
        onToggleMenu={() => setMenuOpen(!menuOpen)}
        headerPolarity={headerPolarity}
        onOpenAuth={() => setAuthModalOpen(true)}
        user={user}
      />

      {/* Fullscreen Overlay Menu */}
      <MudraMenu
        isOpen={menuOpen}
        theme={theme}
        onToggleTheme={toggleTheme}
        onClose={() => setMenuOpen(false)}
      />

      {/* Main Content Sections */}
      <main style={{ position: "relative" }}>
        {/* 01 / Hero */}
        <MudraHero onOpenAuth={() => setAuthModalOpen(true)} />

        {/* 02 / Connector Wall (NSE 50 Dual Marquee) */}
        <MudraConnectorWall />

        {/* 03 / What is Mudra */}
        <MudraWhoWeAre />

        {/* 04 / The Problem (Dark Block) */}
        <MudraProblem theme={theme} />

        {/* 05 / Mudra Settlement Engine (Interactive SVG Routing Diagram + Feature Cards) */}
        <MudraImpact />

        {/* 06 / Why Traders Choose Mudra (3 Color-Capped Cards) */}
        <MudraReasons />

        {/* 07 / Top Market Sectors (5 Blue-Chip Cards) */}
        <MudraClients />

        {/* 08 / Proof (Customer Quotes, Dark Block) */}
        <MudraProof theme={theme} />

        {/* 09 / Final CTA (Vivid Sky Blue Block) */}
        <MudraFinalCTA onOpenAuth={() => setAuthModalOpen(true)} />

        {/* Footer */}
        <MudraFooter theme={theme} onBackToTop={handleBackToTop} />
      </main>

      {/* Authentication & 18+ Acknowledgement Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}


