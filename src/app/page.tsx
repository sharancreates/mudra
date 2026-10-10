import React from "react";
import Link from "next/link";
import { TrendingUp, ShieldCheck, BookOpen, ArrowRight } from "lucide-react";
import { MarketStatusBadge } from "@/components/common/MarketStatusBadge";

export default function HomePage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center max-w-5xl mx-auto">
      <div className="mb-6">
        <MarketStatusBadge isOpen={false} freshness="FRESH" asOfDate="09 Oct 2026" />
      </div>

      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-stormyTeal/20 text-stormyTeal-light border border-stormyTeal/30 mb-6">
        <ShieldCheck className="w-3.5 h-3.5" />
        100% Virtual Simulator • ₹0 Real Money
      </div>

      <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6">
        Master Indian Equities with{" "}
        <span className="text-stormyTeal-light">₹1,00,000 Virtual Capital</span>
      </h1>

      <p className="text-lg sm:text-xl text-alabaster/80 max-w-2xl mb-10 leading-relaxed">
        Practise trading NSE & BSE stocks with authentic next-close execution. Learn position sizing, fees, and portfolio behavior without risking a single rupee.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
        <Link
          href="/explore"
          className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold bg-stormyTeal hover:bg-stormyTeal-light text-white shadow-lg transition-all"
        >
          Explore Market <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold bg-graphite hover:bg-graphite-light text-alabaster border border-alabaster/20 transition-all"
        >
          View Demo Dashboard
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-20 w-full text-left">
        <div className="bg-graphite/40 border border-alabaster/10 rounded-2xl p-6">
          <div className="w-10 h-10 rounded-lg bg-yaleBlue/30 text-yaleBlue-light flex items-center justify-center mb-4">
            <TrendingUp className="w-5 h-5 text-teal-300" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Next-Close Execution</h3>
          <p className="text-sm text-alabaster/70">
            Orders fill at official 15:30 IST market close prices. No fake instant fills or unrealistic paper illusions.
          </p>
        </div>

        <div className="bg-graphite/40 border border-alabaster/10 rounded-2xl p-6">
          <div className="w-10 h-10 rounded-lg bg-stormyTeal/20 text-stormyTeal-light flex items-center justify-center mb-4">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Tamper-Proof Ledger</h3>
          <p className="text-sm text-alabaster/70">
            Every transaction is recorded in integer paise into an append-only audit ledger with zero rounding drift.
          </p>
        </div>

        <div className="bg-graphite/40 border border-alabaster/10 rounded-2xl p-6">
          <div className="w-10 h-10 rounded-lg bg-yaleBlue/30 text-yaleBlue-light flex items-center justify-center mb-4">
            <BookOpen className="w-5 h-5 text-teal-300" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Explainable P&L</h3>
          <p className="text-sm text-alabaster/70">
            Weighted-average cost basis and 0.1% simulated fees calculated with full formula transparency.
          </p>
        </div>
      </div>
    </main>
  );
}
