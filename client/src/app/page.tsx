"use client";

import React, { useState } from "react";
import Link from "next/link";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesExplainer } from "@/components/landing/FeaturesExplainer";
import { AuthModal } from "@/components/auth/AuthModal";
import { MarketStatusBadge } from "@/components/common/MarketStatusBadge";

export default function LandingPage() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [user, setUser] = useState<{ email: string; displayName: string } | null>(null);

  return (
    <div className="flex-1 flex flex-col w-full">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-graphite/95 backdrop-blur-md border-b border-yaleBlue/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <span className="w-8 h-8 rounded-lg bg-stormyTeal/20 border border-stormyTeal/50 flex items-center justify-center text-stormyTeal-light font-bold text-lg group-hover:border-stormyTeal transition-colors">
              ₹
            </span>
            <div className="flex flex-col">
              <span className="text-base font-bold text-white tracking-tight leading-none">
                Mudra
              </span>
              <span className="text-[10px] text-alabaster/60 font-mono">
                Equities Lab
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3 sm:gap-5">
            <MarketStatusBadge isOpen={false} freshness="FRESH" asOfDate="09 Oct 2026" />
            <Link
              href="/explore"
              className="text-xs sm:text-sm font-medium text-alabaster/80 hover:text-white transition-colors hidden sm:inline"
            >
              Explore
            </Link>
            {user ? (
              <Link
                href="/dashboard"
                className="text-xs sm:text-sm font-semibold px-3.5 py-1.5 rounded-lg bg-stormyTeal text-white hover:bg-stormyTeal-light transition-all"
              >
                Dashboard
              </Link>
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="text-xs sm:text-sm font-medium px-3.5 py-1.5 rounded-lg border border-yaleBlue/60 bg-[#1b242a]/80 hover:bg-yaleBlue/40 text-alabaster hover:text-white transition-all cursor-pointer"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Landing Sections */}
      <main className="flex-1">
        <HeroSection onOpenAuth={() => setIsAuthOpen(true)} />
        <FeaturesExplainer />
      </main>

      {/* Auth Modal with 18+ and Simulation Acknowledgement */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(u) => setUser(u)}
      />
    </div>
  );
}
