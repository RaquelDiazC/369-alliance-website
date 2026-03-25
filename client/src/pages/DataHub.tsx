/**
 * 369 Alliance System – Data Analytics Hub
 * Design: Authoritative Dark Navy with Bronze Accents
 * Four sections: Overview Timeline, Defects Analysis, Graphics & Analytics, Portfolio
 */
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { getProjects, type Project } from "@/lib/data";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

type HubSection = "menu" | "timeline" | "defects" | "graphics" | "portfolio";

// ─── Color helpers ────────────────────────────────────────────────────────────
const RISK_COLORS: Record<string, string> = { High:"#fee2e2", Medium:"#fef9c3", Low:"#dcfce7" };
const RISK_TEXT: Record<string, string> = { High:"#991b1b", Medium:"#92400e", Low:"#166534" };
const OUTCOME_COLORS: Record<string, string> = {
  "WIP":"#3b82f6","BWRO Draft":"#f59e0b","BWRO Final":"#d97706",
  "Prohibition Order Draft":"#8b5cf6","Prohibition Order Final":"#7c3aed",
  "SWO":"#ef4444","Closed":"#22c55e"
};

function getMonths(count = 6): { label: string; short: string; year: number; month: number }[] {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    return {
      label: d.toLocaleString("en-AU", { month: "long", year: "numeric" }),
      short: d.toLocaleString("en-AU", { month: "short" }),
      year: d.getFullYear(),
      month: d.getMonth()
    };
  });
}

// ─── Main DataHub ─────────────────────────────────────────────────────────────
export default function DataHub() {
  const [, navigate] = useLocation();
  const [section, setSection] = useState<HubSection>("menu");
  const projects = getProjects();

  if (section === "timeline") return <OverviewTimeline projects={projects} onBack={() => setSection("menu")} />;
  if (section === "defects") return <DefectsAnalysis projects={projects} onBack={() => setSection("menu")} />;
  if (section === "graphics") return <GraphicsAnalytics projects={projects} onBack={() => setSection("menu")} />;
  if (section === "portfolio") return <Portfolio projects={projects} onBack={() => setSection("menu")} />;

  return (
    <div style={{ minHeight:"100vh", background:"#f5f4f1", display:"flex", flexDirection:"column" }}>
      <header style={{ background:"#1a1a2e", color:"#fff", height:56, display:"flex", alignItems:"center", padding:"0 20px", gap:16, flexShrink:0 }}>
        <button onClick={() => navigate("/action-manager")} style={{ background:"none", border:"none", color:"#A68A64", fontSize:13, cursor:"pointer" }}>← Back to Dashboard</button>
        <div style={{ width:1, height:24, background:"#3a3a5e" }} />
        <span style={{ fontWeight:700, fontSize:16 }}>Data Analytics Hub</span>
        <div style={{ flex:1 }} />
        <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)" }}>369 Alliance System</div>
      </header>

      <div style={{ flex:1, padding:"40px 24px", maxWidth:1100, margin:"0 auto", width:"100%" }}>
        <div style={{ marginBottom:32 }}>
          <h1 style={{ fontWeight:800, fontSize:26, color:"#1a1a2e", marginBottom:6 }}>Data Analytics Hub</h1>
          <p style={{ fontSize:14, color:"#6b7280" }}>Comprehensive data analytics and project management platform for building inspections, defect tracking, and compliance monitoring.</p>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(2, 1fr)", gap:20 }}>
          {[
            { key:"timeline", icon:"📅", title:"Overview Timeline", subtitle:"Project Timeline Management", color:"#1e3a5f", features:["6-month project timeline view","Inspector filtering system","Color-coded risk assessment","INTEL & OC Inspection integration"] },
            { key:"defects", icon:"🐛", title:"Defects Analysis", subtitle:"Comprehensive Defect Tracking", color:"#7f1d1d", features:["Top 5 defects by category analysis","Monthly defect trend reporting","Regional defect pattern mapping","NSW inspection activity visualization"] },
            { key:"graphics", icon:"📊", title:"Graphics & Analytics", subtitle:"Advanced Data Visualization", color:"#14532d", features:["Multi-tab analytics dashboard","KPI tracking and performance metrics","Interactive charts and visualizations","Export capabilities for reporting"] },
            { key:"portfolio", icon:"📋", title:"Portfolio", subtitle:"Project Outcome Tracking", color:"#4c1d95", features:["Workflow management","Deadline tracking and alerts","Priority-based project organization","Developer/Builder collaboration tools"] },
          ].map(s => (
            <div
              key={s.key}
              onClick={() => setSection(s.key as HubSection)}
              style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:10, padding:"28px 24px", cursor:"pointer", transition:"all 0.15s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 32px rgba(26,26,46,0.12)"; (e.currentTarget as HTMLElement).style.borderColor = "#A68A64"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = ""; (e.currentTarget as HTMLElement).style.borderColor = "#e5e7eb"; }}
            >
              <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:16 }}>
                <div style={{ width:52, height:52, background:s.color, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>{s.icon}</div>
                <div>
                  <div style={{ fontWeight:700, fontSize:17, color:"#1a1a2e" }}>{s.title}</div>
                  <div style={{ fontSize:12, color:"#6b7280" }}>{s.subtitle}</div>
                </div>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {s.features.map((f, i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:"#374151" }}>
                    <span style={{ color:"#22c55e", fontWeight:700, fontSize:12 }}>✓</span>
                    {f}
                  </div>
                ))}
              </div>
              <div style={{ marginTop:16, fontSize:12, color:"#A68A64", fontWeight:600 }}>Open →</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Overview Timeline ────────────────────────────────────────────────────────
const INSPECTION_GROUPS = ["AA inspections","CAS inspections","OC inspections","Project Intervene","Blitz"];
const FILTER_FIELDS = ["Inspector","Stage","Risk Category","Selected by","Developer","Project Outcome"];

function OverviewTimeline({ projects, onBack }: { projects: Project[]; onBack: () => void }) {
  const months = useMemo(() => getMonths(6), []);
  const [selectedGroup, setSelectedGroup] = useState("AA inspections");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState<"description"|"graphic">("description");
  const [filters, setFilters] = useState<Record<string, string>>({});

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
      <header style={{ background:"#1a1a2e", color:"#fff", padding:"0 20px", flexShrink:0 }}>
        <div style={{ height:56, display:"flex", alignItems:"center", gap:16 }}>
          <button onClick={onBack} style={{ background:"none", border:"none", color:"#A68A64", fontSize:13, cursor:"pointer" }}>← Back to Data</button>
          <div style={{ width:1, height:24, background:"#3a3a5e" }} />
          <div>
            <div style={{ fontWeight:700, fontSize:15 }}>Overview Timeline Section</div>
            <div style={{ fontSize:11, color:"#A68A64" }}>6-Month Project Timeline Management</div>
          </div>
          <div style={{ flex:1 }} />
          <button onClick={onBack} style={{ background:"linear-gradient(135deg,#7A6342,#A68A64)", color:"#fff", border:"none", borderRadius:5, padding:"6px 16px", fontSize:12, fontWeight:600, cursor:"pointer" }}>← Back to Data</button>
        </div>
      </header>

      {/* Stats */}
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

      {/* Filters */}
      <div style={{ background:"#fff", borderBottom:"1px solid #e5e7eb", padding:"8px 20px", display:"flex", gap:8, flexWrap:"wrap", flexShrink:0 }}>
        {FILTER_FIELDS.map(f => (
          <select key={f} value={filters[f] || ""} onChange={e => setFilters(fv => ({...fv,[f]:e.target.value}))} style={{ border:"1px solid #d1d5db", borderRadius:4, padding:"4px 8px", fontSize:11, color:"#374151", background:"#fff" }}>
            <option value="">{f}: All</option>
          </select>
        ))}
      </div>

      <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
        {/* Left sidebar */}
        <div style={{ width:200, flexShrink:0, background:"#fff", borderRight:"1px solid #e5e7eb", display:"flex", flexDirection:"column", overflowY:"auto" }}>
          <div style={{ padding:"10px 12px", borderBottom:"1px solid #e5e7eb" }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:6 }}>Project Address</div>
            <div style={{ position:"relative" }}>
              <input placeholder="Search..." style={{ width:"100%", border:"1px solid #e5e7eb", borderRadius:4, padding:"4px 8px 4px 24px", fontSize:11, outline:"none" }} />
              <span style={{ position:"absolute", left:6, top:"50%", transform:"translateY(-50%)", fontSize:12 }}>🔍</span>
            </div>
          </div>
          {INSPECTION_GROUPS.map(g => (
            <div key={g} onClick={() => setSelectedGroup(g)} style={{ padding:"8px 12px", fontSize:12, cursor:"pointer", background: selectedGroup === g ? "#fef3e2" : "transparent", color: selectedGroup === g ? "#7A6342" : "#374151", fontWeight: selectedGroup === g ? 600 : 400, borderLeft: selectedGroup === g ? "3px solid #A68A64" : "3px solid transparent" }}>
              {g}
            </div>
          ))}
          <div style={{ borderTop:"1px solid #e5e7eb", marginTop:8, padding:"8px 12px" }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:6 }}>Orders</div>
            <div style={{ fontSize:12, color:"#374151", cursor:"pointer", padding:"4px 0" }}>Active Orders</div>
          </div>
        </div>

        {/* Gantt + Detail */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
          <div style={{ flex:1, overflowX:"auto", overflowY:"auto" }}>
            <div style={{ minWidth:900 }}>
              {/* Month headers */}
              <div style={{ display:"grid", gridTemplateColumns:`200px repeat(${months.length}, 1fr) 120px`, gap:4, padding:"8px 12px", background:"#f5f4f1", position:"sticky", top:0, zIndex:5 }}>
                <div style={{ fontWeight:700, fontSize:11, color:"#6b7280", display:"flex", alignItems:"center" }}>Address</div>
                {months.map((m, i) => (
                  <div key={m.label} style={{ background: i === 0 ? "linear-gradient(135deg,#c0392b,#e74c3c)" : "#1a1a2e", color:"#fff", fontWeight:700, fontSize:11, padding:"8px 6px", borderRadius:6, textAlign:"center" }}>
                    {m.label}
                  </div>
                ))}
                <div style={{ background:"#374151", color:"#fff", fontWeight:700, fontSize:11, padding:"8px 6px", borderRadius:6, textAlign:"center" }}>Up to 12 months</div>
              </div>

              {/* Project rows */}
              {projects.map(p => (
                <div key={p.id} onClick={() => setSelectedProject(selectedProject?.id === p.id ? null : p)} style={{ display:"grid", gridTemplateColumns:`200px repeat(${months.length}, 1fr) 120px`, gap:4, padding:"2px 12px", cursor:"pointer", background: selectedProject?.id === p.id ? "#fef3e2" : "transparent" }}>
                  <div style={{ fontSize:11, display:"flex", alignItems:"center", gap:4, padding:"4px 0", overflow:"hidden" }}>
                    <code style={{ fontFamily:"IBM Plex Mono, monospace", fontSize:10, color:"#6b7280", minWidth:22 }}>{p.projCode}</code>
                    <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", color:"#1a1a2e" }}>{p.address}</span>
                  </div>
                  {months.map((m, i) => {
                    const hasActivity = i === 0 || (i === 1 && p.riskCategory === "High");
                    return (
                      <div key={m.label} style={{ minHeight:24, display:"flex", alignItems:"center" }}>
                        {hasActivity && (
                          <div style={{ height:18, borderRadius:3, background: RISK_COLORS[p.riskCategory], border:`1px solid ${RISK_TEXT[p.riskCategory]}`, width:"90%", fontSize:10, color: RISK_TEXT[p.riskCategory], display:"flex", alignItems:"center", paddingLeft:4, overflow:"hidden", whiteSpace:"nowrap", fontWeight:600 }}>
                            {p.stage} – {p.riskCategory}
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

          {/* Color legend */}
          <div style={{ padding:"8px 20px", background:"#fff", borderTop:"1px solid #e5e7eb", display:"flex", gap:20, flexShrink:0 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#6b7280" }}>Color Coding Legend:</div>
            {[["High Risk","#fee2e2","#991b1b","Previous issues with builders/developers"],["Medium Risk","#fef9c3","#92400e","Standard inspection required"],["Low Risk","#dcfce7","#166534","Internal rectifications, pre-approved"]].map(([label,bg,text,desc]) => (
              <div key={label as string} style={{ display:"flex", alignItems:"center", gap:6, fontSize:11 }}>
                <div style={{ width:16, height:12, background:bg as string, border:`1px solid ${text as string}`, borderRadius:2 }} />
                <span style={{ color:"#374151" }}><strong>{label}</strong> – {desc}</span>
              </div>
            ))}
          </div>

          {/* Detail panel */}
          {selectedProject && (
            <div style={{ borderTop:"2px solid #e5e7eb", background:"#fff", flexShrink:0, maxHeight:280, overflowY:"auto" }}>
              <div style={{ display:"flex", gap:0, borderBottom:"1px solid #e5e7eb", padding:"0 16px" }}>
                {(["description","graphic"] as const).map(t => (
                  <button key={t} onClick={() => setActiveTab(t)} style={{ padding:"8px 16px", border:"none", background:"none", fontSize:12, fontWeight:600, cursor:"pointer", color: activeTab === t ? "#1a1a2e" : "#6b7280", borderBottom: activeTab === t ? "2px solid #A68A64" : "2px solid transparent", textTransform:"capitalize" }}>
                    {t === "description" ? "Description" : "Graphic"}
                  </button>
                ))}
                <div style={{ flex:1 }} />
                <span style={{ fontSize:12, color:"#6b7280", alignSelf:"center", fontWeight:600 }}>Building address and name: {selectedProject.address}, {selectedProject.suburb}</span>
                <div style={{ flex:1 }} />
              </div>

              {activeTab === "description" ? (
                <div style={{ display:"flex", gap:0 }}>
                  <div style={{ flex:1, padding:"12px 16px", fontSize:12 }}>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"4px 16px", marginBottom:8 }}>
                      {[["Site", selectedProject.address],["Developer", selectedProject.developer],["Builder", selectedProject.builder],["PCA", selectedProject.certifierName],["Selection reason", selectedProject.firstInspectionType],["Audit type", selectedProject.sequentialInspection],["DA", selectedProject.daNumber],["CC", selectedProject.ccNumber],["Expired registration", selectedProject.builderExpireDate],["Status", selectedProject.projectOutcome]].map(([label,value]) => (
                        <div key={label as string} style={{ display:"flex", gap:6 }}>
                          <span style={{ fontWeight:600, color:"#6b7280", minWidth:120, fontSize:11 }}>{label}:</span>
                          <span style={{ color:"#1a1a2e" }}>{value || "—"}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:4, marginBottom:6 }}>
                      {[{l:"Inspection date",c:"#dcfce7"},{l:"Leader",c:"#dcfce7"},{l:"Team",c:"#dcfce7"},{l:"",c:"transparent"},{l:"Report date",c:"#fee2e2"},{l:"Delivery date",c:"#fee2e2"},{l:"Report meeting",c:"#fee2e2"},{l:"Rect. Agreement date",c:"#fee2e2"}].map((f,i) => (
                        <div key={i} style={{ background:f.c, borderRadius:3, padding:"3px 6px", fontSize:11, fontWeight:600, color:"#374151" }}>{f.l}</div>
                      ))}
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                      <span style={{ fontSize:11, fontWeight:600, color:"#6b7280" }}>Main concerns:</span>
                      <div style={{ flex:1, height:10, background:"linear-gradient(90deg, #ef4444 60%, #f59e0b 80%, #22c55e 100%)", borderRadius:3 }} />
                    </div>
                    <div style={{ border:"1px solid #e5e7eb", borderRadius:4, padding:"8px 10px", fontSize:11, color:"#374151", lineHeight:1.6 }}>
                      <div style={{ fontWeight:600, marginBottom:4 }}>Scope of works summary:</div>
                      {selectedProject.developDescription || "No description available."}
                      {selectedProject.history.slice(-3).map(h => (
                        <div key={h.id} style={{ color:"#6b7280" }}>{h.date} – {h.operation}: {h.details}</div>
                      ))}
                    </div>
                  </div>
                  <div style={{ width:180, flexShrink:0, padding:"12px 16px" }}>
                    <div style={{ width:"100%", height:150, background:"#f0ede8", borderRadius:6, overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", border:"1px solid #e5e7eb" }}>
                      {selectedProject.photoUrl ? <img src={selectedProject.photoUrl} alt="Site" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : <div style={{ textAlign:"center", color:"#9ca3af" }}><div style={{ fontSize:28 }}>🏗️</div><div style={{ fontSize:11 }}>No photo</div></div>}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ padding:"20px 16px", textAlign:"center", color:"#9ca3af" }}>
                  <div style={{ fontSize:32, marginBottom:8 }}>📊</div>
                  <div style={{ fontSize:13 }}>Graphic view for {selectedProject.address} — Risk: {selectedProject.riskCategory} · Outcome: {selectedProject.projectOutcome}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Defects Analysis ─────────────────────────────────────────────────────────
const DEFECT_CATEGORIES = [
  { name:"Waterproofing", total:142, color:"#3b82f6", items:[{n:"Membrane failure",c:45},{n:"Inadequate drainage",c:38},{n:"Sealant deterioration",c:32},{n:"Flashing issues",c:27}] },
  { name:"Fire Safety", total:98, color:"#ef4444", items:[{n:"Exit path obstruction",c:28},{n:"Smoke detector failure",c:25},{n:"Fire door compliance",c:23},{n:"Sprinkler system issues",c:22}] },
  { name:"Structural", total:76, color:"#6b7280", items:[{n:"Concrete cracking",c:22},{n:"Steel corrosion",c:19},{n:"Foundation settlement",c:18},{n:"Load bearing issues",c:17}] },
  { name:"Essential Services", total:54, color:"#22c55e", items:[{n:"HVAC failure",c:18},{n:"Electrical non-compliance",c:16},{n:"Plumbing defects",c:12},{n:"Lift non-compliance",c:8}] },
  { name:"Building Enclosure", total:46, color:"#f59e0b", items:[{n:"Cladding delamination",c:16},{n:"Window seal failure",c:14},{n:"Facade cracking",c:10},{n:"Roof membrane issues",c:6}] },
];

const REGIONAL_HOTSPOTS = [
  { suburb:"Sydney CBD", risk:"High", count:45 },
  { suburb:"Parramatta", risk:"Medium", count:32 },
  { suburb:"Liverpool", risk:"Medium", count:28 },
  { suburb:"Blacktown", risk:"Low", count:15 },
  { suburb:"Chatswood", risk:"Low", count:12 },
];

type DefectsTab = "top" | "monthly" | "regional" | "map";

function DefectsAnalysis({ projects, onBack }: { projects: Project[]; onBack: () => void }) {
  const [tab, setTab] = useState<DefectsTab>("top");

  const pieData = DEFECT_CATEGORIES.map(c => ({ name: c.name, value: c.total, color: c.color }));
  const monthlyData = [
    { month:"Jan", Waterproofing:12, Fire:8, Structural:6, Services:4, Enclosure:3 },
    { month:"Feb", Waterproofing:15, Fire:10, Structural:7, Services:5, Enclosure:4 },
    { month:"Mar", Waterproofing:18, Fire:12, Structural:9, Services:6, Enclosure:5 },
    { month:"Apr", Waterproofing:14, Fire:9, Structural:8, Services:5, Enclosure:4 },
    { month:"May", Waterproofing:20, Fire:14, Structural:10, Services:7, Enclosure:6 },
    { month:"Jun", Waterproofing:22, Fire:16, Structural:11, Services:8, Enclosure:7 },
  ];

  return (
    <div style={{ minHeight:"100vh", background:"#f5f4f1", display:"flex", flexDirection:"column" }}>
      <header style={{ background:"#1a1a2e", color:"#fff", height:56, display:"flex", alignItems:"center", padding:"0 20px", gap:16, flexShrink:0 }}>
        <button onClick={onBack} style={{ background:"none", border:"none", color:"#A68A64", fontSize:13, cursor:"pointer" }}>← Back to Data</button>
        <div style={{ width:1, height:24, background:"#3a3a5e" }} />
        <span style={{ fontWeight:700, fontSize:16 }}>Defects Analysis Section</span>
        <div style={{ flex:1 }} />
        <button onClick={onBack} style={{ background:"#c0392b", color:"#fff", border:"none", borderRadius:5, padding:"6px 16px", fontSize:12, fontWeight:600, cursor:"pointer" }}>← Back to Data</button>
      </header>

      {/* Tabs */}
      <div style={{ background:"#fff", borderBottom:"1px solid #e5e7eb", padding:"0 20px", display:"flex", gap:0, flexShrink:0 }}>
        {(["top","monthly","regional","map"] as DefectsTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding:"12px 20px", border:"none", background:"none", fontSize:13, fontWeight:600, cursor:"pointer", color: tab === t ? "#1a1a2e" : "#6b7280", borderBottom: tab === t ? "2px solid #A68A64" : "2px solid transparent", textTransform:"capitalize" }}>
            {t === "top" ? "Top Defects" : t === "monthly" ? "Monthly View" : t === "regional" ? "Regional Analysis" : "Inspection Map"}
          </button>
        ))}
      </div>

      <div style={{ flex:1, display:"flex", gap:0, overflow:"auto" }}>
        {/* Main content */}
        <div style={{ flex:1, padding:"24px", overflowY:"auto" }}>
          {tab === "top" && (
            <div>
              <h2 style={{ fontWeight:700, fontSize:18, color:"#1a1a2e", marginBottom:20 }}>Top 5 Defects by Category</h2>
              {DEFECT_CATEGORIES.map(cat => (
                <div key={cat.name} style={{ marginBottom:20 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:8 }}>
                    <h3 style={{ fontWeight:700, fontSize:15, color: cat.color }}>{cat.name}</h3>
                    <span style={{ fontSize:13, color:"#6b7280" }}>{cat.total} incidents</span>
                  </div>
                  {cat.items.map(item => (
                    <div key={item.n} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:"1px solid #f5f4f1" }}>
                      <span style={{ fontSize:13, color:"#374151" }}>{item.n}</span>
                      <span style={{ fontSize:13, fontWeight:700, color: item.c >= 30 ? "#ef4444" : "#374151" }}>{item.c} cases</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {tab === "monthly" && (
            <div>
              <h2 style={{ fontWeight:700, fontSize:18, color:"#1a1a2e", marginBottom:20 }}>Monthly Defect Trends</h2>
              <div style={{ height:350 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
                    <XAxis dataKey="month" tick={{ fontSize:12 }} />
                    <YAxis tick={{ fontSize:12 }} />
                    <Tooltip />
                    <Legend />
                    {DEFECT_CATEGORIES.map(c => (
                      <Line key={c.name} type="monotone" dataKey={c.name.split(" ")[0]} stroke={c.color} strokeWidth={2} dot={{ r:4 }} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {tab === "regional" && (
            <div>
              <h2 style={{ fontWeight:700, fontSize:18, color:"#1a1a2e", marginBottom:20 }}>Regional Analysis</h2>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                <thead>
                  <tr style={{ background:"#1a1a2e" }}>
                    {["Suburb","Risk Level","Defect Count","Action Required"].map(h => (
                      <th key={h} style={{ color:"#fff", padding:"8px 14px", textAlign:"left", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {REGIONAL_HOTSPOTS.map((r, i) => (
                    <tr key={r.suburb} style={{ background: i % 2 === 0 ? "#fff" : "#fafaf9" }}>
                      <td style={{ padding:"10px 14px", fontWeight:600 }}>{r.suburb}</td>
                      <td style={{ padding:"10px 14px" }}>
                        <span style={{ background: RISK_COLORS[r.risk], color: RISK_TEXT[r.risk], padding:"2px 8px", borderRadius:4, fontSize:11, fontWeight:600 }}>{r.risk}</span>
                      </td>
                      <td style={{ padding:"10px 14px", fontWeight:700, color: r.count > 30 ? "#ef4444" : "#374151" }}>{r.count}</td>
                      <td style={{ padding:"10px 14px", color:"#6b7280", fontSize:12 }}>{r.risk === "High" ? "Immediate inspection required" : r.risk === "Medium" ? "Schedule inspection" : "Monitor"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === "map" && (
            <div style={{ textAlign:"center", padding:"60px 20px" }}>
              <div style={{ fontSize:48, marginBottom:16 }}>🗺️</div>
              <h3 style={{ fontWeight:700, fontSize:18, color:"#1a1a2e", marginBottom:8 }}>NSW Inspection Map</h3>
              <p style={{ fontSize:14, color:"#6b7280", maxWidth:400, margin:"0 auto" }}>Interactive NSW map with blue pins for each inspection site. Requires Google Maps integration.</p>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div style={{ width:280, flexShrink:0, padding:"24px 16px", borderLeft:"1px solid #e5e7eb", background:"#fff" }}>
          <h3 style={{ fontWeight:700, fontSize:14, color:"#1a1a2e", marginBottom:16 }}>Defect Distribution</h3>
          <div style={{ height:200, marginBottom:16 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={80}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:4, marginBottom:20 }}>
            {pieData.map(d => (
              <div key={d.name} style={{ display:"flex", alignItems:"center", gap:8, fontSize:12 }}>
                <div style={{ width:12, height:12, background:d.color, borderRadius:2, flexShrink:0 }} />
                <span style={{ color:"#374151" }}>{d.name}</span>
              </div>
            ))}
          </div>

          <h3 style={{ fontWeight:700, fontSize:14, color:"#1a1a2e", marginBottom:12 }}>June 2025 Summary</h3>
          {[["Total Defects","316","#ef4444"],["Critical Issues","45","#ef4444"],["Resolved","189","#22c55e"],["In Progress","82","#f59e0b"]].map(([label,val,color]) => (
            <div key={label as string} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:"1px solid #f5f4f1" }}>
              <span style={{ fontSize:13, color:"#374151" }}>{label}</span>
              <span style={{ fontSize:13, fontWeight:700, color: color as string }}>{val}</span>
            </div>
          ))}

          <h3 style={{ fontWeight:700, fontSize:14, color:"#1a1a2e", marginBottom:12, marginTop:16 }}>Regional Hotspots</h3>
          {REGIONAL_HOTSPOTS.map(r => (
            <div key={r.suburb} style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom:"1px solid #f5f4f1" }}>
              <span style={{ fontSize:13, color:"#374151" }}>{r.suburb}</span>
              <span style={{ background: RISK_COLORS[r.risk], color: RISK_TEXT[r.risk], padding:"1px 6px", borderRadius:3, fontSize:11, fontWeight:600 }}>{r.risk}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Graphics & Analytics ─────────────────────────────────────────────────────
type GraphicsTab = "overview" | "inspection" | "trends" | "status";

function GraphicsAnalytics({ projects, onBack }: { projects: Project[]; onBack: () => void }) {
  const [tab, setTab] = useState<GraphicsTab>("overview");

  const auditByClass = [
    { name:"Active", value:95, fill:"#3b82f6" },
    { name:"Closed-out", value:49, fill:"#6b7280" },
    { name:"Planned", value:33, fill:"#22c55e" },
    { name:"Tracking", value:26, fill:"#ef4444" },
    { name:"Other", value:68, fill:"#8b5cf6" },
  ];

  const auditByYear = [
    { year:"2021", count:5 },{ year:"2022", count:50 },{ year:"2023", count:52 },
    { year:"2024", count:115 },{ year:"2025", count:49 },
  ];

  const auditTypePie = [
    { name:"Design", value:30, color:"#3b82f6" },
    { name:"DBP A/A", value:15, color:"#f59e0b" },
    { name:"Remedial", value:10, color:"#22c55e" },
    { name:"As-Built", value:45, color:"#ef4444" },
  ];

  return (
    <div style={{ minHeight:"100vh", background:"#f5f4f1", display:"flex", flexDirection:"column" }}>
      <header style={{ background:"#1a1a2e", color:"#fff", height:56, display:"flex", alignItems:"center", padding:"0 20px", gap:16, flexShrink:0 }}>
        <button onClick={onBack} style={{ background:"none", border:"none", color:"#A68A64", fontSize:13, cursor:"pointer" }}>← Back to Data</button>
        <div style={{ width:1, height:24, background:"#3a3a5e" }} />
        <span style={{ fontWeight:700, fontSize:16 }}>Graphics & Analytics Dashboard</span>
        <div style={{ flex:1 }} />
        <button onClick={onBack} style={{ background:"#166534", color:"#fff", border:"none", borderRadius:5, padding:"6px 16px", fontSize:12, fontWeight:600, cursor:"pointer" }}>← Back to Data</button>
      </header>

      {/* Tabs */}
      <div style={{ background:"#fff", borderBottom:"1px solid #e5e7eb", padding:"0 20px", display:"flex", gap:0, flexShrink:0 }}>
        {(["overview","inspection","trends","status"] as GraphicsTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding:"12px 20px", border:"none", background:"none", fontSize:13, fontWeight:600, cursor:"pointer", color: tab === t ? "#1a1a2e" : "#6b7280", borderBottom: tab === t ? "2px solid #22c55e" : "2px solid transparent", textTransform:"capitalize" }}>
            {t === "overview" ? "Overview" : t === "inspection" ? "Inspection Metrics" : t === "trends" ? "Defect Trends" : "Status Reports"}
          </button>
        ))}
        <div style={{ flex:1 }} />
        <button style={{ background:"#166534", color:"#fff", border:"none", borderRadius:5, padding:"6px 14px", fontSize:12, fontWeight:600, cursor:"pointer", alignSelf:"center" }}>⬇ Export Data</button>
      </div>

      {/* Filters */}
      <div style={{ background:"#f9f8f6", borderBottom:"1px solid #e5e7eb", padding:"8px 20px", display:"flex", gap:8, alignItems:"center", flexShrink:0 }}>
        <span style={{ fontSize:12, fontWeight:600, color:"#6b7280" }}>Filters:</span>
        {["Inspector","Stage","Risk Category","Period"].map(f => (
          <select key={f} style={{ border:"1px solid #d1d5db", borderRadius:4, padding:"4px 8px", fontSize:11, background:"#fff" }}>
            <option>{f}: All</option>
          </select>
        ))}
      </div>

      <div style={{ flex:1, padding:"24px", overflowY:"auto" }}>
        {tab === "overview" && (
          <div>
            {/* KPI cards */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}>
              {[
                { label:"DBP Audits Tracker", value:"24,614", sub:"Sum of Apartments", color:"#3b82f6" },
                { label:"Sum of Cost", value:"$12.35B", sub:"Total Investment", color:"#3b82f6" },
                { label:"Audit Status", value:"Active", sub:"Planned | Tracking", color:"#3b82f6" },
                { label:"Total No. Audits", value:"271", sub:"Current Period", color:"#3b82f6" },
              ].map(k => (
                <div key={k.label} style={{ background:k.color, borderRadius:8, padding:"20px 16px", color:"#fff" }}>
                  <div style={{ fontSize:12, opacity:0.85, marginBottom:6 }}>{k.label}</div>
                  <div style={{ fontSize:26, fontWeight:800, marginBottom:4 }}>{k.value}</div>
                  <div style={{ fontSize:11, opacity:0.75 }}>{k.sub}</div>
                </div>
              ))}
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
              <div style={{ background:"#fff", borderRadius:8, border:"1px solid #e5e7eb", padding:"20px" }}>
                <h3 style={{ fontWeight:700, fontSize:14, color:"#1a1a2e", marginBottom:16 }}>Count of Audit by Reg Class</h3>
                <div style={{ height:250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={auditByClass}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
                      <XAxis dataKey="name" tick={{ fontSize:11 }} />
                      <YAxis tick={{ fontSize:11 }} />
                      <Tooltip />
                      <Bar dataKey="value">
                        {auditByClass.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={{ background:"#fff", borderRadius:8, border:"1px solid #e5e7eb", padding:"20px" }}>
                <h3 style={{ fontWeight:700, fontSize:14, color:"#1a1a2e", marginBottom:16 }}>NSW Audit Locations</h3>
                <div style={{ height:250, display:"flex", alignItems:"center", justifyContent:"center", background:"#f5f4f1", borderRadius:6 }}>
                  <div style={{ textAlign:"center", color:"#9ca3af" }}>
                    <div style={{ fontSize:36, marginBottom:8 }}>🗺️</div>
                    <div style={{ fontSize:13, fontWeight:600 }}>NSW Map with Audit Pins</div>
                    <div style={{ fontSize:11 }}>Interactive location mapping</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom stats */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:12, marginTop:20 }}>
              {auditByClass.map(s => (
                <div key={s.name} style={{ background:s.fill, borderRadius:8, padding:"16px", textAlign:"center", color:"#fff" }}>
                  <div style={{ fontSize:24, fontWeight:800 }}>{s.value}</div>
                  <div style={{ fontSize:12, opacity:0.85 }}>{s.name} Audits</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "inspection" && (
          <div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
              <div style={{ background:"#fff", borderRadius:8, border:"1px solid #e5e7eb", padding:"20px" }}>
                <h3 style={{ fontWeight:700, fontSize:14, color:"#1a1a2e", marginBottom:16 }}>Audit Type Distribution</h3>
                <div style={{ height:280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={auditTypePie} dataKey="value" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {auditTypePie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div style={{ background:"#fff", borderRadius:8, border:"1px solid #e5e7eb", padding:"20px" }}>
                <h3 style={{ fontWeight:700, fontSize:14, color:"#1a1a2e", marginBottom:16 }}>Audit Count by Year</h3>
                <div style={{ height:280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={auditByYear}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
                      <XAxis dataKey="year" tick={{ fontSize:12 }} />
                      <YAxis tick={{ fontSize:12 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ r:5 }} fill="#dbeafe" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "trends" && (
          <div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>
              <div style={{ background:"#fff", borderRadius:8, border:"1px solid #e5e7eb", padding:"20px" }}>
                <h3 style={{ fontWeight:700, fontSize:14, color:"#1a1a2e", marginBottom:16 }}>Monthly Project Activity (2025)</h3>
                <div style={{ height:260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { month:"Jan", "Proactive Insp":3, "From FORM":1, CLIENT:0 },
                      { month:"Feb", "Proactive Insp":2, "From FORM":3, CLIENT:1 },
                      { month:"Mar", "Proactive Insp":1, "From FORM":1, CLIENT:1 },
                      { month:"Apr", "Proactive Insp":2, "From FORM":2, CLIENT:0 },
                      { month:"May", "Proactive Insp":1, "From FORM":1, CLIENT:1 },
                      { month:"Jun", "Proactive Insp":0, "From FORM":2, CLIENT:1 },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
                      <XAxis dataKey="month" tick={{ fontSize:11 }} />
                      <YAxis tick={{ fontSize:11 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Proactive Insp" fill="#1e3a5f" />
                      <Bar dataKey="From FORM" fill="#A68A64" />
                      <Bar dataKey="CLIENT" fill="#22c55e" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div style={{ background:"#fff", borderRadius:8, border:"1px solid #e5e7eb", padding:"20px" }}>
                <h3 style={{ fontWeight:700, fontSize:14, color:"#1a1a2e", marginBottom:16 }}>Risk Category Trend (2025)</h3>
                <div style={{ height:260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={[
                      { month:"Jan", High:2, Medium:2, Low:1 },
                      { month:"Feb", High:3, Medium:2, Low:2 },
                      { month:"Mar", High:2, Medium:3, Low:1 },
                      { month:"Apr", High:1, Medium:3, Low:2 },
                      { month:"May", High:2, Medium:2, Low:1 },
                      { month:"Jun", High:1, Medium:2, Low:1 },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
                      <XAxis dataKey="month" tick={{ fontSize:11 }} />
                      <YAxis tick={{ fontSize:11 }} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="High" stroke="#ef4444" strokeWidth={2} dot={{ r:4 }} />
                      <Line type="monotone" dataKey="Medium" stroke="#f59e0b" strokeWidth={2} dot={{ r:4 }} />
                      <Line type="monotone" dataKey="Low" stroke="#22c55e" strokeWidth={2} dot={{ r:4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div style={{ background:"#fff", borderRadius:8, border:"1px solid #e5e7eb", padding:"20px" }}>
              <h3 style={{ fontWeight:700, fontSize:14, color:"#1a1a2e", marginBottom:16 }}>Inspector Workload Distribution</h3>
              <div style={{ height:220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={
                    Object.entries(
                      projects.flatMap(p => p.inspectors).reduce((acc: Record<string, number>, i) => { acc[i] = (acc[i] || 0) + 1; return acc; }, {})
                    ).sort((a,b) => b[1]-a[1]).slice(0,8).map(([name, count]) => ({ name, count }))
                  }>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
                    <XAxis type="number" tick={{ fontSize:11 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize:11 }} width={130} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#1a1a2e" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
        {tab === "status" && (
          <div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:20 }}>
              {[
                { label:"Total Projects", value: projects.length, color:"#1a1a2e", icon:"📁" },
                { label:"Active (WIP)", value: projects.filter(p => p.projectOutcome === "WIP").length, color:"#3b82f6", icon:"🔄" },
                { label:"High Risk", value: projects.filter(p => p.riskCategory === "High").length, color:"#ef4444", icon:"⚠️" },
                { label:"Closed", value: projects.filter(p => p.projectOutcome === "Closed").length, color:"#22c55e", icon:"✅" },
              ].map(s => (
                <div key={s.label} style={{ background:s.color, borderRadius:8, padding:"20px", color:"#fff", textAlign:"center" }}>
                  <div style={{ fontSize:28, marginBottom:4 }}>{s.icon}</div>
                  <div style={{ fontSize:32, fontWeight:800 }}>{s.value}</div>
                  <div style={{ fontSize:12, opacity:0.85 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
              <div style={{ background:"#fff", borderRadius:8, border:"1px solid #e5e7eb", padding:"20px" }}>
                <h3 style={{ fontWeight:700, fontSize:14, color:"#1a1a2e", marginBottom:16 }}>Project Outcomes Breakdown</h3>
                <div style={{ height:260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={Object.entries(
                          projects.reduce((acc: Record<string, number>, p) => { acc[p.projectOutcome] = (acc[p.projectOutcome] || 0) + 1; return acc; }, {})
                        ).map(([name, value]) => ({ name, value, color: OUTCOME_COLORS[name] || "#6b7280" }))}
                        dataKey="value" cx="50%" cy="50%" outerRadius={100}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {Object.entries(
                          projects.reduce((acc: Record<string, number>, p) => { acc[p.projectOutcome] = (acc[p.projectOutcome] || 0) + 1; return acc; }, {})
                        ).map(([name], i) => <Cell key={i} fill={OUTCOME_COLORS[name] || "#6b7280"} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div style={{ background:"#fff", borderRadius:8, border:"1px solid #e5e7eb", padding:"20px" }}>
                <h3 style={{ fontWeight:700, fontSize:14, color:"#1a1a2e", marginBottom:16 }}>Projects by Tab</h3>
                <div style={{ height:260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { tab:"Proactive", count: projects.filter(p => p.tab === "Proactive Insp").length, fill:"#1e3a5f" },
                      { tab:"From FORM", count: projects.filter(p => p.tab === "From FORM").length, fill:"#A68A64" },
                      { tab:"CLIENT", count: projects.filter(p => p.tab === "CLIENT").length, fill:"#22c55e" },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
                      <XAxis dataKey="tab" tick={{ fontSize:12 }} />
                      <YAxis tick={{ fontSize:12 }} />
                      <Tooltip />
                      <Bar dataKey="count">
                        {[
                          { tab:"Proactive", fill:"#1e3a5f" },
                          { tab:"OC Insp.", fill:"#A68A64" },
                          { tab:"CLIENT", fill:"#22c55e" },
                          
                        ].map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Portfolio ────────────────────────────────────────────────────────────────
const PORTFOLIO_COLUMNS = [
  { key:"funnel", label:"Funnel", sub:"All big ideas captured", color:"#ef4444", projects:193, ideas:135 },
  { key:"reviewing", label:"Reviewing", sub:"Refined and prioritised", color:"#8b5cf6", projects:222, ideas:155 },
  { key:"analysing", label:"Analysing", sub:"Business cases in progress", color:"#3b82f6", projects:129, ideas:90 },
  { key:"committed", label:"Committed", sub:"Projects on hold or not yet started", color:"#1e3a5f", projects:59, ideas:41 },
  { key:"implementing", label:"Implementing", sub:"In delivery", color:"#1e3a5f", projects:461, ideas:768 },
  { key:"completed", label:"Completed", sub:"Closed or in closure phase", color:"#ef4444", projects:609, ideas:1098 },
];

const SAMPLE_CARDS: Record<string, { code:string; name:string; priority:"High"|"Medium"|"Low"; size:"S"|"M"|"L"|"XL" }[]> = {
  funnel: [{ code:"CS-001012", name:"OCR Knowledge Management & A", priority:"Medium", size:"S" },{ code:"CS-001020", name:"C&I – Service definition and impl.", priority:"High", size:"M" }],
  reviewing: [{ code:"CS-001031", name:"Implementing software developm.", priority:"High", size:"XL" },{ code:"CS-001034", name:"Period strategy", priority:"Medium", size:"M" }],
  analysing: [{ code:"PP-000004", name:"PM Window", priority:"High", size:"M" },{ code:"PP-000002", name:"CmDX Rationalisation", priority:"Medium", size:"L" }],
  committed: [{ code:"OFS-2823", name:"Building Houses for the Future", priority:"High", size:"S" },{ code:"PR-02119", name:"eConveyancing – Title", priority:"Medium", size:"M" }],
  implementing: [{ code:"OFS-2808", name:"Connecting County Communities", priority:"Low", size:"XL" }],
  completed: [{ code:"OFS-1802", name:"O&M Improvement Program", priority:"Low", size:"XL" }],
};

const PRIORITY_COLORS: Record<string, string> = { High:"#fee2e2", Medium:"#fef9c3", Low:"#dcfce7" };
const PRIORITY_TEXT: Record<string, string> = { High:"#991b1b", Medium:"#92400e", Low:"#166534" };
const SIZE_COLORS: Record<string, string> = { S:"#22c55e", M:"#3b82f6", L:"#f59e0b", XL:"#ef4444" };

function Portfolio({ projects: _projects, onBack }: { projects: Project[]; onBack: () => void }) {
  return (
    <div style={{ minHeight:"100vh", background:"#f5f4f1", display:"flex", flexDirection:"column" }}>
      <header style={{ background:"#1a1a2e", color:"#fff", height:56, display:"flex", alignItems:"center", padding:"0 20px", gap:16, flexShrink:0 }}>
        <button onClick={onBack} style={{ background:"none", border:"none", color:"#A68A64", fontSize:13, cursor:"pointer" }}>← Back to Data</button>
        <div style={{ width:1, height:24, background:"#3a3a5e" }} />
        <span style={{ fontWeight:700, fontSize:16 }}>Portfolio Management</span>
        <div style={{ flex:1 }} />
        <span style={{ fontSize:12, color:"#A68A64" }}>June 2025</span>
        <button onClick={onBack} style={{ background:"#5b21b6", color:"#fff", border:"none", borderRadius:5, padding:"6px 16px", fontSize:12, fontWeight:600, cursor:"pointer" }}>← Back to Data</button>
      </header>

      {/* Filters */}
      <div style={{ background:"#fff", borderBottom:"1px solid #e5e7eb", padding:"8px 20px", display:"flex", gap:8, alignItems:"center", flexShrink:0 }}>
        <span style={{ fontSize:12, fontWeight:600, color:"#6b7280" }}>Filters:</span>
        {["Inspector","Stage","Risk Category"].map(f => (
          <select key={f} style={{ border:"1px solid #d1d5db", borderRadius:4, padding:"4px 8px", fontSize:11, background:"#fff" }}>
            <option>{f}: All</option>
          </select>
        ))}
        <input placeholder="Search projects..." style={{ border:"1px solid #d1d5db", borderRadius:4, padding:"4px 10px", fontSize:11, flex:1, maxWidth:300, outline:"none" }} />
        <button style={{ background:"#5b21b6", color:"#fff", border:"none", borderRadius:4, padding:"5px 14px", fontSize:11, fontWeight:600, cursor:"pointer" }}>Export</button>
      </div>

      {/* Priority/Size legend */}
      <div style={{ background:"#f9f8f6", borderBottom:"1px solid #e5e7eb", padding:"6px 20px", display:"flex", gap:20, alignItems:"center", flexShrink:0 }}>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <span style={{ fontSize:11, fontWeight:700, color:"#6b7280" }}>Priority:</span>
          {["High","Medium","Low"].map(p => (
            <span key={p} style={{ background: PRIORITY_COLORS[p], color: PRIORITY_TEXT[p], padding:"2px 8px", borderRadius:4, fontSize:11, fontWeight:600 }}>{p}</span>
          ))}
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <span style={{ fontSize:11, fontWeight:700, color:"#6b7280" }}>Size:</span>
          {["S","M","L","XL"].map(s => (
            <span key={s} style={{ background: SIZE_COLORS[s], color:"#fff", padding:"2px 6px", borderRadius:3, fontSize:11, fontWeight:700 }}>{s}</span>
          ))}
        </div>
        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:6, fontSize:11, color:"#ef4444", fontWeight:600 }}>
          ⚠ Urgent (&gt;60 days)
        </div>
      </div>

      {/* Kanban columns */}
      <div style={{ flex:1, overflowX:"auto", padding:"16px 20px" }}>
        <div style={{ display:"flex", gap:12, minWidth:1200, height:"100%" }}>
          {PORTFOLIO_COLUMNS.map(col => (
            <div key={col.key} style={{ flex:1, minWidth:180, display:"flex", flexDirection:"column", gap:0 }}>
              {/* Column header */}
              <div style={{ background:col.color, borderRadius:"6px 6px 0 0", padding:"10px 12px", textAlign:"center" }}>
                <div style={{ fontWeight:700, fontSize:13, color:"#fff" }}>{col.label}</div>
                <div style={{ fontSize:10, color:"rgba(255,255,255,0.8)", marginTop:2 }}>{col.sub}</div>
              </div>
              <div style={{ background:"#1e3a5f", padding:"8px 12px", textAlign:"center" }}>
                <div style={{ fontWeight:800, fontSize:22, color:"#fff" }}>{col.projects.toLocaleString()}</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.7)" }}>Projects</div>
              </div>
              <div style={{ background:"#2a4a6f", padding:"6px 12px", textAlign:"center", borderRadius:"0 0 0 0" }}>
                <div style={{ fontWeight:700, fontSize:16, color:"#7dd3fc" }}>{col.ideas.toLocaleString()}</div>
                <div style={{ fontSize:10, color:"rgba(255,255,255,0.6)" }}>Ideas</div>
              </div>

              {/* Cards */}
              <div style={{ flex:1, background:"#f9f8f6", borderRadius:"0 0 6px 6px", padding:"8px", display:"flex", flexDirection:"column", gap:6, border:"1px solid #e5e7eb", borderTop:"none" }}>
                {(SAMPLE_CARDS[col.key] || []).map(card => (
                  <div key={card.code} style={{ background:"#fff", borderRadius:5, padding:"8px 10px", border:"1px solid #e5e7eb", cursor:"pointer" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = ""; }}
                  >
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:4 }}>
                      <code style={{ fontFamily:"IBM Plex Mono, monospace", fontSize:10, color:"#6b7280" }}>{card.code}</code>
                      <span style={{ background: SIZE_COLORS[card.size], color:"#fff", padding:"1px 5px", borderRadius:3, fontSize:10, fontWeight:700 }}>{card.size}</span>
                    </div>
                    <div style={{ fontSize:12, color:"#1a1a2e", lineHeight:1.3, marginBottom:6 }}>{card.name}</div>
                    <span style={{ background: PRIORITY_COLORS[card.priority], color: PRIORITY_TEXT[card.priority], padding:"2px 6px", borderRadius:3, fontSize:10, fontWeight:600 }}>{card.priority}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
