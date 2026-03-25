/**
 * 369 Alliance System – History Screen (Popup Modal)
 * Two-panel layout:
 *   LEFT  – site search filter (by Address, Developer, Builder, PCA, DBP, BP,
 *            Strata, Building Manager, Owners) + clickable results list
 *   RIGHT – full action log for the selected project
 * Opens as a popup overlay – does NOT block navigation
 */
import { useState, useMemo } from "react";
import { type Project, type ClientRole } from "@/lib/data";

interface Props {
  onBack: () => void;
  projects: Project[];
}

type FilterField = "address" | "developer" | "builder" | "pca" | "dbp" | "bp" | "strata" | "buildingManager" | "owners";

const FILTER_FIELDS: { key: FilterField; label: string }[] = [
  { key: "address",        label: "Address" },
  { key: "developer",      label: "Developer" },
  { key: "builder",        label: "Builder" },
  { key: "pca",            label: "PCA (Certifier)" },
  { key: "dbp",            label: "DBP (Design Building Practitioner)" },
  { key: "bp",             label: "BP (Building Practitioner)" },
  { key: "strata",         label: "Strata" },
  { key: "buildingManager",label: "Building Manager" },
  { key: "owners",         label: "Owners" },
];

const ACTION_COLORS: Record<string, { bg: string; text: string }> = {
  "Project Created":      { bg:"#dcfce7", text:"#166534" },
  "Form Received":        { bg:"#dbeafe", text:"#1e40af" },
  "Project Modified":     { bg:"#fef9c3", text:"#92400e" },
  "Stage Updated":        { bg:"#fef9c3", text:"#92400e" },
  "Converted to Client":  { bg:"#fce7f3", text:"#9d174d" },
  "Report Uploaded":      { bg:"#ede9fe", text:"#5b21b6" },
  "Order Generated":      { bg:"#fee2e2", text:"#991b1b" },
  "Order Uploaded":       { bg:"#fee2e2", text:"#991b1b" },
  "Booking Created":      { bg:"#d1fae5", text:"#065f46" },
  "Project Closed":       { bg:"#f3f4f6", text:"#374151" },
};

function getActionStyle(op: string) {
  return ACTION_COLORS[op] || { bg:"#f3f4f6", text:"#374151" };
}

function matchesField(p: Project, field: FilterField, query: string): boolean {
  const q = query.toLowerCase().trim();
  if (!q) return true;
  switch (field) {
    case "address":
      return `${p.address} ${p.suburb} ${p.postcode}`.toLowerCase().includes(q);
    case "developer":
      return p.developer.toLowerCase().includes(q);
    case "builder":
      return p.builder.toLowerCase().includes(q);
    case "pca":
      return (p.certifierName + " " + p.certifierCompany).toLowerCase().includes(q);
    case "dbp":
      return p.dbpPractitioners.some(d => d.name.toLowerCase().includes(q) || d.company.toLowerCase().includes(q));
    case "bp":
      return p.buildingPractitionerName.toLowerCase().includes(q);
    case "strata":
      return p.role === "Strata" && (p.address.toLowerCase().includes(q) || p.developer.toLowerCase().includes(q));
    case "buildingManager":
      return p.role === "Building Manager" && (p.address.toLowerCase().includes(q) || p.developer.toLowerCase().includes(q));
    case "owners":
      return p.role === "Owners" && (p.address.toLowerCase().includes(q) || p.developer.toLowerCase().includes(q));
    default:
      return false;
  }
}

export default function HistoryScreen({ onBack, projects }: Props) {
  const [filterField, setFilterField] = useState<FilterField>("address");
  const [filterQuery, setFilterQuery] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [filterAction, setFilterAction] = useState("");

  // Filtered project list (left panel)
  const filteredProjects = useMemo(() => {
    if (!filterQuery.trim()) return projects;
    return projects.filter(p => matchesField(p, filterField, filterQuery));
  }, [projects, filterField, filterQuery]);

  const selectedProject = useMemo(
    () => projects.find(p => p.id === selectedProjectId) || null,
    [projects, selectedProjectId]
  );

  // History entries for selected project (right panel)
  const historyEntries = useMemo(() => {
    if (!selectedProject) return [];
    const entries = selectedProject.history;
    if (!filterAction) return [...entries].sort((a, b) => b.date.localeCompare(a.date));
    return [...entries].filter(h => h.operation === filterAction).sort((a, b) => b.date.localeCompare(a.date));
  }, [selectedProject, filterAction]);

  const uniqueActions = useMemo(() => {
    if (!selectedProject) return [];
    const set = new Set(selectedProject.history.map(h => h.operation));
    return Array.from(set);
  }, [selectedProject]);

  const getTabBadge = (tab: string) => {
    const colors: Record<string, string> = {
      "Proactive Insp": "#1e3a5f",
      "From FORM": "#c0392b",
      "CLIENT": "#2d6a4f",
    };
    return (
      <span style={{
        background: colors[tab] || "#374151",
        color: "#fff", padding: "1px 6px", borderRadius: 3,
        fontSize: 10, fontWeight: 700, whiteSpace: "nowrap"
      }}>{tab}</span>
    );
  };

  return (
    <div
      className="modal-overlay"
      onClick={e => { if (e.target === e.currentTarget) onBack(); }}
    >
      <div style={{
        background: "#fff", borderRadius: 10,
        width: "min(1100px, 97vw)", height: "min(82vh, 700px)",
        display: "flex", flexDirection: "column",
        boxShadow: "0 24px 64px rgba(0,0,0,0.28)", overflow: "hidden"
      }}>
        {/* ── Header ── */}
        <div style={{ background:"#1a1a2e", color:"#fff", padding:"13px 20px", display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
          <div style={{ width:28, height:28, background:"linear-gradient(135deg,#7A6342,#A68A64)", borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:11, color:"#fff" }}>369</div>
          <span style={{ fontWeight:700, fontSize:15, letterSpacing:"0.02em" }}>System History</span>
          <div style={{ flex:1 }} />
          <span style={{ fontSize:11, color:"rgba(255,255,255,0.45)" }}>Click outside to close</span>
          <button onClick={onBack} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.7)", fontSize:22, cursor:"pointer", lineHeight:1, marginLeft:8 }}>×</button>
        </div>

        {/* ── Body: two panels ── */}
        <div style={{ flex:1, display:"flex", overflow:"hidden" }}>

          {/* LEFT PANEL – site filter + results */}
          <div style={{ width:320, flexShrink:0, borderRight:"1px solid #e5e7eb", display:"flex", flexDirection:"column", background:"#f9f8f6" }}>
            {/* Filter controls */}
            <div style={{ padding:"12px 14px", borderBottom:"1px solid #e5e7eb", flexShrink:0 }}>
              <div style={{ marginBottom:8 }}>
                <label style={{ fontSize:10, fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.05em", display:"block", marginBottom:4 }}>
                  Filter by Site
                </label>
                <select
                  value={filterField}
                  onChange={e => { setFilterField(e.target.value as FilterField); setFilterQuery(""); setSelectedProjectId(null); }}
                  style={{ width:"100%", border:"1px solid #d1d5db", borderRadius:4, padding:"6px 8px", fontSize:12, background:"#fff", color:"#1a1a2e", outline:"none" }}
                >
                  {FILTER_FIELDS.map(f => (
                    <option key={f.key} value={f.key}>{f.label}</option>
                  ))}
                </select>
              </div>
              <input
                type="text"
                placeholder={`Search by ${FILTER_FIELDS.find(f => f.key === filterField)?.label || ""}…`}
                value={filterQuery}
                onChange={e => { setFilterQuery(e.target.value); setSelectedProjectId(null); }}
                style={{ width:"100%", border:"1px solid #d1d5db", borderRadius:4, padding:"6px 8px", fontSize:12, outline:"none", fontFamily:"IBM Plex Sans, sans-serif", boxSizing:"border-box" }}
              />
              <div style={{ marginTop:6, fontSize:11, color:"#9ca3af" }}>
                {filteredProjects.length} site{filteredProjects.length !== 1 ? "s" : ""} found
              </div>
            </div>

            {/* Results list */}
            <div style={{ flex:1, overflowY:"auto" }}>
              {filteredProjects.length === 0 ? (
                <div style={{ padding:"24px 14px", textAlign:"center", color:"#9ca3af", fontSize:13 }}>
                  No sites match your search.
                </div>
              ) : filteredProjects.map(p => {
                const isSelected = selectedProjectId === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => { setSelectedProjectId(p.id); setFilterAction(""); }}
                    style={{
                      padding:"10px 14px",
                      cursor:"pointer",
                      borderBottom:"1px solid #ede9e3",
                      background: isSelected ? "#1a1a2e" : "transparent",
                      transition:"background 0.12s",
                    }}
                  >
                    <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3 }}>
                      <code style={{ fontFamily:"IBM Plex Mono, monospace", fontWeight:700, fontSize:11, color: isSelected ? "#A68A64" : "#7A6342" }}>{p.projCode}</code>
                      {getTabBadge(p.tab)}
                    </div>
                    <div style={{ fontSize:12, fontWeight:600, color: isSelected ? "#fff" : "#1a1a2e", lineHeight:1.3 }}>
                      {p.address}{p.suburb ? `, ${p.suburb}` : ""}
                    </div>
                    {p.developer && (
                      <div style={{ fontSize:11, color: isSelected ? "#c5b49a" : "#6b7280", marginTop:2 }}>
                        Dev: {p.developer}
                      </div>
                    )}
                    <div style={{ fontSize:10, color: isSelected ? "#c5b49a" : "#9ca3af", marginTop:2 }}>
                      {p.history.length} action{p.history.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT PANEL – action log */}
          <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
            {!selectedProject ? (
              <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", color:"#9ca3af", gap:10 }}>
                <div style={{ fontSize:36 }}>📋</div>
                <div style={{ fontSize:14, fontWeight:600 }}>Select a site to view its history</div>
                <div style={{ fontSize:12 }}>Use the filter on the left to find a site, then click it.</div>
              </div>
            ) : (
              <>
                {/* Site header */}
                <div style={{ padding:"12px 18px", borderBottom:"1px solid #e5e7eb", background:"#fff", flexShrink:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                    <code style={{ fontFamily:"IBM Plex Mono, monospace", fontWeight:800, fontSize:13, color:"#7A6342" }}>{selectedProject.projCode}</code>
                    {getTabBadge(selectedProject.tab)}
                    {selectedProject.role && (
                      <span style={{ background:"#f3f4f6", color:"#374151", padding:"1px 6px", borderRadius:3, fontSize:10, fontWeight:600 }}>{selectedProject.role}</span>
                    )}
                  </div>
                  <div style={{ fontSize:14, fontWeight:700, color:"#1a1a2e" }}>
                    {selectedProject.address}{selectedProject.suburb ? `, ${selectedProject.suburb}` : ""} {selectedProject.postcode}
                  </div>
                  {selectedProject.developer && (
                    <div style={{ fontSize:12, color:"#6b7280", marginTop:2 }}>Developer: {selectedProject.developer}</div>
                  )}
                  {selectedProject.builder && (
                    <div style={{ fontSize:12, color:"#6b7280" }}>Builder: {selectedProject.builder}</div>
                  )}
                </div>

                {/* Action filter bar */}
                <div style={{ padding:"8px 18px", borderBottom:"1px solid #e5e7eb", background:"#f9f8f6", display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
                  <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
                    <label style={{ fontSize:10, fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.05em" }}>Filter by Action</label>
                    <select
                      value={filterAction}
                      onChange={e => setFilterAction(e.target.value)}
                      style={{ border:"1px solid #d1d5db", borderRadius:4, padding:"4px 8px", fontSize:12, background:"#fff", color:"#1a1a2e", outline:"none", minWidth:180 }}
                    >
                      <option value="">All Actions</option>
                      {uniqueActions.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                  <div style={{ marginLeft:"auto", fontSize:12, color:"#6b7280" }}>
                    {historyEntries.length} record{historyEntries.length !== 1 ? "s" : ""}
                  </div>
                </div>

                {/* History table */}
                <div style={{ flex:1, overflowY:"auto" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                    <thead style={{ position:"sticky", top:0, zIndex:2 }}>
                      <tr style={{ background:"#1a1a2e" }}>
                        <th style={{ color:"#fff", padding:"8px 12px", textAlign:"left", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em", whiteSpace:"nowrap", minWidth:130 }}>Date &amp; Time</th>
                        <th style={{ color:"#fff", padding:"8px 12px", textAlign:"left", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em", whiteSpace:"nowrap", minWidth:160 }}>Action</th>
                        <th style={{ color:"#fff", padding:"8px 12px", textAlign:"left", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em", minWidth:300 }}>Description</th>
                        <th style={{ color:"#fff", padding:"8px 12px", textAlign:"left", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em", whiteSpace:"nowrap", minWidth:130 }}>User</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyEntries.length === 0 ? (
                        <tr>
                          <td colSpan={4} style={{ textAlign:"center", padding:"40px 0", color:"#9ca3af", fontSize:14 }}>
                            No history records found.
                          </td>
                        </tr>
                      ) : historyEntries.map((h, i) => {
                        const style = getActionStyle(h.operation);
                        return (
                          <tr key={h.id} style={{ background: i % 2 === 0 ? "#fff" : "#fafaf9", borderBottom:"1px solid #f0ede8" }}>
                            <td style={{ padding:"9px 12px", fontFamily:"IBM Plex Mono, monospace", fontSize:11, color:"#6b7280", whiteSpace:"nowrap" }}>{h.date}</td>
                            <td style={{ padding:"9px 12px" }}>
                              <span style={{ background:style.bg, color:style.text, padding:"2px 8px", borderRadius:4, fontSize:11, fontWeight:600, whiteSpace:"nowrap" }}>
                                {h.operation}
                              </span>
                            </td>
                            <td style={{ padding:"9px 12px", color:"#374151", fontSize:12, lineHeight:1.4 }}>{h.details}</td>
                            <td style={{ padding:"9px 12px", color:"#374151", fontWeight:500, fontSize:12, whiteSpace:"nowrap" }}>{h.person}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{ padding:"10px 20px", borderTop:"1px solid #e5e7eb", background:"#f9f8f6", display:"flex", justifyContent:"flex-end", flexShrink:0 }}>
          <button onClick={onBack} style={{ background:"#1a1a2e", color:"#fff", border:"none", borderRadius:5, padding:"7px 22px", fontSize:12, fontWeight:600, cursor:"pointer" }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
