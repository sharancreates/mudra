import React from "react";
import { Clock, ShieldCheck, Calculator, AlertTriangle } from "lucide-react";

export const FeaturesExplainer: React.FC = () => {
  return (
    <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-16 border-t border-alabaster/10">
      <div className="text-center max-w-2xl mx-auto mb-14">
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          How Mudra Eliminates Paper Trading Delusions
        </h2>
        <p className="text-sm text-alabaster/70 mt-2">
          Most simulators let you trade on delayed prices with instant fills. Mudra operates as an honest Closing-Price simulator.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Step 1 */}
        <div className="bg-graphite/60 border border-yaleBlue/40 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-yaleBlue/40 text-stormyTeal-light flex items-center justify-center font-bold text-base mb-4 font-mono">
              01
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Next-Close Market Execution</h3>
            <p className="text-xs text-alabaster/70 leading-relaxed">
              Place buy and sell orders whenever inspiration strikes. Orders enter the queue as PENDING and fill at the official 15:30 IST closing price, preventing stale-price exploitation.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-alabaster/10 text-[11px] text-stormyTeal-light flex items-center gap-1.5 font-mono">
            <Clock className="w-3.5 h-3.5" />
            15:30 IST daily settlement
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-graphite/60 border border-yaleBlue/40 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-yaleBlue/40 text-stormyTeal-light flex items-center justify-center font-bold text-base mb-4 font-mono">
              02
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Append-Only Integer Paise Ledger</h3>
            <p className="text-xs text-alabaster/70 leading-relaxed">
              No balance edits or floating-point rounding drifts. Every transaction (order reserve, execution, and 0.1% simulated fee) is audited against a tamper-proof database ledger.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-alabaster/10 text-[11px] text-stormyTeal-light flex items-center gap-1.5 font-mono">
            <ShieldCheck className="w-3.5 h-3.5" />
            Zero balance drift
          </div>
        </div>

        {/* Step 3 */}
        <div className="bg-graphite/60 border border-yaleBlue/40 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-yaleBlue/40 text-stormyTeal-light flex items-center justify-center font-bold text-base mb-4 font-mono">
              03
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Transparent Formula Popovers</h3>
            <p className="text-xs text-alabaster/70 leading-relaxed">
              Learn how weighted-average cost, realized P&amp;L upon selling, and unrealized profit are calculated with step-by-step mathematical breakdowns in plain language.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-alabaster/10 text-[11px] text-stormyTeal-light flex items-center gap-1.5 font-mono">
            <Calculator className="w-3.5 h-3.5" />
            Explainable calculations
          </div>
        </div>
      </div>

      {/* Statutory Footer Banner */}
      <div className="mt-14 p-5 rounded-xl bg-graphite/40 border border-alabaster/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-alabaster/70">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <span>
            <strong>Educational Notice:</strong> Mudra is strictly a simulator with no connection to real depositories, SEBI brokers, or payment gateways.
          </span>
        </div>
        <span className="font-mono text-[11px] text-alabaster/50 shrink-0">
          Mudra Equities Lab v1.0
        </span>
      </div>
    </section>
  );
};
