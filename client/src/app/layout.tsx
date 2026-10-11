import type { Metadata } from "next";
import "./globals.css";
import "@/styles/mudra.css";

export const metadata: Metadata = {
  title: "Mudra | Indian Equities Simulator — Next-Close Paper Trading",
  description:
    "Institutional-grade paper trading platform for 50 liquid NSE equities with deterministic 15:30 IST settlement, integer paise ledger, and strict 10% headroom risk reserve.",
  keywords: [
    "Mudra",
    "Indian Equities Simulator",
    "NSE Paper Trading",
    "Next Close Settlement",
    "Paise Ledger",
    "Stock Market Simulator",
    "NIFTY 50"
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased selection:bg-[#B1E5FC] selection:text-[#262626]">
        {children}
      </body>
    </html>
  );
}
