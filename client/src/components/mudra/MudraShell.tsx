"use client";

import React, { useEffect, useState } from "react";
import { MudraHeader } from "./MudraHeader";
import { MudraMenu } from "./MudraMenu";
import { MudraFooter } from "./MudraFooter";
import { AuthModal } from "@/components/auth/AuthModal";

interface MudraShellProps {
  children: React.ReactNode;
  headerPolarity?: "light" | "dark";
  activeNav?: "home" | "explore" | "dashboard" | "stock" | "leaderboard" | "terms";
}

export function MudraShell({
  children,
  headerPolarity = "light",
  activeNav = "home",
}: MudraShellProps) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [menuOpen, setMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [user, setUser] = useState<{ email: string; displayName: string } | null>(null);

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

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try {
      localStorage.setItem("mudra-theme", next);
    } catch (e) {}
    document.documentElement.setAttribute("data-theme", next);
  };

  const handleAuthSuccess = (authedUser: { email: string; displayName: string }) => {
    setUser(authedUser);
    try {
      localStorage.setItem("mudra_user", JSON.stringify(authedUser));
    } catch (e) {}
    setAuthModalOpen(false);
  };

  const handleBackToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div
      data-mudra-shell=""
      data-theme={theme}
      style={{
        position: "relative",
        background: "var(--surface-canvas)",
        color: "var(--text-body)",
        fontFamily: "var(--font-sans)",
        letterSpacing: "var(--tracking-body)",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >


      {/* Fixed Swiss Header */}
      <MudraHeader
        theme={theme}
        menuOpen={menuOpen}
        onToggleMenu={() => setMenuOpen(!menuOpen)}
        headerPolarity={headerPolarity}
        onOpenAuth={() => setAuthModalOpen(true)}
        user={user}
        activeNav={activeNav}
      />

      {/* Fullscreen Overlay Menu */}
      <MudraMenu
        isOpen={menuOpen}
        theme={theme}
        onToggleTheme={toggleTheme}
        onClose={() => setMenuOpen(false)}
      />

      {/* Page Content */}
      <main
        style={{
          position: "relative",
          flex: 1,
          paddingTop: "120px",
          paddingBottom: "80px",
        }}
      >
        {children}
      </main>

      {/* Global Swiss Footer */}
      <MudraFooter theme={theme} onBackToTop={handleBackToTop} />

      {/* Authentication & 18+ Acknowledgement Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}

