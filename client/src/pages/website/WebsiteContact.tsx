/**
 * 369 Alliance – Contact Page
 * Editorial layout — form + info panel
 */

import { useState, useEffect, useRef } from "react";
import { MapPin, Mail, Clock, Plus, Trash2, ChevronDown } from "lucide-react";
import { WebsiteNav } from "@/components/website/WebsiteNav";
import { WebsiteFooter } from "@/components/website/WebsiteFooter";
import {
  ContactPopup,
  type PopupType,
  Field,
  SectionHeader,
  CollapsibleSection,
  inputCls,
  textareaCls,
  BUILDING_CLASSES,
  PRACTITIONER_TYPES,
} from "@/components/website/ContactPopups";
import { SignInPopup } from "@/components/website/SignInPopup";

const HERO_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310419663029262029/VyKdiatHMkCvCRqZzXD7NF/hero-strata-9GMjb3kgydVmf8Q3WY4E6C.webp";

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add("visible"); obs.unobserve(el); } },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

function Reveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useReveal();
  return <div ref={ref} className={`reveal ${className}`}>{children}</div>;
}

interface DesignPractitioner {
  id: number;
  name: string;
  company: string;
  types: string[];
}

export default function WebsiteContact() {
  const [popup, setPopup] = useState<PopupType>(null);
  const [signIn, setSignIn] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [isCompany, setIsCompany] = useState(false);
  const [situations, setSituations] = useState<string[]>([]);
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
      p.id === id ? { ...p, types: p.types.includes(type) ? p.types.filter(t => t !== type) : [...p.types, type] } : p
    ));

  return (
    <div className="min-h-screen" style={{ background: "#f8f7f4" }}>
      <WebsiteNav onOpenPopup={setPopup} onOpenSignIn={() => setSignIn(true)} />

      {/* Hero */}
      <section className="relative pt-16 overflow-hidden" style={{ minHeight: "340px" }}>
        <div className="absolute inset-0">
          <img src={HERO_IMG} alt="" className="w-full h-full object-cover" style={{ filter: "brightness(0.35)" }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(160deg, rgba(15,15,30,0.9) 0%, rgba(15,15,30,0.7) 100%)" }} />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 py-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px w-10" style={{ background: "#A68A64" }} />
            <span className="text-[11px] font-semibold tracking-[0.2em] uppercase" style={{ color: "#A68A64" }}>Contact Us</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-5" style={{ fontFamily: "'Playfair Display', serif" }}>
            Get in Touch
          </h1>
          <p className="text-[15px] max-w-md" style={{ color: "rgba(255,255,255,0.55)" }}>
            Our team responds within 1 business day. For urgent matters, please indicate this in your message.
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16"
          style={{ background: "linear-gradient(to top, #f8f7f4, transparent)" }} />
      </section>

      {/* Main content */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

            {/* Info sidebar */}
            <div className="space-y-5">
              <Reveal>
                <div className="bg-white border p-6" style={{ borderColor: "#eae8e3", borderRadius: "6px" }}>
                  <h3 className="text-sm font-bold mb-5" style={{ color: "#1a1a2e", fontFamily: "'Playfair Display', serif" }}>Quick Actions</h3>
                  <div className="space-y-2.5">
                    <button onClick={() => setPopup("message")}
                      className="w-full py-2.5 text-[13px] font-medium border transition-colors hover:bg-gray-50"
                      style={{ borderColor: "#eae8e3", color: "#374151", borderRadius: "4px" }}>
                      Send a Message
                    </button>
                    <button onClick={() => setPopup("support")}
                      className="w-full py-2.5 text-[13px] font-medium border transition-colors hover:bg-gray-50"
                      style={{ borderColor: "#eae8e3", color: "#374151", borderRadius: "4px" }}>
                      Support
                    </button>
                  </div>
                </div>
              </Reveal>

              <Reveal>
                <div className="bg-white border p-6" style={{ borderColor: "#eae8e3", borderRadius: "6px" }}>
                  <h3 className="text-sm font-bold mb-5" style={{ color: "#1a1a2e", fontFamily: "'Playfair Display', serif" }}>Contact Information</h3>
                  <div className="space-y-4">
                    {[
                      { Icon: MapPin, label: "Location", value: "Sydney, NSW, Australia" },
                      { Icon: Mail, label: "Email", value: "info@369alliance.com.au", href: "mailto:info@369alliance.com.au" },
                      { Icon: Clock, label: "Response Time", value: "Within 1 business day" },
                    ].map(c => (
                      <div key={c.label} className="flex items-start gap-3">
                        <c.Icon size={15} className="flex-shrink-0 mt-0.5" style={{ color: "#A68A64" }} />
                        <div>
                          <p className="text-[10px] font-semibold tracking-[0.12em] uppercase mb-0.5" style={{ color: "#9ca3af" }}>{c.label}</p>
                          {c.href ? (
                            <a href={c.href} className="text-[13px] hover:text-amber-700 transition-colors" style={{ color: "#374151" }}>{c.value}</a>
                          ) : (
                            <p className="text-[13px]" style={{ color: "#374151" }}>{c.value}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>

              <Reveal>
                <div className="p-6" style={{ background: "#1a1a2e", borderRadius: "6px" }}>
                  <h3 className="text-sm font-bold text-white mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>Existing Client?</h3>
                  <p className="text-[12px] mb-4" style={{ color: "rgba(255,255,255,0.45)" }}>
                    Access your project dashboard, reports, and documents.
                  </p>
                  <a href="https://alliance369-vykdiath.manus.space/" target="_blank" rel="noopener noreferrer"
                    className="block w-full py-2.5 text-[13px] font-semibold text-center text-white transition-opacity hover:opacity-90"
                    style={{ background: "linear-gradient(135deg,#7A6342,#A68A64)", borderRadius: "4px" }}>
                    Client Portal &rarr;
                  </a>
                </div>
              </Reveal>
            </div>

            {/* Main form */}
            <div className="lg:col-span-2">
              <Reveal>
                <div className="bg-white border overflow-hidden" style={{ borderColor: "#eae8e3", borderRadius: "6px" }}>
                  <div className="px-8 py-5" style={{ background: "#1a1a2e" }}>
                    <h2 className="text-lg font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                      Request a Quote
                    </h2>
                    <p className="text-[12px] mt-0.5" style={{ color: "#A68A64" }}>
                      369 Alliance Pty Ltd — Building Compliance Specialists
                    </p>
                  </div>

                  {submitted ? (
                    <div className="p-10 text-center">
                      <div className="w-14 h-14 flex items-center justify-center mx-auto mb-4"
                        style={{ background: "linear-gradient(135deg,#7A6342,#A68A64)", borderRadius: "50%" }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-bold mb-2" style={{ color: "#1a1a2e" }}>Thank you for your enquiry</h3>
                      <p className="text-[13px]" style={{ color: "#6b7280" }}>Our team will review and contact you within 1-2 business days.</p>
                    </div>
                  ) : (
                    <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} className="p-8 space-y-4">

                      <SectionHeader label="Contact Information" />

                      <div className="flex items-center gap-3 p-3 border" style={{ borderColor: "#eae8e3", background: "#fafaf8", borderRadius: "4px" }}>
                        <button type="button"
                          onClick={() => setIsCompany(!isCompany)}
                          className="relative w-10 h-5 rounded-full transition-colors flex-shrink-0"
                          style={{ background: isCompany ? "#A68A64" : "#d1d5db" }}>
                          <span className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
                            style={{ left: isCompany ? "calc(100% - 18px)" : "2px" }} />
                        </button>
                        <span className="text-[13px] font-medium" style={{ color: "#4b5563" }}>This enquiry is on behalf of a company</span>
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

                      <SectionHeader label="Building / Site Situation" />
                      <div className="flex flex-wrap gap-2">
                        {["Under Construction", "Occupied Building", "Other"].map(s => (
                          <button key={s} type="button"
                            onClick={() => toggleSituation(s)}
                            className="px-4 py-2 text-[13px] font-medium border transition-all"
                            style={{
                              background: situations.includes(s) ? "linear-gradient(135deg,#7A6342,#A68A64)" : "#fff",
                              color: situations.includes(s) ? "#fff" : "#374151",
                              borderColor: situations.includes(s) ? "#A68A64" : "#d1d5db",
                              borderRadius: "3px",
                            }}>
                            {s}
                          </button>
                        ))}
                      </div>
                      <Field label="Describe the Situation">
                        <textarea className={textareaCls} rows={2}
                          placeholder="Current state of the building or site, any known issues..." />
                      </Field>

                      <SectionHeader label="Project Parties (expand to provide details)" />
                      <CollapsibleSection title="Builder">
                        <div className="grid grid-cols-2 gap-3">
                          <Field label="Builder Name"><input type="text" className={inputCls} placeholder="Builder name" /></Field>
                          <Field label="Builder ACN"><input type="text" className={inputCls} placeholder="000 000 000" /></Field>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <Field label="Builder Registration"><input type="text" className={inputCls} placeholder="Registration number" /></Field>
                          <Field label="Expire Date"><input type="text" className={inputCls} placeholder="DD/MM/YYYY" /></Field>
                        </div>
                      </CollapsibleSection>
                      <CollapsibleSection title="Developer">
                        <div className="grid grid-cols-2 gap-3">
                          <Field label="Developer Name"><input type="text" className={inputCls} placeholder="Developer name" /></Field>
                          <Field label="Developer ACN"><input type="text" className={inputCls} placeholder="000 000 000" /></Field>
                        </div>
                      </CollapsibleSection>
                      <CollapsibleSection title="Private Certifier (PCA)">
                        <div className="grid grid-cols-3 gap-3">
                          <Field label="Certifier Company"><input type="text" className={inputCls} placeholder="Company name" /></Field>
                          <Field label="Certifier Name"><input type="text" className={inputCls} placeholder="Contact name" /></Field>
                          <Field label="Certifier ACN"><input type="text" className={inputCls} placeholder="000 000 000" /></Field>
                        </div>
                      </CollapsibleSection>

                      <SectionHeader label="Building Details" />
                      <div>
                        <label className="text-[10px] font-semibold tracking-[0.1em] uppercase mb-2 block" style={{ color: "#6b7280" }}>Building Classes</label>
                        <div className="flex flex-wrap gap-2">
                          {BUILDING_CLASSES.map(c => (
                            <button key={c} type="button"
                              onClick={() => toggleClass(c)}
                              className="px-3 py-1.5 text-[11px] font-semibold border transition-all"
                              style={{
                                background: buildingClasses.includes(c) ? "linear-gradient(135deg,#7A6342,#A68A64)" : "#fff",
                                color: buildingClasses.includes(c) ? "#fff" : "#374151",
                                borderColor: buildingClasses.includes(c) ? "#A68A64" : "#d1d5db",
                                borderRadius: "3px",
                              }}>
                              {c}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-3">
                        <Field label="No. of Units"><input type="number" className={inputCls} placeholder="0" min="0" /></Field>
                        <Field label="Levels (Basement)"><input type="number" className={inputCls} placeholder="0" min="0" /></Field>
                        <Field label="Levels (GL to Roof)"><input type="number" className={inputCls} placeholder="0" min="0" /></Field>
                        <Field label="Effective Height (m)"><input type="number" className={inputCls} placeholder="0" min="0" /></Field>
                      </div>

                      <SectionHeader label="Development Information" />
                      <div className="grid grid-cols-4 gap-3">
                        <Field label="BW/ITSOC"><input type="text" className={inputCls} /></Field>
                        <Field label="DA Number"><input type="text" className={inputCls} /></Field>
                        <Field label="CC Number"><input type="text" className={inputCls} /></Field>
                        <Field label="Cost of Development"><input type="text" className={inputCls} placeholder="$0" /></Field>
                      </div>
                      <Field label="Development Description">
                        <textarea className={textareaCls} rows={2} placeholder="Describe the development..." />
                      </Field>

                      <SectionHeader label="Design Practitioners (DBP)" />
                      <div className="space-y-3">
                        {practitioners.map((p, idx) => (
                          <div key={p.id} className="border p-4 space-y-3" style={{ borderColor: "#eae8e3", background: "#fafaf8", borderRadius: "4px" }}>
                            <div className="flex items-center justify-between">
                              <span className="text-[13px] font-semibold" style={{ color: "#1a1a2e" }}>Practitioner {idx + 1}</span>
                              <button type="button" onClick={() => removePractitioner(p.id)}
                                className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 border transition-colors hover:bg-red-50"
                                style={{ color: "#dc2626", borderColor: "#fca5a5", borderRadius: "3px" }}>
                                <Trash2 size={11} /> Remove
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
                              <label className="text-[10px] font-semibold tracking-[0.1em] uppercase mb-2 block" style={{ color: "#6b7280" }}>Practitioner Types</label>
                              <div className="flex flex-wrap gap-2">
                                {PRACTITIONER_TYPES.map(t => (
                                  <button key={t} type="button"
                                    onClick={() => togglePractitionerType(p.id, t)}
                                    className="px-3 py-1 text-[11px] font-medium border transition-all"
                                    style={{
                                      background: p.types.includes(t) ? "linear-gradient(135deg,#7A6342,#A68A64)" : "#fff",
                                      color: p.types.includes(t) ? "#fff" : "#374151",
                                      borderColor: p.types.includes(t) ? "#A68A64" : "#d1d5db",
                                      borderRadius: "3px",
                                    }}>
                                    {t}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                        <button type="button" onClick={addPractitioner}
                          className="flex items-center gap-2 px-4 py-2 text-[13px] font-medium border transition-colors hover:bg-gray-50"
                          style={{ borderColor: "#d1d5db", color: "#374151", borderStyle: "dashed", borderRadius: "4px" }}>
                          <Plus size={13} style={{ color: "#A68A64" }} /> Add Design Practitioner
                        </button>
                      </div>

                      <SectionHeader label="Building Practitioner" />
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Building Practitioner Name"><input type="text" className={inputCls} placeholder="Practitioner name" /></Field>
                        <Field label="Registration Number"><input type="text" className={inputCls} placeholder="Registration number" /></Field>
                      </div>

                      <SectionHeader label="Service Required" />
                      <Field label="Service" required>
                        <div className="relative">
                          <select className={inputCls + " appearance-none pr-8"} required defaultValue="">
                            <option value="" disabled>Select a service...</option>
                            <option>RAB Act &ndash; Building Inspections &amp; Audits</option>
                            <option>DBP Act &ndash; Design &amp; Building Practitioners</option>
                            <option>Planning Portal Solutions</option>
                            <option>Project Intervene Coordination</option>
                            <option>Strata Solutions</option>
                            <option>CAS Complaints</option>
                            <option>Not Sure &ndash; Please Advise</option>
                          </select>
                          <ChevronDown size={14} className="absolute right-2.5 top-3 pointer-events-none" style={{ color: "#9ca3af" }} />
                        </div>
                      </Field>

                      <div className="flex justify-end pt-5" style={{ borderTop: "1px solid #eae8e3" }}>
                        <button type="submit"
                          className="px-8 py-3 text-[13px] font-semibold text-white transition-all duration-200 hover:shadow-lg hover:shadow-amber-900/20"
                          style={{ background: "linear-gradient(135deg,#7A6342,#A68A64)", borderRadius: "4px" }}>
                          Submit Request
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      <WebsiteFooter onOpenPopup={setPopup} />
      <ContactPopup type={popup} onClose={() => setPopup(null)} />
      <SignInPopup open={signIn} onClose={() => setSignIn(false)} />
    </div>
  );
}
