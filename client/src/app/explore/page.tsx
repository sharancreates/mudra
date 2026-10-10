"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, SlidersHorizontal, Info } from "lucide-react";
import { SearchBar } from "@/components/explorer/SearchBar";
import { SectorFilterPills } from "@/components/explorer/SectorFilterPills";
import { StockTable } from "@/components/explorer/StockTable";
import { MarketStatusBadge } from "@/components/common/MarketStatusBadge";
import { getInstruments } from "@/lib/api";
import { Instrument } from "@/types/api";

const SECTORS = [
  "All",
  "Banking",
  "IT",
  "Energy",
  "Automobile",
  "Pharma",
  "FMCG",
  "Metals",
  "Infra",
  "Consumer",
];

export default function ExplorePage() {
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSector, setSelectedSector] = useState("All");
  const [sortBy, setSortBy] = useState<"name" | "price" | "change">("name");

  useEffect(() => {
    getInstruments().then((data) => setInstruments(data));
  }, []);

  const filteredInstruments = useMemo(() => {
    let list = instruments;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (i) =>
          i.symbol.toLowerCase().includes(q) || i.name.toLowerCase().includes(q)
      );
    }

    if (selectedSector !== "All") {
      list = list.filter(
        (i) => i.sector.toLowerCase() === selectedSector.toLowerCase()
      );
    }

    // Neutral sorting (no advice)
    return [...list].sort((a, b) => {
      if (sortBy === "name") return a.symbol.localeCompare(b.symbol);
      if (sortBy === "price") return b.last_close_paise - a.last_close_paise;
      if (sortBy === "change") return b.change_bps - a.change_bps;
      return 0;
    });
  }, [instruments, searchQuery, selectedSector, sortBy]);

  return (
    <div className="flex-1 flex flex-col w-full max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-xl bg-graphite border border-yaleBlue/40 text-alabaster hover:text-white hover:bg-graphite-light transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Market Explorer
            </h1>
            <p className="text-xs text-alabaster/70">
              Browse 50 liquid NSE instruments with official EOD quotes
            </p>
          </div>
        </div>
        <MarketStatusBadge isOpen={false} freshness="FRESH" asOfDate="09 Oct 2026" />
      </div>

      {/* Controls Bar: Search & Sort */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 mb-4">
        <div className="flex-1">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-graphite/80 border border-yaleBlue/40 rounded-xl px-3 py-2 text-xs text-alabaster">
            <SlidersHorizontal className="w-3.5 h-3.5 text-alabaster/60" />
            <span className="text-alabaster/60">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
            >
              <option value="name" className="bg-graphite text-white">
                Symbol (A-Z)
              </option>
              <option value="price" className="bg-graphite text-white">
                Close Price
              </option>
              <option value="change" className="bg-graphite text-white">
                Day Change %
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Sector Filter Chips */}
      <div className="mb-6">
        <SectorFilterPills
          sectors={SECTORS}
          selectedSector={selectedSector}
          onSelectSector={setSelectedSector}
        />
      </div>

      {/* Stock Table */}
      <div className="flex-1">
        <StockTable
          instruments={filteredInstruments}
          onResetFilters={() => {
            setSearchQuery("");
            setSelectedSector("All");
          }}
        />
      </div>

      {/* Educational Notice Footer */}
      <div className="mt-8 p-4 rounded-xl bg-graphite/40 border border-yaleBlue/30 flex items-center gap-3 text-xs text-alabaster/70">
        <Info className="w-4 h-4 text-stormyTeal-light shrink-0" />
        <span>
          Orders placed on any instrument will execute at the official closing price during next session settlement (15:30 IST).
        </span>
      </div>
    </div>
  );
}
