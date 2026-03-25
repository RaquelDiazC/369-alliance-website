/**
 * 369 Alliance System – Action Manager (Main Dashboard)
 * Tabs: Proactive Insp | From FORM | CLIENT
 * Features: project codes P/F/C, Client column, Role column,
 *           red rows for new FORM entries, convert-to-client popup,
 *           duplicate address detection with combine option,
 *           per-column filter/sort popovers (3-line icon) on all columns from PROJ CODE
 */
import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import {
  getProjects, addProject, updateProject, convertToClient, getNextProjectCode, markClientViewed,
  addBooking, getNextBooking, cancelClient,
  PROACTIVE_STAGES, RISK_CATEGORIES, PROJECT_OUTCOMES, INSPECTION_TYPES,
  DBP_INSPECTORS, OC_INSPECTORS, ALL_INSPECTORS, DBP_TYPES, BUILDING_CLASSES,
  TABS, SELECTED_BY_OPTIONS, CLIENT_ROLES,
  type Project, type TabType, type Stage, type RiskCategory,
  type ProjectOutcome, type InspectionType, type DBPPractitioner, type ClientRole,
  type BookingReason
} from "@/lib/data";
import ReportScreen from "@/components/ReportScreen";
import OrderScreen from "@/components/OrderScreen";
import HistoryScreen from "@/components/HistoryScreen";
import ToolsScreen from "@/components/ToolsScreen";
import ProjectModal from "@/components/ProjectModal";
import ViewModal from "@/components/ViewModal";
import BookInspectionModal from "@/components/BookInspectionModal";
import BookingModal from "@/components/BookingModal";
import MapMonitor from "@/components/MapMonitor";

// ─── Badge helpers ────────────────────────────────────────────────────────────
function getRiskBadge(r: RiskCategory) {
  if (r === "Low") return <span className="badge-low" style={{ padding:"2px 8px", borderRadius:4, fontSize:11, fontWeight:600 }}>Low</span>;
  if (r === "Medium") return <span className="badge-medium" style={{ padding:"2px 8px", borderRadius:4, fontSize:11, fontWeight:600 }}>Medium</span>;
  return <span className="badge-high" style={{ padding:"2px 8px", borderRadius:4, fontSize:11, fontWeight:600 }}>High</span>;
}
function getOutcomeBadge(o: ProjectOutcome) {
  const cls = o === "WIP" ? "badge-wip"
    : o === "SWO" ? "badge-swo"
    : o.includes("BWRO") ? "badge-bwro"
    : o.includes("Prohibition") ? "badge-prohibition"
    : o === "Closed" ? "badge-closed"
    : "badge-ro";
  return <span className={cls} style={{ padding:"2px 8px", borderRadius:4, fontSize:11, fontWeight:600 }}>{o}</span>;
}
function getRoleBadge(role?: ClientRole) {
  if (!role) return null;
  const colors: Record<string, string> = {
    "Developer": "#1e3a5f", "Builder": "#2d6a4f", "PCA": "#5b21b6",
    "DBP": "#7A6342", "BP": "#0f4c81", "Strata": "#c0392b",
    "Building Manager": "#374151", "Owners": "#6b21a8",
  };
  return <span style={{ background: colors[role] || "#374151", color:"#fff", padding:"2px 7px", borderRadius:4, fontSize:11, fontWeight:600, whiteSpace:"nowrap" }}>{role}</span>;
}

// ─── Three-line filter icon SVG ───────────────────────────────────────────────
function FilterIcon({ active }: { active: boolean }) {
  return (
    <svg width="12" height="10" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink:0 }}>
      <rect x="0" y="0" width="12" height="1.5" rx="0.75" fill={active ? "#A68A64" : "currentColor"} />
      <rect x="2" y="4" width="8" height="1.5" rx="0.75" fill={active ? "#A68A64" : "currentColor"} />
      <rect x="4" y="8" width="4" height="1.5" rx="0.75" fill={active ? "#A68A64" : "currentColor"} />
    </svg>
  );
}

// ─── Per-column filter/sort popover ──────────────────────────────────────────
interface ColFilterProps {
  label: string;
  colKey: string;
  filterValue: string;
  sortKey: string | null;
  sortDir: "asc" | "desc";
  onFilter: (colKey: string, value: string) => void;
  onSort: (colKey: string, dir: "asc" | "desc") => void;
  onClear: (colKey: string) => void;
}

function ColFilter({ label, colKey, filterValue, sortKey, sortDir, onFilter, onSort, onClear }: ColFilterProps) {
  const [open, setOpen] = useState(false);
  const [inputVal, setInputVal] = useState(filterValue);
  const ref = useRef<HTMLDivElement>(null);
  const isActive = filterValue !== "" || sortKey === colKey;

  // Sync input when external filterValue changes (e.g. tab switch clears all)
  useEffect(() => { setInputVal(filterValue); }, [filterValue]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function applyFilter(val: string) {
    setInputVal(val);
    onFilter(colKey, val);
  }

  function handleSort(dir: "asc" | "desc") {
    onSort(colKey, dir);
    setOpen(false);
  }

  function handleClear() {
    setInputVal("");
    onClear(colKey);
    setOpen(false);
  }

  return (
    <div ref={ref} style={{ position:"relative", display:"inline-flex", alignItems:"center" }}>
      <button
        onClick={() => setOpen(o => !o)}
        title={`Filter / sort ${label}`}
        style={{
          background: isActive ? "rgba(166,138,100,0.18)" : "rgba(255,255,255,0.12)",
          border: isActive ? "1px solid #A68A64" : "1px solid rgba(255,255,255,0.2)",
          borderRadius: 3,
          color: isActive ? "#A68A64" : "rgba(255,255,255,0.7)",
          cursor: "pointer",
          padding: "2px 4px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          lineHeight: 1,
          marginLeft: 4,
        }}
      >
        <FilterIcon active={isActive} />
      </button>

      {open && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 6px)",
          left: 0,
          zIndex: 8000,
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          boxShadow: "0 8px 28px rgba(0,0,0,0.18)",
          minWidth: 220,
          padding: "12px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#374151", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:2 }}>
            {label}
          </div>

          {/* Type-to-filter */}
          <input
            autoFocus
            type="text"
            placeholder={`Filter by ${label}...`}
            value={inputVal}
            onChange={e => applyFilter(e.target.value)}
            style={{
              border: "1px solid #d1d5db", borderRadius: 5, padding: "7px 10px",
              fontSize: 12, color: "#1a1a2e", outline: "none",
              fontFamily: "IBM Plex Sans, sans-serif",
            }}
          />

          {/* Sort buttons */}
          <div style={{ display:"flex", gap:6 }}>
            <button
              onClick={() => handleSort("asc")}
              style={{
                flex:1, padding:"6px 0", fontSize:11, fontWeight:600, borderRadius:4, cursor:"pointer",
                border: (sortKey === colKey && sortDir === "asc") ? "2px solid #1e3a5f" : "1px solid #e5e7eb",
                background: (sortKey === colKey && sortDir === "asc") ? "#1e3a5f" : "#f9fafb",
                color: (sortKey === colKey && sortDir === "asc") ? "#fff" : "#374151",
              }}
            >
              ↑ Sort A → Z
            </button>
            <button
              onClick={() => handleSort("desc")}
              style={{
                flex:1, padding:"6px 0", fontSize:11, fontWeight:600, borderRadius:4, cursor:"pointer",
                border: (sortKey === colKey && sortDir === "desc") ? "2px solid #1e3a5f" : "1px solid #e5e7eb",
                background: (sortKey === colKey && sortDir === "desc") ? "#1e3a5f" : "#f9fafb",
                color: (sortKey === colKey && sortDir === "desc") ? "#fff" : "#374151",
              }}
            >
              ↓ Sort Z → A
            </button>
          </div>

          {/* Clear */}
          {isActive && (
            <button
              onClick={handleClear}
              style={{
                padding:"5px 0", fontSize:11, fontWeight:600, borderRadius:4, cursor:"pointer",
                border:"1px solid #fca5a5", background:"#fee2e2", color:"#c0392b",
              }}
            >
              ✕ Clear filter &amp; sort
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Th with label + filter icon ─────────────────────────────────────────────
function Th({ label, colKey, minWidth, filterValue, sortKey, sortDir, onFilter, onSort, onClear, children }: {
  label: string;
  colKey: string;
  minWidth?: number;
  filterValue: string;
  sortKey: string | null;
  sortDir: "asc" | "desc";
  onFilter: (k: string, v: string) => void;
  onSort: (k: string, d: "asc" | "desc") => void;
  onClear: (k: string) => void;
  children?: React.ReactNode;
}) {
  return (
    <th style={{ minWidth: minWidth || 100 }}>
      <div style={{ display:"flex", alignItems:"center", gap:2, whiteSpace:"nowrap" }}>
        {children || label}
        <ColFilter
          label={label}
          colKey={colKey}
          filterValue={filterValue}
          sortKey={sortKey}
          sortDir={sortDir}
          onFilter={onFilter}
          onSort={onSort}
          onClear={onClear}
        />
      </div>
    </th>
  );
}

// ─── Cancel Client popup ──────────────────────────────────────────────────────
function CancelClientPopup({ project, onCancel, onConfirm }: {
  project: Project; onCancel: () => void; onConfirm: () => void;
}) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:"#fff", borderRadius:10, padding:"28px 32px", maxWidth:440, width:"90%", boxShadow:"0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
          <div style={{ width:36, height:36, background:"#fee2e2", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>🗑</div>
          <h3 style={{ margin:0, fontFamily:"Montserrat, sans-serif", fontSize:16, color:"#c0392b" }}>Cancel Client?</h3>
        </div>
        <p style={{ margin:"0 0 8px", fontSize:13, color:"#374151", lineHeight:1.6 }}>
          You are about to cancel <strong>{project.projCode}</strong> — {project.address}{project.suburb ? ", " + project.suburb : ""}.
        </p>
        <p style={{ margin:"0 0 8px", fontSize:13, color:"#374151", lineHeight:1.6 }}>
          This client will be <strong>permanently removed</strong> from the CLIENT list.
        </p>
        <ul style={{ margin:"0 0 16px", paddingLeft:18, fontSize:12, color:"#6b7280", lineHeight:1.8 }}>
          <li>Project code <strong>{project.projCode}</strong> will be <strong>retired</strong> and never reassigned.</li>
          <li>Proactive Insp and From FORM entries are <strong>not affected</strong>.</li>
          <li>This action <strong>cannot be undone</strong>.</li>
        </ul>
        <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
          <button onClick={onCancel} style={{ background:"#f3f4f6", color:"#374151", border:"1px solid #d1d5db", borderRadius:5, padding:"9px 20px", fontSize:13, fontWeight:600, cursor:"pointer" }}>Cancel</button>
          <button onClick={onConfirm} style={{ background:"linear-gradient(135deg,#c0392b,#e74c3c)", color:"#fff", border:"none", borderRadius:5, padding:"9px 20px", fontSize:13, fontWeight:700, cursor:"pointer", letterSpacing:"0.02em" }}>Proceed to Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── Convert-to-Client popup ──────────────────────────────────────────────────
function ConvertToClientPopup({ project, onCancel, onConfirm }: {
  project: Project; onCancel: () => void; onConfirm: () => void;
}) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:"#fff", borderRadius:10, padding:"28px 32px", maxWidth:400, width:"90%", boxShadow:"0 20px 60px rgba(0,0,0,0.3)" }}>
        <h3 style={{ margin:"0 0 12px", fontFamily:"Montserrat, sans-serif", fontSize:16, color:"#1a1a2e" }}>Convert to Client?</h3>
        <p style={{ margin:"0 0 8px", fontSize:13, color:"#374151", lineHeight:1.5 }}>
          Do you want to convert <strong>{project.projCode}</strong> — {project.address}, {project.suburb} — into a CLIENT entry?
        </p>
        <p style={{ margin:"0 0 20px", fontSize:12, color:"#6b7280" }}>
          A new CLIENT record will be automatically created and linked to this {project.tab} entry.
        </p>
        <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
          <button onClick={onCancel} style={{ background:"#f3f4f6", color:"#374151", border:"1px solid #d1d5db", borderRadius:5, padding:"8px 18px", fontSize:13, fontWeight:600, cursor:"pointer" }}>Cancel</button>
          <button onClick={onConfirm} style={{ background:"linear-gradient(135deg,#7A6342,#A68A64)", color:"#fff", border:"none", borderRadius:5, padding:"8px 18px", fontSize:13, fontWeight:700, cursor:"pointer" }}>Yes – Make Client</button>
        </div>
      </div>
    </div>
  );
}

// ─── Duplicate address popup ──────────────────────────────────────────────────
function DuplicateAddressPopup({ existingProjects, newProject, onCreateNew, onCombine, onClose }: {
  existingProjects: Project[]; newProject: Project;
  onCreateNew: () => void; onCombine: (targetId: string) => void; onClose: () => void;
}) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:"#fff", borderRadius:10, padding:"28px 32px", maxWidth:480, width:"90%", boxShadow:"0 20px 60px rgba(0,0,0,0.3)" }}>
        <h3 style={{ margin:"0 0 8px", fontFamily:"Montserrat, sans-serif", fontSize:16, color:"#c0392b" }}>⚠ Address Already Exists</h3>
        <p style={{ margin:"0 0 16px", fontSize:13, color:"#374151", lineHeight:1.5 }}>
          The address <strong>{newProject.address}, {newProject.suburb}</strong> already exists in the system:
        </p>
        <div style={{ background:"#f9f9f9", borderRadius:6, padding:"10px 14px", marginBottom:16 }}>
          {existingProjects.map(ep => (
            <div key={ep.id} style={{ fontSize:12, color:"#374151", marginBottom:6, display:"flex", alignItems:"center", gap:8 }}>
              <code style={{ fontWeight:700, color:"#1a1a2e" }}>{ep.projCode}</code>
              {ep.role && getRoleBadge(ep.role)}
              <span style={{ color:"#6b7280" }}>{ep.tab}</span>
              <button onClick={() => onCombine(ep.id)} style={{ marginLeft:"auto", background:"#1e3a5f", color:"#fff", border:"none", borderRadius:4, padding:"3px 10px", fontSize:11, fontWeight:600, cursor:"pointer" }}>Combine</button>
            </div>
          ))}
        </div>
        <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
          <button onClick={onClose} style={{ background:"#f3f4f6", color:"#374151", border:"1px solid #d1d5db", borderRadius:5, padding:"8px 18px", fontSize:13, fontWeight:600, cursor:"pointer" }}>Cancel</button>
          <button onClick={onCreateNew} style={{ background:"linear-gradient(135deg,#7A6342,#A68A64)", color:"#fff", border:"none", borderRadius:5, padding:"8px 18px", fontSize:13, fontWeight:700, cursor:"pointer" }}>Create New Case</button>
        </div>
      </div>
    </div>
  );
}

// ─── Helper: get string value of a project field for filtering/sorting ────────
function getFieldValue(p: Project, colKey: string): string {
  switch (colKey) {
    case "projCode":    return p.projCode;
    case "book":        return ""; // read-only display, not filterable by text
    case "role":        return p.role || "";
    case "stage":       return p.stage;
    case "risk":        return p.riskCategory;
    case "selectedBy":  return p.selectedBy;
    case "inspectors":  return p.inspectors.join(", ");
    case "address":     return `${p.address} ${p.suburb}`;
    case "postcode":    return p.postcode;
    case "bwItsoc":     return p.bwItsoc || "";
    case "daNumber":    return p.daNumber || "";
    case "ccNumber":    return p.ccNumber || "";
    case "outcome":     return p.projectOutcome;
    case "builder":     return p.builder;
    case "developer":   return p.developer;
    case "certifier":   return p.certifierName;
    case "created":     return p.created;
    case "modified":    return p.modified || "";
    default:            return "";
  }
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ActionManager() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<TabType>("Proactive Insp");
  const [search, setSearch] = useState("");
  const [screen, setScreen] = useState<"dashboard"|"report"|"order"|"history"|"tools">("dashboard");
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewProject, setViewProject] = useState<Project|null>(null);
  const [editProject, setEditProject] = useState<Project|null>(null);
  const [projects, setProjects] = useState(() => getProjects());
  const [showBookModal, setShowBookModal] = useState(false);
  const [bookModalTab, setBookModalTab] = useState<"DBP"|"OC">("DBP");
  const [bookingTarget, setBookingTarget] = useState<Project|null>(null);
  const [cancelTarget, setCancelTarget] = useState<Project|null>(null);
  const [convertTarget, setConvertTarget] = useState<Project|null>(null);
  const [dupInfo, setDupInfo] = useState<{ existing: Project[]; newProj: Project } | null>(null);
  const [pendingNewProj, setPendingNewProj] = useState<Omit<Project, "id"|"created"|"history"|"reports"|"orders"> | null>(null);

  // ── Per-column filter state: map of colKey → filter string ────────────────
  const [colFilters, setColFilters] = useState<Record<string, string>>({});
  // ── Sort state ────────────────────────────────────────────────────────────
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const refreshProjects = () => setProjects(getProjects());

  // Reset all column filters + sort when tab changes
  function switchTab(tab: TabType) {
    setActiveTab(tab);
    setColFilters({});
    setSortKey(null);
    setSortDir("asc");
  }

  const isMapMonitor = activeTab === "Map Monitor";

  const handleFilter = useCallback((colKey: string, value: string) => {
    setColFilters(prev => ({ ...prev, [colKey]: value }));
  }, []);

  const handleSort = useCallback((colKey: string, dir: "asc" | "desc") => {
    setSortKey(colKey);
    setSortDir(dir);
  }, []);

  const handleClear = useCallback((colKey: string) => {
    setColFilters(prev => { const n = { ...prev }; delete n[colKey]; return n; });
    setSortKey(prev => prev === colKey ? null : prev);
  }, []);

  // Helper: get current filter value for a column
  const cf = (colKey: string) => colFilters[colKey] || "";

  const filteredProjects = useMemo(() => {
    let list = projects.filter(p => {
      if (p.tab !== activeTab) return false;
      if (p.isCancelled) return false;
      // Global search
      if (search) {
        const s = search.toLowerCase();
        if (!p.projCode.toLowerCase().includes(s) &&
            !p.address.toLowerCase().includes(s) &&
            !p.builder.toLowerCase().includes(s) &&
            !p.developer.toLowerCase().includes(s)) return false;
      }
      // Per-column filters
      for (const [colKey, val] of Object.entries(colFilters)) {
        if (!val) continue;
        const fieldVal = getFieldValue(p, colKey).toLowerCase();
        if (!fieldVal.includes(val.toLowerCase())) return false;
      }
      return true;
    });

    // Sort
    if (sortKey) {
      list = [...list].sort((a, b) => {
        const av = getFieldValue(a, sortKey).toLowerCase();
        const bv = getFieldValue(b, sortKey).toLowerCase();
        const cmp = av.localeCompare(bv, undefined, { numeric: true, sensitivity: "base" });
        return sortDir === "asc" ? cmp : -cmp;
      });
    }

    return list;
  }, [projects, activeTab, search, colFilters, sortKey, sortDir]);

  // Show Add button on all three tabs
  const showAddBtn = true;

  function handleClientCheckbox(p: Project) {
    if (p.isClient) return;
    setConvertTarget(p);
  }

  function handleConfirmConvert() {
    if (!convertTarget) return;
    convertToClient(convertTarget.id);
    refreshProjects();
    setConvertTarget(null);
  }

  function handleViewFormProject(p: Project) {
    if (p.tab === "From FORM" && p.isNew) {
      updateProject(p.id, { isNew: false }, "System");
      const allProjects = getProjects();
      const dups = allProjects.filter(ep =>
        ep.id !== p.id &&
        ep.address.toLowerCase() === p.address.toLowerCase() &&
        ep.suburb.toLowerCase() === p.suburb.toLowerCase()
      );
      if (dups.length > 0) {
        setDupInfo({ existing: dups, newProj: p });
        refreshProjects();
        return;
      }
      refreshProjects();
    }
    setViewProject(p);
  }

  function handleCombine(targetId: string) {
    if (!dupInfo) return;
    updateProject(targetId, {
      combinedWith: [...(getProjects().find(p => p.id === targetId)?.combinedWith || []), dupInfo.newProj.projCode]
    }, "System");
    refreshProjects();
    setDupInfo(null);
    setViewProject(dupInfo.newProj);
  }

  // Shared Th props helper
  const thProps = (label: string, colKey: string, minWidth?: number) => ({
    label, colKey, minWidth: minWidth || 100,
    filterValue: cf(colKey),
    sortKey, sortDir,
    onFilter: handleFilter,
    onSort: handleSort,
    onClear: handleClear,
  });

  if (screen === "report") return <ReportScreen onBack={() => setScreen("dashboard")} projects={projects} onRefresh={refreshProjects} />;
  if (screen === "order") return <OrderScreen onBack={() => setScreen("dashboard")} projects={projects} onRefresh={refreshProjects} />;
  if (screen === "tools") return <ToolsScreen onBack={() => setScreen("dashboard")} projects={projects} />;

  return (
    <div style={{ minHeight:"100vh", background:"#f5f4f1", display:"flex", flexDirection:"column" }}>
      {/* Header */}
      <header style={{ background:"#1a1a2e", color:"#fff", height:56, display:"flex", alignItems:"center", padding:"0 20px", gap:16, flexShrink:0 }}>
        <button onClick={() => navigate("/adm")} style={{ background:"rgba(166,138,100,0.15)", border:"1px solid #A68A64", color:"#A68A64", fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:4, padding:"5px 12px", borderRadius:5, fontWeight:600, letterSpacing:"0.02em" }}>
          ← ADM
        </button>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ width:32, height:32, background:"linear-gradient(135deg,#7A6342,#A68A64)", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:13, color:"#fff" }}>369</div>
          <span style={{ fontWeight:700, fontSize:16, letterSpacing:"0.02em" }}>Action Manager</span>
        </div>
        <div style={{ flex:1 }} />
        <span style={{ fontSize:13, color:"#c5b49a" }}>Raquel Diaz</span>
        <button style={{ background:"#2d6a4f", color:"#fff", border:"none", borderRadius:4, padding:"4px 12px", fontSize:12, fontWeight:600, cursor:"pointer" }}>Help</button>
        <button style={{ background:"#c0392b", color:"#fff", border:"none", borderRadius:4, padding:"4px 12px", fontSize:12, fontWeight:600, cursor:"pointer" }} onClick={() => navigate("/")}>Logout</button>
      </header>

      {/* Tab bar */}
      <div style={{ background:"#252545", display:"flex", alignItems:"center", padding:"0 20px", gap:4, flexShrink:0 }}>
        {TABS.map((tab) => (
          <React.Fragment key={tab}>
            {tab === "Map Monitor" && <div style={{ width:1, height:28, background:"#4a9eff44", margin:"0 12px" }} />}
            <button
              onClick={() => switchTab(tab)}
              style={{
                padding:"10px 20px", border:"none", cursor:"pointer", fontSize:13, fontWeight:700,
                borderRadius:"6px 6px 0 0", marginTop:6,
                background: activeTab === tab
                  ? tab === "Map Monitor" ? "linear-gradient(135deg,#1e3a5f,#1e5fa8)" : "linear-gradient(135deg,#7A6342,#A68A64)"
                  : "rgba(255,255,255,0.06)",
                color: activeTab === tab ? "#fff" : tab === "Map Monitor" ? "#4a9eff" : "#c5b49a",
                transition:"all 0.15s",
                boxShadow: activeTab === tab ? (tab === "Map Monitor" ? "0 -2px 8px rgba(30,95,168,0.4)" : "0 -2px 8px rgba(166,138,100,0.3)") : "none",
                borderBottom: activeTab === tab ? (tab === "Map Monitor" ? "3px solid #4a9eff" : "3px solid #A68A64") : "3px solid transparent",
              }}
            >
              {tab === "Map Monitor" ? "🗺 Map Monitor" : tab}
              {tab === "From FORM" && (() => {
                const newCount = projects.filter(p => p.tab === "From FORM" && p.isNew).length;
                return newCount > 0 ? (
                  <span style={{ marginLeft:6, background:"#c0392b", color:"#fff", borderRadius:10, padding:"1px 6px", fontSize:10, fontWeight:700 }}>{newCount}</span>
                ) : null;
              })()}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Search + Action bar — hidden for Map Monitor tab */}
      {!isMapMonitor && <div style={{ background:"#fff", borderBottom:"1px solid #e5e7eb", padding:"10px 20px", display:"flex", alignItems:"center", gap:10, flexWrap:"wrap", flexShrink:0 }}>
        {/* + Add New Project — LEFT of Search, visible on all tabs */}
        <button
          onClick={() => setShowAddModal(true)}
          style={{ background:"linear-gradient(135deg,#7A6342,#A68A64)", color:"#fff", border:"none", borderRadius:5, padding:"7px 16px", fontSize:12, fontWeight:700, cursor:"pointer", letterSpacing:"0.02em", whiteSpace:"nowrap", flexShrink:0 }}
        >
          + Add New Project
        </button>
        <div style={{ position:"relative", minWidth:200, maxWidth:320 }}>
          <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"#9ca3af", fontSize:14 }}>🔍</span>
          <input
            type="text"
            placeholder="Search all projects..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width:"100%", paddingLeft:32, paddingRight:10, paddingTop:7, paddingBottom:7, border:"1px solid #d1d5db", borderRadius:6, fontSize:13, outline:"none", fontFamily:"IBM Plex Sans, sans-serif" }}
          />
        </div>

        {/* Active filter chips */}
        {Object.entries(colFilters).filter(([,v]) => v).map(([k, v]) => (
          <span key={k} style={{ background:"#fef3c7", border:"1px solid #fbbf24", borderRadius:12, padding:"3px 10px", fontSize:11, fontWeight:600, color:"#92400e", display:"flex", alignItems:"center", gap:5 }}>
            {k}: "{v}"
            <button onClick={() => handleClear(k)} style={{ background:"none", border:"none", cursor:"pointer", color:"#92400e", fontSize:13, lineHeight:1, padding:0 }}>×</button>
          </span>
        ))}
        {sortKey && (
          <span style={{ background:"#eff6ff", border:"1px solid #93c5fd", borderRadius:12, padding:"3px 10px", fontSize:11, fontWeight:600, color:"#1e40af", display:"flex", alignItems:"center", gap:5 }}>
            Sort: {sortKey} {sortDir === "asc" ? "↑" : "↓"}
            <button onClick={() => { setSortKey(null); setSortDir("asc"); }} style={{ background:"none", border:"none", cursor:"pointer", color:"#1e40af", fontSize:13, lineHeight:1, padding:0 }}>×</button>
          </span>
        )}

        <div style={{ flex:1 }} />

        <button onClick={() => setScreen("report")} style={{ background:"#1e3a5f", color:"#fff", border:"none", borderRadius:5, padding:"7px 14px", fontSize:12, fontWeight:600, cursor:"pointer" }}>Report</button>
        <button onClick={() => setScreen("order")} style={{ background:"#7A6342", color:"#fff", border:"none", borderRadius:5, padding:"7px 14px", fontSize:12, fontWeight:600, cursor:"pointer" }}>ORDER</button>
        <button onClick={() => setScreen("history")} style={{ background:"#2d6a4f", color:"#fff", border:"none", borderRadius:5, padding:"7px 14px", fontSize:12, fontWeight:600, cursor:"pointer" }}>History</button>
        <button onClick={() => setScreen("tools")} style={{ background:"#5b21b6", color:"#fff", border:"none", borderRadius:5, padding:"7px 14px", fontSize:12, fontWeight:600, cursor:"pointer" }}>Tools</button>
        <button onClick={() => navigate("/data")} style={{ background:"#0f4c81", color:"#fff", border:"none", borderRadius:5, padding:"7px 14px", fontSize:12, fontWeight:600, cursor:"pointer" }}>Data</button>

      </div>}

      {/* Map Monitor Tab */}
      {isMapMonitor && (
        <div style={{ height:"calc(100vh - 56px - 44px)", overflow:"hidden", display:"flex", flexDirection:"column" }}>
          <MapMonitor />
        </div>
      )}

      {/* Table */}
      {!isMapMonitor && <div style={{ flex:1, overflow:"hidden" }}>
        <div className="table-scroll-wrap" style={{ maxHeight:"calc(100vh - 170px)", margin:"12px 20px", background:"#fff", borderRadius:8, border:"1px solid #e5e7eb", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ minWidth:100 }}>ACTIONS</th>
                {(activeTab === "Proactive Insp" || activeTab === "From FORM") && (
                  <th style={{ minWidth:70 }}>CLIENT</th>
                )}
                <Th {...thProps("PROJ CODE", "projCode", 110)} />
                <th style={{ minWidth:110 }}>BOOK</th>
                {(activeTab === "From FORM" || activeTab === "CLIENT") && (
                  <Th {...thProps("ROLE", "role", 110)} />
                )}
                <Th {...thProps("STAGE", "stage", 120)} />
                <Th {...thProps("RISK CATEGORY", "risk", 120)} />
                <Th {...thProps("SELECTED BY", "selectedBy", 140)} />
                <Th {...thProps("INSPECTOR(S)", "inspectors", 160)} />
                <Th {...thProps("ADDRESS", "address", 200)} />
                <Th {...thProps("POSTCODE", "postcode", 100)} />
                <Th {...thProps("BW/ITSOC", "bwItsoc", 130)} />
                <Th {...thProps("DA NUMBER", "daNumber", 130)} />
                <Th {...thProps("CC NUMBER", "ccNumber", 130)} />
                <Th {...thProps("OUTCOME", "outcome", 130)} />
                <Th {...thProps("BUILDER", "builder", 160)} />
                <Th {...thProps("DEVELOPER", "developer", 160)} />
                <Th {...thProps("CERTIFIER", "certifier", 160)} />
                <Th {...thProps("CREATED", "created", 160)} />
                <Th {...thProps("MODIFIED", "modified", 220)} />
              </tr>
            </thead>
            <tbody>
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={22} style={{ textAlign:"center", padding:"40px 0", color:"#9ca3af", fontSize:14 }}>
                    No data available
                  </td>
                </tr>
              ) : filteredProjects.map(p => {
                const isNewForm = p.tab === "From FORM" && p.isNew;
                const isNewClient = p.tab === "CLIENT" && p.isNewClient;
                const rowStyle: React.CSSProperties = isNewForm || isNewClient
                  ? { background:"#fff5f5", borderLeft:"3px solid #c0392b" }
                  : {};
                const hasCombined = p.combinedWith && p.combinedWith.length > 0;
                return (
                  <tr key={p.id} style={rowStyle}>
                    {/* ACTIONS */}
                    <td>
                      <div style={{ display:"flex", gap:4 }}>
                        <button
                          onClick={() => {
                            if (p.tab === "From FORM") {
                              handleViewFormProject(p);
                            } else {
                              if (p.tab === "CLIENT" && p.isNewClient) {
                                markClientViewed(p.id);
                                refreshProjects();
                              }
                              setViewProject(p);
                            }
                          }}
                          style={{
                            background: (isNewForm || isNewClient) ? "#8b0000" : "#1e3a5f",
                            color:"#fff", border:"none", borderRadius:3,
                            padding:"3px 8px", fontSize:11, fontWeight:600, cursor:"pointer"
                          }}
                        >
                          View
                        </button>
                        <button onClick={() => setEditProject(p)} style={{ background:"#A68A64", color:"#fff", border:"none", borderRadius:3, padding:"3px 8px", fontSize:11, fontWeight:600, cursor:"pointer" }}>Edit</button>
                        {activeTab === "CLIENT" && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setCancelTarget(p); }}
                            title="Cancel this client (client pulled out)"
                            style={{ background:"#fee2e2", color:"#c0392b", border:"1px solid #fca5a5", borderRadius:3, padding:"3px 7px", fontSize:13, fontWeight:700, cursor:"pointer", lineHeight:1, display:"flex", alignItems:"center", justifyContent:"center" }}
                          >
                            🗑
                          </button>
                        )}
                      </div>
                    </td>
                    {/* CLIENT checkbox */}
                    {(activeTab === "Proactive Insp" || activeTab === "From FORM") && (
                      <td style={{ textAlign:"center" }}>
                        <input
                          type="checkbox"
                          checked={!!p.isClient}
                          onChange={() => handleClientCheckbox(p)}
                          style={{ width:15, height:15, cursor: p.isClient ? "default" : "pointer", accentColor:"#A68A64" }}
                          title={p.isClient ? `Client: ${p.clientCode}` : "Convert to Client"}
                        />
                        {p.isClient && p.clientCode && (
                          <div style={{ fontSize:9, color:"#A68A64", fontWeight:700, marginTop:1 }}>{p.clientCode}</div>
                        )}
                      </td>
                    )}
                    {/* PROJ CODE */}
                    <td>
                      <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                        <code style={{ fontFamily:"IBM Plex Mono, monospace", fontWeight:600, color: isNewForm ? "#8b0000" : "#1a1a2e" }}>{p.projCode}</code>
                        {hasCombined && (
                          <span title={`Combined with: ${p.combinedWith?.join(", ")}`} style={{ fontSize:9, background:"#f59e0b", color:"#fff", borderRadius:3, padding:"1px 4px", fontWeight:700 }}>+{p.combinedWith?.length}</span>
                        )}
                      </div>
                    </td>
                    {/* BOOK — read-only */}
                    <td style={{ textAlign:"center" }}>
                      {(() => {
                        const next = getNextBooking(p);
                        if (next) {
                          const [y,m,d] = next.date.split("-");
                          return (
                            <span title={`Next: ${next.reason} on ${d}/${m}/${y}`} style={{ background:"#e8f4fd", border:"1px solid #93c5fd", borderRadius:4, padding:"3px 7px", fontSize:11, fontWeight:700, color:"#1e3a5f", whiteSpace:"nowrap", display:"inline-block" }}>
                              {d}/{m}/{y}
                            </span>
                          );
                        }
                        return <span style={{ color:"#9ca3af", fontSize:14, fontWeight:400 }}>—</span>;
                      })()}
                    </td>
                    {/* ROLE */}
                    {(activeTab === "From FORM" || activeTab === "CLIENT") && (
                      <td>{getRoleBadge(p.role)}</td>
                    )}
                    <td style={{ fontSize:12 }}>{p.stage}</td>
                    <td>{getRiskBadge(p.riskCategory)}</td>
                    <td style={{ fontSize:12 }}>{p.selectedBy}</td>
                    <td style={{ fontSize:12 }}>{p.inspectors.length > 0 ? p.inspectors.join(", ") : <span style={{ color:"#9ca3af" }}>—</span>}</td>
                    <td style={{ fontSize:12, maxWidth:200, overflow:"hidden", textOverflow:"ellipsis" }}>{p.address}{p.suburb ? `, ${p.suburb}` : ""}</td>
                    <td style={{ fontSize:12 }}>{p.postcode}</td>
                    <td style={{ fontSize:12 }}><code style={{ fontFamily:"IBM Plex Mono, monospace" }}>{p.bwItsoc || "—"}</code></td>
                    <td style={{ fontSize:12 }}><code style={{ fontFamily:"IBM Plex Mono, monospace" }}>{p.daNumber || "—"}</code></td>
                    <td style={{ fontSize:12 }}><code style={{ fontFamily:"IBM Plex Mono, monospace" }}>{p.ccNumber || "—"}</code></td>
                    <td>{getOutcomeBadge(p.projectOutcome)}</td>
                    <td style={{ fontSize:12 }}>{p.builder || <span style={{ color:"#9ca3af" }}>—</span>}</td>
                    <td style={{ fontSize:12 }}>{p.developer || <span style={{ color:"#9ca3af" }}>—</span>}</td>
                    <td style={{ fontSize:12 }}>{p.certifierName || <span style={{ color:"#9ca3af" }}>—</span>}</td>
                    <td style={{ fontSize:11, color:(isNewForm || isNewClient) ? "#8b0000" : "#6b7280", fontFamily:"IBM Plex Mono, monospace", fontWeight:(isNewForm || isNewClient) ? 700 : 400 }}>{p.created}</td>
                    <td style={{ fontSize:11, color: p.modified ? "#1e3a5f" : "#9ca3af", fontFamily:"IBM Plex Mono, monospace", maxWidth:220 }}>
                      {p.modified || <span style={{ color:"#9ca3af" }}>—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ padding:"8px 16px", fontSize:12, color:"#6b7280", borderTop:"1px solid #f0ede8", background:"#fafaf9" }}>
            Total: {filteredProjects.length}
          </div>
        </div>
      </div>}

      {/* Add/Edit Modal */}
      {(showAddModal || editProject) && (
        <ProjectModal
          mode={editProject ? "edit" : "add"}
          project={editProject || undefined}
          activeTab={activeTab}
          nextCode={editProject ? undefined : getNextProjectCode(activeTab)}
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
      {viewProject && <ViewModal project={viewProject} onClose={() => setViewProject(null)} />}

      {/* Book Inspection Modal (legacy) */}
      {showBookModal && (
        <BookInspectionModal projects={projects} defaultTab={bookModalTab} onClose={() => setShowBookModal(false)} />
      )}

      {/* Booking Modal */}
      {bookingTarget && (
        <BookingModal
          projectCode={bookingTarget.projCode}
          projectAddress={`${bookingTarget.address}${bookingTarget.suburb ? ', ' + bookingTarget.suburb : ''}`}
          existingBookings={bookingTarget.bookings || []}
          onClose={() => setBookingTarget(null)}
          onConfirm={(date, reason, description) => {
            addBooking(bookingTarget.id, { date, reason, description }, "Raquel Diaz");
            refreshProjects();
            setBookingTarget(null);
          }}
        />
      )}

      {/* History Screen */}
      {screen === "history" && <HistoryScreen onBack={() => setScreen("dashboard")} projects={projects} />}

      {/* Cancel Client popup */}
      {cancelTarget && (
        <CancelClientPopup
          project={cancelTarget}
          onCancel={() => setCancelTarget(null)}
          onConfirm={() => { cancelClient(cancelTarget.id); refreshProjects(); setCancelTarget(null); }}
        />
      )}

      {/* Convert to Client popup */}
      {convertTarget && (
        <ConvertToClientPopup
          project={convertTarget}
          onCancel={() => setConvertTarget(null)}
          onConfirm={handleConfirmConvert}
        />
      )}

      {/* Duplicate address popup */}
      {dupInfo && (
        <DuplicateAddressPopup
          existingProjects={dupInfo.existing}
          newProject={dupInfo.newProj}
          onCreateNew={() => { setDupInfo(null); setViewProject(dupInfo.newProj); }}
          onCombine={handleCombine}
          onClose={() => setDupInfo(null)}
        />
      )}
    </div>
  );
}
