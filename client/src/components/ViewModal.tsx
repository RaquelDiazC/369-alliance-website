/**
 * 369 Alliance System – View Project Modal
 * Shows site photo on left, site details + booking history below photo on left,
 * full project history on right. BOOK button in header.
 */
import { useState } from "react";
import { type Project, addBooking, getNextBooking, type BookingReason } from "@/lib/data";
import BookingModal from "@/components/BookingModal";

interface Props {
  project: Project;
  onClose: () => void;
  onRefresh?: () => void;
}

export default function ViewModal({ project, onClose, onRefresh }: Props) {
  const [showBooking, setShowBooking] = useState(false);
  const [localProject, setLocalProject] = useState(project);

  function handleBookingConfirm(date: string, reason: BookingReason, description: string) {
    addBooking(localProject.id, { date, reason, description }, "Raquel Diaz");
    // Re-read the project from store to get updated bookings
    const { getProjects } = require("@/lib/data");
    const updated = getProjects().find((p: Project) => p.id === localProject.id);
    if (updated) setLocalProject(updated);
    if (onRefresh) onRefresh();
    setShowBooking(false);
  }

  const nextBooking = getNextBooking(localProject);
  const allBookings = [...(localProject.bookings || [])].sort((a, b) => a.date.localeCompare(b.date));
  const futureBookings = allBookings.filter(b => b.date >= new Date().toISOString().split("T")[0]);
  const pastBookings = allBookings.filter(b => b.date < new Date().toISOString().split("T")[0]);

  function fmtDate(iso: string) {
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  }

  return (
    <>
      <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="modal-box" style={{ maxWidth: 1100 }}>
          {/* Header */}
          <div className="modal-header">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div>
                <span style={{ fontWeight: 700, fontSize: 15 }}>Project View — </span>
                <code style={{ fontFamily: "IBM Plex Mono, monospace", color: "#A68A64", fontSize: 14 }}>{localProject.projCode}</code>
                <span style={{ marginLeft: 10, fontSize: 13, color: "#c5b49a" }}>{localProject.address}, {localProject.suburb} {localProject.postcode}</span>
              </div>
              {/* BOOK button in header */}
              <button
                onClick={() => setShowBooking(true)}
                style={{
                  background: nextBooking ? "#e8f4fd" : "linear-gradient(135deg,#1e3a5f,#2d5a8f)",
                  color: nextBooking ? "#1e3a5f" : "#fff",
                  border: nextBooking ? "1px solid #93c5fd" : "none",
                  borderRadius: 5,
                  padding: "5px 14px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  whiteSpace: "nowrap",
                }}
              >
                📅 {nextBooking ? `Next: ${fmtDate(nextBooking.date)}` : "BOOK"}
              </button>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", color: "#fff", fontSize: 20, cursor: "pointer", lineHeight: 1 }}>×</button>
          </div>

          <div style={{ display: "flex", gap: 0, maxHeight: "80vh", overflow: "hidden" }}>
            {/* Left: Photo + Details + Booking History */}
            <div style={{ width: 360, flexShrink: 0, borderRight: "1px solid #e5e7eb", overflowY: "auto", padding: "16px" }}>
              {/* Photo */}
              <div style={{ width: "100%", height: 180, background: "#f0ede8", borderRadius: 6, marginBottom: 14, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e5e7eb" }}>
                {localProject.photoUrl ? (
                  <img src={localProject.photoUrl} alt="Site" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ textAlign: "center", color: "#9ca3af" }}>
                    <div style={{ fontSize: 32, marginBottom: 4 }}>🏗️</div>
                    <div style={{ fontSize: 12 }}>No site photo</div>
                  </div>
                )}
              </div>

              {/* Site Details */}
              <div style={{ fontSize: 12, color: "#374151" }}>
                {[
                  ["Project Code", localProject.projCode],
                  ["Stage", localProject.stage],
                  ["Risk Category", localProject.riskCategory],
                  ["Project Outcome", localProject.projectOutcome],
                  ["Selected By", localProject.selectedBy],
                  ["Inspector(s)", localProject.inspectors.join(", ")],
                  ["Address", `${localProject.address}, ${localProject.suburb} ${localProject.postcode}`],
                  ["Builder", localProject.builder],
                  ["Builder ACN", localProject.builderACN],
                  ["Builder Reg.", localProject.builderRegistration],
                  ["Expire Date", localProject.builderExpireDate],
                  ["Developer", localProject.developer],
                  ["Developer ACN", localProject.developerACN],
                  ["Certifier Company", localProject.certifierCompany],
                  ["Certifier Name", localProject.certifierName],
                  ["Certifier ACN", localProject.certifierACN],
                  ["Building Classes", localProject.buildingClasses.join(", ")],
                  ["No. of Units", localProject.numberOfUnits],
                  ["Levels (Basement)", localProject.numberOfLevelsBasement],
                  ["Levels (GL–Roof)", localProject.numberOfLevelsGLRoof],
                  ["Effective Height", localProject.effectiveHeight ? `${localProject.effectiveHeight}m` : ""],
                  ["BW/ITSOC", localProject.bwItsoc],
                  ["DA Number", localProject.daNumber],
                  ["CC Number", localProject.ccNumber],
                  ["Cost of Dev.", localProject.costOfDevelopment],
                  ["Created", localProject.created],
                ].map(([label, value]) => value ? (
                  <div key={label as string} style={{ display: "flex", gap: 6, marginBottom: 5, borderBottom: "1px solid #f5f4f1", paddingBottom: 4 }}>
                    <span style={{ fontWeight: 600, color: "#6b7280", minWidth: 110, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</span>
                    <span style={{ color: "#1a1a2e", fontFamily: String(label).includes("Code") || String(label).includes("Number") || String(label).includes("ACN") || String(label).includes("BW") ? "IBM Plex Mono, monospace" : "inherit" }}>{value}</span>
                  </div>
                ) : null)}

                {localProject.developDescription && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontWeight: 600, color: "#6b7280", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>Description</div>
                    <div style={{ color: "#374151", lineHeight: 1.5 }}>{localProject.developDescription}</div>
                  </div>
                )}

                {localProject.dbpPractitioners.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontWeight: 700, color: "#7A6342", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "1px solid #e5e7eb", paddingBottom: 4, marginBottom: 6 }}>DBP Practitioners</div>
                    {localProject.dbpPractitioners.map(d => (
                      <div key={d.id} style={{ background: "#f9f8f6", borderRadius: 4, padding: "6px 8px", marginBottom: 6, fontSize: 12 }}>
                        <div style={{ fontWeight: 600 }}>{d.name}</div>
                        <div style={{ color: "#6b7280" }}>{d.company}</div>
                        <div style={{ color: "#A68A64", fontSize: 11 }}>{d.type.join(", ")}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Booking History ── */}
              <div style={{ marginTop: 18, borderTop: "2px solid #e5e7eb", paddingTop: 14 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ fontWeight: 700, fontSize: 12, color: "#1a1a2e", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    📅 Bookings
                  </div>
                  <button
                    onClick={() => setShowBooking(true)}
                    style={{ background: "linear-gradient(135deg,#1e3a5f,#2d5a8f)", color: "#fff", border: "none", borderRadius: 4, padding: "3px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                  >
                    + Book
                  </button>
                </div>

                {allBookings.length === 0 ? (
                  <div style={{ color: "#9ca3af", fontSize: 12, textAlign: "center", padding: "16px 0" }}>No bookings yet.</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {/* Upcoming */}
                    {futureBookings.length > 0 && (
                      <>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#2d6a4f", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>Upcoming</div>
                        {futureBookings.map(b => (
                          <div key={b.id} style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 5, padding: "7px 10px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                              <span style={{ fontWeight: 700, fontSize: 12, color: "#1a1a2e", fontFamily: "IBM Plex Mono, monospace" }}>{fmtDate(b.date)}</span>
                              <span style={{ background: "#1e3a5f", color: "#fff", borderRadius: 3, padding: "1px 6px", fontSize: 10, fontWeight: 600 }}>{b.reason}</span>
                            </div>
                            {b.description && <div style={{ fontSize: 11, color: "#374151", lineHeight: 1.4 }}>{b.description}</div>}
                            <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 3 }}>Booked {b.createdAt} by {b.createdBy}</div>
                          </div>
                        ))}
                      </>
                    )}
                    {/* Past */}
                    {pastBookings.length > 0 && (
                      <>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 6, marginBottom: 2 }}>Past</div>
                        {pastBookings.map(b => (
                          <div key={b.id} style={{ background: "#f9f9f9", border: "1px solid #e5e7eb", borderRadius: 5, padding: "7px 10px", opacity: 0.75 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                              <span style={{ fontWeight: 700, fontSize: 12, color: "#6b7280", fontFamily: "IBM Plex Mono, monospace" }}>{fmtDate(b.date)}</span>
                              <span style={{ background: "#6b7280", color: "#fff", borderRadius: 3, padding: "1px 6px", fontSize: 10, fontWeight: 600 }}>{b.reason}</span>
                            </div>
                            {b.description && <div style={{ fontSize: 11, color: "#9ca3af", lineHeight: 1.4 }}>{b.description}</div>}
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Project History */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#1a1a2e", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <span>📋</span> Project History
              </div>
              {localProject.history.length === 0 ? (
                <div style={{ color: "#9ca3af", fontSize: 13, textAlign: "center", padding: "40px 0" }}>No history recorded.</div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: "#1a1a2e" }}>
                      <th style={{ color: "#fff", padding: "7px 10px", textAlign: "left", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Date & Time</th>
                      <th style={{ color: "#fff", padding: "7px 10px", textAlign: "left", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Operation</th>
                      <th style={{ color: "#fff", padding: "7px 10px", textAlign: "left", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>User</th>
                      <th style={{ color: "#fff", padding: "7px 10px", textAlign: "left", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...localProject.history].reverse().map((h, i) => (
                      <tr key={h.id} style={{ background: i % 2 === 0 ? "#fff" : "#fafaf9" }}>
                        <td style={{ padding: "6px 10px", fontFamily: "IBM Plex Mono, monospace", fontSize: 11, color: "#6b7280", whiteSpace: "nowrap" }}>{h.date}</td>
                        <td style={{ padding: "6px 10px", fontWeight: 600, color: "#1a1a2e" }}>{h.operation}</td>
                        <td style={{ padding: "6px 10px", color: "#374151" }}>{h.person}</td>
                        <td style={{ padding: "6px 10px", color: "#6b7280" }}>{h.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div style={{ padding: "10px 20px", borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "flex-end", background: "#f9f8f6", borderRadius: "0 0 8px 8px" }}>
            <button onClick={onClose} style={{ background: "#1a1a2e", color: "#fff", border: "none", borderRadius: 5, padding: "8px 24px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Close</button>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBooking && (
        <BookingModal
          projectCode={localProject.projCode}
          projectAddress={`${localProject.address}${localProject.suburb ? ', ' + localProject.suburb : ''}`}
          existingBookings={localProject.bookings || []}
          onClose={() => setShowBooking(false)}
          onConfirm={handleBookingConfirm}
        />
      )}
    </>
  );
}
