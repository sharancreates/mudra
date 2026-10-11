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
    { label: "Lot Size", value: "1 Share (No Fractions)" },
    { label: "52-Week High", value: formatINR(week52High) },
    { label: "52-Week Low", value: formatINR(week52Low) },
    { label: "Settlement Rule", value: "Next Close 15:30 IST" },
    { label: "Simulated Fee", value: "0.1% Flat per Side" },
  ];

  return (
    <div
      style={{
        width: "100%",
        background: "var(--surface-card)",
        border: "1.5px solid var(--border-hairline)",
        borderRadius: "var(--radius-card)",
        padding: "24px",
      }}
    >
      <h3
        className="Mudra-eyebrow"
        style={{
          fontSize: "11px",
          marginBottom: "16px",
          color: "var(--text-muted)",
        }}
      >
        Instrument Key Metrics
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
          gap: "12px",
        }}
      >
        {stats.map((item, idx) => (
          <div
            key={idx}
            style={{
              padding: "14px",
              borderRadius: "var(--radius-md)",
              background: "var(--surface-canvas)",
              border: "1px solid var(--border-hairline)",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                display: "block",
                marginBottom: "4px",
              }}
            >
              {item.label}
            </span>
            <span
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "var(--text-heading)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};


