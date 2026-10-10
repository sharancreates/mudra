"use client";

import React, { useState } from "react";
import { X, ShieldCheck, CheckSquare, Square, CheckCircle2, User, Mail, ArrowRight } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: { email: string; displayName: string }) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [mode, setMode] = useState<"register" | "signin">("register");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isAdult, setIsAdult] = useState(false);
  const [acknowledgedSimulation, setAcknowledgedSimulation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLegalNotice, setShowLegalNotice] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !email.includes("@")) {
      setError("Please provide a valid email address.");
      return;
    }

    if (mode === "register") {
      if (!displayName || displayName.trim().length < 3) {
        setError("Display name must be at least 3 characters.");
        return;
      }
      if (!isAdult) {
        setError("You must declare that you are 18 years of age or older.");
        return;
      }
      if (!acknowledgedSimulation) {
        setError("You must acknowledge that Mudra is a virtual simulation.");
        return;
      }
    }

    setIsSubmitted(true);
    setTimeout(() => {
      if (onSuccess) {
        onSuccess({ email, displayName: displayName || email.split("@")[0] });
      }
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-graphite border border-yaleBlue/50 rounded-2xl p-6 sm:p-7 shadow-2xl text-white">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-alabaster/60 hover:text-white hover:bg-graphite-light transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-stormyTeal/20 border border-stormyTeal/40 text-stormyTeal-light flex items-center justify-center mx-auto mb-3 text-xl font-bold">
            ₹
          </div>
          <h2 className="text-2xl font-bold tracking-tight">
            {mode === "register"
              ? "Start with ₹1,00,000 Virtual"
              : "Welcome Back to Mudra"}
          </h2>
          <p className="text-xs text-alabaster/70 mt-1">
            {mode === "register"
              ? "Set up your free paper trading account in 60 seconds."
              : "Sign in to access your portfolio and watchlist."}
          </p>
        </div>

        {/* Success Feedback */}
        {isSubmitted ? (
          <div className="p-6 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <h3 className="text-lg font-bold">₹1,00,000 Virtual Wallet Ready!</h3>
            <p className="text-xs text-alabaster/80">
              Welcome aboard, <span className="font-semibold text-white">{displayName || email}</span>. Initializing your sandbox session...
            </p>
          </div>
        ) : (
          <>
            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={() => {
                setIsAdult(true);
                setAcknowledgedSimulation(true);
                setDisplayName("TraderAarav");
                setEmail("aarav.demo@gmail.com");
              }}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white text-gray-800 font-semibold text-sm hover:bg-gray-100 transition-colors shadow-sm mb-4"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 border-t border-alabaster/10" />
              <span className="text-[11px] uppercase font-mono text-alabaster/50">
                or email
              </span>
              <div className="flex-1 border-t border-alabaster/10" />
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg text-xs bg-rose-500/10 border border-rose-500/30 text-rose-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-alabaster/80 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-alabaster/40 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="trader@college.edu"
                    className="w-full bg-[#1b2226] border border-alabaster/20 rounded-xl py-2.5 pl-9 pr-3 text-sm text-white placeholder-alabaster/30 focus:outline-none focus:border-stormyTeal"
                    required
                  />
                </div>
              </div>

              {mode === "register" && (
                <div>
                  <label className="block text-xs font-medium text-alabaster/80 mb-1">
                    Leaderboard Pseudonym
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-alabaster/40 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. BullishAarav"
                      className="w-full bg-[#1b2226] border border-alabaster/20 rounded-xl py-2.5 pl-9 pr-3 text-sm text-white placeholder-alabaster/30 focus:outline-none focus:border-stormyTeal"
                      required
                    />
                  </div>
                  <span className="text-[11px] text-alabaster/50 mt-1 block">
                    Public leaderboard handle. Email is never revealed.
                  </span>
                </div>
              )}

              {mode === "register" && (
                <div className="space-y-3 pt-2 text-xs text-alabaster/80">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <button
                      type="button"
                      onClick={() => setIsAdult(!isAdult)}
                      className="mt-0.5 text-stormyTeal-light"
                    >
                      {isAdult ? (
                        <CheckSquare className="w-4 h-4 text-stormyTeal-light" />
                      ) : (
                        <Square className="w-4 h-4 text-alabaster/40" />
                      )}
                    </button>
                    <span>
                      I declare that I am <strong>18 years of age or older</strong> (DPDP India 2023 compliance).
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <button
                      type="button"
                      onClick={() => setAcknowledgedSimulation(!acknowledgedSimulation)}
                      className="mt-0.5 text-stormyTeal-light"
                    >
                      {acknowledgedSimulation ? (
                        <CheckSquare className="w-4 h-4 text-stormyTeal-light" />
                      ) : (
                        <Square className="w-4 h-4 text-alabaster/40" />
                      )}
                    </button>
                    <span>
                      I understand that <strong>Mudra is a 100% virtual simulation</strong> with zero cash value. No real rupee deposit, withdrawal, or broker linkage is involved.
                    </span>
                  </label>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-stormyTeal hover:bg-stormyTeal-light text-white font-semibold text-sm transition-all shadow-md flex items-center justify-center gap-2 mt-4"
              >
                <span>{mode === "register" ? "Create Free Sandbox Account" : "Sign In to Mudra"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-5 text-center text-xs text-alabaster/60">
              {mode === "register" ? (
                <span>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signin");
                      setError(null);
                    }}
                    className="text-stormyTeal-light font-semibold hover:underline"
                  >
                    Sign In
                  </button>
                </span>
              ) : (
                <span>
                  New to Mudra?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("register");
                      setError(null);
                    }}
                    className="text-stormyTeal-light font-semibold hover:underline"
                  >
                    Register for ₹1,00,000 Wallet
                  </button>
                </span>
              )}
            </div>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setShowLegalNotice(true)}
                className="text-[11px] text-alabaster/40 hover:text-alabaster/80 underline"
              >
                View Terms of Service & DPDP 2023 Notice
              </button>
            </div>
          </>
        )}

        {/* Legal & DPDP Modal Drawer */}
        {showLegalNotice && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90">
            <div className="bg-graphite-dark border border-yaleBlue/60 rounded-xl p-5 max-w-md w-full max-h-[80vh] flex flex-col text-xs text-alabaster space-y-3">
              <div className="flex items-center justify-between border-b border-alabaster/10 pb-3">
                <h4 className="font-bold text-white text-sm">
                  Statutory Notice & DPDP 2023 Compliance
                </h4>
                <button
                  onClick={() => setShowLegalNotice(false)}
                  className="p-1 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="overflow-y-auto space-y-2.5 pr-1">
                <p>
                  <strong>No Financial Advice:</strong> Mudra is an educational simulator for Indian equities. We are not a broker, research analyst, or investment adviser and are not registered with SEBI.
                </p>
                <p>
                  <strong>DPDP Act 2023:</strong> In accordance with India’s Digital Personal Data Protection Act 2023, we collect only minimal credentials (email and display name) strictly to maintain session state and render leaderboards.
                </p>
                <p>
                  <strong>Virtual Rupee Valuation:</strong> All balances (starting capital of ₹1,00,000) are virtual numbers in our database with zero monetary value.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowLegalNotice(false)}
                className="w-full py-2 bg-stormyTeal rounded-lg text-white font-semibold text-xs mt-2"
              >
                I Understand
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
