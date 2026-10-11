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
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[var(--mudra-link-green)]/15 text-[var(--mudra-link-green)] border border-[var(--mudra-link-green)]/30">
            <CheckCircle2 className="w-3 h-3" />
            Fresh EOD
          </span>
        );
      case "DELAYED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[var(--mudra-signal-yellow)]/15 text-[var(--mudra-signal-yellow)] border border-[var(--mudra-signal-yellow)]/30">
            <AlertTriangle className="w-3 h-3" />
            Delayed
          </span>
        );
      case "OUTDATED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[var(--mudra-node-red)]/15 text-[var(--mudra-node-red)] border border-[var(--mudra-node-red)]/30">
            <XCircle className="w-3 h-3" />
            Outdated
          </span>
        );
    }
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
          isOpen
            ? "bg-[var(--mudra-link-green)]/15 text-[var(--mudra-link-green)] border border-[var(--mudra-link-green)]/30"
            : "bg-[var(--surface-muted)] text-[var(--text-muted)] border border-[var(--border-hairline)]"
        }`}
      >
        <Clock className="w-3 h-3" />
        {isOpen ? "Market Open (Closes 15:30 IST)" : "Market Closed (Opens 09:15 IST)"}
      </span>
      {getFreshnessBadge()}
      {asOfDate && (
        <span className="text-[11px] text-[var(--text-muted)] font-mono hidden sm:inline">
          {asOfDate}
        </span>
      )}
    </div>
  );
};

