/**
 * DemoReel — 15-second looping product demos for the platform home (/home).
 *
 * Each demo is a self-contained, asset-free "screen recording": a browser-style
 * frame with a scene animated entirely in CSS keyframes on a single 15s cycle.
 * No video files, no CDN, no JS timers — so they load instantly, stay crisp on
 * any screen, and are automatically stilled for `prefers-reduced-motion`.
 *
 * Variants: "brain" · "training" · "drawings" · "report"
 */
import { useId } from "react";

const NAVY = "#1a1a2e";
const NAVY_2 = "#242640";
const GOLD = "#A68A64";
const AMBER = "#C07040";
const CYCLE = 15; // seconds — the hard 15s ceiling for every demo

/** Build one keyframe per element, staggered on the shared 15s cycle. */
function seqCSS(p: string, times: number[]): string {
  return times
    .map((t, i) => {
      const a = Math.min(96, (t / CYCLE) * 100);
      const b = Math.min(97, a + 2.2);
      return `@keyframes ${p}${i}{0%,${a.toFixed(2)}%{opacity:0;transform:translateY(7px)}${b.toFixed(
        2,
      )}%,97%{opacity:1;transform:none}100%{opacity:0}}`;
    })
    .join("");
}

const anim = (p: string, i: number): React.CSSProperties => ({
  animation: `${p}${i} ${CYCLE}s linear infinite`,
  opacity: 0,
});

/* ─────────────────────────────── shared chrome ─────────────────────────────── */

function Frame({
  label,
  tint,
  children,
}: {
  label: string;
  tint: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="overflow-hidden rounded-xl shadow-2xl ring-1 ring-black/10"
      style={{ background: "#fff" }}
    >
      <div
        className="flex items-center gap-2 px-3 py-2"
        style={{ background: NAVY }}
      >
        <span className="flex gap-1.5">
          <i className="block h-2 w-2 rounded-full" style={{ background: "#ff5f57" }} />
          <i className="block h-2 w-2 rounded-full" style={{ background: "#febc2e" }} />
          <i className="block h-2 w-2 rounded-full" style={{ background: "#28c840" }} />
        </span>
        <span
          className="ml-1 truncate rounded px-2 py-0.5 text-[10px] font-semibold tracking-wide"
          style={{ background: "rgba(255,255,255,.08)", color: tint }}
        >
          {label}
        </span>
      </div>
      <div className="relative" style={{ aspectRatio: "16 / 10", background: "#f6f5f2" }}>
        {children}
      </div>
    </div>
  );
}

/* ────────────────────────────────── BRAIN ──────────────────────────────────── */

const BRAIN_Q = "Class 2 balcony — what fall does the NCC require?";
const BRAIN_A = [
  "Balcony substrate must fall to the drainage outlet — **min 1:100** across the whole",
  "trafficable surface, with the membrane turned up **150 mm** at the wall junction and",
  "a **bond breaker fillet** at every internal corner. Threshold: 25 mm step down.",
];
const BRAIN_CITES = [
  { r: "NCC 2022 · F3D5", k: "Deemed-to-Satisfy" },
  { r: "AS 4654.2:2012 · 3.4", k: "External waterproofing" },
  { r: "Defect W1.2.4", k: "DBP defect library" },
];

function BrainDemo({ p }: { p: string }) {
  return (
    <>
      <style>{`
        ${seqCSS(p, [3.4, 5.2, 6.0, 6.8, 8.0, 8.9, 9.8, 11.2])}
        @keyframes ${p}type{0%,8%{width:0}22%,97%{width:100%}100%{width:100%}}
        @keyframes ${p}dots{0%,29%{opacity:0}32%,44%{opacity:1}47%,100%{opacity:0}}
        @keyframes ${p}caret{0%,50%{opacity:1}51%,100%{opacity:0}}
      `}</style>
      <div className="flex h-full flex-col gap-2 p-3">
        {/* free badge */}
        <div className="flex items-center gap-2">
          <span
            className="rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider"
            style={{ background: "#16a34a", color: "#fff" }}
          >
            Free · no card
          </span>
          <span className="text-[10px] font-semibold" style={{ color: NAVY }}>
            AUS Expert Brain · NSW
          </span>
        </div>

        {/* question bubble */}
        <div className="flex justify-end">
          <div
            className="max-w-[86%] overflow-hidden whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[10px] font-medium text-white"
            style={{ background: NAVY, animation: `${p}type ${CYCLE}s steps(48) infinite` }}
          >
            {BRAIN_Q}
          </div>
        </div>

        {/* thinking */}
        <div
          className="flex items-center gap-1 text-[10px]"
          style={{ animation: `${p}dots ${CYCLE}s linear infinite`, opacity: 0, color: GOLD }}
        >
          <span className="font-semibold">Reading NCC 2022 + AS register</span>
          <span style={{ animation: `${p}caret .9s steps(1) infinite` }}>▍</span>
        </div>

        {/* answer */}
        <div className="rounded-lg bg-white p-2.5 shadow-sm ring-1 ring-black/5">
          {BRAIN_A.map((line, i) => (
            <p
              key={i}
              className="text-[10px] leading-[1.55]"
              style={{ ...anim(p, i + 1), color: "#333" }}
              dangerouslySetInnerHTML={{
                __html: line.replace(
                  /\*\*(.+?)\*\*/g,
                  `<b style="color:${AMBER}">$1</b>`,
                ),
              }}
            />
          ))}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {BRAIN_CITES.map((c, i) => (
              <span
                key={c.r}
                className="rounded border px-1.5 py-1 text-[8px] leading-tight"
                style={{ ...anim(p, i + 4), borderColor: GOLD, background: "#faf8f4" }}
              >
                <b style={{ color: NAVY }}>{c.r}</b>
                <br />
                <span style={{ color: "#8a8478" }}>{c.k}</span>
              </span>
            ))}
          </div>
        </div>

        <div
          className="mt-auto rounded-md px-2 py-1.5 text-center text-[9px] font-bold"
          style={{ ...anim(p, 7), background: "#e8f5ec", color: "#166534" }}
        >
          Every answer cited. Every clause traceable to the legislation.
        </div>
      </div>
    </>
  );
}

/* ───────────────────────────────── TRAINING ────────────────────────────────── */

const TRAIN_TREE = [
  "Section C · Fire resistance",
  "Section E · Services & equipment",
  "Section F · Health & amenity",
  "  F3D5 · Waterproofing of wet areas",
  "Section J · Energy efficiency",
];

function TrainingDemo({ p }: { p: string }) {
  return (
    <>
      <style>{`
        ${seqCSS(p, [1.6, 2.1, 2.6, 3.1, 3.6, 5.0, 6.2, 7.4, 8.6, 10.0, 11.4, 12.4])}
        @keyframes ${p}bar{0%,30%{width:8%}60%{width:46%}88%,100%{width:82%}}
        @keyframes ${p}spin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}
      `}</style>
      <div className="flex h-full" style={{ background: "#0f1420" }}>
        {/* clause tree */}
        <div className="w-[38%] border-r p-2" style={{ borderColor: "#2a3149" }}>
          <p className="mb-1.5 text-[8px] font-bold uppercase tracking-wider" style={{ color: GOLD }}>
            824 NCC clauses
          </p>
          {TRAIN_TREE.map((t, i) => (
            <p
              key={t}
              className="truncate rounded px-1.5 py-1 text-[8.5px]"
              style={{
                ...anim(p, i),
                color: i === 3 ? "#0f1420" : "#c3c9da",
                background: i === 3 ? GOLD : "transparent",
                fontWeight: i === 3 ? 800 : 500,
              }}
            >
              {t}
            </p>
          ))}
          <div className="mt-3 h-1 rounded-full" style={{ background: "#2a3149" }}>
            <div
              className="h-1 rounded-full"
              style={{ background: "#2dd4bf", animation: `${p}bar ${CYCLE}s ease-in-out infinite` }}
            />
          </div>
          <p className="mt-1 text-[7.5px]" style={{ color: "#6b7490" }}>
            Progress saved
          </p>
        </div>

        {/* lesson body */}
        <div className="flex-1 p-2.5">
          <p className="text-[10px] font-black text-white" style={anim(p, 5)}>
            F3D5 — Waterproofing of wet areas
          </p>

          {/* 3D evidence board */}
          <div
            className="relative mt-2 overflow-hidden rounded-md"
            style={{ ...anim(p, 6), height: "44%", background: "#1d2337" }}
          >
            <svg viewBox="0 0 200 90" className="h-full w-full">
              <defs>
                <linearGradient id={`${p}g`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#2a3350" />
                  <stop offset="1" stopColor="#161b2c" />
                </linearGradient>
              </defs>
              <rect width="200" height="90" fill={`url(#${p}g)`} />
              {/* room in axonometric */}
              <path d="M30 66 L100 82 L170 60 L100 44 Z" fill="#39415f" stroke={GOLD} strokeWidth="0.8" />
              <path d="M30 66 L30 36 L100 20 L100 44 Z" fill="#2b3350" stroke={GOLD} strokeWidth="0.8" />
              <path d="M170 60 L170 30 L100 20 L100 44 Z" fill="#232a44" stroke={GOLD} strokeWidth="0.8" />
              {/* fall arrow */}
              <path d="M50 62 L92 71" stroke="#2dd4bf" strokeWidth="1.4" markerEnd="" />
              <circle cx="96" cy="72" r="2.6" fill="#2dd4bf" />
              <text x="52" y="58" fill="#2dd4bf" fontSize="5.5" fontWeight="700">
                fall 1:80
              </text>
              <text x="102" y="76" fill="#2dd4bf" fontSize="5">
                floor waste
              </text>
              {/* upturn callout */}
              <circle cx="34" cy="46" r="3.4" fill={AMBER} style={anim(p, 7)} />
              <text x="40" y="48" fill="#fff" fontSize="5" style={anim(p, 7)}>
                150 mm upturn
              </text>
            </svg>
          </div>

          {/* checklist */}
          {["Substrate falls verified", "Membrane upturn ≥150 mm", "Bond breaker at corners"].map((t, i) => (
            <p key={t} className="mt-1 text-[8px]" style={{ ...anim(p, i + 8), color: "#c3c9da" }}>
              <span style={{ color: "#2dd4bf", fontWeight: 900 }}>—</span> {t}
            </p>
          ))}
          <p
            className="mt-1.5 inline-block rounded px-1.5 py-0.5 text-[8px] font-black"
            style={{ ...anim(p, 11), background: "#2dd4bf", color: "#0f1420" }}
          >
            Knowledge check passed · 5/5
          </p>
        </div>
      </div>
    </>
  );
}

/* ────────────────────────────── DRAWINGS AUDIT ─────────────────────────────── */

const DRAW_DEFECTS = [
  { c: "Arc-W1.1", s: "Critical", t: "No fall shown to floor waste — wet area", col: "#dc2626" },
  { c: "Arc-F2", s: "Critical", t: "FRL on GA plan conflicts with fire plan", col: "#dc2626" },
  { c: "Str-L8", s: "Major", t: "Service penetration not coordinated", col: "#d97706" },
  { c: "Fcd-L1.1", s: "Major", t: "Balcony threshold detail missing", col: "#d97706" },
];

function DrawingsDemo({ p }: { p: string }) {
  return (
    <>
      <style>{`
        ${seqCSS(p, [1.2, 6.6, 7.6, 8.6, 9.6, 11.0, 12.2])}
        @keyframes ${p}scan{0%,12%{transform:translateY(0%);opacity:0}15%{opacity:1}55%{transform:translateY(1000%);opacity:1}58%,100%{opacity:0}}
        @keyframes ${p}pin{0%,32%{opacity:0;transform:scale(.3)}36%{opacity:1;transform:scale(1.35)}40%,97%{opacity:1;transform:scale(1)}100%{opacity:0}}
        @keyframes ${p}pin2{0%,40%{opacity:0;transform:scale(.3)}44%{opacity:1;transform:scale(1.35)}48%,97%{opacity:1;transform:scale(1)}100%{opacity:0}}
        @keyframes ${p}pin3{0%,48%{opacity:0;transform:scale(.3)}52%{opacity:1;transform:scale(1.35)}56%,97%{opacity:1;transform:scale(1)}100%{opacity:0}}
        @keyframes ${p}roll{0%,60%{transform:translateY(0)}66%{transform:translateY(-1.15em)}72%{transform:translateY(-2.3em)}78%,100%{transform:translateY(-3.45em)}}
      `}</style>
      <div className="flex h-full">
        {/* drawing canvas */}
        <div className="relative w-[56%] overflow-hidden" style={{ background: "#fbfaf7" }}>
          <div className="absolute inset-0 p-2" style={anim(p, 0)}>
            <svg viewBox="0 0 160 110" className="h-full w-full">
              {/* sheet border + title block */}
              <rect x="2" y="2" width="156" height="106" fill="none" stroke="#b9b4a8" strokeWidth="0.7" />
              <rect x="112" y="88" width="44" height="18" fill="#fff" stroke="#b9b4a8" strokeWidth="0.6" />
              <text x="114" y="93" fontSize="3.1" fill={NAVY} fontWeight="700">
                REGULATED DESIGN
              </text>
              <text x="114" y="97" fontSize="2.7" fill="#8a8478">
                DP Reg No · Rev C
              </text>
              <text x="114" y="101" fontSize="2.7" fill="#8a8478">
                Issue for Construction
              </text>
              {/* apartment plan */}
              <g stroke={NAVY} strokeWidth="0.85" fill="none">
                <rect x="10" y="10" width="94" height="70" />
                <path d="M10 46 H62 M62 10 V80 M62 46 H104 M32 46 V80" />
                <rect x="14" y="50" width="16" height="12" strokeWidth="0.6" />
                <rect x="36" y="50" width="10" height="10" strokeWidth="0.6" />
                <path d="M66 14 h34 M66 20 h34" strokeWidth="0.4" stroke="#c8c3b6" />
              </g>
              <text x="16" y="20" fontSize="3.4" fill="#8a8478">
                UNIT 401
              </text>
              <text x="15" y="66" fontSize="2.8" fill="#8a8478">
                BATH
              </text>
              <text x="37" y="66" fontSize="2.8" fill="#8a8478">
                ENS
              </text>
              <text x="70" y="52" fontSize="2.8" fill="#8a8478">
                BALCONY
              </text>

              {/* defect pins */}
              <g style={{ animation: `${p}pin ${CYCLE}s linear infinite`, transformOrigin: "22px 56px" }}>
                <circle cx="22" cy="56" r="4.6" fill="#dc2626" opacity=".9" />
                <text x="22" y="57.6" fontSize="4.4" fill="#fff" textAnchor="middle" fontWeight="700">
                  1
                </text>
              </g>
              <g style={{ animation: `${p}pin2 ${CYCLE}s linear infinite`, transformOrigin: "62px 28px" }}>
                <circle cx="62" cy="28" r="4.6" fill="#dc2626" opacity=".9" />
                <text x="62" y="29.6" fontSize="4.4" fill="#fff" textAnchor="middle" fontWeight="700">
                  2
                </text>
              </g>
              <g style={{ animation: `${p}pin3 ${CYCLE}s linear infinite`, transformOrigin: "84px 62px" }}>
                <circle cx="84" cy="62" r="4.6" fill="#d97706" opacity=".9" />
                <text x="84" y="63.6" fontSize="4.4" fill="#fff" textAnchor="middle" fontWeight="700">
                  3
                </text>
              </g>
            </svg>
          </div>
          {/* scan line */}
          <div
            className="absolute left-0 h-[9%] w-full"
            style={{
              top: 0,
              background: `linear-gradient(180deg, transparent, ${AMBER}44, ${AMBER})`,
              boxShadow: `0 0 12px ${AMBER}`,
              animation: `${p}scan ${CYCLE}s ease-in-out infinite`,
            }}
          />
        </div>

        {/* findings panel */}
        <div className="flex w-[44%] flex-col p-2" style={{ background: NAVY_2 }}>
          <p className="text-[8px] font-bold uppercase tracking-wider" style={{ color: GOLD }}>
            9 disciplines cross-checked
          </p>
          {DRAW_DEFECTS.map((d, i) => (
            <div
              key={d.c}
              className="mt-1 rounded px-1.5 py-1"
              style={{ ...anim(p, i + 1), background: "rgba(255,255,255,.06)" }}
            >
              <span className="text-[7.5px] font-black" style={{ color: d.col }}>
                {d.s.toUpperCase()}
              </span>{" "}
              <span className="text-[7.5px] font-bold text-white">{d.c}</span>
              <p className="text-[7.5px] leading-tight text-white/65">{d.t}</p>
            </div>
          ))}
          <div className="mt-auto flex items-end gap-2">
            <div className="overflow-hidden" style={{ height: "1.15em", lineHeight: "1.15em" }}>
              <div style={{ animation: `${p}roll ${CYCLE}s steps(1) infinite` }}>
                {["0", "24", "51", "68"].map(n => (
                  <div key={n} className="text-[20px] font-black" style={{ color: GOLD }}>
                    {n}
                  </div>
                ))}
              </div>
            </div>
            <span className="pb-0.5 text-[8px] font-semibold text-white/70">
              compliance score
              <br />
              <span style={{ color: "#dc2626" }}>not declarable yet</span>
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────── REPORT STUDIO ─────────────────────────────── */

const REPORT_ROWS = [
  { t: "Waterproofing — L3 bathrooms", c: "Serious", col: "#dc2626", a: "Rectification order" },
  { t: "Fire — riser penetrations B2", c: "Potential serious", col: "#d97706", a: "Stop work" },
  { t: "Structure — transfer slab", c: "Minor", col: "#2563eb", a: "Direction" },
  { t: "Enclosure — window head flashing", c: "Compliant", col: "#16a34a", a: "Recommendation" },
];

function ReportDemo({ p }: { p: string }) {
  return (
    <>
      <style>{`
        ${seqCSS(p, [1.0, 1.6, 2.2, 2.8, 4.6, 5.8, 7.0, 8.2, 10.0, 11.2, 12.4])}
        @keyframes ${p}pulse{0%,72%{box-shadow:0 0 0 0 ${GOLD}00}80%{box-shadow:0 0 0 6px ${GOLD}00}100%{box-shadow:0 0 0 0 ${GOLD}00}}
      `}</style>
      <div className="flex h-full flex-col p-2.5">
        <p className="text-[8px] font-bold uppercase tracking-wider" style={{ color: AMBER }}>
          Evidence — drawings + site photos
        </p>
        <div className="mt-1 flex gap-1.5">
          {["L3 · WP", "B2 · Fire", "L1 · Str", "Fac · BE"].map((t, i) => (
            <div
              key={t}
              className="flex h-9 flex-1 flex-col justify-end rounded p-1 text-[7px] font-semibold text-white"
              style={{
                ...anim(p, i),
                background: `linear-gradient(135deg, ${NAVY}, ${NAVY_2})`,
              }}
            >
              {t}
            </div>
          ))}
        </div>

        <p className="mt-2 text-[8px] font-bold uppercase tracking-wider" style={{ color: AMBER }}>
          Findings register
        </p>
        <div className="mt-1 overflow-hidden rounded ring-1 ring-black/5">
          {REPORT_ROWS.map((r, i) => (
            <div
              key={r.t}
              className="flex items-center gap-1.5 border-b bg-white px-1.5 py-1 last:border-0"
              style={{ ...anim(p, i + 4), borderColor: "#eee" }}
            >
              <i className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: r.col }} />
              <span className="flex-1 truncate text-[8px] font-medium" style={{ color: NAVY }}>
                {r.t}
              </span>
              <span className="text-[7px] font-black" style={{ color: r.col }}>
                {r.c}
              </span>
              <span className="hidden text-[7px] text-[#8a8478] sm:inline">{r.a}</span>
            </div>
          ))}
        </div>

        <p
          className="mt-2 rounded bg-white p-1.5 text-[7.5px] leading-snug ring-1 ring-black/5"
          style={{ ...anim(p, 8), color: "#4b5563" }}
        >
          <b style={{ color: NAVY }}>Executive summary — </b>
          Two serious defects identified across the waterproofing and fire regimes. The
          building is not suitable for an occupation certificate until rectified…
        </p>

        <div className="mt-auto flex gap-1.5 pt-1.5">
          <span
            className="rounded px-2 py-1 text-[8px] font-black"
            style={{ ...anim(p, 9), background: NAVY, color: "#fff" }}
          >
            Official-format PDF
          </span>
          <span
            className="rounded px-2 py-1 text-[8px] font-black"
            style={{ ...anim(p, 10), background: GOLD, color: NAVY }}
          >
            Excel register
          </span>
        </div>
      </div>
    </>
  );
}

/* ──────────────────────────────── public API ───────────────────────────────── */

export type DemoKind = "brain" | "training" | "drawings" | "report";

const META: Record<DemoKind, { label: string; tint: string }> = {
  brain: { label: "369-alliance.com / brain", tint: "#7ee2a8" },
  training: { label: "369-alliance.com / training", tint: "#8fd8ff" },
  drawings: { label: "369-alliance.com / drawing-analyser", tint: "#f0b98a" },
  report: { label: "369-alliance.com / report-studio", tint: "#e3cfa6" },
};

export function DemoReel({ kind }: { kind: DemoKind }) {
  const raw = useId();
  const p = `d${raw.replace(/[^a-zA-Z0-9]/g, "")}`; // CSS-safe keyframe prefix
  const m = META[kind];
  return (
    <figure className="demo-reel m-0">
      <style>{`
        @media (prefers-reduced-motion: reduce){
          .demo-reel *{animation:none !important;opacity:1 !important;transform:none !important}
        }
      `}</style>
      <Frame label={m.label} tint={m.tint}>
        {kind === "brain" && <BrainDemo p={p} />}
        {kind === "training" && <TrainingDemo p={p} />}
        {kind === "drawings" && <DrawingsDemo p={p} />}
        {kind === "report" && <ReportDemo p={p} />}
      </Frame>
      <figcaption className="sr-only">
        15-second looping demonstration of the {kind} module.
      </figcaption>
    </figure>
  );
}

export default DemoReel;
