"use client";

import React from "react";

interface SectorFilterPillsProps {
  sectors: string[];
  selectedSector: string;
  onSelectSector: (sector: string) => void;
  className?: string;
}

export const SectorFilterPills: React.FC<SectorFilterPillsProps> = ({
  sectors,
  selectedSector,
  onSelectSector,
  className = "",
}) => {
  return (
    <div
      className={`flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar ${className}`}
      style={{ scrollbarWidth: "none" }}
    >
      {sectors.map((sector) => {
        const isSelected = selectedSector === sector;
        return (
          <button
            key={sector}
            type="button"
            onClick={() => onSelectSector(sector)}
            style={{
              padding: "7px 16px",
              borderRadius: "var(--radius-pill)",
              fontSize: "12px",
              fontWeight: 600,
              fontFamily: "var(--font-sans)",
              whiteSpace: "nowrap",
              cursor: "pointer",
              transition: "all 160ms ease",
              border: isSelected ? "1.5px solid var(--mudra-signal-yellow)" : "1.5px solid var(--border-hairline)",
              background: isSelected ? "var(--mudra-signal-yellow)" : "var(--surface-card)",
              color: isSelected ? "#262626" : "var(--text-body)",
            }}
          >
            {sector}
          </button>
        );
      })}
    </div>
  );
};


