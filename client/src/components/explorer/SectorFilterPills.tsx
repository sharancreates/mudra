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
      className={`flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs ${className}`}
    >
      {sectors.map((sector) => {
        const isSelected = selectedSector === sector;
        return (
          <button
            key={sector}
            type="button"
            onClick={() => onSelectSector(sector)}
            className={`px-3.5 py-1.5 rounded-full font-medium whitespace-nowrap transition-all cursor-pointer border ${
              isSelected
                ? "bg-stormyTeal border-stormyTeal text-white shadow-sm"
                : "bg-graphite/60 border-yaleBlue/40 text-alabaster/70 hover:text-white hover:bg-graphite-light"
            }`}
          >
            {sector}
          </button>
        );
      })}
    </div>
  );
};
