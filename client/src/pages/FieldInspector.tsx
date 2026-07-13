/**
 * Field Inspector — live in-loco defect scanner (phone/tablet).
 *
 * Point the camera at a building element: frames are scanned against the
 * BCNSW iAuditor Master Defect Library (181 items). When a library defect is
 * spotted the view flags it with a pulsing RED circle + defect code — that is
 * the cue to press the shutter. The captured photo is then classified
 * (library id, NCC refs, RAB pathway), marked with the red circle, stored and
 * appended to the inspection register CSV via /api/field/*.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import {
  Camera,
  SwitchCamera,
  Radar,
  FolderDown,
  X,
  Save,
  ArrowLeft,
  Upload,
  CircleAlert,
} from "lucide-react";

const NAVY = "#1a1a2e";
const GOLD = "#A68A64";

interface Detection {
  id: string;
  label: string;
  regime: string;
  cx: number;
  cy: number;
  r: number;
  confidence: "high" | "medium";
}

interface Finding {
  id: string;
  regime: string;
  subcategory: string | null;
  description: string | null;
  status: string;
  ncc2022Refs: string;
  ncc2019Refs: string;
  pathway: string;
  scopeOfWork: string | null;
  seriousReason: string | null;
  specialNotes: string | null;
  cx: number;
  cy: number;
  r: number;
  confidence: "high" | "medium" | "low";
  note: string;
}

interface SavedRow {
  seq: number;
  id: string;
  time: string;
  project: string;
  location: string;
  confidence: string;
  description: string;
}

const SCAN_INTERVAL_MS = 3200;
const DETECTION_TTL_MS = 7000;

const DEMO_DETECTIONS: Detection[] = [
  { id: "W1.3", label: "Ponding / inadequate falls on balcony", regime: "Waterproofing", cx: 0.52, cy: 0.62, r: 0.14, confidence: "high" },
  { id: "S1.1", label: "Exposed reinforcement / honeycombing", regime: "Structure", cx: 0.45, cy: 0.4, r: 0.12, confidence: "high" },
  { id: "F3.1", label: "Fire door does not self-close and latch", regime: "Fire Safety", cx: 0.5, cy: 0.5, r: 0.18, confidence: "medium" },
];

const DEMO_FINDING: Omit<Finding, "cx" | "cy" | "r"> = {
  id: "W1.3",
  regime: "Waterproofing",
  subcategory: "External waterproofing",
  description: "Retained water, ponding or inadequate falls on an roof or balcony.",
  status: "active",
  ncc2022Refs: "F1P2 · F1P3 · F1D5 · AS 4654.2",
  ncc2019Refs: "FP1.4 · F1.4 · AS 4654.2",
  pathway: "s33(2)",
  scopeOfWork: "1. Survey the affected area and identify high and low spots.\n2. Grind back high spots and top low spots.\n3. Prepare the substrate to receive a waterproofing membrane.\n4. Rectify consequential damage.",
  seriousReason: "Serious defect — failure to comply with BCA performance requirements and relevant Australian Standards.",
  specialNotes: null,
  confidence: "high",
  note: "Demo finding — enable ANTHROPIC_API_KEY for real AI matching.",
};

function confidenceEmoji(c: string) {
  return c === "high" ? "🔴" : c === "medium" ? "🟡" : "⚪";
}

export default function FieldInspector() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanBusyRef = useRef(false);
  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const demoTickRef = useRef(0);

  const [aiOn, setAiOn] = useState<boolean | null>(null);
  const [demo, setDemo] = useState(false);
  const [scanOn, setScanOn] = useState(true);
  const [cameraState, setCameraState] = useState<"starting" | "live" | "denied" | "unavailable">("starting");
  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [detections, setDetections] = useState<Detection[]>([]);
  const detectionsRef = useRef<Detection[]>([]);
  const [lastSeen, setLastSeen] = useState(0);
  const [project, setProject] = useState(() => localStorage.getItem("field_project") || "");
  const [location, setLocation] = useState(() => localStorage.getItem("field_location") || "");
  const [captured, setCaptured] = useState<{ dataUrl: string; w: number; h: number } | null>(null);
  const [identifying, setIdentifying] = useState(false);
  const [observation, setObservation] = useState("");
  const [findings, setFindings] = useState<Finding[]>([]);
  const [selected, setSelected] = useState(0);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [saved, setSaved] = useState<SavedRow[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("field_findings") || "[]");
    } catch {
      return [];
    }
  });
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => localStorage.setItem("field_project", project), [project]);
  useEffect(() => localStorage.setItem("field_location", location), [location]);
  useEffect(() => localStorage.setItem("field_findings", JSON.stringify(saved.slice(-200))), [saved]);
  useEffect(() => {
    detectionsRef.current = detections;
  }, [detections]);

  // ---- backend status -------------------------------------------------------
  useEffect(() => {
    fetch("/api/field/status")
      .then(r => r.json())
      .then(s => {
        setAiOn(!!s.ai);
        if (!s.ai) setDemo(true);
      })
      .catch(() => {
        setAiOn(false);
        setDemo(true);
      });
  }, []);

  // ---- camera ---------------------------------------------------------------
  const startCamera = useCallback(async (face: "environment" | "user") => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    setCameraState("starting");
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraState("unavailable");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: face }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setCameraState("live");
    } catch {
      setCameraState("denied");
    }
  }, []);

  useEffect(() => {
    startCamera(facing);
    return () => streamRef.current?.getTracks().forEach(t => t.stop());
  }, [facing, startCamera]);

  // ---- frame grab -----------------------------------------------------------
  const grabFrame = useCallback((maxSide: number, quality: number) => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return null;
    const scale = Math.min(1, maxSide / Math.max(v.videoWidth, v.videoHeight));
    const w = Math.round(v.videoWidth * scale);
    const h = Math.round(v.videoHeight * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d")!.drawImage(v, 0, 0, w, h);
    return { dataUrl: canvas.toDataURL("image/jpeg", quality), w, h };
  }, []);

  // ---- live scan loop -------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    async function tick() {
      if (cancelled) return;
      const idle = !scanOn || captured || cameraState !== "live" || document.hidden || scanBusyRef.current;
      if (!idle) {
        scanBusyRef.current = true;
        try {
          if (demo) {
            demoTickRef.current++;
            // Every 3rd frame pretend the camera sees a library defect
            if (demoTickRef.current % 3 === 0) {
              const d = DEMO_DETECTIONS[(demoTickRef.current / 3 - 1) % DEMO_DETECTIONS.length | 0];
              pushDetections([d]);
            }
          } else if (aiOn) {
            const frame = grabFrame(768, 0.6);
            if (frame) {
              const r = await fetch("/api/field/scan", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image: frame.dataUrl }),
              });
              if (r.ok) {
                const data = await r.json();
                if (data.detections?.length) pushDetections(data.detections);
              }
            }
          }
        } catch {
          /* scan errors are non-fatal; next tick retries */
        } finally {
          scanBusyRef.current = false;
        }
      }
      // expire stale detections
      setDetections(prev => (prev.length && Date.now() - lastSeenRef.current > DETECTION_TTL_MS ? [] : prev));
      scanTimerRef.current = setTimeout(tick, SCAN_INTERVAL_MS);
    }

    scanTimerRef.current = setTimeout(tick, 800);
    return () => {
      cancelled = true;
      if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanOn, demo, aiOn, cameraState, captured, grabFrame]);

  const lastSeenRef = useRef(0);
  function pushDetections(list: Detection[]) {
    const hadNone = detectionsRef.current.length === 0;
    lastSeenRef.current = Date.now();
    setLastSeen(Date.now());
    setDetections(list);
    if (hadNone && list.length) navigator.vibrate?.(150);
  }

  // ---- capture → identify ---------------------------------------------------
  async function onShutter() {
    const frame = grabFrame(1600, 0.85);
    if (!frame) return;
    setCaptured(frame);
    setIdentifying(true);
    setFindings([]);
    setObservation("");
    setSelected(0);
    setNotes("");
    try {
      if (demo || !aiOn) {
        await new Promise(r => setTimeout(r, 900));
        const d = detectionsRef.current[0] || DEMO_DETECTIONS[0];
        setObservation("Demo mode — sample classification of the framed element.");
        setFindings([{ ...DEMO_FINDING, id: d.id, regime: d.regime, cx: d.cx, cy: d.cy, r: d.r } as Finding]);
      } else {
        const r = await fetch("/api/field/identify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: frame.dataUrl, hintIds: detectionsRef.current.map(d => d.id) }),
        });
        const data = await r.json();
        if (!r.ok) throw new Error(data.message || data.error || "identify failed");
        setObservation(data.observation || "");
        setFindings(data.findings || []);
      }
    } catch (e: any) {
      setObservation(`Identification error: ${e.message}`);
    } finally {
      setIdentifying(false);
    }
  }

  async function loadPhotoFile(file: File) {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result));
      fr.onerror = reject;
      fr.readAsDataURL(file);
    });
    // Downscale through a canvas so uploads match camera captures
    const img = new Image();
    await new Promise(r => {
      img.onload = r;
      img.src = dataUrl;
    });
    const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    const frame = { dataUrl: canvas.toDataURL("image/jpeg", 0.85), w: canvas.width, h: canvas.height };
    setCaptured(frame);
    setIdentifying(true);
    setFindings([]);
    setObservation("");
    try {
      if (demo || !aiOn) {
        await new Promise(r => setTimeout(r, 900));
        setObservation("Demo mode — sample classification of the uploaded photo.");
        setFindings([{ ...DEMO_FINDING, cx: 0.5, cy: 0.55, r: 0.16 } as Finding]);
      } else {
        const r = await fetch("/api/field/identify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: frame.dataUrl }),
        });
        const data = await r.json();
        if (!r.ok) throw new Error(data.message || data.error || "identify failed");
        setObservation(data.observation || "");
        setFindings(data.findings || []);
      }
    } catch (e: any) {
      setObservation(`Identification error: ${e.message}`);
    } finally {
      setIdentifying(false);
    }
  }

  // ---- marked copy + save ---------------------------------------------------
  async function composeMarked(f: Finding): Promise<string> {
    if (!captured) return "";
    const img = new Image();
    await new Promise(r => {
      img.onload = r;
      img.src = captured.dataUrl;
    });
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    const cx = f.cx * img.width;
    const cy = f.cy * img.height;
    const r = f.r * Math.min(img.width, img.height);
    ctx.strokeStyle = "#e11d1d";
    ctx.lineWidth = Math.max(6, img.width / 150);
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    const fontPx = Math.max(20, Math.round(img.width / 40));
    ctx.font = `bold ${fontPx}px Arial`;
    const label = f.id;
    const tw = ctx.measureText(label).width;
    const lx = Math.min(Math.max(cx - tw / 2, 8), img.width - tw - 8);
    const ly = cy - r - 12 > fontPx ? cy - r - 12 : Math.min(cy + r + fontPx + 8, img.height - 8);
    ctx.fillStyle = "#e11d1d";
    ctx.fillRect(lx - 6, ly - fontPx, tw + 12, fontPx + 10);
    ctx.fillStyle = "#fff";
    ctx.fillText(label, lx, ly + 4);
    return canvas.toDataURL("image/jpeg", 0.85);
  }

  async function onSave() {
    const f = findings[selected];
    if (!f || !captured) return;
    setSaving(true);
    try {
      const markedBase64 = await composeMarked(f);
      const body = {
        project: project || "Site",
        location,
        verdict: f.confidence === "high" ? "confirmed" : "possible",
        confidence: f.confidence,
        notes,
        defectId: f.id,
        imageBase64: captured.dataUrl,
        markedBase64,
      };
      let seq = saved.length + 1;
      let where = "browser history";
      if (aiOn !== null) {
        const r = await fetch("/api/field/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await r.json().catch(() => ({}));
        if (r.ok) {
          seq = data.seq;
          where = data.folder;
        } else if (!demo) {
          throw new Error(data.message || data.error || "save failed");
        }
      }
      setSaved(prev => [
        ...prev,
        {
          seq,
          id: f.id,
          time: new Date().toISOString(),
          project: project || "Site",
          location,
          confidence: f.confidence,
          description: (f.description || "").slice(0, 100),
        },
      ]);
      setToast(`Saved #${String(seq).padStart(2, "0")} ${f.id} → ${where}`);
      setTimeout(() => setToast(""), 5000);
      backToLive();
    } catch (e: any) {
      setToast(`Save error: ${e.message}`);
      setTimeout(() => setToast(""), 6000);
    } finally {
      setSaving(false);
    }
  }

  function backToLive() {
    setCaptured(null);
    setFindings([]);
    setObservation("");
    setDetections([]);
  }

  function exportCsv() {
    const header = "seq,time,project,location,defect_id,confidence,description\n";
    const rows = saved
      .map(s =>
        [s.seq, s.time, s.project, s.location, s.id, s.confidence, s.description]
          .map(v => `"${String(v ?? "").replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `field_findings_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // Map frame-relative coords → screen position of the object-cover video
  function mapCircle(cx: number, cy: number, r: number) {
    const v = videoRef.current;
    const c = containerRef.current;
    if (!v || !c || !v.videoWidth) return { left: "50%", top: "50%", size: 120 };
    const s = Math.max(c.clientWidth / v.videoWidth, c.clientHeight / v.videoHeight);
    const dw = v.videoWidth * s;
    const dh = v.videoHeight * s;
    const offX = (c.clientWidth - dw) / 2;
    const offY = (c.clientHeight - dh) / 2;
    const size = r * Math.min(dw, dh) * 2;
    return { left: offX + cx * dw - size / 2, top: offY + cy * dh - size / 2, size };
  }

  const detActive = detections.length > 0 && Date.now() - lastSeen < DETECTION_TTL_MS;
  const secure = window.isSecureContext;

  // ---------------------------------------------------------------------------
  return (
    <div className="fixed inset-0 flex flex-col text-white" style={{ background: NAVY }}>
      {/* Top bar */}
      <div className="flex items-center gap-2 px-3 py-2 text-sm" style={{ background: "#12121f" }}>
        <Link href="/iauditor" className="p-1 opacity-80 hover:opacity-100">
          <ArrowLeft size={18} />
        </Link>
        <span className="font-semibold tracking-wide" style={{ color: GOLD }}>
          FIELD INSPECTOR
        </span>
        <input
          value={project}
          onChange={e => setProject(e.target.value)}
          placeholder="Project"
          className="ml-2 w-28 flex-shrink rounded bg-white/10 px-2 py-1 text-xs outline-none placeholder:text-white/40"
        />
        <input
          value={location}
          onChange={e => setLocation(e.target.value)}
          placeholder="Level / unit"
          className="w-24 flex-shrink rounded bg-white/10 px-2 py-1 text-xs outline-none placeholder:text-white/40"
        />
        <div className="ml-auto flex items-center gap-2 text-[10px] uppercase tracking-wider">
          <span
            className="rounded-full px-2 py-0.5"
            style={{ background: aiOn ? "#14532d" : "#7c2d12" }}
            title={aiOn ? "AI scanning enabled" : "Set ANTHROPIC_API_KEY on the server to enable AI"}
          >
            {aiOn === null ? "…" : aiOn ? "AI ON" : demo ? "DEMO" : "AI OFF"}
          </span>
        </div>
      </div>

      {!secure && (
        <div className="bg-amber-600/90 px-3 py-1 text-center text-xs">
          Camera needs HTTPS (or localhost). Over plain HTTP use “Upload photo” below.
        </div>
      )}
      {aiOn === false && (
        <div className="bg-white/5 px-3 py-1 text-center text-[11px] text-white/70">
          ANTHROPIC_API_KEY not set — running in <b>demo mode</b> (simulated detections, nothing is real).
        </div>
      )}

      {/* Camera stage */}
      <div ref={containerRef} className="relative flex-1 overflow-hidden bg-black">
        <video ref={videoRef} playsInline muted autoPlay className="absolute inset-0 h-full w-full object-cover" />

        {/* Captured still overlays the live video */}
        {captured && <img src={captured.dataUrl} alt="captured" className="absolute inset-0 h-full w-full object-cover" />}

        {/* Red detection overlay (live mode) */}
        {!captured &&
          detActive &&
          detections.map((d, i) => {
            const m = mapCircle(d.cx, d.cy, d.r);
            return (
              <div key={`${d.id}-${i}`}>
                <div
                  className="pointer-events-none absolute animate-pulse rounded-full border-4 border-red-600"
                  style={{ left: m.left, top: m.top, width: m.size, height: m.size, boxShadow: "0 0 30px rgba(225,29,29,.8)" }}
                />
                <div
                  className="pointer-events-none absolute -translate-x-1/2 rounded bg-red-600 px-2 py-0.5 text-xs font-bold"
                  style={{ left: (typeof m.left === "number" ? m.left : 0) + m.size / 2, top: Math.max(4, (typeof m.top === "number" ? m.top : 0) - 24) }}
                >
                  {d.id} — {d.label.slice(0, 40)}
                </div>
              </div>
            );
          })}

        {/* Red vignette + call to action when a defect is in view */}
        {!captured && detActive && (
          <>
            <div className="pointer-events-none absolute inset-0 border-8 border-red-600/70 animate-pulse" />
            <div className="pointer-events-none absolute bottom-28 left-1/2 -translate-x-1/2 rounded-full bg-red-600 px-4 py-1 text-sm font-bold shadow-lg">
              DEFECT IN VIEW — TAKE PHOTO
            </div>
          </>
        )}

        {/* Scan status chip */}
        {!captured && cameraState === "live" && (
          <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/50 px-3 py-1 text-xs">
            <Radar size={14} className={scanOn ? "animate-spin" : ""} style={{ color: detActive ? "#ef4444" : GOLD, animationDuration: "3s" }} />
            {scanOn ? (detActive ? "Defect detected" : `Scanning… (~1 frame / ${Math.round(SCAN_INTERVAL_MS / 1000)}s)`) : "Scan paused"}
          </div>
        )}

        {(cameraState === "denied" || cameraState === "unavailable") && !captured && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <CircleAlert size={40} className="text-amber-500" />
            <p className="max-w-xs text-sm text-white/80">
              {cameraState === "denied"
                ? "Camera access was blocked. Allow camera permission, or upload a photo instead."
                : "No camera available on this device/context. Upload a photo instead."}
            </p>
          </div>
        )}

        {/* Identify result sheet */}
        {captured && (
          <div className="absolute inset-x-0 bottom-0 max-h-[70%] overflow-y-auto rounded-t-2xl p-3" style={{ background: "rgba(18,18,31,.96)" }}>
            {identifying ? (
              <div className="flex items-center gap-3 p-4 text-sm text-white/80">
                <Radar size={18} className="animate-spin" style={{ color: GOLD }} />
                Matching against the defect library…
              </div>
            ) : (
              <>
                {observation && <p className="mb-2 text-xs text-white/70">{observation}</p>}
                {findings.length === 0 && !observation.startsWith("Identification error") && (
                  <p className="p-2 text-sm text-white/80">⚪ No library defect identified in this photo.</p>
                )}
                {findings.map((f, i) => (
                  <button
                    key={f.id + i}
                    onClick={() => setSelected(i)}
                    className={`mb-2 block w-full rounded-lg border p-3 text-left text-sm transition ${
                      selected === i ? "border-red-500 bg-red-500/10" : "border-white/10 bg-white/5"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold">
                        {confidenceEmoji(f.confidence)} {f.id} — {(f.description || "").slice(0, 90)}
                      </span>
                      <span className="whitespace-nowrap rounded bg-white/10 px-1.5 py-0.5 text-[10px] uppercase" style={{ color: GOLD }}>
                        {f.regime}
                      </span>
                    </div>
                    <div className="mt-1 space-y-0.5 text-xs text-white/70">
                      {f.ncc2022Refs && <div>NCC 2022: {f.ncc2022Refs}</div>}
                      {f.ncc2019Refs && <div>NCC 2019: {f.ncc2019Refs}</div>}
                      {f.pathway && <div>Pathway: RAB Act {f.pathway}</div>}
                      {f.note && <div className="italic">{f.note}</div>}
                      {f.status !== "active" && <div className="text-amber-400">({f.status} library row — verify wording)</div>}
                    </div>
                    {f.scopeOfWork && selected === i && (
                      <details className="mt-2 text-xs text-white/60">
                        <summary className="cursor-pointer" style={{ color: GOLD }}>
                          Scope of work
                        </summary>
                        <pre className="mt-1 whitespace-pre-wrap font-sans">{f.scopeOfWork}</pre>
                      </details>
                    )}
                  </button>
                ))}
                {findings.length > 0 && (
                  <input
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Notes (optional)"
                    className="mb-2 w-full rounded bg-white/10 px-2 py-1.5 text-xs outline-none placeholder:text-white/40"
                  />
                )}
                <div className="flex gap-2 pb-1">
                  {findings.length > 0 && (
                    <button
                      onClick={onSave}
                      disabled={saving}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold text-white disabled:opacity-50"
                      style={{ background: "#b91c1c" }}
                    >
                      <Save size={16} /> {saving ? "Saving…" : `Save ${findings[selected]?.id ?? ""}`}
                    </button>
                  )}
                  <button onClick={backToLive} className="flex items-center justify-center gap-2 rounded-lg bg-white/10 px-4 py-2.5 text-sm">
                    <X size={16} /> Discard
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Bottom controls */}
      {!captured && (
        <div className="flex items-center justify-between px-6 py-3" style={{ background: "#12121f" }}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setScanOn(s => !s)}
              className={`rounded-full p-3 ${scanOn ? "bg-white/15" : "bg-white/5 opacity-60"}`}
              title="Toggle live scanning"
            >
              <Radar size={20} style={{ color: GOLD }} />
            </button>
            <label className="cursor-pointer rounded-full bg-white/5 p-3" title="Upload / take a photo without live scan">
              <Upload size={20} style={{ color: GOLD }} />
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={e => e.target.files?.[0] && loadPhotoFile(e.target.files[0])}
              />
            </label>
          </div>

          <button
            onClick={onShutter}
            disabled={cameraState !== "live"}
            className={`h-[76px] w-[76px] rounded-full border-4 transition disabled:opacity-30 ${
              detActive ? "animate-pulse border-red-500 bg-red-600" : "border-white/60 bg-white/20"
            }`}
            title="Take photo"
          >
            <Camera size={30} className="mx-auto" />
          </button>

          <div className="flex items-center gap-3">
            <button onClick={() => setFacing(f => (f === "environment" ? "user" : "environment"))} className="rounded-full bg-white/5 p-3" title="Flip camera">
              <SwitchCamera size={20} style={{ color: GOLD }} />
            </button>
            <button onClick={() => setDrawerOpen(o => !o)} className="relative rounded-full bg-white/5 p-3" title="Session findings">
              <FolderDown size={20} style={{ color: GOLD }} />
              {saved.length > 0 && (
                <span className="absolute -right-1 -top-1 rounded-full bg-red-600 px-1.5 text-[10px] font-bold">{saved.length}</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Findings drawer */}
      {drawerOpen && (
        <div className="absolute inset-x-0 bottom-0 z-20 max-h-[60%] overflow-y-auto rounded-t-2xl p-4" style={{ background: "rgba(18,18,31,.98)" }}>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-bold" style={{ color: GOLD }}>
              Session findings ({saved.length})
            </span>
            <div className="flex gap-2">
              <button onClick={exportCsv} className="rounded bg-white/10 px-2 py-1 text-xs">
                Export CSV
              </button>
              <button onClick={() => setDrawerOpen(false)} className="rounded bg-white/10 px-2 py-1 text-xs">
                Close
              </button>
            </div>
          </div>
          {saved.length === 0 && <p className="text-xs text-white/60">Nothing saved yet.</p>}
          {[...saved].reverse().map((s, i) => (
            <div key={i} className="border-b border-white/10 py-1.5 text-xs text-white/80">
              <b>#{String(s.seq).padStart(2, "0")} {s.id}</b> {confidenceEmoji(s.confidence)} — {s.description}
              <div className="text-[10px] text-white/50">
                {s.project} {s.location && `· ${s.location}`} · {new Date(s.time).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {toast && (
        <div className="absolute left-1/2 top-14 z-30 -translate-x-1/2 rounded-lg bg-black/80 px-4 py-2 text-xs shadow-lg">{toast}</div>
      )}
    </div>
  );
}
