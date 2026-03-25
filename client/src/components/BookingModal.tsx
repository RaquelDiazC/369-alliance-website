/**
 * 369 Alliance System – Booking Modal
 * Two-panel layout: left = booking history, right = form + calendar
 * UPCOMING bookings have an edit (pencil) icon → pre-fills form for rescheduling
 * HISTORY (past) bookings are strictly read-only — no edit allowed
 */
import { useState, useMemo } from "react";
import { type BookingReason, type BookingEntry } from "@/lib/data";

interface Props {
  projectCode: string;
  projectAddress: string;
  existingBookings: BookingEntry[];
  onClose: () => void;
  onConfirm: (date: string, reason: BookingReason, description: string, time?: string) => void;
  /** Called when an existing upcoming booking is updated (rescheduled) */
  onUpdate?: (id: string, date: string, reason: BookingReason, description: string, time?: string) => void;
}

const REASONS: BookingReason[] = ["1st Inspection", "Return Inspection", "Meeting", "Other"];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}
function fmtIso(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
/** Extract time from a description string like "...\nTime: 10:00" */
function extractTime(desc: string): string {
  const match = desc.match(/\nTime:\s*(\d{2}:\d{2})/);
  return match ? match[1] : "";
}
/** Strip the time line from a description */
function stripTime(desc: string): string {
  return desc.replace(/\nTime:\s*\d{2}:\d{2}/, "").trim();
}

const REASON_COLOURS: Record<BookingReason, string> = {
  "1st Inspection": "#1e3a5f",
  "Return Inspection": "#7A6342",
  "Meeting": "#2d6a4f",
  "Other": "#6b21a8",
};

// ─── Pencil SVG icon ─────────────────────────────────────────────────────────
function PencilIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14.85 2.15a2.1 2.1 0 0 1 2.97 2.97L6.5 16.44l-3.97.99 1-3.97L14.85 2.15z"
        stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default function BookingModal({ projectCode, projectAddress, existingBookings, onClose, onConfirm, onUpdate }: Props) {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  // ── Calendar state ────────────────────────────────────────────────────────
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

  // ── Form state ────────────────────────────────────────────────────────────
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [reason, setReason] = useState<BookingReason | "">("");
  const [description, setDescription] = useState("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [error, setError] = useState("");

  // ── Edit mode: if set, we are rescheduling an existing upcoming booking ───
  const [editingId, setEditingId] = useState<string | null>(null);

  // ── Live local copy so history updates in real-time ───────────────────────
  const [localBookings, setLocalBookings] = useState<BookingEntry[]>(existingBookings);

  // ── Calendar helpers ──────────────────────────────────────────────────────
  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfMonth(calYear, calMonth);

  const calCells = useMemo(() => {
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [calYear, calMonth, daysInMonth, firstDay]);

  function prevMonth() {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
  }
  function nextMonth() {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
  }
  function toIso(day: number) {
    return `${calYear}-${String(calMonth + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
  }
  function isPast(day: number) {
    return toIso(day) < todayStr;
  }

  // ── Sorted bookings ───────────────────────────────────────────────────────
  const sorted = [...localBookings].sort((a, b) => a.date.localeCompare(b.date));
  const upcoming = sorted.filter(b => b.date >= todayStr);
  const past = sorted.filter(b => b.date < todayStr);

  // ── Start editing an upcoming booking ─────────────────────────────────────
  function startEdit(b: BookingEntry) {
    setEditingId(b.id);
    setSelectedDate(b.date);
    setReason(b.reason);
    setDescription(stripTime(b.description));
    setSelectedTime(extractTime(b.description));
    setError("");
    // Navigate calendar to the booking's month
    const [y, m] = b.date.split("-").map(Number);
    setCalYear(y);
    setCalMonth(m - 1);
  }

  function cancelEdit() {
    setEditingId(null);
    setSelectedDate("");
    setReason("");
    setDescription("");
    setSelectedTime("");
    setError("");
  }

  // ── Confirm new booking ───────────────────────────────────────────────────
  function handleConfirm() {
    if (!selectedDate) { setError("Please select a date."); return; }
    if (!reason) { setError("Please select a reason."); return; }
    setError("");

    const fullDesc = description + (selectedTime ? `\nTime: ${selectedTime}` : "");

    if (editingId) {
      // ── Update existing booking ──────────────────────────────────────────
      setLocalBookings(prev => prev.map(b =>
        b.id === editingId
          ? { ...b, date: selectedDate, reason: reason as BookingReason, description: fullDesc }
          : b
      ));
      onUpdate?.(editingId, selectedDate, reason as BookingReason, fullDesc, selectedTime);
      setEditingId(null);
    } else {
      // ── Create new booking ───────────────────────────────────────────────
      const newEntry: BookingEntry = {
        id: String(Date.now()),
        date: selectedDate,
        reason: reason as BookingReason,
        description: fullDesc,
        createdAt: new Date().toISOString(),
        createdBy: "Raquel Diaz",
      };
      setLocalBookings(prev => [...prev, newEntry]);
      onConfirm(selectedDate, reason as BookingReason, fullDesc, selectedTime);
    }

    // Reset form
    setSelectedDate("");
    setReason("");
    setDescription("");
    setSelectedTime("");
  }

  const displayDate = selectedDate ? fmtIso(selectedDate) : "";
  const isEditing = editingId !== null;

  return (
    <div
      style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background:"#fff", borderRadius:12, width:"min(860px, 96vw)", maxHeight:"92vh", boxShadow:"0 24px 64px rgba(0,0,0,0.28)", overflow:"hidden", display:"flex", flexDirection:"column" }}>

        {/* ── Header ── */}
        <div style={{ background:"#1a1a2e", color:"#fff", padding:"14px 20px", display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
          <div style={{ width:26, height:26, background:"linear-gradient(135deg,#7A6342,#A68A64)", borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:10, color:"#fff" }}>369</div>
          <div>
            <div style={{ fontWeight:700, fontSize:14, letterSpacing:"0.02em" }}>Book Inspection / Meeting</div>
            <div style={{ fontSize:11, color:"#c5b49a", marginTop:1 }}>{projectCode} — {projectAddress}</div>
          </div>
          <button onClick={onClose} style={{ marginLeft:"auto", background:"none", border:"none", color:"rgba(255,255,255,0.7)", fontSize:22, cursor:"pointer", lineHeight:1 }}>×</button>
        </div>

        {/* ── Two-panel body — 50/50 split ── */}
        <div style={{ display:"flex", flex:1, overflow:"hidden" }}>

          {/* ── LEFT — Booking History (50%) ── */}
          <div style={{ flex:1, borderRight:"1px solid #e5e7eb", background:"#f9f8f6", display:"flex", flexDirection:"column", overflow:"hidden" }}>
            <div style={{ padding:"12px 14px", borderBottom:"1px solid #e5e7eb", background:"#f0ede8" }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#7A6342", textTransform:"uppercase", letterSpacing:"0.07em" }}>Booking History</div>
              <div style={{ fontSize:10, color:"#9ca3af", marginTop:2 }}>{localBookings.length} booking{localBookings.length !== 1 ? "s" : ""} total</div>
            </div>

            <div style={{ flex:1, overflowY:"auto", padding:"10px 12px", display:"flex", flexDirection:"column", gap:8 }}>

              {/* ── UPCOMING section ── */}
              {upcoming.length > 0 && (
                <>
                  <div style={{ fontSize:10, fontWeight:700, color:"#2d6a4f", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:2 }}>
                    Upcoming
                  </div>
                  {upcoming.map(b => (
                    <div
                      key={b.id}
                      style={{
                        background: editingId === b.id ? "#eff6ff" : "#fff",
                        border: editingId === b.id ? "1px solid #93c5fd" : "1px solid #d1fae5",
                        borderLeft: `3px solid ${REASON_COLOURS[b.reason] || "#1e3a5f"}`,
                        borderRadius:6,
                        padding:"8px 10px",
                        position:"relative",
                        transition:"background 0.15s, border 0.15s",
                      }}
                    >
                      {/* Date row with edit button */}
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                        <div style={{ fontSize:12, fontWeight:700, color:"#1a1a2e" }}>{fmtIso(b.date)}{extractTime(b.description) ? ` · ${extractTime(b.description)}` : ""}</div>
                        {/* Edit pencil — only for upcoming, not currently being edited */}
                        {editingId !== b.id && (
                          <button
                            onClick={() => startEdit(b)}
                            title="Reschedule this booking"
                            style={{
                              background:"#eff6ff",
                              border:"1px solid #bfdbfe",
                              borderRadius:4,
                              color:"#1e40af",
                              cursor:"pointer",
                              padding:"3px 6px",
                              display:"flex",
                              alignItems:"center",
                              gap:4,
                              fontSize:11,
                              fontWeight:600,
                              lineHeight:1,
                              flexShrink:0,
                            }}
                          >
                            <PencilIcon /> Edit
                          </button>
                        )}
                        {editingId === b.id && (
                          <span style={{ fontSize:10, color:"#1e40af", fontWeight:700, background:"#dbeafe", borderRadius:3, padding:"2px 6px" }}>Editing…</span>
                        )}
                      </div>

                      <div style={{ fontSize:11, color: REASON_COLOURS[b.reason] || "#1e3a5f", fontWeight:600, marginTop:3 }}>{b.reason}</div>
                      {stripTime(b.description) && (
                        <div style={{ fontSize:11, color:"#6b7280", marginTop:3, lineHeight:1.4 }}>{stripTime(b.description)}</div>
                      )}
                      <div style={{ fontSize:10, color:"#9ca3af", marginTop:4 }}>By {b.createdBy}</div>
                    </div>
                  ))}
                </>
              )}

              {/* ── HISTORY section (past — read-only) ── */}
              {past.length > 0 && (
                <>
                  <div style={{ fontSize:10, fontWeight:700, color:"#9ca3af", textTransform:"uppercase", letterSpacing:"0.06em", marginTop: upcoming.length > 0 ? 8 : 0, marginBottom:2 }}>
                    History
                  </div>
                  {past.map(b => (
                    <div
                      key={b.id}
                      style={{
                        background:"#fff",
                        border:"1px solid #e5e7eb",
                        borderLeft:"3px solid #d1d5db",
                        borderRadius:6,
                        padding:"8px 10px",
                        opacity:0.72,
                      }}
                    >
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                        <div style={{ fontSize:12, fontWeight:700, color:"#6b7280" }}>{fmtIso(b.date)}{extractTime(b.description) ? ` · ${extractTime(b.description)}` : ""}</div>
                        {/* Lock icon — visual cue that past entries are read-only */}
                        <span title="Past bookings cannot be edited" style={{ fontSize:12, color:"#d1d5db", cursor:"default" }}>🔒</span>
                      </div>
                      <div style={{ fontSize:11, color:"#9ca3af", fontWeight:600, marginTop:3 }}>{b.reason}</div>
                      {stripTime(b.description) && (
                        <div style={{ fontSize:11, color:"#9ca3af", marginTop:3, lineHeight:1.4 }}>{stripTime(b.description)}</div>
                      )}
                    </div>
                  ))}
                </>
              )}

              {localBookings.length === 0 && (
                <div style={{ textAlign:"center", padding:"24px 8px", color:"#9ca3af", fontSize:12 }}>
                  No bookings yet.<br />Create one using the form →
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT — Form + Calendar (50%) ── */}
          <div style={{ flex:1, overflowY:"auto", padding:"20px 24px", display:"flex", flexDirection:"column", gap:16 }}>

            {/* Edit mode banner */}
            {isEditing && (
              <div style={{ background:"#eff6ff", border:"1px solid #93c5fd", borderRadius:7, padding:"10px 14px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:"#1e40af" }}>✏️ Rescheduling booking</div>
                  <div style={{ fontSize:11, color:"#3b82f6", marginTop:2 }}>Change the date, time or reason below, then click Save Changes.</div>
                </div>
                <button
                  onClick={cancelEdit}
                  style={{ background:"none", border:"1px solid #93c5fd", borderRadius:5, color:"#1e40af", fontSize:11, fontWeight:600, cursor:"pointer", padding:"4px 10px", flexShrink:0 }}
                >
                  Cancel Edit
                </button>
              </div>
            )}

            {/* ── Reason ── */}
            <div>
              <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#374151", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6 }}>
                Reason <span style={{ color:"#c0392b" }}>*</span>
              </label>
              <select
                value={reason}
                onChange={e => setReason(e.target.value as BookingReason | "")}
                style={{ width:"100%", border:"1px solid #d1d5db", borderRadius:6, padding:"9px 12px", fontSize:13, color: reason ? "#1a1a2e" : "#9ca3af", background:"#fff", outline:"none", cursor:"pointer" }}
              >
                <option value="">Select...</option>
                {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            {/* ── Description ── */}
            <div>
              <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#374151", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6 }}>
                Description
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Enter inspection details..."
                rows={3}
                style={{ width:"100%", border:"1px solid #d1d5db", borderRadius:6, padding:"9px 12px", fontSize:13, color:"#1a1a2e", resize:"vertical", outline:"none", fontFamily:"IBM Plex Sans, sans-serif", boxSizing:"border-box" }}
              />
            </div>

            {/* ── Calendar ── */}
            <div>
              <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#374151", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8 }}>
                Select Date <span style={{ color:"#c0392b" }}>*</span>
              </label>
              <div style={{ border:"1px solid #e5e7eb", borderRadius:8, overflow:"hidden", userSelect:"none" }}>
                {/* Month nav */}
                <div style={{ background:"#1e3a5f", display:"flex", alignItems:"center", padding:"10px 14px" }}>
                  <button onClick={prevMonth} style={{ background:"rgba(255,255,255,0.15)", border:"none", color:"#fff", borderRadius:4, width:28, height:28, cursor:"pointer", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center" }}>←</button>
                  <div style={{ flex:1, textAlign:"center", color:"#fff", fontWeight:700, fontSize:14 }}>{MONTH_NAMES[calMonth]} {calYear}</div>
                  <button onClick={nextMonth} style={{ background:"rgba(255,255,255,0.15)", border:"none", color:"#fff", borderRadius:4, width:28, height:28, cursor:"pointer", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center" }}>→</button>
                </div>
                {/* Day headers */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", background:"#1e3a5f" }}>
                  {DAY_NAMES.map(d => (
                    <div key={d} style={{ textAlign:"center", padding:"6px 0", fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.8)" }}>{d}</div>
                  ))}
                </div>
                {/* Day cells */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", background:"#fff" }}>
                  {calCells.map((day, i) => {
                    if (!day) return <div key={i} style={{ padding:"8px 0" }} />;
                    const iso = toIso(day);
                    const pastDay = isPast(day);
                    const isToday = iso === todayStr;
                    const isSelected = iso === selectedDate;
                    const hasBooking = localBookings.some(b => b.date === iso);
                    return (
                      <div
                        key={i}
                        onClick={() => !pastDay && setSelectedDate(iso)}
                        style={{
                          textAlign:"center", padding:"8px 0", fontSize:13,
                          cursor: pastDay ? "default" : "pointer",
                          color: pastDay ? "#d1d5db" : isSelected ? "#fff" : isToday ? "#1e3a5f" : "#1a1a2e",
                          background: isSelected ? "#1e3a5f" : isToday && !isSelected ? "#dbeafe" : "transparent",
                          fontWeight: isSelected || isToday ? 700 : 400,
                          borderRadius: isSelected ? 4 : 0,
                          position:"relative",
                          transition:"background 0.1s",
                        }}
                      >
                        {day}
                        {hasBooking && !isSelected && (
                          <div style={{ position:"absolute", bottom:2, left:"50%", transform:"translateX(-50%)", width:4, height:4, borderRadius:"50%", background:"#A68A64" }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              {selectedDate && (
                <div style={{ marginTop:8, fontSize:12, color:"#2d6a4f", fontWeight:600 }}>
                  ✓ Selected: {displayDate}{selectedTime ? ` at ${selectedTime}` : ""}
                </div>
              )}
            </div>

            {/* ── Time Selection ── */}
            <div>
              <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#374151", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8 }}>
                Select Time <span style={{ fontSize:10, color:"#9ca3af", fontWeight:400, textTransform:"none" }}>(optional)</span>
              </label>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6 }}>
                {["08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30"].map(t => (
                  <button
                    key={t}
                    onClick={() => setSelectedTime(prev => prev === t ? "" : t)}
                    style={{
                      padding:"6px 4px", fontSize:12, fontWeight:600, borderRadius:5, cursor:"pointer",
                      border: selectedTime === t ? "2px solid #1e40af" : "1px solid #e5e7eb",
                      background: selectedTime === t ? "#1e40af" : "#f9fafb",
                      color: selectedTime === t ? "#fff" : "#374151",
                      transition:"all 0.1s",
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div style={{ marginTop:8, display:"flex", alignItems:"center", gap:8 }}>
                <label style={{ fontSize:11, color:"#6b7280", fontWeight:600 }}>Custom:</label>
                <input
                  type="time"
                  value={selectedTime}
                  onChange={e => setSelectedTime(e.target.value)}
                  style={{ border:"1px solid #d1d5db", borderRadius:5, padding:"5px 8px", fontSize:12, color:"#1a1a2e", outline:"none" }}
                />
              </div>
            </div>

            {/* ── Error ── */}
            {error && (
              <div style={{ background:"#fee2e2", border:"1px solid #fca5a5", borderRadius:5, padding:"8px 12px", fontSize:12, color:"#991b1b" }}>{error}</div>
            )}

            {/* ── Actions ── */}
            <div style={{ display:"flex", gap:10, justifyContent:"flex-end", paddingTop:4 }}>
              {isEditing ? (
                <>
                  <button onClick={cancelEdit} style={{ background:"#f3f4f6", color:"#374151", border:"1px solid #d1d5db", borderRadius:5, padding:"9px 20px", fontSize:13, fontWeight:600, cursor:"pointer" }}>
                    Cancel
                  </button>
                  <button onClick={handleConfirm} style={{ background:"linear-gradient(135deg,#1e40af,#2563eb)", color:"#fff", border:"none", borderRadius:5, padding:"9px 22px", fontSize:13, fontWeight:700, cursor:"pointer", letterSpacing:"0.02em", display:"flex", alignItems:"center", gap:6 }}>
                    <PencilIcon /> Save Changes
                  </button>
                </>
              ) : (
                <>
                  <button onClick={onClose} style={{ background:"#f3f4f6", color:"#374151", border:"1px solid #d1d5db", borderRadius:5, padding:"9px 20px", fontSize:13, fontWeight:600, cursor:"pointer" }}>
                    Cancel
                  </button>
                  <button onClick={handleConfirm} style={{ background:"linear-gradient(135deg,#1e3a5f,#2d5a8f)", color:"#fff", border:"none", borderRadius:5, padding:"9px 22px", fontSize:13, fontWeight:700, cursor:"pointer", letterSpacing:"0.02em" }}>
                    Confirm Booking
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
