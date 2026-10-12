import type { Metadata, Viewport } from "next";
import "./globals.css";
import "@/styles/mudra.css";

export const viewport: Viewport = {
  themeColor: "#0B0E14",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://mudraequities.in"),
  title: {
    default: "Mudra | Indian Equities Simulator — Next-Close Paper Trading",
    template: "%s | Mudra Equities",
  },
  description:
    "Institutional-grade paper trading platform for 50 liquid NSE equities with deterministic 15:30 IST settlement, integer paise ledger, and strict 10% headroom risk reserve.",
  keywords: [
    "Mudra",
    "Indian Equities Simulator",
    "NSE Paper Trading",
    "Next Close Settlement",
    "Paise Ledger",
    "Stock Market Simulator",
    "NIFTY 50",
    "Paper Trading India",
  ],
  authors: [{ name: "Mudra Equities Lab" }],
  creator: "Mudra Equities Lab",
  openGraph: {
    title: "Mudra | Indian Equities Simulator — Next-Close Paper Trading",
    description:
      "Practice Indian equity trading with virtual ₹1,00,000 capital, deterministic 15:30 IST settlement, and mathematical paise precision. Zero real-world risk.",
    url: "https://mudraequities.in",
    siteName: "Mudra Equities Lab",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mudra | Indian Equities Simulator",
    description:
      "Honest Closing-Price Paper Trading for 50 liquid NSE benchmarks with integer paise math.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
  },
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

