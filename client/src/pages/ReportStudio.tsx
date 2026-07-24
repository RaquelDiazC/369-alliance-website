/**
 * Report Studio — evidence-based OC Audit report builder.
 *
 * Workflow (mirrors the official NSW DCS OC Audit reports):
 *   1. Audit information (developer / contractor / certifier / site / scope)
 *   2. Evidence — drawings (PDF) and site photos, tagged regime + location
 *      (e.g. "Basement 2 · Structural"), analysed one by one via
 *      /api/report/analyse-item against the official defect matrix
 *   3. Findings register — editable categories (serious → rectification order,
 *      potential-serious → stop work order, minor → direction, compliant →
 *      recommendation), Red/Amber/Green
 *   4. Executive summary (AI) + export: official-format PDF + Excel register
 */
import { useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { Logo369 } from "@/components/Logo369";
import FullAccessGate, { hasEntitlement } from "@/components/FullAccessGate";
import {
  ArrowLeft,
  CircleAlert,
  FileDown,
  FileSpreadsheet,
  FileText,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";

const NAVY = "#1a1a2e";
const GOLD = "#A68A64";

const REGIMES = ["Waterproofing", "Fire Safety", "Structural", "Building Enclosure", "Essential Services", "Other"];
const CLASSES = ["2", "3", "4", "5", "6", "7a", "7b", "8", "9a", "9b", "9c"];
const NCC_VERSIONS = ["NCC 2022", "NCC 2019 Amendment 1", "NCC 2019", "NCC 2016", "NCC 2015"];

const MATRIX = [
  { category: "extremely-serious", label: "Extremely serious", action: "Prohibition order", colour: "Red" },
  { category: "serious", label: "Serious", action: "Rectification order", colour: "Red" },
  { category: "potential-serious", label: "Potentially serious", action: "Stop work order", colour: "Amber" },
  { category: "minor", label: "Minor", action: "Direction", colour: "Amber" },
  { category: "compliant", label: "Compliant", action: "Recommendation", colour: "Green" },
] as const;
type Category = (typeof MATRIX)[number]["category"];
const matrixOf = (c: string) => MATRIX.find(m => m.category === c) || MATRIX[3];
const colourHex = (c: string) => (c === "Red" ? "#dc2626" : c === "Amber" ? "#d97706" : "#16a34a");

interface Finding {
  element: string;
  category: Category;
  label: string;
  action: string;
  colour: string;
  observation: string;
  breach: string;
  rectification: string;
  defectId: string | null;
  confidence: string;
  regime: string;
  location: string;
  source: string;
  kind: string;
}

interface EvidenceItem {
  id: number;
  file: File;
  kind: "drawing" | "photo";
  regime: string;
  location: string;
  note: string;
  status: "pending" | "analysing" | "done" | "error";
  observation?: string;
  error?: string;
  findingCount?: number;
}

interface Meta {
  fileNo: string;
  auditDates: string;
  leadAuditor: string;
  developer: string;
  developerAbn: string;
  contractor: string;
  contractorLicence: string;
  certifier: string;
  certifierReg: string;
  site: string;
  classCode: string;
  nccVersion: string;
  state: string;
}

const EMPTY_META: Meta = {
  fileNo: "", auditDates: "", leadAuditor: "", developer: "", developerAbn: "",
  contractor: "", contractorLicence: "", certifier: "", certifierReg: "",
  site: "", classCode: "2", nccVersion: "NCC 2022", state: "NSW",
};

const DISCLAIMER =
  "This audit report has been prepared in good faith with the audit undertaken with care and diligence. It is not warranted to be free from error, should not be relied on for any other purpose than that set out in the report, and reflects an inspection at a point in time only.";

export default function ReportStudio() {
  const [meta, setMeta] = useState<Meta>(EMPTY_META);
  const [items, setItems] = useState<EvidenceItem[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [summary, setSummary] = useState<{ overall: string; regimes: { regime: string; summary: string; worst: string }[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const nextId = useRef(1);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const f of findings) c[f.category] = (c[f.category] || 0) + 1;
    return c;
  }, [findings]);

  function flash(m: string) {
    setToast(m);
    setTimeout(() => setToast(""), 4000);
  }

  function setM<K extends keyof Meta>(k: K, v: Meta[K]) {
    setMeta(m => ({ ...m, [k]: v }));
  }

  function addFiles(files: FileList | null) {
    if (!files) return;
    const add: EvidenceItem[] = [];
    for (const f of Array.from(files)) {
      const isPdf = /\.pdf$/i.test(f.name);
      add.push({
        id: nextId.current++,
        file: f,
        kind: isPdf ? "drawing" : "photo",
        regime: "Waterproofing",
        location: "",
        note: "",
        status: "pending",
      });
    }
    setItems(list => [...list, ...add]);
  }

  function patchItem(id: number, patch: Partial<EvidenceItem>) {
    setItems(list => list.map(i => (i.id === id ? { ...i, ...patch } : i)));
  }

  async function analyseItem(item: EvidenceItem) {
    patchItem(item.id, { status: "analysing", error: undefined });
    try {
      const fd = new FormData();
      fd.append("file", item.file);
      fd.append("kind", item.kind);
      fd.append("regime", item.regime);
      fd.append("location", item.location);
      fd.append("note", item.note);
      fd.append("classCode", meta.classCode);
      fd.append("nccVersion", meta.nccVersion);
      fd.append("state", meta.state);
      const r = await fetch("/api/report/analyse-item", { method: "POST", body: fd });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data?.message || data?.error || `HTTP ${r.status}`);
      setFindings(f => [...f, ...(data.findings || [])]);
      patchItem(item.id, { status: "done", observation: data.observation, findingCount: (data.findings || []).length });
    } catch (err: any) {
      patchItem(item.id, { status: "error", error: String(err?.message || err) });
    }
  }

  async function analyseAll() {
    setBusy(true);
    for (const item of items.filter(i => i.status === "pending" || i.status === "error")) {
      // sequential — keeps memory and API pressure low
      // eslint-disable-next-line no-await-in-loop
      await analyseItem(item);
    }
    setBusy(false);
  }

  async function generateSummary() {
    if (!findings.length) return flash("Analyse some evidence first — the register is empty.");
    setBusy(true);
    try {
      const r = await fetch("/api/report/summarise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ findings, site: meta.site }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data?.message || data?.error || `HTTP ${r.status}`);
      setSummary(data);
    } catch (err: any) {
      flash(`Summary failed: ${err?.message || err}`);
    } finally {
      setBusy(false);
    }
  }

  function updateFinding(idx: number, patch: Partial<Finding>) {
    setFindings(list =>
      list.map((f, i) => {
        if (i !== idx) return f;
        const merged = { ...f, ...patch };
        if (patch.category) {
          const m = matrixOf(patch.category);
          merged.label = m.label;
          merged.action = m.action;
          merged.colour = m.colour;
        }
        return merged;
      }),
    );
  }

  // ---------------------------------------------------------------- exports
  function exportExcel() {
    if (!findings.length) return flash("Nothing to export yet.");
    const rows = findings.map((f, i) => ({
      No: i + 1, Regime: f.regime, Location: f.location, Element: f.element,
      Category: f.label, Action: f.action, Colour: f.colour,
      Observation: f.observation, "BCA / AS / Plans reference": f.breach,
      Rectification: f.rectification, "Defect ID": f.defectId || "",
      Confidence: f.confidence, Source: f.source,
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Defect Register");
    XLSX.writeFile(wb, `Defect_Register_${(meta.site || "site").replace(/[^\w]+/g, "_").slice(0, 40)}.xlsx`);
  }

  function exportPdf() {
    if (!findings.length) return flash("Nothing to export yet.");
    const doc = new jsPDF();
    const W = doc.internal.pageSize.getWidth();
    const margin = 14;

    // ---- Cover
    doc.setFillColor(26, 26, 46);
    doc.rect(0, 0, W, 62, "F");
    doc.setTextColor(166, 138, 100);
    doc.setFontSize(20).setFont("helvetica", "bold");
    doc.text("AUDIT REPORT", margin, 24);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10).setFont("helvetica", "normal");
    doc.text("Residential Apartment Buildings (Compliance and Enforcement Powers) Act 2020", margin, 33);
    doc.text("Prepared with the 369 Alliance Report Studio", margin, 40);
    doc.setTextColor(30, 30, 30);
    let y = 74;
    doc.setFontSize(11).setFont("helvetica", "bold");
    doc.text(`Developer: ${meta.developer || "—"}`, margin, y); y += 7;
    doc.text(`Development site: ${meta.site || "—"}`, margin, y); y += 7;
    doc.text(`Date of report: ${new Date().toLocaleDateString("en-AU")}`, margin, y); y += 10;
    doc.setFontSize(8).setFont("helvetica", "italic");
    doc.text(doc.splitTextToSize(DISCLAIMER, W - margin * 2), margin, y);

    // ---- Audit information
    autoTable(doc, {
      startY: y + 18,
      head: [["Audit information", ""]],
      body: [
        ["File No.", meta.fileNo || "—"],
        ["Site audit dates", meta.auditDates || "—"],
        ["Lead auditor", meta.leadAuditor || "—"],
        ["Developer / ABN", `${meta.developer || "—"} ${meta.developerAbn ? "· ABN " + meta.developerAbn : ""}`],
        ["Principal contractor / licence", `${meta.contractor || "—"} ${meta.contractorLicence ? "· " + meta.contractorLicence : ""}`],
        ["Certifier / registration", `${meta.certifier || "—"} ${meta.certifierReg ? "· " + meta.certifierReg : ""}`],
        ["Building class / code edition", `Class ${meta.classCode} · ${meta.nccVersion} · ${meta.state}`],
      ],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [26, 26, 46], textColor: [166, 138, 100] },
    });

    // ---- Purpose / scope / criteria / methodology
    const regimesInScope = Array.from(new Set(findings.map(f => f.regime)));
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 6,
      head: [["Section", "Content"]],
      body: [
        ["Purpose", "Verify that the building work was carried out in accordance with the BCA Volume One, the relevant Australian Standards and the approved plans; identify serious defects; and determine whether directions, rectification or stop work orders are required."],
        ["Scope", `Audit of: ${regimesInScope.join(", ")}.`],
        ["Criteria", "Relevant sections of the BCA Volume One and Australian Standards. Findings are categorised per the OC Audit defect matrix (Appendix 1)."],
        ["Methodology", "Desktop review of the design documentation provided (for-construction drawings and site photographs), assessment of each evidence item against the audit criteria, and classification of findings by category and required action."],
      ],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [26, 26, 46], textColor: [166, 138, 100] },
      columnStyles: { 0: { cellWidth: 30, fontStyle: "bold" } },
    });

    // ---- Executive summary
    doc.addPage();
    doc.setFontSize(14).setFont("helvetica", "bold").setTextColor(26, 26, 46);
    doc.text("Executive Summary", margin, 18);
    doc.setFontSize(9).setFont("helvetica", "normal").setTextColor(30, 30, 30);
    const overall =
      summary?.overall ||
      `The audit identified ${counts["serious"] || 0} serious, ${counts["potential-serious"] || 0} potentially serious and ${counts["minor"] || 0} minor findings across ${regimesInScope.length} audited element(s).`;
    doc.text(doc.splitTextToSize(overall, W - margin * 2), margin, 26);
    autoTable(doc, {
      startY: 44,
      head: [["Audit element", "Summary", "Status"]],
      body: regimesInScope.map(rg => {
        const rows = findings.filter(f => f.regime === rg);
        const worstCat = MATRIX.find(m => rows.some(f => f.category === m.category))!;
        const aiRow = summary?.regimes.find(r => r.regime.toLowerCase().startsWith(rg.toLowerCase()));
        return [rg, aiRow?.summary || `${rows.length} finding(s); worst category: ${worstCat.label}.`, worstCat.label];
      }),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [26, 26, 46], textColor: [166, 138, 100] },
      didParseCell: d => {
        if (d.section === "body" && d.column.index === 2) {
          const m = MATRIX.find(x => x.label === d.cell.raw);
          if (m) { d.cell.styles.textColor = m.colour === "Red" ? [220, 38, 38] : m.colour === "Amber" ? [217, 119, 6] : [22, 163, 74]; d.cell.styles.fontStyle = "bold"; }
        }
      },
    });

    // ---- Findings per regime
    for (const rg of regimesInScope) {
      const rows = findings.filter(f => f.regime === rg);
      doc.addPage();
      doc.setFontSize(13).setFont("helvetica", "bold").setTextColor(26, 26, 46);
      doc.text(`Audit findings — ${rg}`, margin, 18);
      autoTable(doc, {
        startY: 24,
        head: [["#", "Location", "Element / Observation", "BCA / AS / Plans", "Category", "Action required"]],
        body: rows.map((f, i) => [
          String(i + 1),
          f.location || "—",
          `${f.element}\n${f.observation}${f.defectId ? `\nDefect ID: ${f.defectId}` : ""}${f.rectification ? `\nRectification: ${f.rectification}` : ""}`,
          f.breach || "—",
          f.label,
          f.action,
        ]),
        styles: { fontSize: 8, cellPadding: 1.5 },
        headStyles: { fillColor: [26, 26, 46], textColor: [166, 138, 100] },
        columnStyles: { 0: { cellWidth: 8 }, 1: { cellWidth: 24 }, 2: { cellWidth: 70 }, 3: { cellWidth: 34 }, 4: { cellWidth: 24 }, 5: { cellWidth: 26 } },
        didParseCell: d => {
          if (d.section === "body" && d.column.index === 4) {
            const m = MATRIX.find(x => x.label === d.cell.raw);
            if (m) { d.cell.styles.textColor = m.colour === "Red" ? [220, 38, 38] : m.colour === "Amber" ? [217, 119, 6] : [22, 163, 74]; d.cell.styles.fontStyle = "bold"; }
          }
        },
      });
    }

    // ---- Appendix 1 — defect matrix
    doc.addPage();
    doc.setFontSize(13).setFont("helvetica", "bold").setTextColor(26, 26, 46);
    doc.text("Appendix 1 — Defect reporting categories", margin, 18);
    autoTable(doc, {
      startY: 24,
      head: [["Category", "Meaning", "Action", "Colour"]],
      body: [
        ["Extremely serious", "Statutory triggers under the RAB Act (e.g. expected completion notice not duly given; unresolved rectification or development control orders; missing strata building bond).", "Prohibition order", "Red"],
        ["Serious", "Defect in a building element attributable to a failure to comply with the BCA performance requirements, the relevant Australian Standards or the approved plans (RAB Act s3).", "Rectification order", "Red"],
        ["Potentially serious", "High likelihood / moderate risk that, unless rectified, the defect becomes a serious defect.", "Stop work order", "Amber"],
        ["Minor", "Non-conformance requiring a direction (process, documentation, sequencing).", "Direction", "Amber"],
        ["Compliant", "Building work meets the deemed-to-satisfy and/or performance solutions; improvement opportunities noted.", "Recommendation", "Green"],
      ],
      styles: { fontSize: 8.5 },
      headStyles: { fillColor: [26, 26, 46], textColor: [166, 138, 100] },
      didParseCell: d => {
        if (d.section === "body" && d.column.index === 3) {
          const c = String(d.cell.raw);
          d.cell.styles.textColor = c === "Red" ? [220, 38, 38] : c === "Amber" ? [217, 119, 6] : [22, 163, 74];
          d.cell.styles.fontStyle = "bold";
        }
      },
    });

    doc.save(`OC_Audit_Report_${(meta.site || "site").replace(/[^\w]+/g, "_").slice(0, 40)}.pdf`);
  }

  // ---------------------------------------------------------------- render
  const inputCls = "w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm outline-none focus:ring-2";
  const ringStyle = { "--tw-ring-color": GOLD } as React.CSSProperties;

  if (!hasEntitlement("report")) return <FullAccessGate title="Report Studio" need="report">{null}</FullAccessGate>;

  return (
    <div className="min-h-screen pb-16" style={{ background: "#f4f2ee" }}>
      <header className="sticky top-0 z-20 text-white shadow-md" style={{ background: NAVY }}>
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Link href="/adm" className="text-white/70 hover:text-white"><ArrowLeft size={16} /></Link>
          <Logo369 size={40} variant="dark" />
          <div>
            <h1 className="text-base font-bold leading-tight">369 Alliance Report Studio <span className="font-normal text-white/60">· OC Audit format</span></h1>
            <p className="text-[11px] text-white/50">Drawings + photos → findings per the official defect matrix → audit report</p>
          </div>
          <div className="ml-auto flex gap-2">
            <button type="button" onClick={exportExcel} className="flex items-center gap-1.5 rounded-full border border-white/25 px-3 py-1 text-[11px] font-semibold text-white/80 hover:text-white">
              <FileSpreadsheet size={13} /> Register
            </button>
            <button type="button" onClick={exportPdf} className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold" style={{ background: GOLD, color: NAVY }}>
              <FileDown size={13} /> Official PDF
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-4 px-4 py-4">
        {/* 1 — Audit information */}
        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide" style={{ color: NAVY }}>1 · Audit information</h2>
          <div className="grid gap-2.5 md:grid-cols-3">
            <input className={inputCls} style={ringStyle} placeholder="Development site address" value={meta.site} onChange={e => setM("site", e.target.value)} />
            <input className={inputCls} style={ringStyle} placeholder="File No." value={meta.fileNo} onChange={e => setM("fileNo", e.target.value)} />
            <input className={inputCls} style={ringStyle} placeholder="Site audit date(s)" value={meta.auditDates} onChange={e => setM("auditDates", e.target.value)} />
            <input className={inputCls} style={ringStyle} placeholder="Lead auditor" value={meta.leadAuditor} onChange={e => setM("leadAuditor", e.target.value)} />
            <input className={inputCls} style={ringStyle} placeholder="Developer" value={meta.developer} onChange={e => setM("developer", e.target.value)} />
            <input className={inputCls} style={ringStyle} placeholder="Developer ABN" value={meta.developerAbn} onChange={e => setM("developerAbn", e.target.value)} />
            <input className={inputCls} style={ringStyle} placeholder="Principal contractor" value={meta.contractor} onChange={e => setM("contractor", e.target.value)} />
            <input className={inputCls} style={ringStyle} placeholder="Contractor licence" value={meta.contractorLicence} onChange={e => setM("contractorLicence", e.target.value)} />
            <input className={inputCls} style={ringStyle} placeholder="Certifier / registration" value={meta.certifier} onChange={e => setM("certifier", e.target.value)} />
            <select className={inputCls} style={ringStyle} value={meta.classCode} onChange={e => setM("classCode", e.target.value)}>
              {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
            </select>
            <select className={inputCls} style={ringStyle} value={meta.nccVersion} onChange={e => setM("nccVersion", e.target.value)}>
              {NCC_VERSIONS.map(v => <option key={v}>{v}</option>)}
            </select>
            <select className={inputCls} style={ringStyle} value={meta.state} onChange={e => setM("state", e.target.value)}>
              {["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </section>

        {/* 2 — Evidence */}
        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: NAVY }}>2 · Evidence — drawings & photos</h2>
            <div className="flex gap-2">
              <input ref={fileRef} type="file" multiple accept=".pdf,image/jpeg,image/png,image/webp" className="hidden" onChange={e => { addFiles(e.target.files); e.target.value = ""; }} />
              <button type="button" onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold" style={{ borderColor: GOLD, color: NAVY }}>
                <Plus size={14} /> Add files
              </button>
              <button
                type="button"
                onClick={analyseAll}
                disabled={busy || !items.some(i => i.status === "pending" || i.status === "error")}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40"
                style={{ background: NAVY }}
              >
                {busy ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Analyse all
              </button>
            </div>
          </div>
          {items.length === 0 && (
            <p className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-xs text-gray-500">
              Add drawing sets (PDF) and site photos — tag each with regime and location (e.g. "Basement 2" + Structural),
              then Analyse all. Findings land in the register below, classified per the official defect matrix.
            </p>
          )}
          <div className="space-y-2">
            {items.map(item => (
              <div key={item.id} className="rounded-lg border border-gray-200 p-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <FileText size={15} style={{ color: GOLD }} />
                  <span className="max-w-56 truncate text-xs font-semibold" style={{ color: NAVY }}>{item.file.name}</span>
                  <select className="rounded border border-gray-300 px-1.5 py-1 text-[11px]" value={item.kind} onChange={e => patchItem(item.id, { kind: e.target.value as any })}>
                    <option value="drawing">Drawing</option>
                    <option value="photo">Photo</option>
                  </select>
                  <select className="rounded border border-gray-300 px-1.5 py-1 text-[11px]" value={item.regime} onChange={e => patchItem(item.id, { regime: e.target.value })}>
                    {REGIMES.map(r => <option key={r}>{r}</option>)}
                  </select>
                  <input className="w-32 rounded border border-gray-300 px-1.5 py-1 text-[11px]" placeholder="Location (Basement 2)" value={item.location} onChange={e => patchItem(item.id, { location: e.target.value })} />
                  <input className="min-w-32 flex-1 rounded border border-gray-300 px-1.5 py-1 text-[11px]" placeholder="Note for the auditor AI (optional)" value={item.note} onChange={e => patchItem(item.id, { note: e.target.value })} />
                  <span className="ml-auto text-[11px] font-semibold">
                    {item.status === "pending" && <span className="text-gray-400">pending</span>}
                    {item.status === "analysing" && <span className="flex items-center gap-1" style={{ color: GOLD }}><Loader2 size={11} className="animate-spin" /> analysing…</span>}
                    {item.status === "done" && <span className="text-green-600">{item.findingCount} finding(s)</span>}
                    {item.status === "error" && <span className="text-red-600">failed</span>}
                  </span>
                  <button type="button" onClick={() => setItems(l => l.filter(x => x.id !== item.id))} className="text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                </div>
                {item.observation && <p className="mt-1.5 rounded bg-gray-50 px-2 py-1 text-[11px] italic text-gray-600">{item.observation}</p>}
                {item.error && <p className="mt-1.5 flex items-center gap-1 text-[11px] text-red-600"><CircleAlert size={11} /> {item.error}</p>}
              </div>
            ))}
          </div>
        </section>

        {/* 3 — Findings register */}
        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: NAVY }}>3 · Findings register ({findings.length})</h2>
            <div className="flex items-center gap-2 text-[11px] font-semibold">
              <span className="text-red-600">{(counts["serious"] || 0) + (counts["extremely-serious"] || 0)} serious</span>
              <span className="text-amber-600">{(counts["potential-serious"] || 0) + (counts["minor"] || 0)} amber</span>
              <span className="text-green-600">{counts["compliant"] || 0} compliant</span>
              <button type="button" onClick={generateSummary} disabled={busy || !findings.length} className="ml-2 flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold text-white disabled:opacity-40" style={{ background: NAVY }}>
                {busy ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />} Executive summary
              </button>
            </div>
          </div>
          {summary && (
            <div className="mb-3 rounded-lg border px-3 py-2 text-xs text-gray-700" style={{ borderColor: `${GOLD}66`, background: "#faf7f2" }}>
              <p className="font-semibold" style={{ color: NAVY }}>Executive summary</p>
              <p className="mt-1">{summary.overall}</p>
            </div>
          )}
          {findings.length === 0 ? (
            <p className="text-xs text-gray-500">No findings yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-xs">
                <thead>
                  <tr className="border-b text-[10px] uppercase tracking-wide text-gray-400">
                    <th className="py-1.5 pr-2">#</th>
                    <th className="py-1.5 pr-2">Regime · Location</th>
                    <th className="py-1.5 pr-2">Element / Observation</th>
                    <th className="py-1.5 pr-2">BCA / AS / Plans</th>
                    <th className="py-1.5 pr-2">Category</th>
                    <th className="py-1.5 pr-2">Action</th>
                    <th className="py-1.5" />
                  </tr>
                </thead>
                <tbody>
                  {findings.map((f, i) => (
                    <tr key={i} className="border-b border-gray-100 align-top">
                      <td className="py-2 pr-2 text-gray-400">{i + 1}</td>
                      <td className="py-2 pr-2">
                        <span className="font-semibold" style={{ color: NAVY }}>{f.regime}</span>
                        <br />
                        <span className="text-gray-500">{f.location || "—"}</span>
                        {f.defectId && <span className="mt-0.5 block font-bold text-red-600">{f.defectId}</span>}
                      </td>
                      <td className="max-w-80 py-2 pr-2">
                        <span className="font-semibold">{f.element}</span>
                        <br />{f.observation}
                        {f.rectification && <span className="mt-0.5 block text-gray-500">Rectify: {f.rectification}</span>}
                      </td>
                      <td className="max-w-44 py-2 pr-2 text-gray-600">{f.breach}</td>
                      <td className="py-2 pr-2">
                        <select
                          value={f.category}
                          onChange={e => updateFinding(i, { category: e.target.value as Category })}
                          className="rounded border px-1 py-0.5 text-[11px] font-bold"
                          style={{ color: colourHex(f.colour), borderColor: colourHex(f.colour) }}
                        >
                          {MATRIX.map(m => <option key={m.category} value={m.category}>{m.label}</option>)}
                        </select>
                      </td>
                      <td className="py-2 pr-2 font-semibold" style={{ color: colourHex(f.colour) }}>{f.action}</td>
                      <td className="py-2 text-right">
                        <button type="button" onClick={() => setFindings(l => l.filter((_, j) => j !== i))} className="text-gray-300 hover:text-red-500"><Trash2 size={13} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full px-4 py-2 text-xs text-white shadow-lg" style={{ background: NAVY }}>
          {toast}
        </div>
      )}
    </div>
  );
}
