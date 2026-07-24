/**
 * AUS Expert Brain — state-aware Australian building legislation Q&A.
 *
 * Pick a jurisdiction tab (NSW · VIC · QLD · WA · SA · TAS · ACT · NT), ask
 * any question or drop a site photo: the brain answers with the correct
 * legislation for that state — NCC 2022 clauses (full text cards from the
 * 369 Alliance master register), Australian Standards, state acts, licensing,
 * warranty and dispute pathways. Backed by /api/brain/*.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { Streamdown } from "streamdown";
import {
  ArrowLeft,
  BookOpenText,
  Brain,
  Camera,
  ChevronDown,
  CircleAlert,
  Landmark,
  LayoutTemplate,
  Loader2,
  Lock,
  Menu,
  Paperclip,
  Scale,
  ScrollText,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";

const NAVY = "#1a1a2e";
const GOLD = "#A68A64";
const AMBER = "#C07040";

// ---------------------------------------------------------------- types
interface StateAct {
  n: string;
  note: string;
}
interface StateProfile {
  code: string;
  name: string;
  regulator: string;
  adoption: string;
  acts: StateAct[];
  licensing: string;
  warranty: string;
  contracts: string;
  disputes: string;
  sop: string;
  variations: string[];
  watchouts: string[];
}
interface Persona {
  key: string;
  name: string;
  subtitle: string;
  section: string;
  kind: "business" | "legislation";
  expertise: string;
  style: string;
  whenToUse: string;
  focus: string;
}
interface BrainTemplate {
  key: string;
  category: string;
  title: string;
  desc: string;
  questions: string[];
}
interface BrainStatus {
  ai: boolean;
  model: string;
  counts: { vol1: number; hp: number; standards: number; topics: number; defects: number; editions: number; boards: number; stateBoards: number };
  variationBoards: Record<string, number>;
  states: StateProfile[];
  personaSections: string[];
  personas: Persona[];
  templates: BrainTemplate[];
  freeLimit?: number;
}
interface Citation {
  ref: string;
  kind: string;
  note: string;
  title?: string;
  section?: string;
  part?: string;
  clauseType?: string;
  text?: string;
  as?: string;
  asClauses?: string;
  page?: number | null;
  legacy2019?: string;
  volume?: string;
  standardTitle?: string;
  board?: boolean;
  stateBoard?: boolean;
  variations?: string[];
}
interface DefectHit {
  id: string;
  regime: string;
  subcategory: string | null;
  description: string | null;
  ncc2022: string | null;
  ncc2019: string | null;
  pathway: string | null;
}
interface Msg {
  role: "user" | "assistant";
  state: string;
  content: string;
  personaName?: string;
  image?: string;
  observation?: string;
  citations?: Citation[];
  defects?: DefectHit[];
  followups?: string[];
  error?: boolean;
  streaming?: boolean;
  divider?: boolean; // "now talking to X" separator, not a real message
}

const LS_THREAD = "brain369_thread";
const LS_STATE = "brain369_state";
const LS_PERSONA = "brain369_persona";
const LS_PLAN = "brain369_plan";
const LS_CODE = "brain369_code";
const FREE_LIMIT = 5;

function loadThread(): Msg[] {
  try {
    const t = JSON.parse(localStorage.getItem(LS_THREAD) || "[]");
    return Array.isArray(t) ? t.filter(m => m && m.role && !m.streaming) : [];
  } catch {
    return [];
  }
}

function usageKey(): string {
  return "brain369_usage_" + new Date().toISOString().slice(0, 10);
}
function todayCount(): number {
  return Number(localStorage.getItem(usageKey()) || "0");
}

/** Heuristic: does this question belong to the legislation engine rather than a business brain? */
function looksLegislation(q: string): boolean {
  if (!q.trim()) return false;
  if (/\b[A-Z]{1,2}\d{1,3}[A-Z]\d{1,3}\b/.test(q)) return true;
  return /\b(ncc|bca|clause|deemed[- ]to[- ]satisfy|\bdts\b|frl|waterproof|fire rating|fire[- ]rated|sprinkler|balustrade|egress|as\s?\d|section\s[a-j]\b|part\s[a-j]\d|building code|housing provisions|australian standard)\b/i.test(q);
}

// ---------------------------------------------------------------- suggestions
const GENERIC_SUGGESTIONS = [
  "Which NCC clause covers waterproofing of a Class 2 balcony?",
  "Minimum ceiling height for habitable rooms?",
  "What FRL does a wall between sole-occupancy units need?",
];
const STATE_SUGGESTIONS: Record<string, string[]> = {
  NSW: ["What must be lodged on the Planning Portal before Class 2 work starts?", "When is HBCF insurance required, and when does the strata bond apply instead?"],
  VIC: ["Do I need Domestic Building Insurance for a $25,000 renovation?", "What triggers a BAL assessment in Victoria?"],
  QLD: ["What QBCC licence do I need for $10,000 of building work?", "Which QDC part covers siting of a single dwelling?"],
  WA: ["Certified vs uncertified building permit application — what is the difference?", "When is Home Indemnity Insurance required in WA?"],
  SA: ["What insurance applies to a $30,000 home extension in SA?", "What are the Ministerial Building Standards?"],
  TAS: ["Is a new deck low-risk, notifiable or permit work in Tasmania?", "Does Tasmania require home warranty insurance?"],
  ACT: ["What statutory warranties apply to residential building work in the ACT?", "Which act licenses builders in the ACT?"],
  NT: ["What wind region applies in Darwin and what does it change structurally?", "Is my site inside a building control area?"],
};

const KIND_META: Record<string, { label: string; color: string }> = {
  ncc: { label: "NCC 2022", color: GOLD },
  hp: { label: "Housing Provisions", color: GOLD },
  as: { label: "Australian Standard", color: AMBER },
  state: { label: "State legislation", color: NAVY },
  other: { label: "Reference", color: "#6b7280" },
};

// ---------------------------------------------------------------- helpers
/** NCC clause codes (F5D2, B1P1, S1C1 …) → blue clickable links that drive the board panel. */
const CLAUSE_CODE_RE = /\b([A-Z]{1,2}\d{1,3}[A-Z]\d{1,3})\b/g;

function linkifyClauses(md: string): string {
  return md.replace(CLAUSE_CODE_RE, "[$1](#board-$1)");
}

async function downscaleImage(file: File, maxDim = 1400): Promise<string> {
  const dataUrl: string = await new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = () => reject(new Error("read failed"));
    fr.readAsDataURL(file);
  });
  const img = new Image();
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = () => reject(new Error("decode failed"));
    img.src = dataUrl;
  });
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  if (scale === 1 && file.size < 900_000) return dataUrl;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.85);
}

// ---------------------------------------------------------------- sub-components
function BoardImg({ src, label }: { src: string; label: string }) {
  const [failed, setFailed] = useState(false);
  const [zoom, setZoom] = useState(false);
  if (failed) return null;
  return (
    <div className="mt-2">
      <p className="mb-1 text-[10px] font-bold uppercase tracking-wide" style={{ color: GOLD }}>{label}</p>
      <img
        src={src}
        alt={label}
        loading="lazy"
        onError={() => setFailed(true)}
        onClick={() => setZoom(z => !z)}
        className="w-full cursor-zoom-in rounded-lg border border-gray-200"
        title="Click to enlarge"
      />
      {zoom && (
        <div className="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-black/80 p-4" onClick={() => setZoom(false)}>
          <img src={src} alt={label} className="max-h-full max-w-full rounded-lg" />
        </div>
      )}
    </div>
  );
}

function CitationCard({ c, stateCode, onView }: { c: Citation; stateCode: string; onView?: () => void }) {
  const [open, setOpen] = useState(false);
  const meta = KIND_META[c.kind] || KIND_META.other;
  const expandable = !!(c.text || c.as || c.asClauses || c.board || c.stateBoard);
  return (
    <div className="rounded-lg border bg-white text-left shadow-sm" style={{ borderColor: `${meta.color}55` }}>
      <button
        type="button"
        onClick={() => {
          if (expandable) setOpen(o => !o);
          onView?.();
        }}
        className={`flex w-full items-start gap-2 p-2.5 ${expandable ? "cursor-pointer" : "cursor-default"}`}
      >
        <span
          className="mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white"
          style={{ background: meta.color }}
        >
          {meta.label}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold" style={{ color: NAVY }}>
            {c.ref}
            {c.title ? ` — ${c.title}` : c.standardTitle ? ` — ${c.standardTitle}` : ""}
          </span>
          {(c.section || c.part) && (
            <span className="block truncate text-xs text-gray-500">
              {[c.volume, c.section && `Section ${c.section}`, c.part].filter(Boolean).join(" · ")}
              {c.legacy2019 ? ` · 2019: ${c.legacy2019}` : ""}
            </span>
          )}
          {c.note && <span className="block text-xs text-gray-600">{c.note}</span>}
        </span>
        {expandable && (
          <ChevronDown size={16} className={`mt-1 shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
        )}
      </button>
      {open && (
        <div className="border-t px-3 py-2 text-xs leading-relaxed text-gray-700" style={{ borderColor: `${meta.color}33` }}>
          {c.text && <p className="whitespace-pre-wrap">{c.text}</p>}
          {c.as && (
            <p className="mt-2">
              <span className="font-semibold" style={{ color: AMBER }}>Referenced AS:</span> {c.as}
              {c.asClauses ? ` — ${c.asClauses}` : ""}
            </p>
          )}
          {typeof c.page === "number" && <p className="mt-1 text-gray-400">NCC 2022 PDF p.{c.page}</p>}
          {c.board && <BoardImg src={`/api/brain/board/${encodeURIComponent(c.ref)}`} label={`Evidence board — ${c.ref}`} />}
          {c.stateBoard && (
            <BoardImg src={`/api/brain/board/${stateCode}/${encodeURIComponent(c.ref)}`} label={`${stateCode} variation board — ${c.ref}`} />
          )}
          {!!c.variations?.length && (
            <p className="mt-2 text-[11px] text-gray-500">
              <span className="font-semibold" style={{ color: NAVY }}>State variations exist:</span> {c.variations.join(" · ")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function DefectCard({ d }: { d: DefectHit }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-left">
      <div className="flex items-center gap-2">
        <CircleAlert size={15} className="text-red-600" />
        <span className="text-sm font-bold text-red-700">{d.id}</span>
        <span className="text-xs text-gray-600">{d.regime}{d.subcategory ? ` · ${d.subcategory}` : ""}</span>
        {d.pathway && (
          <span className="ml-auto rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">RAB {d.pathway}</span>
        )}
      </div>
      {d.description && <p className="mt-1 text-xs text-gray-700">{d.description}</p>}
      {d.ncc2022 && <p className="mt-1 text-[11px] text-gray-500">NCC 2022: {d.ncc2022}</p>}
    </div>
  );
}

function StatePanel({ s }: { s: StateProfile }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-gray-200 bg-white/90 shadow-sm">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5">
        <span className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: NAVY }}>
          <Landmark size={15} style={{ color: GOLD }} /> {s.regulator.split(";")[0]}
        </span>
        <span className="hidden items-center gap-1.5 text-xs text-gray-600 md:flex">
          <ShieldCheck size={14} style={{ color: GOLD }} /> {s.warranty.split("—")[0].split("(")[0].trim()}
        </span>
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="ml-auto flex items-center gap-1 text-xs font-medium"
          style={{ color: GOLD }}
        >
          {open ? "Hide" : "Legislation map"}
          <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>
      {open && (
        <div className="grid gap-4 border-t border-gray-100 px-4 py-3 text-xs md:grid-cols-2">
          <div>
            <p className="mb-1 flex items-center gap-1 font-bold uppercase tracking-wide" style={{ color: NAVY }}>
              <ScrollText size={13} style={{ color: GOLD }} /> Key legislation
            </p>
            <ul className="space-y-1">
              {s.acts.map(a => (
                <li key={a.n} className="text-gray-700">
                  <span className="font-semibold">{a.n}</span> — {a.note}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-gray-600"><span className="font-semibold">NCC legal force:</span> {s.adoption}</p>
            <p className="mt-1 text-gray-600"><span className="font-semibold">Security of payment:</span> {s.sop}</p>
          </div>
          <div>
            <p className="mb-1 flex items-center gap-1 font-bold uppercase tracking-wide" style={{ color: NAVY }}>
              <Scale size={13} style={{ color: GOLD }} /> State layer
            </p>
            <p className="text-gray-600"><span className="font-semibold">Licensing:</span> {s.licensing}</p>
            <p className="mt-1 text-gray-600"><span className="font-semibold">Consumer cover:</span> {s.warranty}</p>
            <p className="mt-1 text-gray-600"><span className="font-semibold">Contracts:</span> {s.contracts}</p>
            <p className="mt-1 text-gray-600"><span className="font-semibold">Disputes:</span> {s.disputes}</p>
            <p className="mt-2 font-semibold text-gray-700">NCC variations & overlays</p>
            <ul className="list-disc space-y-0.5 pl-4 text-gray-600">
              {s.variations.map(v => <li key={v}>{v}</li>)}
            </ul>
            <p className="mt-2 font-semibold text-gray-700">Watch-outs</p>
            <ul className="list-disc space-y-0.5 pl-4 text-gray-600">
              {s.watchouts.map(w => <li key={w}>{w}</li>)}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function BrainSidebar({
  status, personaKey, onPick, panelMode, setPanelMode, panelSel, togglePanelSel, locked, onLocked,
}: {
  status: BrainStatus;
  personaKey: string | null;
  onPick: (k: string | null) => void;
  panelMode: boolean;
  setPanelMode: (b: boolean) => void;
  panelSel: string[];
  togglePanelSel: (k: string) => void;
  locked: boolean;
  onLocked: () => void;
}) {
  return (
    <div className="flex h-full flex-col overflow-y-auto border-r border-gray-200 bg-white">
      <div className="border-b border-gray-100 p-3">
        <button
          type="button"
          onClick={() => onPick(null)}
          className="w-full rounded-lg border px-3 py-2 text-left"
          style={personaKey === null && !panelMode ? { borderColor: GOLD, background: "#faf7f2" } : { borderColor: "#e5e7eb" }}
        >
          <span className="block text-sm font-bold" style={{ color: NAVY }}>AUS Legislation Brain</span>
          <span className="block text-[11px] text-gray-500">All-in-one legislation engine (state tabs + photo)</span>
        </button>
        <button
          type="button"
          onClick={() => (locked ? onLocked() : setPanelMode(!panelMode))}
          className="mt-2 flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left"
          style={panelMode ? { borderColor: NAVY, background: "#eef0f6" } : { borderColor: "#e5e7eb" }}
        >
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold" style={{ color: NAVY }}>Multi-Persona Consultation</span>
            <span className="block text-[11px] text-gray-500">
              {panelMode ? `Selecting panel — ${panelSel.length}/4 brains ticked` : "Convene 2-4 brains on one question"}
            </span>
          </span>
          {locked && <Lock size={13} className="shrink-0 text-gray-400" />}
        </button>
      </div>
      {status.personaSections.map(sec => {
        const items = status.personas.filter(p => p.section === sec);
        if (!items.length) return null;
        return (
          <div key={sec} className="px-3 pb-1 pt-3">
            <p className="mb-1 px-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">{sec}</p>
            {items.map(p => {
              const active = panelMode ? panelSel.includes(p.key) : personaKey === p.key;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => (locked ? onLocked() : panelMode ? togglePanelSel(p.key) : onPick(p.key))}
                  className="mb-0.5 flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left hover:bg-gray-50"
                  style={active ? { background: "#faf7f2", boxShadow: `inset 2px 0 0 ${GOLD}` } : undefined}
                >
                  {panelMode && !locked && (
                    <span
                      className="mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border text-[9px] font-bold text-white"
                      style={active ? { background: GOLD, borderColor: GOLD } : { borderColor: "#cbd5e1" }}
                    >
                      {active ? "✓" : ""}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold" style={{ color: NAVY }}>{p.name}</span>
                    <span className="block truncate text-[11px] text-gray-500">{p.subtitle}</span>
                  </span>
                  {locked && <Lock size={12} className="mt-0.5 shrink-0 text-gray-300" />}
                </button>
              );
            })}
          </div>
        );
      })}
      <div className="h-4" />
    </div>
  );
}

function PersonaIntroCard({ p }: { p: Persona }) {
  const rows: [string, string][] = [
    ["Expertise", p.expertise],
    ["Communication Style", p.style],
    ["When to Use", p.whenToUse],
    ["Focus", p.focus],
  ];
  return (
    <div className="mx-auto w-full max-w-2xl rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm">
      <p className="text-lg font-bold" style={{ color: NAVY }}>{p.name}</p>
      <p className="text-sm" style={{ color: GOLD }}>{p.subtitle}</p>
      {rows.map(([h, t]) => (
        <div key={h} className="mt-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">{h}</p>
          <p className="mt-0.5 text-sm text-gray-700">{t}</p>
        </div>
      ))}
    </div>
  );
}

function TemplateModal({
  templates, onClose, onStart,
}: {
  templates: BrainTemplate[];
  onClose: () => void;
  onStart: (composed: string) => void;
}) {
  const [tpl, setTpl] = useState<BrainTemplate | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const categories = Array.from(new Set(templates.map(t => t.category)));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-5 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        {!tpl ? (
          <>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-base font-bold" style={{ color: NAVY }}>Conversation Templates</p>
                <p className="text-xs text-gray-500">Choose a pre-built template to start a structured conversation</p>
              </div>
              <button type="button" onClick={onClose} className="rounded-full bg-gray-100 p-1.5 text-gray-500 hover:bg-gray-200"><X size={15} /></button>
            </div>
            {categories.map(cat => (
              <div key={cat} className="mb-3">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">{cat}</p>
                {templates.filter(t => t.category === cat).map(t => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => { setTpl(t); setAnswers(t.questions.map(() => "")); }}
                    className="mb-1.5 block w-full rounded-lg border border-gray-200 px-3 py-2 text-left hover:border-transparent hover:shadow"
                  >
                    <span className="block text-sm font-semibold" style={{ color: NAVY }}>{t.title}</span>
                    <span className="block text-xs text-gray-500">{t.desc} · {t.questions.length} questions</span>
                  </button>
                ))}
              </div>
            ))}
          </>
        ) : (
          <>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-base font-bold" style={{ color: NAVY }}>{tpl.title}</p>
                <p className="text-xs text-gray-500">Answer what you can — blanks are fine, the brain will ask.</p>
              </div>
              <button type="button" onClick={() => setTpl(null)} className="text-xs font-semibold" style={{ color: GOLD }}>← Templates</button>
            </div>
            {tpl.questions.map((q, i) => (
              <div key={i} className="mb-2.5">
                <p className="mb-1 text-xs font-semibold text-gray-700">{i + 1}. {q}</p>
                <textarea
                  value={answers[i]}
                  onChange={e => setAnswers(a => a.map((v, j) => (j === i ? e.target.value : v)))}
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm outline-none focus:ring-2"
                  style={{ "--tw-ring-color": GOLD } as React.CSSProperties}
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                const body = tpl.questions
                  .map((q, i) => `**${i + 1}. ${q}**\n${answers[i].trim() || "_(not provided)_"}`)
                  .join("\n\n");
                onStart(`**Template: ${tpl.title}**\n\n${body}`);
                onClose();
              }}
              className="mt-1 w-full rounded-xl py-2.5 text-sm font-bold text-white"
              style={{ background: NAVY }}
            >
              Start structured conversation
            </button>
          </>
        )}
      </div>
    </div>
  );
}

interface BoardSel {
  ref: string;
  state: string | null; // null = national board; state code = variation board
}

/** Right-hand evidence-board viewer — shows the board for the clause under
 *  discussion; chips switch between all boards cited in the latest answer. */
function BoardViewer({ msg, sel, onSel }: { msg?: Msg; sel: BoardSel | null; onSel: (s: BoardSel) => void }) {
  const [zoom, setZoom] = useState(false);
  const [failed, setFailed] = useState(false);
  const cites = (msg?.citations || []).filter(c => c.board || c.stateBoard);
  const src = sel
    ? sel.state
      ? `/api/brain/board/${sel.state}/${encodeURIComponent(sel.ref)}`
      : `/api/brain/board/${encodeURIComponent(sel.ref)}`
    : null;
  const activeCite = sel ? msg?.citations?.find(c => c.ref === sel.ref) : undefined;
  useEffect(() => {
    setFailed(false);
  }, [src]);

  return (
    <div className="flex h-full flex-col rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-3 py-2">
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: GOLD }}>
          Clause evidence board
        </p>
        <p className="truncate text-sm font-bold" style={{ color: NAVY }}>
          {sel ? `${sel.ref}${sel.state ? ` · ${sel.state} variation` : ""}${activeCite?.title ? ` — ${activeCite.title}` : ""}` : "No clause selected"}
        </p>
      </div>
      {cites.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-b border-gray-100 px-3 py-2">
          {cites.map(c => (
            <span key={c.ref} className="flex gap-1">
              {c.board && (
                <button
                  type="button"
                  onClick={() => onSel({ ref: c.ref, state: null })}
                  className="rounded-full border px-2.5 py-0.5 text-[11px] font-bold"
                  style={
                    sel?.ref === c.ref && !sel?.state
                      ? { background: NAVY, borderColor: NAVY, color: "#fff" }
                      : { borderColor: `${GOLD}88`, color: NAVY }
                  }
                >
                  {c.ref}
                </button>
              )}
              {c.stateBoard && msg && (
                <button
                  type="button"
                  onClick={() => onSel({ ref: c.ref, state: msg.state })}
                  className="rounded-full border px-2.5 py-0.5 text-[11px] font-bold"
                  style={
                    sel?.ref === c.ref && sel?.state
                      ? { background: "#0d9488", borderColor: "#0d9488", color: "#fff" }
                      : { borderColor: "#0d948888", color: "#0d9488" }
                  }
                >
                  {c.ref} · {msg.state}
                </button>
              )}
            </span>
          ))}
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-2">
        {src && !failed ? (
          <img
            key={src}
            src={src}
            alt={sel?.ref}
            onError={() => setFailed(true)}
            onClick={() => setZoom(true)}
            className="w-full cursor-zoom-in rounded-lg border border-gray-100"
            title="Click to enlarge"
          />
        ) : (
          <div className="flex h-full min-h-48 items-center justify-center rounded-lg border border-dashed border-gray-300 p-6 text-center text-xs text-gray-500">
            {failed
              ? `No board image found for ${sel?.ref}.`
              : "Ask a question — the evidence board for each cited clause appears here. Click the clause chips or citation cards to switch."}
          </div>
        )}
      </div>
      {zoom && src && (
        <div className="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-black/85 p-4" onClick={() => setZoom(false)}>
          <img src={src} alt={sel?.ref} className="max-h-full max-w-full rounded-lg" />
        </div>
      )}
    </div>
  );
}

function UnlockModal({ onClose, onUnlock }: { onClose: () => void; onUnlock: (code: string) => Promise<boolean> }) {
  const [code, setCode] = useState("");
  const [err, setErr] = useState(false);
  const [busy, setBusy] = useState(false);
  async function submit() {
    if (!code.trim() || busy) return;
    setBusy(true);
    setErr(false);
    const ok = await onUnlock(code.trim());
    if (!ok) setErr(true);
    setBusy(false);
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: NAVY }}>
            <Sparkles size={20} style={{ color: GOLD }} />
          </div>
          <div>
            <p className="text-base font-bold" style={{ color: NAVY }}>Unlock full access</p>
            <p className="text-xs text-gray-500">All 29 brains · site photos · multi-persona · Report Studio · Training</p>
          </div>
          <button type="button" onClick={onClose} className="ml-auto rounded-full bg-gray-100 p-1.5 text-gray-500 hover:bg-gray-200"><X size={15} /></button>
        </div>
        <p className="mb-3 text-sm text-gray-600">
          The <span className="font-semibold" style={{ color: NAVY }}>AUS Legislation Brain</span> is free — clause answers, boards and all 8 state tabs.
          Enter your access code to unlock the specialist brains, photo assessment and the full toolset.
        </p>
        <input
          value={code}
          onChange={e => setCode(e.target.value)}
          onKeyDown={e => e.key === "Enter" && submit()}
          placeholder="Access code"
          autoFocus
          className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
          style={{ borderColor: err ? "#dc2626" : "#d1d5db", "--tw-ring-color": GOLD } as React.CSSProperties}
        />
        {err && <p className="mt-1.5 text-xs text-red-600">That code didn't work — check with 369 Alliance.</p>}
        <button
          type="button"
          onClick={submit}
          disabled={busy || !code.trim()}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white disabled:opacity-50"
          style={{ background: NAVY }}
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Lock size={15} />} Unlock
        </button>
        <p className="mt-2 text-center text-[11px] text-gray-400">Don't have a code? Contact 369 Alliance for full access.</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- page
export default function LegislationBrain() {
  const [status, setStatus] = useState<BrainStatus | null>(null);
  const [stateCode, setStateCode] = useState(() => localStorage.getItem(LS_STATE) || "NSW");
  const [thread, setThread] = useState<Msg[]>(loadThread);
  const [input, setInput] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  const [personaKey, setPersonaKey] = useState<string | null>(() => localStorage.getItem(LS_PERSONA) || null);
  const [panelMode, setPanelMode] = useState(false);
  const [panelSel, setPanelSel] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tplOpen, setTplOpen] = useState(false);
  const [boardSel, setBoardSel] = useState<BoardSel | null>(null);
  const [plan, setPlan] = useState<"free" | "full">(() => (localStorage.getItem(LS_PLAN) === "full" ? "full" : "free"));
  const [accessCode, setAccessCode] = useState(() => localStorage.getItem(LS_CODE) || "");
  const [unlockOpen, setUnlockOpen] = useState(false);
  const isFree = plan === "free";
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const threadRef = useRef<Msg[]>([]);
  threadRef.current = thread;

  useEffect(() => {
    fetch("/api/brain/status")
      .then(r => r.json())
      .then(setStatus)
      .catch(() => setStatus(null));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [thread, busy]);

  // Persist conversation (images stripped — localStorage budget), state and persona.
  useEffect(() => {
    try {
      localStorage.setItem(LS_THREAD, JSON.stringify(thread.slice(-40).map(m => ({ ...m, image: undefined, streaming: undefined }))));
    } catch {}
  }, [thread]);
  useEffect(() => {
    localStorage.setItem(LS_STATE, stateCode);
  }, [stateCode]);
  useEffect(() => {
    if (personaKey) localStorage.setItem(LS_PERSONA, personaKey);
    else localStorage.removeItem(LS_PERSONA);
  }, [personaKey]);
  useEffect(() => {
    localStorage.setItem(LS_PLAN, plan);
  }, [plan]);
  useEffect(() => {
    if (accessCode) localStorage.setItem(LS_CODE, accessCode);
    else localStorage.removeItem(LS_CODE);
  }, [accessCode]);
  // Free tier can only use the base AUS Legislation Brain — force it on load.
  useEffect(() => {
    if (plan === "free") {
      setPersonaKey(null);
      setPanelMode(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan]);

  async function unlock(code: string): Promise<boolean> {
    try {
      const r = await fetch("/api/brain/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok && d.ok) {
        setAccessCode(code);
        setPlan("full");
        setUnlockOpen(false);
        flash("Full access unlocked — all brains, photos & tools enabled.");
        return true;
      }
    } catch {}
    return false;
  }

  const authHeaders = (): Record<string, string> => ({
    "Content-Type": "application/json",
    ...(accessCode ? { "x-brain-code": accessCode } : {}),
  });

  function labelForPersona(k: string | null): string {
    if (!k) return "AUS Legislation Brain";
    return status?.personas.find(p => p.key === k)?.name || k;
  }

  // Auto-show a board for the latest answer: first cited clause once citations
  // arrive, or the first clause code seen in the text while still streaming.
  // A manual pick (chip / card / blue link) is respected until the next answer.
  const boardMsgRef = useRef(-1);
  const boardPinRef = useRef(false);

  function pickBoard(sel: BoardSel) {
    boardPinRef.current = true;
    setBoardSel(sel);
  }

  useEffect(() => {
    let idx = -1;
    for (let i = thread.length - 1; i >= 0; i--) {
      if (thread[i].role === "assistant" && !thread[i].error && !thread[i].divider) {
        idx = i;
        break;
      }
    }
    if (idx === -1) {
      setBoardSel(null);
      boardMsgRef.current = -1;
      boardPinRef.current = false;
      return;
    }
    if (idx !== boardMsgRef.current) {
      boardMsgRef.current = idx;
      boardPinRef.current = false;
    }
    if (boardPinRef.current) return;
    const m = thread[idx];
    const c = m.citations?.find(x => x.board || x.stateBoard);
    if (c) {
      setBoardSel({ ref: c.ref, state: c.board ? null : m.state });
    } else {
      const match = m.content.match(/\b[A-Z]{1,2}\d{1,3}[A-Z]\d{1,3}\b/);
      if (match) setBoardSel({ ref: match[0], state: null });
    }
  }, [thread]);

  const state = useMemo(
    () => status?.states.find(s => s.code === stateCode),
    [status, stateCode],
  );
  const suggestions = useMemo(
    () => [...(STATE_SUGGESTIONS[stateCode] || []), ...GENERIC_SUGGESTIONS].slice(0, 4),
    [stateCode],
  );
  const activePersona = useMemo(
    () => status?.personas.find(p => p.key === personaKey) || null,
    [status, personaKey],
  );
  const panelActive = panelMode && panelSel.length >= 2;
  const legHint = !!activePersona && activePersona.kind === "business" && looksLegislation(input);

  function pushDivider(label: string) {
    setThread(t => (t.length ? [...t, { role: "assistant", state: stateCode, content: label, divider: true } as Msg] : t));
  }

  function pickPersona(k: string | null) {
    if (k && isFree) return setUnlockOpen(true);
    if (k !== personaKey && threadRef.current.length) pushDivider(labelForPersona(k));
    setPersonaKey(k);
    setPanelMode(false);
    setSidebarOpen(false);
    // State legislation specialists also switch the jurisdiction tab (Opção A spirit).
    const m = k?.match(/^(nsw|vic|qld|wa|sa|tas|act|nt)-legislation$/);
    if (m) setStateCode(m[1].toUpperCase());
  }

  function handleSetPanelMode(b: boolean) {
    if (b && isFree) return setUnlockOpen(true);
    if (b && threadRef.current.length) pushDivider(`Multi-Persona panel`);
    setPanelMode(b);
  }

  function togglePanelSel(k: string) {
    if (isFree) return setUnlockOpen(true);
    setPanelSel(sel => (sel.includes(k) ? sel.filter(x => x !== k) : sel.length >= 4 ? sel : [...sel, k]));
  }

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  }

  async function attachPhoto(file: File | undefined | null) {
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return flash("Use a JPEG, PNG or WebP image.");
    try {
      setPhoto(await downscaleImage(file));
    } catch {
      flash("Could not read that image.");
    }
  }

  /** Visible portion of the raw tag-protocol stream: content inside <answer>, partial tags trimmed. */
  function visibleAnswer(raw: string): string {
    const start = raw.indexOf("<answer>");
    if (start === -1) return "";
    let s = raw.slice(start + 8);
    const end = s.indexOf("</answer>");
    if (end !== -1) s = s.slice(0, end);
    return s.replace(/<\/?[a-z]*$/i, "").trimStart();
  }

  async function send(text?: string, forceBase = false) {
    const question = (text ?? input).trim();
    const image = photo;
    if ((!question && !image) || busy) return;
    if (!status?.ai) return flash("AI is not configured — set ANTHROPIC_API_KEY in .env and restart.");

    const usingPersona = forceBase ? null : personaKey;
    const usingPanel = forceBase ? false : panelActive;
    if (!forceBase && panelMode && panelSel.length < 2) return flash("Tick at least 2 brains in the sidebar for a panel consultation.");

    if (isFree) {
      const limit = status?.freeLimit ?? FREE_LIMIT;
      if (todayCount() >= limit) {
        setUnlockOpen(true);
        return flash(`Free daily limit reached (${limit}/day). Unlock for unlimited questions.`);
      }
    }

    const personaName = usingPanel
      ? `Panel of ${panelSel.length}`
      : forceBase
        ? "AUS Legislation Brain"
        : activePersona?.name || "AUS Legislation Brain";
    const userMsg: Msg = { role: "user", state: stateCode, content: question || "(photo)", image: image || undefined };
    setThread(t => [...t, userMsg]);
    setInput("");
    setPhoto(null);
    setBusy(true);
    if (isFree) localStorage.setItem(usageKey(), String(todayCount() + 1));

    const history = threadRef.current
      .filter(m => !m.error && !m.image && !m.divider)
      .slice(-6)
      .map(m => ({ role: m.role, content: m.content }));
    const askBody = {
      state: stateCode,
      question,
      history,
      persona: !usingPanel ? usingPersona || undefined : undefined,
      personas: usingPanel ? panelSel : undefined,
    };

    const patchLast = (patch: Partial<Msg>) =>
      setThread(t => t.map((m, i) => (i === t.length - 1 && m.role === "assistant" ? { ...m, ...patch } : m)));

    async function jsonFallback(endpoint: string, body: unknown, placeholderUp: boolean) {
      if (placeholderUp) setThread(t => t.slice(0, -1));
      const r = await fetch(endpoint, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data?.message || data?.error || `HTTP ${r.status}`);
      setThread(t => [
        ...t,
        {
          role: "assistant",
          state: stateCode,
          personaName,
          content: data.answer || "No answer returned.",
          observation: data.observation || undefined,
          citations: data.citations || [],
          defects: data.defects || [],
          followups: data.followups || [],
        },
      ]);
    }

    try {
      if (image) {
        await jsonFallback("/api/brain/photo", { state: stateCode, image, question, persona: !usingPanel ? usingPersona || undefined : undefined }, false);
        return;
      }

      // Streaming path with automatic fallback to POST /ask.
      let placeholderUp = false;
      let streamedAny = false;
      try {
        const r = await fetch("/api/brain/ask-stream", {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify(askBody),
        });
        if (!r.ok || !r.body) throw new Error(`stream HTTP ${r.status}`);
        setThread(t => [...t, { role: "assistant", state: stateCode, personaName, content: "", streaming: true }]);
        placeholderUp = true;

        const reader = r.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let raw = "";
        let finished = false;
        while (!finished) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split("\n\n");
          buffer = events.pop() || "";
          for (const ev of events) {
            const line = ev.split("\n").find(l => l.startsWith("data: "));
            if (!line) continue;
            let msg: any;
            try {
              msg = JSON.parse(line.slice(6));
            } catch {
              continue;
            }
            if (msg.t === "delta") {
              raw += msg.text;
              streamedAny = true;
              patchLast({ content: visibleAnswer(raw) });
            } else if (msg.t === "meta") {
              patchLast({
                content: msg.answer || visibleAnswer(raw),
                citations: msg.citations || [],
                followups: msg.followups || [],
                streaming: false,
              });
            } else if (msg.t === "done") {
              patchLast({ streaming: false });
              finished = true;
            } else if (msg.t === "error") {
              throw new Error(msg.message || "stream error");
            }
          }
        }
        patchLast({ streaming: false });
      } catch (streamErr: any) {
        if (streamedAny) {
          patchLast({ streaming: false, content: `The brain could not finish: ${streamErr?.message || streamErr}`, error: true });
        } else {
          await jsonFallback("/api/brain/ask", askBody, placeholderUp);
        }
      }
    } catch (err: any) {
      const msg = String(err?.message || err);
      if (/full access|locked/i.test(msg)) setUnlockOpen(true);
      setThread(t => [
        ...t,
        { role: "assistant", state: stateCode, personaName, content: `The brain could not answer: ${msg}`, error: true },
      ]);
    } finally {
      setBusy(false);
    }
  }

  const lastAssistant = [...thread].reverse().find(m => m.role === "assistant" && !m.error && !m.divider);

  return (
    <div className="flex min-h-screen flex-col" style={{ background: "#f4f2ee" }}>
      {/* Header */}
      <header className="sticky top-0 z-20 text-white shadow-md" style={{ background: NAVY }}>
        <div className="mx-auto flex max-w-[1900px] items-center gap-3 px-4 py-3">
          <Link href="/system" className="flex items-center gap-1 text-sm text-white/70 hover:text-white">
            <ArrowLeft size={16} />
          </Link>
          <button type="button" onClick={() => setSidebarOpen(o => !o)} className="text-white/70 hover:text-white lg:hidden" title="Expert brains">
            <Menu size={19} />
          </button>
          {panelActive ? <Users size={22} style={{ color: GOLD }} /> : <Brain size={22} style={{ color: GOLD }} />}
          <div className="min-w-0">
            <h1 className="truncate text-base font-bold leading-tight">
              {panelActive
                ? `Multi-Persona Consultation (${panelSel.length})`
                : activePersona
                  ? activePersona.name
                  : "AUS Expert Brains"}{" "}
              <span className="hidden font-normal text-white/60 sm:inline">
                · {panelActive ? "Combined perspectives + synthesis" : activePersona ? activePersona.subtitle : "Construction & Design"}
              </span>
            </h1>
            <p className="truncate text-[11px] text-white/50">
              {status
                ? `${status.personas.length + 1} brains · ${status.counts.vol1} NCC clauses · ${status.counts.standards} AS · ${status.counts.defects} defects` +
                  (status.counts.boards ? ` · ${status.counts.boards + status.counts.stateBoards} evidence boards` : "") +
                  ` · ${status.states.length} jurisdictions`
                : "Loading knowledge base…"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setThread([]);
              localStorage.removeItem(LS_THREAD);
            }}
            className="ml-auto flex items-center gap-1.5 rounded-full border border-white/25 px-2.5 py-1 text-[11px] font-semibold text-white/80 hover:border-white/60 hover:text-white"
            title="Start a fresh conversation (history is kept on this device until cleared)"
          >
            <X size={13} /> New chat
          </button>
          <button
            type="button"
            onClick={() => setTplOpen(true)}
            className="flex items-center gap-1.5 rounded-full border border-white/25 px-2.5 py-1 text-[11px] font-semibold text-white/80 hover:border-white/60 hover:text-white"
          >
            <LayoutTemplate size={13} /> Templates
          </button>
          {status && (isFree ? (
            <button
              type="button"
              onClick={() => setUnlockOpen(true)}
              className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold"
              style={{ background: GOLD, color: NAVY }}
              title="Unlock all 29 brains, photos and tools"
            >
              <Lock size={12} /> Free · Unlock
            </button>
          ) : (
            <span className="flex items-center gap-1.5 rounded-full border border-white/25 px-2.5 py-1 text-[11px] font-semibold text-white/80">
              <Sparkles size={12} style={{ color: GOLD }} /> Full access
            </span>
          ))}
          <span
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={{ background: status?.ai ? "#14532d" : "#7f1d1d" }}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${status?.ai ? "bg-green-400" : "bg-red-400"} ${status?.ai ? "animate-pulse" : ""}`} />
            {status === null ? "…" : status.ai ? "AI live" : "AI off"}
          </span>
        </div>
        {/* State tabs */}
        <div className="mx-auto max-w-[1900px] overflow-x-auto px-4 pb-2.5">
          <div className="flex gap-1.5">
            {(status?.states || []).map(s => {
              const active = s.code === stateCode;
              return (
                <button
                  key={s.code}
                  type="button"
                  onClick={() => setStateCode(s.code)}
                  className="shrink-0 rounded-full border px-3.5 py-1 text-xs font-bold tracking-wide transition-colors"
                  style={
                    active
                      ? { background: GOLD, borderColor: GOLD, color: NAVY }
                      : { background: "transparent", borderColor: "rgba(255,255,255,0.25)", color: "rgba(255,255,255,0.75)" }
                  }
                  title={s.name}
                >
                  {s.code}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="mx-auto flex w-full max-w-[1900px] flex-1 items-start">
        {status && (
          <>
            <aside className="sticky top-[104px] hidden max-h-[calc(100vh-104px)] w-72 shrink-0 overflow-y-auto lg:block">
              <BrainSidebar
                status={status}
                personaKey={personaKey}
                onPick={pickPersona}
                panelMode={panelMode}
                setPanelMode={handleSetPanelMode}
                panelSel={panelSel}
                togglePanelSel={togglePanelSel}
                locked={isFree}
                onLocked={() => setUnlockOpen(true)}
              />
            </aside>
            {sidebarOpen && (
              <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setSidebarOpen(false)}>
                <div className="absolute inset-0 bg-black/40" />
                <div className="absolute inset-y-0 left-0 w-72 bg-white shadow-xl" onClick={e => e.stopPropagation()}>
                  <BrainSidebar
                    status={status}
                    personaKey={personaKey}
                    onPick={pickPersona}
                    panelMode={panelMode}
                    setPanelMode={handleSetPanelMode}
                    panelSel={panelSel}
                    togglePanelSel={togglePanelSel}
                    locked={isFree}
                    onLocked={() => setUnlockOpen(true)}
                  />
                </div>
              </div>
            )}
          </>
        )}
        <main className="flex w-full min-w-0 flex-1 flex-col gap-3 px-4 py-3">
        {state && <StatePanel s={state} />}
        {status && !status.ai && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <CircleAlert size={14} />
            AI is off — add ANTHROPIC_API_KEY to .env and restart the server. The legislation map above still works.
          </div>
        )}

        {/* Thread */}
        <div className="flex flex-1 flex-col gap-4 pb-4">
          {thread.length === 0 && (
            <div className="mt-4 flex flex-col items-center gap-4 text-center">
              {panelActive ? (
                <div className="mx-auto w-full max-w-2xl rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm">
                  <p className="flex items-center gap-2 text-lg font-bold" style={{ color: NAVY }}>
                    <Users size={19} style={{ color: GOLD }} /> Multi-Persona Consultation
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    One question, {panelSel.length} perspectives + a synthesis. Panel:{" "}
                    {status?.personas.filter(p => panelSel.includes(p.key)).map(p => p.name).join(" · ")}
                  </p>
                </div>
              ) : activePersona ? (
                <PersonaIntroCard p={activePersona} />
              ) : (
                <>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl shadow" style={{ background: NAVY }}>
                    <BookOpenText size={26} style={{ color: GOLD }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: NAVY }}>
                      Ask anything about building legislation in {state?.name || "Australia"}
                    </p>
                    <p className="mx-auto mt-1 max-w-md text-xs text-gray-500">
                      NCC 2022 clause-level answers, Australian Standards, state acts, licensing, insurance and dispute pathways —
                      or attach a site photo to get the legislation that applies to what you see. Pick a specialist brain in the
                      sidebar, or convene a multi-persona panel.
                    </p>
                  </div>
                </>
              )}
              {!panelActive && !activePersona && (
                <>
                  <div className="flex max-w-xl flex-wrap justify-center gap-2">
                    {suggestions.map(q => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => send(q)}
                        className="rounded-full border bg-white px-3 py-1.5 text-xs text-gray-700 shadow-sm transition-colors hover:border-transparent hover:text-white"
                        style={{ borderColor: "#ddd" }}
                        onMouseEnter={e => (e.currentTarget.style.background = NAVY)}
                        onMouseLeave={e => (e.currentTarget.style.background = "white")}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                  {/* Brains hub — every specialist at a glance (Manus-style welcome, all-Australia) */}
                  {status && (
                    <div className="mt-2 w-full max-w-4xl text-left">
                      {status.personaSections.map(sec => {
                        const items = status.personas.filter(p => p.section === sec);
                        if (!items.length) return null;
                        return (
                          <div key={sec} className="mb-3">
                            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">{sec}</p>
                            <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                              {items.map(p => (
                                <button
                                  key={p.key}
                                  type="button"
                                  onClick={() => pickPersona(p.key)}
                                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow"
                                >
                                  <span className="block truncate text-xs font-bold" style={{ color: NAVY }}>{p.name}</span>
                                  <span className="block truncate text-[11px] text-gray-500">{p.subtitle}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {thread.map((m, i) => {
            if (m.divider) {
              return (
                <div key={i} className="my-1 flex items-center justify-center gap-2">
                  <span className="h-px w-6 bg-gray-300" />
                  <span className="rounded-full bg-gray-100 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                    Now talking to {m.content}
                  </span>
                  <span className="h-px w-6 bg-gray-300" />
                </div>
              );
            }
            return (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[92%] md:max-w-[80%] ${m.role === "user" ? "text-right" : "text-left"}`}>
                <p className="mb-0.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  {m.role === "user" ? `You · ${m.state}` : `${m.personaName || "AUS Legislation Brain"} · ${m.state}`}
                </p>
                {m.role === "user" ? (
                  <div className="inline-block rounded-2xl rounded-tr-sm px-4 py-2.5 text-left text-sm text-white shadow" style={{ background: NAVY }}>
                    {m.image && <img src={m.image} alt="attached" className="mb-2 max-h-48 rounded-lg" />}
                    {m.content !== "(photo)" && <p className="whitespace-pre-wrap">{m.content}</p>}
                  </div>
                ) : (
                  <div
                    className={`rounded-2xl rounded-tl-sm border bg-white px-4 py-3 shadow-sm ${m.error ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                  >
                    {m.observation && (
                      <p className="mb-2 rounded-lg bg-gray-50 px-3 py-2 text-xs italic text-gray-600">
                        <Camera size={12} className="mr-1 inline" style={{ color: GOLD }} />
                        {m.observation}
                      </p>
                    )}
                    <div
                      className="prose prose-sm max-w-none text-sm [&_h2]:mt-3 [&_h2]:text-base [&_h3]:mt-2 [&_h3]:text-sm [&_a[href^='#board-']]:cursor-pointer [&_a[href^='#board-']]:font-semibold [&_a[href^='#board-']]:text-blue-600 [&_a[href^='#board-']]:no-underline [&_a[href^='#board-']:hover]:underline"
                      onClick={e => {
                        const a = (e.target as HTMLElement).closest("a");
                        const href = a?.getAttribute("href") || "";
                        if (href.startsWith("#board-")) {
                          e.preventDefault();
                          pickBoard({ ref: href.slice(7), state: null });
                        }
                      }}
                    >
                      <Streamdown>{linkifyClauses(m.content) || (m.streaming ? "…" : "")}</Streamdown>
                      {m.streaming && <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse rounded-sm align-middle" style={{ background: GOLD }} />}
                    </div>
                    {!!m.defects?.length && (
                      <div className="mt-3 grid gap-2">
                        {m.defects.map(d => <DefectCard key={d.id} d={d} />)}
                      </div>
                    )}
                    {!!m.citations?.length && (
                      <div className="mt-3 grid gap-2 md:grid-cols-2">
                        {m.citations.map((c, j) => (
                          <CitationCard
                            key={c.kind + c.ref + j}
                            c={c}
                            stateCode={m.state}
                            onView={
                              c.board || c.stateBoard
                                ? () => pickBoard({ ref: c.ref, state: c.board ? null : m.state })
                                : undefined
                            }
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            );
          })}

          {busy && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Loader2 size={14} className="animate-spin" style={{ color: GOLD }} />
              Consulting the {state?.code || ""} brain…
            </div>
          )}

          {!busy && lastAssistant?.followups && lastAssistant.followups.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {lastAssistant.followups.map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => send(f)}
                  className="rounded-full border px-3 py-1 text-xs shadow-sm"
                  style={{ borderColor: `${GOLD}88`, color: NAVY, background: "#fff" }}
                >
                  {f}
                </button>
              ))}
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        </main>
        {status && status.counts.boards > 0 && (
          <aside className="sticky top-[104px] hidden w-[30rem] shrink-0 py-3 pr-4 xl:block">
            <div style={{ height: "calc(100vh - 130px)" }}>
              <BoardViewer msg={lastAssistant} sel={boardSel} onSel={pickBoard} />
            </div>
          </aside>
        )}
      </div>

      {/* Composer */}
      <div className="sticky bottom-0 border-t border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-3">
          {legHint && (
            <div className="mb-2 flex flex-wrap items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
              <CircleAlert size={14} className="shrink-0" />
              <span className="min-w-0 flex-1">This looks like a legislation question — {activePersona?.name} answers from general knowledge, not the clause register.</span>
              <button
                type="button"
                onClick={() => { const q = input; pickPersona(null); send(q, true); }}
                className="rounded-full px-2.5 py-1 font-semibold text-white"
                style={{ background: "#2563eb" }}
              >
                Ask the AUS Legislation Brain
              </button>
            </div>
          )}
          {photo && (
            <div className="mb-2 flex items-center gap-2">
              <img src={photo} alt="to send" className="h-14 w-14 rounded-lg border object-cover" style={{ borderColor: GOLD }} />
              <span className="text-xs text-gray-500">Photo attached — it will be assessed for {state?.name || stateCode}.</span>
              <button type="button" onClick={() => setPhoto(null)} className="ml-auto rounded-full bg-gray-100 p-1.5 text-gray-500 hover:bg-gray-200">
                <X size={14} />
              </button>
            </div>
          )}
          <div className="flex items-end gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={e => {
                attachPhoto(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => (isFree ? setUnlockOpen(true) : fileRef.current?.click())}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-300 text-gray-500 transition-colors hover:border-transparent hover:text-white"
              onMouseEnter={e => (e.currentTarget.style.background = GOLD)}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              title={isFree ? "Site photo assessment — unlock full access" : "Attach a site photo"}
            >
              {isFree ? <Lock size={16} /> : <Paperclip size={17} />}
            </button>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={1}
              placeholder={
                panelActive
                  ? `Ask the ${panelSel.length}-brain panel (${stateCode} context)…`
                  : activePersona
                    ? `Ask ${activePersona.name} (${stateCode} context)…`
                    : `Ask the ${stateCode} brain — any act, NCC clause, standard, licence or defect…`
              }
              className="max-h-36 min-h-10 flex-1 resize-y rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-transparent focus:ring-2"
              style={{ "--tw-ring-color": GOLD } as React.CSSProperties}
            />
            <button
              type="button"
              onClick={() => send()}
              disabled={busy || (!input.trim() && !photo)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow transition-opacity disabled:opacity-40"
              style={{ background: NAVY }}
              title="Send"
            >
              {busy ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
            </button>
          </div>
          <p className="mt-1.5 text-center text-[10px] text-gray-400">
            Guidance only — verify thresholds and adoption dates against the current instrument. © 369 Alliance.
          </p>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full px-4 py-2 text-xs text-white shadow-lg" style={{ background: NAVY }}>
          {toast}
        </div>
      )}

      {tplOpen && status && (
        <TemplateModal templates={status.templates} onClose={() => setTplOpen(false)} onStart={composed => send(composed)} />
      )}
      {unlockOpen && <UnlockModal onClose={() => setUnlockOpen(false)} onUnlock={unlock} />}
    </div>
  );
}
