"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MudraHeader } from "./MudraHeader";
import { MudraMenu } from "./MudraMenu";
import { MudraFooter } from "./MudraFooter";
import { AuthModal } from "@/components/auth/AuthModal";
import { getSupabase } from "@/lib/supabase";

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
  const router = useRouter();
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

    // Subscribe to Supabase auth state changes (e.g. Google OAuth return)
    const supabase = getSupabase();
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const meta = session.user.user_metadata || {};
          const displayName =
            meta.pseudonym ||
            meta.full_name ||
            meta.name ||
            session.user.email?.split("@")[0] ||
            "MudraTrader";
          const authed = {
            email: session.user.email || "",
            displayName,
          };
          setUser(authed);
          try {
            localStorage.setItem("mudra_user", JSON.stringify(authed));
          } catch (e) {}
        }
      });

      const { data: authListener } = supabase.auth.onAuthStateChange(
        (event, session) => {
          if (session?.user && (event === "SIGNED_IN" || event === "USER_UPDATED")) {
            const meta = session.user.user_metadata || {};
            const displayName =
              meta.pseudonym ||
              meta.full_name ||
              meta.name ||
              session.user.email?.split("@")[0] ||
              "MudraTrader";
            const authed = {
              email: session.user.email || "",
              displayName,
            };
            setUser(authed);
            try {
              localStorage.setItem("mudra_user", JSON.stringify(authed));
            } catch (e) {}
            if (event === "SIGNED_IN") {
              router.push("/dashboard");
            }
          } else if (event === "SIGNED_OUT") {
            setUser(null);
            try {
              localStorage.removeItem("mudra_user");
            } catch (e) {}
          }
        }
      );

      return () => {
        authListener?.subscription?.unsubscribe();
      };
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
    router.push("/dashboard");
  };

  const handleSignOut = async () => {
    setUser(null);
    try {
      localStorage.removeItem("mudra_user");
    } catch (e) {}

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn("[MUDRA AUTH] Supabase signOut notice:", err);
      }
    }

    // Explicitly navigate to home ("/") upon sign-out
    router.push("/");
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
        onSignOut={handleSignOut}
      />

      {/* Fullscreen Overlay Menu */}
      <MudraMenu
        isOpen={menuOpen}
        theme={theme}
        onToggleTheme={toggleTheme}
        onClose={() => setMenuOpen(false)}
        user={user}
        onSignOut={handleSignOut}
        onOpenAuth={() => setAuthModalOpen(true)}
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

