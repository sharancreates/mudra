import React from "react";
import { AlertCircle } from "lucide-react";

interface DisclaimerBannerProps {
  className?: string;
  sourceDate?: string;
}

export const DisclaimerBanner: React.FC<DisclaimerBannerProps> = ({
  className = "",
  sourceDate,
}) => {
  return (
    <div
      className={`w-full bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-xs text-amber-200 flex items-center justify-between gap-2 ${className}`}
    >
      <div className="flex items-center gap-2 mx-auto sm:mx-0">
        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
        <span className="font-medium">
          Simulated money. Prices are end-of-day. Not investment advice.
        </span>
      </div>
      {sourceDate && (
        <span className="hidden sm:inline text-amber-300/80 font-mono text-[11px]">
          Close as of {sourceDate}
        </span>
      )}
    </div>
  );
};
