/**
 * Mudra Watchlist Management
 * Client-side reactive store with localStorage persistence,
 * designed to automatically sync with backend Plan 3.4 /api/watchlist.
 */

import { useState, useEffect } from "react";

const STORAGE_KEY = "mudra_watchlist_symbols";
const DEFAULT_WATCHLIST = ["RELIANCE", "TCS", "HDFCBANK", "INFY"];

function getStoredWatchlist(): string[] {
  if (typeof window === "undefined") return DEFAULT_WATCHLIST;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_WATCHLIST));
      return DEFAULT_WATCHLIST;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_WATCHLIST;
  } catch {
    return DEFAULT_WATCHLIST;
  }
}

function saveWatchlist(symbols: string[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(symbols));
    window.dispatchEvent(new CustomEvent("mudra:watchlist_updated", { detail: symbols }));
  } catch {}
}

export function toggleWatchlistSymbol(symbol: string): boolean {
  const current = getStoredWatchlist();
  const upper = symbol.toUpperCase();
  const exists = current.includes(upper);
  const updated = exists ? current.filter((s) => s !== upper) : [...current, upper];
  saveWatchlist(updated);

  // Optimistic backend sync if Plan 3.4 endpoints are active
  if (typeof window !== "undefined") {
    const method = exists ? "DELETE" : "POST";
    const url = exists ? `/api/watchlist/${encodeURIComponent(upper)}` : "/api/watchlist";
    fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: exists ? undefined : JSON.stringify({ symbol: upper }),
    }).catch(() => {
      // Offline fallback silent catch
    });
  }

  return !exists;
}

export function isWatchlisted(symbol: string): boolean {
  const current = getStoredWatchlist();
  return current.includes(symbol.toUpperCase());
}

export function useWatchlist(): {
  watchlist: string[];
  toggle: (symbol: string, e?: React.MouseEvent) => void;
  isStarred: (symbol: string) => boolean;
} {
  const [watchlist, setWatchlist] = useState<string[]>(DEFAULT_WATCHLIST);

  useEffect(() => {
    setWatchlist(getStoredWatchlist());

    const handleUpdate = (e: Event) => {
      const custom = e as CustomEvent<string[]>;
      if (custom.detail) {
        setWatchlist(custom.detail);
      } else {
        setWatchlist(getStoredWatchlist());
      }
    };

    window.addEventListener("mudra:watchlist_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("mudra:watchlist_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const toggle = (symbol: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    toggleWatchlistSymbol(symbol);
  };

  const isStarred = (symbol: string) => watchlist.includes(symbol.toUpperCase());

  return { watchlist, toggle, isStarred };
}
