/**
 * 369 Alliance System – Project Add/Edit Modal
 * Per spec: Selected By = Raquel Diaz | Simone Baeta Lentini
 *           Inspectors shown as checkboxes (Raquel Diaz + Simone Baeta Lentini)
 *           Building Practitioner Name + Registration Number fields
 *           All dropdowns default to "Select" placeholder
 */
import { useState } from "react";
import {
  RISK_CATEGORIES, PROJECT_OUTCOMES, INSPECTION_TYPES,
  DBP_INSPECTORS, OC_INSPECTORS, ALL_INSPECTORS,
  DBP_TYPES, BUILDING_CLASSES, SELECTED_BY_OPTIONS, PROACTIVE_STAGES,
  addBooking, getNextBooking, getProjects,
  type Project, type TabType, type Stage, type RiskCategory,
  type ProjectOutcome, type InspectionType, type DBPPractitioner, type BookingReason
} from "@/lib/data";
import BookingModal from "@/components/BookingModal";

interface Props {
  mode: "add" | "edit";
  project?: Project;
  activeTab: TabType;
  onClose: () => void;
  onSave: (data: Partial<Project>) => void;
  nextCode?: string;
}

export default function ProjectModal({ mode, project, activeTab, onClose, onSave, nextCode }: Props) {
  const [form, setForm] = useState({
    projCode: project?.projCode || nextCode || "",
    stage: project?.stage || "" as Stage | "",
    riskCategory: project?.riskCategory || "" as RiskCategory | "",
    firstInspectionType: project?.firstInspectionType || "" as InspectionType | "",
    sequentialInspection: project?.sequentialInspection || "" as InspectionType | "",
    freeType: project?.freeType || "",
    selectedBy: project?.selectedBy || "",
    // Inspector checkboxes — per spec, inspectors are Raquel Diaz and Simone Baeta Lentini
    inspectors: project?.inspectors || [] as string[],
    address: project?.address || "",
    suburb: project?.suburb || "",
    postcode: project?.postcode || "",
    photoUrl: project?.photoUrl || "",
    builder: project?.builder || "",
    builderACN: project?.builderACN || "",
    builderRegistration: project?.builderRegistration || "",
    builderExpireDate: project?.builderExpireDate || "",
    developer: project?.developer || "",
    developerACN: project?.developerACN || "",
    certifierCompany: project?.certifierCompany || "",
    certifierName: project?.certifierName || "",
    certifierACN: project?.certifierACN || "",
    buildingClasses: project?.buildingClasses || [] as string[],
    numberOfUnits: project?.numberOfUnits || "",
    numberOfLevelsBasement: project?.numberOfLevelsBasement || "",
    numberOfLevelsGLRoof: project?.numberOfLevelsGLRoof || "",
    effectiveHeight: project?.effectiveHeight || "",
    developDescription: project?.developDescription || "",
    bwItsoc: project?.bwItsoc || "",
    daNumber: project?.daNumber || "",
    ccNumber: project?.ccNumber || "",
    costOfDevelopment: project?.costOfDevelopment || "",
    projectOutcome: project?.projectOutcome || "" as ProjectOutcome | "",
    dbpPractitioners: project?.dbpPractitioners || [] as DBPPractitioner[],
    // Building Practitioner — two separate fields per spec
    buildingPractitionerName: project?.buildingPractitionerName || "",
    buildingPractitionerReg: project?.buildingPractitionerReg || "",
  });

  const [otherReferral, setOtherReferral] = useState(
    project?.stage === "Other referral" ? project.freeType || "" : ""
  );
  const [showBooking, setShowBooking] = useState(false);
  const [localProject, setLocalProject] = useState<Project | undefined>(project);

  function handleBookingConfirm(date: string, reason: BookingReason, description: string) {
    if (!localProject) return;
    addBooking(localProject.id, { date, reason, description }, "Raquel Diaz");
    const updated = getProjects().find((p: Project) => p.id === localProject.id);
    if (updated) setLocalProject(updated);
    setShowBooking(false);
  }

  const nextBooking = localProject ? getNextBooking(localProject) : null;
  function fmtDate(iso: string) {
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  }

  const set = (key: string, val: unknown) => setForm(f => ({ ...f, [key]: val }));

  const toggleClass = (cls: string) => {
    setForm(f => ({
      ...f,
      buildingClasses: f.buildingClasses.includes(cls)
        ? f.buildingClasses.filter(c => c !== cls)
        : [...f.buildingClasses, cls]
    }));
  };

  const toggleInspector = (name: string) => {
    setForm(f => ({
      ...f,
      inspectors: f.inspectors.includes(name)
        ? f.inspectors.filter(i => i !== name)
        : [...f.inspectors, name]
    }));
  };

  const addDBP = () => {
    setForm(f => ({
      ...f,
      dbpPractitioners: [...f.dbpPractitioners, { id: String(Date.now()), type: [], name: "", company: "", registration: "" }]
    }));
  };

  const updateDBP = (id: string, key: string, val: unknown) => {
    setForm(f => ({
      ...f,
      dbpPractitioners: f.dbpPractitioners.map(d => d.id === id ? { ...d, [key]: val } : d)
    }));
  };

  const removeDBP = (id: string) => {
    setForm(f => ({ ...f, dbpPractitioners: f.dbpPractitioners.filter(d => d.id !== id) }));
  };

  const toggleDBPType = (id: string, type: string) => {
    setForm(f => ({
      ...f,
      dbpPractitioners: f.dbpPractitioners.map(d => {
        if (d.id !== id) return d;
        return { ...d, type: d.type.includes(type) ? d.type.filter(t => t !== type) : [...d.type, type] };
      })
    }));
  };

  const handleSave = () => {
    const finalStage = form.stage === "Other referral" ? "Other referral" as Stage : form.stage as Stage;
    onSave({
      ...form,
      stage: finalStage,
      riskCategory: (form.riskCategory || "Low") as RiskCategory,
      firstInspectionType: (form.firstInspectionType || "Selected") as InspectionType,
      sequentialInspection: (form.sequentialInspection || "Selected") as InspectionType,
      projectOutcome: (form.projectOutcome || "WIP") as ProjectOutcome,
      freeType: form.stage === "Other referral" ? otherReferral : form.freeType,
      inspectors: form.inspectors,
    });
  };

  const inputStyle: React.CSSProperties = {
    border: "1px solid #d1d5db", borderRadius: 4, padding: "6px 8px", fontSize: 13,
    fontFamily: "IBM Plex Sans, sans-serif", background: "#fff", color: "#1a1a2e",
    outline: "none", width: "100%"
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 600, color: "#6b7280",
    textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 3
  };
  const sectionTitle: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em",
    color: "#7A6342", borderBottom: "1px solid #e5e7eb", paddingBottom: 4,
    marginBottom: 8, marginTop: 14
  };

  // Inspector checkboxes — per spec: Raquel Diaz and Simone Baeta Lentini
  const INSPECTOR_OPTIONS = ["Raquel Diaz", "Simone Baeta Lentini"];

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ maxWidth: 920 }}>
        <div className="modal-header">
          <span style={{ fontWeight: 700, fontSize: 15 }}>
            {mode === "add" ? "+ Add New Project" : "Edit Project"} — {activeTab}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={onClose} style={{ background: "none", border: "none", color: "#fff", fontSize: 20, cursor: "pointer", lineHeight: 1 }}>×</button>
          </div>
        </div>

        <div style={{ padding: "16px 20px", maxHeight: "80vh", overflowY: "auto" }}>
          {/* Project Details header row with BOOK button */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ ...sectionTitle, margin: 0, border: "none", paddingBottom: 0 }}>Project Details</div>
            {localProject && (
              <button
                onClick={() => setShowBooking(true)}
                style={{
                  background: nextBooking ? "#dbeafe" : "#1e40af",
                  color: nextBooking ? "#1e3a5f" : "#fff",
                  border: nextBooking ? "1px solid #93c5fd" : "2px solid #1e40af",
                  borderRadius: 6, padding: "6px 16px", fontSize: 12, fontWeight: 700,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                  whiteSpace: "nowrap", boxShadow: "0 1px 4px rgba(30,64,175,0.18)"
                }}
              >
                📅 {nextBooking ? `Next: ${fmtDate(nextBooking.date)}` : "BOOK"}
              </button>
            )}
            {!localProject && (
              <button
                onClick={() => setShowBooking(true)}
                style={{
                  background: "#1e40af", color: "#fff",
                  border: "2px solid #1e40af",
                  borderRadius: 6, padding: "6px 16px", fontSize: 12, fontWeight: 700,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                  whiteSpace: "nowrap", boxShadow: "0 1px 4px rgba(30,64,175,0.18)"
                }}
              >
                📅 BOOK
              </button>
            )}
          </div>
          <div style={{ borderBottom: "1px solid #e5e7eb", marginBottom: 8 }} />
          {/* Project Details */}
          <div className="form-row">
            <div style={{ flex: 1, minWidth: 100 }}>
              <label style={labelStyle}>Proj Code</label>
              <input style={{ ...inputStyle, background: "#f9f8f6", color: "#7A6342", fontWeight: 700 }}
                value={form.projCode} readOnly placeholder="Auto-generated" />
            </div>
            <div style={{ flex: 2, minWidth: 160 }}>
              <label style={labelStyle}>Stage</label>
              <select style={inputStyle} value={form.stage} onChange={e => set("stage", e.target.value)}>
                <option value="">Select</option>
                {PROACTIVE_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {form.stage === "Other referral" && (
              <div style={{ flex: 2, minWidth: 160 }}>
                <label style={labelStyle}>Other Referral (specify)</label>
                <input style={inputStyle} value={otherReferral} onChange={e => setOtherReferral(e.target.value)} placeholder="Describe referral source" />
              </div>
            )}
            <div style={{ flex: 2, minWidth: 130 }}>
              <label style={labelStyle}>Risk Category</label>
              <select style={inputStyle} value={form.riskCategory} onChange={e => set("riskCategory", e.target.value as RiskCategory)}>
                <option value="">Select</option>
                {RISK_CATEGORIES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div style={{ flex: 2, minWidth: 160 }}>
              <label style={labelStyle}>Project Outcome</label>
              <select style={inputStyle} value={form.projectOutcome} onChange={e => set("projectOutcome", e.target.value as ProjectOutcome)}>
                <option value="">Select</option>
                {PROJECT_OUTCOMES.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>

          {/* Inspection Types + Selected By */}
          <div className="form-row">
            <div style={{ flex: 2, minWidth: 160 }}>
              <label style={labelStyle}>1st Inspection Type</label>
              <select style={inputStyle} value={form.firstInspectionType} onChange={e => set("firstInspectionType", e.target.value as InspectionType)}>
                <option value="">Select</option>
                {INSPECTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ flex: 2, minWidth: 160 }}>
              <label style={labelStyle}>Sequential Inspection</label>
              <select style={inputStyle} value={form.sequentialInspection} onChange={e => set("sequentialInspection", e.target.value as InspectionType)}>
                <option value="">Select</option>
                {INSPECTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ flex: 2, minWidth: 160 }}>
              <label style={labelStyle}>Free Type</label>
              <input style={inputStyle} value={form.freeType} onChange={e => set("freeType", e.target.value)} placeholder="Free text" />
            </div>
            <div style={{ flex: 2, minWidth: 160 }}>
              <label style={labelStyle}>Selected By</label>
              <select style={inputStyle} value={form.selectedBy} onChange={e => set("selectedBy", e.target.value)}>
                <option value="">Select</option>
                {SELECTED_BY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>

          {/* Inspector checkboxes — Raquel Diaz and Simone Baeta Lentini */}
          <div className="form-row">
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Inspector(s)</label>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 4 }}>
                {INSPECTOR_OPTIONS.map(name => (
                  <label key={name} style={{
                    display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer",
                    userSelect: "none"
                  }}>
                    <input
                      type="checkbox"
                      checked={form.inspectors.includes(name)}
                      onChange={() => toggleInspector(name)}
                      style={{ width: 14, height: 14, accentColor: "#A68A64" }}
                    />
                    {name}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Address */}
          <div style={sectionTitle}>Site Address</div>
          <div className="form-row">
            <div style={{ flex: 3, minWidth: 200 }}>
              <label style={labelStyle}>Street Address</label>
              <input style={inputStyle} value={form.address} onChange={e => set("address", e.target.value)} placeholder="e.g. 123 George St" />
            </div>
            <div style={{ flex: 2, minWidth: 140 }}>
              <label style={labelStyle}>Suburb</label>
              <input style={inputStyle} value={form.suburb} onChange={e => set("suburb", e.target.value)} placeholder="e.g. Sydney" />
            </div>
            <div style={{ flex: 1, minWidth: 80 }}>
              <label style={labelStyle}>Postcode</label>
              <input style={inputStyle} value={form.postcode} onChange={e => set("postcode", e.target.value)} placeholder="2000" />
            </div>
          </div>

          {/* Builder */}
          <div style={sectionTitle}>Builder Details</div>
          <div className="form-row">
            <div style={{ flex: 3, minWidth: 200 }}>
              <label style={labelStyle}>Builder Name</label>
              <input style={inputStyle} value={form.builder} onChange={e => set("builder", e.target.value)} placeholder="Builder name" />
            </div>
            <div style={{ flex: 2, minWidth: 130 }}>
              <label style={labelStyle}>ACN</label>
              <input style={inputStyle} value={form.builderACN} onChange={e => set("builderACN", e.target.value)} placeholder="000 000 000" />
            </div>
            <div style={{ flex: 2, minWidth: 140 }}>
              <label style={labelStyle}>Registration No.</label>
              <input style={inputStyle} value={form.builderRegistration} onChange={e => set("builderRegistration", e.target.value)} placeholder="BLD-XXXX-XXX" />
            </div>
            <div style={{ flex: 2, minWidth: 130 }}>
              <label style={labelStyle}>Expiry Date</label>
              <input style={inputStyle} value={form.builderExpireDate} onChange={e => set("builderExpireDate", e.target.value)} placeholder="DD/MM/YYYY" />
            </div>
          </div>

          {/* Developer */}
          <div style={sectionTitle}>Developer Details</div>
          <div className="form-row">
            <div style={{ flex: 3, minWidth: 200 }}>
              <label style={labelStyle}>Developer Name</label>
              <input style={inputStyle} value={form.developer} onChange={e => set("developer", e.target.value)} placeholder="Developer name" />
            </div>
            <div style={{ flex: 2, minWidth: 130 }}>
              <label style={labelStyle}>ACN</label>
              <input style={inputStyle} value={form.developerACN} onChange={e => set("developerACN", e.target.value)} placeholder="000 000 000" />
            </div>
          </div>

          {/* Certifier */}
          <div style={sectionTitle}>Certifier Details</div>
          <div className="form-row">
            <div style={{ flex: 2, minWidth: 160 }}>
              <label style={labelStyle}>Certifier Company</label>
              <input style={inputStyle} value={form.certifierCompany} onChange={e => set("certifierCompany", e.target.value)} placeholder="Company name" />
            </div>
            <div style={{ flex: 2, minWidth: 160 }}>
              <label style={labelStyle}>Certifier Name</label>
              <input style={inputStyle} value={form.certifierName} onChange={e => set("certifierName", e.target.value)} placeholder="Certifier name" />
            </div>
            <div style={{ flex: 1, minWidth: 120 }}>
              <label style={labelStyle}>ACN</label>
              <input style={inputStyle} value={form.certifierACN} onChange={e => set("certifierACN", e.target.value)} placeholder="000 000 000" />
            </div>
          </div>

          {/* Building Details */}
          <div style={sectionTitle}>Building Details</div>
          <div className="form-row">
            <div style={{ flex: 1, minWidth: 80 }}>
              <label style={labelStyle}>No. of Units</label>
              <input style={inputStyle} value={form.numberOfUnits} onChange={e => set("numberOfUnits", e.target.value)} placeholder="0" />
            </div>
            <div style={{ flex: 1, minWidth: 100 }}>
              <label style={labelStyle}>Basement Levels</label>
              <input style={inputStyle} value={form.numberOfLevelsBasement} onChange={e => set("numberOfLevelsBasement", e.target.value)} placeholder="0" />
            </div>
            <div style={{ flex: 1, minWidth: 100 }}>
              <label style={labelStyle}>GL to Roof Levels</label>
              <input style={inputStyle} value={form.numberOfLevelsGLRoof} onChange={e => set("numberOfLevelsGLRoof", e.target.value)} placeholder="0" />
            </div>
            <div style={{ flex: 1, minWidth: 100 }}>
              <label style={labelStyle}>Effective Height (m)</label>
              <input style={inputStyle} value={form.effectiveHeight} onChange={e => set("effectiveHeight", e.target.value)} placeholder="0.0" />
            </div>
          </div>
          <div className="form-row">
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Building Classes</label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                {BUILDING_CLASSES.map(cls => (
                  <label key={cls} style={{
                    display: "flex", alignItems: "center", gap: 3, fontSize: 12, cursor: "pointer",
                    background: form.buildingClasses.includes(cls) ? "#1a1a2e" : "#f3f4f6",
                    color: form.buildingClasses.includes(cls) ? "#fff" : "#374151",
                    padding: "2px 8px", borderRadius: 4, border: "1px solid #d1d5db", userSelect: "none"
                  }}>
                    <input type="checkbox" style={{ display: "none" }} checked={form.buildingClasses.includes(cls)} onChange={() => toggleClass(cls)} />
                    Class {cls}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Development Info */}
          <div style={sectionTitle}>Development Information</div>
          <div className="form-row">
            <div style={{ flex: 1, minWidth: 120 }}>
              <label style={labelStyle}>BW/ITSOC</label>
              <input style={inputStyle} value={form.bwItsoc} onChange={e => set("bwItsoc", e.target.value)} placeholder="BW-XXXX-XXXX" />
            </div>
            <div style={{ flex: 1, minWidth: 120 }}>
              <label style={labelStyle}>DA Number</label>
              <input style={inputStyle} value={form.daNumber} onChange={e => set("daNumber", e.target.value)} placeholder="DA-XXXX-XXXX" />
            </div>
            <div style={{ flex: 1, minWidth: 120 }}>
              <label style={labelStyle}>CC Number</label>
              <input style={inputStyle} value={form.ccNumber} onChange={e => set("ccNumber", e.target.value)} placeholder="CC-XXXX-XXXX" />
            </div>
            <div style={{ flex: 1, minWidth: 140 }}>
              <label style={labelStyle}>Cost of Development</label>
              <input style={inputStyle} value={form.costOfDevelopment} onChange={e => set("costOfDevelopment", e.target.value)} placeholder="$0" />
            </div>
          </div>
          <div className="form-row">
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Development Description</label>
              <textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical" }} value={form.developDescription} onChange={e => set("developDescription", e.target.value)} placeholder="Describe the development..." />
            </div>
          </div>

          {/* Design Practitioners (DBP) */}
          <div style={sectionTitle}>Design Practitioners (DBP)</div>
          {form.dbpPractitioners.map((dbp, idx) => (
            <div key={dbp.id} style={{ background: "#f9f8f6", border: "1px solid #e5e7eb", borderRadius: 6, padding: "10px 12px", marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#7A6342" }}>Practitioner {idx + 1}</span>
                <button onClick={() => removeDBP(dbp.id)} style={{ background: "#fee2e2", color: "#991b1b", border: "none", borderRadius: 3, padding: "2px 8px", fontSize: 11, cursor: "pointer" }}>Remove</button>
              </div>
              <div className="form-row">
                <div style={{ flex: 2, minWidth: 160 }}>
                  <label style={labelStyle}>Name</label>
                  <input style={inputStyle} value={dbp.name} onChange={e => updateDBP(dbp.id, "name", e.target.value)} placeholder="Practitioner name" />
                </div>
                <div style={{ flex: 2, minWidth: 160 }}>
                  <label style={labelStyle}>Company</label>
                  <input style={inputStyle} value={dbp.company} onChange={e => updateDBP(dbp.id, "company", e.target.value)} placeholder="Company name" />
                </div>
                <div style={{ flex: 2, minWidth: 140 }}>
                  <label style={labelStyle}>Registration No.</label>
                  <input style={inputStyle} value={(dbp as any).registration || ""} onChange={e => updateDBP(dbp.id, "registration", e.target.value)} placeholder="AP-XXXX-XXXX" />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Practitioner Types</label>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                  {DBP_TYPES.map(t => (
                    <label key={t} style={{
                      display: "flex", alignItems: "center", gap: 3, fontSize: 12, cursor: "pointer",
                      background: dbp.type.includes(t) ? "#1a1a2e" : "#f3f4f6",
                      color: dbp.type.includes(t) ? "#fff" : "#374151",
                      padding: "2px 8px", borderRadius: 4, border: "1px solid #d1d5db", userSelect: "none"
                    }}>
                      <input type="checkbox" style={{ display: "none" }} checked={dbp.type.includes(t)} onChange={() => toggleDBPType(dbp.id, t)} />
                      {t}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ))}
          <button onClick={addDBP} style={{ background: "#f3f4f6", color: "#374151", border: "1px dashed #d1d5db", borderRadius: 5, padding: "6px 14px", fontSize: 12, cursor: "pointer", marginBottom: 8 }}>
            + Add Design Practitioner
          </button>

          {/* Building Practitioner — per spec: Name + Registration Number */}
          <div style={sectionTitle}>Building Practitioner</div>
          <div className="form-row">
            <div style={{ flex: 3, minWidth: 220 }}>
              <label style={labelStyle}>Building Practitioner Name</label>
              <input style={inputStyle} value={form.buildingPractitionerName} onChange={e => set("buildingPractitionerName", e.target.value)} placeholder="Practitioner name" />
            </div>
            <div style={{ flex: 2, minWidth: 180 }}>
              <label style={labelStyle}>Registration Number</label>
              <input style={inputStyle} value={form.buildingPractitionerReg} onChange={e => set("buildingPractitionerReg", e.target.value)} placeholder="Registration number" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 20px", borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "flex-end", gap: 10, background: "#f9f8f6", borderRadius: "0 0 8px 8px" }}>
          <button onClick={onClose} style={{ background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", borderRadius: 5, padding: "8px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          <button onClick={handleSave} style={{ background: "linear-gradient(135deg,#7A6342,#A68A64)", color: "#fff", border: "none", borderRadius: 5, padding: "8px 24px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            {mode === "add" ? "Create Project" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Booking Modal */}
      {showBooking && localProject && (
        <BookingModal
          projectCode={localProject.projCode}
          projectAddress={`${localProject.address}${localProject.suburb ? ', ' + localProject.suburb : ''}`}
          existingBookings={localProject.bookings || []}
          onClose={() => setShowBooking(false)}
          onConfirm={handleBookingConfirm}
        />
      )}
    </div>
  );
}
