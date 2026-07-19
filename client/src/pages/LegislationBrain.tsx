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
  Loader2,
  Paperclip,
  Scale,
  ScrollText,
  Send,
  ShieldCheck,
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
interface BrainStatus {
  ai: boolean;
  model: string;
  counts: { vol1: number; hp: number; standards: number; topics: number; defects: number; editions: number; boards: number; stateBoards: number };
  variationBoards: Record<string, number>;
  states: StateProfile[];
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
  image?: string;
  observation?: string;
  citations?: Citation[];
  defects?: DefectHit[];
  followups?: string[];
  error?: boolean;
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

function CitationCard({ c, stateCode }: { c: Citation; stateCode: string }) {
  const [open, setOpen] = useState(false);
  const meta = KIND_META[c.kind] || KIND_META.other;
  const expandable = !!(c.text || c.as || c.asClauses || c.board || c.stateBoard);
  return (
    <div className="rounded-lg border bg-white text-left shadow-sm" style={{ borderColor: `${meta.color}55` }}>
      <button
        type="button"
        onClick={() => expandable && setOpen(o => !o)}
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

// ---------------------------------------------------------------- page
export default function LegislationBrain() {
  const [status, setStatus] = useState<BrainStatus | null>(null);
  const [stateCode, setStateCode] = useState("NSW");
  const [thread, setThread] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
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

  const state = useMemo(
    () => status?.states.find(s => s.code === stateCode),
    [status, stateCode],
  );
  const suggestions = useMemo(
    () => [...(STATE_SUGGESTIONS[stateCode] || []), ...GENERIC_SUGGESTIONS].slice(0, 4),
    [stateCode],
  );

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

  async function send(text?: string) {
    const question = (text ?? input).trim();
    const image = photo;
    if ((!question && !image) || busy) return;
    if (!status?.ai) return flash("AI is not configured — set ANTHROPIC_API_KEY in .env and restart.");

    const userMsg: Msg = { role: "user", state: stateCode, content: question || "(photo)", image: image || undefined };
    setThread(t => [...t, userMsg]);
    setInput("");
    setPhoto(null);
    setBusy(true);
    try {
      const history = threadRef.current
        .filter(m => !m.error && !m.image)
        .slice(-6)
        .map(m => ({ role: m.role, content: m.content }));
      const endpoint = image ? "/api/brain/photo" : "/api/brain/ask";
      const body = image
        ? { state: stateCode, image, question }
        : { state: stateCode, question, history };
      const r = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data?.message || data?.error || `HTTP ${r.status}`);
      setThread(t => [
        ...t,
        {
          role: "assistant",
          state: stateCode,
          content: data.answer || "No answer returned.",
          observation: data.observation || undefined,
          citations: data.citations || [],
          defects: data.defects || [],
          followups: data.followups || [],
        },
      ]);
    } catch (err: any) {
      setThread(t => [
        ...t,
        { role: "assistant", state: stateCode, content: `The brain could not answer: ${err?.message || err}`, error: true },
      ]);
    } finally {
      setBusy(false);
    }
  }

  const lastAssistant = [...thread].reverse().find(m => m.role === "assistant" && !m.error);

  return (
    <div className="flex min-h-screen flex-col" style={{ background: "#f4f2ee" }}>
      {/* Header */}
      <header className="sticky top-0 z-20 text-white shadow-md" style={{ background: NAVY }}>
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <Link href="/system" className="flex items-center gap-1 text-sm text-white/70 hover:text-white">
            <ArrowLeft size={16} />
          </Link>
          <Brain size={22} style={{ color: GOLD }} />
          <div className="min-w-0">
            <h1 className="truncate text-base font-bold leading-tight">
              AUS Expert Brain <span className="font-normal text-white/60">· Building Legislation</span>
            </h1>
            <p className="truncate text-[11px] text-white/50">
              {status
                ? `${status.counts.vol1} NCC clauses · ${status.counts.hp} Housing Provisions · ${status.counts.standards} AS · ${status.counts.defects} defects` +
                  (status.counts.boards ? ` · ${status.counts.boards + status.counts.stateBoards} evidence boards` : "") +
                  ` · ${status.states.length} jurisdictions`
                : "Loading knowledge base…"}
            </p>
          </div>
          <span
            className="ml-auto flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={{ background: status?.ai ? "#14532d" : "#7f1d1d" }}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${status?.ai ? "bg-green-400" : "bg-red-400"} ${status?.ai ? "animate-pulse" : ""}`} />
            {status === null ? "…" : status.ai ? "AI live" : "AI off"}
          </span>
        </div>
        {/* State tabs */}
        <div className="mx-auto max-w-5xl overflow-x-auto px-4 pb-2.5">
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
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-3 px-4 py-3">
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
            <div className="mt-6 flex flex-col items-center gap-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl shadow" style={{ background: NAVY }}>
                <BookOpenText size={26} style={{ color: GOLD }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: NAVY }}>
                  Ask anything about building legislation in {state?.name || "Australia"}
                </p>
                <p className="mx-auto mt-1 max-w-md text-xs text-gray-500">
                  NCC 2022 clause-level answers, Australian Standards, state acts, licensing, insurance and dispute pathways —
                  or attach a site photo to get the legislation that applies to what you see.
                </p>
              </div>
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
            </div>
          )}

          {thread.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[92%] md:max-w-[80%] ${m.role === "user" ? "text-right" : "text-left"}`}>
                <p className="mb-0.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  {m.role === "user" ? `You · ${m.state}` : `Expert Brain · ${m.state}`}
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
                    <div className="prose prose-sm max-w-none text-sm [&_h2]:mt-3 [&_h2]:text-base [&_h3]:mt-2 [&_h3]:text-sm">
                      <Streamdown>{m.content}</Streamdown>
                    </div>
                    {!!m.defects?.length && (
                      <div className="mt-3 grid gap-2">
                        {m.defects.map(d => <DefectCard key={d.id} d={d} />)}
                      </div>
                    )}
                    {!!m.citations?.length && (
                      <div className="mt-3 grid gap-2 md:grid-cols-2">
                        {m.citations.map((c, j) => <CitationCard key={c.kind + c.ref + j} c={c} stateCode={m.state} />)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

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

      {/* Composer */}
      <div className="sticky bottom-0 border-t border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-3">
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
              onClick={() => fileRef.current?.click()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-300 text-gray-500 transition-colors hover:border-transparent hover:text-white"
              onMouseEnter={e => (e.currentTarget.style.background = GOLD)}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              title="Attach a site photo"
            >
              <Paperclip size={17} />
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
              placeholder={`Ask the ${stateCode} brain — any act, NCC clause, standard, licence or defect…`}
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
    </div>
  );
}
