/**
 * 369 Alliance System – Report Screen
 * Upload iAuditor/PDF/Word reports, extract defect data into Excel-style table
 */
import { useState } from "react";
import { type Project, type DefectItem, addReport } from "@/lib/data";
import { toast } from "sonner";

interface Props {
  onBack: () => void;
  projects: Project[];
  onRefresh: () => void;
}

const REGIMES = ["Waterproofing","Fire","Structure","Building Enclosure","Essential Services","VT","Other Issue/Non-Compliance"];

const DEV_STATUS_OPTIONS = [
  { value: "", label: "Select an option", color: "#fff" },
  { value: "Working in Progress", label: "Working in Progress", color: "#fee2e2" },
  { value: "Under Investigation", label: "Under Investigation", color: "#fef9c3" },
  { value: "Design Underway", label: "Design Underway", color: "#dbeafe" },
  { value: "Design Resolved/Rationalised/Works to be Completed", label: "Design Resolved/Rationalised/Works to be Completed", color: "#ede9fe" },
  { value: "Design Resolved/Submitted for Review", label: "Design Resolved/Submitted for Review", color: "#dcfce7" },
  { value: "Rectification Completed", label: "Rectification Completed", color: "#dcfce7" },
];

const OUR_STATUS_OPTIONS = [
  { value: "", label: "Select an option", color: "#fff" },
  { value: "Working in Progress", label: "Working in Progress", color: "#fee2e2" },
  { value: "Provide Evidence (photos/certificates)", label: "Provide Evidence (photos/certificates)", color: "#fef9c3" },
  { value: "Closed", label: "Closed", color: "#dcfce7" },
];

function getDevStatusColor(val: string) {
  return DEV_STATUS_OPTIONS.find(o => o.value === val)?.color || "#fff";
}
function getOurStatusColor(val: string) {
  return OUR_STATUS_OPTIONS.find(o => o.value === val)?.color || "#fff";
}

export default function ReportScreen({ onBack, projects, onRefresh }: Props) {
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [fileName, setFileName] = useState("");
  const [defects, setDefects] = useState<DefectItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const handleFileUpload = (file: File) => {
    setFileName(file.name);
    // Simulate extraction of defect data from report
    const sampleDefects: DefectItem[] = [
      { id: "1", regime: "Waterproofing", reportNumber: "WP-001", bwroNumber: "", location: "Level 2 – Bathroom Unit 201", observation: "Waterproofing membrane failure at shower base causing water ingress to the unit below.", photos: [], devComment: "", devStatus: "", devNotes: "", devDate: "", ourComment: "", ourStatus: "" },
      { id: "2", regime: "Fire", reportNumber: "FS-001", bwroNumber: "", location: "Level 5 – Fire Stairwell", observation: "Fire door not self-closing as required. Gap at bottom exceeds 3mm.", photos: [], devComment: "", devStatus: "", devNotes: "", devDate: "", ourComment: "", ourStatus: "" },
      { id: "3", regime: "Structure", reportNumber: "ST-001", bwroNumber: "", location: "Basement – Column B3", observation: "Concrete spalling observed on column B3 exposing reinforcement bars.", photos: [], devComment: "", devStatus: "", devNotes: "", devDate: "", ourComment: "", ourStatus: "" },
      { id: "4", regime: "Building Enclosure", reportNumber: "BE-001", bwroNumber: "", location: "Level 8 – Facade East", observation: "Cladding panel delamination observed on east facade panels.", photos: [], devComment: "", devStatus: "", devNotes: "", devDate: "", ourComment: "", ourStatus: "" },
      { id: "5", regime: "Essential Services", reportNumber: "ES-001", bwroNumber: "", location: "Roof – Mechanical Room", observation: "HVAC unit not operational. Damper actuator failure.", photos: [], devComment: "", devStatus: "", devNotes: "", devDate: "", ourComment: "", ourStatus: "" },
    ];
    setDefects(sampleDefects);
    toast.success(`Report "${file.name}" processed. ${sampleDefects.length} defects extracted.`);
  };

  const updateDefect = (id: string, key: keyof DefectItem, val: string) => {
    setDefects(ds => ds.map(d => d.id === id ? { ...d, [key]: val } : d));
  };

  const handleProceed = () => {
    if (!selectedProjectId) { toast.error("Please select a building address."); return; }
    if (defects.length === 0) { toast.error("Please upload a report first."); return; }
    addReport(selectedProjectId, { date: new Date().toLocaleDateString("en-AU"), fileName, type: "PDF", defects });
    onRefresh();
    toast.success("Report saved successfully.");
    onBack();
  };

  const handleDownloadExcel = () => {
    // Build CSV content
    const headers = ["Regime","Report No.","BWRO No.","Location","Observation","Dev Comment","Dev Notes","Dev Date","Dev Status","Our Comment","Our Status"];
    const rows = defects.map(d => [d.regime, d.reportNumber, d.bwroNumber, d.location, d.observation, d.devComment, d.devNotes, d.devDate, d.devStatus, d.ourComment, d.ourStatus]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "defect_register.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ minHeight:"100vh", background:"#f5f4f1", display:"flex", flexDirection:"column" }}>
      {/* Header */}
      <header style={{ background:"#1a1a2e", color:"#fff", height:56, display:"flex", alignItems:"center", padding:"0 20px", gap:16, flexShrink:0 }}>
        <button onClick={onBack} style={{ background:"none", border:"none", color:"#A68A64", fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:4 }}>
          ← Back to Dashboard
        </button>
        <div style={{ width:1, height:24, background:"#3a3a5e" }} />
        <span style={{ fontWeight:700, fontSize:16 }}>Report Management</span>
      </header>

      <div style={{ flex:1, padding:"24px 24px 0", maxWidth:1200, margin:"0 auto", width:"100%" }}>
        {/* Upload section */}
        <div style={{ background:"#fff", borderRadius:8, border:"1px solid #e5e7eb", padding:"20px", marginBottom:20, boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
          <h2 style={{ fontWeight:700, fontSize:16, color:"#1a1a2e", marginBottom:16 }}>Upload Report</h2>
          <div className="form-row" style={{ marginBottom:16 }}>
            <div style={{ flex:1 }}>
              <label style={{ fontSize:11, fontWeight:600, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.05em", display:"block", marginBottom:4 }}>Building Address</label>
              <select
                value={selectedProjectId}
                onChange={e => setSelectedProjectId(e.target.value)}
                style={{ width:"100%", border:"1px solid #d1d5db", borderRadius:6, padding:"8px 10px", fontSize:13, background:"#fff", color:"#1a1a2e", outline:"none" }}
              >
                <option value="">— Select building address —</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.address}, {p.suburb} {p.postcode} (#{p.projCode})</option>
                ))}
              </select>
            </div>
          </div>

          <div
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={e => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFileUpload(f); }}
            style={{ border:`2px dashed ${isDragging ? "#A68A64" : "#d1d5db"}`, borderRadius:8, padding:"40px 20px", textAlign:"center", background: isDragging ? "#fef8f0" : "#fafaf9", transition:"all 0.15s", cursor:"pointer" }}
            onClick={() => document.getElementById("report-file-input")?.click()}
          >
            <div style={{ fontSize:36, marginBottom:8 }}>☁️</div>
            <div style={{ fontWeight:600, fontSize:14, color:"#374151", marginBottom:4 }}>Drop your iAuditor report here</div>
            <div style={{ fontSize:12, color:"#9ca3af", marginBottom:12 }}>or click to browse files</div>
            <button style={{ background:"linear-gradient(135deg,#7A6342,#A68A64)", color:"#fff", border:"none", borderRadius:5, padding:"8px 20px", fontSize:13, fontWeight:600, cursor:"pointer" }}>
              📄 Upload PDF or Word Report
            </button>
            <input id="report-file-input" type="file" accept=".pdf,.doc,.docx" style={{ display:"none" }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }} />
          </div>
          {fileName && <div style={{ marginTop:8, fontSize:12, color:"#2d6a4f", fontWeight:600 }}>✓ Loaded: {fileName}</div>}
          <div style={{ fontSize:12, color:"#9ca3af", marginTop:6 }}>Upload your iAuditor report (PDF or Word format). The system will automatically extract ALL defect information from page 3.</div>
        </div>

        {/* Defect table */}
        {defects.length > 0 && (
          <div style={{ background:"#fff", borderRadius:8, border:"1px solid #e5e7eb", boxShadow:"0 1px 4px rgba(0,0,0,0.06)", marginBottom:20 }}>
            <div style={{ padding:"14px 20px", borderBottom:"1px solid #e5e7eb", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <h3 style={{ fontWeight:700, fontSize:14, color:"#1a1a2e" }}>Defect Register — {defects.length} items extracted</h3>
              <button onClick={handleDownloadExcel} style={{ background:"#166534", color:"#fff", border:"none", borderRadius:5, padding:"6px 14px", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                ⬇ Download Excel
              </button>
            </div>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                <thead>
                  <tr style={{ background:"#1a1a2e" }}>
                    <th style={{ color:"#fff", padding:"8px 10px", textAlign:"left", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em", whiteSpace:"nowrap", minWidth:130 }}>A – Regime</th>
                    <th style={{ color:"#fff", padding:"8px 10px", textAlign:"left", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em", whiteSpace:"nowrap", minWidth:90 }}>B – Report No.</th>
                    <th style={{ color:"#fff", padding:"8px 10px", textAlign:"left", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em", whiteSpace:"nowrap", minWidth:90 }}>C – BWRO No.</th>
                    <th style={{ color:"#fff", padding:"8px 10px", textAlign:"left", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em", whiteSpace:"nowrap", minWidth:180 }}>D – Location</th>
                    <th style={{ color:"#fff", padding:"8px 10px", textAlign:"left", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em", whiteSpace:"nowrap", minWidth:250 }}>E – Observation</th>
                    <th style={{ color:"#fff", padding:"8px 10px", textAlign:"left", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em", whiteSpace:"nowrap", minWidth:80 }}>F – Photos</th>
                    <th style={{ color:"#A68A64", padding:"8px 10px", textAlign:"left", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em", whiteSpace:"nowrap", minWidth:160, background:"#2a2a4e" }}>G – Dev Comment</th>
                    <th style={{ color:"#A68A64", padding:"8px 10px", textAlign:"left", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em", whiteSpace:"nowrap", minWidth:120, background:"#2a2a4e" }}>H – Dev Notes</th>
                    <th style={{ color:"#A68A64", padding:"8px 10px", textAlign:"left", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em", whiteSpace:"nowrap", minWidth:110, background:"#2a2a4e" }}>I – Dev Date</th>
                    <th style={{ color:"#A68A64", padding:"8px 10px", textAlign:"left", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em", whiteSpace:"nowrap", minWidth:200, background:"#2a2a4e" }}>J – Dev Status</th>
                    <th style={{ color:"#7dd3fc", padding:"8px 10px", textAlign:"left", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em", whiteSpace:"nowrap", minWidth:160, background:"#1e3a5f" }}>K – Our Comment</th>
                    <th style={{ color:"#7dd3fc", padding:"8px 10px", textAlign:"left", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em", whiteSpace:"nowrap", minWidth:200, background:"#1e3a5f" }}>L – Our Status</th>
                  </tr>
                </thead>
                <tbody>
                  {defects.map((d, i) => (
                    <tr key={d.id} style={{ background: i % 2 === 0 ? "#fff" : "#fafaf9" }}>
                      <td style={{ padding:"6px 8px" }}>
                        <select value={d.regime} onChange={e => updateDefect(d.id, "regime", e.target.value)} style={{ border:"1px solid #e5e7eb", borderRadius:3, padding:"3px 6px", fontSize:12, background:"#fff", width:"100%" }}>
                          {REGIMES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </td>
                      <td style={{ padding:"6px 8px" }}><code style={{ fontFamily:"IBM Plex Mono, monospace" }}>{d.reportNumber}</code></td>
                      <td style={{ padding:"6px 8px" }}>
                        <input value={d.bwroNumber} onChange={e => updateDefect(d.id, "bwroNumber", e.target.value)} style={{ border:"1px solid #e5e7eb", borderRadius:3, padding:"3px 6px", fontSize:12, width:80 }} placeholder="—" />
                      </td>
                      <td style={{ padding:"6px 8px", maxWidth:180 }}>
                        <input value={d.location} onChange={e => updateDefect(d.id, "location", e.target.value)} style={{ border:"1px solid #e5e7eb", borderRadius:3, padding:"3px 6px", fontSize:12, width:"100%" }} />
                      </td>
                      <td style={{ padding:"6px 8px", maxWidth:250 }}>
                        <textarea value={d.observation} onChange={e => updateDefect(d.id, "observation", e.target.value)} style={{ border:"1px solid #e5e7eb", borderRadius:3, padding:"3px 6px", fontSize:12, width:"100%", minHeight:50, resize:"vertical" }} />
                      </td>
                      <td style={{ padding:"6px 8px", textAlign:"center", color:"#9ca3af", fontSize:11 }}>—</td>
                      {/* Developer columns (G-J) */}
                      <td style={{ padding:"6px 8px", background:"#fffbf5" }}>
                        <textarea value={d.devComment} onChange={e => updateDefect(d.id, "devComment", e.target.value)} style={{ border:"1px solid #e5e7eb", borderRadius:3, padding:"3px 6px", fontSize:12, width:"100%", minHeight:40, resize:"vertical", background:"#fffbf5" }} />
                      </td>
                      <td style={{ padding:"6px 8px", background:"#fffbf5" }}>
                        <input value={d.devNotes} onChange={e => updateDefect(d.id, "devNotes", e.target.value)} style={{ border:"1px solid #e5e7eb", borderRadius:3, padding:"3px 6px", fontSize:12, width:"100%", background:"#fffbf5" }} />
                      </td>
                      <td style={{ padding:"6px 8px", background:"#fffbf5" }}>
                        <input type="date" value={d.devDate} onChange={e => updateDefect(d.id, "devDate", e.target.value)} style={{ border:"1px solid #e5e7eb", borderRadius:3, padding:"3px 6px", fontSize:12, background:"#fffbf5" }} />
                      </td>
                      <td style={{ padding:"6px 8px", background: getDevStatusColor(d.devStatus) }}>
                        <select value={d.devStatus} onChange={e => updateDefect(d.id, "devStatus", e.target.value)} style={{ border:"1px solid #e5e7eb", borderRadius:3, padding:"3px 6px", fontSize:11, background:"transparent", width:"100%" }}>
                          {DEV_STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </td>
                      {/* Our columns (K-L) */}
                      <td style={{ padding:"6px 8px", background:"#f0f7ff" }}>
                        <textarea value={d.ourComment} onChange={e => updateDefect(d.id, "ourComment", e.target.value)} style={{ border:"1px solid #e5e7eb", borderRadius:3, padding:"3px 6px", fontSize:12, width:"100%", minHeight:40, resize:"vertical", background:"#f0f7ff" }} />
                      </td>
                      <td style={{ padding:"6px 8px", background: getOurStatusColor(d.ourStatus) }}>
                        <select value={d.ourStatus} onChange={e => updateDefect(d.id, "ourStatus", e.target.value)} style={{ border:"1px solid #e5e7eb", borderRadius:3, padding:"3px 6px", fontSize:11, background:"transparent", width:"100%" }}>
                          {OUR_STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Proceed/Cancel */}
        <div style={{ display:"flex", justifyContent:"flex-end", gap:12, paddingBottom:24 }}>
          <button onClick={onBack} style={{ background:"#f3f4f6", color:"#374151", border:"1px solid #d1d5db", borderRadius:5, padding:"9px 24px", fontSize:13, fontWeight:600, cursor:"pointer" }}>Cancel</button>
          <button onClick={handleProceed} style={{ background:"linear-gradient(135deg,#7A6342,#A68A64)", color:"#fff", border:"none", borderRadius:5, padding:"9px 28px", fontSize:13, fontWeight:700, cursor:"pointer" }}>Proceed</button>
        </div>
      </div>
    </div>
  );
}
