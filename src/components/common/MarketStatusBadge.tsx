import React from "react";
import { Clock, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

export type FreshnessState = "FRESH" | "DELAYED" | "OUTDATED";

interface MarketStatusBadgeProps {
  isOpen?: boolean;
  freshness?: FreshnessState;
  asOfDate?: string;
  className?: string;
}

export const MarketStatusBadge: React.FC<MarketStatusBadgeProps> = ({
  isOpen = false,
  freshness = "FRESH",
  asOfDate,
  className = "",
}) => {
  const getFreshnessBadge = () => {
    switch (freshness) {
      case "FRESH":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            Fresh EOD
          </span>
        );
      case "DELAYED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3 h-3" />
            Delayed
          </span>
        );
      case "OUTDATED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3 h-3" />
            Outdated
          </span>
        );
    }
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
          isOpen
            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            : "bg-graphite-light text-alabaster border border-alabaster/10"
        }`}
      >
        <Clock className="w-3 h-3" />
        {isOpen ? "Market Open (Closes 15:30 IST)" : "Market Closed (Opens 09:15 IST)"}
      </span>
      {getFreshnessBadge()}
      {asOfDate && (
        <span className="text-[11px] text-alabaster/60 font-mono hidden sm:inline">
          {asOfDate}
        </span>
      )}
    </div>
  );
};
