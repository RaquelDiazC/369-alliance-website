/**
 * 369 Alliance – Client System Sign-In Popup
 * Email/password login gate + forgot password flow
 * Design: Deep Navy #1a1a2e + Bronze #A68A64, matches ContactPopups
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { X, LogIn, Mail, ArrowLeft, CheckCircle } from "lucide-react";

interface SignInPopupProps {
  open: boolean;
  onClose: () => void;
}

const inputCls =
  "w-full border rounded-lg px-3 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-amber-200 focus:border-amber-400 bg-white text-gray-800 border-gray-200";

export function SignInPopup({ open, onClose }: SignInPopupProps) {
  const [, navigate] = useLocation();
  const [view, setView] = useState<"signin" | "forgot" | "reset-sent">("signin");
  const [email, setEmail] = useState("demo@369alliance.com");
  const [password, setPassword] = useState("demo");
  const [resetEmail, setResetEmail] = useState("");

  if (!open) return null;

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    // Dev mode: navigate without validation
    onClose();
    navigate("/system");
  };

  const handleResetRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setView("reset-sent");
  };

  const handleClose = () => {
    setView("signin");
    setEmail("");
    setPassword("");
    setResetEmail("");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(2px)", padding: "40px 16px 40px" }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="w-full max-w-md rounded-xl overflow-hidden shadow-2xl" style={{ background: "#fff" }}>
        {/* Header */}
        <div className="flex items-start justify-between px-7 py-5" style={{ background: "#1a1a2e" }}>
          <div>
            <h2 className="text-xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
              {view === "signin" ? "Client System" : "Reset Password"}
            </h2>
            <p className="text-sm mt-0.5" style={{ color: "#A68A64" }}>
              {view === "signin"
                ? "Sign in to access your portal"
                : view === "forgot"
                  ? "Enter your email to receive a reset link"
                  : "Check your inbox"}
            </p>
          </div>
          <button onClick={handleClose} className="text-white/60 hover:text-white transition-colors mt-0.5">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-7 py-6">
          {/* Sign In Form */}
          {view === "signin" && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>
                  Email <span style={{ color: "#A68A64" }}>*</span>
                </label>
                <input
                  type="text"
                  className={inputCls}
                  placeholder="Email or username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>
                  Password <span style={{ color: "#A68A64" }}>*</span>
                </label>
                <input
                  type="password"
                  className={inputCls}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-lg"
                style={{ background: "linear-gradient(135deg,#7A6342,#A68A64)" }}
              >
                <LogIn size={16} />
                Sign In
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setView("forgot")}
                  className="text-xs font-medium transition-colors hover:underline"
                  style={{ color: "#A68A64" }}
                >
                  Forgot your password?
                </button>
              </div>
            </form>
          )}

          {/* Forgot Password Form */}
          {view === "forgot" && (
            <form onSubmit={handleResetRequest} className="space-y-4">
              <p className="text-sm" style={{ color: "#6b7280" }}>
                Enter the email address associated with your account and we'll send you a link to reset your password.
              </p>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>
                  Email <span style={{ color: "#A68A64" }}>*</span>
                </label>
                <input
                  type="email"
                  className={inputCls}
                  placeholder="you@company.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-lg"
                style={{ background: "linear-gradient(135deg,#7A6342,#A68A64)" }}
              >
                <Mail size={16} />
                Send Reset Link
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setView("signin")}
                  className="text-xs font-medium flex items-center justify-center gap-1 mx-auto transition-colors hover:underline"
                  style={{ color: "#A68A64" }}
                >
                  <ArrowLeft size={12} />
                  Back to Sign In
                </button>
              </div>
            </form>
          )}

          {/* Reset Sent Confirmation */}
          {view === "reset-sent" && (
            <div className="text-center space-y-4 py-4">
              <div className="flex justify-center">
                <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "rgba(166,138,100,0.12)" }}>
                  <CheckCircle size={28} style={{ color: "#A68A64" }} />
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Reset link sent</p>
                <p className="text-xs mt-1" style={{ color: "#6b7280" }}>
                  If an account exists for <strong>{resetEmail}</strong>, you'll receive an email with instructions to reset your password.
                </p>
              </div>
              <button
                onClick={() => { setView("signin"); setResetEmail(""); }}
                className="text-xs font-medium flex items-center justify-center gap-1 mx-auto transition-colors hover:underline"
                style={{ color: "#A68A64" }}
              >
                <ArrowLeft size={12} />
                Back to Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
