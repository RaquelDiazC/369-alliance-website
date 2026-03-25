/**
 * 369 Alliance System – History Screen (Popup Modal)
 * Design: Authoritative Dark Navy with Bronze Accents
 * Opens as a popup overlay – does NOT block navigation
 */
import { useState, useMemo } from "react";
import { type Project } from "@/lib/data";

interface Props {
  onBack: () => void;
  projects: Project[];
}

const ACTION_COLORS: Record<string, { bg: string; text: string }> = {
  "Project Created": { bg:"#dcfce7", text:"#166534" },
  "Project Modified": { bg:"#dbeafe", text:"#1e40af" },
  "Stage Updated": { bg:"#fef9c3", text:"#92400e" },
  "Report Uploaded": { bg:"#ede9fe", text:"#5b21b6" },
  "Order Uploaded": { bg:"#fee2e2", text:"#991b1b" },
  "Project Closed": { bg:"#f3f4f6", text:"#374151" },
};

function getActionStyle(op: string) {
  return ACTION_COLORS[op] || { bg:"#f3f4f6", text:"#374151" };
}

export default function HistoryScreen({ onBack, projects }: Props) {
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [filterAction, setFilterAction] = useState("");

  const allHistory = useMemo(() => {
    const base = selectedProjectId
      ? (projects.find(p => p.id === selectedProjectId)?.history || []).map(h => {
          const p = projects.find(pr => pr.id === selectedProjectId)!;
          return { ...h, projectCode: p.projCode, address: p.address };
        })
      : projects.flatMap(p => p.history.map(h => ({ ...h, projectCode: p.projCode, address: p.address })));
    return base.filter(h => !filterAction || h.operation === filterAction);
  }, [projects, selectedProjectId, filterAction]);

  const sorted = useMemo(() => [...allHistory].sort((a, b) => b.date.localeCompare(a.date)), [allHistory]);

  const uniqueActions = useMemo(() => {
    const set = new Set<string>();
    projects.forEach(p => p.history.forEach(h => set.add(h.operation)));
    return Array.from(set);
  }, [projects]);

  return (
    <div
      className="modal-overlay"
      onClick={e => { if (e.target === e.currentTarget) onBack(); }}
    >
      <div style={{ background:"#fff", borderRadius:10, width:"min(900px, 96vw)", maxHeight:"85vh", display:"flex", flexDirection:"column", boxShadow:"0 24px 64px rgba(0,0,0,0.25)", overflow:"hidden" }}>
        {/* Header */}
        <div style={{ background:"#1a1a2e", color:"#fff", padding:"14px 20px", display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
          <div style={{ width:28, height:28, background:"linear-gradient(135deg,#7A6342,#A68A64)", borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:11, color:"#fff" }}>369</div>
          <span style={{ fontWeight:700, fontSize:15 }}>System History</span>
          <div style={{ flex:1 }} />
          <span style={{ fontSize:11, color:"rgba(255,255,255,0.5)" }}>Click outside to close</span>
          <button onClick={onBack} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.7)", fontSize:20, cursor:"pointer", lineHeight:1, marginLeft:8 }}>×</button>
        </div>

        {/* Filters */}
        <div style={{ padding:"12px 20px", borderBottom:"1px solid #e5e7eb", display:"flex", gap:12, alignItems:"center", background:"#f9f8f6", flexShrink:0 }}>
          <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
            <label style={{ fontSize:10, fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.05em" }}>Filter by Site</label>
            <select value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)} style={{ border:"1px solid #d1d5db", borderRadius:4, padding:"5px 8px", fontSize:12, background:"#fff", color:"#1a1a2e", outline:"none", minWidth:220 }}>
              <option value="">All Sites</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.address}, {p.suburb} (#{p.projCode})</option>
              ))}
            </select>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
            <label style={{ fontSize:10, fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.05em" }}>Filter by Action</label>
            <select value={filterAction} onChange={e => setFilterAction(e.target.value)} style={{ border:"1px solid #d1d5db", borderRadius:4, padding:"5px 8px", fontSize:12, background:"#fff", color:"#1a1a2e", outline:"none", minWidth:180 }}>
              <option value="">All Actions</option>
              {uniqueActions.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div style={{ marginLeft:"auto", fontSize:12, color:"#6b7280" }}>
            {sorted.length} record{sorted.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Table */}
        <div style={{ flex:1, overflowY:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead style={{ position:"sticky", top:0, zIndex:2 }}>
              <tr style={{ background:"#1a1a2e" }}>
                <th style={{ color:"#fff", padding:"8px 12px", textAlign:"left", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em", whiteSpace:"nowrap" }}>Date & Time</th>
                {!selectedProjectId && <th style={{ color:"#fff", padding:"8px 12px", textAlign:"left", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em", whiteSpace:"nowrap" }}>Site Address</th>}
                <th style={{ color:"#fff", padding:"8px 12px", textAlign:"left", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em", whiteSpace:"nowrap" }}>Action</th>
                <th style={{ color:"#fff", padding:"8px 12px", textAlign:"left", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em", whiteSpace:"nowrap" }}>User</th>
                <th style={{ color:"#fff", padding:"8px 12px", textAlign:"left", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em" }}>Description</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign:"center", padding:"40px 0", color:"#9ca3af", fontSize:14 }}>
                    No history records found.
                  </td>
                </tr>
              ) : sorted.map((h, i) => {
                const style = getActionStyle(h.operation);
                return (
                  <tr key={h.id} style={{ background: i % 2 === 0 ? "#fff" : "#fafaf9", borderBottom:"1px solid #f0ede8" }}>
                    <td style={{ padding:"8px 12px", fontFamily:"IBM Plex Mono, monospace", fontSize:11, color:"#6b7280", whiteSpace:"nowrap" }}>{h.date}</td>
                    {!selectedProjectId && (
                      <td style={{ padding:"8px 12px", fontSize:12 }}>
                        <code style={{ fontFamily:"IBM Plex Mono, monospace", fontWeight:600, color:"#A68A64", fontSize:11 }}>#{('projectCode' in h ? (h as any).projectCode : "")}</code>
                        <span style={{ marginLeft:6, color:"#374151" }}>{'address' in h ? (h as any).address : ""}</span>
                      </td>
                    )}
                    <td style={{ padding:"8px 12px" }}>
                      <span style={{ background:style.bg, color:style.text, padding:"2px 8px", borderRadius:4, fontSize:11, fontWeight:600, whiteSpace:"nowrap" }}>
                        {h.operation}
                      </span>
                    </td>
                    <td style={{ padding:"8px 12px", color:"#374151", fontWeight:500 }}>{h.person}</td>
                    <td style={{ padding:"8px 12px", color:"#6b7280", fontSize:12 }}>{h.details}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ padding:"10px 20px", borderTop:"1px solid #e5e7eb", background:"#f9f8f6", display:"flex", justifyContent:"flex-end", flexShrink:0 }}>
          <button onClick={onBack} style={{ background:"#1a1a2e", color:"#fff", border:"none", borderRadius:5, padding:"7px 20px", fontSize:12, fontWeight:600, cursor:"pointer" }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
