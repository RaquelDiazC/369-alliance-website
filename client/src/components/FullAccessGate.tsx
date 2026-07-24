/**
 * FullAccessGate — freemium wrapper for full-access-only pages (Report Studio,
 * Training Platform). Free tier is gated to the AUS Legislation Brain; these
 * tools require the access code unlocked in the Expert Brain. Reads the same
 * localStorage plan flag the brain sets after a successful /api/brain/unlock.
 */
import { Link } from "wouter";
import { Lock, Sparkles } from "lucide-react";

const NAVY = "#1a1a2e";
const GOLD = "#A68A64";

export function isFullAccess(): boolean {
  try {
    return localStorage.getItem("brain369_plan") === "full";
  } catch {
    return false;
  }
}

export default function FullAccessGate({ title, children }: { title: string; children: React.ReactNode }) {
  if (isFullAccess()) return <>{children}</>;
  return (
    <div className="flex min-h-screen items-center justify-center p-6" style={{ background: "#f4f2ee" }}>
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-7 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: NAVY }}>
          <Lock size={26} style={{ color: GOLD }} />
        </div>
        <h1 className="text-lg font-bold" style={{ color: NAVY }}>{title} — full access</h1>
        <p className="mt-2 text-sm text-gray-600">
          This tool is part of 369 Alliance full access. The <span className="font-semibold" style={{ color: NAVY }}>AUS Legislation Brain</span> is free to try —
          unlock your access code there to open Report Studio, the Training Platform, the specialist brains and site-photo assessment.
        </p>
        <Link
          href="/brain"
          className="mt-5 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white"
          style={{ background: NAVY }}
        >
          <Sparkles size={15} style={{ color: GOLD }} /> Open the Expert Brain to unlock
        </Link>
        <p className="mt-3 text-[11px] text-gray-400">Don't have a code? Contact 369 Alliance.</p>
      </div>
    </div>
  );
}
