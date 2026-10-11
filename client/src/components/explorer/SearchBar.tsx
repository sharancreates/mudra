"use client";

import React from "react";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = "Search NSE stocks by ticker or company name (e.g. RELIANCE, TCS, HDFCBANK)...",
  className = "",
}) => {
  return (
    <div className={`relative w-full ${className}`}>
      <div
        className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"
        style={{ color: "var(--text-muted)" }}
      >
        <Search className="w-4 h-4" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          height: "52px",
          background: "var(--surface-card)",
          border: "1.5px solid var(--border-hairline)",
          borderRadius: "var(--radius-pill)",
          paddingLeft: "44px",
          paddingRight: "44px",
          fontSize: "14px",
          fontFamily: "var(--font-sans)",
          color: "var(--text-heading)",
          outline: "none",
          transition: "border-color 160ms ease, box-shadow 160ms ease",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "var(--Mudra-sky-blue)";
          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59, 191, 247, 0.15)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "var(--border-hairline)";
          e.currentTarget.style.boxShadow = "none";
        }}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute inset-y-0 right-0 pr-4 flex items-center"
          style={{
            background: "none",
            border: "none",
            color: "var(--text-muted)",
            cursor: "pointer",
          }}
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};


