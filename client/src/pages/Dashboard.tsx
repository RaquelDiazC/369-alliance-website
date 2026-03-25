/*
 * 369 Alliance System – Dashboard
 * Tabs: Home | Defect Library | Training | Process and Procedures | Management (Owner-only)
 * Features: Edit/Republish mode (Owner only), Member role system (edit/delete/role-change),
 *           Collapsible members count in header, Date-range calendar with NSW public holidays,
 *           Shift+click range selection in calendar, Event Calendar (Owner create/publish),
 *           Video Library (Training tab), Cross-area section drag-and-drop,
 *           Link reordering drag-and-drop, Emoji picker for section icons
 * Design: Dark Navy + Bronze Accents
 */
import { useState, useRef, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import TaskCalendar from "../components/TaskCalendar";
import DefectLibrary from "../components/DefectLibrary";

// Responsive CSS for 3-col grid
const THREE_COL_STYLE = `
  .three-col-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  @media (max-width: 1100px) { .three-col-grid { grid-template-columns: 1fr; } }
`;
function ThreeColStyle() {
  return <style>{THREE_COL_STYLE}</style>;
}

// ─── Types ────────────────────────────────────────────────────────────────────
type UserRole = "Owner" | "Member";
type DashTab = "Home" | "Defect Library" | "Training" | "Process and Procedures" | "Task/Calendar" | "Management";

interface LinkItem { id: string; label: string; url: string; section: string; order?: number; }
interface Member { id: string; name: string; role: UserRole; initials: string; }
interface CalendarEvent { id: string; title: string; date: string; endDate?: string; color: string; description?: string; published: boolean; }
interface VideoItem { id: string; title: string; description: string; url: string; addedBy: string; addedAt: string; }

// ─── NSW 2026 Public Holidays ─────────────────────────────────────────────────
const NSW_PUBLIC_HOLIDAYS_2026: Record<string, string> = {
  "2026-01-01": "New Year's Day",
  "2026-01-26": "Australia Day",
  "2026-04-03": "Good Friday",
  "2026-04-04": "Easter Saturday",
  "2026-04-05": "Easter Sunday",
  "2026-04-06": "Easter Monday",
  "2026-04-25": "ANZAC Day",
  "2026-06-08": "King's Birthday",
  "2026-08-03": "Bank Holiday",
  "2026-10-05": "Labour Day",
  "2026-12-25": "Christmas Day",
  "2026-12-26": "Boxing Day",
  "2026-12-28": "Boxing Day (substitute)",
};

// ─── Initial data ─────────────────────────────────────────────────────────────
const INITIAL_MEMBERS: Member[] = [
  { id: "1", name: "Raquel Diaz", role: "Owner", initials: "RD" },
  { id: "2", name: "Charles Zhang", role: "Member", initials: "CZ" },
  { id: "3", name: "Farzad Rezvani", role: "Member", initials: "FR" },
  { id: "4", name: "Mitchell Pike", role: "Member", initials: "MP" },
];

const INITIAL_LINKS: LinkItem[] = [
  { id: "s1", label: "NearMap", url: "https://www.nearmap.com/au", section: "Search", order: 0 },
  { id: "s2", label: "Six Maps", url: "https://maps.six.nsw.gov.au/apps/3.5/?config=electoral", section: "Search", order: 1 },
  { id: "s3", label: "Spatial Viewer", url: "https://www.planningportal.nsw.gov.au/spatialviewer/#/find-a-property/address", section: "Search", order: 2 },
  { id: "v1", label: "ABN Lookup", url: "https://abr.business.gov.au/", section: "Verification", order: 0 },
  { id: "v2", label: "ASIC", url: "https://connectonline.asic.gov.au/RegistrySearch/faces/landing/bn/SearchBnRegisters.jspx", section: "Verification", order: 1 },
  { id: "v3", label: "ASIC Published Notices", url: "https://publishednotices.asic.gov.au/browsesearch-notices/", section: "Verification", order: 2 },
  { id: "v4", label: "All Registers", url: "https://verify.licence.nsw.gov.au/home", section: "Verification", order: 3 },
  { id: "v5", label: "Certifier Disciplinary Register", url: "https://www.nsw.gov.au/departments-and-agencies/building-commission/certifier-disciplinary-register", section: "Verification", order: 4 },
  { id: "v6", label: "DBP Verify Licence", url: "https://verify.licence.nsw.gov.au/home/DBP/results", section: "Verification", order: 5 },
  { id: "v7", label: "Home Building Compensation (HBC)", url: "https://verify.licence.nsw.gov.au/home/HBCF", section: "Verification", order: 6 },
  { id: "v8", label: "PCA – Certifiers Public Register", url: "https://applications.fairtrading.nsw.gov.au/bdcregister/", section: "Verification", order: 7 },
  { id: "v9", label: "Strata Search", url: "https://www.nsw.gov.au/housing-and-construction/strata/strata-search", section: "Verification", order: 8 },
  { id: "v10", label: "JASANZ", url: "https://register.jasanz.org/codemark-register", section: "Verification", order: 9 },
  { id: "l1", label: "SEPP – State Environmental Planning Policy 2008", url: "https://legislation.nsw.gov.au/view/html/inforce/current/epi-2008-0572#pt.3BA", section: "Legislation", order: 0 },
  { id: "l2", label: "EPAA – Environmental Planning and Assessment Act 1979", url: "https://legislation.nsw.gov.au/view/html/inforce/current/act-1979-203#pt.6-div.6.3", section: "Legislation", order: 1 },
  { id: "l3", label: "EPAR – Environmental Planning and Assessment Regulation 2021", url: "https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2021-0689", section: "Legislation", order: 2 },
  { id: "l4", label: "RAB Act – Residential Apartment Buildings Act 2020", url: "https://legislation.nsw.gov.au/view/html/inforce/current/act-2020-009", section: "Legislation", order: 3 },
  { id: "l5", label: "DBP Act – Design and Building Practitioners Act 2020", url: "https://legislation.nsw.gov.au/view/whole/html/inforce/current/act-2020-007", section: "Legislation", order: 4 },
  { id: "l6", label: "DBP Reg – Design and Building Practitioners Regulation 2021", url: "https://legislation.nsw.gov.au/view/html/inforce/current/sl-2021-0152", section: "Legislation", order: 5 },
  { id: "l7", label: "Apartment Design Guide", url: "https://www.planning.nsw.gov.au/policy-and-legislation/housing/apartment-design-guide", section: "Legislation", order: 6 },
  { id: "l8", label: "Low Rise Housing Diversity Design Guide", url: "https://www.planning.nsw.gov.au/sites/default/files/2023-03/low-rise-housing-diversity-design-guide-for-development-applications.pdf", section: "Legislation", order: 7 },
  { id: "l9", label: "Compliance and Regulation in Housing and Construction", url: "https://www.nsw.gov.au/housing-and-construction/compliance-and-regulation", section: "Legislation", order: 8 },
  { id: "l10", label: "Building Fire Safety Requirements (AS 1851-2012)", url: "https://www.nsw.gov.au/preview-link/node/106194/66a21507-e460-4b75-bd9a-4db2d4852da2", section: "Legislation", order: 9 },
  { id: "pc1", label: "News for Certifiers – March 2025", url: "https://news.buildingcommission.nsw.gov.au/link/id/zzzz67e094908a748502Pzzzz67dce741553c5194/page.html", section: "Private Certifier", order: 0 },
  { id: "pc2", label: "Building and Development Certifiers Act 2018", url: "https://legislation.nsw.gov.au/view/whole/html/inforce/current/act-2018-063", section: "Private Certifier", order: 1 },
  { id: "pc3", label: "Building and Development Certifiers Regulation 2020", url: "https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2020-0078", section: "Private Certifier", order: 2 },
  { id: "pc4", label: "Compliance and Regulation – Building Certifiers", url: "https://www.nsw.gov.au/housing-and-construction/compliance-and-regulation/building-certifiers", section: "Private Certifier", order: 3 },
  { id: "pc5", label: "Appointing a Certifier", url: "https://www.nsw.gov.au/housing-and-construction/appointing-a-certifier", section: "Private Certifier", order: 4 },
  { id: "pc6", label: "Licences and Credentials – Building Certifiers", url: "https://www.nsw.gov.au/business-and-economy/licences-and-credentials/building-certifiers", section: "Private Certifier", order: 5 },
  { id: "pc7", label: "Certifier Disciplinary Register", url: "https://www.nsw.gov.au/departments-and-agencies/building-commission/certifier-disciplinary-register", section: "Private Certifier", order: 6 },
  { id: "pc8", label: "Building and Subdivision Certification – OC", url: "https://www.planning.nsw.gov.au/sites/default/files/2023-04/building-and-subdivision-certification-occupation-certificates.pdf", section: "Private Certifier", order: 7 },
  { id: "pc9", label: "Practice Standard Vol 1 – New Apartment Buildings", url: "https://www.nsw.gov.au/sites/default/files/noindex/2025-02/certifier-practice-standard-vol-1-new-apartment-buildings.pdf", section: "Private Certifier", order: 8 },
  { id: "pc10", label: "Practice Standard Vol 2 – Class 1a Buildings", url: "https://www.nsw.gov.au/sites/default/files/noindex/2025-02/certifier-practice-standard-vol-2-class-1a-buildings.pdf", section: "Private Certifier", order: 9 },
  { id: "a1", label: "Faster Assessments for State Housing Applications", url: "https://www.planning.nsw.gov.au/policy-and-legislation/housing/faster-assessments-for-state-significant-development-housing-applications", section: "Applications", order: 0 },
  { id: "a2", label: "NATSPEC", url: "https://www.natspec.com.au/", section: "Applications", order: 1 },
  { id: "a3", label: "BP – Types of Professional Registration", url: "https://www.nsw.gov.au/business-and-economy/licences-and-credentials/building-and-trade-licences-and-registrations/register/building-practitioners", section: "Applications", order: 2 },
  { id: "rab1", label: "RAB Act – Residential Apartment Buildings Act 2020", url: "https://legislation.nsw.gov.au/view/html/inforce/current/act-2020-009", section: "RAB Act", order: 0 },
  { id: "dbp1", label: "DBP Act – Design and Building Practitioners Act 2020", url: "https://legislation.nsw.gov.au/view/whole/html/inforce/current/act-2020-007", section: "DBP Act", order: 0 },
  { id: "ob1", label: "CAS Complaint Form", url: "https://www.nsw.gov.au/departments-and-agencies/building-commission/building-defect-complaints", section: "Forms/Process", order: 0 },
  { id: "fp2", label: "Building Defect Bond Scheme – Application Form", url: "https://www.nsw.gov.au/departments-and-agencies/building-commission/building-defect-bond-scheme", section: "Forms/Process", order: 1 },
  { id: "fp3", label: "DBP Act – Design Practitioner Registration Form", url: "https://www.bpb.nsw.gov.au/design-practitioners/apply-for-registration", section: "Forms/Process", order: 2 },
  { id: "fp4", label: "Planning Portal – Development Application", url: "https://www.planningportal.nsw.gov.au/", section: "Forms/Process", order: 3 },
  { id: "fp5", label: "SafeWork NSW – Incident Notification Form", url: "https://www.safework.nsw.gov.au/notify-safework/incident-notification", section: "Forms/Process", order: 4 },
  { id: "t1", label: "Understanding the NCC – Compliance with the NCC", url: "https://www.abcb.gov.au/sites/default/files/resources/2022/UTNCC-Compliance-with-the-NCC.pdf", section: "Training", order: 0 },
];

// ─── Emoji Picker ─────────────────────────────────────────────────────────────
const EMOJI_LIST = [
  "📌","⚖️","📋","📁","🔍","✅","🏢","🔧","🏗️","📚","🎬","📝","⚙️","🗂️","🔗",
  "📊","📈","📉","💼","🏛️","🔑","🛡️","📜","📄","🗒️","💡","🔔","⭐","🎯","🚀",
  "🏠","🏗","🔨","🪛","🔩","📐","📏","🧱","🪟","🚪","🛠️","⚡","💧","🌿","🌏",
];

function EmojiPicker({ value, onChange }: { value: string; onChange: (emoji: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          style={{
            fontSize: 24, background: "#f3f4f6", border: "2px solid #d1d5db",
            borderRadius: 8, padding: "4px 10px", cursor: "pointer",
            lineHeight: 1.2, minWidth: 48,
          }}
          title="Click to choose an emoji icon"
        >{value}</button>
        <span style={{ fontSize: 11, color: "#6b7280" }}>Click to change icon</span>
      </div>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 99999,
          background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10,
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)", padding: 10,
          display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 4, width: 280,
        }}>
          {EMOJI_LIST.map(e => (
            <button key={e} type="button" onClick={() => { onChange(e); setOpen(false); }}
              style={{
                fontSize: 20, background: value === e ? "#fef9f0" : "none",
                border: value === e ? "2px solid #A68A64" : "2px solid transparent",
                borderRadius: 6, padding: "4px 2px", cursor: "pointer", lineHeight: 1.2,
              }}
              title={e}
            >{e}</button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function ExternalLinkIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <path d="M4.5 2H2a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M6.5 1H10v3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10 1L5.5 5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

// ─── Link Card with drag-and-drop reorder support ─────────────────────────────
function LinkCard({
  item, editMode, onDelete, onEdit,
  draggable: isDraggable, onDragStart, onDragOver, onDrop, isDragOver,
}: {
  item: LinkItem; editMode: boolean; onDelete: (id: string) => void; onEdit?: (id: string) => void;
  draggable?: boolean; onDragStart?: () => void;
  onDragOver?: (e: React.DragEvent) => void; onDrop?: () => void; isDragOver?: boolean;
}) {
  return (
    <div
      draggable={isDraggable && editMode}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: isDragOver ? "#fef9f0" : "#fff",
        border: isDragOver ? "2px dashed #A68A64" : "1px solid #e5e7eb",
        borderRadius: 7, padding: "9px 14px", gap: 8, transition: "box-shadow 0.15s",
        opacity: isDragOver ? 0.8 : 1,
      }}
      onMouseEnter={e => { if (!isDragOver) (e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.08)"); }}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
    >
      {editMode && isDraggable && (
        <span style={{ color: "#d1d5db", fontSize: 14, cursor: "grab", flexShrink: 0 }} title="Drag to reorder">⠿</span>
      )}
      <a href={item.url} target="_blank" rel="noopener noreferrer"
        style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: "#1e3a5f", fontWeight: 500, textDecoration: "none", flex: 1, minWidth: 0 }}>
        <ExternalLinkIcon />
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</span>
      </a>
      {editMode && (
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          {onEdit && (
            <button onClick={() => onEdit(item.id)}
              title="Edit link"
              style={{ background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", borderRadius: 4, padding: "2px 7px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>✏️</button>
          )}
          <button onClick={() => onDelete(item.id)}
            style={{ background: "#fee2e2", color: "#c0392b", border: "none", borderRadius: 4, padding: "2px 7px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>✕</button>
        </div>
      )}
    </div>
  );
}

// ─── Edit Link Modal ─────────────────────────────────────────────────────────
function EditLinkModal({ link, onClose, onSave }: { link: LinkItem; onClose: () => void; onSave: (id: string, label: string, url: string) => void }) {
  const [label, setLabel] = useState(link.label);
  const [url, setUrl] = useState(link.url);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 20000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: 10, padding: "24px 28px", maxWidth: 440, width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#1a1a2e" }}>Edit Link</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Label</label>
            <input value={label} onChange={e => setLabel(e.target.value)}
              style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 5, padding: "8px 12px", fontSize: 13, boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>URL</label>
            <input value={url} onChange={e => setUrl(e.target.value)}
              style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 5, padding: "8px 12px", fontSize: 13, boxSizing: "border-box" }} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
          <button onClick={onClose} style={{ background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", borderRadius: 5, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          <button onClick={() => { if (label && url) { onSave(link.id, label, url); onClose(); } }}
            style={{ background: "linear-gradient(135deg,#1e3a5f,#2d6a8f)", color: "#fff", border: "none", borderRadius: 5, padding: "8px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Save</button>
        </div>
      </div>
    </div>
  );
}

// ─── Section Panel with link drag-and-drop reorder ───────────────────────────
function SectionPanel({
  title, icon, links, editMode, onDelete, onEdit, onAddLink, accent = "#1e3a5f",
  onDeleteSection, onEditSection,
  draggable: isSectionDraggable, onDragStart, onDragOver, onDrop, isDragOver,
  onReorderLinks,
}: {
  title: string; icon: string; links: LinkItem[]; editMode: boolean;
  onDelete: (id: string) => void; onEdit?: (id: string) => void; onAddLink: (section: string) => void; accent?: string;
  onDeleteSection?: () => void; onEditSection?: () => void;
  draggable?: boolean; onDragStart?: () => void;
  onDragOver?: (e: React.DragEvent) => void; onDrop?: () => void; isDragOver?: boolean;
  onReorderLinks?: (fromId: string, toId: string) => void;
}) {
  const [linkDragId, setLinkDragId] = useState<string | null>(null);
  const [linkDragOver, setLinkDragOver] = useState<string | null>(null);

  function handleLinkDragStart(id: string) { setLinkDragId(id); }
  function handleLinkDragOver(e: React.DragEvent, id: string) { e.preventDefault(); e.stopPropagation(); setLinkDragOver(id); }
  function handleLinkDrop(toId: string) {
    if (linkDragId && linkDragId !== toId && onReorderLinks) {
      onReorderLinks(linkDragId, toId);
    }
    setLinkDragId(null); setLinkDragOver(null);
  }
  function handleLinkDragEnd() { setLinkDragId(null); setLinkDragOver(null); }

  return (
    <div
      draggable={isSectionDraggable && editMode}
      onDragStart={e => { e.stopPropagation(); if (onDragStart) onDragStart(); }}
      onDragOver={e => { if (!linkDragId) { e.preventDefault(); if (onDragOver) onDragOver(e); } }}
      onDrop={e => { if (!linkDragId) { e.stopPropagation(); if (onDrop) onDrop(); } }}
      onDragEnd={() => { setLinkDragId(null); setLinkDragOver(null); }}
      style={{
        background: "#f8f7f5", borderRadius: 10,
        border: isDragOver ? "2px dashed #A68A64" : "1px solid #e5e7eb",
        overflow: "hidden", opacity: isDragOver ? 0.7 : 1,
        cursor: isSectionDraggable && editMode ? "grab" : "default",
      }}>
      <div style={{ background: accent, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {isSectionDraggable && editMode && <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, cursor: "grab" }}>⠿</span>}
          <div style={{
            width: 34, height: 34, borderRadius: 9,
            background: "linear-gradient(135deg,#1a1a2e,#252545)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, flexShrink: 0,
            boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
          }}>{icon}</div>
          <span style={{ fontWeight: 700, fontSize: 14, color: "#fff", letterSpacing: "0.02em" }}>{title}</span>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {editMode && (
            <button onClick={() => onAddLink(title)}
              style={{ background: "rgba(255,255,255,0.2)", color: "#fff", border: "1px solid rgba(255,255,255,0.4)", borderRadius: 5, padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
              + Add Link
            </button>
          )}
          {editMode && onEditSection && (
            <button onClick={onEditSection}
              style={{ background: "rgba(255,255,255,0.2)", color: "#fff", border: "1px solid rgba(255,255,255,0.4)", borderRadius: 5, padding: "4px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
              title="Edit this section">✏️</button>
          )}
          {editMode && onDeleteSection && (
            <button onClick={onDeleteSection}
              style={{ background: "rgba(192,57,43,0.7)", color: "#fff", border: "none", borderRadius: 5, padding: "4px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
              title="Delete this section">🗑</button>
          )}
        </div>
      </div>
      <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
        {links.length === 0
          ? <div style={{ fontSize: 12, color: "#9ca3af", fontStyle: "italic", padding: "8px 0" }}>No links yet. {editMode ? "Click + Add Link to add one." : ""}</div>
          : links.map(l => (
            <LinkCard
              key={l.id} item={l} editMode={editMode}
              onDelete={onDelete} onEdit={onEdit}
              draggable={editMode && !!onReorderLinks}
              onDragStart={() => handleLinkDragStart(l.id)}
              onDragOver={e => handleLinkDragOver(e, l.id)}
              onDrop={() => handleLinkDrop(l.id)}
              isDragOver={linkDragOver === l.id}
            />
          ))
        }
        {/* Drop zone at end of list */}
        {editMode && onReorderLinks && links.length > 0 && linkDragId && (
          <div
            onDragOver={e => { e.preventDefault(); setLinkDragOver("__end__"); }}
            onDrop={() => { if (linkDragId && onReorderLinks) onReorderLinks(linkDragId, "__end__"); setLinkDragId(null); setLinkDragOver(null); }}
            style={{
              height: 28, borderRadius: 6, border: "2px dashed #A68A64",
              background: linkDragOver === "__end__" ? "#fef9f0" : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, color: "#A68A64", fontWeight: 600,
            }}
          >Drop here to move to end</div>
        )}
      </div>
    </div>
  );
}

// ─── Timesheet ────────────────────────────────────────────────────────────────
interface TimesheetEntry { date: string; start: string; end: string; approved: boolean; }
interface Employee { id: string; name: string; startDate: string; entries: TimesheetEntry[]; }

function TimesheetModal({ onClose, isOwner }: { onClose: () => void; isOwner: boolean }) {
  const today = new Date();
  const [employees, setEmployees] = useState<Employee[]>([
    { id: "1", name: "Raquel Diaz", startDate: "2024-01-15", entries: [] },
    { id: "2", name: "Charles Zhang", startDate: "2024-03-01", entries: [] },
  ]);
  const [selectedEmp, setSelectedEmp] = useState("1");
  const [newName, setNewName] = useState("");
  const [newStart, setNewStart] = useState("");
  const [showAddEmp, setShowAddEmp] = useState(false);

  const emp = employees.find(e => e.id === selectedEmp);

  function getWeekDates(): string[] {
    if (!emp) return [];
    const start = new Date(emp.startDate);
    const dates: string[] = [];
    for (let i = 0; i < 84; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      if (d.getDay() !== 0 && d.getDay() !== 6) dates.push(d.toISOString().split("T")[0]);
    }
    return dates.slice(0, 60);
  }

  function updateEntry(date: string, field: "start" | "end", val: string) {
    setEmployees(prev => prev.map(e => {
      if (e.id !== selectedEmp) return e;
      const existing = e.entries.find(x => x.date === date);
      if (existing) return { ...e, entries: e.entries.map(x => x.date === date ? { ...x, [field]: val } : x) };
      return { ...e, entries: [...e.entries, { date, start: field === "start" ? val : "", end: field === "end" ? val : "", approved: false }] };
    }));
  }

  function approveEntry(date: string) {
    setEmployees(prev => prev.map(e => {
      if (e.id !== selectedEmp) return e;
      return { ...e, entries: e.entries.map(x => x.date === date ? { ...x, approved: true } : x) };
    }));
  }

  function calcHours(start: string, end: string): string {
    if (!start || !end) return "—";
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    const mins = (eh * 60 + em) - (sh * 60 + sm) - 30;
    if (mins <= 0) return "—";
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  }

  const dates = getWeekDates();

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 12, width: "100%", maxWidth: 860, maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ background: "#1a1a2e", borderRadius: "12px 12px 0 0", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>🕐</span>
            <span style={{ fontWeight: 700, fontSize: 16, color: "#fff" }}>Timesheet Entry</span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#A68A64", fontSize: 20, cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ padding: "16px 24px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <select value={selectedEmp} onChange={e => setSelectedEmp(e.target.value)}
            style={{ border: "1px solid #d1d5db", borderRadius: 5, padding: "6px 10px", fontSize: 13, fontFamily: "inherit" }}>
            {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          {isOwner && (
            <button onClick={() => setShowAddEmp(v => !v)}
              style={{ background: "linear-gradient(135deg,#7A6342,#A68A64)", color: "#fff", border: "none", borderRadius: 5, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              + Add Employee
            </button>
          )}
          {showAddEmp && isOwner && (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input placeholder="Name" value={newName} onChange={e => setNewName(e.target.value)}
                style={{ border: "1px solid #d1d5db", borderRadius: 5, padding: "5px 8px", fontSize: 12 }} />
              <input type="date" value={newStart} onChange={e => setNewStart(e.target.value)}
                style={{ border: "1px solid #d1d5db", borderRadius: 5, padding: "5px 8px", fontSize: 12 }} />
              <button onClick={() => {
                if (!newName || !newStart) return;
                setEmployees(prev => [...prev, { id: Date.now().toString(), name: newName, startDate: newStart, entries: [] }]);
                setNewName(""); setNewStart(""); setShowAddEmp(false);
              }} style={{ background: "#2d6a4f", color: "#fff", border: "none", borderRadius: 5, padding: "5px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Save</button>
            </div>
          )}
        </div>
        <div style={{ flex: 1, overflow: "auto", padding: "0 24px 16px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginTop: 12 }}>
            <thead>
              <tr style={{ background: "#f3f4f6" }}>
                {["Date", "Start", "End", "Hours", "Status", ...(isOwner ? ["Action"] : [])].map(h => (
                  <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontWeight: 700, color: "#374151", borderBottom: "2px solid #e5e7eb" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dates.map((date, i) => {
                const entry = emp?.entries.find(x => x.date === date);
                const isToday = date === today.toISOString().split("T")[0];
                return (
                  <tr key={date} style={{ background: isToday ? "#fef9f0" : i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                    <td style={{ padding: "6px 10px", borderBottom: "1px solid #f3f4f6", fontWeight: isToday ? 700 : 400, color: isToday ? "#A68A64" : "#374151" }}>
                      {new Date(date + "T00:00:00").toLocaleDateString("en-AU", { weekday: "short", day: "2-digit", month: "short" })}
                    </td>
                    <td style={{ padding: "4px 10px", borderBottom: "1px solid #f3f4f6" }}>
                      <input type="time" value={entry?.start || ""} onChange={e => updateEntry(date, "start", e.target.value)}
                        style={{ border: "1px solid #d1d5db", borderRadius: 4, padding: "3px 6px", fontSize: 12, width: 90 }} />
                    </td>
                    <td style={{ padding: "4px 10px", borderBottom: "1px solid #f3f4f6" }}>
                      <input type="time" value={entry?.end || ""} onChange={e => updateEntry(date, "end", e.target.value)}
                        style={{ border: "1px solid #d1d5db", borderRadius: 4, padding: "3px 6px", fontSize: 12, width: 90 }} />
                    </td>
                    <td style={{ padding: "6px 10px", borderBottom: "1px solid #f3f4f6", fontWeight: 600, color: "#2d6a4f" }}>{calcHours(entry?.start || "", entry?.end || "")}</td>
                    <td style={{ padding: "6px 10px", borderBottom: "1px solid #f3f4f6" }}>
                      {entry?.approved
                        ? <span style={{ background: "#d1fae5", color: "#065f46", borderRadius: 4, padding: "2px 7px", fontSize: 11, fontWeight: 700 }}>Approved</span>
                        : entry?.start && entry?.end
                          ? <span style={{ background: "#fef3c7", color: "#92400e", borderRadius: 4, padding: "2px 7px", fontSize: 11, fontWeight: 700 }}>Pending</span>
                          : <span style={{ color: "#9ca3af", fontSize: 11 }}>—</span>}
                    </td>
                    {isOwner && (
                      <td style={{ padding: "6px 10px", borderBottom: "1px solid #f3f4f6" }}>
                        {entry?.start && entry?.end && !entry?.approved && (
                          <button onClick={() => approveEntry(date)}
                            style={{ background: "#2d6a4f", color: "#fff", border: "none", borderRadius: 4, padding: "3px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Approve</button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ padding: "12px 24px", borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={{ background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", borderRadius: 5, padding: "8px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── Calendar 2026 with date-range, Shift+click, NSW public holidays ──────────
type LeaveStatus = "approved" | "pending" | "rejected";
interface LeaveRequest { id: string; name: string; type: string; startDate: string; endDate: string; status: LeaveStatus; }

function Calendar2026Modal({ onClose, isOwner }: { onClose: () => void; isOwner: boolean }) {
  const [leaves, setLeaves] = useState<LeaveRequest[]>(() => {
    try { const v = localStorage.getItem("cal2026_leaves_v1"); return v ? JSON.parse(v) : []; } catch { return []; }
  });
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selType, setSelType] = useState("General Leave");
  const [viewMonth, setViewMonth] = useState(0);
  // Keyboard date range input
  const [dateInputVal, setDateInputVal] = useState("");
  const [dateInputError, setDateInputError] = useState<string | null>(null);
  const [showDateInput, setShowDateInput] = useState(false);

  const months = Array.from({ length: 12 }, (_, i) => ({
    month: i, year: 2026,
    label: new Date(2026, i, 1).toLocaleString("en-AU", { month: "long", year: "numeric" })
  }));
  const m = months[viewMonth];
  const firstDay = new Date(m.year, m.month, 1).getDay();
  const daysInMonth = new Date(m.year, m.month + 1, 0).getDate();

  function dateStr(day: number) {
    return `2026-${String(m.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function isWeekend(ds: string): boolean {
    const d = new Date(ds + "T00:00:00");
    return d.getDay() === 0 || d.getDay() === 6;
  }

  function isPublicHoliday(ds: string): boolean {
    return ds in NSW_PUBLIC_HOLIDAYS_2026;
  }

  // Use local date arithmetic to avoid UTC off-by-one in AEDT/AEST
  function localDateStr(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  function getSelectedRange(): string[] {
    if (!rangeStart) return [];
    const end = rangeEnd || rangeStart;
    const [a, b] = rangeStart <= end ? [rangeStart, end] : [end, rangeStart];
    const result: string[] = [];
    const [ay, am, ad] = a.split("-").map(Number);
    const [by, bm, bd] = b.split("-").map(Number);
    const cur = new Date(ay, am - 1, ad);
    const endDate = new Date(by, bm - 1, bd);
    while (cur <= endDate) {
      result.push(localDateStr(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return result;
  }
  // Parse keyboard date range input like "15 Jan", "15/01", "15 Jan - 20 Jan", "15/01-20/01"
  function parseDateInput(raw: string): { start: string; end: string } | null {
    const MONTHS: Record<string, number> = {
      jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12,
      january:1,february:2,march:3,april:4,june:6,july:7,august:8,september:9,october:10,november:11,december:12
    };
    function parseSingle(s: string): string | null {
      s = s.trim();
      // dd/mm or dd/mm/yyyy
      const slashMatch = s.match(/^(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{4}))?$/);
      if (slashMatch) {
        const d = parseInt(slashMatch[1]), mo = parseInt(slashMatch[2]);
        const y = slashMatch[3] ? parseInt(slashMatch[3]) : 2026;
        if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
        return `${y}-${String(mo).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
      }
      // dd Mon or dd Month
      const wordMatch = s.match(/^(\d{1,2})\s+([a-zA-Z]+)(?:\s+(\d{4}))?$/);
      if (wordMatch) {
        const d = parseInt(wordMatch[1]);
        const mo = MONTHS[wordMatch[2].toLowerCase()];
        const y = wordMatch[3] ? parseInt(wordMatch[3]) : 2026;
        if (!mo || d < 1 || d > 31) return null;
        return `${y}-${String(mo).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
      }
      // Mon dd or Month dd
      const wordMatch2 = s.match(/^([a-zA-Z]+)\s+(\d{1,2})(?:\s+(\d{4}))?$/);
      if (wordMatch2) {
        const mo = MONTHS[wordMatch2[1].toLowerCase()];
        const d = parseInt(wordMatch2[2]);
        const y = wordMatch2[3] ? parseInt(wordMatch2[3]) : 2026;
        if (!mo || d < 1 || d > 31) return null;
        return `${y}-${String(mo).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
      }
      return null;
    }
    // Split on " - ", " – ", " to ", "–", or " → "
    const parts = raw.split(/\s*[-–→]\s*|\s+to\s+/i);
    if (parts.length === 2) {
      const s = parseSingle(parts[0]);
      const e = parseSingle(parts[1]);
      if (s && e) return { start: s, end: e };
      return null;
    } else if (parts.length === 1) {
      const s = parseSingle(parts[0]);
      if (s) return { start: s, end: s };
      return null;
    }
    return null;
  }
  function applyDateInput() {
    const parsed = parseDateInput(dateInputVal);
    if (!parsed) { setDateInputError("Format: \"15 Jan\", \"15/01\", \"15 Jan - 20 Jan\", \"15/01-20/01\""); return; }
    setRangeStart(parsed.start);
    setRangeEnd(parsed.end);
    setDateInputError(null);
    setShowDateInput(false);
    setDateInputVal("");
    // Navigate to the month of the start date
    const mo = parseInt(parsed.start.split("-")[1]) - 1;
    setViewMonth(mo);
  }

  function getDayStatus(ds: string): LeaveStatus | null {
    const matching = leaves.filter(l => ds >= l.startDate && ds <= l.endDate);
    if (matching.length === 0) return null;
    if (matching.some(l => l.status === "approved")) return "approved";
    if (matching.some(l => l.status === "pending")) return "pending";
    return "rejected";
  }

   function handleDayClick(ds: string, e: React.MouseEvent) {
    if (e.shiftKey && rangeStart) {
      // Shift+click: extend range to this day
      setRangeEnd(ds);
      setIsDragging(false);
    } else if (!isDragging) {
      // Normal click (not ending a drag): select exactly this single day
      setRangeStart(ds);
      setRangeEnd(ds);
    }
  }
  function handleDayMouseDown(ds: string, e: React.MouseEvent) {
    if (e.shiftKey) return; // Shift+click handled by onClick
    e.preventDefault();
    setRangeStart(ds);
    setRangeEnd(ds);
    setIsDragging(true);
  }
  function handleDayMouseEnter(ds: string) {
    if (isDragging) setRangeEnd(ds);
  }
  function handleDayMouseUp(ds: string) {
    if (isDragging) {
      setRangeEnd(ds);
    }
    setIsDragging(false);
  }
  function submitLeave() {
    if (!rangeStart) return;
    const end = rangeEnd || rangeStart;
    const [a, b] = rangeStart <= end ? [rangeStart, end] : [end, rangeStart];
    setLeaves(prev => {
      const next = [...prev, { id: Date.now().toString(), name: "Raquel Diaz", type: selType, startDate: a, endDate: b, status: "pending" as LeaveStatus }];
      try { localStorage.setItem("cal2026_leaves_v1", JSON.stringify(next)); } catch {}
      return next;
    });
    setRangeStart(null); setRangeEnd(null);
  }

  function updateStatus(id: string, status: LeaveStatus) {
    setLeaves(prev => {
      const next = prev.map(l => l.id === id ? { ...l, status } : l);
      try { localStorage.setItem("cal2026_leaves_v1", JSON.stringify(next)); } catch {}
      // Dispatch storage event so TaskCalendar syncs immediately
      window.dispatchEvent(new StorageEvent("storage", { key: "cal2026_leaves_v1", newValue: JSON.stringify(next) }));
      return next;
    });
  }

  const selectedRange = getSelectedRange();
  // Use local date for today to avoid UTC off-by-one
  const todayD = new Date();
  const today = `${todayD.getFullYear()}-${String(todayD.getMonth()+1).padStart(2,"0")}-${String(todayD.getDate()).padStart(2,"0")}`;

  function getDayStyle(ds: string): React.CSSProperties {
    const isSelected = selectedRange.includes(ds);
    const status = getDayStatus(ds);
    const weekend = isWeekend(ds);
    const holiday = isPublicHoliday(ds);
    const isToday = ds === today;

    if (isSelected) return { background: "#0d9488", color: "#fff", border: "2px solid #0d9488", fontWeight: 700 };
    if (status === "approved") return { background: "#d1fae5", color: "#065f46", border: "1px solid #6ee7b7" };
    if (status === "pending") return { background: "#fef3c7", color: "#92400e", border: "1px solid #fcd34d" };
    if (status === "rejected") return { background: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5" };
    if (holiday) return { background: "#fed7aa", color: "#9a3412", border: "1px solid #fdba74", fontWeight: 700 };
    if (weekend) return { background: "#f1f5f9", color: "#94a3b8", border: "1px solid #e2e8f0" };
    if (isToday) return { background: "#eff6ff", color: "#1d4ed8", border: "2px solid #3b82f6", fontWeight: 700 };
    return { background: "#fff", color: "#374151", border: "1px solid #e5e7eb" };
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 12, width: "100%", maxWidth: 900, maxHeight: "92vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ background: "#1a1a2e", borderRadius: "12px 12px 0 0", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>📅</span>
            <span style={{ fontWeight: 700, fontSize: 16, color: "#fff" }}>Calendar 2026 – Leave Management</span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#A68A64", fontSize: 20, cursor: "pointer" }}>✕</button>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: 24, display: "flex", gap: 24, flexWrap: "wrap" }}>
          {/* Calendar */}
          <div style={{ flex: "1 1 380px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <button onClick={() => setViewMonth(v => Math.max(0, v - 1))} style={{ background: "#f3f4f6", border: "none", borderRadius: 5, padding: "5px 14px", cursor: "pointer", fontWeight: 700, fontSize: 16 }}>‹</button>
              <span style={{ fontWeight: 700, fontSize: 15, color: "#1a1a2e" }}>{m.label}</span>
              <button onClick={() => setViewMonth(v => Math.min(11, v + 1))} style={{ background: "#f3f4f6", border: "none", borderRadius: 5, padding: "5px 14px", cursor: "pointer", fontWeight: 700, fontSize: 16 }}>›</button>
            </div>

            {/* Instructions + keyboard input toggle */}
            <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 8, background: "#f8f7f5", borderRadius: 5, padding: "6px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <span>Click a day to select it. <strong>Shift+click</strong> to extend range, or click and drag.</span>
              <button
                type="button"
                onClick={() => setShowDateInput(v => !v)}
                style={{ background: "#1a1a2e", color: "#A68A64", border: "1px solid #A68A64", borderRadius: 4, padding: "2px 8px", fontSize: 10, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}
                title="Type a date range using keyboard"
              >⌨ Type dates</button>
            </div>
            {/* Keyboard date range input */}
            {showDateInput && (
              <div style={{ marginBottom: 8, background: "#fffbf0", border: "1px solid #A68A64", borderRadius: 7, padding: "10px 12px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#7A6342", marginBottom: 6 }}>⌨ Type a date or range</div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <input
                    type="text"
                    value={dateInputVal}
                    onChange={e => { setDateInputVal(e.target.value); setDateInputError(null); }}
                    onKeyDown={e => { if (e.key === "Enter") applyDateInput(); if (e.key === "Escape") { setShowDateInput(false); setDateInputVal(""); setDateInputError(null); } }}
                    placeholder="e.g. 15 Jan  or  15/01 - 20/01"
                    autoFocus
                    style={{ flex: 1, border: "1px solid #d1d5db", borderRadius: 5, padding: "6px 10px", fontSize: 12, outline: "none" }}
                  />
                  <button onClick={applyDateInput} style={{ background: "linear-gradient(135deg,#7A6342,#A68A64)", color: "#fff", border: "none", borderRadius: 5, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Go</button>
                </div>
                {dateInputError && <div style={{ fontSize: 11, color: "#c0392b", marginTop: 5 }}>⚠ {dateInputError}</div>}
                <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 5 }}>Formats: "15 Jan", "15/01", "15 Jan – 20 Jan", "15/01 – 20/01", "Jan 15 to Jan 20" · Press Enter or click Go · Esc to close</div>
              </div>
            )}

            <div
              style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3, textAlign: "center", userSelect: "none" }}
              onMouseLeave={() => { if (isDragging) setIsDragging(false); }}
            >
              {["SUN","MON","TUE","WED","THU","FRI","SAT"].map(d => (
                <div key={d} style={{ fontSize: 10, fontWeight: 700, color: "#6b7280", padding: "4px 0", letterSpacing: "0.04em" }}>{d}</div>
              ))}
              {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const ds = dateStr(day);
                const holiday = isPublicHoliday(ds);
                const dayStyle = getDayStyle(ds);
                return (
                  <div
                    key={day}
                    style={{
                      ...dayStyle,
                      padding: "6px 2px", borderRadius: 5, fontSize: 12,
                      minHeight: 36, display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center", gap: 1,
                      cursor: "pointer", transition: "opacity 0.1s",
                    }}
                    onClick={e => handleDayClick(ds, e)}
                    onMouseDown={e => handleDayMouseDown(ds, e)}
                    onMouseEnter={() => handleDayMouseEnter(ds)}
                    onMouseUp={() => handleDayMouseUp(ds)}
                    title={holiday ? NSW_PUBLIC_HOLIDAYS_2026[ds] : `Click to select, Shift+click to extend range`}
                  >
                    {day}
                    {holiday && <div style={{ fontSize: 8, color: "inherit", opacity: 0.8, lineHeight: 1, textAlign: "center" }}>PH</div>}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px 12px", fontSize: 11 }}>
              {[
                { color: "#fff", border: "1px solid #e5e7eb", label: "Working Day" },
                { color: "#f1f5f9", border: "1px solid #e2e8f0", label: "Non-Working Day", textColor: "#94a3b8" },
                { color: "#d1fae5", border: "1px solid #6ee7b7", label: "Approved", textColor: "#065f46" },
                { color: "#fef3c7", border: "1px solid #fcd34d", label: "Approval Pending", textColor: "#92400e" },
                { color: "#fed7aa", border: "1px solid #fdba74", label: "Public Holiday", textColor: "#9a3412" },
                { color: "#fee2e2", border: "1px solid #fca5a5", label: "Rejected", textColor: "#991b1b" },
                { color: "#eff6ff", border: "2px solid #3b82f6", label: "Today", textColor: "#1d4ed8" },
                { color: "#0d9488", border: "2px solid #0d9488", label: "Selected Day", textColor: "#fff" },
              ].map(item => (
                <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 14, height: 14, borderRadius: 3, background: item.color, border: item.border, flexShrink: 0 }} />
                  <span style={{ color: "#374151" }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Request + list */}
          <div style={{ flex: "1 1 280px", display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "#f8f7f5", borderRadius: 8, padding: 16, border: "1px solid #e5e7eb" }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#1a1a2e", marginBottom: 10 }}>Request Leave</div>
              {rangeStart ? (
                <div style={{ marginBottom: 10, background: "#e0f2fe", borderRadius: 5, padding: "6px 10px", fontSize: 12, color: "#0369a1" }}>
                  Selected: {rangeStart === (rangeEnd || rangeStart) ? rangeStart : `${rangeStart} → ${rangeEnd || rangeStart}`}
                </div>
              ) : (
                <div style={{ marginBottom: 10, fontSize: 12, color: "#9ca3af", fontStyle: "italic" }}>Click or drag on the calendar to select dates</div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <select value={selType} onChange={e => setSelType(e.target.value)}
                  style={{ border: "1px solid #d1d5db", borderRadius: 5, padding: "6px 10px", fontSize: 13 }}>
                  <option>General Leave</option>
                  <option>Sick Leave</option>
                  <option>Annual Leave</option>
                  <option>Personal Leave</option>
                </select>
                <button onClick={submitLeave} disabled={!rangeStart}
                  style={{ background: rangeStart ? "linear-gradient(135deg,#7A6342,#A68A64)" : "#e5e7eb", color: rangeStart ? "#fff" : "#9ca3af", border: "none", borderRadius: 5, padding: "8px", fontSize: 13, fontWeight: 700, cursor: rangeStart ? "pointer" : "not-allowed" }}>
                  Submit Request
                </button>
              </div>
            </div>

            <div style={{ flex: 1, overflow: "auto" }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#1a1a2e", marginBottom: 8 }}>All Requests</div>
              {leaves.length === 0
                ? <div style={{ fontSize: 12, color: "#9ca3af", fontStyle: "italic" }}>No leave requests yet.</div>
                : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {leaves.map(l => (
                      <div key={l.id} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 6, padding: "8px 12px", fontSize: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <span style={{ fontWeight: 600, color: "#1a1a2e" }}>{l.name}</span>
                            <div style={{ color: "#6b7280", fontSize: 11, marginTop: 2 }}>
                              {l.startDate === l.endDate ? l.startDate : `${l.startDate} → ${l.endDate}`}
                            </div>
                            <div style={{ color: "#A68A64", fontSize: 11, marginTop: 1 }}>{l.type}</div>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                            <span style={{
                              background: l.status === "approved" ? "#d1fae5" : l.status === "rejected" ? "#fee2e2" : "#fef3c7",
                              color: l.status === "approved" ? "#065f46" : l.status === "rejected" ? "#991b1b" : "#92400e",
                              borderRadius: 4, padding: "2px 7px", fontSize: 11, fontWeight: 700
                            }}>{l.status === "approved" ? "Approved" : l.status === "rejected" ? "Rejected" : "Pending"}</span>
                            {isOwner && l.status === "pending" && (
                              <div style={{ display: "flex", gap: 4 }}>
                                <button onClick={() => updateStatus(l.id, "approved")} style={{ background: "#2d6a4f", color: "#fff", border: "none", borderRadius: 3, padding: "2px 7px", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>✓ Approve</button>
                                <button onClick={() => updateStatus(l.id, "rejected")} style={{ background: "#c0392b", color: "#fff", border: "none", borderRadius: 3, padding: "2px 7px", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>✗ Reject</button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          </div>
        </div>

        <div style={{ padding: "12px 24px", borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", borderRadius: 5, padding: "8px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── Event Calendar Modal ─────────────────────────────────────────────────────
function EventCalendarModal({ onClose, isOwner }: { onClose: () => void; isOwner: boolean }) {
  const [events, setEvents] = useState<CalendarEvent[]>([
    { id: "e1", title: "Team Meeting", date: "2026-03-15", color: "#3b82f6", description: "Monthly team catch-up", published: true },
    { id: "e2", title: "Site Inspection – P003", date: "2026-03-20", color: "#10b981", description: "45 Macquarie St, Parramatta", published: true },
  ]);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newEndDate, setNewEndDate] = useState("");
  const [newColor, setNewColor] = useState("#3b82f6");
  const [newDesc, setNewDesc] = useState("");
  const [viewMonth, setViewMonth] = useState(2);

  const months = Array.from({ length: 12 }, (_, i) => ({
    month: i, year: 2026,
    label: new Date(2026, i, 1).toLocaleString("en-AU", { month: "long", year: "numeric" })
  }));
  const m = months[viewMonth];
  const firstDay = new Date(m.year, m.month, 1).getDay();
  const daysInMonth = new Date(m.year, m.month + 1, 0).getDate();
  const today = new Date().toISOString().split("T")[0];

  function dateStr(day: number) {
    return `2026-${String(m.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function eventsOnDate(ds: string) {
    return events.filter(e => {
      if (e.endDate) return ds >= e.date && ds <= e.endDate;
      return e.date === ds;
    });
  }

  function createEvent() {
    if (!newTitle || !newDate) return;
    setEvents(prev => [...prev, {
      id: Date.now().toString(), title: newTitle, date: newDate,
      endDate: newEndDate || newDate, color: newColor, description: newDesc, published: false
    }]);
    setNewTitle(""); setNewDate(""); setNewEndDate(""); setNewDesc(""); setShowCreate(false);
  }

  function publishEvent(id: string) { setEvents(prev => prev.map(e => e.id === id ? { ...e, published: true } : e)); }
  function deleteEvent(id: string) { setEvents(prev => prev.filter(e => e.id !== id)); }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 12, width: "100%", maxWidth: 900, maxHeight: "92vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ background: "#1a1a2e", borderRadius: "12px 12px 0 0", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>🗓️</span>
            <span style={{ fontWeight: 700, fontSize: 16, color: "#fff" }}>Event Calendar</span>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {isOwner && (
              <button onClick={() => setShowCreate(v => !v)}
                style={{ background: "linear-gradient(135deg,#7A6342,#A68A64)", color: "#fff", border: "none", borderRadius: 5, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                + Create Event
              </button>
            )}
            <button onClick={onClose} style={{ background: "none", border: "none", color: "#A68A64", fontSize: 20, cursor: "pointer" }}>✕</button>
          </div>
        </div>

        {showCreate && isOwner && (
          <div style={{ background: "#f8f7f5", borderBottom: "1px solid #e5e7eb", padding: "16px 24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 10, alignItems: "end" }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 4 }}>Event Title *</label>
                <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Site Inspection"
                  style={{ border: "1px solid #d1d5db", borderRadius: 5, padding: "7px 10px", fontSize: 13, width: "100%", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 4 }}>Start Date *</label>
                <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
                  style={{ border: "1px solid #d1d5db", borderRadius: 5, padding: "7px 10px", fontSize: 13, width: "100%", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 4 }}>End Date (optional)</label>
                <input type="date" value={newEndDate} onChange={e => setNewEndDate(e.target.value)}
                  style={{ border: "1px solid #d1d5db", borderRadius: 5, padding: "7px 10px", fontSize: 13, width: "100%", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 4 }}>Colour</label>
                <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)}
                  style={{ border: "1px solid #d1d5db", borderRadius: 5, padding: 2, height: 36, width: 50, cursor: "pointer" }} />
              </div>
            </div>
            <div style={{ marginTop: 8 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 4 }}>Description</label>
              <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Optional description..."
                style={{ border: "1px solid #d1d5db", borderRadius: 5, padding: "7px 10px", fontSize: 13, width: "100%", boxSizing: "border-box" }} />
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
              <button onClick={() => setShowCreate(false)} style={{ background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", borderRadius: 5, padding: "7px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
              <button onClick={createEvent} style={{ background: "linear-gradient(135deg,#7A6342,#A68A64)", color: "#fff", border: "none", borderRadius: 5, padding: "7px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Save as Draft</button>
            </div>
          </div>
        )}

        <div style={{ flex: 1, overflow: "auto", padding: 24, display: "flex", gap: 24, flexWrap: "wrap" }}>
          {/* Calendar */}
          <div style={{ flex: "1 1 380px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <button onClick={() => setViewMonth(v => Math.max(0, v - 1))} style={{ background: "#f3f4f6", border: "none", borderRadius: 5, padding: "5px 14px", cursor: "pointer", fontWeight: 700, fontSize: 16 }}>‹</button>
              <span style={{ fontWeight: 700, fontSize: 15, color: "#1a1a2e" }}>{m.label}</span>
              <button onClick={() => setViewMonth(v => Math.min(11, v + 1))} style={{ background: "#f3f4f6", border: "none", borderRadius: 5, padding: "5px 14px", cursor: "pointer", fontWeight: 700, fontSize: 16 }}>›</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3 }}>
              {["SUN","MON","TUE","WED","THU","FRI","SAT"].map(d => (
                <div key={d} style={{ fontSize: 10, fontWeight: 700, color: "#6b7280", padding: "4px 0", textAlign: "center", letterSpacing: "0.04em" }}>{d}</div>
              ))}
              {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const ds = dateStr(day);
                const dayEvents = eventsOnDate(ds);
                const isWeekendDay = new Date(ds + "T00:00:00").getDay() === 0 || new Date(ds + "T00:00:00").getDay() === 6;
                const isToday = ds === today;
                const isHoliday = isWeekendDay ? false : ds in NSW_PUBLIC_HOLIDAYS_2026;
                return (
                  <div key={day} style={{
                    minHeight: 52, padding: "4px 3px", borderRadius: 5, fontSize: 11,
                    background: isToday ? "#eff6ff" : isHoliday ? "#fed7aa" : isWeekendDay ? "#f8fafc" : "#fff",
                    border: isToday ? "2px solid #3b82f6" : "1px solid #e5e7eb",
                    color: isWeekendDay ? "#94a3b8" : isHoliday ? "#9a3412" : "#374151",
                    display: "flex", flexDirection: "column", gap: 2,
                  }}>
                    <div style={{ fontWeight: isToday ? 700 : 400, textAlign: "center", marginBottom: 2 }}>{day}</div>
                    {dayEvents.slice(0, 2).map(ev => (
                      <div key={ev.id} style={{ background: ev.color, color: "#fff", borderRadius: 3, padding: "1px 4px", fontSize: 9, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {ev.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && <div style={{ fontSize: 9, color: "#6b7280", textAlign: "center" }}>+{dayEvents.length - 2} more</div>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Events list */}
          <div style={{ flex: "1 1 280px", display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#1a1a2e" }}>
              {isOwner ? "All Events (Drafts + Published)" : "Published Events"}
            </div>
            {events.filter(e => isOwner || e.published).length === 0
              ? <div style={{ fontSize: 12, color: "#9ca3af", fontStyle: "italic" }}>No events yet.</div>
              : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {events.filter(e => isOwner || e.published).map(ev => (
                    <div key={ev.id} style={{ background: "#fff", border: `2px solid ${ev.color}20`, borderLeft: `4px solid ${ev.color}`, borderRadius: 6, padding: "10px 12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13, color: "#1a1a2e" }}>{ev.title}</div>
                          <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
                            {ev.date === ev.endDate || !ev.endDate ? ev.date : `${ev.date} → ${ev.endDate}`}
                          </div>
                          {ev.description && <div style={{ fontSize: 11, color: "#374151", marginTop: 3 }}>{ev.description}</div>}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
                          <span style={{
                            background: ev.published ? "#d1fae5" : "#fef3c7",
                            color: ev.published ? "#065f46" : "#92400e",
                            borderRadius: 4, padding: "2px 7px", fontSize: 10, fontWeight: 700
                          }}>{ev.published ? "Published" : "Draft"}</span>
                          {isOwner && (
                            <div style={{ display: "flex", gap: 4 }}>
                              {!ev.published && (
                                <button onClick={() => publishEvent(ev.id)}
                                  style={{ background: "#2d6a4f", color: "#fff", border: "none", borderRadius: 3, padding: "2px 7px", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>Publish</button>
                              )}
                              <button onClick={() => deleteEvent(ev.id)}
                                style={{ background: "#fee2e2", color: "#c0392b", border: "none", borderRadius: 3, padding: "2px 7px", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>✕</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>
        </div>

        <div style={{ padding: "12px 24px", borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", borderRadius: 5, padding: "8px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── Add Link Modal ───────────────────────────────────────────────────────────
function AddLinkModal({ section, onClose, onAdd }: { section: string; onClose: () => void; onAdd: (item: LinkItem) => void }) {
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  function submit() {
    if (!label || !url) return;
    onAdd({ id: Date.now().toString(), label, url: url.startsWith("http") ? url : "https://" + url, section });
    onClose();
  }
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: 10, padding: "28px 32px", maxWidth: 420, width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "#1a1a2e" }}>Add Link to "{section}"</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input placeholder="Link label" value={label} onChange={e => setLabel(e.target.value)}
            style={{ border: "1px solid #d1d5db", borderRadius: 5, padding: "8px 12px", fontSize: 13 }} />
          <input placeholder="https://..." value={url} onChange={e => setUrl(e.target.value)}
            style={{ border: "1px solid #d1d5db", borderRadius: 5, padding: "8px 12px", fontSize: 13 }} />
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
          <button onClick={onClose} style={{ background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", borderRadius: 5, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          <button onClick={submit} style={{ background: "linear-gradient(135deg,#7A6342,#A68A64)", color: "#fff", border: "none", borderRadius: 5, padding: "8px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Add Link</button>
        </div>
      </div>
    </div>
  );
}

// ─── Members Panel (collapsible, edit/delete/role-change) ─────────────────────
function MembersPanel({ members, setMembers, isOwner }: { members: Member[]; setMembers: (m: Member[]) => void; isOwner: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("Member");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<UserRole>("Member");

  function addMember() {
    if (!newName) return;
    const initials = newName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
    setMembers([...members, { id: Date.now().toString(), name: newName, role: newRole, initials }]);
    setNewName(""); setShowAdd(false);
  }

  function deleteMember(id: string) {
    setMembers(members.filter(m => m.id !== id));
  }

  function startEdit(m: Member) {
    setEditingId(m.id); setEditName(m.name); setEditRole(m.role);
  }

  function saveEdit() {
    if (!editName || !editingId) return;
    const initials = editName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
    setMembers(members.map(m => m.id === editingId ? { ...m, name: editName, role: editRole, initials } : m));
    setEditingId(null);
  }

  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
      <div
        onClick={() => setExpanded(v => !v)}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", cursor: "pointer", userSelect: "none" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>👥</span>
          <span style={{ fontWeight: 700, fontSize: 14, color: "#1a1a2e" }}>Team Members</span>
          <span style={{ background: "#e5e7eb", color: "#374151", borderRadius: 10, padding: "1px 8px", fontSize: 11, fontWeight: 600 }}>{members.length}</span>
        </div>
        <span style={{ color: "#9ca3af", fontSize: 12 }}>{expanded ? "▲" : "▼"}</span>
      </div>

      {expanded && (
        <div style={{ padding: "0 16px 14px", borderTop: "1px solid #f3f4f6" }}>
          {isOwner && (
            <div style={{ marginBottom: 10, paddingTop: 10 }}>
              <button onClick={() => setShowAdd(v => !v)}
                style={{ background: "linear-gradient(135deg,#7A6342,#A68A64)", color: "#fff", border: "none", borderRadius: 5, padding: "5px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                + Add Member
              </button>
            </div>
          )}
          {showAdd && isOwner && (
            <div style={{ background: "#f8f7f5", borderRadius: 7, padding: 10, marginBottom: 10, display: "flex", flexDirection: "column", gap: 6 }}>
              <input placeholder="Full name" value={newName} onChange={e => setNewName(e.target.value)}
                style={{ border: "1px solid #d1d5db", borderRadius: 4, padding: "5px 8px", fontSize: 12 }} />
              <select value={newRole} onChange={e => setNewRole(e.target.value as UserRole)}
                style={{ border: "1px solid #d1d5db", borderRadius: 4, padding: "5px 8px", fontSize: 12 }}>
                <option>Owner</option>
                <option>Member</option>
              </select>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={addMember} style={{ flex: 1, background: "#2d6a4f", color: "#fff", border: "none", borderRadius: 4, padding: "5px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Save</button>
                <button onClick={() => setShowAdd(false)} style={{ background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", borderRadius: 4, padding: "5px 10px", fontSize: 12, cursor: "pointer" }}>Cancel</button>
              </div>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {members.map(m => (
              <div key={m.id}>
                {editingId === m.id ? (
                  <div style={{ background: "#f8f7f5", borderRadius: 7, padding: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                    <input value={editName} onChange={e => setEditName(e.target.value)}
                      style={{ border: "1px solid #d1d5db", borderRadius: 4, padding: "5px 8px", fontSize: 12 }} />
                    <select value={editRole} onChange={e => setEditRole(e.target.value as UserRole)}
                      style={{ border: "1px solid #d1d5db", borderRadius: 4, padding: "5px 8px", fontSize: 12 }}>
                      <option>Owner</option>
                      <option>Member</option>
                    </select>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={saveEdit} style={{ flex: 1, background: "#2d6a4f", color: "#fff", border: "none", borderRadius: 4, padding: "5px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Save</button>
                      <button onClick={() => setEditingId(null)} style={{ background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", borderRadius: 4, padding: "5px 10px", fontSize: 12, cursor: "pointer" }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: "50%",
                      background: m.role === "Owner" ? "linear-gradient(135deg,#7A6342,#A68A64)" : "#e5e7eb",
                      color: m.role === "Owner" ? "#fff" : "#374151",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 700, flexShrink: 0
                    }}>{m.initials}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#1a1a2e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</div>
                      <div style={{ fontSize: 10, color: m.role === "Owner" ? "#A68A64" : "#9ca3af", fontWeight: 600 }}>{m.role}</div>
                    </div>
                    {isOwner && (
                      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                        <button onClick={() => startEdit(m)}
                          style={{ background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", borderRadius: 4, padding: "3px 7px", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>✏️</button>
                        <button onClick={() => deleteMember(m.id)}
                          style={{ background: "#fee2e2", color: "#c0392b", border: "1px solid #fca5a5", borderRadius: 4, padding: "3px 7px", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>🗑</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Video Library ────────────────────────────────────────────────────────────
// ─── Training Regime Data ────────────────────────────────────────────────────
interface RegimeVideo { id: string; title: string; description: string; url: string; addedBy: string; addedAt: string; }
interface RegimeTopic { id: string; name: string; videos: RegimeVideo[]; }
interface TrainingRegime { id: string; name: string; icon: string; color: string; topics: RegimeTopic[]; }
const DEFAULT_REGIMES: TrainingRegime[] = [
  {
    id: "waterproofing", name: "Waterproofing", icon: "💧", color: "#1e3a5f",
    topics: [
      { id: "wp-wet", name: "Wet Areas", videos: [
        { id: "wp1", title: "NCC 2022 – Waterproofing Wet Areas (Vol. 1 & 2)", description: "Overview of NCC 2022 Section F2 waterproofing requirements for bathrooms, laundries and wet areas in Class 1–9 buildings.", url: "https://www.youtube.com/watch?v=7Ot7nkFVMoU", addedBy: "Raquel Diaz", addedAt: "2026-01-10" },
        { id: "wp2", title: "AS 3740 Waterproofing of Domestic Wet Areas – Explained", description: "Practical walkthrough of AS 3740-2021 requirements for membrane application, substrate prep and drainage.", url: "https://www.youtube.com/watch?v=0KFbFqGqpBk", addedBy: "Raquel Diaz", addedAt: "2026-01-10" },
        { id: "wp3", title: "Waterproofing Membrane Application – Best Practice", description: "Step-by-step demonstration of liquid membrane application to AS 4858 for shower recesses and balconies.", url: "https://www.youtube.com/watch?v=sPbxi2HKZWI", addedBy: "Raquel Diaz", addedAt: "2026-01-12" },
        { id: "wp4", title: "Common Waterproofing Defects in NSW Buildings", description: "Case study review of typical waterproofing failures found during PCA inspections under the DBP Act 2020.", url: "https://www.youtube.com/watch?v=QnFos1qX2EM", addedBy: "Raquel Diaz", addedAt: "2026-01-14" },
        { id: "wp5", title: "Balcony & Podium Waterproofing – NCC Compliance", description: "Waterproofing requirements for external balconies and podium decks under NCC 2022 and AS 4654.", url: "https://www.youtube.com/watch?v=KJvKQ8BKZWM", addedBy: "Raquel Diaz", addedAt: "2026-01-15" },
      ]},
      { id: "wp-roof", name: "Roofing", videos: [
        { id: "wp6", title: "Metal Roof Drainage – AS/NZS 3500.3 Compliance", description: "Roof drainage design and installation requirements under AS/NZS 3500.3 and NCC Section F.", url: "https://www.youtube.com/watch?v=Yw3ND9XTXHM", addedBy: "Raquel Diaz", addedAt: "2026-01-16" },
        { id: "wp7", title: "Roof Flashing Details for NCC Compliance", description: "Correct flashing installation at roof penetrations, ridges and valleys to prevent water ingress.", url: "https://www.youtube.com/watch?v=3xKcdhp5Bkw", addedBy: "Raquel Diaz", addedAt: "2026-01-17" },
      ]},
    ],
  },
  {
    id: "fire", name: "Fire", icon: "🔥", color: "#991b1b",
    topics: [
      { id: "fire-passive", name: "Passive Fire", videos: [
        { id: "fire1", title: "AS 1530.1 Non-Combustibility Test – Demonstration", description: "Laboratory demonstration of the AS 1530.1 non-combustibility test for building materials.", url: "https://www.youtube.com/watch?v=2bYP0QrWGqE", addedBy: "Raquel Diaz", addedAt: "2026-01-15" },
        { id: "fire2", title: "AS 1530.2 Flammability Test Apparatus", description: "Flammability testing apparatus and procedure for building products to AS 1530.2.", url: "https://www.youtube.com/watch?v=UpszMG-NRcw", addedBy: "Raquel Diaz", addedAt: "2026-01-15" },
        { id: "fire3", title: "Fire Resistance Levels (FRL) – NCC Explained", description: "Understanding FRL requirements for structural elements under NCC 2022 Section C and AS 1530.4.", url: "https://www.youtube.com/watch?v=dBMRHSMHMaE", addedBy: "Raquel Diaz", addedAt: "2026-01-18" },
        { id: "fire4", title: "Penetration Seals & Fire Stopping – AS 4072.1", description: "Correct installation of fire-rated penetration seals for pipes, cables and ducts under AS 4072.1.", url: "https://www.youtube.com/watch?v=6Xv3xqZi5Xo", addedBy: "Raquel Diaz", addedAt: "2026-01-20" },
        { id: "fire5", title: "Smoke Control in Buildings – NCC Section E", description: "Smoke hazard management requirements under NCC 2022 Section E including smoke doors and pressurisation.", url: "https://www.youtube.com/watch?v=9ZkFmBXmGkI", addedBy: "Raquel Diaz", addedAt: "2026-01-22" },
      ]},
      { id: "fire-active", name: "Active Fire", videos: [
        { id: "fire6", title: "AS 2118.1 Automatic Fire Sprinkler Systems", description: "Design and installation requirements for automatic fire sprinkler systems under AS 2118.1.", url: "https://www.youtube.com/watch?v=Yw3ND9XTXHM", addedBy: "Raquel Diaz", addedAt: "2026-01-23" },
        { id: "fire7", title: "Fire Detection & Alarm Systems – AS 1670.1", description: "Overview of fire detection and alarm system requirements under AS 1670.1 and NCC.", url: "https://www.youtube.com/watch?v=3xKcdhp5Bkw", addedBy: "Raquel Diaz", addedAt: "2026-01-24" },
      ]},
    ],
  },
  {
    id: "structure", name: "Structure", icon: "🏗️", color: "#374151",
    topics: [
      { id: "str-loads", name: "Loads & Wind", videos: [
        { id: "str1", title: "How Tall Buildings Tame the Wind", description: "Engineering principles behind wind load management in high-rise structures.", url: "https://www.youtube.com/watch?v=tHMPR7flpf4", addedBy: "Raquel Diaz", addedAt: "2026-02-01" },
        { id: "str2", title: "Flow Visualisation Around Building Shapes – Wind Tunnel", description: "Wind tunnel testing showing airflow patterns around common building geometries.", url: "https://www.youtube.com/watch?v=UEgk2Bgz16s", addedBy: "Raquel Diaz", addedAt: "2026-02-01" },
        { id: "str3", title: "AS 1170.2 Wind Actions on Structures – Overview", description: "Applying AS 1170.2 wind load calculations for building design in Australian wind regions.", url: "https://www.youtube.com/watch?v=QnFos1qX2EM", addedBy: "Raquel Diaz", addedAt: "2026-02-03" },
        { id: "str4", title: "Structural Inspections Under DBP Act 2020", description: "Obligations for engineers and certifiers conducting structural inspections under the DBP Act.", url: "https://www.youtube.com/watch?v=7Ot7nkFVMoU", addedBy: "Raquel Diaz", addedAt: "2026-02-05" },
        { id: "str5", title: "Concrete Defects in High-Rise Buildings – Case Studies", description: "Common structural defects in concrete construction identified during NSW building inspections.", url: "https://www.youtube.com/watch?v=0KFbFqGqpBk", addedBy: "Raquel Diaz", addedAt: "2026-02-07" },
      ]},
      { id: "str-concrete", name: "Concrete & Steel", videos: [
        { id: "str6", title: "AS 3600 Concrete Structures – Key Requirements", description: "Summary of AS 3600-2018 design requirements for reinforced and prestressed concrete structures.", url: "https://www.youtube.com/watch?v=sPbxi2HKZWI", addedBy: "Raquel Diaz", addedAt: "2026-02-08" },
        { id: "str7", title: "AS 4100 Steel Structures – Connections & Compliance", description: "Connection design and compliance requirements under AS 4100-2020 for steel structures.", url: "https://www.youtube.com/watch?v=KJvKQ8BKZWM", addedBy: "Raquel Diaz", addedAt: "2026-02-09" },
      ]},
    ],
  },
  {
    id: "building-enclosure", name: "Building Enclosure", icon: "🏢", color: "#2d6a4f",
    topics: [
      { id: "be-cladding", name: "Cladding", videos: [
        { id: "be1", title: "Hose Testing AAMA 501.2 – Water Intrusion Testing (Leak Inspection)", description: "Demonstrates the AAMA 501.2 hose test procedure for detecting water intrusion through cladding systems.", url: "https://www.youtube.com/watch?v=ILtBT9oS82s", addedBy: "Raquel Diaz", addedAt: "2026-02-10" },
        { id: "be2", title: "AS 1530.1 Combustibility Test", description: "Non-combustibility testing for cladding and facade materials to AS 1530.1.", url: "https://www.youtube.com/watch?v=2bYP0QrWGqE", addedBy: "Raquel Diaz", addedAt: "2026-02-10" },
        { id: "be3", title: "Test Apparatus for Flammability – AS 1530.2", description: "Flammability testing apparatus and procedure for cladding materials to AS 1530.2.", url: "https://www.youtube.com/watch?v=UpszMG-NRcw", addedBy: "Raquel Diaz", addedAt: "2026-02-10" },
        { id: "be4", title: "SIDERISE: RH & RV Cavity Barriers for Rainscreen Cladding", description: "Installation guidance for horizontal and vertical cavity barriers in rainscreen cladding systems (2019).", url: "https://www.youtube.com/watch?v=E4fc2OnulD8", addedBy: "Raquel Diaz", addedAt: "2026-02-10" },
        { id: "be5", title: "SFP: Cavity Barriers & Cladding", description: "Overview of cavity barrier requirements and cladding fire performance (2013).", url: "https://www.youtube.com/watch?v=QMt0DTux2zk", addedBy: "Raquel Diaz", addedAt: "2026-02-10" },
        { id: "be6", title: "Air and Vapour Permeability – Wall Sarking/Wrap Details", description: "Explains air and vapour permeability principles for building wall sarking and wrap details (2019).", url: "https://www.youtube.com/watch?v=z3ElnuOYzhg", addedBy: "Raquel Diaz", addedAt: "2026-02-10" },
        { id: "be7", title: "How Tall Buildings Tame the Wind", description: "Engineering principles behind wind load management relevant to cladding design.", url: "https://www.youtube.com/watch?v=tHMPR7flpf4", addedBy: "Raquel Diaz", addedAt: "2026-02-10" },
        { id: "be8", title: "Flow Visualisation Around Simple Building Shapes in Wind Tunnel", description: "Wind tunnel testing showing airflow patterns affecting cladding performance.", url: "https://www.youtube.com/watch?v=UEgk2Bgz16s", addedBy: "Raquel Diaz", addedAt: "2026-02-10" },
        { id: "be9", title: "Wind Engineering – Australasian Wind Engineering Society Lectures", description: "Public lecture series on wind engineering from the Australasian Wind Engineering Society.", url: "https://awes.org/awes-lecture-series-archive/", addedBy: "Raquel Diaz", addedAt: "2026-02-10" },
        { id: "be10", title: "Elemental Architectural Cladding: What is a Rainscreen?", description: "Explains the principles and purpose of rainscreen cladding systems.", url: "https://www.youtube.com/watch?v=x-UpCKntXbU", addedBy: "Raquel Diaz", addedAt: "2026-02-10" },
      ]},
      { id: "be-gen", name: "General", videos: [] },
    ],
  },
  {
    id: "essential-services", name: "Essential Services", icon: "⚡", color: "#5b21b6",
    topics: [
      { id: "es-maintenance", name: "Maintenance", videos: [
        { id: "es1", title: "AS 1851-2012 – Routine Service of Fire Protection Systems", description: "Comprehensive overview of AS 1851-2012 maintenance requirements for all fire protection systems in Australian buildings.", url: "https://www.youtube.com/watch?v=dBMRHSMHMaE", addedBy: "Raquel Diaz", addedAt: "2026-03-01" },
        { id: "es2", title: "Essential Services Maintenance Obligations – NSW", description: "Owner and building manager obligations for essential services maintenance under the EP&A Act and BCA in NSW.", url: "https://www.youtube.com/watch?v=9ZkFmBXmGkI", addedBy: "Raquel Diaz", addedAt: "2026-03-02" },
        { id: "es3", title: "Annual Fire Safety Statement – NSW Requirements", description: "How to prepare and lodge an Annual Fire Safety Statement (AFSS) under the EP&A Regulation 2021.", url: "https://www.youtube.com/watch?v=6Xv3xqZi5Xo", addedBy: "Raquel Diaz", addedAt: "2026-03-03" },
        { id: "es4", title: "Exit & Emergency Lighting – AS 2293 Compliance", description: "Testing and maintenance of emergency and exit lighting systems to AS 2293.2.", url: "https://www.youtube.com/watch?v=sPbxi2HKZWI", addedBy: "Raquel Diaz", addedAt: "2026-03-04" },
        { id: "es5", title: "Hydrant & Hose Reel Systems – AS 2419.1 Overview", description: "Installation and maintenance requirements for fire hydrant and hose reel systems under AS 2419.1.", url: "https://www.youtube.com/watch?v=QnFos1qX2EM", addedBy: "Raquel Diaz", addedAt: "2026-03-05" },
      ]},
      { id: "es-mechanical", name: "Mechanical Services", videos: [
        { id: "es6", title: "HVAC Maintenance – AS 1668.2 Ventilation Requirements", description: "Ventilation system maintenance and compliance under AS 1668.2 for commercial buildings.", url: "https://www.youtube.com/watch?v=KJvKQ8BKZWM", addedBy: "Raquel Diaz", addedAt: "2026-03-06" },
        { id: "es7", title: "Backflow Prevention – AS 3500.1 Plumbing", description: "Backflow prevention device testing and maintenance under AS 3500.1 and NSW Health requirements.", url: "https://www.youtube.com/watch?v=7Ot7nkFVMoU", addedBy: "Raquel Diaz", addedAt: "2026-03-07" },
      ]},
    ],
  },
  {
    id: "vertical-transport", name: "Vertical Transportation", icon: "🛗", color: "#0f766e",
    topics: [
      { id: "vt-lifts", name: "Lifts", videos: [
        { id: "vt1", title: "AS 1735.1 – Lifts, Escalators & Moving Walks Overview", description: "Introduction to the AS 1735 series covering design, installation and maintenance of lifts in Australian buildings.", url: "https://www.youtube.com/watch?v=0KFbFqGqpBk", addedBy: "Raquel Diaz", addedAt: "2026-03-01" },
        { id: "vt2", title: "Lift Safety Inspections – WorkSafe Requirements", description: "Periodic inspection and registration requirements for passenger lifts under state WHS legislation and AS 3788.", url: "https://www.youtube.com/watch?v=sPbxi2HKZWI", addedBy: "Raquel Diaz", addedAt: "2026-03-02" },
        { id: "vt3", title: "Lift Modernisation & NCC Compliance", description: "Upgrading existing lift installations to meet current NCC accessibility and safety requirements.", url: "https://www.youtube.com/watch?v=QnFos1qX2EM", addedBy: "Raquel Diaz", addedAt: "2026-03-03" },
        { id: "vt4", title: "Accessibility in Lifts – AS 1735.12 & DDA", description: "Accessibility requirements for lifts under AS 1735.12 and the Disability Discrimination Act 1992.", url: "https://www.youtube.com/watch?v=dBMRHSMHMaE", addedBy: "Raquel Diaz", addedAt: "2026-03-04" },
        { id: "vt5", title: "Escalator & Moving Walk Maintenance – AS 1735.5", description: "Routine maintenance and safety inspection procedures for escalators and moving walks to AS 1735.5.", url: "https://www.youtube.com/watch?v=9ZkFmBXmGkI", addedBy: "Raquel Diaz", addedAt: "2026-03-05" },
      ]},
      { id: "vt-access", name: "Access & Compliance", videos: [
        { id: "vt6", title: "NCC 2022 – Access Requirements for Vertical Transport", description: "NCC 2022 Section D accessibility provisions for lifts and vertical circulation in Class 2–9 buildings.", url: "https://www.youtube.com/watch?v=KJvKQ8BKZWM", addedBy: "Raquel Diaz", addedAt: "2026-03-06" },
      ]},
    ],
  },
  {
    id: "general", name: "General", icon: "📚", color: "#7A6342",
    topics: [
      { id: "gen-ncc", name: "NCC & Legislation", videos: [
        { id: "gen1", title: "NCC 2022 – What's Changed? Key Updates for Practitioners", description: "Summary of the major changes in NCC 2022 affecting Class 1–9 buildings, including new energy and livability provisions.", url: "https://www.youtube.com/watch?v=7Ot7nkFVMoU", addedBy: "Raquel Diaz", addedAt: "2026-01-10" },
        { id: "gen2", title: "DBP Act 2020 – Obligations for Design Practitioners", description: "Overview of the Design and Building Practitioners Act 2020 and its compliance declaration requirements.", url: "https://www.youtube.com/watch?v=0KFbFqGqpBk", addedBy: "Raquel Diaz", addedAt: "2026-01-12" },
        { id: "gen3", title: "RAB Act 2020 – Residential Apartment Buildings Explained", description: "How the Residential Apartment Buildings Act 2020 affects developers, builders and certifiers in NSW.", url: "https://www.youtube.com/watch?v=sPbxi2HKZWI", addedBy: "Raquel Diaz", addedAt: "2026-01-14" },
        { id: "gen4", title: "EP&A Act 1979 – Development Approvals & Certification", description: "The development approval and building certification process under the Environmental Planning and Assessment Act 1979.", url: "https://www.youtube.com/watch?v=QnFos1qX2EM", addedBy: "Raquel Diaz", addedAt: "2026-01-16" },
        { id: "gen5", title: "NSW Building Commissioner – Compliance & Enforcement", description: "Role of the NSW Building Commissioner in enforcing building standards and rectification orders.", url: "https://www.youtube.com/watch?v=dBMRHSMHMaE", addedBy: "Raquel Diaz", addedAt: "2026-01-18" },
      ]},
      { id: "gen-inspect", name: "Inspections", videos: [
        { id: "gen6", title: "Critical Stage Inspections – PCA Obligations", description: "What inspections a Principal Certifying Authority must carry out at critical stages under the EP&A Regulation 2021.", url: "https://www.youtube.com/watch?v=9ZkFmBXmGkI", addedBy: "Raquel Diaz", addedAt: "2026-02-01" },
        { id: "gen7", title: "iAuditor for Building Inspections – Best Practice", description: "Using iAuditor to conduct, document and report building inspections efficiently and consistently.", url: "https://www.youtube.com/watch?v=KJvKQ8BKZWM", addedBy: "Raquel Diaz", addedAt: "2026-02-05" },
      ]},
    ],
  },
];
function VideoLibrary({ isOwner }: { isOwner: boolean }) {
  const [regimes, setRegimes] = useState<TrainingRegime[]>(() => {
    try { const v = localStorage.getItem("training_regimes_v1"); return v ? JSON.parse(v) : DEFAULT_REGIMES; } catch { return DEFAULT_REGIMES; }
  });
  const [activeRegime, setActiveRegime] = useState<string>("building-enclosure");
  const [activeTopic, setActiveTopic] = useState<string>("be-cladding");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newUrl, setNewUrl] = useState("");
  // Sync active topic when regime changes
  const currentRegime = regimes.find(r => r.id === activeRegime) ?? regimes[0];
  const currentTopic = currentRegime?.topics.find(t => t.id === activeTopic) ?? currentRegime?.topics[0];
  const videos = currentTopic?.videos ?? [];
  const totalVideos = regimes.reduce((sum, r) => sum + r.topics.reduce((s, t) => s + t.videos.length, 0), 0);
  function saveRegimes(next: TrainingRegime[]) {
    setRegimes(next);
    try { localStorage.setItem("training_regimes_v1", JSON.stringify(next)); } catch {}
  }
  function addVideo() {
    if (!newTitle || !newUrl || !currentTopic) return;
    const video: RegimeVideo = { id: Date.now().toString(), title: newTitle, description: newDesc, url: newUrl.startsWith("http") ? newUrl : "https://" + newUrl, addedBy: "Raquel Diaz", addedAt: new Date().toISOString().split("T")[0] };
    const next = regimes.map(r => r.id === activeRegime ? { ...r, topics: r.topics.map(t => t.id === activeTopic ? { ...t, videos: [...t.videos, video] } : t) } : r);
    saveRegimes(next);
    setNewTitle(""); setNewDesc(""); setNewUrl(""); setShowAdd(false);
  }
  function saveEdit(vid: string) {
    if (!editTitle || !editUrl) return;
    const next = regimes.map(r => r.id === activeRegime ? { ...r, topics: r.topics.map(t => t.id === activeTopic ? { ...t, videos: t.videos.map(v => v.id === vid ? { ...v, title: editTitle, description: editDesc, url: editUrl.startsWith("http") ? editUrl : "https://" + editUrl } : v) } : t) } : r);
    saveRegimes(next);
    setEditingId(null);
  }
  function deleteVideo(vid: string) {
    if (!window.confirm("Remove this video from the library?")) return;
    const next = regimes.map(r => r.id === activeRegime ? { ...r, topics: r.topics.map(t => t.id === activeTopic ? { ...t, videos: t.videos.filter(v => v.id !== vid) } : t) } : r);
    saveRegimes(next);
    if (playingId === vid) setPlayingId(null);
    if (editingId === vid) setEditingId(null);
  }
  function getEmbedUrl(url: string): string {
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
    return url;
  }
   function isYoutube(url: string) { return /youtube\.com|youtu\.be/.test(url); }
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#1a1a2e,#1e3a5f)", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>🎬</span>
          <span style={{ fontWeight: 800, fontSize: 15, color: "#fff" }}>Training Library</span>
          <span style={{ background: "rgba(166,138,100,0.35)", color: "#A68A64", borderRadius: 10, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>{totalVideos} videos</span>
        </div>
        {isOwner && (
          <div style={{ display: "flex", gap: 8 }}>
            {editMode && (
              <button onClick={() => { setShowAdd(v => !v); setEditingId(null); }}
                style={{ background: "rgba(166,138,100,0.3)", color: "#A68A64", border: "1px solid rgba(166,138,100,0.5)", borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                + Add Video
              </button>
            )}
            <button onClick={() => { setEditMode(v => !v); setShowAdd(false); setEditingId(null); }}
              style={{ background: editMode ? "rgba(220,38,38,0.2)" : "rgba(166,138,100,0.3)", color: editMode ? "#fca5a5" : "#A68A64", border: `1px solid ${editMode ? "rgba(220,38,38,0.4)" : "rgba(166,138,100,0.5)"}`, borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              {editMode ? "✕ Done Editing" : "✎ Edit Library"}
            </button>
          </div>
        )}
      </div>
      {/* Regime Tabs */}
      <div style={{ display: "flex", overflowX: "auto", borderBottom: "2px solid #e5e7eb", background: "#f8f7f5" }}>
        {regimes.map(r => (
          <button key={r.id} onClick={() => { setActiveRegime(r.id); setActiveTopic(r.topics[0]?.id ?? ""); }}
            style={{ padding: "10px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", border: "none", borderBottom: activeRegime === r.id ? `3px solid ${r.color}` : "3px solid transparent", background: activeRegime === r.id ? "#fff" : "transparent", color: activeRegime === r.id ? r.color : "#6b7280", display: "flex", alignItems: "center", gap: 5 }}>
            <span>{r.icon}</span> {r.name}
            <span style={{ background: activeRegime === r.id ? r.color : "#e5e7eb", color: activeRegime === r.id ? "#fff" : "#6b7280", borderRadius: 8, padding: "1px 6px", fontSize: 10, fontWeight: 700 }}>
              {r.topics.reduce((s, t) => s + t.videos.length, 0)}
            </span>
          </button>
        ))}
      </div>
      {/* Topic Tabs */}
      {currentRegime && currentRegime.topics.length > 1 && (
        <div style={{ display: "flex", gap: 6, padding: "10px 16px", background: "#fff", borderBottom: "1px solid #e5e7eb" }}>
          {currentRegime.topics.map(t => (
            <button key={t.id} onClick={() => setActiveTopic(t.id)}
              style={{ padding: "5px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer", borderRadius: 20, border: activeTopic === t.id ? `1.5px solid ${currentRegime.color}` : "1.5px solid #e5e7eb", background: activeTopic === t.id ? currentRegime.color : "#f3f4f6", color: activeTopic === t.id ? "#fff" : "#374151" }}>
              {t.name} <span style={{ opacity: 0.8 }}>({t.videos.length})</span>
            </button>
          ))}
        </div>
      )}
      {/* Add Video Form */}
      {showAdd && isOwner && editMode && (
        <div style={{ background: "#f8f7f5", borderBottom: "1px solid #e5e7eb", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
          <input placeholder="Video title *" value={newTitle} onChange={e => setNewTitle(e.target.value)}
            style={{ border: "1px solid #d1d5db", borderRadius: 5, padding: "7px 10px", fontSize: 13 }} />
          <input placeholder="Description (optional)" value={newDesc} onChange={e => setNewDesc(e.target.value)}
            style={{ border: "1px solid #d1d5db", borderRadius: 5, padding: "7px 10px", fontSize: 13 }} />
          <input placeholder="Video URL (YouTube, Vimeo, or direct link) *" value={newUrl} onChange={e => setNewUrl(e.target.value)}
            style={{ border: "1px solid #d1d5db", borderRadius: 5, padding: "7px 10px", fontSize: 13 }} />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button onClick={() => setShowAdd(false)} style={{ background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", borderRadius: 5, padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
            <button onClick={addVideo} style={{ background: "linear-gradient(135deg,#7A6342,#A68A64)", color: "#fff", border: "none", borderRadius: 5, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Add Video</button>
          </div>
        </div>
      )}
      {/* Video Grid */}
      <div style={{ padding: "16px", display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
        {videos.length === 0 ? (
          <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "40px", color: "#9ca3af", fontSize: 13 }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🎬</div>
            <div>No videos in this topic yet. {isOwner ? "Click + Add Video to add one." : "Check back later."}</div>
          </div>
        ) : (
          videos.map(v => (
            <div key={v.id} style={{ border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden", background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", transition: "box-shadow 0.2s" }}>
              {playingId === v.id ? (
                <div style={{ position: "relative", paddingBottom: "56.25%", background: "#000" }}>
                  <iframe src={getEmbedUrl(v.url)} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title={v.title} />
                </div>
              ) : (
                <div onClick={() => isYoutube(v.url) ? setPlayingId(v.id) : window.open(v.url, "_blank")}
                  style={{ background: "linear-gradient(135deg,#1a1a2e,#1e3a5f)", height: 130, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative" }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(166,138,100,0.3)", border: "2px solid rgba(166,138,100,0.6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{isYoutube(v.url) ? "▶" : "🔗"}</div>
                  <div style={{ position: "absolute", bottom: 8, left: 10, right: 10, color: "#fff", fontSize: 11, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>{v.title}</div>
                </div>
              )}
              <div style={{ padding: "10px 12px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 12, color: "#1a1a2e", marginBottom: 2, lineHeight: 1.3 }}>{v.title}</div>
                  {v.description && <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4, lineHeight: 1.4 }}>{v.description}</div>}
                  <div style={{ fontSize: 10, color: "#9ca3af" }}>Added {v.addedAt}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
                  {!editMode && (
                    <button onClick={() => isYoutube(v.url) ? setPlayingId(playingId === v.id ? null : v.id) : window.open(v.url, "_blank")}
                      style={{ background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", borderRadius: 4, padding: "4px 8px", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
                      {playingId === v.id ? "Close" : isYoutube(v.url) ? "▶ Play" : "Open"}
                    </button>
                  )}
                  {isOwner && editMode && (
                    <>
                      <button onClick={() => { setEditingId(editingId === v.id ? null : v.id); setEditTitle(v.title); setEditDesc(v.description); setEditUrl(v.url); setShowAdd(false); }}
                        style={{ background: "#fef3c7", color: "#92400e", border: "1px solid #fcd34d", borderRadius: 4, padding: "4px 8px", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>✎ Edit</button>
                      <button onClick={() => deleteVideo(v.id)}
                        style={{ background: "#fee2e2", color: "#c0392b", border: "1px solid #fca5a5", borderRadius: 4, padding: "4px 8px", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>Delete</button>
                    </>
                  )}
                </div>
              </div>
            {editingId === v.id && isOwner && editMode && (
              <div style={{ background: "#fffbeb", borderTop: "1px solid #fcd34d", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 7 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#92400e", marginBottom: 2 }}>Edit Video Details</div>
                <input placeholder="Title *" value={editTitle} onChange={e => setEditTitle(e.target.value)}
                  style={{ border: "1px solid #fcd34d", borderRadius: 5, padding: "6px 9px", fontSize: 12 }} />
                <input placeholder="Description" value={editDesc} onChange={e => setEditDesc(e.target.value)}
                  style={{ border: "1px solid #fcd34d", borderRadius: 5, padding: "6px 9px", fontSize: 12 }} />
                <input placeholder="URL *" value={editUrl} onChange={e => setEditUrl(e.target.value)}
                  style={{ border: "1px solid #fcd34d", borderRadius: 5, padding: "6px 9px", fontSize: 12 }} />
                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                  <button onClick={() => setEditingId(null)} style={{ background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", borderRadius: 5, padding: "5px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                  <button onClick={() => saveEdit(v.id)} style={{ background: "linear-gradient(135deg,#7A6342,#A68A64)", color: "#fff", border: "none", borderRadius: 5, padding: "5px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Save</button>
                </div>
              </div>
            )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
// ─── Edit Section Modal (with emoji picker) ──────────────────────────────────
function EditSectionModal({ section, links, onClose, onSave, onDeleteLink, onAddLink }: {
  section: { id: string; name: string; color: string; position: string; icon?: string };
  links: LinkItem[];
  onClose: () => void;
  onSave: (id: string, name: string, color: string, icon: string) => void;
  onDeleteLink: (id: string) => void;
  onAddLink: (label: string, url: string) => void;
}) {
  const [name, setName] = useState(section.name);
  const [color, setColor] = useState(section.color);
  const [icon, setIcon] = useState(section.icon || "📌");
  const [newLabel, setNewLabel] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const EDIT_COLORS = [
    "#1e3a5f", "#2d6a4f", "#7A6342", "#5b21b6", "#374151", "#0f766e", "#991b1b", "#3730a3",
  ];
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 10001, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 12, width: "100%", maxWidth: 520, maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ background: color, borderRadius: "12px 12px 0 0", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>{icon} Edit Section</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.8)", fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ flex: 1, overflow: "auto", padding: "18px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Icon */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Section Icon</label>
            <EmojiPicker value={icon} onChange={setIcon} />
          </div>
          {/* Name */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Section Name</label>
            <input value={name} onChange={e => setName(e.target.value)}
              style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 5, padding: "8px 12px", fontSize: 13, boxSizing: "border-box" }} />
          </div>
          {/* Colour */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Header Colour</label>
            <div style={{ display: "flex", gap: 8 }}>
              {EDIT_COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)} style={{
                  width: 26, height: 26, borderRadius: "50%", background: c,
                  border: color === c ? "3px solid #A68A64" : "2px solid transparent",
                  cursor: "pointer", outline: color === c ? "2px solid #A68A64" : "none", outlineOffset: 1,
                }} />
              ))}
            </div>
          </div>
          {/* Existing links */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Links ({links.length})</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 5, maxHeight: 200, overflow: "auto" }}>
              {links.length === 0
                ? <div style={{ fontSize: 12, color: "#9ca3af", fontStyle: "italic" }}>No links yet.</div>
                : links.map(l => (
                  <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 8, background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 6, padding: "6px 10px" }}>
                    <a href={l.url} target="_blank" rel="noopener noreferrer" style={{ flex: 1, fontSize: 12, color: "#1e3a5f", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.label}</a>
                    <button onClick={() => onDeleteLink(l.id)} style={{ background: "#fee2e2", color: "#c0392b", border: "none", borderRadius: 4, padding: "2px 7px", fontSize: 11, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>✕</button>
                  </div>
                ))
              }
            </div>
          </div>
          {/* Add new link */}
          <div style={{ background: "#f8f7f5", border: "1px solid #e5e7eb", borderRadius: 8, padding: "12px 14px" }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>+ Add New Link</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <input placeholder="Link label" value={newLabel} onChange={e => setNewLabel(e.target.value)}
                style={{ border: "1px solid #d1d5db", borderRadius: 5, padding: "7px 10px", fontSize: 12 }} />
              <input placeholder="https://..." value={newUrl} onChange={e => setNewUrl(e.target.value)}
                style={{ border: "1px solid #d1d5db", borderRadius: 5, padding: "7px 10px", fontSize: 12 }} />
              <button onClick={() => { if (newLabel && newUrl) { onAddLink(newLabel, newUrl); setNewLabel(""); setNewUrl(""); } }}
                style={{ background: "linear-gradient(135deg,#1e3a5f,#2d6a8f)", color: "#fff", border: "none", borderRadius: 5, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", alignSelf: "flex-end" }}>Add Link</button>
            </div>
          </div>
        </div>
        <div style={{ padding: "12px 20px", borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={{ background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", borderRadius: 5, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          <button onClick={() => { onSave(section.id, name, color, icon); onClose(); }} style={{ background: "linear-gradient(135deg,#7A6342,#A68A64)", color: "#fff", border: "none", borderRadius: 5, padding: "8px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}

// ─── Add Section Modal (with colour picker + emoji picker) ───────────────────
const SECTION_COLORS = [
  { label: "Navy", value: "#1e3a5f" },
  { label: "Forest", value: "#2d6a4f" },
  { label: "Bronze", value: "#7A6342" },
  { label: "Purple", value: "#5b21b6" },
  { label: "Slate", value: "#374151" },
  { label: "Teal", value: "#0f766e" },
  { label: "Crimson", value: "#991b1b" },
  { label: "Indigo", value: "#3730a3" },
];

type SectionPosition = "mid-left" | "mid-center" | "mid-right" | "right";
const POSITION_LABELS: Record<SectionPosition, string> = {
  "mid-left": "Middle-Left",
  "mid-center": "Middle-Center",
  "mid-right": "Middle-Right",
  "right": "Right",
};

function AddSectionModal({ onClose, onAdd }: { onClose: () => void; onAdd: (name: string, position: SectionPosition, color: string, icon: string) => void }) {
  const [name, setName] = useState("");
  const [position, setPosition] = useState<SectionPosition>("mid-left");
  const [color, setColor] = useState("#1e3a5f");
  const [icon, setIcon] = useState("📌");
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: 10, padding: "28px 32px", maxWidth: 480, width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "#1a1a2e" }}>Create New Section</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Icon picker */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Section Icon</label>
            <EmojiPicker value={icon} onChange={setIcon} />
          </div>
          <input placeholder="Section name" value={name} onChange={e => setName(e.target.value)}
            style={{ border: "1px solid #d1d5db", borderRadius: 5, padding: "8px 12px", fontSize: 13 }} />
          {/* Colour picker */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Header Colour</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {SECTION_COLORS.map(c => (
                <button key={c.value} onClick={() => setColor(c.value)} title={c.label} style={{
                  width: 28, height: 28, borderRadius: "50%", background: c.value, border: color === c.value ? "3px solid #A68A64" : "2px solid transparent",
                  cursor: "pointer", outline: color === c.value ? "2px solid #A68A64" : "none", outlineOffset: 1,
                }} />
              ))}
            </div>
          </div>
          {/* Position */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Position</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {(Object.keys(POSITION_LABELS) as SectionPosition[]).map(p => (
                <button key={p} onClick={() => setPosition(p)} style={{
                  padding: "9px 8px", border: `2px solid ${position === p ? "#A68A64" : "#d1d5db"}`,
                  borderRadius: 6, background: position === p ? "#fef9f0" : "#f9fafb",
                  color: position === p ? "#7A6342" : "#374151", fontWeight: 600, fontSize: 11, cursor: "pointer", textAlign: "center"
                }}>{POSITION_LABELS[p]}</button>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
          <button onClick={onClose} style={{ background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", borderRadius: 5, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          <button onClick={() => { if (name) { onAdd(name, position, color, icon); onClose(); } }} style={{ background: "linear-gradient(135deg,#7A6342,#A68A64)", color: "#fff", border: "none", borderRadius: 5, padding: "8px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Create Section</button>
        </div>
      </div>
    </div>
  );
}

// ─── Outlook-style Calendar ─────────────────────────────────────────────────
type CalView = "month" | "week" | "day" | "agenda";
type EventCategory = "Inspection" | "Meeting" | "Leave" | "Task" | "Deadline" | "Site Visit" | "Training" | "Other";
interface OEvent {
  id: string;
  title: string;
  date: string;        // YYYY-MM-DD
  endDate?: string;    // YYYY-MM-DD (for multi-day)
  startTime?: string;  // HH:MM
  endTime?: string;    // HH:MM
  category: EventCategory;
  description?: string;
  location?: string;
  assignedTo: string[];  // member names
  allDay: boolean;
  published: boolean;
}
const CAT_COLORS: Record<EventCategory, { bg: string; text: string; border: string }> = {
  Inspection:  { bg: "#1e3a5f", text: "#fff", border: "#2d5a8e" },
  Meeting:     { bg: "#7A6342", text: "#fff", border: "#A68A64" },
  Leave:       { bg: "#2d6a4f", text: "#fff", border: "#3d8b6a" },
  Task:        { bg: "#5b21b6", text: "#fff", border: "#7c3aed" },
  Deadline:    { bg: "#c0392b", text: "#fff", border: "#e74c3c" },
  "Site Visit":{ bg: "#0f4c81", text: "#fff", border: "#1a6bb5" },
  Training:    { bg: "#374151", text: "#fff", border: "#6b7280" },
  Other:       { bg: "#6b7280", text: "#fff", border: "#9ca3af" },
};
const SAMPLE_EVENTS: OEvent[] = [
  { id: "ev1", title: "OC Inspection – 12 Pitt St", date: "2026-03-16", startTime: "09:00", endTime: "11:00", category: "Inspection", location: "12 Pitt St, Sydney", assignedTo: ["Raquel Diaz"], allDay: false, published: true, description: "Final OC inspection for residential development" },
  { id: "ev2", title: "Team Meeting", date: "2026-03-17", startTime: "14:00", endTime: "15:00", category: "Meeting", assignedTo: ["Raquel Diaz", "John Smith"], allDay: false, published: true },
  { id: "ev3", title: "DBP Compliance Review", date: "2026-03-20", startTime: "10:00", endTime: "12:00", category: "Inspection", location: "45 Macquarie St, Parramatta", assignedTo: ["Raquel Diaz"], allDay: false, published: true },
  { id: "ev4", title: "Annual Leave – R. Diaz", date: "2026-03-23", endDate: "2026-03-27", category: "Leave", assignedTo: ["Raquel Diaz"], allDay: true, published: true },
  { id: "ev5", title: "Submission Deadline – P007", date: "2026-03-25", category: "Deadline", assignedTo: ["John Smith"], allDay: true, published: true, description: "Final design documentation due" },
  { id: "ev6", title: "Site Visit – Penrith Dev", date: "2026-04-02", startTime: "08:30", endTime: "10:30", category: "Site Visit", location: "Penrith, NSW", assignedTo: ["Raquel Diaz"], allDay: false, published: true },
  { id: "ev7", title: "RAB Act Training", date: "2026-04-08", startTime: "13:00", endTime: "17:00", category: "Training", assignedTo: ["Raquel Diaz", "John Smith"], allDay: false, published: true },
];
function localDs(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function parseDs(ds: string): Date {
  const [y,m,d] = ds.split("-").map(Number);
  return new Date(y, m-1, d);
}
function addDays(ds: string, n: number): string {
  const d = parseDs(ds); d.setDate(d.getDate()+n); return localDs(d);
}
function isBetween(ds: string, start: string, end: string): boolean {
  return ds >= start && ds <= end;
}
function OutlookCalendar({ members, isOwner }: { members: Member[]; isOwner: boolean }) {
  const today = localDs(new Date());
  const [view, setView] = useState<CalView>("month");
  const [navDate, setNavDate] = useState(today); // anchor date for navigation
  const [events, setEvents] = useState<OEvent[]>(SAMPLE_EVENTS);
  const [showCreate, setShowCreate] = useState(false);
  const [editEvent, setEditEvent] = useState<OEvent | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<OEvent | null>(null);
  const [filterCat, setFilterCat] = useState<EventCategory | "All">("All");
  const [filterMember, setFilterMember] = useState<string>("All");
  // ── Navigation helpers ──────────────────────────────────────────────────────
  const navD = parseDs(navDate);
  const navYear = navD.getFullYear();
  const navMonth = navD.getMonth(); // 0-indexed
  function goBack() {
    if (view === "month") { const d = new Date(navYear, navMonth-1, 1); setNavDate(localDs(d)); }
    else if (view === "week") { setNavDate(addDays(navDate, -7)); }
    else if (view === "day") { setNavDate(addDays(navDate, -1)); }
    else { const d = new Date(navYear, navMonth-1, 1); setNavDate(localDs(d)); }
  }
  function goForward() {
    if (view === "month") { const d = new Date(navYear, navMonth+1, 1); setNavDate(localDs(d)); }
    else if (view === "week") { setNavDate(addDays(navDate, 7)); }
    else if (view === "day") { setNavDate(addDays(navDate, 1)); }
    else { const d = new Date(navYear, navMonth+1, 1); setNavDate(localDs(d)); }
  }
  function goToday() { setNavDate(today); }
  // ── Filtered events ─────────────────────────────────────────────────────────
  function eventsOnDay(ds: string): OEvent[] {
    return events.filter(ev => {
      const inRange = ev.endDate ? isBetween(ds, ev.date, ev.endDate) : ev.date === ds;
      const catOk = filterCat === "All" || ev.category === filterCat;
      const memOk = filterMember === "All" || ev.assignedTo.includes(filterMember);
      return inRange && catOk && memOk;
    });
  }
  // ── Month view ──────────────────────────────────────────────────────────────
  function renderMonth() {
    const firstDay = new Date(navYear, navMonth, 1).getDay();
    const daysInMonth = new Date(navYear, navMonth+1, 0).getDate();
    const cells: (string | null)[] = [
      ...Array(firstDay).fill(null),
      ...Array.from({length: daysInMonth}, (_,i) => `${navYear}-${String(navMonth+1).padStart(2,"0")}-${String(i+1).padStart(2,"0")}`)
    ];
    // pad to full weeks
    while (cells.length % 7 !== 0) cells.push(null);
    const weeks: (string|null)[][] = [];
    for (let i=0; i<cells.length; i+=7) weeks.push(cells.slice(i,i+7));
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Day headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", background: "#252545", borderRadius: "8px 8px 0 0" }}>
          {["SUN","MON","TUE","WED","THU","FRI","SAT"].map(d => (
            <div key={d} style={{ padding: "8px 4px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#A68A64", letterSpacing: "0.06em" }}>{d}</div>
          ))}
        </div>
        {/* Weeks */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", border: "1px solid #e5e7eb", borderTop: "none", borderRadius: "0 0 8px 8px", overflow: "hidden" }}>
          {weeks.map((week, wi) => (
            <div key={wi} style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", flex: 1, borderBottom: wi < weeks.length-1 ? "1px solid #e5e7eb" : "none", minHeight: 90 }}>
              {week.map((ds, di) => {
                const dayEvs = ds ? eventsOnDay(ds) : [];
                const isToday = ds === today;
                const isCurrentMonth = ds ? parseInt(ds.split("-")[1])-1 === navMonth : false;
                return (
                  <div key={di} onClick={() => { if (ds) { setNavDate(ds); setView("day"); } }}
                    style={{
                      borderLeft: di > 0 ? "1px solid #e5e7eb" : "none",
                      background: isToday ? "#fffbf0" : "#fff",
                      padding: "4px 4px 2px", cursor: ds ? "pointer" : "default",
                      transition: "background 0.1s", overflow: "hidden",
                    }}
                    onMouseEnter={e => { if (ds) (e.currentTarget as HTMLDivElement).style.background = isToday ? "#fef3c7" : "#f8f7f5"; }}
                    onMouseLeave={e => { if (ds) (e.currentTarget as HTMLDivElement).style.background = isToday ? "#fffbf0" : "#fff"; }}
                  >
                    {ds && (
                      <>
                        <div style={{
                          width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 12, fontWeight: isToday ? 800 : 500, marginBottom: 2,
                          background: isToday ? "#A68A64" : "transparent",
                          color: isToday ? "#fff" : isCurrentMonth ? "#1a1a2e" : "#c5b49a",
                        }}>{parseInt(ds.split("-")[2])}</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                          {dayEvs.slice(0,3).map(ev => (
                            <div key={ev.id}
                              onClick={e => { e.stopPropagation(); setSelectedEvent(ev); }}
                              style={{
                                background: CAT_COLORS[ev.category].bg,
                                color: CAT_COLORS[ev.category].text,
                                borderRadius: 3, padding: "1px 5px", fontSize: 10, fontWeight: 600,
                                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                                cursor: "pointer",
                              }}>
                              {ev.allDay ? "" : (ev.startTime ? ev.startTime+" " : "")}{ev.title}
                            </div>
                          ))}
                          {dayEvs.length > 3 && (
                            <div style={{ fontSize: 10, color: "#6b7280", fontWeight: 600, paddingLeft: 4 }}>+{dayEvs.length-3} more</div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  }
  // ── Week view ───────────────────────────────────────────────────────────────
  function getWeekStart(ds: string): string {
    const d = parseDs(ds);
    d.setDate(d.getDate() - d.getDay());
    return localDs(d);
  }
  function renderWeek() {
    const weekStart = getWeekStart(navDate);
    const days = Array.from({length:7}, (_,i) => addDays(weekStart, i));
    const hours = Array.from({length:24}, (_,i) => i);
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Day headers */}
        <div style={{ display: "grid", gridTemplateColumns: "52px repeat(7,1fr)", background: "#252545", borderRadius: "8px 8px 0 0" }}>
          <div />
          {days.map(ds => {
            const d = parseDs(ds);
            const isToday = ds === today;
            return (
              <div key={ds} style={{ padding: "8px 4px", textAlign: "center", cursor: "pointer" }}
                onClick={() => { setNavDate(ds); setView("day"); }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#A68A64", letterSpacing: "0.06em" }}>
                  {["SUN","MON","TUE","WED","THU","FRI","SAT"][d.getDay()]}
                </div>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", margin: "2px auto 0",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: isToday ? "#A68A64" : "transparent",
                  color: isToday ? "#fff" : "#e5e7eb", fontSize: 13, fontWeight: isToday ? 800 : 600,
                }}>{d.getDate()}</div>
              </div>
            );
          })}
        </div>
        {/* All-day row */}
        <div style={{ display: "grid", gridTemplateColumns: "52px repeat(7,1fr)", borderBottom: "2px solid #e5e7eb", background: "#f8f7f5" }}>
          <div style={{ fontSize: 10, color: "#9ca3af", padding: "4px 6px", display: "flex", alignItems: "center" }}>All day</div>
          {days.map(ds => {
            const allDayEvs = eventsOnDay(ds).filter(ev => ev.allDay);
            return (
              <div key={ds} style={{ borderLeft: "1px solid #e5e7eb", padding: "2px 2px", minHeight: 24 }}>
                {allDayEvs.map(ev => (
                  <div key={ev.id} onClick={() => setSelectedEvent(ev)}
                    style={{ background: CAT_COLORS[ev.category].bg, color: CAT_COLORS[ev.category].text, borderRadius: 3, padding: "1px 5px", fontSize: 10, fontWeight: 600, marginBottom: 1, cursor: "pointer", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {ev.title}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
        {/* Time grid */}
        <div style={{ flex: 1, overflow: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "52px repeat(7,1fr)", position: "relative" }}>
            {hours.map(h => (
              <>
                <div key={`h${h}`} style={{ fontSize: 10, color: "#9ca3af", padding: "0 6px", height: 48, display: "flex", alignItems: "flex-start", paddingTop: 2, borderTop: "1px solid #f3f4f6" }}>
                  {h === 0 ? "" : `${String(h).padStart(2,"0")}:00`}
                </div>
                {days.map(ds => {
                  const timeEvs = eventsOnDay(ds).filter(ev => !ev.allDay && ev.startTime && parseInt(ev.startTime.split(":")[0]) === h);
                  return (
                    <div key={ds} style={{ borderLeft: "1px solid #e5e7eb", borderTop: "1px solid #f3f4f6", height: 48, position: "relative", padding: "1px" }}>
                      {timeEvs.map(ev => (
                        <div key={ev.id} onClick={() => setSelectedEvent(ev)}
                          style={{
                            background: CAT_COLORS[ev.category].bg, color: CAT_COLORS[ev.category].text,
                            borderRadius: 3, padding: "2px 5px", fontSize: 10, fontWeight: 600,
                            cursor: "pointer", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          }}>
                          {ev.startTime} {ev.title}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </>
            ))}
          </div>
        </div>
      </div>
    );
  }
  // ── Day view ────────────────────────────────────────────────────────────────
  function renderDay() {
    const dayEvs = eventsOnDay(navDate);
    const allDayEvs = dayEvs.filter(ev => ev.allDay);
    const timedEvs = dayEvs.filter(ev => !ev.allDay);
    const hours = Array.from({length:24}, (_,i) => i);
    const d = parseDs(navDate);
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ background: "#252545", borderRadius: "8px 8px 0 0", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: "50%",
            background: navDate === today ? "#A68A64" : "rgba(255,255,255,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, fontWeight: 800, color: "#fff",
          }}>{d.getDate()}</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>
              {["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][d.getDay()]}
            </div>
            <div style={{ fontSize: 11, color: "#A68A64" }}>
              {d.toLocaleDateString("en-AU", { month: "long", year: "numeric" })}
            </div>
          </div>
          <div style={{ marginLeft: "auto", fontSize: 12, color: "#c5b49a" }}>{dayEvs.length} event{dayEvs.length !== 1 ? "s" : ""}</div>
        </div>
        {allDayEvs.length > 0 && (
          <div style={{ background: "#f8f7f5", borderLeft: "1px solid #e5e7eb", borderRight: "1px solid #e5e7eb", padding: "6px 12px", display: "flex", gap: 6, flexWrap: "wrap" }}>
            {allDayEvs.map(ev => (
              <div key={ev.id} onClick={() => setSelectedEvent(ev)}
                style={{ background: CAT_COLORS[ev.category].bg, color: CAT_COLORS[ev.category].text, borderRadius: 4, padding: "3px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                {ev.title}
              </div>
            ))}
          </div>
        )}
        <div style={{ flex: 1, overflow: "auto", border: "1px solid #e5e7eb", borderTop: "none", borderRadius: "0 0 8px 8px" }}>
          {hours.map(h => {
            const hEvs = timedEvs.filter(ev => ev.startTime && parseInt(ev.startTime.split(":")[0]) === h);
            return (
              <div key={h} style={{ display: "grid", gridTemplateColumns: "52px 1fr", borderTop: h > 0 ? "1px solid #f3f4f6" : "none", minHeight: 52 }}>
                <div style={{ fontSize: 11, color: "#9ca3af", padding: "4px 8px", borderRight: "1px solid #e5e7eb" }}>
                  {h === 0 ? "" : `${String(h).padStart(2,"0")}:00`}
                </div>
                <div style={{ padding: "2px 8px", display: "flex", flexDirection: "column", gap: 2 }}>
                  {hEvs.map(ev => (
                    <div key={ev.id} onClick={() => setSelectedEvent(ev)}
                      style={{
                        background: CAT_COLORS[ev.category].bg, color: CAT_COLORS[ev.category].text,
                        borderRadius: 5, padding: "6px 12px", fontSize: 12, fontWeight: 600,
                        cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                      }}>
                      <span>{ev.startTime}{ev.endTime ? ` – ${ev.endTime}` : ""}</span>
                      <span style={{ flex: 1 }}>{ev.title}</span>
                      {ev.location && <span style={{ fontSize: 10, opacity: 0.8 }}>📍 {ev.location}</span>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  // ── Agenda view ─────────────────────────────────────────────────────────────
  function renderAgenda() {
    // Show next 60 days from navDate
    const agendaDays: { ds: string; evs: OEvent[] }[] = [];
    for (let i=0; i<60; i++) {
      const ds = addDays(navDate, i);
      const evs = eventsOnDay(ds);
      if (evs.length > 0) agendaDays.push({ ds, evs });
    }
    return (
      <div style={{ flex: 1, overflow: "auto" }}>
        {agendaDays.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#9ca3af" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>No events in the next 60 days</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>Click <strong>+ New Event</strong> to add one</div>
          </div>
        ) : agendaDays.map(({ ds, evs }) => {
          const d = parseDs(ds);
          const isToday = ds === today;
          return (
            <div key={ds} style={{ display: "flex", gap: 0, borderBottom: "1px solid #f3f4f6" }}>
              <div style={{
                width: 80, flexShrink: 0, padding: "12px 8px", textAlign: "center",
                background: isToday ? "#fffbf0" : "#f8f7f5",
                borderRight: "2px solid #e5e7eb",
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#A68A64", letterSpacing: "0.06em" }}>
                  {["SUN","MON","TUE","WED","THU","FRI","SAT"][d.getDay()]}
                </div>
                <div style={{
                  fontSize: 22, fontWeight: 800,
                  color: isToday ? "#A68A64" : "#1a1a2e",
                }}>{d.getDate()}</div>
                <div style={{ fontSize: 10, color: "#6b7280" }}>
                  {d.toLocaleDateString("en-AU", { month: "short" })}
                </div>
              </div>
              <div style={{ flex: 1, padding: "8px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
                {evs.map(ev => (
                  <div key={ev.id} onClick={() => setSelectedEvent(ev)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      background: "#fff", border: `2px solid ${CAT_COLORS[ev.category].border}`,
                      borderLeft: `5px solid ${CAT_COLORS[ev.category].bg}`,
                      borderRadius: 6, padding: "8px 12px", cursor: "pointer",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                      transition: "box-shadow 0.15s",
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 12px rgba(0,0,0,0.12)"}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)"}
                  >
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: CAT_COLORS[ev.category].bg, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "#1a1a2e" }}>{ev.title}</div>
                      <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2, display: "flex", gap: 12, flexWrap: "wrap" }}>
                        {!ev.allDay && ev.startTime && <span>🕐 {ev.startTime}{ev.endTime ? ` – ${ev.endTime}` : ""}</span>}
                        {ev.allDay && <span>📅 All day</span>}
                        {ev.location && <span>📍 {ev.location}</span>}
                        {ev.assignedTo.length > 0 && <span>👤 {ev.assignedTo.join(", ")}</span>}
                      </div>
                    </div>
                    <span style={{ background: CAT_COLORS[ev.category].bg, color: CAT_COLORS[ev.category].text, borderRadius: 4, padding: "2px 8px", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{ev.category}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }
  // ── Mini calendar sidebar ───────────────────────────────────────────────────
  function renderMiniCal() {
    const firstDay = new Date(navYear, navMonth, 1).getDay();
    const daysInMonth = new Date(navYear, navMonth+1, 0).getDate();
    const cells: (string|null)[] = [
      ...Array(firstDay).fill(null),
      ...Array.from({length:daysInMonth}, (_,i) => `${navYear}-${String(navMonth+1).padStart(2,"0")}-${String(i+1).padStart(2,"0")}`)
    ];
    while (cells.length % 7 !== 0) cells.push(null);
    return (
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "12px", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <button onClick={goBack} style={{ background: "none", border: "none", cursor: "pointer", color: "#7A6342", fontSize: 16, fontWeight: 700 }}>‹</button>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#1a1a2e" }}>
            {new Date(navYear, navMonth, 1).toLocaleString("en-AU", { month: "long", year: "numeric" })}
          </span>
          <button onClick={goForward} style={{ background: "none", border: "none", cursor: "pointer", color: "#7A6342", fontSize: 16, fontWeight: 700 }}>›</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 1, textAlign: "center" }}>
          {["S","M","T","W","T","F","S"].map((d,i) => (
            <div key={i} style={{ fontSize: 9, fontWeight: 700, color: "#A68A64", padding: "2px 0" }}>{d}</div>
          ))}
          {cells.map((ds, i) => {
            const hasEvs = ds ? eventsOnDay(ds).length > 0 : false;
            const isToday = ds === today;
            const isNav = ds === navDate;
            return (
              <div key={i} onClick={() => { if (ds) { setNavDate(ds); if (view === "month") setView("day"); } }}
                style={{
                  fontSize: 11, padding: "3px 1px", borderRadius: 4, cursor: ds ? "pointer" : "default",
                  background: isNav ? "#A68A64" : isToday ? "#fef3c7" : "transparent",
                  color: isNav ? "#fff" : isToday ? "#92400e" : ds ? "#374151" : "transparent",
                  fontWeight: isToday || isNav ? 700 : 400,
                  position: "relative",
                }}>
                {ds ? parseInt(ds.split("-")[2]) : ""}
                {hasEvs && !isNav && <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#A68A64", margin: "0 auto", marginTop: 1 }} />}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  // ── Event detail popup ──────────────────────────────────────────────────────
  function renderEventDetail() {
    if (!selectedEvent) return null;
    const ev = selectedEvent;
    const cat = CAT_COLORS[ev.category];
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
        onClick={() => setSelectedEvent(null)}>
        <div style={{ background: "#fff", borderRadius: 12, maxWidth: 460, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", overflow: "hidden" }}
          onClick={e => e.stopPropagation()}>
          <div style={{ background: cat.bg, padding: "16px 20px", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.7)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>{ev.category}</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#fff" }}>{ev.title}</div>
            </div>
            <button onClick={() => setSelectedEvent(null)} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: 5, padding: "4px 10px", cursor: "pointer", fontSize: 14 }}>✕</button>
          </div>
          <div style={{ padding: "20px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 16 }}>📅</span>
                <span style={{ fontSize: 13, color: "#374151" }}>
                  {ev.date}{ev.endDate && ev.endDate !== ev.date ? ` → ${ev.endDate}` : ""}
                  {!ev.allDay && ev.startTime ? ` · ${ev.startTime}${ev.endTime ? ` – ${ev.endTime}` : ""}` : " · All day"}
                </span>
              </div>
              {ev.location && (
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 16 }}>📍</span>
                  <span style={{ fontSize: 13, color: "#374151" }}>{ev.location}</span>
                </div>
              )}
              {ev.assignedTo.length > 0 && (
                <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 16 }}>👤</span>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {ev.assignedTo.map(name => (
                      <span key={name} style={{ background: "#f3f4f6", borderRadius: 4, padding: "2px 8px", fontSize: 12, fontWeight: 600, color: "#374151" }}>{name}</span>
                    ))}
                  </div>
                </div>
              )}
              {ev.description && (
                <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 16 }}>📝</span>
                  <span style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>{ev.description}</span>
                </div>
              )}
            </div>
            {isOwner && (
              <div style={{ display: "flex", gap: 8, marginTop: 20, justifyContent: "flex-end" }}>
                <button onClick={() => { setEditEvent(ev); setSelectedEvent(null); setShowCreate(true); }}
                  style={{ background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", borderRadius: 5, padding: "7px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>✏️ Edit</button>
                <button onClick={() => { setEvents(prev => prev.filter(e => e.id !== ev.id)); setSelectedEvent(null); }}
                  style={{ background: "#fee2e2", color: "#c0392b", border: "none", borderRadius: 5, padding: "7px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>🗑 Delete</button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
  // ── Create/Edit event modal ─────────────────────────────────────────────────
  function renderCreateModal() {
    if (!showCreate) return null;
    const isEdit = !!editEvent;
    const [title, setTitle] = useState(editEvent?.title || "");
    const [date, setDate] = useState(editEvent?.date || navDate);
    const [endDate, setEndDate] = useState(editEvent?.endDate || "");
    const [startTime, setStartTime] = useState(editEvent?.startTime || "");
    const [endTime, setEndTime] = useState(editEvent?.endTime || "");
    const [category, setCategory] = useState<EventCategory>(editEvent?.category || "Meeting");
    const [description, setDescription] = useState(editEvent?.description || "");
    const [location, setLocation] = useState(editEvent?.location || "");
    const [allDay, setAllDay] = useState(editEvent?.allDay ?? false);
    const [assigned, setAssigned] = useState<string[]>(editEvent?.assignedTo || []);
    function toggleMember(name: string) {
      setAssigned(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
    }
    function save() {
      if (!title || !date) return;
      const ev: OEvent = {
        id: editEvent?.id || Date.now().toString(),
        title, date, endDate: endDate || undefined,
        startTime: allDay ? undefined : (startTime || undefined),
        endTime: allDay ? undefined : (endTime || undefined),
        category, description: description || undefined,
        location: location || undefined,
        assignedTo: assigned, allDay, published: true,
      };
      if (isEdit) setEvents(prev => prev.map(e => e.id === ev.id ? ev : e));
      else setEvents(prev => [...prev, ev]);
      setShowCreate(false); setEditEvent(null);
    }
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 10001, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
        onClick={() => { setShowCreate(false); setEditEvent(null); }}>
        <div style={{ background: "#fff", borderRadius: 12, maxWidth: 520, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", overflow: "hidden", maxHeight: "90vh", display: "flex", flexDirection: "column" }}
          onClick={e => e.stopPropagation()}>
          <div style={{ background: "linear-gradient(135deg,#1a1a2e,#252545)", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>{isEdit ? "✏️ Edit Event" : "➕ New Event"}</span>
            <button onClick={() => { setShowCreate(false); setEditEvent(null); }} style={{ background: "none", border: "none", color: "#A68A64", fontSize: 18, cursor: "pointer" }}>✕</button>
          </div>
          <div style={{ flex: 1, overflow: "auto", padding: "20px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>Title *</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Event title"
                  style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 6, padding: "8px 12px", fontSize: 13, boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>Category</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {(Object.keys(CAT_COLORS) as EventCategory[]).map(cat => (
                    <button key={cat} type="button" onClick={() => setCategory(cat)}
                      style={{
                        background: category === cat ? CAT_COLORS[cat].bg : "#f3f4f6",
                        color: category === cat ? CAT_COLORS[cat].text : "#374151",
                        border: `2px solid ${category === cat ? CAT_COLORS[cat].border : "transparent"}`,
                        borderRadius: 5, padding: "4px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer",
                      }}>{cat}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>Start Date *</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)}
                    style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 6, padding: "8px 10px", fontSize: 13, boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>End Date</label>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                    style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 6, padding: "8px 10px", fontSize: 13, boxSizing: "border-box" }} />
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" id="allday" checked={allDay} onChange={e => setAllDay(e.target.checked)} style={{ width: 16, height: 16 }} />
                <label htmlFor="allday" style={{ fontSize: 13, fontWeight: 600, color: "#374151", cursor: "pointer" }}>All day event</label>
              </div>
              {!allDay && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>Start Time</label>
                    <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                      style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 6, padding: "8px 10px", fontSize: 13, boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>End Time</label>
                    <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
                      style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 6, padding: "8px 10px", fontSize: 13, boxSizing: "border-box" }} />
                  </div>
                </div>
              )}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>Location</label>
                <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Address or room"
                  style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 6, padding: "8px 12px", fontSize: 13, boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>Assign to</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {members.map(m => (
                    <button key={m.id} type="button" onClick={() => toggleMember(m.name)}
                      style={{
                        background: assigned.includes(m.name) ? "#1a1a2e" : "#f3f4f6",
                        color: assigned.includes(m.name) ? "#A68A64" : "#374151",
                        border: `2px solid ${assigned.includes(m.name) ? "#A68A64" : "transparent"}`,
                        borderRadius: 5, padding: "4px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer",
                      }}>{m.initials} {m.name}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>Notes</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Additional notes..."
                  rows={3}
                  style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 6, padding: "8px 12px", fontSize: 13, resize: "vertical", boxSizing: "border-box" }} />
              </div>
            </div>
          </div>
          <div style={{ padding: "14px 20px", borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button onClick={() => { setShowCreate(false); setEditEvent(null); }}
              style={{ background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", borderRadius: 5, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
            <button onClick={save} disabled={!title || !date}
              style={{ background: title && date ? "linear-gradient(135deg,#7A6342,#A68A64)" : "#e5e7eb", color: title && date ? "#fff" : "#9ca3af", border: "none", borderRadius: 5, padding: "8px 18px", fontSize: 13, fontWeight: 700, cursor: title && date ? "pointer" : "not-allowed" }}>
              {isEdit ? "Save Changes" : "Create Event"}
            </button>
          </div>
        </div>
      </div>
    );
  }
  // ── Main render ─────────────────────────────────────────────────────────────
  const navLabel = (() => {
    if (view === "month") return new Date(navYear, navMonth, 1).toLocaleString("en-AU", { month: "long", year: "numeric" });
    if (view === "week") {
      const ws = getWeekStart(navDate);
      const we = addDays(ws, 6);
      const ds = parseDs(ws); const de = parseDs(we);
      return `${ds.getDate()} ${ds.toLocaleString("en-AU",{month:"short"})} – ${de.getDate()} ${de.toLocaleString("en-AU",{month:"short",year:"numeric"})}`;
    }
    if (view === "day") {
      const d = parseDs(navDate);
      return d.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    }
    return "Agenda";
  })();
  const todayUpcoming = eventsOnDay(today);
  return (
    <div style={{ display: "flex", gap: 0, height: "calc(100vh - 160px)", minHeight: 500 }}>
      {/* Sidebar */}
      <div style={{ width: 220, flexShrink: 0, paddingRight: 16, display: "flex", flexDirection: "column", overflow: "auto" }}>
        {isOwner && (
          <button onClick={() => { setEditEvent(null); setShowCreate(true); }}
            style={{
              background: "linear-gradient(135deg,#7A6342,#A68A64)", color: "#fff", border: "none",
              borderRadius: 8, padding: "10px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6, marginBottom: 16,
              boxShadow: "0 4px 12px rgba(122,99,66,0.35)",
            }}>
            <span style={{ fontSize: 18 }}>+</span> New Event
          </button>
        )}
        {renderMiniCal()}
        {/* Today's agenda */}
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "12px", marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 12, color: "#1a1a2e", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#A68A64", display: "inline-block" }} />
            Today
          </div>
          {todayUpcoming.length === 0
            ? <div style={{ fontSize: 11, color: "#9ca3af", fontStyle: "italic" }}>No events today</div>
            : todayUpcoming.map(ev => (
              <div key={ev.id} onClick={() => setSelectedEvent(ev)}
                style={{ display: "flex", gap: 6, alignItems: "flex-start", marginBottom: 6, cursor: "pointer" }}>
                <div style={{ width: 3, borderRadius: 2, background: CAT_COLORS[ev.category].bg, alignSelf: "stretch", flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#1a1a2e", lineHeight: 1.3 }}>{ev.title}</div>
                  {!ev.allDay && ev.startTime && <div style={{ fontSize: 10, color: "#6b7280" }}>{ev.startTime}</div>}
                </div>
              </div>
            ))
          }
        </div>
        {/* Filters */}
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "12px" }}>
          <div style={{ fontWeight: 700, fontSize: 12, color: "#1a1a2e", marginBottom: 8 }}>Filter</div>
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Category</div>
            <select value={filterCat} onChange={e => setFilterCat(e.target.value as EventCategory | "All")}
              style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 5, padding: "5px 8px", fontSize: 12 }}>
              <option value="All">All Categories</option>
              {(Object.keys(CAT_COLORS) as EventCategory[]).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Team Member</div>
            <select value={filterMember} onChange={e => setFilterMember(e.target.value)}
              style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 5, padding: "5px 8px", fontSize: 12 }}>
              <option value="All">All Members</option>
              {members.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
            </select>
          </div>
        </div>
      </div>
      {/* Main calendar area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Toolbar */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
          <button onClick={goToday}
            style={{ background: "#1a1a2e", color: "#A68A64", border: "1px solid #A68A64", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Today</button>
          <button onClick={goBack}
            style={{ background: "#fff", border: "1px solid #d1d5db", borderRadius: 6, padding: "6px 12px", fontSize: 14, cursor: "pointer", color: "#374151" }}>‹</button>
          <button onClick={goForward}
            style={{ background: "#fff", border: "1px solid #d1d5db", borderRadius: 6, padding: "6px 12px", fontSize: 14, cursor: "pointer", color: "#374151" }}>›</button>
          <span style={{ fontWeight: 700, fontSize: 15, color: "#1a1a2e", flex: 1 }}>{navLabel}</span>
          <div style={{ display: "flex", gap: 2, background: "#f3f4f6", borderRadius: 7, padding: 3 }}>
            {(["month","week","day","agenda"] as CalView[]).map(v => (
              <button key={v} onClick={() => setView(v)}
                style={{
                  background: view === v ? "linear-gradient(135deg,#7A6342,#A68A64)" : "transparent",
                  color: view === v ? "#fff" : "#374151",
                  border: "none", borderRadius: 5, padding: "5px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer",
                  textTransform: "capitalize",
                }}>{v}</button>
            ))}
          </div>
        </div>
        {/* Category legend */}
        <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
          {(Object.entries(CAT_COLORS) as [EventCategory, typeof CAT_COLORS[EventCategory]][]).map(([cat, col]) => (
            <div key={cat} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: col.bg }} />
              <span style={{ fontSize: 10, color: "#6b7280", fontWeight: 600 }}>{cat}</span>
            </div>
          ))}
        </div>
        {/* View content */}
        {view === "month" && renderMonth()}
        {view === "week" && renderWeek()}
        {view === "day" && renderDay()}
        {view === "agenda" && renderAgenda()}
      </div>
      {/* Modals */}
      {renderEventDetail()}
      {renderCreateModal()}
    </div>
  );
}
// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<DashTab>("Home");
  const [editMode, setEditMode] = useState(false);
  const [editMenuOpen, setEditMenuOpen] = useState(false);
  const [sectionMode, setSectionMode] = useState(false);
  const [published, setPublished] = useState(true);
  const [currentUserRole] = useState<UserRole>("Owner");
  const isOwner = currentUserRole === "Owner";

  const [links, setLinks] = useState<LinkItem[]>(INITIAL_LINKS);
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [addLinkSection, setAddLinkSection] = useState<string | null>(null);
  const [showTimesheet, setShowTimesheet] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showAddSection, setShowAddSection] = useState(false);

  // Custom sections with 4-position system + icon
  const [customSections, setCustomSections] = useState<{ id: string; name: string; position: SectionPosition; color: string; icon: string }[]>([]);
  // Edit section modal state
  const [editingSection, setEditingSection] = useState<{ id: string; name: string; color: string; position: string; icon?: string } | null>(null);
  // Section drag-and-drop state (cross-area)
  const [sectionDragId, setSectionDragId] = useState<string | null>(null);
  const [sectionDragOver, setSectionDragOver] = useState<string | null>(null);
  // Drop zone drag-over state (for column drop zones)
  const [colDragOver, setColDragOver] = useState<SectionPosition | null>(null);
  // Inline link editing
  const [editingLink, setEditingLink] = useState<LinkItem | null>(null);

  function deleteLink(id: string) { setLinks(prev => prev.filter(l => l.id !== id)); }
  function updateLink(id: string, label: string, url: string) { setLinks(prev => prev.map(l => l.id === id ? { ...l, label, url } : l)); }
  function addLink(item: LinkItem) { setLinks(prev => [...prev, item]); }
  function linksFor(section: string) {
    return links.filter(l => l.section === section).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  function reorderLinks(sectionName: string, fromId: string, toId: string) {
    setLinks(prev => {
      const sectionLinks = prev.filter(l => l.section === sectionName).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      const others = prev.filter(l => l.section !== sectionName);
      const fromIdx = sectionLinks.findIndex(l => l.id === fromId);
      if (fromIdx === -1) return prev;
      const [moved] = sectionLinks.splice(fromIdx, 1);
      if (toId === "__end__") {
        sectionLinks.push(moved);
      } else {
        const toIdx = sectionLinks.findIndex(l => l.id === toId);
        if (toIdx === -1) return prev;
        sectionLinks.splice(toIdx, 0, moved);
      }
      const reordered = sectionLinks.map((l, i) => ({ ...l, order: i }));
      return [...others, ...reordered];
    });
  }

  function addCustomSection(name: string, position: SectionPosition, color: string, icon: string) {
    setCustomSections(prev => [...prev, { id: Date.now().toString(), name, position, color, icon }]);
  }

  function updateCustomSection(id: string, name: string, color: string, icon: string) {
    setCustomSections(prev => prev.map(s => s.id === id ? { ...s, name, color, icon } : s));
    const old = customSections.find(s => s.id === id);
    if (old && old.name !== name) {
      setLinks(prev => prev.map(l => l.section === old.name ? { ...l, section: name } : l));
    }
  }

  function deleteCustomSection(id: string) {
    setCustomSections(prev => prev.filter(s => s.id !== id));
  }

  // ── Section drag-and-drop (cross-area) ──────────────────────────────────────
  function handleSectionDragStart(id: string) { setSectionDragId(id); }

  function handleSectionDragOver(e: React.DragEvent, id: string) {
    e.preventDefault();
    setSectionDragOver(id);
    setColDragOver(null);
  }

  function handleSectionDrop(targetId: string) {
    if (!sectionDragId || sectionDragId === targetId) { setSectionDragId(null); setSectionDragOver(null); return; }
    setCustomSections(prev => {
      const arr = [...prev];
      const fromIdx = arr.findIndex(s => s.id === sectionDragId);
      const toIdx = arr.findIndex(s => s.id === targetId);
      if (fromIdx === -1 || toIdx === -1) return arr;
      // Move section to same position as target, insert before target
      const dragged = { ...arr[fromIdx], position: arr[toIdx].position };
      arr.splice(fromIdx, 1);
      const newToIdx = arr.findIndex(s => s.id === targetId);
      arr.splice(newToIdx, 0, dragged);
      return arr;
    });
    setSectionDragId(null); setSectionDragOver(null);
  }

  // Drop on column (empty area or column header) — moves section to that column
  function handleColDragOver(e: React.DragEvent, col: SectionPosition) {
    e.preventDefault();
    setColDragOver(col);
    setSectionDragOver(null);
  }

  function handleColDrop(col: SectionPosition) {
    if (!sectionDragId) { setColDragOver(null); return; }
    setCustomSections(prev => prev.map(s => s.id === sectionDragId ? { ...s, position: col } : s));
    setSectionDragId(null); setSectionDragOver(null); setColDragOver(null);
  }

  const PRIMARY_TABS: DashTab[] = ["Home", "Task/Calendar", "Defect Library"];
  const SECONDARY_TABS: DashTab[] = ["Training", "Process and Procedures", "Management"];
  const ALL_TABS = [...PRIMARY_TABS, ...SECONDARY_TABS];
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [navCollapsed, setNavCollapsed] = useState(false);
  // Keyboard shortcuts: Alt+1..6 to switch tabs
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.altKey && e.key >= "1" && e.key <= "6") {
        const idx = parseInt(e.key) - 1;
        if (ALL_TABS[idx]) { setActiveTab(ALL_TABS[idx]); e.preventDefault(); }
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  function renderColumnDropZone(col: SectionPosition) {
    if (!editMode || !sectionDragId) return null;
    return (
      <div
        onDragOver={e => handleColDragOver(e, col)}
        onDrop={() => handleColDrop(col)}
        style={{
          height: 48, borderRadius: 8, border: "2px dashed",
          borderColor: colDragOver === col ? "#A68A64" : "#d1d5db",
          background: colDragOver === col ? "#fef9f0" : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, color: colDragOver === col ? "#A68A64" : "#9ca3af",
          fontWeight: 600, transition: "all 0.15s",
        }}
      >
        {colDragOver === col ? `Drop here → ${POSITION_LABELS[col]}` : `Drop in ${POSITION_LABELS[col]}`}
      </div>
    );
  }

  function renderHome() {
    const midLeftCustom = customSections.filter(s => s.position === "mid-left");
    const midCenterCustom = customSections.filter(s => s.position === "mid-center");
    const midRightCustom = customSections.filter(s => s.position === "mid-right");
    const rightCustom = customSections.filter(s => s.position === "right");

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Top row: General card */}
        <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", overflow: "hidden" }}>
          <div style={{ background: "linear-gradient(135deg,#7A6342,#A68A64)", padding: "12px 16px", display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
            <span style={{ fontWeight: 700, fontSize: 14, color: "#fff" }}>General</span>
          </div>
          <div style={{ padding: "16px", display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 14 }}>
            {/* Timesheet Entry card */}
            <button onClick={() => setShowTimesheet(true)} style={{
              background: "linear-gradient(145deg,#f8f7f5,#fff)",
              border: "1px solid #e5e7eb", borderRadius: 10,
              padding: "20px 16px", cursor: "pointer", textAlign: "left",
              transition: "box-shadow 0.2s, transform 0.2s, border-color 0.2s",
              display: "flex", flexDirection: "column", gap: 10,
              boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
            }}
              onMouseEnter={e => { const b = e.currentTarget; b.style.boxShadow = "0 6px 20px rgba(122,99,66,0.18)"; b.style.transform = "translateY(-3px)"; b.style.borderColor = "#A68A64"; }}
              onMouseLeave={e => { const b = e.currentTarget; b.style.boxShadow = "0 1px 4px rgba(0,0,0,0.05)"; b.style.transform = "translateY(0)"; b.style.borderColor = "#e5e7eb"; }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 10, background: "linear-gradient(135deg,#1a1a2e,#252545)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#A68A64" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e", marginBottom: 2 }}>Timesheet Entry</div>
                <div style={{ fontSize: 11, color: "#9ca3af", lineHeight: 1.4 }}>Log & manage work hours</div>
              </div>
            </button>
            {/* Leave Calendar card */}
            <button onClick={() => setShowCalendar(true)} style={{
              background: "linear-gradient(145deg,#f8f7f5,#fff)",
              border: "1px solid #e5e7eb", borderRadius: 10,
              padding: "20px 16px", cursor: "pointer", textAlign: "left",
              transition: "box-shadow 0.2s, transform 0.2s, border-color 0.2s",
              display: "flex", flexDirection: "column", gap: 10,
              boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
            }}
              onMouseEnter={e => { const b = e.currentTarget; b.style.boxShadow = "0 6px 20px rgba(122,99,66,0.18)"; b.style.transform = "translateY(-3px)"; b.style.borderColor = "#A68A64"; }}
              onMouseLeave={e => { const b = e.currentTarget; b.style.boxShadow = "0 1px 4px rgba(0,0,0,0.05)"; b.style.transform = "translateY(0)"; b.style.borderColor = "#e5e7eb"; }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 10, background: "linear-gradient(135deg,#2d6a4f,#3d8b6a)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                  <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e", marginBottom: 2 }}>Leave Calendar</div>
                <div style={{ fontSize: 11, color: "#9ca3af", lineHeight: 1.4 }}>Request & track leave</div>
              </div>
            </button>
            {/* Team Directory card */}
            <button onClick={() => setActiveTab("Management" as DashTab)} style={{
              background: "linear-gradient(145deg,#f8f7f5,#fff)",
              border: "1px solid #e5e7eb", borderRadius: 10,
              padding: "20px 16px", cursor: "pointer", textAlign: "left",
              transition: "box-shadow 0.2s, transform 0.2s, border-color 0.2s",
              display: "flex", flexDirection: "column", gap: 10,
              boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
            }}
              onMouseEnter={e => { const b = e.currentTarget; b.style.boxShadow = "0 6px 20px rgba(122,99,66,0.18)"; b.style.transform = "translateY(-3px)"; b.style.borderColor = "#A68A64"; }}
              onMouseLeave={e => { const b = e.currentTarget; b.style.boxShadow = "0 1px 4px rgba(0,0,0,0.05)"; b.style.transform = "translateY(0)"; b.style.borderColor = "#e5e7eb"; }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 10, background: "linear-gradient(135deg,#0f4c81,#1a6fb5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e", marginBottom: 2 }}>Team Directory</div>
                <div style={{ fontSize: 11, color: "#9ca3af", lineHeight: 1.4 }}>View & manage team members</div>
              </div>
            </button>
          </div>
        </div>
        {/* 4-column grid: Middle-Left | Middle-Center | Middle-Right | Right */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 280px", gap: 16, alignItems: "start" }}>

          {/* MIDDLE-LEFT: Legislation + mid-left custom sections */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: 12 }}
            onDragOver={e => { if (sectionDragId) handleColDragOver(e, "mid-left"); }}
            onDrop={() => { if (sectionDragId) handleColDrop("mid-left"); }}
          >
            <SectionPanel title="Legislation" icon="⚖️" links={linksFor("Legislation")} editMode={editMode}
              onDelete={deleteLink} onEdit={id => setEditingLink(links.find(l => l.id === id) || null)}
              onAddLink={setAddLinkSection} accent="#1e3a5f"
              onReorderLinks={(from, to) => reorderLinks("Legislation", from, to)} />
            {midLeftCustom.map(cs => (
              <SectionPanel key={cs.id} title={cs.name} icon={cs.icon || "📌"}
                links={linksFor(cs.name)} editMode={editMode}
                onDelete={deleteLink} onEdit={id => setEditingLink(links.find(l => l.id === id) || null)}
                onAddLink={setAddLinkSection} accent={cs.color || "#374151"}
                onDeleteSection={() => deleteCustomSection(cs.id)}
                onEditSection={() => setEditingSection(cs)}
                draggable onDragStart={() => handleSectionDragStart(cs.id)}
                onDragOver={e => handleSectionDragOver(e, cs.id)}
                onDrop={() => handleSectionDrop(cs.id)}
                isDragOver={sectionDragOver === cs.id}
                onReorderLinks={(from, to) => reorderLinks(cs.name, from, to)} />
            ))}
            {renderColumnDropZone("mid-left")}
          </div>

          {/* MIDDLE-CENTER: Private Certifier + mid-center custom sections */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: 12 }}
            onDragOver={e => { if (sectionDragId) handleColDragOver(e, "mid-center"); }}
            onDrop={() => { if (sectionDragId) handleColDrop("mid-center"); }}
          >
            <SectionPanel title="Private Certifier" icon="📋" links={linksFor("Private Certifier")} editMode={editMode}
              onDelete={deleteLink} onEdit={id => setEditingLink(links.find(l => l.id === id) || null)}
              onAddLink={setAddLinkSection} accent="#2d6a4f"
              onReorderLinks={(from, to) => reorderLinks("Private Certifier", from, to)} />
            {midCenterCustom.map(cs => (
              <SectionPanel key={cs.id} title={cs.name} icon={cs.icon || "📌"}
                links={linksFor(cs.name)} editMode={editMode}
                onDelete={deleteLink} onEdit={id => setEditingLink(links.find(l => l.id === id) || null)}
                onAddLink={setAddLinkSection} accent={cs.color || "#374151"}
                onDeleteSection={() => deleteCustomSection(cs.id)}
                onEditSection={() => setEditingSection(cs)}
                draggable onDragStart={() => handleSectionDragStart(cs.id)}
                onDragOver={e => handleSectionDragOver(e, cs.id)}
                onDrop={() => handleSectionDrop(cs.id)}
                isDragOver={sectionDragOver === cs.id}
                onReorderLinks={(from, to) => reorderLinks(cs.name, from, to)} />
            ))}
            {renderColumnDropZone("mid-center")}
          </div>

          {/* MIDDLE-RIGHT: Applications + mid-right custom sections */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: 12 }}
            onDragOver={e => { if (sectionDragId) handleColDragOver(e, "mid-right"); }}
            onDrop={() => { if (sectionDragId) handleColDrop("mid-right"); }}
          >
            <SectionPanel title="Applications" icon="📂" links={linksFor("Applications")} editMode={editMode}
              onDelete={deleteLink} onEdit={id => setEditingLink(links.find(l => l.id === id) || null)}
              onAddLink={setAddLinkSection} accent="#5b21b6"
              onReorderLinks={(from, to) => reorderLinks("Applications", from, to)} />
            {/* Forms / Process — sits below Applications */}
            <div style={{ background: "#fff", borderRadius: 10, overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.07)", border: "1px solid #e5e7eb" }}>
              <div style={{ background: "linear-gradient(135deg,#1e3a5f,#2d5a8e)", padding: "14px 20px", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg,#1a1a2e,#252545)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.25)" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A68A64" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10 9 9 9 8 9"/>
                  </svg>
                </div>
                <span style={{ color: "#fff", fontWeight: 700, fontSize: 14, letterSpacing: "0.02em" }}>Forms / Process</span>
              </div>
              <div style={{ padding: "8px 0" }}>
                {linksFor("Forms/Process").map(link => (
                  <div key={link.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 20px", borderBottom: "1px solid #f3f4f6", transition: "background 0.15s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#f8f7f5")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1e3a5f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                    <a href={link.url} target="_blank" rel="noopener noreferrer" style={{ color: "#1e3a5f", fontSize: 13, fontWeight: 500, textDecoration: "none", flex: 1 }}
                      onMouseEnter={e => (e.currentTarget.style.textDecoration = "underline")}
                      onMouseLeave={e => (e.currentTarget.style.textDecoration = "none")}>{link.label}</a>
                    {editMode && (
                      <button onClick={() => deleteLink(link.id)} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: 12, padding: "2px 6px", borderRadius: 4 }}>✕</button>
                    )}
                  </div>
                ))}
                {editMode && (
                  <button onClick={() => setAddLinkSection("Forms/Process")} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 20px", background: "none", border: "none", color: "#A68A64", fontSize: 12, fontWeight: 600, cursor: "pointer", width: "100%", textAlign: "left" }}>+ Add Form / Link</button>
                )}
              </div>
            </div>
            {midRightCustom.map(cs => (
              <SectionPanel key={cs.id} title={cs.name} icon={cs.icon || "📌"}
                links={linksFor(cs.name)} editMode={editMode}
                onDelete={deleteLink} onEdit={id => setEditingLink(links.find(l => l.id === id) || null)}
                onAddLink={setAddLinkSection} accent={cs.color || "#374151"}
                onDeleteSection={() => deleteCustomSection(cs.id)}
                onEditSection={() => setEditingSection(cs)}
                draggable onDragStart={() => handleSectionDragStart(cs.id)}
                onDragOver={e => handleSectionDragOver(e, cs.id)}
                onDrop={() => handleSectionDrop(cs.id)}
                isDragOver={sectionDragOver === cs.id}
                onReorderLinks={(from, to) => reorderLinks(cs.name, from, to)} />
            ))}
            {renderColumnDropZone("mid-right")}
          </div>

          {/* RIGHT: Search + Verification + right custom sections */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: 12 }}
            onDragOver={e => { if (sectionDragId) handleColDragOver(e, "right"); }}
            onDrop={() => { if (sectionDragId) handleColDrop("right"); }}
          >
            <SectionPanel title="Search" icon="🔎" links={linksFor("Search")} editMode={editMode}
              onDelete={deleteLink} onEdit={id => setEditingLink(links.find(l => l.id === id) || null)}
              onAddLink={setAddLinkSection} accent="#0f4c81"
              onReorderLinks={(from, to) => reorderLinks("Search", from, to)} />
            <SectionPanel title="Verification" icon="✅" links={linksFor("Verification")} editMode={editMode}
              onDelete={deleteLink} onEdit={id => setEditingLink(links.find(l => l.id === id) || null)}
              onAddLink={setAddLinkSection} accent="#374151"
              onReorderLinks={(from, to) => reorderLinks("Verification", from, to)} />
            {rightCustom.map(cs => (
              <SectionPanel key={cs.id} title={cs.name} icon={cs.icon || "📌"}
                links={linksFor(cs.name)} editMode={editMode}
                onDelete={deleteLink} onEdit={id => setEditingLink(links.find(l => l.id === id) || null)}
                onAddLink={setAddLinkSection} accent={cs.color || "#374151"}
                onDeleteSection={() => deleteCustomSection(cs.id)}
                onEditSection={() => setEditingSection(cs)}
                draggable onDragStart={() => handleSectionDragStart(cs.id)}
                onDragOver={e => handleSectionDragOver(e, cs.id)}
                onDrop={() => handleSectionDrop(cs.id)}
                isDragOver={sectionDragOver === cs.id}
                onReorderLinks={(from, to) => reorderLinks(cs.name, from, to)} />
            ))}
            {renderColumnDropZone("right")}
          </div>

        </div>

        {/* + Add Section button (section mode) */}
        {sectionMode && (
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 4 }}>
            <button onClick={() => setShowAddSection(true)} style={{
              width: 44, height: 44, borderRadius: "50%", background: "#1a1a2e",
              border: "2px solid #A68A64", color: "#A68A64", fontSize: 22, fontWeight: 700,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 16px rgba(0,0,0,0.2)", transition: "transform 0.15s"
            }}
              onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.12)")}
              onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
              title="Add new section"
            >+</button>
          </div>
        )}
      </div>
    );
  }

  function renderAudits() {
    return (
      <div style={{ padding: "4px 0" }}>
        <DefectLibrary />
      </div>
    );
  }

  function renderTraining() {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <SectionPanel title="Training Resources" icon="📚" links={linksFor("Training")} editMode={editMode}
          onDelete={deleteLink} onAddLink={setAddLinkSection} accent="#1e3a5f"
          onReorderLinks={(from, to) => reorderLinks("Training", from, to)} />
        <VideoLibrary isOwner={isOwner} />
      </div>
    );
  }

  function renderProcessProcedures() {
    return (
      <div style={{ background: "#f8f7f5", border: "2px dashed #d1d5db", borderRadius: 10, padding: "48px", textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📝</div>
        <div style={{ fontWeight: 700, fontSize: 16, color: "#374151", marginBottom: 6 }}>Process and Procedures</div>
        <div style={{ fontSize: 13, color: "#9ca3af", maxWidth: 400, margin: "0 auto" }}>
          This section is reserved for internal process documentation and standard operating procedures. Content will be added here in the future.
        </div>
      </div>
    );
  }

  function renderManagement() {
    if (!isOwner) {
      return (
        <div style={{ background: "#fff3f3", border: "2px solid #fca5a5", borderRadius: 10, padding: "64px 48px", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <div style={{ fontWeight: 700, fontSize: 18, color: "#c0392b", marginBottom: 8 }}>No Access</div>
          <div style={{ fontSize: 14, color: "#6b7280", maxWidth: 360, margin: "0 auto" }}>
            The Management tab is restricted to Owners only. Please contact your Owner to request elevated access.
          </div>
        </div>
      );
    }
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
          <div style={{ background: "linear-gradient(135deg,#7A6342,#A68A64)", padding: "12px 16px", display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            <span style={{ fontWeight: 700, fontSize: 14, color: "#fff" }}>Owner Administration</span>
          </div>
          <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.7, background: "#f8f7f5", borderRadius: 8, padding: "12px 14px", borderLeft: "3px solid #A68A64" }}>
              As an Owner you have full rights to: add and remove members, assign roles, edit and republish the dashboard, manage timesheets, approve leave requests, and configure all sections.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 14 }}>
              {/* Timesheet Approvals */}
              <button onClick={() => setShowTimesheet(true)} style={{
                background: "linear-gradient(145deg,#f8f7f5,#fff)", border: "1px solid #e5e7eb", borderRadius: 10,
                padding: "20px 16px", cursor: "pointer", textAlign: "left",
                transition: "box-shadow 0.2s, transform 0.2s, border-color 0.2s",
                display: "flex", flexDirection: "column", gap: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
              }}
                onMouseEnter={e => { const b = e.currentTarget; b.style.boxShadow = "0 6px 20px rgba(122,99,66,0.18)"; b.style.transform = "translateY(-3px)"; b.style.borderColor = "#A68A64"; }}
                onMouseLeave={e => { const b = e.currentTarget; b.style.boxShadow = "0 1px 4px rgba(0,0,0,0.05)"; b.style.transform = "translateY(0)"; b.style.borderColor = "#e5e7eb"; }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 10, background: "linear-gradient(135deg,#1a1a2e,#252545)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#A68A64" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e", marginBottom: 2 }}>Timesheet Approvals</div>
                  <div style={{ fontSize: 11, color: "#9ca3af", lineHeight: 1.4 }}>Review & approve hours</div>
                </div>
              </button>
              {/* Leave Approvals */}
              <button onClick={() => setShowCalendar(true)} style={{
                background: "linear-gradient(145deg,#f8f7f5,#fff)", border: "1px solid #e5e7eb", borderRadius: 10,
                padding: "20px 16px", cursor: "pointer", textAlign: "left",
                transition: "box-shadow 0.2s, transform 0.2s, border-color 0.2s",
                display: "flex", flexDirection: "column", gap: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
              }}
                onMouseEnter={e => { const b = e.currentTarget; b.style.boxShadow = "0 6px 20px rgba(122,99,66,0.18)"; b.style.transform = "translateY(-3px)"; b.style.borderColor = "#A68A64"; }}
                onMouseLeave={e => { const b = e.currentTarget; b.style.boxShadow = "0 1px 4px rgba(0,0,0,0.05)"; b.style.transform = "translateY(0)"; b.style.borderColor = "#e5e7eb"; }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 10, background: "linear-gradient(135deg,#2d6a4f,#3d8b6a)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                    <polyline points="9 16 11 18 15 14"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e", marginBottom: 2 }}>Leave Approvals</div>
                  <div style={{ fontSize: 11, color: "#9ca3af", lineHeight: 1.4 }}>Approve leave requests</div>
                </div>
              </button>
              {/* Team Calendar */}
              <button onClick={() => setActiveTab("Task/Calendar")} style={{
                background: "linear-gradient(145deg,#f8f7f5,#fff)", border: "1px solid #e5e7eb", borderRadius: 10,
                padding: "20px 16px", cursor: "pointer", textAlign: "left",
                transition: "box-shadow 0.2s, transform 0.2s, border-color 0.2s",
                display: "flex", flexDirection: "column", gap: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
              }}
                onMouseEnter={e => { const b = e.currentTarget; b.style.boxShadow = "0 6px 20px rgba(122,99,66,0.18)"; b.style.transform = "translateY(-3px)"; b.style.borderColor = "#A68A64"; }}
                onMouseLeave={e => { const b = e.currentTarget; b.style.boxShadow = "0 1px 4px rgba(0,0,0,0.05)"; b.style.transform = "translateY(0)"; b.style.borderColor = "#e5e7eb"; }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 10, background: "linear-gradient(135deg,#1e3a5f,#2d5a8e)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                    <circle cx="12" cy="16" r="2"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e", marginBottom: 2 }}>Team Calendar</div>
                  <div style={{ fontSize: 11, color: "#9ca3af", lineHeight: 1.4 }}>View all events & tasks</div>
                </div>
              </button>
              {/* Edit Dashboard */}
              <button onClick={() => setEditMode(true)} style={{
                background: "linear-gradient(145deg,#f8f7f5,#fff)", border: "1px solid #e5e7eb", borderRadius: 10,
                padding: "20px 16px", cursor: "pointer", textAlign: "left",
                transition: "box-shadow 0.2s, transform 0.2s, border-color 0.2s",
                display: "flex", flexDirection: "column", gap: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
              }}
                onMouseEnter={e => { const b = e.currentTarget; b.style.boxShadow = "0 6px 20px rgba(122,99,66,0.18)"; b.style.transform = "translateY(-3px)"; b.style.borderColor = "#A68A64"; }}
                onMouseLeave={e => { const b = e.currentTarget; b.style.boxShadow = "0 1px 4px rgba(0,0,0,0.05)"; b.style.transform = "translateY(0)"; b.style.borderColor = "#e5e7eb"; }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 10, background: "linear-gradient(135deg,#5b21b6,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e", marginBottom: 2 }}>Edit Dashboard</div>
                  <div style={{ fontSize: 11, color: "#9ca3af", lineHeight: 1.4 }}>Add sections & links</div>
                </div>
              </button>
            </div>
          </div>
        </div>
        <MembersPanel members={members} setMembers={setMembers} isOwner={isOwner} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f5f4f1", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header style={{ background: "#1a1a2e", height: 64, display: "flex", alignItems: "center", padding: "0 28px", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button onClick={() => navigate("/adm")} style={{ background: "rgba(166,138,100,0.15)", border: "1px solid #A68A64", color: "#A68A64", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, padding: "5px 12px", borderRadius: 5, fontWeight: 600 }}>
            ← ADM
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, background: "linear-gradient(135deg,#7A6342,#A68A64)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, color: "#fff" }}>369</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>369 Alliance</div>
              <div style={{ fontSize: 10, color: "#A68A64", letterSpacing: "0.06em", textTransform: "uppercase" }}>Dashboard</div>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {!published && <span style={{ background: "#fef3c7", color: "#92400e", borderRadius: 5, padding: "4px 10px", fontSize: 11, fontWeight: 700 }}>Unpublished changes</span>}
          {isOwner && !editMode && !sectionMode && (
            <div style={{ position: "relative" }}>
              <button onClick={() => setEditMenuOpen(v => !v)} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", borderRadius: 5, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                ✏️ Edit ▾
              </button>
              {editMenuOpen && (
                <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, boxShadow: "0 8px 32px rgba(0,0,0,0.18)", zIndex: 9999, minWidth: 180, overflow: "hidden" }}>
                  <button onClick={() => { setEditMode(true); setEditMenuOpen(false); }} style={{ width: "100%", padding: "11px 16px", background: "none", border: "none", textAlign: "left", fontSize: 13, fontWeight: 600, color: "#1a1a2e", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#f3f4f6")}
                    onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                    ✏️ Edit (General)
                  </button>
                  <div style={{ height: 1, background: "#f3f4f6" }} />
                  <button onClick={() => { setSectionMode(true); setEditMenuOpen(false); }} style={{ width: "100%", padding: "11px 16px", background: "none", border: "none", textAlign: "left", fontSize: 13, fontWeight: 600, color: "#1a1a2e", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#f3f4f6")}
                    onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                    ➕ Section
                  </button>
                </div>
              )}
            </div>
          )}
          {isOwner && editMode && (
            <>
              <button onClick={() => setEditMode(false)} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.3)", color: "#c5b49a", borderRadius: 5, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
              <button onClick={() => { setEditMode(false); setPublished(true); }} style={{ background: "linear-gradient(135deg,#2d6a4f,#3d8b6a)", color: "#fff", border: "none", borderRadius: 5, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>✓ Republish</button>
            </>
          )}
          {isOwner && sectionMode && (
            <>
              <span style={{ background: "#fef3c7", color: "#92400e", borderRadius: 5, padding: "4px 10px", fontSize: 11, fontWeight: 700 }}>Section Mode — click + to add, drag sections to reorder</span>
              <button onClick={() => setSectionMode(false)} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.3)", color: "#c5b49a", borderRadius: 5, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Done</button>
            </>
          )}
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#7A6342,#A68A64)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff" }}>RD</div>
        </div>
      </header>

      {editMode && (
        <div style={{ background: "linear-gradient(135deg,#A68A64,#7A6342)", padding: "8px 28px", display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "#fff", fontWeight: 600 }}>
          ✏️ Edit Mode — Add/remove links and sections. Drag ⠿ handles to reorder links within sections. Click <strong style={{ marginLeft: 4 }}>Republish</strong> when done.
        </div>
      )}

      {/* Tab navigation */}
      <nav style={{ background: "#252545", display: "flex", alignItems: "center", padding: "0 28px", flexShrink: 0, position: "relative" }}>
        {/* Left group: Home, Task/Calendar, Defect Library */}
        <div style={{ display: "flex", gap: 2 }} className="nav-primary-group">
          {PRIMARY_TABS.map((tab, i) => (
            <div key={tab} style={{ position: "relative", display: "flex", alignItems: "flex-end" }}
              onMouseEnter={e => { const tip = e.currentTarget.querySelector(".nav-tip") as HTMLElement; if (tip) tip.style.opacity = "1"; }}
              onMouseLeave={e => { const tip = e.currentTarget.querySelector(".nav-tip") as HTMLElement; if (tip) tip.style.opacity = "0"; }}>
              <button onClick={() => setActiveTab(tab)} style={{
                padding: "11px 20px", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700,
                borderRadius: "6px 6px 0 0", marginTop: 6,
                background: activeTab === tab ? "linear-gradient(135deg,#7A6342,#A68A64)" : "rgba(255,255,255,0.06)",
                color: activeTab === tab ? "#fff" : "#c5b49a",
                transition: "all 0.15s",
                borderBottom: activeTab === tab ? "3px solid #A68A64" : "3px solid transparent",
              }}>{tab}</button>
              <div className="nav-tip" style={{
                position: "absolute", bottom: "calc(100% - 4px)", left: "50%", transform: "translateX(-50%)",
                background: "rgba(26,26,46,0.95)", color: "#A68A64", fontSize: 10, fontWeight: 700,
                padding: "3px 8px", borderRadius: 4, whiteSpace: "nowrap",
                border: "1px solid rgba(166,138,100,0.3)", pointerEvents: "none",
                opacity: 0, transition: "opacity 0.15s", zIndex: 100,
              }}>Alt+{i+1}</div>
            </div>
          ))}
        </div>
        {/* Vertical divider */}
        <div style={{ width: 1, height: 28, background: "rgba(166,138,100,0.35)", margin: "0 16px", flexShrink: 0 }} className="nav-divider" />
        {/* Center group: Training, Process and Procedures, Management — visible on wide screens */}
        <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", display: "flex", gap: 2 }} className="nav-secondary-group">
          {SECONDARY_TABS.map((tab, i) => (
            <div key={tab} style={{ position: "relative", display: "flex", alignItems: "flex-end" }}
              onMouseEnter={e => { const tip = e.currentTarget.querySelector(".nav-tip") as HTMLElement; if (tip) tip.style.opacity = "1"; }}
              onMouseLeave={e => { const tip = e.currentTarget.querySelector(".nav-tip") as HTMLElement; if (tip) tip.style.opacity = "0"; }}>
              <button onClick={() => setActiveTab(tab)} style={{
                padding: "11px 20px", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700,
                borderRadius: "6px 6px 0 0", marginTop: 6,
                background: activeTab === tab ? "linear-gradient(135deg,#7A6342,#A68A64)" : "rgba(255,255,255,0.06)",
                color: activeTab === tab ? "#fff" : "#c5b49a",
                transition: "all 0.15s",
                borderBottom: activeTab === tab ? "3px solid #A68A64" : "3px solid transparent",
              }}>{tab}</button>
              <div className="nav-tip" style={{
                position: "absolute", bottom: "calc(100% - 4px)", left: "50%", transform: "translateX(-50%)",
                background: "rgba(26,26,46,0.95)", color: "#A68A64", fontSize: 10, fontWeight: 700,
                padding: "3px 8px", borderRadius: 4, whiteSpace: "nowrap",
                border: "1px solid rgba(166,138,100,0.3)", pointerEvents: "none",
                opacity: 0, transition: "opacity 0.15s", zIndex: 100,
              }}>Alt+{i+4}</div>
            </div>
          ))}
        </div>
        {/* More ▾ dropdown — visible only on small screens */}
        <div style={{ marginLeft: "auto", position: "relative" }} className="nav-more-btn">
          <button onClick={() => setShowMoreMenu(v => !v)} style={{
            padding: "8px 14px", border: "1px solid rgba(166,138,100,0.4)", cursor: "pointer", fontSize: 12, fontWeight: 700,
            borderRadius: 6, background: "rgba(255,255,255,0.06)", color: "#c5b49a",
          }}>More ▾</button>
          {showMoreMenu && (
            <div style={{
              position: "absolute", top: "calc(100% + 4px)", right: 0, background: "#1a1a2e",
              border: "1px solid rgba(166,138,100,0.3)", borderRadius: 8, overflow: "hidden",
              zIndex: 200, minWidth: 200, boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            }}>
              {ALL_TABS.map((tab, i) => (
                <button key={tab} onClick={() => { setActiveTab(tab); setShowMoreMenu(false); }} style={{
                  display: "block", width: "100%", padding: "10px 16px", border: "none", cursor: "pointer",
                  textAlign: "left", fontSize: 13, fontWeight: activeTab === tab ? 700 : 500,
                  background: activeTab === tab ? "rgba(166,138,100,0.15)" : "transparent",
                  color: activeTab === tab ? "#A68A64" : "#c5b49a",
                  borderLeft: activeTab === tab ? "3px solid #A68A64" : "3px solid transparent",
                }}>
                  {tab} <span style={{ float: "right", fontSize: 10, opacity: 0.5 }}>Alt+{i+1}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>
      <style>{`
        @media (min-width: 900px) { .nav-more-btn { display: none !important; } .nav-divider { display: block !important; } }
        @media (max-width: 899px) { .nav-secondary-group { display: none !important; } .nav-divider { display: none !important; } }
      `}</style>

      <ThreeColStyle />
      {/* Page content */}
      <main style={{ flex: 1, padding: "28px", overflow: "auto" }}>
        {activeTab === "Home" && renderHome()}
        {activeTab === "Defect Library" && renderAudits()}
        {activeTab === "Training" && renderTraining()}
        {activeTab === "Process and Procedures" && renderProcessProcedures()}
        {activeTab === "Task/Calendar" && <TaskCalendar />}
        {activeTab === "Management" && renderManagement()}
      </main>

      <footer style={{ background: "#1a1a2e", color: "#6b7280", padding: "14px 28px", textAlign: "center", fontSize: 12 }}>
        <span style={{ color: "#A68A64", fontWeight: 600 }}>369 Alliance</span> · Construction Management System · © {new Date().getFullYear()}
      </footer>

      {showTimesheet && <TimesheetModal onClose={() => setShowTimesheet(false)} isOwner={isOwner} />}
      {showCalendar && <Calendar2026Modal onClose={() => setShowCalendar(false)} isOwner={isOwner} />}
      {addLinkSection && <AddLinkModal section={addLinkSection} onClose={() => setAddLinkSection(null)} onAdd={addLink} />}
      {showAddSection && <AddSectionModal onClose={() => setShowAddSection(false)} onAdd={(name, pos, color, icon) => addCustomSection(name, pos, color, icon)} />}
      {editingSection && (
        <EditSectionModal
          section={editingSection}
          links={linksFor(editingSection.name)}
          onClose={() => setEditingSection(null)}
          onSave={(id, name, color, icon) => updateCustomSection(id, name, color, icon)}
          onDeleteLink={deleteLink}
          onAddLink={(label, url) => addLink({ id: Date.now().toString(), label, url, section: editingSection.name })}
        />
      )}
      {editingLink && (
        <EditLinkModal
          link={editingLink}
          onClose={() => setEditingLink(null)}
          onSave={(id, label, url) => { updateLink(id, label, url); setEditingLink(null); }}
        />
      )}
    </div>
  );
}
