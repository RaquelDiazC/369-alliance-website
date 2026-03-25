/*
 * DefectLibrary.tsx
 * Layout per user spec:
 *   - Regime tabs at top
 *   - LEFT (20%): scrollable list of brief descriptions in Excel sequence
 *   - RIGHT (80%): selected defect detail split into:
 *       LEFT half: NCC 2019 / NCC 2022 tabs + all description content
 *       RIGHT half: reference images with zoom/lightbox
 * NCC quoted text (in "…") rendered in blue italic blockquotes
 * Image zoom opens full-screen lightbox
 */
import { useState, useEffect, useMemo, useRef, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Defect {
  id: string;
  regime: string;
  category: string;
  brief_description: string;
  consequence: string;
  scope_of_work: string;
  ncc_2022: string;
  ncc_2019: string;
  as_used: string;
  as_clauses: string;
  evidence: string[];
  image_urls: string[];
  images: string[];
  serious_defect_reason: string;
  guidance_note: string;
  explanatory_note: string;
  requirement?: string;
}

// ─── Regime Config ────────────────────────────────────────────────────────────
const REGIME_CONFIG: Record<string, { color: string; light: string; icon: string }> = {
  "Waterproofing":           { color: "#0f4c81", light: "#e8f2fc", icon: "💧" },
  "Fire":                    { color: "#8b1a1a", light: "#fdf2f2", icon: "🔥" },
  "Structure":               { color: "#4a3728", light: "#f5f0eb", icon: "🏗️" },
  "Building Enclosure":      { color: "#1e3a5f", light: "#e8eef7", icon: "🧱" },
  "Essential Services":      { color: "#1a4a3a", light: "#e8f5f0", icon: "⚙️" },
  "Vertical Transportation": { color: "#4a1a6e", light: "#f3edf9", icon: "🛗" },
  "General":                 { color: "#5a4a1a", light: "#fdf8e8", icon: "📋" },
};

const REGIME_ORDER = [
  "Waterproofing", "Fire", "Structure", "Building Enclosure",
  "Essential Services", "Vertical Transportation", "General",
];

// This URL will be updated once images are fully uploaded
const DEFECTS_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310419663029262029/VFViyVGrhCaChFM8kiYsvZ/defects_v3_cee056fc.json";

// ─── NCC Text Renderer — quoted text in blue italic ───────────────────────────
function NccText({ text }: { text: string }) {
  if (!text) {
    return (
      <div style={{ color: "#9ca3af", fontStyle: "italic", fontSize: 13, padding: "12px 0" }}>
        No reference available for this tab.
      </div>
    );
  }

  // Split on quoted segments using both straight and curly quotes
  const segments: { type: "text" | "quote"; content: string }[] = [];
  // Match "..." or "..." (greedy within quotes)
  const regex = /[\u201c"]([^"\u201c\u201d]+)[\u201d"]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", content: text.slice(lastIndex, match.index) });
    }
    segments.push({ type: "quote", content: match[1] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    segments.push({ type: "text", content: text.slice(lastIndex) });
  }

  if (segments.length === 0) {
    return <span style={{ whiteSpace: "pre-wrap", fontSize: 13, color: "#374151", lineHeight: 1.75 }}>{text}</span>;
  }

  return (
    <div style={{ lineHeight: 1.75 }}>
      {segments.map((seg, i) => {
        if (seg.type === "quote") {
          return (
            <div key={i} style={{
              margin: "10px 0",
              padding: "10px 16px",
              background: "#eff6ff",
              borderLeft: "4px solid #2563eb",
              borderRadius: "0 6px 6px 0",
              color: "#1d4ed8",
              fontStyle: "italic",
              fontSize: 13,
              lineHeight: 1.7,
              whiteSpace: "pre-wrap"
            }}>
              &ldquo;{seg.content}&rdquo;
            </div>
          );
        }
        return (
          <span key={i} style={{ whiteSpace: "pre-wrap", fontSize: 13, color: "#374151" }}>
            {seg.content}
          </span>
        );
      })}
    </div>
  );
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────
function Lightbox({ urls, startIdx, onClose }: { urls: string[]; startIdx: number; onClose: () => void }) {
  const [idx, setIdx] = useState(startIdx);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIdx(i => (i + 1) % urls.length);
      if (e.key === "ArrowLeft") setIdx(i => (i - 1 + urls.length) % urls.length);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [urls.length, onClose]);

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 99999,
      background: "rgba(0,0,0,0.92)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        position: "relative", display: "flex", flexDirection: "column",
        alignItems: "center", gap: 12, maxWidth: "92vw", maxHeight: "92vh"
      }}>
        <button onClick={onClose} style={{
          position: "absolute", top: -44, right: 0,
          background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
          color: "#fff", borderRadius: "50%", width: 34, height: 34,
          cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center"
        }}>✕</button>

        <img src={urls[idx]} alt={`Image ${idx + 1}`}
          style={{ maxWidth: "88vw", maxHeight: "80vh", objectFit: "contain", borderRadius: 8, boxShadow: "0 8px 40px rgba(0,0,0,0.6)" }}
          onError={e => { (e.target as HTMLImageElement).alt = "Image unavailable"; }} />

        <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>{idx + 1} / {urls.length}</div>

        {urls.length > 1 && (
          <>
            <button onClick={() => setIdx(i => (i - 1 + urls.length) % urls.length)} style={{
              position: "absolute", left: -56, top: "38%",
              background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
              color: "#fff", borderRadius: "50%", width: 42, height: 42,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <button onClick={() => setIdx(i => (i + 1) % urls.length)} style={{
              position: "absolute", right: -56, top: "38%",
              background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
              color: "#fff", borderRadius: "50%", width: 42, height: 42,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </>
        )}

        {urls.length > 1 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", maxWidth: "80vw" }}>
            {urls.map((url, i) => (
              <button key={i} onClick={() => setIdx(i)} style={{
                width: 54, height: 54,
                border: i === idx ? "2px solid #60a5fa" : "2px solid rgba(255,255,255,0.2)",
                borderRadius: 6, overflow: "hidden", cursor: "pointer", padding: 0,
                background: "rgba(255,255,255,0.1)"
              }}>
                <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function DefectLibrary() {
  const [allDefects, setAllDefects] = useState<Defect[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRegime, setActiveRegime] = useState("Waterproofing");
  const [search, setSearch] = useState("");
  const [seriousOnly, setSeriousOnly] = useState(false);
  const [selected, setSelected] = useState<Defect | null>(null);
  const [activeTab, setActiveTab] = useState<"ncc22" | "ncc19">("ncc22");
  const [imgIdx, setImgIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxStart, setLightboxStart] = useState(0);

  useEffect(() => {
    fetch(DEFECTS_URL)
      .then(r => r.json())
      .then((data: Defect[]) => {
        setAllDefects(data);
        setLoading(false);
      })
      .catch(() => {
        setAllDefects([]);
        setLoading(false);
      });
  }, []);

  const regimeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const d of allDefects) counts[d.regime] = (counts[d.regime] || 0) + 1;
    return counts;
  }, [allDefects]);

  const regimeDefects = useMemo(() =>
    allDefects.filter(d => d.regime === activeRegime),
    [allDefects, activeRegime]
  );

  const filtered = useMemo(() => {
    let list = regimeDefects;
    if (seriousOnly) list = list.filter(d => !!d.serious_defect_reason);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(d =>
        d.id.toLowerCase().includes(q) ||
        (d.brief_description || "").toLowerCase().includes(q) ||
        (d.category || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [regimeDefects, seriousOnly, search]);

  const cfg = REGIME_CONFIG[activeRegime] || { color: "#1a1a2e", light: "#f8f8f8", icon: "📋" };

  function selectDefect(d: Defect) {
    setSelected(d);
    setImgIdx(0);
    setActiveTab("ncc22");
  }

  function switchRegime(r: string) {
    setActiveRegime(r);
    setSelected(null);
    setSearch("");
    setSeriousOnly(false);
  }

  const openLightbox = useCallback((i: number) => {
    setLightboxStart(i);
    setLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => setLightboxOpen(false), []);

  const nccText = selected
    ? activeTab === "ncc22" ? selected.ncc_2022 : selected.ncc_2019
    : "";

  return (
    <>
      {lightboxOpen && selected && selected.image_urls.length > 0 && (
        <Lightbox urls={selected.image_urls} startIdx={lightboxStart} onClose={closeLightbox} />
      )}

      <div style={{
        display: "flex", flexDirection: "column",
        height: "calc(100vh - 130px)", minHeight: 600,
        background: "#f5f4f2", borderRadius: 12, overflow: "hidden",
        border: "1px solid #e5e7eb"
      }}>

        {/* ── Regime Tabs ───────────────────────────────────────────────── */}
        <div style={{
          display: "flex", alignItems: "center",
          background: "#1a1a2e", padding: "0 12px",
          overflowX: "auto", borderBottom: "2px solid #A68A64", flexShrink: 0
        }}>
          {REGIME_ORDER.map(regime => {
            const rc = REGIME_CONFIG[regime];
            const count = regimeCounts[regime] || 0;
            const isActive = regime === activeRegime;
            return (
              <button key={regime} onClick={() => switchRegime(regime)} style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "10px 12px", border: "none", cursor: "pointer",
                background: isActive ? "rgba(255,255,255,0.1)" : "transparent",
                color: isActive ? "#fff" : "#9ca3af",
                fontWeight: isActive ? 700 : 500, fontSize: 12,
                borderBottom: isActive ? "3px solid #A68A64" : "3px solid transparent",
                transition: "all 0.15s", whiteSpace: "nowrap", flexShrink: 0,
              }}>
                <span style={{ fontSize: 14 }}>{rc?.icon}</span>
                <span>{regime}</span>
                {count > 0 && (
                  <span style={{
                    background: isActive ? "#A68A64" : "#374151",
                    color: "#fff", borderRadius: 10, fontSize: 10,
                    fontWeight: 700, padding: "1px 6px", minWidth: 18, textAlign: "center"
                  }}>{count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Main body: LEFT list + RIGHT detail ──────────────────────── */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

          {/* ── LEFT PANEL (20%): Brief Description List ──────────────── */}
          <div style={{
            width: "20%", minWidth: 200, maxWidth: 280,
            flexShrink: 0, display: "flex", flexDirection: "column",
            borderRight: "1px solid #e5e7eb", background: "#fff", overflow: "hidden"
          }}>
            {/* Search */}
            <div style={{ padding: "8px 10px", borderBottom: "1px solid #f3f4f6", background: "#fafafa" }}>
              <div style={{ position: "relative" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5"
                  style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)" }}>
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search…"
                  style={{
                    width: "100%", padding: "6px 8px 6px 26px",
                    border: "1px solid #e5e7eb", borderRadius: 6,
                    fontSize: 12, outline: "none", boxSizing: "border-box", background: "#fff"
                  }} />
              </div>
            </div>
            {/* Serious filter + count */}
            <div style={{
              padding: "5px 10px", borderBottom: "1px solid #f3f4f6",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "#fafafa"
            }}>
              <label style={{ display: "flex", alignItems: "center", gap: 5, cursor: "pointer", fontSize: 11, color: "#374151" }}>
                <input type="checkbox" checked={seriousOnly} onChange={e => setSeriousOnly(e.target.checked)}
                  style={{ accentColor: "#dc2626" }} />
                Serious Only
              </label>
              <span style={{ fontSize: 10, color: "#9ca3af" }}>{filtered.length} defects</span>
            </div>
            {/* List */}
            <div style={{ flex: 1, overflowY: "auto" }}>
              {loading ? (
                <div style={{ padding: 20, textAlign: "center", color: "#9ca3af" }}>
                  <div style={{ width: 24, height: 24, border: `3px solid ${cfg.color}`, borderTop: "3px solid transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 8px" }} />
                  <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                  <div style={{ fontSize: 11 }}>Loading…</div>
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ padding: 16, textAlign: "center", color: "#9ca3af", fontSize: 12 }}>No defects found</div>
              ) : (
                filtered.map((d, idx) => {
                  const isSelected = selected?.id === d.id;
                  return (
                    <button key={d.id} onClick={() => selectDefect(d)} style={{
                      width: "100%", textAlign: "left", border: "none",
                      borderBottom: "1px solid #f3f4f6",
                      background: isSelected ? cfg.light : "#fff",
                      borderLeft: isSelected ? `3px solid ${cfg.color}` : "3px solid transparent",
                      padding: "8px 10px 8px 8px", cursor: "pointer",
                      display: "flex", alignItems: "flex-start", gap: 7,
                      transition: "background 0.1s"
                    }}>
                      <span style={{
                        background: isSelected ? cfg.color : "#f3f4f6",
                        color: isSelected ? "#fff" : "#6b7280",
                        borderRadius: 3, fontSize: 9, fontWeight: 800,
                        padding: "2px 4px", flexShrink: 0, marginTop: 1,
                        whiteSpace: "nowrap", letterSpacing: "0.03em"
                      }}>{d.id}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 11.5, color: isSelected ? "#1f2937" : "#374151",
                          lineHeight: 1.4, fontWeight: isSelected ? 600 : 400
                        }}>{d.brief_description}</div>
                        <div style={{ display: "flex", gap: 3, marginTop: 3 }}>
                          {d.serious_defect_reason && (
                            <span style={{
                              background: "#fef2f2", color: "#dc2626",
                              border: "1px solid #fca5a5",
                              borderRadius: 3, fontSize: 8, fontWeight: 700, padding: "1px 3px"
                            }}>SERIOUS</span>
                          )}
                          {d.image_urls.length > 0 && (
                            <span style={{
                              background: "#f0f9ff", color: "#0284c7",
                              borderRadius: 3, fontSize: 8, fontWeight: 600, padding: "1px 3px"
                            }}>📷{d.image_urls.length}</span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* ── RIGHT PANEL (80%): Detail ─────────────────────────────── */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
            {!selected ? (
              <div style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                flexDirection: "column", gap: 14, color: "#9ca3af", padding: 40
              }}>
                <div style={{
                  width: 80, height: 80, borderRadius: 20, background: cfg.light,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40
                }}>{cfg.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 17, color: "#374151" }}>Select a defect</div>
                <div style={{ fontSize: 13, textAlign: "center", maxWidth: 320, lineHeight: 1.6 }}>
                  Choose a defect from the list on the left to view its NCC references, consequence, scope of work, and reference images.
                </div>
              </div>
            ) : (
              <>
                {/* Detail header bar */}
                <div style={{ background: cfg.color, padding: "12px 20px", flexShrink: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{
                      background: "rgba(255,255,255,0.22)", color: "#fff",
                      borderRadius: 5, fontSize: 11, fontWeight: 800, padding: "2px 8px"
                    }}>{selected.id}</span>
                    <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 11 }}>{selected.regime}</span>
                    {selected.category && (
                      <>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                        <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 11 }}>{selected.category}</span>
                      </>
                    )}
                    <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                      {selected.serious_defect_reason && (
                        <span style={{ background: "#dc2626", color: "#fff", borderRadius: 4, fontSize: 10, fontWeight: 700, padding: "2px 8px" }}>SERIOUS DEFECT</span>
                      )}
                      {selected.as_used && (
                        <span style={{ background: "rgba(255,255,255,0.15)", color: "#fff", borderRadius: 4, fontSize: 10, padding: "2px 8px" }}>AS {selected.as_used}</span>
                      )}
                    </div>
                  </div>
                  <div style={{ color: "#fff", fontWeight: 700, fontSize: 14, lineHeight: 1.4 }}>
                    {selected.brief_description}
                  </div>
                </div>

                {/* NCC Tab bar */}
                <div style={{
                  display: "flex", borderBottom: "1px solid #e5e7eb",
                  background: "#fff", flexShrink: 0, paddingLeft: 4
                }}>
                  {[
                    { id: "ncc22" as const, label: "NCC 2022" },
                    { id: "ncc19" as const, label: "NCC 2019" },
                  ].map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                      padding: "9px 18px", border: "none", background: "transparent",
                      color: activeTab === t.id ? cfg.color : "#6b7280",
                      fontWeight: activeTab === t.id ? 700 : 500, fontSize: 12,
                      cursor: "pointer",
                      borderBottom: activeTab === t.id ? `2px solid ${cfg.color}` : "2px solid transparent",
                      display: "flex", alignItems: "center", gap: 5
                    }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                      </svg>
                      {t.label}
                    </button>
                  ))}
                  {selected.as_clauses && (
                    <div style={{ marginLeft: "auto", padding: "9px 16px", fontSize: 11, color: "#9ca3af", display: "flex", alignItems: "center" }}>
                      AS {selected.as_used} cl. {selected.as_clauses}
                    </div>
                  )}
                </div>

                {/* ── Split: Description LEFT + Images RIGHT ─────────── */}
                <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

                  {/* Description column */}
                  <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", minWidth: 0 }}>

                    {/* Consequence */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={cfg.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                        </svg>
                        <span style={{ fontWeight: 700, fontSize: 11, color: cfg.color, textTransform: "uppercase", letterSpacing: "0.07em" }}>Consequence</span>
                      </div>
                      <div style={{
                        background: "#fffbeb", border: "1px solid #fde68a",
                        borderLeft: "4px solid #f59e0b", borderRadius: 8,
                        padding: "11px 14px", fontSize: 13, color: "#78350f", lineHeight: 1.65
                      }}>{selected.consequence}</div>
                    </div>

                    {/* NCC Reference */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={cfg.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                        </svg>
                        <span style={{ fontWeight: 700, fontSize: 11, color: cfg.color, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                          {activeTab === "ncc22" ? "NCC 2022 Reference" : "NCC 2019 Reference"}
                        </span>
                      </div>
                      <div style={{
                        background: "#f8f7f5", border: "1px solid #e5e7eb",
                        borderLeft: `4px solid ${cfg.color}`, borderRadius: 8,
                        padding: "14px 16px"
                      }}>
                        <NccText text={nccText || ""} />
                      </div>
                    </div>

                    {/* Explanatory Note */}
                    {selected.explanatory_note && (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={cfg.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                          </svg>
                          <span style={{ fontWeight: 700, fontSize: 11, color: cfg.color, textTransform: "uppercase", letterSpacing: "0.07em" }}>Explanatory Note</span>
                        </div>
                        <div style={{
                          background: "#f0f9ff", border: "1px solid #bae6fd",
                          borderLeft: "4px solid #0284c7", borderRadius: 8,
                          padding: "11px 14px", fontSize: 13, color: "#0c4a6e", lineHeight: 1.65, whiteSpace: "pre-wrap"
                        }}>{selected.explanatory_note}</div>
                      </div>
                    )}

                    {/* Scope of Work */}
                    {selected.scope_of_work && (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={cfg.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                          </svg>
                          <span style={{ fontWeight: 700, fontSize: 11, color: cfg.color, textTransform: "uppercase", letterSpacing: "0.07em" }}>Scope of Work / Rectification</span>
                        </div>
                        <div style={{
                          background: "#f0fdf4", border: "1px solid #bbf7d0",
                          borderLeft: "4px solid #16a34a", borderRadius: 8,
                          padding: "11px 14px", fontSize: 13, color: "#14532d", lineHeight: 1.75, whiteSpace: "pre-wrap"
                        }}>{selected.scope_of_work}</div>
                      </div>
                    )}

                    {/* Required Evidence */}
                    {selected.evidence && selected.evidence.length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={cfg.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 11 12 14 22 4"/>
                            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                          </svg>
                          <span style={{ fontWeight: 700, fontSize: 11, color: cfg.color, textTransform: "uppercase", letterSpacing: "0.07em" }}>Required Evidence to be Gathered</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {selected.evidence.map((ev, i) => (
                            <div key={i} style={{
                              display: "flex", alignItems: "flex-start", gap: 10,
                              background: "#f8f7f5", border: "1px solid #e5e7eb",
                              borderRadius: 7, padding: "9px 12px"
                            }}>
                              <div style={{
                                width: 20, height: 20, borderRadius: "50%",
                                background: cfg.color, color: "#fff",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 10, fontWeight: 700, flexShrink: 0
                              }}>{i + 1}</div>
                              <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{ev}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Why it is a serious defect */}
                    {selected.serious_defect_reason && (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                          </svg>
                          <span style={{ fontWeight: 700, fontSize: 11, color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.07em" }}>Why it is a Serious Defect</span>
                        </div>
                        <div style={{
                          background: "#fef2f2", border: "1px solid #fca5a5",
                          borderLeft: "4px solid #dc2626", borderRadius: 8,
                          padding: "11px 14px", fontSize: 13, color: "#7f1d1d", lineHeight: 1.65
                        }}>{selected.serious_defect_reason}</div>
                      </div>
                    )}
                  </div>

                  {/* ── Images column ──────────────────────────────────── */}
                  <div style={{
                    width: 280, flexShrink: 0,
                    borderLeft: "1px solid #e5e7eb", background: "#fafafa",
                    display: "flex", flexDirection: "column", overflow: "hidden"
                  }}>
                    <div style={{
                      padding: "10px 14px", borderBottom: "1px solid #f3f4f6",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      background: "#fff"
                    }}>
                      <span style={{ fontWeight: 700, fontSize: 10, color: "#374151", textTransform: "uppercase", letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: 5 }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={cfg.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                        </svg>
                        Reference Images
                      </span>
                      {selected.image_urls.length > 0 && (
                        <span style={{ fontSize: 11, color: "#9ca3af" }}>{imgIdx + 1}/{selected.image_urls.length}</span>
                      )}
                    </div>

                    {selected.image_urls.length === 0 ? (
                      <div style={{
                        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                        flexDirection: "column", gap: 8, color: "#9ca3af", padding: 20
                      }}>
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                        </svg>
                        <div style={{ fontSize: 11, textAlign: "center" }}>No reference images</div>
                      </div>
                    ) : (
                      <>
                        {/* Main image */}
                        <div style={{ position: "relative", background: "#f0f0f0", cursor: "zoom-in", flexShrink: 0 }}
                          onClick={() => openLightbox(imgIdx)}>
                          <img
                            src={selected.image_urls[imgIdx]}
                            alt={`Reference ${imgIdx + 1}`}
                            style={{ width: "100%", height: 200, objectFit: "cover", display: "block" }}
                            onError={e => { (e.target as HTMLImageElement).style.opacity = "0.3"; }}
                          />
                          {/* Zoom icon */}
                          <div style={{
                            position: "absolute", top: 8, right: 8,
                            background: "rgba(0,0,0,0.5)", borderRadius: 6,
                            width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center"
                          }}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                              <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
                            </svg>
                          </div>
                          {/* Counter */}
                          <div style={{
                            position: "absolute", bottom: 6, right: 6,
                            background: "rgba(0,0,0,0.6)", color: "#fff",
                            borderRadius: 10, fontSize: 10, fontWeight: 600, padding: "2px 7px"
                          }}>{imgIdx + 1}/{selected.image_urls.length}</div>
                          {/* Prev/Next */}
                          {selected.image_urls.length > 1 && (
                            <>
                              <button onClick={e => { e.stopPropagation(); setImgIdx(i => (i - 1 + selected.image_urls.length) % selected.image_urls.length); }} style={{
                                position: "absolute", left: 6, top: "50%", transform: "translateY(-50%)",
                                background: "rgba(0,0,0,0.55)", border: "none", color: "#fff",
                                borderRadius: "50%", width: 28, height: 28, cursor: "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center"
                              }}>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                              </button>
                              <button onClick={e => { e.stopPropagation(); setImgIdx(i => (i + 1) % selected.image_urls.length); }} style={{
                                position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)",
                                background: "rgba(0,0,0,0.55)", border: "none", color: "#fff",
                                borderRadius: "50%", width: 28, height: 28, cursor: "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center"
                              }}>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                              </button>
                            </>
                          )}
                        </div>

                        {/* Thumbnails */}
                        <div style={{ flex: 1, overflowY: "auto", padding: "10px", display: "flex", flexWrap: "wrap", gap: 6, alignContent: "flex-start" }}>
                          {selected.image_urls.map((url, i) => (
                            <div key={i} style={{ position: "relative" }}>
                              <button onClick={() => setImgIdx(i)} style={{
                                width: 60, height: 60,
                                border: i === imgIdx ? `2px solid ${cfg.color}` : "2px solid #e5e7eb",
                                borderRadius: 7, overflow: "hidden", cursor: "pointer",
                                padding: 0, background: "#f0f0f0"
                              }}>
                                <img src={url} alt={`Thumb ${i + 1}`}
                                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                  onError={e => { (e.target as HTMLImageElement).style.opacity = "0.3"; }} />
                              </button>
                              {/* Zoom button */}
                              <button onClick={() => openLightbox(i)} style={{
                                position: "absolute", bottom: 2, right: 2,
                                background: "rgba(0,0,0,0.55)", border: "none", color: "#fff",
                                borderRadius: 3, width: 16, height: 16, cursor: "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center", padding: 0
                              }}>
                                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
