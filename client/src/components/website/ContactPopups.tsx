/**
 * 369 Alliance – Contact Popup Forms
 * Three modal forms: Request a Quote, Send a Message, Support
 * Design: Deep Navy #1a1a2e + Bronze #A68A64, IBM Plex Sans
 */

import { useState } from "react";
import { X, ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
export type PopupType = "quote" | "message" | "support" | null;

interface PopupProps {
  type: PopupType;
  onClose: () => void;
}

// ─── Shared overlay wrapper ───────────────────────────────────────────────────
function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(2px)", padding: "40px 16px 40px" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {children}
    </div>
  );
}

function ModalBox({ title, subtitle, onClose, children, wide }: {
  title: string; subtitle?: string; onClose: () => void; children: React.ReactNode; wide?: boolean;
}) {
  return (
    <div className={`w-full rounded-xl overflow-hidden shadow-2xl ${wide ? "max-w-4xl" : "max-w-2xl"}`} style={{ background: "#fff" }}>
      {/* Header */}
      <div className="flex items-start justify-between px-7 py-5" style={{ background: "#1a1a2e" }}>
        <div>
          <h2 className="text-xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>{title}</h2>
          {subtitle && <p className="text-sm mt-0.5" style={{ color: "#A68A64" }}>{subtitle}</p>}
        </div>
        <button onClick={onClose} className="text-white/60 hover:text-white transition-colors mt-0.5">
          <X size={20} />
        </button>
      </div>
      {/* Body */}
      <div className="px-7 py-6">{children}</div>
    </div>
  );
}

export function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>
        {label}{required && <span style={{ color: "#A68A64" }}> *</span>}
      </label>
      {children}
    </div>
  );
}

export function SectionHeader({ label }: { label: string }) {
  return (
    <div className="pt-2 pb-1">
      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#7A6342" }}>{label}</p>
      <div className="mt-1 h-px" style={{ background: "linear-gradient(90deg,#A68A64,transparent)" }} />
    </div>
  );
}

/** Collapsible single-entity section (Builder, Developer, Private Certifier) */
export function CollapsibleSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors hover:bg-gray-50"
        style={{ background: open ? "#fafaf9" : "#fff" }}
      >
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#7A6342" }}>{title}</span>
        {open ? <ChevronUp size={14} style={{ color: "#A68A64" }} /> : <ChevronDown size={14} style={{ color: "#A68A64" }} />}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-2 space-y-3" style={{ background: "#fafaf9", borderTop: "1px solid #e5e7eb" }}>
          {children}
        </div>
      )}
    </div>
  );
}

export const inputCls = "w-full border rounded-lg px-3 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-amber-200 focus:border-amber-400"
  + " bg-white text-gray-800 border-gray-200";

export const textareaCls = inputCls + " resize-none";

export const BUILDING_CLASSES = ["1","2","3","4","5","6","7a","7b","8","9a","9b","9c","10"];
export const PRACTITIONER_TYPES = ["architecture","structure","fire","waterproofing","essential services","cladding","vertical transportation"];

interface DesignPractitioner {
  id: number;
  name: string;
  company: string;
  types: string[];
}

// ─── Request a Quote ─────────────────────────────────────────────────────────
function QuoteForm({ onClose }: { onClose: () => void }) {
  const [isCompany, setIsCompany] = useState(false);
  const [situations, setSituations] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [buildingClasses, setBuildingClasses] = useState<string[]>([]);
  const [practitioners, setPractitioners] = useState<DesignPractitioner[]>([]);
  const [nextId, setNextId] = useState(1);

  const toggleSituation = (s: string) =>
    setSituations(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const toggleClass = (c: string) =>
    setBuildingClasses(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);

  const addPractitioner = () => {
    setPractitioners(prev => [...prev, { id: nextId, name: "", company: "", types: [] }]);
    setNextId(n => n + 1);
  };

  const removePractitioner = (id: number) =>
    setPractitioners(prev => prev.filter(p => p.id !== id));

  const togglePractitionerType = (id: number, type: string) =>
    setPractitioners(prev => prev.map(p =>
      p.id === id
        ? { ...p, types: p.types.includes(type) ? p.types.filter(t => t !== type) : [...p.types, type] }
        : p
    ));

  if (submitted) {
    return (
      <ModalBox title="Request Submitted" onClose={onClose} wide>
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: "linear-gradient(135deg,#7A6342,#A68A64)" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h3 className="text-lg font-bold mb-2" style={{ color: "#1a1a2e" }}>Thank you for your enquiry</h3>
          <p className="text-sm text-gray-500 mb-6">Our team will review your request and contact you within 1–2 business days.</p>
          <button onClick={onClose} className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg,#7A6342,#A68A64)" }}>Close</button>
        </div>
      </ModalBox>
    );
  }

  return (
    <ModalBox title="Request a Quote" subtitle="369 Alliance Pty Ltd — Building Compliance Specialists" onClose={onClose} wide>
      <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} className="space-y-4">

        {/* ── CONTACT INFORMATION ─────────────────────────────────── */}
        <SectionHeader label="Contact Information" />

        {/* Company toggle */}
        <div className="flex items-center gap-3 p-3 rounded-lg border" style={{ borderColor: "#e5e7eb", background: "#fafaf9" }}>
          <button type="button"
            onClick={() => setIsCompany(!isCompany)}
            className="relative w-10 h-5 rounded-full transition-colors flex-shrink-0"
            style={{ background: isCompany ? "#A68A64" : "#d1d5db" }}>
            <span className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
              style={{ left: isCompany ? "calc(100% - 18px)" : "2px" }} />
          </button>
          <span className="text-sm font-medium text-gray-700">This enquiry is on behalf of a company</span>
        </div>

        <div className={`grid gap-4 ${isCompany ? "grid-cols-2" : "grid-cols-1"}`}>
          <Field label="Full Name" required>
            <input type="text" className={inputCls} placeholder="Your full name" required />
          </Field>
          {isCompany && (
            <Field label="Company Name" required>
              <input type="text" className={inputCls} placeholder="Company Pty Ltd" required />
            </Field>
          )}
        </div>

        {isCompany && (
          <Field label="ACN (Australian Company Number)" required>
            <input type="text" className={inputCls} placeholder="000 000 000" required />
          </Field>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Field label="Email Address" required>
            <input type="email" className={inputCls} placeholder="you@example.com" required />
          </Field>
          <Field label="Phone Number" required>
            <input type="tel" className={inputCls} placeholder="+61 4xx xxx xxx" required />
          </Field>
        </div>

        {/* ── LOCATION ────────────────────────────────────────────── */}
        <SectionHeader label="Location" />

        <div className="grid grid-cols-4 gap-3">
          <div className="col-span-2">
            <Field label="Street Address" required>
              <input type="text" className={inputCls} placeholder="Street address" required />
            </Field>
          </div>
          <Field label="Photo URL">
            <input type="url" className={inputCls} placeholder="https://..." />
          </Field>
          <Field label="Suburb" required>
            <input type="text" className={inputCls} placeholder="Suburb" required />
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="State">
            <select className={inputCls} defaultValue="NSW">
              {["NSW","VIC","QLD","WA","SA","TAS","ACT","NT"].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="Postcode" required>
            <input type="text" className={inputCls} placeholder="2000" maxLength={4} required />
          </Field>
          <div />
        </div>

        {/* ── BUILDING / SITE SITUATION ────────────────────────────── */}
        <SectionHeader label="Building / Site Situation" />
        <div className="flex flex-wrap gap-2">
          {["Under Construction", "Occupied Building", "Other"].map(s => (
            <button key={s} type="button"
              onClick={() => toggleSituation(s)}
              className="px-4 py-2 rounded-full text-sm font-medium border transition-all"
              style={{
                background: situations.includes(s) ? "linear-gradient(135deg,#7A6342,#A68A64)" : "#fff",
                color: situations.includes(s) ? "#fff" : "#374151",
                borderColor: situations.includes(s) ? "#A68A64" : "#d1d5db",
              }}>
              {s}
            </button>
          ))}
        </div>
        <Field label="Describe the Situation">
          <textarea className={textareaCls} rows={2}
            placeholder="Please describe the current state of the building or site, any known issues, or context that will help us understand your needs..." />
        </Field>

        {/* ── COLLAPSIBLE ENTITY SECTIONS ─────────────────────────── */}
        <SectionHeader label="Project Parties (expand to provide details)" />

        {/* Builder */}
        <CollapsibleSection title="Builder">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Builder Name">
              <input type="text" className={inputCls} placeholder="Builder name" />
            </Field>
            <Field label="Builder ACN">
              <input type="text" className={inputCls} placeholder="000 000 000" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Builder Registration">
              <input type="text" className={inputCls} placeholder="Registration number" />
            </Field>
            <Field label="Expire Date">
              <input type="text" className={inputCls} placeholder="DD/MM/YYYY" />
            </Field>
          </div>
        </CollapsibleSection>

        {/* Developer */}
        <CollapsibleSection title="Developer">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Developer Name">
              <input type="text" className={inputCls} placeholder="Developer name" />
            </Field>
            <Field label="Developer ACN">
              <input type="text" className={inputCls} placeholder="000 000 000" />
            </Field>
          </div>
        </CollapsibleSection>

        {/* Private Certifier (PCA) */}
        <CollapsibleSection title="Private Certifier (PCA)">
          <div className="grid grid-cols-3 gap-3">
            <Field label="Certifier Company">
              <input type="text" className={inputCls} placeholder="Company name" />
            </Field>
            <Field label="Certifier Name">
              <input type="text" className={inputCls} placeholder="Contact name" />
            </Field>
            <Field label="Certifier ACN">
              <input type="text" className={inputCls} placeholder="000 000 000" />
            </Field>
          </div>
        </CollapsibleSection>

        {/* ── BUILDING DETAILS ─────────────────────────────────────── */}
        <SectionHeader label="Building Details" />

        <div>
          <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "#6b7280" }}>Building Classes</label>
          <div className="flex flex-wrap gap-2">
            {BUILDING_CLASSES.map(c => (
              <button key={c} type="button"
                onClick={() => toggleClass(c)}
                className="px-3 py-1.5 rounded-md text-xs font-semibold border transition-all"
                style={{
                  background: buildingClasses.includes(c) ? "linear-gradient(135deg,#7A6342,#A68A64)" : "#fff",
                  color: buildingClasses.includes(c) ? "#fff" : "#374151",
                  borderColor: buildingClasses.includes(c) ? "#A68A64" : "#d1d5db",
                }}>
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <Field label="No. of Units">
            <input type="number" className={inputCls} placeholder="0" min="0" />
          </Field>
          <Field label="Levels (Basement)">
            <input type="number" className={inputCls} placeholder="0" min="0" />
          </Field>
          <Field label="Levels (GL to Roof)">
            <input type="number" className={inputCls} placeholder="0" min="0" />
          </Field>
          <Field label="Effective Height (m)">
            <input type="number" className={inputCls} placeholder="0" min="0" />
          </Field>
        </div>

        {/* ── DEVELOPMENT INFORMATION ──────────────────────────────── */}
        <SectionHeader label="Development Information" />

        <div className="grid grid-cols-4 gap-3">
          <Field label="BW/ITSOC">
            <input type="text" className={inputCls} placeholder="" />
          </Field>
          <Field label="DA Number">
            <input type="text" className={inputCls} placeholder="" />
          </Field>
          <Field label="CC Number">
            <input type="text" className={inputCls} placeholder="" />
          </Field>
          <Field label="Cost of Development">
            <input type="text" className={inputCls} placeholder="$0" />
          </Field>
        </div>
        <Field label="Development Description">
          <textarea className={textareaCls} rows={2} placeholder="Describe the development..." />
        </Field>

        {/* ── DESIGN PRACTITIONERS (DBP) ───────────────────────────── */}
        <SectionHeader label="Design Practitioners (DBP)" />

        <div className="space-y-3">
          {practitioners.map((p, idx) => (
            <div key={p.id} className="rounded-lg border p-4 space-y-3" style={{ borderColor: "#e5e7eb", background: "#fafaf9" }}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold" style={{ color: "#1a1a2e" }}>Practitioner {idx + 1}</span>
                <button type="button" onClick={() => removePractitioner(p.id)}
                  className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded border transition-colors hover:bg-red-50"
                  style={{ color: "#dc2626", borderColor: "#fca5a5" }}>
                  <Trash2 size={12} /> Remove
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Name">
                  <input type="text" className={inputCls} placeholder="Practitioner name"
                    value={p.name}
                    onChange={e => setPractitioners(prev => prev.map(x => x.id === p.id ? { ...x, name: e.target.value } : x))} />
                </Field>
                <Field label="Company">
                  <input type="text" className={inputCls} placeholder="Company name"
                    value={p.company}
                    onChange={e => setPractitioners(prev => prev.map(x => x.id === p.id ? { ...x, company: e.target.value } : x))} />
                </Field>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "#6b7280" }}>Practitioner Types</label>
                <div className="flex flex-wrap gap-2">
                  {PRACTITIONER_TYPES.map(t => (
                    <button key={t} type="button"
                      onClick={() => togglePractitionerType(p.id, t)}
                      className="px-3 py-1 rounded-full text-xs font-medium border transition-all"
                      style={{
                        background: p.types.includes(t) ? "linear-gradient(135deg,#7A6342,#A68A64)" : "#fff",
                        color: p.types.includes(t) ? "#fff" : "#374151",
                        borderColor: p.types.includes(t) ? "#A68A64" : "#d1d5db",
                      }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
          <button type="button" onClick={addPractitioner}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors hover:bg-gray-50"
            style={{ borderColor: "#d1d5db", color: "#374151", borderStyle: "dashed" }}>
            <Plus size={14} style={{ color: "#A68A64" }} />
            + Add Design Practitioner
          </button>
        </div>

        {/* ── BUILDING PRACTITIONER ────────────────────────────────── */}
        <SectionHeader label="Building Practitioner" />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Building Practitioner Name">
            <input type="text" className={inputCls} placeholder="Practitioner name" />
          </Field>
          <Field label="Registration Number">
            <input type="text" className={inputCls} placeholder="Registration number" />
          </Field>
        </div>

        {/* ── SERVICE ─────────────────────────────────────────────── */}
        <SectionHeader label="Service Required" />
        <Field label="Service" required>
          <div className="relative">
            <select className={inputCls + " appearance-none pr-8"} required defaultValue="">
              <option value="" disabled>Select a service…</option>
              <option>RAB Act – Building Inspections & Audits</option>
              <option>DBP Act – Design & Building Practitioners</option>
              <option>Planning Portal Solutions</option>
              <option>Project Intervene Coordination</option>
              <option>Strata Solutions</option>
              <option>CAS Complaints</option>
              <option>Not Sure – Please Advise</option>
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-3 text-gray-400 pointer-events-none" />
          </div>
        </Field>

        {/* ── ACTIONS ─────────────────────────────────────────────── */}
        <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: "#e5e7eb" }}>
          <button type="button" onClick={onClose}
            className="px-5 py-2.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button type="submit"
            className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg,#7A6342,#A68A64)" }}>
            Submit Request
          </button>
        </div>
      </form>
    </ModalBox>
  );
}

// ─── Send a Message ───────────────────────────────────────────────────────────
function MessageForm({ onClose }: { onClose: () => void }) {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <ModalBox title="Message Sent" onClose={onClose}>
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: "linear-gradient(135deg,#7A6342,#A68A64)" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h3 className="text-lg font-bold mb-2" style={{ color: "#1a1a2e" }}>Message received</h3>
          <p className="text-sm text-gray-500 mb-6">We will get back to you within 1 business day.</p>
          <button onClick={onClose} className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg,#7A6342,#A68A64)" }}>Close</button>
        </div>
      </ModalBox>
    );
  }

  return (
    <ModalBox title="Send a Message" subtitle="We'll respond within 1 business day" onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Full Name" required>
            <input type="text" className={inputCls} placeholder="Your full name" required />
          </Field>
          <Field label="Email Address" required>
            <input type="email" className={inputCls} placeholder="you@example.com" required />
          </Field>
        </div>
        <Field label="Phone Number">
          <input type="tel" className={inputCls} placeholder="+61 4xx xxx xxx" />
        </Field>
        <Field label="Subject" required>
          <input type="text" className={inputCls} placeholder="Brief subject of your message" required />
        </Field>
        <Field label="Message" required>
          <textarea className={textareaCls} rows={5}
            placeholder="Please describe your enquiry or question in as much detail as possible…" required />
        </Field>
        <div className="flex justify-end gap-3 pt-2 border-t" style={{ borderColor: "#e5e7eb" }}>
          <button type="button" onClick={onClose}
            className="px-5 py-2.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button type="submit"
            className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg,#7A6342,#A68A64)" }}>
            Send Message
          </button>
        </div>
      </form>
    </ModalBox>
  );
}

// ─── Support ──────────────────────────────────────────────────────────────────
function SupportForm({ onClose }: { onClose: () => void }) {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <ModalBox title="Support Request Submitted" onClose={onClose}>
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: "linear-gradient(135deg,#7A6342,#A68A64)" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h3 className="text-lg font-bold mb-2" style={{ color: "#1a1a2e" }}>Support request received</h3>
          <p className="text-sm text-gray-500 mb-6">Our team will prioritise your matter and respond shortly.</p>
          <button onClick={onClose} className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg,#7A6342,#A68A64)" }}>Close</button>
        </div>
      </ModalBox>
    );
  }

  return (
    <ModalBox title="Support" subtitle="Technical or compliance assistance" onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Full Name" required>
            <input type="text" className={inputCls} placeholder="Your full name" required />
          </Field>
          <Field label="Email Address" required>
            <input type="email" className={inputCls} placeholder="you@example.com" required />
          </Field>
        </div>
        <Field label="Phone Number">
          <input type="tel" className={inputCls} placeholder="+61 4xx xxx xxx" />
        </Field>
        <Field label="Matter Type" required>
          <div className="relative">
            <select className={inputCls + " appearance-none pr-8"} required defaultValue="">
              <option value="" disabled>Select matter type…</option>
              <option>Technical Question</option>
              <option>Urgent Compliance Issue</option>
              <option>Document Request</option>
              <option>Complaint or Dispute</option>
              <option>Other</option>
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-3 text-gray-400 pointer-events-none" />
          </div>
        </Field>
        <Field label="Description" required>
          <textarea className={textareaCls} rows={5}
            placeholder="Please describe your issue or request in detail. Include any relevant reference numbers, addresses, or dates…" required />
        </Field>
        <div className="flex justify-end gap-3 pt-2 border-t" style={{ borderColor: "#e5e7eb" }}>
          <button type="button" onClick={onClose}
            className="px-5 py-2.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button type="submit"
            className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg,#7A6342,#A68A64)" }}>
            Submit Support Request
          </button>
        </div>
      </form>
    </ModalBox>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function ContactPopup({ type, onClose }: PopupProps) {
  if (!type) return null;
  return (
    <Overlay onClose={onClose}>
      {type === "quote" && <QuoteForm onClose={onClose} />}
      {type === "message" && <MessageForm onClose={onClose} />}
      {type === "support" && <SupportForm onClose={onClose} />}
    </Overlay>
  );
}

// ─── CTA Button Row used at bottom of each role page ─────────────────────────
export function RoleCTABar({ onOpen }: { onOpen: (t: PopupType) => void }) {
  return (
    <div className="flex flex-wrap gap-3 justify-center">
      <button onClick={() => onOpen("quote")}
        className="px-7 py-3 rounded-full text-sm font-semibold text-white shadow-md hover:opacity-90 transition-all"
        style={{ background: "linear-gradient(135deg,#7A6342,#A68A64)" }}>
        Request a Quote
      </button>
      <button onClick={() => onOpen("message")}
        className="px-7 py-3 rounded-full text-sm font-semibold border-2 hover:bg-gray-50 transition-all"
        style={{ borderColor: "#1a1a2e", color: "#1a1a2e" }}>
        Send a Message
      </button>
      <button onClick={() => onOpen("support")}
        className="px-7 py-3 rounded-full text-sm font-semibold border-2 hover:bg-gray-50 transition-all"
        style={{ borderColor: "#A68A64", color: "#7A6342" }}>
        Support
      </button>
    </div>
  );
}
