/**
 * 369 Alliance System – Action Manager (Main Dashboard)
 * Design: Authoritative Dark Navy with Bronze Accents
 * Features: INTEL/OC Inspections/OC/DBP tabs, filters, project table,
 *           View/Edit modals, Report/Order/History/Tools screens
 */
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import {
  getProjects, addProject, updateProject,
  STAGES, RISK_CATEGORIES, PROJECT_OUTCOMES, INSPECTION_TYPES, INSPECTORS,
  DBP_TYPES, BUILDING_CLASSES, TABS,
  type Project, type TabType, type Stage, type RiskCategory,
  type ProjectOutcome, type InspectionType, type DBPPractitioner
} from "@/lib/data";
import ReportScreen from "@/components/ReportScreen";
import OrderScreen from "@/components/OrderScreen";
import HistoryScreen from "@/components/HistoryScreen";
import ToolsScreen from "@/components/ToolsScreen";
import ProjectModal from "@/components/ProjectModal";
import ViewModal from "@/components/ViewModal";
import BookInspectionModal from "@/components/BookInspectionModal";

const INTEL_STAGES = ["Site Preparation","Excavation","Basement","GL","Facade"];
const OC_STAGES = ["CAS complaint","Planning Portal","Project Intervene","DBP referral","Other referral"];

function getRiskBadge(r: RiskCategory) {
  if (r === "Low") return <span className="badge-low" style={{ padding:"2px 8px", borderRadius:4, fontSize:11, fontWeight:600 }}>Low</span>;
  if (r === "Medium") return <span className="badge-medium" style={{ padding:"2px 8px", borderRadius:4, fontSize:11, fontWeight:600 }}>Medium</span>;
  return <span className="badge-high" style={{ padding:"2px 8px", borderRadius:4, fontSize:11, fontWeight:600 }}>High</span>;
}

function getOutcomeBadge(o: ProjectOutcome) {
  const cls = o === "WIP" ? "badge-wip" : o === "SWO" ? "badge-swo" : o.includes("BWRO") ? "badge-bwro" : o.includes("RO") ? "badge-ro" : "badge-closed";
  return <span className={cls} style={{ padding:"2px 8px", borderRadius:4, fontSize:11, fontWeight:600 }}>{o}</span>;
}

export default function ActionManager() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<TabType>("INTEL");
  const [search, setSearch] = useState("");
  const [screen, setScreen] = useState<"dashboard"|"report"|"order"|"history"|"tools">("dashboard");
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewProject, setViewProject] = useState<Project|null>(null);
  const [editProject, setEditProject] = useState<Project|null>(null);
  const [projects, setProjects] = useState(() => getProjects());
  const [showBookModal, setShowBookModal] = useState(false);
  const [bookModalTab, setBookModalTab] = useState<"DBP"|"OC">("DBP");

  // Filters
  const [filterStage, setFilterStage] = useState<string>("");
  const [filterRisk, setFilterRisk] = useState<string>("");
  const [filterSelectedBy, setFilterSelectedBy] = useState<string>("");
  const [filterInspector, setFilterInspector] = useState<string>("");
  const [filterMonth, setFilterMonth] = useState<string>("");

  const refreshProjects = () => setProjects(getProjects());

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      if (activeTab === "INTEL" && p.tab !== "INTEL") return false;
      if (activeTab === "OC Inspections" && p.tab !== "OC Inspections") return false;
      if (activeTab === "OC" && p.tab !== "OC") return false;
      if (activeTab === "DBP" && p.tab !== "DBP") return false;
      if (filterStage && p.stage !== filterStage) return false;
      if (filterRisk && p.riskCategory !== filterRisk) return false;
      if (filterSelectedBy && p.selectedBy !== filterSelectedBy) return false;
      if (filterInspector && !p.inspectors.includes(filterInspector)) return false;
      if (search) {
        const s = search.toLowerCase();
        if (!p.projCode.toLowerCase().includes(s) &&
            !p.address.toLowerCase().includes(s) &&
            !p.builder.toLowerCase().includes(s) &&
            !p.developer.toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [projects, activeTab, filterStage, filterRisk, filterSelectedBy, filterInspector, search]);

  const showAddBtn = activeTab === "INTEL" || activeTab === "OC Inspections";

  if (screen === "report") return <ReportScreen onBack={() => setScreen("dashboard")} projects={projects} onRefresh={refreshProjects} />;
  if (screen === "order") return <OrderScreen onBack={() => setScreen("dashboard")} projects={projects} onRefresh={refreshProjects} />;
  if (screen === "tools") return <ToolsScreen onBack={() => setScreen("dashboard")} projects={projects} />;

  return (
    <div style={{ minHeight: "100vh", background: "#f5f4f1", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header style={{ background: "#1a1a2e", color: "#fff", height: 56, display: "flex", alignItems: "center", padding: "0 20px", gap: 16, flexShrink: 0 }}>
        <button onClick={() => navigate("/")} style={{ background: "none", border: "none", color: "#A68A64", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, padding: "4px 8px", borderRadius: 4 }}>
          ← Home
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width:32, height:32, background:"linear-gradient(135deg,#7A6342,#A68A64)", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:13, color:"#fff" }}>369</div>
          <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: "0.02em" }}>Action Manager</span>
        </div>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 13, color: "#c5b49a" }}>Raquel Diaz</span>
        <button style={{ background:"#2d6a4f", color:"#fff", border:"none", borderRadius:4, padding:"4px 12px", fontSize:12, fontWeight:600, cursor:"pointer" }}>Help</button>
        <button style={{ background:"#c0392b", color:"#fff", border:"none", borderRadius:4, padding:"4px 12px", fontSize:12, fontWeight:600, cursor:"pointer" }} onClick={() => navigate("/")}>Logout</button>
      </header>

      {/* Tab bar */}
      <div style={{ background: "#252545", display: "flex", alignItems: "center", padding: "0 20px", gap: 4, flexShrink: 0 }}>
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setFilterStage(""); setFilterRisk(""); setFilterSelectedBy(""); setFilterInspector(""); }}
            style={{
              padding: "10px 18px", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
              borderRadius: "6px 6px 0 0", marginTop: 6,
              background: activeTab === tab ? "linear-gradient(135deg,#7A6342,#A68A64)" : "transparent",
              color: activeTab === tab ? "#fff" : "#c5b49a",
              transition: "all 0.15s"
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Search + Action bar */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "10px 20px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", flexShrink: 0 }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"#9ca3af", fontSize:14 }}>🔍</span>
          <input
            type="text"
            placeholder="Search all projects..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width:"100%", paddingLeft:32, paddingRight:10, paddingTop:7, paddingBottom:7, border:"1px solid #d1d5db", borderRadius:6, fontSize:13, outline:"none", fontFamily:"IBM Plex Sans, sans-serif" }}
          />
        </div>

        {/* Quick filters */}
        <select value={filterStage} onChange={e => setFilterStage(e.target.value)} style={{ border:"1px solid #d1d5db", borderRadius:6, padding:"7px 10px", fontSize:12, color:"#374151", background:"#fff", cursor:"pointer" }}>
          <option value="">Stage: All</option>
          {(activeTab === "OC Inspections" ? OC_STAGES : INTEL_STAGES).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterRisk} onChange={e => setFilterRisk(e.target.value)} style={{ border:"1px solid #d1d5db", borderRadius:6, padding:"7px 10px", fontSize:12, color:"#374151", background:"#fff", cursor:"pointer" }}>
          <option value="">Risk: All</option>
          {RISK_CATEGORIES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={filterSelectedBy} onChange={e => setFilterSelectedBy(e.target.value)} style={{ border:"1px solid #d1d5db", borderRadius:6, padding:"7px 10px", fontSize:12, color:"#374151", background:"#fff", cursor:"pointer" }}>
          <option value="">Selected By: All</option>
          {INSPECTORS.map(i => <option key={i} value={i}>{i}</option>)}
        </select>
        <select value={filterInspector} onChange={e => setFilterInspector(e.target.value)} style={{ border:"1px solid #d1d5db", borderRadius:6, padding:"7px 10px", fontSize:12, color:"#374151", background:"#fff", cursor:"pointer" }}>
          <option value="">Inspector: All</option>
          {INSPECTORS.map(i => <option key={i} value={i}>{i}</option>)}
        </select>

        <div style={{ flex: 1 }} />

        <button onClick={() => setScreen("report")} style={{ background:"#1e3a5f", color:"#fff", border:"none", borderRadius:5, padding:"7px 14px", fontSize:12, fontWeight:600, cursor:"pointer" }}>Report</button>
        <button onClick={() => setScreen("order")} style={{ background:"#7A6342", color:"#fff", border:"none", borderRadius:5, padding:"7px 14px", fontSize:12, fontWeight:600, cursor:"pointer" }}>ORDER</button>
        <button onClick={() => setScreen("history")} style={{ background:"#2d6a4f", color:"#fff", border:"none", borderRadius:5, padding:"7px 14px", fontSize:12, fontWeight:600, cursor:"pointer" }}>History</button>
        <button onClick={() => setScreen("tools")} style={{ background:"#5b21b6", color:"#fff", border:"none", borderRadius:5, padding:"7px 14px", fontSize:12, fontWeight:600, cursor:"pointer" }}>Tools</button>
        <button onClick={() => navigate("/data")} style={{ background:"#0f4c81", color:"#fff", border:"none", borderRadius:5, padding:"7px 14px", fontSize:12, fontWeight:600, cursor:"pointer" }}>Data</button>
        {showAddBtn && (
          <button onClick={() => setShowAddModal(true)} style={{ background:"linear-gradient(135deg,#7A6342,#A68A64)", color:"#fff", border:"none", borderRadius:5, padding:"7px 16px", fontSize:12, fontWeight:700, cursor:"pointer", letterSpacing:"0.02em" }}>
            + Add New Project
          </button>
        )}
        {!showAddBtn && (
          <button onClick={() => { setBookModalTab(activeTab === "DBP" ? "DBP" : "OC"); setShowBookModal(true); }} style={{ background:"#1a1a2e", color:"#fff", border:"none", borderRadius:5, padding:"7px 16px", fontSize:12, fontWeight:700, cursor:"pointer" }}>
            Book Inspection
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflow: "hidden", padding: "0 0 0 0" }}>
        <div className="table-scroll-wrap" style={{ maxHeight: "calc(100vh - 170px)", margin: "12px 20px", background: "#fff", borderRadius: 8, border: "1px solid #e5e7eb", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ minWidth: 100 }}>ACTIONS</th>
                <th style={{ minWidth: 90 }}>PROJ CODE</th>
                <th style={{ minWidth: 120 }}>STAGE</th>
                <th style={{ minWidth: 110 }}>RISK CATEGORY</th>
                <th style={{ minWidth: 130 }}>SELECTED BY</th>
                <th style={{ minWidth: 150 }}>INSPECTOR(S)</th>
                <th style={{ minWidth: 200 }}>ADDRESS</th>
                <th style={{ minWidth: 90 }}>POSTCODE</th>
                <th style={{ minWidth: 120 }}>BW/ITSOC</th>
                <th style={{ minWidth: 120 }}>DA NUMBER</th>
                <th style={{ minWidth: 120 }}>CC NUMBER</th>
                <th style={{ minWidth: 120 }}>OUTCOME</th>
                <th style={{ minWidth: 150 }}>BUILDER</th>
                <th style={{ minWidth: 150 }}>DEVELOPER</th>
                <th style={{ minWidth: 150 }}>CERTIFIER</th>
                <th style={{ minWidth: 140 }}>CREATED</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={16} style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af", fontSize: 14 }}>
                    No data available
                  </td>
                </tr>
              ) : filteredProjects.map(p => (
                <tr key={p.id}>
                  <td>
                    <div style={{ display:"flex", gap:4 }}>
                      <button onClick={() => setViewProject(p)} style={{ background:"#1e3a5f", color:"#fff", border:"none", borderRadius:3, padding:"3px 8px", fontSize:11, fontWeight:600, cursor:"pointer" }}>View</button>
                      <button onClick={() => setEditProject(p)} style={{ background:"#A68A64", color:"#fff", border:"none", borderRadius:3, padding:"3px 8px", fontSize:11, fontWeight:600, cursor:"pointer" }}>Edit</button>
                    </div>
                  </td>
                  <td><code style={{ fontFamily:"IBM Plex Mono, monospace", fontWeight:600, color:"#1a1a2e" }}>{p.projCode}</code></td>
                  <td style={{ fontSize:12 }}>{p.stage}</td>
                  <td>{getRiskBadge(p.riskCategory)}</td>
                  <td style={{ fontSize:12 }}>{p.selectedBy}</td>
                  <td style={{ fontSize:12 }}>{p.inspectors.join(", ")}</td>
                  <td style={{ fontSize:12, maxWidth:200, overflow:"hidden", textOverflow:"ellipsis" }}>{p.address}, {p.suburb}</td>
                  <td style={{ fontSize:12 }}>{p.postcode}</td>
                  <td style={{ fontSize:12 }}><code style={{ fontFamily:"IBM Plex Mono, monospace" }}>{p.bwItsoc}</code></td>
                  <td style={{ fontSize:12 }}><code style={{ fontFamily:"IBM Plex Mono, monospace" }}>{p.daNumber}</code></td>
                  <td style={{ fontSize:12 }}><code style={{ fontFamily:"IBM Plex Mono, monospace" }}>{p.ccNumber}</code></td>
                  <td>{getOutcomeBadge(p.projectOutcome)}</td>
                  <td style={{ fontSize:12 }}>{p.builder}</td>
                  <td style={{ fontSize:12 }}>{p.developer}</td>
                  <td style={{ fontSize:12 }}>{p.certifierName}</td>
                  <td style={{ fontSize:11, color:"#6b7280", fontFamily:"IBM Plex Mono, monospace" }}>{p.created}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding:"8px 16px", fontSize:12, color:"#6b7280", borderTop:"1px solid #f0ede8", background:"#fafaf9" }}>
            Total: {filteredProjects.length}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editProject) && (
        <ProjectModal
          mode={editProject ? "edit" : "add"}
          project={editProject || undefined}
          activeTab={activeTab}
          onClose={() => { setShowAddModal(false); setEditProject(null); }}
          onSave={(data) => {
            if (editProject) {
              updateProject(editProject.id, data, "Raquel Diaz");
            } else {
              addProject({ ...data, tab: activeTab } as any);
            }
            refreshProjects();
            setShowAddModal(false);
            setEditProject(null);
          }}
        />
      )}

      {/* View Modal */}
      {viewProject && (
        <ViewModal project={viewProject} onClose={() => setViewProject(null)} />
      )}

      {/* Book Inspection Modal */}
      {showBookModal && (
        <BookInspectionModal
          projects={projects}
          defaultTab={bookModalTab}
          onClose={() => setShowBookModal(false)}
        />
      )}

      {/* History Modal Overlay */}
      {screen === "history" && (
        <HistoryScreen onBack={() => setScreen("dashboard")} projects={projects} />
      )}
    </div>
  );
}
