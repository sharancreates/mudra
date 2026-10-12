"use client";

import React, { useState, useEffect, useMemo } from "react";
import { SlidersHorizontal, Info } from "lucide-react";
import { SearchBar } from "@/components/explorer/SearchBar";
import { SectorFilterPills } from "@/components/explorer/SectorFilterPills";
import { StockTable } from "@/components/explorer/StockTable";
import { MarketStatusBadge } from "@/components/common/MarketStatusBadge";
import { MudraShell } from "@/components/mudra/MudraShell";
import { getInstruments } from "@/lib/api";
import { Instrument } from "@/types/api";
import { useWatchlist } from "@/lib/watchlist";

const SECTORS = [
  "All",
  "Watchlist",
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
  const { isStarred } = useWatchlist();

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

    if (selectedSector === "Watchlist") {
      list = list.filter((i) => isStarred(i.symbol));
    } else if (selectedSector !== "All") {
      list = list.filter(
        (i) => i.sector.toLowerCase() === selectedSector.toLowerCase()
      );
    }

    return [...list].sort((a, b) => {
      if (sortBy === "name") return a.symbol.localeCompare(b.symbol);
      if (sortBy === "price") return b.last_close_paise - a.last_close_paise;
      if (sortBy === "change") return b.change_bps - a.change_bps;
      return 0;
    });
  }, [instruments, searchQuery, selectedSector, sortBy, isStarred]);

  return (
    <MudraShell activeNav="explore">
      <div data-wrap="" style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 24px" }}>
        {/* Eyebrow */}
        <div style={{ marginBottom: "16px" }}>
          <span className="mudra-eyebrow">01 / nse 50 equities directory</span>
        </div>

        {/* Display Heading & Market Status */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            flexWrap: "wrap",
            gap: "24px",
            marginBottom: "40px",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "clamp(36px, min(6.4vw, 72px), 92px)",
                fontWeight: "var(--weight-display)",
                letterSpacing: "var(--tracking-display)",
                lineHeight: 0.94,
                color: "var(--text-heading)",
              }}
            >
              Market Explorer
            </h1>
            <p
              style={{
                margin: "16px 0 0 0",
                fontSize: "16px",
                lineHeight: 1.55,
                color: "var(--text-muted)",
                maxWidth: "60ch",
              }}
            >
              Browse 50 liquid NSE benchmark equities with official next-close settlement quotes, sector allocations, and live integer paise trading.
            </p>
          </div>

          <MarketStatusBadge isOpen={false} freshness="FRESH" asOfDate="09 Oct 2026" />
        </div>

        {/* Search & Sort Controls Bar */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: "16px",
            marginBottom: "20px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: "1 1 340px" }}>
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: "var(--surface-card)",
              border: "1.5px solid var(--border-hairline)",
              borderRadius: "var(--radius-pill)",
              padding: "0 20px",
              height: "52px",
            }}
          >
            <SlidersHorizontal className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
            <span style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--text-muted)", textTransform: "uppercase" }}>
              Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{
                background: "transparent",
                border: "none",
                fontSize: "13px",
                fontWeight: 600,
                fontFamily: "var(--font-sans)",
                color: "var(--text-heading)",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="name">Symbol (A-Z)</option>
              <option value="price">Close Price (High to Low)</option>
              <option value="change">Day Change % (Top Gainers)</option>
            </select>
          </div>
        </div>

        {/* Sector Filter Chips */}
        <div style={{ marginBottom: "28px" }}>
          <SectorFilterPills
            sectors={SECTORS}
            selectedSector={selectedSector}
            onSelectSector={setSelectedSector}
          />
        </div>

        {/* Stock Table */}
        <div style={{ marginBottom: "36px" }}>
          <StockTable
            instruments={filteredInstruments}
            activeSector={selectedSector}
            searchQuery={searchQuery}
            onResetFilters={() => {
              setSearchQuery("");
              setSelectedSector("All");
            }}
          />
        </div>

        {/* Educational Notice Banner */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            padding: "16px 24px",
            borderRadius: "var(--radius-card)",
            background: "var(--surface-card)",
            border: "1px solid var(--border-hairline)",
            color: "var(--text-muted)",
            fontSize: "13px",
            lineHeight: 1.5,
          }}
        >
          <Info className="w-4 h-4 shrink-0" style={{ color: "var(--mudra-sky-blue)" }} />
          <span>
            Orders placed on any instrument will execute at the official closing price during the next session settlement (15:30 IST) with 0.1% simulated brokerage fee.
          </span>
        </div>
      </div>
    </MudraShell>
  );
}


