import type { Metadata } from "next";
import "./globals.css";
import { DisclaimerBanner } from "@/components/common/DisclaimerBanner";

export const metadata: Metadata = {
  title: "Mudra — Virtual Stock Market Simulator for NSE / BSE",
  description:
    "Free, educational stock market simulator for Indian equities. Practise trading with ₹1,00,000 of virtual money. No real money, deposits, or brokers.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#181d20] text-gray-100 flex flex-col min-h-screen antialiased selection:bg-stormyTeal selection:text-white">
        <DisclaimerBanner />
        <div className="flex-1 flex flex-col">{children}</div>
      </body>
    </html>
  );
}
