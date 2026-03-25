/**
 * 369 Alliance System – Tools Screen
 * Design: Authoritative Dark Navy with Bronze Accents
 * Features: Overview (Gantt Timeline), Manage Access
 */
import { useState, useMemo } from "react";
import { type Project } from "@/lib/data";

interface Props {
  onBack: () => void;
  projects: Project[];
}

type ToolView = "menu" | "overview" | "manage-access";

// Generate 6 months from current month
function getMonths(): { label: string; year: number; month: number }[] {
  const now = new Date();
  const months = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    months.push({
      label: d.toLocaleString("en-AU", { month: "long", year: "numeric" }),
      year: d.getFullYear(),
      month: d.getMonth()
    });
  }
  return months;
}

const INSPECTION_GROUPS = ["AA inspections","CAS inspections","OC inspections","Project Intervene","Blitz"];
const OUTCOME_COLORS: Record<string, string> = {
  "WIP": "#3b82f6",
  "BWRO Draft": "#f59e0b",
  "BWRO Final": "#d97706",
  "SWO": "#ef4444",
  "RO Draft": "#8b5cf6",
  "RO Final": "#7c3aed",
  "Closed": "#22c55e",
};

const FILTER_FIELDS = ["Inspection","Inspector","Stage","Risk category","Selected by","Order type","Developer","Builder","PCA","Building Practitioner","Design Practitioner","Project Outcome"];

export default function ToolsScreen({ onBack, projects }: Props) {
  const [view, setView] = useState<ToolView>("menu");

  if (view === "overview") return <OverviewTimeline projects={projects} onBack={() => setView("menu")} />;
  if (view === "manage-access") return <ManageAccess onBack={() => setView("menu")} />;

  return (
    <div style={{ minHeight:"100vh", background:"#f5f4f1", display:"flex", flexDirection:"column" }}>
      <header style={{ background:"#1a1a2e", color:"#fff", height:56, display:"flex", alignItems:"center", padding:"0 20px", gap:16, flexShrink:0 }}>
        <button onClick={onBack} style={{ background:"none", border:"none", color:"#A68A64", fontSize:13, cursor:"pointer" }}>← Back to Dashboard</button>
        <div style={{ width:1, height:24, background:"#3a3a5e" }} />
        <span style={{ fontWeight:700, fontSize:16 }}>Tools</span>
      </header>

      <div style={{ flex:1, padding:"40px 24px", maxWidth:900, margin:"0 auto", width:"100%" }}>
        <h2 style={{ fontWeight:700, fontSize:22, color:"#1a1a2e", marginBottom:8 }}>Tools & Utilities</h2>
        <p style={{ fontSize:14, color:"#6b7280", marginBottom:32 }}>Select a tool to get started.</p>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(240px, 1fr))", gap:20 }}>
          {[
            {
              key: "overview",
              icon: "📊",
              title: "Overview Timeline",
              desc: "6-month project timeline management with Gantt-style calendar view, filters, and project detail panel.",
              color: "#1e3a5f"
            },
            {
              key: "manage-access",
              icon: "🔐",
              title: "Manage Access",
              desc: "Control user roles and permissions for all system stakeholders.",
              color: "#5b21b6"
            },
          ].map(tool => (
            <div
              key={tool.key}
              onClick={() => setView(tool.key as ToolView)}
              style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:10, padding:"24px 20px", cursor:"pointer", transition:"all 0.15s", display:"flex", flexDirection:"column", gap:12 }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(26,26,46,0.12)"; (e.currentTarget as HTMLElement).style.borderColor = "#A68A64"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = ""; (e.currentTarget as HTMLElement).style.borderColor = "#e5e7eb"; }}
            >
              <div style={{ width:48, height:48, background:tool.color, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>{tool.icon}</div>
              <div style={{ fontWeight:700, fontSize:15, color:"#1a1a2e" }}>{tool.title}</div>
              <div style={{ fontSize:13, color:"#6b7280", lineHeight:1.5 }}>{tool.desc}</div>
              <div style={{ fontSize:12, color:"#A68A64", fontWeight:600, marginTop:"auto" }}>Open →</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Overview Timeline ─────────────────────────────────────────────────────────
function OverviewTimeline({ projects, onBack }: { projects: Project[]; onBack: () => void }) {
  const months = useMemo(() => getMonths(), []);
  const [selectedGroup, setSelectedGroup] = useState("AA inspections");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<"description"|"graphic">("description");

  const setFilter = (key: string, val: string) => setFilters(f => ({ ...f, [key]: val }));

  // Stats
  const stats = useMemo(() => ({
    total: projects.length,
    serious: projects.filter(p => p.riskCategory === "High").length,
    potential: projects.filter(p => p.riskCategory === "Medium").length,
    closed: projects.filter(p => p.projectOutcome === "Closed").length,
    escalate: projects.filter(p => p.projectOutcome === "SWO").length,
    future: projects.filter(p => p.stage === "Site Preparation" || p.stage === "Excavation").length,
  }), [projects]);

  return (
    <div style={{ minHeight:"100vh", background:"#f5f4f1", display:"flex", flexDirection:"column" }}>
      {/* Header */}
      <header style={{ background:"#1a1a2e", color:"#fff", padding:"0 20px", flexShrink:0 }}>
        <div style={{ height:56, display:"flex", alignItems:"center", gap:16 }}>
          <button onClick={onBack} style={{ background:"none", border:"none", color:"#A68A64", fontSize:13, cursor:"pointer" }}>← Back to Tools</button>
          <div style={{ width:1, height:24, background:"#3a3a5e" }} />
          <div>
            <div style={{ fontWeight:700, fontSize:16 }}>Overview Timeline Section</div>
            <div style={{ fontSize:11, color:"#A68A64" }}>6-Month Project Timeline Management</div>
          </div>
          <div style={{ flex:1 }} />
          <button onClick={onBack} style={{ background:"linear-gradient(135deg,#7A6342,#A68A64)", color:"#fff", border:"none", borderRadius:5, padding:"6px 16px", fontSize:12, fontWeight:600, cursor:"pointer" }}>
            ← Back to Data
          </button>
        </div>
      </header>

      {/* Stats bar */}
      <div style={{ background:"#252545", padding:"8px 20px", display:"flex", alignItems:"center", gap:8, flexShrink:0, flexWrap:"wrap" }}>
        <div style={{ flex:1 }} />
        {[
          { label:"Total", value: stats.total, bg:"#1e3a5f" },
          { label:"Serious", value: stats.serious, bg:"#991b1b" },
          { label:"Potential", value: stats.potential, bg:"#d97706" },
          { label:"Closed", value: stats.closed, bg:"#166534" },
          { label:"Escalate", value: stats.escalate, bg:"#5b21b6" },
          { label:"Future", value: stats.future, bg:"#374151" },
        ].map(s => (
          <div key={s.label} style={{ background:s.bg, borderRadius:5, padding:"4px 12px", textAlign:"center", minWidth:60 }}>
            <div style={{ fontSize:16, fontWeight:700, color:"#fff" }}>{s.value}</div>
            <div style={{ fontSize:10, fontWeight:600, color:"rgba(255,255,255,0.75)", textTransform:"uppercase", letterSpacing:"0.06em" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{ background:"#fff", borderBottom:"1px solid #e5e7eb", padding:"8px 20px", display:"flex", gap:8, flexWrap:"wrap", flexShrink:0 }}>
        {FILTER_FIELDS.map(f => (
          <select
            key={f}
            value={filters[f] || ""}
            onChange={e => setFilter(f, e.target.value)}
            style={{ border:"1px solid #d1d5db", borderRadius:4, padding:"4px 8px", fontSize:11, color:"#374151", background:"#fff", cursor:"pointer" }}
          >
            <option value="">{f}: All</option>
          </select>
        ))}
      </div>

      {/* Main content */}
      <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
        {/* Left: Project address list */}
        <div style={{ width:200, flexShrink:0, background:"#fff", borderRight:"1px solid #e5e7eb", display:"flex", flexDirection:"column", overflowY:"auto" }}>
          <div style={{ padding:"10px 12px", borderBottom:"1px solid #e5e7eb" }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
              <span style={{ fontSize:11, fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.05em" }}>Project Address</span>
              <span style={{ fontSize:14, cursor:"pointer" }}>🔍</span>
            </div>
          </div>
          {INSPECTION_GROUPS.map(g => (
            <div
              key={g}
              onClick={() => setSelectedGroup(g)}
              style={{ padding:"8px 12px", fontSize:12, cursor:"pointer", background: selectedGroup === g ? "#fef3e2" : "transparent", color: selectedGroup === g ? "#7A6342" : "#374151", fontWeight: selectedGroup === g ? 600 : 400, borderLeft: selectedGroup === g ? "3px solid #A68A64" : "3px solid transparent" }}
            >
              {g}
            </div>
          ))}
          <div style={{ borderTop:"1px solid #e5e7eb", marginTop:8, padding:"8px 12px" }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:6 }}>Orders</div>
            <div style={{ fontSize:12, color:"#374151", cursor:"pointer", padding:"4px 0" }}>Active Orders</div>
          </div>
        </div>

        {/* Right: Gantt + Detail */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
          {/* Gantt grid */}
          <div style={{ flex:1, overflowX:"auto", overflowY:"auto" }}>
            <div style={{ minWidth:900 }}>
              {/* Month headers */}
              <div style={{ display:"grid", gridTemplateColumns:`200px repeat(${months.length}, 1fr) 120px`, gap:4, padding:"8px 12px", background:"#f5f4f1", position:"sticky", top:0, zIndex:5 }}>
                <div />
                {months.map((m, i) => (
                  <div key={m.label} style={{ background: i === 0 ? "linear-gradient(135deg,#7A6342,#A68A64)" : "#1a1a2e", color:"#fff", fontWeight:700, fontSize:12, padding:"8px 10px", borderRadius:6, textAlign:"center" }}>
                    {m.label}
                  </div>
                ))}
                <div style={{ background:"#374151", color:"#fff", fontWeight:700, fontSize:12, padding:"8px 10px", borderRadius:6, textAlign:"center" }}>
                  Up to 12 months
                </div>
              </div>

              {/* Project rows */}
              {projects.map(p => (
                <div
                  key={p.id}
                  onClick={() => setSelectedProject(selectedProject?.id === p.id ? null : p)}
                  style={{ display:"grid", gridTemplateColumns:`200px repeat(${months.length}, 1fr) 120px`, gap:4, padding:"2px 12px", cursor:"pointer", background: selectedProject?.id === p.id ? "#fef3e2" : "transparent" }}
                >
                  <div style={{ fontSize:11, display:"flex", alignItems:"center", gap:4, padding:"4px 0" }}>
                    <code style={{ fontFamily:"IBM Plex Mono, monospace", fontSize:10, color:"#6b7280", minWidth:22 }}>{p.projCode}</code>
                    <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", color:"#1a1a2e" }}>{p.address}</span>
                  </div>
                  {months.map((m, i) => {
                    // Show bar in first month for demo
                    const hasActivity = i === 0 || (i === 1 && p.riskCategory === "High");
                    return (
                      <div key={m.label} style={{ minHeight:24, display:"flex", alignItems:"center" }}>
                        {hasActivity && (
                          <div style={{ height:16, borderRadius:3, background: OUTCOME_COLORS[p.projectOutcome] || "#6b7280", width:"80%", fontSize:10, color:"#fff", display:"flex", alignItems:"center", paddingLeft:4, overflow:"hidden", whiteSpace:"nowrap" }}>
                            {p.projectOutcome}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <div />
                </div>
              ))}
            </div>
          </div>

          {/* Detail panel */}
          {selectedProject && (
            <div style={{ borderTop:"2px solid #e5e7eb", background:"#fff", flexShrink:0, maxHeight:280, overflowY:"auto" }}>
              {/* Tabs */}
              <div style={{ display:"flex", gap:0, borderBottom:"1px solid #e5e7eb", padding:"0 16px" }}>
                {(["description","graphic"] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setActiveTab(t)}
                    style={{ padding:"8px 16px", border:"none", background:"none", fontSize:12, fontWeight:600, cursor:"pointer", color: activeTab === t ? "#1a1a2e" : "#6b7280", borderBottom: activeTab === t ? "2px solid #A68A64" : "2px solid transparent", textTransform:"capitalize" }}
                  >
                    {t === "description" ? "Description" : "Graphic"}
                  </button>
                ))}
                <div style={{ flex:1 }} />
                <span style={{ fontSize:12, color:"#6b7280", alignSelf:"center", fontWeight:600 }}>Building address and name: {selectedProject.address}, {selectedProject.suburb}</span>
                <div style={{ flex:1 }} />
                <button onClick={() => setActiveTab("graphic")} style={{ background:"#1a1a2e", color:"#fff", border:"none", borderRadius:4, padding:"4px 10px", fontSize:11, cursor:"pointer", alignSelf:"center", marginLeft:8 }}>Graphic</button>
              </div>

              {activeTab === "description" ? (
                <div style={{ display:"flex", gap:0 }}>
                  {/* Left detail fields */}
                  <div style={{ flex:1, padding:"12px 16px", fontSize:12 }}>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"4px 16px" }}>
                      {[
                        ["Site", selectedProject.address],
                        ["Developer", selectedProject.developer],
                        ["Builder", selectedProject.builder],
                        ["PCA", selectedProject.certifierName],
                        ["Selection reason", selectedProject.firstInspectionType],
                        ["Audit type", selectedProject.sequentialInspection],
                        ["D&BP register", selectedProject.dbpPractitioners.map(d => d.name).join(", ")],
                        ["DA", selectedProject.daNumber],
                        ["CC", selectedProject.ccNumber],
                        ["NCC version", ""],
                        ["Portal completion date", ""],
                        ["Extended", ""],
                      ].map(([label, value]) => (
                        <div key={label as string} style={{ display:"flex", gap:6, alignItems:"baseline" }}>
                          <span style={{ fontWeight:600, color:"#6b7280", minWidth:120, fontSize:11 }}>{label}:</span>
                          <span style={{ color:"#1a1a2e" }}>{value || "—"}</span>
                        </div>
                      ))}
                    </div>
                    {/* Inspection/Report dates */}
                    <div style={{ marginTop:8, display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:4 }}>
                      {[
                        { label:"Inspection date", color:"#dcfce7" },
                        { label:"Leader", color:"#dcfce7" },
                        { label:"Team", color:"#dcfce7" },
                        { label:"", color:"transparent" },
                        { label:"Report date", color:"#fee2e2" },
                        { label:"Delivery date", color:"#fee2e2" },
                        { label:"Report meeting", color:"#fee2e2" },
                        { label:"Rect. Agreement date", color:"#fee2e2" },
                      ].map((f, i) => (
                        <div key={i} style={{ background:f.color, borderRadius:3, padding:"3px 6px", fontSize:11, fontWeight:600, color:"#374151" }}>{f.label}</div>
                      ))}
                    </div>
                    <div style={{ marginTop:8 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                        <span style={{ fontSize:11, fontWeight:600, color:"#6b7280" }}>Main concerns:</span>
                        <div style={{ flex:1, height:12, background:"linear-gradient(90deg, #ef4444 60%, #f59e0b 80%, #22c55e 100%)", borderRadius:3 }} />
                      </div>
                      <div style={{ border:"1px solid #e5e7eb", borderRadius:4, padding:"8px 10px", fontSize:11, color:"#374151", lineHeight:1.6 }}>
                        <div style={{ fontWeight:600, marginBottom:4 }}>Scope of works summary:</div>
                        {selectedProject.developDescription || "No description available."}
                        {selectedProject.history.slice(-3).map(h => (
                          <div key={h.id} style={{ color:"#6b7280" }}>{h.date} – {h.operation}: {h.details}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                  {/* Right: site photo */}
                  <div style={{ width:200, flexShrink:0, padding:"12px 16px" }}>
                    <div style={{ width:"100%", height:160, background:"#f0ede8", borderRadius:6, overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", border:"1px solid #e5e7eb" }}>
                      {selectedProject.photoUrl ? (
                        <img src={selectedProject.photoUrl} alt="Site" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                      ) : (
                        <div style={{ textAlign:"center", color:"#9ca3af" }}>
                          <div style={{ fontSize:32 }}>🏗️</div>
                          <div style={{ fontSize:11 }}>No photo</div>
                        </div>
                      )}
                    </div>
                    <div style={{ marginTop:8, fontSize:11, color:"#6b7280", textAlign:"center" }}>
                      {selectedProject.address}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ padding:"20px 16px", textAlign:"center", color:"#9ca3af" }}>
                  <div style={{ fontSize:32, marginBottom:8 }}>📊</div>
                  <div style={{ fontSize:13 }}>Graphic view — charts and visualisations for {selectedProject.address}</div>
                  <div style={{ fontSize:12, marginTop:4 }}>Risk: {selectedProject.riskCategory} · Outcome: {selectedProject.projectOutcome} · Stage: {selectedProject.stage}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Manage Access ─────────────────────────────────────────────────────────────
function ManageAccess({ onBack }: { onBack: () => void }) {
  const [users] = useState([
    { id:1, name:"Raquel Diaz", email:"raquel@369alliance.com.au", role:"Admin", status:"Active" },
    { id:2, name:"Simone Baeta Lentini", email:"simone@369alliance.com.au", role:"Inspector", status:"Active" },
    { id:3, name:"John Smith", email:"john@certifier.com.au", role:"Certifier", status:"Active" },
  ]);

  return (
    <div style={{ minHeight:"100vh", background:"#f5f4f1", display:"flex", flexDirection:"column" }}>
      <header style={{ background:"#1a1a2e", color:"#fff", height:56, display:"flex", alignItems:"center", padding:"0 20px", gap:16, flexShrink:0 }}>
        <button onClick={onBack} style={{ background:"none", border:"none", color:"#A68A64", fontSize:13, cursor:"pointer" }}>← Back to Tools</button>
        <div style={{ width:1, height:24, background:"#3a3a5e" }} />
        <span style={{ fontWeight:700, fontSize:16 }}>Manage Access</span>
      </header>

      <div style={{ flex:1, padding:"24px", maxWidth:1000, margin:"0 auto", width:"100%" }}>
        <div style={{ background:"#fff", borderRadius:8, border:"1px solid #e5e7eb", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
          <div style={{ padding:"16px 20px", borderBottom:"1px solid #e5e7eb", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <h2 style={{ fontWeight:700, fontSize:15, color:"#1a1a2e" }}>User Access Management</h2>
            <button style={{ background:"linear-gradient(135deg,#7A6342,#A68A64)", color:"#fff", border:"none", borderRadius:5, padding:"7px 16px", fontSize:12, fontWeight:600, cursor:"pointer" }}>+ Invite User</button>
          </div>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead>
              <tr style={{ background:"#1a1a2e" }}>
                {["Name","Email","Role","Status","Actions"].map(h => (
                  <th key={h} style={{ color:"#fff", padding:"8px 16px", textAlign:"left", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id} style={{ background: i % 2 === 0 ? "#fff" : "#fafaf9" }}>
                  <td style={{ padding:"10px 16px", fontWeight:600 }}>{u.name}</td>
                  <td style={{ padding:"10px 16px", color:"#6b7280" }}>{u.email}</td>
                  <td style={{ padding:"10px 16px" }}>
                    <span style={{ background:"#dbeafe", color:"#1e40af", padding:"2px 8px", borderRadius:4, fontSize:11, fontWeight:600 }}>{u.role}</span>
                  </td>
                  <td style={{ padding:"10px 16px" }}>
                    <span style={{ background:"#dcfce7", color:"#166534", padding:"2px 8px", borderRadius:4, fontSize:11, fontWeight:600 }}>{u.status}</span>
                  </td>
                  <td style={{ padding:"10px 16px" }}>
                    <div style={{ display:"flex", gap:6 }}>
                      <button style={{ background:"#f3f4f6", color:"#374151", border:"1px solid #d1d5db", borderRadius:3, padding:"3px 10px", fontSize:11, cursor:"pointer" }}>Edit</button>
                      <button style={{ background:"#fee2e2", color:"#991b1b", border:"none", borderRadius:3, padding:"3px 10px", fontSize:11, cursor:"pointer" }}>Remove</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
