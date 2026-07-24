/**
 * FullAccessGate — freemium wrapper for paid-only pages. Each page requires a
 * specific entitlement (report / training / …). Reads the entitlements the
 * brain stored after a successful /api/brain/unlock (localStorage brain369_ents,
 * with migration from the older binary brain369_plan flag).
 */
import { Link } from "wouter";
import { Lock, Sparkles } from "lucide-react";

const NAVY = "#1a1a2e";
const GOLD = "#A68A64";
const ALL_ENTS = ["legis", "brains", "report", "training"];

export function entitlements(): string[] {
  try {
    const e = JSON.parse(localStorage.getItem("brain369_ents") || "[]");
    if (Array.isArray(e) && e.length) return e;
  } catch {}
  // migrate the older binary "full" plan
  if (localStorage.getItem("brain369_plan") === "full") return ALL_ENTS;
  return [];
}
export function hasEntitlement(e: string): boolean {
  return entitlements().includes(e);
}

export default function FullAccessGate({ title, need, children }: { title: string; need: string; children: React.ReactNode }) {
  if (hasEntitlement(need)) return <>{children}</>;
  return (
    <div className="flex min-h-screen items-center justify-center p-6" style={{ background: "#f4f2ee" }}>
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-7 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: NAVY }}>
          <Lock size={26} style={{ color: GOLD }} />
        </div>
        <h1 className="text-lg font-bold" style={{ color: NAVY }}>{title} — paid item</h1>
        <p className="mt-2 text-sm text-gray-600">
          This tool is a 369 Alliance paid item. The <span className="font-semibold" style={{ color: NAVY }}>AUS Legislation Brain</span> is free to try —
          open it to see the plans and unlock your access code (buy this item alone, several items, or the complete package).
        </p>
        <Link
          href="/brain"
          className="mt-5 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white"
          style={{ background: NAVY }}
        >
          <Sparkles size={15} style={{ color: GOLD }} /> See plans & unlock
        </Link>
        <p className="mt-3 text-[11px] text-gray-400">Already paid? Enter your code in the Expert Brain.</p>
      </div>
    </div>
  );
}
