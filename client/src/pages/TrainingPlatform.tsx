/**
 * 369 Alliance — NCC Training Platform (/training, /training/:code)
 *
 * Clause-by-clause training built on the master register + evidence boards:
 * sidebar clause tree (824 NCC 2022 Vol 1 clauses + Specifications), per-clause
 * page with clause text, key references and the evidence board, and — where an
 * authored module exists (S1C1 flagship) — an interactive plain-3D view with
 * correctly anchored element hotspots, large-type detail cards, the 8-step
 * procedure, evidence checklist, risk examples, documentation chain and a
 * knowledge check. Progress persists in localStorage.
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { Logo369 } from "@/components/Logo369";
import FullAccessGate, { isFullAccess } from "@/components/FullAccessGate";
import { TRAINING_MODULES, TrainingModule } from "@/lib/trainingContent";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Loader2,
  Minus,
  Plus,
  RotateCcw,
  Search,
  X,
} from "lucide-react";

const NAVY = "#0f1420";
const PANEL = "#161b2c";
const PANEL2 = "#1d2337";
const GOLD = "#A68A64";
const TEAL = "#2dd4bf";
const LINE = "#2a3149";

interface TocClause { 0: string; 1: string; 2: string }
interface TocPart { p: string; pt: string; clauses: TocClause[] }
interface TocSection { s: string; title: string; parts: TocPart[] }
interface ClauseData {
  code: string; title: string; section: string; sectionTitle: string; part: string; partTitle: string;
  kind: string; text: string; page: number | null; legacy2019: string; as: string; asClauses: string;
  defectIds: string; board: boolean; plain: boolean; variations: string[]; prev: string | null; next: string | null;
}

interface Progress {
  viewed: Record<string, boolean>;
  explored: Record<string, string[]>;
  quiz: Record<string, number>;
}
const PKEY = "training369";
function loadProgress(): Progress {
  try {
    return { viewed: {}, explored: {}, quiz: {}, ...JSON.parse(localStorage.getItem(PKEY) || "{}") };
  } catch {
    return { viewed: {}, explored: {}, quiz: {} };
  }
}

export default function TrainingPlatform() {
  const [, params] = useRoute("/training/:code");
  const [, navigate] = useLocation();
  const code = (params?.code || "S1C1").toUpperCase();

  const [toc, setToc] = useState<TocSection[]>([]);
  const [clause, setClause] = useState<ClauseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openSecs, setOpenSecs] = useState<Record<string, boolean>>({ A: true });
  const [progress, setProgress] = useState<Progress>(loadProgress);
  const [zoom, setZoom] = useState(1);
  const [view, setView] = useState<"interactive" | "board" | "plain">("interactive");
  const [activeEl, setActiveEl] = useState<string | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [classSel, setClassSel] = useState("2");
  const [sideOpen, setSideOpen] = useState(false);

  const module: TrainingModule | undefined = TRAINING_MODULES[code];
  const explored = progress.explored[code] || [];

  function saveProgress(p: Progress) {
    setProgress(p);
    localStorage.setItem(PKEY, JSON.stringify(p));
  }

  useEffect(() => {
    fetch("/api/brain/toc").then(r => r.json()).then(d => setToc(d.toc || [])).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setActiveEl(null);
    setQuizAnswers({});
    fetch(`/api/brain/clause/${code}`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        setClause(d);
        setView(TRAINING_MODULES[code] && d?.plain ? "interactive" : d?.board ? "board" : "plain");
        if (d) {
          const p = loadProgress();
          if (!p.viewed[code]) {
            p.viewed[code] = true;
            saveProgress(p);
          }
        }
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const viewedCount = Object.keys(progress.viewed).length;
  const totalClauses = useMemo(() => toc.reduce((n, s) => n + s.parts.reduce((m, p) => m + p.clauses.length, 0), 0), [toc]);

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (q.length < 2) return null;
    const out: { code: string; title: string; sec: string }[] = [];
    for (const s of toc)
      for (const p of s.parts)
        for (const c of p.clauses) {
          if (c[0].toLowerCase().includes(q) || c[1].toLowerCase().includes(q)) out.push({ code: c[0], title: c[1], sec: s.s });
          if (out.length >= 40) return out;
        }
    return out;
  }, [search, toc]);

  function exploreElement(id: string) {
    setActiveEl(id);
    if (!explored.includes(id)) {
      const p = loadProgress();
      p.explored[code] = [...(p.explored[code] || []), id];
      saveProgress(p);
    }
  }

  function resetClauseProgress() {
    const p = loadProgress();
    delete p.explored[code];
    delete p.quiz[code];
    saveProgress(p);
    setQuizAnswers({});
    setActiveEl(null);
  }

  const quizScore = module ? module.quiz.reduce((n, q, i) => n + (quizAnswers[i] === q.correct ? 1 : 0), 0) : 0;
  const quizDone = module ? module.quiz.every((_, i) => quizAnswers[i] !== undefined) : false;
  useEffect(() => {
    if (module && quizDone) {
      const p = loadProgress();
      if ((p.quiz[code] || 0) < quizScore) {
        p.quiz[code] = quizScore;
        saveProgress(p);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizDone]);

  const activeElement = module?.elements.find(e => e.id === activeEl) || null;

  const sidebar = (
    <div className="flex h-full w-72 shrink-0 flex-col border-r" style={{ background: PANEL, borderColor: LINE }}>
      <div className="border-b p-3" style={{ borderColor: LINE }}>
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-500">Version</p>
        <div className="flex gap-1.5">
          <span className="rounded px-2.5 py-1 text-[11px] font-bold" style={{ background: GOLD, color: NAVY }}>NCC 2022</span>
          <span className="rounded border px-2.5 py-1 text-[11px] text-gray-500" style={{ borderColor: LINE }} title="Coming soon">NCC 2025</span>
        </div>
        <p className="mb-1.5 mt-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">Volume</p>
        <div className="flex gap-1.5">
          <span className="rounded px-2.5 py-1 text-[11px] font-bold text-white" style={{ background: PANEL2, boxShadow: `inset 0 0 0 1px ${TEAL}` }}>Vol 1</span>
          <span className="rounded border px-2.5 py-1 text-[11px] text-gray-500" style={{ borderColor: LINE }} title="Coming soon">Vol 2</span>
          <span className="rounded border px-2.5 py-1 text-[11px] text-gray-500" style={{ borderColor: LINE }} title="Coming soon">Vol 3</span>
        </div>
        <p className="mt-3 text-[11px] text-gray-400">
          Volume One · <span className="font-semibold text-gray-200">{totalClauses} clauses</span> ·{" "}
          <span className="font-semibold" style={{ color: TEAL }}>{Object.keys(TRAINING_MODULES).length} interactive</span>
        </p>
      </div>
      <div className="border-b p-3" style={{ borderColor: LINE }}>
        <div className="flex items-center gap-2 rounded-lg border px-2.5 py-1.5" style={{ borderColor: LINE, background: NAVY }}>
          <Search size={13} className="text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search clause or section…"
            className="w-full bg-transparent text-xs text-gray-200 outline-none placeholder:text-gray-600"
          />
          {search && <button type="button" onClick={() => setSearch("")}><X size={12} className="text-gray-500" /></button>}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {searchResults ? (
          searchResults.length ? (
            searchResults.map(r => (
              <button
                key={r.code}
                type="button"
                onClick={() => { navigate(`/training/${r.code}`); setSideOpen(false); }}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-white/5"
              >
                <span className="w-14 shrink-0 text-[11px] font-bold" style={{ color: GOLD }}>{r.code}</span>
                <span className="truncate text-xs text-gray-300">{r.title}</span>
              </button>
            ))
          ) : (
            <p className="px-2 py-3 text-xs text-gray-500">No matches.</p>
          )
        ) : (
          toc.map(sec => (
            <div key={sec.s} className="mb-0.5">
              <button
                type="button"
                onClick={() => setOpenSecs(o => ({ ...o, [sec.s]: !o[sec.s] }))}
                className="flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-left hover:bg-white/5"
              >
                {openSecs[sec.s] ? <ChevronDown size={13} className="text-gray-500" /> : <ChevronRight size={13} className="text-gray-500" />}
                <span className="text-xs font-bold text-gray-200">§{sec.s} {sec.title}</span>
                <span className="ml-auto rounded bg-white/5 px-1.5 text-[10px] text-gray-500">{sec.parts.reduce((n, p) => n + p.clauses.length, 0)}</span>
              </button>
              {openSecs[sec.s] &&
                sec.parts.map(part => (
                  <div key={part.p} className="ml-3 border-l pl-2" style={{ borderColor: LINE }}>
                    <p className="mt-1 px-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">{part.pt || part.p}</p>
                    {part.clauses.map(c => {
                      const active = c[0] === code;
                      const hasModule = !!TRAINING_MODULES[c[0]];
                      return (
                        <button
                          key={c[0]}
                          type="button"
                          onClick={() => { navigate(`/training/${c[0]}`); setSideOpen(false); }}
                          className="flex w-full items-center gap-2 rounded px-1.5 py-1 text-left hover:bg-white/5"
                          style={active ? { background: PANEL2, boxShadow: `inset 2px 0 0 ${GOLD}` } : undefined}
                        >
                          <span className="w-12 shrink-0 text-[11px] font-bold" style={{ color: active ? GOLD : "#8b93a8" }}>{c[0]}</span>
                          <span className="truncate text-[11px] text-gray-300">{c[1]}</span>
                          <span className="ml-auto flex items-center gap-1">
                            {progress.viewed[c[0]] && <Check size={10} className="text-gray-500" />}
                            {hasModule && <span className="h-1.5 w-1.5 rounded-full" style={{ background: TEAL }} />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ))}
            </div>
          ))
        )}
      </div>
    </div>
  );

  if (!isFullAccess()) return <FullAccessGate title="NCC Training Platform">{null}</FullAccessGate>;

  return (
    <div className="flex min-h-screen flex-col text-gray-200" style={{ background: NAVY }}>
      {/* Header */}
      <header className="sticky top-0 z-30 border-b" style={{ background: PANEL, borderColor: LINE }}>
        <div className="flex items-center gap-3 px-4 py-2.5">
          <Link href="/adm" className="text-gray-400 hover:text-white"><ArrowLeft size={16} /></Link>
          <button type="button" onClick={() => setSideOpen(o => !o)} className="lg:hidden"><ChevronRight size={16} className="text-gray-400" /></button>
          <Logo369 size={40} variant="dark" />
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: GOLD }}>369 Alliance · NCC Training Platform</p>
            <p className="truncate text-xs text-gray-400">{clause ? `${clause.code} — ${clause.title}` : "Loading…"}</p>
          </div>
          <div className="ml-auto flex items-center gap-4 text-center">
            {module && (
              <div>
                <p className="text-sm font-bold text-white">{module.elements.length}</p>
                <p className="text-[9px] uppercase tracking-wider text-gray-500">Topics</p>
              </div>
            )}
            <div>
              <p className="text-sm font-bold text-white">{viewedCount}</p>
              <p className="text-[9px] uppercase tracking-wider text-gray-500">Viewed</p>
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: GOLD }}>
                {module ? Math.round((explored.length / module.elements.length) * 100) : progress.viewed[code] ? 100 : 0}%
              </p>
              <p className="text-[9px] uppercase tracking-wider text-gray-500">Progress</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="hidden lg:block">{sidebar}</aside>
        {sideOpen && (
          <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setSideOpen(false)}>
            <div className="absolute inset-0 bg-black/60" />
            <div className="absolute inset-y-0 left-0" onClick={e => e.stopPropagation()}>{sidebar}</div>
          </div>
        )}

        <main className="min-w-0 flex-1 px-4 py-4 lg:px-6">
          {loading ? (
            <div className="flex items-center gap-2 py-20 text-sm text-gray-400">
              <Loader2 size={16} className="animate-spin" style={{ color: GOLD }} /> Loading clause…
            </div>
          ) : !clause ? (
            <p className="py-20 text-sm text-gray-400">Unknown clause. Pick one from the sidebar.</p>
          ) : (
            <>
              {/* Title row */}
              <p className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: GOLD }}>
                NCC 2022 · Volume One · Section {clause.section} · {clause.partTitle || clause.part}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <h1 className="text-xl font-bold text-white lg:text-2xl">{clause.code} — {clause.title}</h1>
                <span className="rounded border px-2 py-0.5 text-[10px] uppercase tracking-wide text-gray-400" style={{ borderColor: LINE }}>{clause.kind}</span>
                {clause.legacy2019 && <span className="text-[11px] text-gray-500">NCC 2019: {clause.legacy2019}</span>}
                <div className="ml-auto flex items-center gap-1.5">
                  <button type="button" onClick={() => setZoom(z => Math.max(0.6, +(z - 0.1).toFixed(2)))} className="rounded border p-1.5" style={{ borderColor: LINE }}><Minus size={13} /></button>
                  <span className="w-12 text-center text-xs text-gray-300">{Math.round(zoom * 100)}%</span>
                  <button type="button" onClick={() => setZoom(z => Math.min(1.8, +(z + 0.1).toFixed(2)))} className="rounded border p-1.5" style={{ borderColor: LINE }}><Plus size={13} /></button>
                  <button type="button" onClick={resetClauseProgress} className="ml-2 flex items-center gap-1 rounded border px-2 py-1.5 text-[11px] text-red-300" style={{ borderColor: "#7f1d1d" }}>
                    <RotateCcw size={12} /> Reset Progress
                  </button>
                </div>
              </div>

              {module && (
                <div className="mt-2 flex items-center gap-3">
                  <div className="h-1.5 w-56 overflow-hidden rounded-full" style={{ background: PANEL2 }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${(explored.length / module.elements.length) * 100}%`, background: GOLD }} />
                  </div>
                  <p className="text-[11px] uppercase tracking-wider text-gray-400">{explored.length}/{module.elements.length} elements explored</p>
                </div>
              )}

              {/* View tabs */}
              <div className="mt-3 flex gap-1.5">
                {module && clause.plain && (
                  <button type="button" onClick={() => setView("interactive")} className="rounded-t px-3 py-1.5 text-xs font-bold" style={view === "interactive" ? { background: PANEL, color: TEAL, boxShadow: `inset 0 2px 0 ${TEAL}` } : { color: "#8b93a8" }}>
                    Interactive
                  </button>
                )}
                {clause.board && (
                  <button type="button" onClick={() => setView("board")} className="rounded-t px-3 py-1.5 text-xs font-bold" style={view === "board" ? { background: PANEL, color: GOLD, boxShadow: `inset 0 2px 0 ${GOLD}` } : { color: "#8b93a8" }}>
                    Evidence Board
                  </button>
                )}
                {clause.plain && (
                  <button type="button" onClick={() => setView("plain")} className="rounded-t px-3 py-1.5 text-xs font-bold" style={view === "plain" ? { background: PANEL, color: "#c9d2e8", boxShadow: "inset 0 2px 0 #c9d2e8" } : { color: "#8b93a8" }}>
                    Plain 3D
                  </button>
                )}
              </div>

              {/* Viewer */}
              <div className="rounded-b-xl rounded-tr-xl border p-3" style={{ background: PANEL, borderColor: LINE }}>
                {view === "interactive" && module && clause.plain ? (
                  <div className="flex flex-col gap-3 xl:flex-row">
                    <div className="min-w-0 flex-1 overflow-auto">
                      <div className="relative mx-auto" style={{ width: `${zoom * 100}%` }}>
                        <img src={`/api/brain/plainboard/${clause.code}`} alt="plain 3D" className="w-full rounded-lg" />
                        {module.elements.map(el => {
                          const done = explored.includes(el.id);
                          const active = activeEl === el.id;
                          return (
                            <button
                              key={el.id}
                              type="button"
                              onClick={() => exploreElement(el.id)}
                              className="group absolute -translate-x-1/2 -translate-y-1/2"
                              style={{ left: `${el.x}%`, top: `${el.y}%` }}
                              title={el.label}
                            >
                              <span
                                className={`block rounded-full border-2 transition-all ${active ? "h-6 w-6" : "h-4 w-4"} ${done ? "" : "animate-pulse"}`}
                                style={{ borderColor: done ? GOLD : TEAL, background: active ? (done ? GOLD : TEAL) : "rgba(15,20,32,0.55)", boxShadow: `0 0 10px ${done ? GOLD : TEAL}` }}
                              />
                              <span
                                className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-bold opacity-0 transition-opacity group-hover:opacity-100"
                                style={{ background: "rgba(15,20,32,0.9)", color: done ? GOLD : TEAL }}
                              >
                                {el.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      {/* Element chips */}
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {module.elements.map(el => {
                          const done = explored.includes(el.id);
                          return (
                            <button
                              key={el.id}
                              type="button"
                              onClick={() => exploreElement(el.id)}
                              className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold"
                              style={{
                                borderColor: activeEl === el.id ? TEAL : done ? `${GOLD}88` : LINE,
                                color: done ? GOLD : "#c9d2e8",
                                background: activeEl === el.id ? PANEL2 : "transparent",
                              }}
                            >
                              {done && <Check size={11} />} {el.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    {/* Detail card — large type per user feedback */}
                    <div className="w-full shrink-0 xl:w-96">
                      {activeElement ? (
                        <div className="rounded-xl border p-4" style={{ borderColor: TEAL, background: PANEL2 }}>
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-lg font-bold text-white">{activeElement.label}</p>
                            {explored.includes(activeElement.id) && <Check size={18} style={{ color: GOLD }} />}
                          </div>
                          <p className="mt-0.5 text-base font-bold" style={{ color: TEAL }}>FRL {activeElement.frl}</p>
                          <ul className="mt-3 space-y-2">
                            {activeElement.bullets.map(b => (
                              <li key={b} className="flex gap-2 text-[15px] leading-relaxed text-gray-200">
                                <span className="mt-2 h-1 w-1 shrink-0 rounded-full" style={{ background: GOLD }} />
                                {b}
                              </li>
                            ))}
                          </ul>
                          <div className="mt-3 border-t pt-2 text-[13px]" style={{ borderColor: LINE }}>
                            <p><span className="font-bold" style={{ color: GOLD }}>NCC:</span> {activeElement.ncc}</p>
                            <p className="mt-0.5"><span className="font-bold" style={{ color: GOLD }}>AS:</span> {activeElement.as}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed p-5 text-sm leading-relaxed text-gray-400" style={{ borderColor: LINE }}>
                          <p className="mb-2 font-bold text-gray-200">How to use this tool</p>
                          1. Select a building class below to frame the clause.<br />
                          2. Click any glowing dot on the 3D building — the dot sits on the element itself.<br />
                          3. Read the element card here (large type), then work through the procedure, checklist and knowledge check below.
                          <p className="mt-3 mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-500">Select building class</p>
                          <div className="flex flex-wrap gap-1">
                            {module.classes.map(cl => (
                              <button
                                key={cl}
                                type="button"
                                onClick={() => setClassSel(cl)}
                                className="rounded px-2 py-0.5 text-[11px] font-bold"
                                style={classSel === cl ? { background: GOLD, color: NAVY } : { background: PANEL, color: "#8b93a8" }}
                              >
                                {cl}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : view === "board" && clause.board ? (
                  <div className="overflow-auto">
                    <img src={`/api/brain/board/${clause.code}`} alt="evidence board" className="mx-auto rounded-lg" style={{ width: `${zoom * 100}%` }} />
                  </div>
                ) : clause.plain ? (
                  <div className="overflow-auto">
                    <img src={`/api/brain/plainboard/${clause.code}`} alt="plain 3D" className="mx-auto rounded-lg" style={{ width: `${zoom * 100}%` }} />
                  </div>
                ) : (
                  <p className="py-8 text-center text-sm text-gray-500">No imagery indexed for this clause (boards folder offline?).</p>
                )}
              </div>

              {/* Clause text + references */}
              <div className="mt-4 grid gap-4 lg:grid-cols-3">
                <div className="rounded-xl border p-4 lg:col-span-2" style={{ background: PANEL, borderColor: LINE }}>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: GOLD }}>Clause text — 369 Alliance master register</p>
                  <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-gray-300">{clause.text || "Full text not captured for this clause — see the evidence board."}</p>
                  {clause.page && <p className="mt-2 text-[11px] text-gray-500">NCC 2022 PDF p.{clause.page}</p>}
                </div>
                <div className="space-y-4">
                  <div className="rounded-xl border p-4" style={{ background: PANEL, borderColor: LINE }}>
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: GOLD }}>Key references</p>
                    {clause.as ? <p className="text-[13px] leading-relaxed text-gray-300">{clause.as}</p> : <p className="text-xs text-gray-500">No AS references linked in the register.</p>}
                    {clause.asClauses && <p className="mt-1.5 text-[12px] text-gray-500">{clause.asClauses.slice(0, 300)}</p>}
                    {clause.defectIds && (
                      <p className="mt-2 text-[12px]"><span className="font-bold text-red-400">Linked defects:</span> <span className="text-gray-300">{clause.defectIds}</span></p>
                    )}
                    {clause.variations.length > 0 && (
                      <p className="mt-2 text-[12px]"><span className="font-bold" style={{ color: TEAL }}>State variations:</span> <span className="text-gray-300">{clause.variations.join(" · ")}</span></p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {clause.prev && (
                      <Link href={`/training/${clause.prev}`} className="flex flex-1 items-center gap-1.5 rounded-lg border px-3 py-2 text-xs text-gray-300 hover:text-white" style={{ borderColor: LINE }}>
                        <ArrowLeft size={13} /> {clause.prev}
                      </Link>
                    )}
                    {clause.next && (
                      <Link href={`/training/${clause.next}`} className="flex flex-1 items-center justify-end gap-1.5 rounded-lg px-3 py-2 text-xs font-bold" style={{ background: GOLD, color: NAVY }}>
                        {clause.next} <ArrowRight size={13} />
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {/* Authored module layers */}
              {module && (
                <>
                  <Section title={`8-step procedure — ${clause.code}`}>
                    <div className="grid gap-2 md:grid-cols-2">
                      {module.steps.map((s, i) => (
                        <div key={s.title} className="flex gap-3 rounded-lg border p-3" style={{ background: PANEL2, borderColor: LINE }}>
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold" style={{ background: GOLD, color: NAVY }}>{i + 1}</span>
                          <div>
                            <p className="text-[14px] font-bold text-white">{s.title}</p>
                            <p className="mt-0.5 text-[13px] leading-relaxed text-gray-300">{s.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Section>
                  <Section title="Evidence checklist">
                    <div className="grid gap-1.5 md:grid-cols-2">
                      {module.checklist.map(c => (
                        <p key={c} className="flex items-start gap-2 text-[14px] text-gray-200">
                          <Check size={15} className="mt-0.5 shrink-0" style={{ color: TEAL }} /> {c}
                        </p>
                      ))}
                    </div>
                  </Section>
                  <Section title="Risk examples — what goes wrong">
                    <div className="grid gap-2 md:grid-cols-2">
                      {module.risks.map(r => (
                        <div key={r.title} className="rounded-lg border p-3" style={{ borderColor: "#7f1d1d", background: "#1c1220" }}>
                          <p className="flex items-center gap-1.5 text-[14px] font-bold text-red-300"><CircleAlert size={14} /> {r.title}</p>
                          <p className="mt-1 text-[13px] leading-relaxed text-gray-300">{r.text}</p>
                        </div>
                      ))}
                    </div>
                  </Section>
                  <Section title="Documentation chain">
                    <div className="flex flex-wrap items-stretch gap-2">
                      {module.docChain.map((d, i) => (
                        <div key={d.title} className="flex items-center gap-2">
                          <div className="w-44 rounded-lg border p-2.5" style={{ background: PANEL2, borderColor: LINE }}>
                            <p className="text-[12px] font-bold text-white">{d.title}</p>
                            <p className="mt-0.5 text-[11px] leading-snug text-gray-400">{d.text}</p>
                          </div>
                          {i < module.docChain.length - 1 && <ArrowRight size={14} style={{ color: GOLD }} />}
                        </div>
                      ))}
                    </div>
                  </Section>
                  <Section title={`Knowledge check — ${clause.code}`} right={<span className="text-sm font-bold" style={{ color: quizDone ? (quizScore >= 4 ? TEAL : GOLD) : "#8b93a8" }}>Score {quizScore} / {module.quiz.length}{progress.quiz[code] !== undefined ? ` · best ${progress.quiz[code]}` : ""}</span>}>
                    <div className="space-y-4">
                      {module.quiz.map((q, qi) => {
                        const picked = quizAnswers[qi];
                        return (
                          <div key={qi}>
                            <p className="text-[14px] font-bold text-white">Q{qi + 1}. {q.q}</p>
                            <div className="mt-1.5 grid gap-1.5 md:grid-cols-2">
                              {q.options.map((opt, oi) => {
                                const isPicked = picked === oi;
                                const isCorrect = picked !== undefined && oi === q.correct;
                                const isWrongPick = isPicked && oi !== q.correct;
                                return (
                                  <button
                                    key={oi}
                                    type="button"
                                    onClick={() => setQuizAnswers(a => ({ ...a, [qi]: oi }))}
                                    className="rounded-lg border px-3 py-2 text-left text-[13px] leading-snug"
                                    style={{
                                      borderColor: isCorrect ? TEAL : isWrongPick ? "#dc2626" : LINE,
                                      background: isCorrect ? "#10231f" : isWrongPick ? "#231216" : PANEL2,
                                      color: isCorrect ? TEAL : isWrongPick ? "#fca5a5" : "#c9d2e8",
                                    }}
                                  >
                                    <span className="mr-1.5 font-bold">{String.fromCharCode(65 + oi)}.</span>
                                    {opt}
                                  </button>
                                );
                              })}
                            </div>
                            {picked !== undefined && (
                              <p className="mt-1.5 text-[12px] leading-relaxed" style={{ color: picked === q.correct ? TEAL : "#fca5a5" }}>{q.why}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </Section>
                </>
              )}
              {!module && (
                <p className="mt-4 rounded-lg border border-dashed px-4 py-3 text-xs text-gray-500" style={{ borderColor: LINE }}>
                  Interactive hotspot module not yet authored for {clause.code} — the evidence board above carries the full procedure, checklist and risk content. S1C1 shows the interactive format.
                </p>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function Section({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mt-4 rounded-xl border p-4" style={{ background: "#161b2c", borderColor: "#2a3149" }}>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#A68A64" }}>{title}</p>
        {right}
      </div>
      {children}
    </section>
  );
}
