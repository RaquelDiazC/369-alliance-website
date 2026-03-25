/**
 * 369 Alliance System – Book Inspection Modal
 * Design: Authoritative Dark Navy with Bronze Accents
 * Three-panel layout: History | Calendar | Booking Form
 */
import { useState, useMemo } from "react";
import { type Project } from "@/lib/data";

interface BookingRecord {
  id: string;
  date: string;
  address: string;
  reason: string;
  description: string;
  type: "DBP" | "OC";
}

interface Props {
  projects: Project[];
  defaultTab: "DBP" | "OC";
  onClose: () => void;
}

const BOOKING_REASONS_DBP = [
  "Design Audit – Stage 1",
  "Design Audit – Stage 2",
  "As-Built Audit",
  "Remedial Audit",
  "Follow-up Inspection",
  "Complaint Investigation",
  "Referral Inspection",
];

const BOOKING_REASONS_OC = [
  "OC Inspection – Initial",
  "OC Inspection – Follow-up",
  "CAS Complaint Inspection",
  "Planning Portal Referral",
  "Project Intervene",
  "DBP Referral Inspection",
  "Blitz Inspection",
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// Sample booking history
const SAMPLE_BOOKINGS: BookingRecord[] = [
  { id:"b1", date:"15/02/2025", address:"123 George St, Sydney", reason:"Design Audit – Stage 1", description:"Initial design audit for waterproofing compliance.", type:"DBP" },
  { id:"b2", date:"22/02/2025", address:"11 St Ives Ave, St Ives", reason:"OC Inspection – Initial", description:"First OC inspection for building completion.", type:"OC" },
  { id:"b3", date:"01/03/2025", address:"218 Pitt St, Sydney", reason:"As-Built Audit", description:"Final as-built audit for high-rise mixed development.", type:"DBP" },
  { id:"b4", date:"10/03/2025", address:"123 George St, Sydney", reason:"Follow-up Inspection", description:"Follow-up on waterproofing defects identified in previous audit.", type:"DBP" },
  { id:"b5", date:"18/03/2025", address:"11 St Ives Ave, St Ives", reason:"OC Inspection – Follow-up", description:"Follow-up on items raised in initial OC inspection.", type:"OC" },
];

export default function BookInspectionModal({ projects, defaultTab, onClose }: Props) {
  const [tab, setTab] = useState<"DBP"|"OC">(defaultTab);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [bookings, setBookings] = useState<BookingRecord[]>(SAMPLE_BOOKINGS);
  const [successMsg, setSuccessMsg] = useState("");

  const reasons = tab === "DBP" ? BOOKING_REASONS_DBP : BOOKING_REASONS_OC;
  const addresses = projects.map(p => `${p.address}, ${p.suburb}`);

  const filteredHistory = useMemo(() =>
    bookings.filter(b => b.type === tab && (!selectedAddress || b.address === selectedAddress)),
    [bookings, tab, selectedAddress]
  );

  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfMonth(calYear, calMonth);
  const today = new Date();
  const isToday = (d: number) => d === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();

  // Booked dates for visual indicator
  const bookedDays = useMemo(() => {
    const set = new Set<number>();
    bookings.forEach(b => {
      const parts = b.date.split("/");
      if (parts.length === 3) {
        const d = parseInt(parts[0]);
        const m = parseInt(parts[1]) - 1;
        const y = parseInt(parts[2]);
        if (m === calMonth && y === calYear) set.add(d);
      }
    });
    return set;
  }, [bookings, calMonth, calYear]);

  const handleBook = () => {
    if (!selectedAddress || !reason || !selectedDate) return;
    const dateStr = `${selectedDate.toString().padStart(2,"0")}/${(calMonth+1).toString().padStart(2,"0")}/${calYear}`;
    const newBooking: BookingRecord = {
      id: String(Date.now()),
      date: dateStr,
      address: selectedAddress,
      reason,
      description,
      type: tab,
    };
    setBookings(prev => [newBooking, ...prev]);
    setSuccessMsg(`Inspection booked for ${dateStr} at ${selectedAddress}`);
    setSelectedDate(null);
    setReason("");
    setDescription("");
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  const inputStyle = { border:"1px solid #d1d5db", borderRadius:4, padding:"7px 10px", fontSize:12, fontFamily:"IBM Plex Sans, sans-serif", background:"#fff", color:"#1a1a2e", outline:"none", width:"100%" };
  const labelStyle = { fontSize:11, fontWeight:600 as const, color:"#6b7280", textTransform:"uppercase" as const, letterSpacing:"0.05em", display:"block", marginBottom:4 };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background:"#fff", borderRadius:10, width:"min(1000px, 96vw)", maxHeight:"90vh", display:"flex", flexDirection:"column", boxShadow:"0 24px 64px rgba(0,0,0,0.25)", overflow:"hidden" }}>
        {/* Header */}
        <div style={{ background:"#1a1a2e", color:"#fff", padding:"14px 20px", display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
          <div style={{ width:28, height:28, background:"linear-gradient(135deg,#7A6342,#A68A64)", borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:11, color:"#fff" }}>369</div>
          <span style={{ fontWeight:700, fontSize:15 }}>Book Inspection</span>
          <div style={{ display:"flex", gap:2, marginLeft:12 }}>
            {(["DBP","OC"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ padding:"4px 14px", border:"none", borderRadius:4, fontSize:12, fontWeight:600, cursor:"pointer", background: tab === t ? "linear-gradient(135deg,#7A6342,#A68A64)" : "rgba(255,255,255,0.1)", color:"#fff" }}>
                {t} Inspections
              </button>
            ))}
          </div>
          <div style={{ flex:1 }} />
          <button onClick={onClose} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.7)", fontSize:20, cursor:"pointer", lineHeight:1 }}>×</button>
        </div>

        {successMsg && (
          <div style={{ background:"#dcfce7", color:"#166534", padding:"8px 20px", fontSize:13, fontWeight:600, borderBottom:"1px solid #bbf7d0" }}>
            ✓ {successMsg}
          </div>
        )}

        {/* Three-panel body */}
        <div style={{ flex:1, display:"grid", gridTemplateColumns:"240px 1fr 280px", overflow:"hidden" }}>
          {/* Left: History */}
          <div style={{ borderRight:"1px solid #e5e7eb", display:"flex", flexDirection:"column", overflow:"hidden" }}>
            <div style={{ padding:"12px 14px", borderBottom:"1px solid #e5e7eb", background:"#f9f8f6" }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:8 }}>Inspection History</div>
              <select value={selectedAddress} onChange={e => setSelectedAddress(e.target.value)} style={{ ...inputStyle, fontSize:11 }}>
                <option value="">All Sites</option>
                {addresses.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div style={{ flex:1, overflowY:"auto" }}>
              {filteredHistory.length === 0 ? (
                <div style={{ padding:"20px 14px", textAlign:"center", color:"#9ca3af", fontSize:12 }}>No history for this site</div>
              ) : filteredHistory.map(b => (
                <div key={b.id} style={{ padding:"10px 14px", borderBottom:"1px solid #f0ede8" }}>
                  <div style={{ fontSize:11, fontWeight:700, color:"#A68A64", marginBottom:3 }}>{b.date}</div>
                  <div style={{ fontSize:12, fontWeight:600, color:"#1a1a2e", marginBottom:2, lineHeight:1.3 }}>{b.address}</div>
                  <div style={{ fontSize:11, color:"#6b7280", marginBottom:3 }}>{b.reason}</div>
                  {b.description && <div style={{ fontSize:11, color:"#9ca3af", fontStyle:"italic", lineHeight:1.3 }}>{b.description}</div>}
                </div>
              ))}
            </div>
          </div>

          {/* Middle: Calendar */}
          <div style={{ padding:"16px", display:"flex", flexDirection:"column", gap:12, overflowY:"auto" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4 }}>
              <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y-1); } else setCalMonth(m => m-1); }} style={{ background:"none", border:"1px solid #e5e7eb", borderRadius:4, padding:"4px 10px", cursor:"pointer", fontSize:14, color:"#374151" }}>‹</button>
              <span style={{ fontWeight:700, fontSize:15, color:"#1a1a2e" }}>{MONTH_NAMES[calMonth]} {calYear}</span>
              <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y+1); } else setCalMonth(m => m+1); }} style={{ background:"none", border:"1px solid #e5e7eb", borderRadius:4, padding:"4px 10px", cursor:"pointer", fontSize:14, color:"#374151" }}>›</button>
            </div>

            {/* Day names */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2 }}>
              {DAY_NAMES.map(d => (
                <div key={d} style={{ textAlign:"center", fontSize:10, fontWeight:700, color:"#9ca3af", padding:"4px 0", textTransform:"uppercase" }}>{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2 }}>
              {Array.from({ length: firstDay }, (_, i) => <div key={`empty-${i}`} />)}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const d = i + 1;
                const isSelected = selectedDate === d;
                const isBooked = bookedDays.has(d);
                const isTodayDay = isToday(d);
                return (
                  <button
                    key={d}
                    onClick={() => setSelectedDate(d)}
                    style={{
                      aspectRatio:"1",
                      border: isSelected ? "2px solid #A68A64" : "1px solid #e5e7eb",
                      borderRadius:6,
                      background: isSelected ? "linear-gradient(135deg,#7A6342,#A68A64)" : isTodayDay ? "#fef3e2" : "#fff",
                      color: isSelected ? "#fff" : isTodayDay ? "#7A6342" : "#374151",
                      fontSize:12,
                      fontWeight: isSelected || isTodayDay ? 700 : 400,
                      cursor:"pointer",
                      position:"relative",
                      display:"flex",
                      alignItems:"center",
                      justifyContent:"center",
                    }}
                  >
                    {d}
                    {isBooked && !isSelected && (
                      <span style={{ position:"absolute", bottom:2, left:"50%", transform:"translateX(-50%)", width:4, height:4, background:"#3b82f6", borderRadius:"50%" }} />
                    )}
                  </button>
                );
              })}
            </div>

            <div style={{ fontSize:11, color:"#6b7280", display:"flex", gap:12, alignItems:"center" }}>
              <span style={{ display:"flex", alignItems:"center", gap:4 }}><span style={{ width:8, height:8, background:"#fef3e2", border:"1px solid #A68A64", borderRadius:2, display:"inline-block" }} /> Today</span>
              <span style={{ display:"flex", alignItems:"center", gap:4 }}><span style={{ width:8, height:8, borderRadius:"50%", background:"#3b82f6", display:"inline-block" }} /> Has bookings</span>
              <span style={{ display:"flex", alignItems:"center", gap:4 }}><span style={{ width:8, height:8, background:"linear-gradient(135deg,#7A6342,#A68A64)", borderRadius:2, display:"inline-block" }} /> Selected</span>
            </div>

            {selectedDate && (
              <div style={{ background:"#fef3e2", border:"1px solid #f59e0b", borderRadius:6, padding:"10px 12px", fontSize:12, color:"#92400e", fontWeight:600 }}>
                Selected: {selectedDate.toString().padStart(2,"0")}/{(calMonth+1).toString().padStart(2,"0")}/{calYear}
              </div>
            )}
          </div>

          {/* Right: Booking Form */}
          <div style={{ borderLeft:"1px solid #e5e7eb", padding:"16px", display:"flex", flexDirection:"column", gap:12, overflowY:"auto", background:"#f9f8f6" }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#1a1a2e", marginBottom:4 }}>New Booking</div>

            <div>
              <label style={labelStyle}>Site Address</label>
              <select value={selectedAddress} onChange={e => setSelectedAddress(e.target.value)} style={inputStyle}>
                <option value="">Select site...</option>
                {addresses.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Inspection Date</label>
              <div style={{ ...inputStyle, color: selectedDate ? "#1a1a2e" : "#9ca3af", cursor:"default", background:"#f3f4f6" }}>
                {selectedDate ? `${selectedDate.toString().padStart(2,"0")}/${(calMonth+1).toString().padStart(2,"0")}/${calYear}` : "Select a date on the calendar"}
              </div>
            </div>

            <div>
              <label style={labelStyle}>Reason</label>
              <select value={reason} onChange={e => setReason(e.target.value)} style={inputStyle}>
                <option value="">Select reason...</option>
                {reasons.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Additional notes or context for this inspection..."
                rows={4}
                style={{ ...inputStyle, resize:"vertical", lineHeight:1.5 }}
              />
            </div>

            <button
              onClick={handleBook}
              disabled={!selectedAddress || !reason || !selectedDate}
              style={{
                background: (!selectedAddress || !reason || !selectedDate) ? "#d1d5db" : "linear-gradient(135deg,#7A6342,#A68A64)",
                color: (!selectedAddress || !reason || !selectedDate) ? "#9ca3af" : "#fff",
                border:"none", borderRadius:5, padding:"10px 0", fontSize:13, fontWeight:700, cursor: (!selectedAddress || !reason || !selectedDate) ? "not-allowed" : "pointer",
                width:"100%", marginTop:4
              }}
            >
              Book Inspection
            </button>

            <div style={{ fontSize:11, color:"#9ca3af", textAlign:"center" }}>
              All bookings are logged in the system history
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
