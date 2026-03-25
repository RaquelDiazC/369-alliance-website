/**
 * 369 Alliance System – Project Add/Edit Modal
 * Design: Authoritative Dark Navy with Bronze Accents
 */
import { useState } from "react";
import {
  STAGES, RISK_CATEGORIES, PROJECT_OUTCOMES, INSPECTION_TYPES, INSPECTORS,
  DBP_TYPES, BUILDING_CLASSES,
  type Project, type TabType, type Stage, type RiskCategory,
  type ProjectOutcome, type InspectionType, type DBPPractitioner
} from "@/lib/data";

const INTEL_STAGES = ["Site Preparation","Excavation","Basement","GL","Facade"];
const OC_STAGES = ["CAS complaint","Planning Portal","Project Intervene","DBP referral","Other referral"];

interface Props {
  mode: "add" | "edit";
  project?: Project;
  activeTab: TabType;
  onClose: () => void;
  onSave: (data: Partial<Project>) => void;
}

export default function ProjectModal({ mode, project, activeTab, onClose, onSave }: Props) {
  const stageOptions = activeTab === "OC Inspections" ? OC_STAGES : INTEL_STAGES;

  const [form, setForm] = useState({
    projCode: project?.projCode || "",
    stage: project?.stage || stageOptions[0] as Stage,
    riskCategory: project?.riskCategory || "Low" as RiskCategory,
    firstInspectionType: project?.firstInspectionType || "Selected" as InspectionType,
    sequentialInspection: project?.sequentialInspection || "Selected" as InspectionType,
    freeType: project?.freeType || "",
    selectedBy: project?.selectedBy || INSPECTORS[0],
    inspectors: project?.inspectors || [INSPECTORS[0]],
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
    projectOutcome: project?.projectOutcome || "WIP" as ProjectOutcome,
    dbpPractitioners: project?.dbpPractitioners || [] as DBPPractitioner[],
    buildingPractitioner: project?.buildingPractitioner || "",
  });

  const [otherReferral, setOtherReferral] = useState("");

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
      dbpPractitioners: [...f.dbpPractitioners, { id: String(Date.now()), type: [], name: "", company: "" }]
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
    onSave({ ...form, stage: (form.stage === "Other referral" ? otherReferral || form.stage : form.stage) as Stage });
  };

  const inputStyle = { border:"1px solid #d1d5db", borderRadius:4, padding:"6px 8px", fontSize:13, fontFamily:"IBM Plex Sans, sans-serif", background:"#fff", color:"#1a1a2e", outline:"none", width:"100%" };
  const labelStyle = { fontSize:11, fontWeight:600 as const, color:"#6b7280", textTransform:"uppercase" as const, letterSpacing:"0.05em", display:"block", marginBottom:3 };
  const sectionTitle = { fontSize:11, fontWeight:700 as const, textTransform:"uppercase" as const, letterSpacing:"0.08em", color:"#7A6342", borderBottom:"1px solid #e5e7eb", paddingBottom:4, marginBottom:8, marginTop:14 };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ maxWidth:920 }}>
        <div className="modal-header">
          <span style={{ fontWeight:700, fontSize:15 }}>{mode === "add" ? "+ Add New Project" : "Edit Project"} — {activeTab}</span>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"#fff", fontSize:20, cursor:"pointer", lineHeight:1 }}>×</button>
        </div>
        <div style={{ padding:"16px 20px", maxHeight:"80vh", overflowY:"auto" }}>

          {/* Row 1: Code, Stage, Risk, Outcome */}
          <div style={sectionTitle}>Project Details</div>
          <div className="form-row">
            <div style={{ flex:1, minWidth:100 }}>
              <label style={labelStyle}>Proj Code</label>
              <input style={inputStyle} value={form.projCode} onChange={e => set("projCode", e.target.value)} placeholder="e.g. 001" />
            </div>
            <div style={{ flex:2, minWidth:160 }}>
              <label style={labelStyle}>Stage</label>
              <select style={inputStyle} value={form.stage} onChange={e => set("stage", e.target.value)}>
                {stageOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {form.stage === "Other referral" && (
              <div style={{ flex:2, minWidth:160 }}>
                <label style={labelStyle}>Other Referral (specify)</label>
                <input style={inputStyle} value={otherReferral} onChange={e => setOtherReferral(e.target.value)} placeholder="Describe referral source" />
              </div>
            )}
            <div style={{ flex:2, minWidth:130 }}>
              <label style={labelStyle}>Risk Category</label>
              <select style={inputStyle} value={form.riskCategory} onChange={e => set("riskCategory", e.target.value as RiskCategory)}>
                {RISK_CATEGORIES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div style={{ flex:2, minWidth:140 }}>
              <label style={labelStyle}>Project Outcome</label>
              <select style={inputStyle} value={form.projectOutcome} onChange={e => set("projectOutcome", e.target.value as ProjectOutcome)}>
                {PROJECT_OUTCOMES.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>

          {/* Row 2: Inspection types */}
          <div className="form-row">
            <div style={{ flex:2, minWidth:160 }}>
              <label style={labelStyle}>1st Inspection Type</label>
              <select style={inputStyle} value={form.firstInspectionType} onChange={e => set("firstInspectionType", e.target.value as InspectionType)}>
                {INSPECTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ flex:2, minWidth:160 }}>
              <label style={labelStyle}>Sequential Inspection</label>
              <select style={inputStyle} value={form.sequentialInspection} onChange={e => set("sequentialInspection", e.target.value as InspectionType)}>
                {INSPECTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ flex:2, minWidth:160 }}>
              <label style={labelStyle}>Free Type</label>
              <input style={inputStyle} value={form.freeType} onChange={e => set("freeType", e.target.value)} placeholder="Free text" />
            </div>
            <div style={{ flex:2, minWidth:160 }}>
              <label style={labelStyle}>Selected By</label>
              <select style={inputStyle} value={form.selectedBy} onChange={e => set("selectedBy", e.target.value)}>
                {INSPECTORS.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
          </div>

          {/* Inspectors */}
          <div className="form-row">
            <div style={{ flex:1 }}>
              <label style={labelStyle}>Inspector(s)</label>
              <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginTop:4 }}>
                {INSPECTORS.map(i => (
                  <label key={i} style={{ display:"flex", alignItems:"center", gap:5, fontSize:13, cursor:"pointer" }}>
                    <input type="checkbox" checked={form.inspectors.includes(i)} onChange={() => toggleInspector(i)} />
                    {i}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Row 3: Address */}
          <div style={sectionTitle}>Location</div>
          <div className="form-row">
            <div style={{ flex:3, minWidth:200 }}>
              <label style={labelStyle}>Address</label>
              <input style={inputStyle} value={form.address} onChange={e => set("address", e.target.value)} placeholder="Street address" />
            </div>
            <div style={{ flex:1, minWidth:100 }}>
              <label style={labelStyle}>Photo URL</label>
              <input style={inputStyle} value={form.photoUrl} onChange={e => set("photoUrl", e.target.value)} placeholder="https://..." title="NearMap image URL" />
            </div>
            <div style={{ flex:2, minWidth:140 }}>
              <label style={labelStyle}>Suburb</label>
              <input style={inputStyle} value={form.suburb} onChange={e => set("suburb", e.target.value)} placeholder="Suburb" />
            </div>
            <div style={{ flex:1, minWidth:90 }}>
              <label style={labelStyle}>Postcode</label>
              <input style={inputStyle} value={form.postcode} onChange={e => set("postcode", e.target.value)} placeholder="2000" />
            </div>
          </div>

          {/* Row 4: Builder */}
          <div style={sectionTitle}>Builder</div>
          <div className="form-row">
            <div style={{ flex:2, minWidth:160 }}>
              <label style={labelStyle}>Builder Name</label>
              <input style={inputStyle} value={form.builder} onChange={e => set("builder", e.target.value)} />
            </div>
            <div style={{ flex:1, minWidth:120 }}>
              <label style={labelStyle}>Builder ACN</label>
              <input style={inputStyle} value={form.builderACN} onChange={e => set("builderACN", e.target.value)} />
            </div>
            <div style={{ flex:1, minWidth:140 }}>
              <label style={labelStyle}>Builder Registration</label>
              <input style={inputStyle} value={form.builderRegistration} onChange={e => set("builderRegistration", e.target.value)} />
            </div>
            <div style={{ flex:1, minWidth:120 }}>
              <label style={labelStyle}>Expire Date</label>
              <input style={inputStyle} value={form.builderExpireDate} onChange={e => set("builderExpireDate", e.target.value)} placeholder="DD/MM/YYYY" />
            </div>
          </div>

          {/* Row 5: Developer */}
          <div style={sectionTitle}>Developer</div>
          <div className="form-row">
            <div style={{ flex:2, minWidth:160 }}>
              <label style={labelStyle}>Developer Name</label>
              <input style={inputStyle} value={form.developer} onChange={e => set("developer", e.target.value)} />
            </div>
            <div style={{ flex:1, minWidth:120 }}>
              <label style={labelStyle}>Developer ACN</label>
              <input style={inputStyle} value={form.developerACN} onChange={e => set("developerACN", e.target.value)} />
            </div>
          </div>

          {/* Row 6: Certifier */}
          <div style={sectionTitle}>Certifier</div>
          <div className="form-row">
            <div style={{ flex:2, minWidth:160 }}>
              <label style={labelStyle}>Certifier Company</label>
              <input style={inputStyle} value={form.certifierCompany} onChange={e => set("certifierCompany", e.target.value)} />
            </div>
            <div style={{ flex:2, minWidth:140 }}>
              <label style={labelStyle}>Certifier Name</label>
              <input style={inputStyle} value={form.certifierName} onChange={e => set("certifierName", e.target.value)} />
            </div>
            <div style={{ flex:1, minWidth:120 }}>
              <label style={labelStyle}>Certifier ACN</label>
              <input style={inputStyle} value={form.certifierACN} onChange={e => set("certifierACN", e.target.value)} />
            </div>
          </div>

          {/* Row 7: Building details */}
          <div style={sectionTitle}>Building Details</div>
          <div className="form-row">
            <div style={{ flex:1 }}>
              <label style={labelStyle}>Building Classes</label>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:4 }}>
                {BUILDING_CLASSES.map(c => (
                  <label key={c} style={{ display:"flex", alignItems:"center", gap:3, fontSize:12, cursor:"pointer", background: form.buildingClasses.includes(c) ? "#1a1a2e" : "#f3f4f6", color: form.buildingClasses.includes(c) ? "#fff" : "#374151", padding:"2px 8px", borderRadius:4, border:"1px solid #d1d5db" }}>
                    <input type="checkbox" style={{ display:"none" }} checked={form.buildingClasses.includes(c)} onChange={() => toggleClass(c)} />
                    {c}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="form-row">
            <div style={{ flex:1, minWidth:100 }}>
              <label style={labelStyle}>No. of Units</label>
              <input style={inputStyle} value={form.numberOfUnits} onChange={e => set("numberOfUnits", e.target.value)} />
            </div>
            <div style={{ flex:1, minWidth:120 }}>
              <label style={labelStyle}>Levels (Basement)</label>
              <input style={inputStyle} value={form.numberOfLevelsBasement} onChange={e => set("numberOfLevelsBasement", e.target.value)} />
            </div>
            <div style={{ flex:1, minWidth:130 }}>
              <label style={labelStyle}>Levels (GL to Roof)</label>
              <input style={inputStyle} value={form.numberOfLevelsGLRoof} onChange={e => set("numberOfLevelsGLRoof", e.target.value)} />
            </div>
            <div style={{ flex:1, minWidth:110 }}>
              <label style={labelStyle}>Effective Height (m)</label>
              <input style={inputStyle} value={form.effectiveHeight} onChange={e => set("effectiveHeight", e.target.value)} />
            </div>
          </div>

          {/* Row 8: Development info */}
          <div style={sectionTitle}>Development Information</div>
          <div className="form-row">
            <div style={{ flex:1, minWidth:120 }}>
              <label style={labelStyle}>BW/ITSOC</label>
              <input style={inputStyle} value={form.bwItsoc} onChange={e => set("bwItsoc", e.target.value)} />
            </div>
            <div style={{ flex:1, minWidth:120 }}>
              <label style={labelStyle}>DA Number</label>
              <input style={inputStyle} value={form.daNumber} onChange={e => set("daNumber", e.target.value)} />
            </div>
            <div style={{ flex:1, minWidth:120 }}>
              <label style={labelStyle}>CC Number</label>
              <input style={inputStyle} value={form.ccNumber} onChange={e => set("ccNumber", e.target.value)} />
            </div>
            <div style={{ flex:1, minWidth:140 }}>
              <label style={labelStyle}>Cost of Development</label>
              <input style={inputStyle} value={form.costOfDevelopment} onChange={e => set("costOfDevelopment", e.target.value)} placeholder="$0" />
            </div>
          </div>
          <div className="form-row">
            <div style={{ flex:1 }}>
              <label style={labelStyle}>Development Description</label>
              <textarea style={{ ...inputStyle, minHeight:60, resize:"vertical" }} value={form.developDescription} onChange={e => set("developDescription", e.target.value)} />
            </div>
          </div>

          {/* DBP Practitioners */}
          <div style={sectionTitle}>Design Practitioners (DBP)</div>
          {form.dbpPractitioners.map((dbp, idx) => (
            <div key={dbp.id} style={{ background:"#f9f8f6", border:"1px solid #e5e7eb", borderRadius:6, padding:"10px 12px", marginBottom:10 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                <span style={{ fontSize:12, fontWeight:600, color:"#7A6342" }}>Practitioner {idx+1}</span>
                <button onClick={() => removeDBP(dbp.id)} style={{ background:"#fee2e2", color:"#991b1b", border:"none", borderRadius:3, padding:"2px 8px", fontSize:11, cursor:"pointer" }}>Remove</button>
              </div>
              <div className="form-row">
                <div style={{ flex:2, minWidth:160 }}>
                  <label style={labelStyle}>Name</label>
                  <input style={inputStyle} value={dbp.name} onChange={e => updateDBP(dbp.id, "name", e.target.value)} />
                </div>
                <div style={{ flex:2, minWidth:160 }}>
                  <label style={labelStyle}>Company</label>
                  <input style={inputStyle} value={dbp.company} onChange={e => updateDBP(dbp.id, "company", e.target.value)} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Practitioner Types</label>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:4 }}>
                  {DBP_TYPES.map(t => (
                    <label key={t} style={{ display:"flex", alignItems:"center", gap:3, fontSize:12, cursor:"pointer", background: dbp.type.includes(t) ? "#1a1a2e" : "#f3f4f6", color: dbp.type.includes(t) ? "#fff" : "#374151", padding:"2px 8px", borderRadius:4, border:"1px solid #d1d5db" }}>
                      <input type="checkbox" style={{ display:"none" }} checked={dbp.type.includes(t)} onChange={() => toggleDBPType(dbp.id, t)} />
                      {t}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ))}
          <button onClick={addDBP} style={{ background:"#f3f4f6", color:"#374151", border:"1px dashed #d1d5db", borderRadius:5, padding:"6px 14px", fontSize:12, cursor:"pointer", marginBottom:8 }}>
            + Add Design Practitioner
          </button>

          <div className="form-row">
            <div style={{ flex:1 }}>
              <label style={labelStyle}>Building Practitioner</label>
              <input style={inputStyle} value={form.buildingPractitioner} onChange={e => set("buildingPractitioner", e.target.value)} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding:"12px 20px", borderTop:"1px solid #e5e7eb", display:"flex", justifyContent:"flex-end", gap:10, background:"#f9f8f6", borderRadius:"0 0 8px 8px" }}>
          <button onClick={onClose} style={{ background:"#f3f4f6", color:"#374151", border:"1px solid #d1d5db", borderRadius:5, padding:"8px 20px", fontSize:13, fontWeight:600, cursor:"pointer" }}>Cancel</button>
          <button onClick={handleSave} style={{ background:"linear-gradient(135deg,#7A6342,#A68A64)", color:"#fff", border:"none", borderRadius:5, padding:"8px 24px", fontSize:13, fontWeight:700, cursor:"pointer" }}>
            {mode === "add" ? "Create Project" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
