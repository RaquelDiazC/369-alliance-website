/**
 * 369 Alliance System – View Project Modal
 * Shows site photo on left, site details below photo, history on right
 */
import { type Project } from "@/lib/data";

interface Props {
  project: Project;
  onClose: () => void;
}

export default function ViewModal({ project, onClose }: Props) {
  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ maxWidth:1000 }}>
        <div className="modal-header">
          <div>
            <span style={{ fontWeight:700, fontSize:15 }}>Project View — </span>
            <code style={{ fontFamily:"IBM Plex Mono, monospace", color:"#A68A64", fontSize:14 }}>{project.projCode}</code>
            <span style={{ marginLeft:10, fontSize:13, color:"#c5b49a" }}>{project.address}, {project.suburb} {project.postcode}</span>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"#fff", fontSize:20, cursor:"pointer", lineHeight:1 }}>×</button>
        </div>

        <div style={{ display:"flex", gap:0, maxHeight:"80vh", overflow:"hidden" }}>
          {/* Left: Photo + Details */}
          <div style={{ width:340, flexShrink:0, borderRight:"1px solid #e5e7eb", overflowY:"auto", padding:"16px" }}>
            {/* Photo */}
            <div style={{ width:"100%", height:180, background:"#f0ede8", borderRadius:6, marginBottom:14, overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", border:"1px solid #e5e7eb" }}>
              {project.photoUrl ? (
                <img src={project.photoUrl} alt="Site" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
              ) : (
                <div style={{ textAlign:"center", color:"#9ca3af" }}>
                  <div style={{ fontSize:32, marginBottom:4 }}>🏗️</div>
                  <div style={{ fontSize:12 }}>No site photo</div>
                </div>
              )}
            </div>

            {/* Site Details */}
            <div style={{ fontSize:12, color:"#374151" }}>
              {[
                ["Project Code", project.projCode],
                ["Stage", project.stage],
                ["Risk Category", project.riskCategory],
                ["Project Outcome", project.projectOutcome],
                ["Selected By", project.selectedBy],
                ["Inspector(s)", project.inspectors.join(", ")],
                ["Address", `${project.address}, ${project.suburb} ${project.postcode}`],
                ["Builder", project.builder],
                ["Builder ACN", project.builderACN],
                ["Builder Reg.", project.builderRegistration],
                ["Expire Date", project.builderExpireDate],
                ["Developer", project.developer],
                ["Developer ACN", project.developerACN],
                ["Certifier Company", project.certifierCompany],
                ["Certifier Name", project.certifierName],
                ["Certifier ACN", project.certifierACN],
                ["Building Classes", project.buildingClasses.join(", ")],
                ["No. of Units", project.numberOfUnits],
                ["Levels (Basement)", project.numberOfLevelsBasement],
                ["Levels (GL–Roof)", project.numberOfLevelsGLRoof],
                ["Effective Height", project.effectiveHeight ? `${project.effectiveHeight}m` : ""],
                ["BW/ITSOC", project.bwItsoc],
                ["DA Number", project.daNumber],
                ["CC Number", project.ccNumber],
                ["Cost of Dev.", project.costOfDevelopment],
                ["Created", project.created],
              ].map(([label, value]) => value ? (
                <div key={label as string} style={{ display:"flex", gap:6, marginBottom:5, borderBottom:"1px solid #f5f4f1", paddingBottom:4 }}>
                  <span style={{ fontWeight:600, color:"#6b7280", minWidth:110, fontSize:11, textTransform:"uppercase", letterSpacing:"0.04em" }}>{label}</span>
                  <span style={{ color:"#1a1a2e", fontFamily: String(label).includes("Code") || String(label).includes("Number") || String(label).includes("ACN") || String(label).includes("BW") ? "IBM Plex Mono, monospace" : "inherit" }}>{value}</span>
                </div>
              ) : null)}

              {project.developDescription && (
                <div style={{ marginTop:8 }}>
                  <div style={{ fontWeight:600, color:"#6b7280", fontSize:11, textTransform:"uppercase", letterSpacing:"0.04em", marginBottom:4 }}>Description</div>
                  <div style={{ color:"#374151", lineHeight:1.5 }}>{project.developDescription}</div>
                </div>
              )}

              {project.dbpPractitioners.length > 0 && (
                <div style={{ marginTop:10 }}>
                  <div style={{ fontWeight:700, color:"#7A6342", fontSize:11, textTransform:"uppercase", letterSpacing:"0.06em", borderBottom:"1px solid #e5e7eb", paddingBottom:4, marginBottom:6 }}>DBP Practitioners</div>
                  {project.dbpPractitioners.map(d => (
                    <div key={d.id} style={{ background:"#f9f8f6", borderRadius:4, padding:"6px 8px", marginBottom:6, fontSize:12 }}>
                      <div style={{ fontWeight:600 }}>{d.name}</div>
                      <div style={{ color:"#6b7280" }}>{d.company}</div>
                      <div style={{ color:"#A68A64", fontSize:11 }}>{d.type.join(", ")}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: History */}
          <div style={{ flex:1, overflowY:"auto", padding:"16px" }}>
            <div style={{ fontWeight:700, fontSize:13, color:"#1a1a2e", marginBottom:12, display:"flex", alignItems:"center", gap:8 }}>
              <span>📋</span> Project History
            </div>
            {project.history.length === 0 ? (
              <div style={{ color:"#9ca3af", fontSize:13, textAlign:"center", padding:"40px 0" }}>No history recorded.</div>
            ) : (
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                <thead>
                  <tr style={{ background:"#1a1a2e" }}>
                    <th style={{ color:"#fff", padding:"7px 10px", textAlign:"left", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em" }}>Date & Time</th>
                    <th style={{ color:"#fff", padding:"7px 10px", textAlign:"left", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em" }}>Operation</th>
                    <th style={{ color:"#fff", padding:"7px 10px", textAlign:"left", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em" }}>User</th>
                    <th style={{ color:"#fff", padding:"7px 10px", textAlign:"left", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em" }}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {[...project.history].reverse().map((h, i) => (
                    <tr key={h.id} style={{ background: i % 2 === 0 ? "#fff" : "#fafaf9" }}>
                      <td style={{ padding:"6px 10px", fontFamily:"IBM Plex Mono, monospace", fontSize:11, color:"#6b7280", whiteSpace:"nowrap" }}>{h.date}</td>
                      <td style={{ padding:"6px 10px", fontWeight:600, color:"#1a1a2e" }}>{h.operation}</td>
                      <td style={{ padding:"6px 10px", color:"#374151" }}>{h.person}</td>
                      <td style={{ padding:"6px 10px", color:"#6b7280" }}>{h.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div style={{ padding:"10px 20px", borderTop:"1px solid #e5e7eb", display:"flex", justifyContent:"flex-end", background:"#f9f8f6", borderRadius:"0 0 8px 8px" }}>
          <button onClick={onClose} style={{ background:"#1a1a2e", color:"#fff", border:"none", borderRadius:5, padding:"8px 24px", fontSize:13, fontWeight:600, cursor:"pointer" }}>Close</button>
        </div>
      </div>
    </div>
  );
}
