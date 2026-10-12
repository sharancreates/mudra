"use client";

import React from "react";
import Link from "next/link";
import {
  ShieldAlert,
  ShieldCheck,
  Clock,
  Coins,
  Scale,
  Lock,
  ArrowRight,
  FileCheck,
} from "lucide-react";
import { MudraShell } from "@/components/mudra/MudraShell";

export default function TermsPage() {
  return (
    <MudraShell activeNav={"terms" as any}>
      <div data-wrap="" style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 24px 80px 24px" }}>
        {/* Eyebrow */}
        <div style={{ marginBottom: "16px" }}>
          <span className="mudra-eyebrow">00 / statutory legal disclosure &amp; rules</span>
        </div>

        {/* Display Heading */}
        <div style={{ marginBottom: "36px" }}>
          <h1
            style={{
              margin: 0,
              fontSize: "clamp(36px, min(6.4vw, 72px), 84px)",
              fontWeight: "var(--weight-display)",
              letterSpacing: "var(--tracking-display)",
              lineHeight: 0.94,
              color: "var(--text-heading)",
            }}
          >
            Terms of Simulation &amp; Disclaimers
          </h1>
          <p
            style={{
              margin: "18px 0 0 0",
              fontSize: "16px",
              lineHeight: 1.6,
              color: "var(--text-muted)",
              maxWidth: "68ch",
            }}
          >
            Comprehensive legal disclosures, simulation operational rules, and statutory compliance framework governing the Mudra equities paper trading platform.
          </p>
        </div>

        {/* Critical Statutory Alert Banner (PRD Section 15.1) */}
        <div
          style={{
            background: "rgba(238, 160, 43, 0.08)",
            border: "1.5px solid rgba(238, 160, 43, 0.28)",
            borderRadius: "var(--radius-card)",
            padding: "24px 28px",
            marginBottom: "40px",
            display: "flex",
            alignItems: "flex-start",
            gap: "16px",
          }}
        >
          <ShieldAlert className="w-6 h-6 shrink-0" style={{ color: "var(--mudra-signal-yellow)", marginTop: "2px" }} />
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: "16px",
                fontWeight: 700,
                color: "var(--text-heading)",
                letterSpacing: "-0.01em",
              }}
            >
              Statutory SEBI &amp; &ldquo;No Real Money&rdquo; Disclosure
            </h2>
            <p
              style={{
                margin: "8px 0 0 0",
                fontSize: "14px",
                lineHeight: 1.6,
                color: "var(--text-body)",
              }}
            >
              Mudra is an educational stock market simulator created exclusively for paper trading and financial literacy. Mudra is <strong>NOT</strong> a broker, portfolio manager, or research analyst registered with the Securities and Exchange Board of India (SEBI). All accounts receive virtual ₹1,00,000 capital which has <strong>zero fiat value</strong>. No actual stock exchange orders are executed, and real financial transactions are strictly impossible.
            </p>
          </div>
        </div>

        {/* Structured Terms & Rules Sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          {/* Section 1 */}
          <section
            style={{
              background: "var(--surface-card)",
              border: "1.5px solid var(--border-hairline)",
              borderRadius: "var(--radius-card)",
              padding: "32px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--surface-sunken)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--mudra-sky-blue)",
                }}
              >
                <Scale className="w-5 h-5" />
              </div>
              <h3 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "var(--text-heading)" }}>
                1. Educational Scope &amp; Non-Broker Status
              </h3>
            </div>
            <div style={{ fontSize: "14px", lineHeight: 1.65, color: "var(--text-body)", display: "flex", flexDirection: "column", gap: "12px" }}>
              <p style={{ margin: 0 }}>
                Mudra is designed and operated exclusively as a technological learning sandbox for Indian equity market fundamentals. Mudra does not provide broker-dealer facilities, margin facilities, custody of funds or securities, or cleared clearing-corporation settlements.
              </p>
              <p style={{ margin: 0 }}>
                Nothing contained on this website or within the application constitutes financial, investment, legal, tax, or accounting advice. Users should consult a qualified SEBI-registered investment advisor before participating in real capital markets.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section
            style={{
              background: "var(--surface-card)",
              border: "1.5px solid var(--border-hairline)",
              borderRadius: "var(--radius-card)",
              padding: "32px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--surface-sunken)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--mudra-signal-yellow)",
                }}
              >
                <Coins className="w-5 h-5" />
              </div>
              <h3 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "var(--text-heading)" }}>
                2. Virtual Capital &amp; &ldquo;No Real Money&rdquo; Guarantee
              </h3>
            </div>
            <div style={{ fontSize: "14px", lineHeight: 1.65, color: "var(--text-body)", display: "flex", flexDirection: "column", gap: "12px" }}>
              <p style={{ margin: 0 }}>
                Upon onboarding, each participant is assigned a virtual balance of ₹1,00,000 (represented internally as 10,000,000 integer paise). This virtual sum is synthetic simulation credit and has no legal tender, cash equivalent, or redemption rights.
              </p>
              <ul style={{ margin: "4px 0 0 20px", padding: 0 }}>
                <li>Virtual balances cannot be withdrawn, transferred, refunded, exchanged, or converted into INR or any cryptocurrency.</li>
                <li>Mudra incorporates zero payment gateways, UPI handlers, banking interfaces, or deposit endpoints.</li>
                <li>Any simulated trading profits or losses recorded on the platform have no real-world financial standing.</li>
              </ul>
            </div>
          </section>

          {/* Section 3 */}
          <section
            style={{
              background: "var(--surface-card)",
              border: "1.5px solid var(--border-hairline)",
              borderRadius: "var(--radius-card)",
              padding: "32px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--surface-sunken)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--mudra-link-green)",
                }}
              >
                <Clock className="w-5 h-5" />
              </div>
              <h3 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "var(--text-heading)" }}>
                3. Next-Close Settlement Execution Model
              </h3>
            </div>
            <div style={{ fontSize: "14px", lineHeight: 1.65, color: "var(--text-body)", display: "flex", flexDirection: "column", gap: "12px" }}>
              <p style={{ margin: 0 }}>
                To eradicate paper-trading delusions caused by artificial instant fills against stale prices, Mudra enforces an <strong>honest Closing-Price Simulator</strong>:
              </p>
              <ul style={{ margin: "4px 0 0 20px", padding: 0 }}>
                <li><strong>Cutoff:</strong> Orders placed throughout the trading session enter a pending queue and execute deterministically at 15:30 IST against the official closing price.</li>
                <li><strong>10% Headroom Buffer:</strong> Market buy orders hold a 10% safety buffer on estimated execution cost to protect wallets from intraday upward price swings.</li>
                <li><strong>Simulated Brokerage:</strong> A transparent 0.1% transaction fee (10 bps) is deducted in integer paise to accurately reflect transactional friction.</li>
              </ul>
            </div>
          </section>

          {/* Section 4 */}
          <section
            style={{
              background: "var(--surface-card)",
              border: "1.5px solid var(--border-hairline)",
              borderRadius: "var(--radius-card)",
              padding: "32px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--surface-sunken)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--mudra-sky-blue)",
                }}
              >
                <Lock className="w-5 h-5" />
              </div>
              <h3 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "var(--text-heading)" }}>
                4. DPDP Act 2023 &amp; Data Privacy Commitment
              </h3>
            </div>
            <div style={{ fontSize: "14px", lineHeight: 1.65, color: "var(--text-body)", display: "flex", flexDirection: "column", gap: "12px" }}>
              <p style={{ margin: 0 }}>
                Mudra adheres to the principles of India&apos;s Digital Personal Data Protection (DPDP) Act, 2023:
              </p>
              <ul style={{ margin: "4px 0 0 20px", padding: 0 }}>
                <li><strong>Zero Sensitive Financial Data:</strong> Mudra never requests or stores Permanent Account Numbers (PAN), Aadhaar numbers, bank account details, or Demat account credentials.</li>
                <li><strong>Data Minimization:</strong> Only basic authentication credentials (display pseudonym and email) are utilized to preserve simulation state.</li>
                <li><strong>No Commercial Data Resale:</strong> User simulated trading patterns are never monetized, traded, or shared with third-party marketing brokers.</li>
              </ul>
            </div>
          </section>

          {/* Section 5 */}
          <section
            style={{
              background: "var(--surface-card)",
              border: "1.5px solid var(--border-hairline)",
              borderRadius: "var(--radius-card)",
              padding: "32px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--surface-sunken)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-heading)",
                }}
              >
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "var(--text-heading)" }}>
                5. Age Restriction &amp; User Conduct
              </h3>
            </div>
            <div style={{ fontSize: "14px", lineHeight: 1.65, color: "var(--text-body)", display: "flex", flexDirection: "column", gap: "12px" }}>
              <p style={{ margin: 0 }}>
                Access to the Mudra simulation platform is restricted to individuals who are at least 18 years of age. By accessing the site or creating a virtual account, you certify that you meet the age requirement.
              </p>
              <p style={{ margin: 0 }}>
                Leaderboard rankings are subject to Section 2.4 fair educational gamification rules (minimum 5 settled trades and 7 distinct trading days) to eliminate single-trade statistical anomalies.
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section
            style={{
              background: "var(--surface-card)",
              border: "1.5px solid var(--border-hairline)",
              borderRadius: "var(--radius-card)",
              padding: "32px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--surface-sunken)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--mudra-node-red)",
                }}
              >
                <FileCheck className="w-5 h-5" />
              </div>
              <h3 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "var(--text-heading)" }}>
                6. Limitation of Liability
              </h3>
            </div>
            <div style={{ fontSize: "14px", lineHeight: 1.65, color: "var(--text-body)", display: "flex", flexDirection: "column", gap: "12px" }}>
              <p style={{ margin: 0 }}>
                Mudra, its operators, contributors, and creators shall not be liable for any financial decisions, profits, or losses incurred by any user in real financial markets. Paper trading performance does not correlate directly with psychological or financial outcomes in live market execution.
              </p>
            </div>
          </section>
        </div>

        {/* Bottom Navigation CTAs */}
        <div
          style={{
            marginTop: "48px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
            padding: "24px 32px",
            background: "var(--surface-card)",
            border: "1.5px solid var(--border-hairline)",
            borderRadius: "var(--radius-card)",
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: "16px", color: "var(--text-heading)" }}>
              Ready to test your market strategies?
            </div>
            <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>
              Explore 50 liquid NSE benchmarks with integer paise mathematical precision.
            </div>
          </div>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Link
              href="/explore"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 22px",
                borderRadius: "var(--radius-pill)",
                background: "var(--text-heading)",
                color: "var(--surface-canvas)",
                fontSize: "13px",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              <span>Explore Equities</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/dashboard"
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "10px 20px",
                borderRadius: "var(--radius-pill)",
                border: "1.5px solid var(--border-hairline)",
                background: "var(--surface-canvas)",
                color: "var(--text-heading)",
                fontSize: "13px",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </MudraShell>
  );
}
