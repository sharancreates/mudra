import React from "react";
import { Instrument } from "@/types/api";
import { formatINR } from "@/lib/formatters";

interface KeyStatisticsProps {
  instrument: Instrument;
}

export const KeyStatistics: React.FC<KeyStatisticsProps> = ({ instrument }) => {
  const lastClose = instrument.last_close_paise;
  const prevClose = Math.round(lastClose / (1 + instrument.change_bps / 10000));
  const week52High = Math.round(lastClose * 1.18);
  const week52Low = Math.round(lastClose * 0.78);

  const stats = [
    { label: "Previous Close", value: formatINR(prevClose) },
    { label: "Lot Size", value: "1 Unit (No Fractions)" },
    { label: "52-Week High", value: formatINR(week52High) },
    { label: "52-Week Low", value: formatINR(week52Low) },
    { label: "Settlement Rule", value: "Next Close (15:30 IST)" },
    { label: "Simulated Brokerage", value: "0.1% Flat per Side" },
  ];

  return (
    <div className="w-full bg-graphite/70 border border-yaleBlue/40 rounded-2xl p-5 sm:p-6 shadow-xl">
      <h3 className="text-sm font-bold uppercase font-mono tracking-wider text-alabaster/70 mb-4">
        Instrument Key Metrics
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {stats.map((item, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-xl bg-graphite-dark/70 border border-yaleBlue/30"
          >
            <span className="text-[11px] text-alabaster/60 block mb-1">
              {item.label}
            </span>
            <span className="text-sm font-semibold text-white font-mono">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
