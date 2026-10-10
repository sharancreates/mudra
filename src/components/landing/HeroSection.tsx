"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Shield, Award, TrendingUp, Sparkles } from "lucide-react";
import { formatINR } from "@/lib/formatters";

interface HeroSectionProps {
  onOpenAuth: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onOpenAuth }) => {
  return (
    <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-12 md:pt-20 pb-16">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
        {/* Left Column: Copy & Actions */}
        <div className="lg:col-span-7 flex flex-col items-start text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-stormyTeal/20 text-stormyTeal-light border border-stormyTeal/40 mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            EDUCATIONAL EQUITIES SANDBOX
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-[1.18] mb-5">
            Master the Indian Stock Market with{" "}
            <span className="text-stormyTeal-light">₹1,00,000</span> Virtual Capital.
          </h1>

          <p className="text-alabaster/80 text-base sm:text-lg leading-relaxed max-w-xl mb-8">
            Practise buying and selling NSE &amp; BSE equities without risking a single rupee. Honest next-close execution, explainable P&amp;L formulas, zero hidden tips.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
            <button
              onClick={onOpenAuth}
              className="px-7 py-3.5 rounded-xl bg-stormyTeal hover:bg-stormyTeal-light text-white font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2"
            >
              Start Trading with ₹1,00,000 Virtual
              <ArrowRight className="w-4 h-4" />
            </button>
            <Link
              href="/explore"
              className="px-6 py-3.5 rounded-xl bg-graphite hover:bg-graphite-light text-alabaster border border-alabaster/20 font-semibold text-sm transition-all text-center"
            >
              Browse 50 NSE Stocks
            </Link>
          </div>

          <p className="text-alabaster/50 text-xs sm:text-sm mt-4">
            Free forever • No PAN or Bank account required • 18+ only
          </p>
        </div>

        {/* Right Column: Interactive Virtual Portfolio Preview Card */}
        <div className="lg:col-span-5 w-full">
          <div className="bg-graphite/90 border border-yaleBlue/60 rounded-2xl p-6 sm:p-7 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-4 border-b border-alabaster/10">
              <span className="text-xs font-semibold uppercase tracking-wider text-alabaster/70">
                MY VIRTUAL PORTFOLIO
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-stormyTeal/20 text-stormyTeal-light border border-stormyTeal/30">
                SANDBOX
              </span>
            </div>

            {/* Total Balance */}
            <div className="py-4">
              <span className="text-xs text-alabaster/60 block">Total Portfolio Value</span>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-3xl font-extrabold text-white font-mono">
                  {formatINR(10071020)}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  +0.71%
                </span>
              </div>
            </div>

            {/* Cash vs Holdings Breakdown */}
            <div className="grid grid-cols-2 gap-3 py-3 border-t border-alabaster/10 text-xs">
              <div>
                <span className="text-alabaster/60">Free Virtual Cash</span>
                <span className="block font-semibold text-white font-mono mt-0.5">
                  {formatINR(8757020)}
                </span>
              </div>
              <div>
                <span className="text-alabaster/60">Holdings Value</span>
                <span className="block font-semibold text-white font-mono mt-0.5">
                  {formatINR(1314000)}
                </span>
              </div>
            </div>

            {/* Top Holding Sample */}
            <div className="mt-4 pt-3 border-t border-alabaster/10">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-alabaster/60">Active Position</span>
                <span className="text-emerald-400 font-medium font-mono">+₹467.34 (+3.68%)</span>
              </div>
              <div className="flex items-center justify-between bg-black/30 p-3 rounded-xl border border-alabaster/10">
                <div>
                  <span className="font-bold text-white text-sm block">RELIANCE</span>
                  <span className="text-[11px] text-alabaster/60">9 shares @ avg ₹1,408.07</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-white font-mono block">₹1,460.00</span>
                  <span className="text-[10px] text-alabaster/50">EOD Close</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 text-center">
              <span className="text-[11px] text-alabaster/40 font-mono">
                Order executions simulate at 15:30 IST market close
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
