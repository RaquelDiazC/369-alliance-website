/**
 * 369 Alliance – Services Page
 * Editorial accordion layout with pillar details
 */

import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { Shield, FileCheck, Globe, AlertCircle, Building2, Users, ArrowRight, ChevronDown } from "lucide-react";
import { WebsiteNav } from "@/components/website/WebsiteNav";
import { WebsiteFooter } from "@/components/website/WebsiteFooter";
import { ContactPopup, type PopupType } from "@/components/website/ContactPopups";
import { SignInPopup } from "@/components/website/SignInPopup";

const HERO_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310419663029262029/VyKdiatHMkCvCRqZzXD7NF/hero-compliance-BCrZQQPCPPiibs8a2DQjbZ.webp";

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add("visible"); obs.unobserve(el); } },
      { threshold: 0.12 }
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

const pillars = [
  {
    icon: Shield, number: "01", title: "RAB Act Expertise", subtitle: "Residential Apartment Buildings Act 2020",
    href: "/website/services/rab-act",
    overview: "The RAB Act gives the NSW Building Commissioner broad powers to inspect, audit, and issue Work Direction Notices for serious defects in residential apartment buildings. 369 Alliance provides comprehensive RAB Act compliance services.",
    keyServices: [
      "Pre-OC compliance audits — waterproofing, fire safety, structure, cladding, building services",
      "Post-OC defect identification and rectification coordination",
      "Work Direction Notice (WDN) management and response",
      "Stop-work order management and compliance pathways",
      "Independent superintendent services for Project Intervene matters",
      "Serious defect risk assessment and mitigation strategy",
    ],
    who: ["Developers", "Builders", "Private Certifiers", "Building Practitioners"],
  },
  {
    icon: FileCheck, number: "02", title: "DBP Act Expertise", subtitle: "Design and Building Practitioners Act 2020",
    href: "/website/services/dbp-act",
    overview: "The DBP Act mandates that registered practitioners declare compliance with the Building Code of Australia. 369 Alliance provides specialist consultancy to help practitioners meet obligations and manage liability.",
    keyServices: [
      "Design declaration audits and compliance verification",
      "Compliance pathway development for complex projects",
      "Practitioner registration support and guidance",
      "Technical peer review of designs and declarations",
      "Liability risk assessment for design practitioners",
      "Ongoing compliance advisory for DBP Act obligations",
    ],
    who: ["Design Practitioners", "Building Practitioners", "Developers", "Builders"],
  },
  {
    icon: Globe, number: "03", title: "Planning Portal Solutions", subtitle: "NSW Planning Portal Management",
    href: "/website/services/planning-portal",
    overview: "The NSW Planning Portal is the mandatory platform for all development applications, construction certificates, and occupation certificates. Errors cause costly delays. We provide end-to-end portal management.",
    keyServices: [
      "Development Application (DA) preparation and lodgement",
      "Construction Certificate (CC) submission management",
      "Occupation Certificate (OC) application support",
      "Portal troubleshooting and error resolution",
      "Document preparation and compliance checking",
      "Liaison with councils and the NSW Planning Portal team",
    ],
    who: ["Developers", "Builders", "Private Certifiers", "Building Practitioners"],
  },
  {
    icon: AlertCircle, number: "04", title: "Project Intervene", subtitle: "Independent Superintendent Services",
    href: "/website/services/project-intervene",
    overview: "Project Intervene is the Building Commissioner's program for escalated compliance matters. 369 Alliance serves as independent superintendents — coordinating investigation, rectification, and stakeholder management.",
    keyServices: [
      "Independent superintendent appointment and management",
      "Defect investigation and evidence gathering",
      "Rectification strategy development and coordination",
      "Stakeholder management across all parties",
      "Progress monitoring and compliance reporting",
      "Liaison with the NSW Building Commission",
    ],
    who: ["Developers", "Builders", "Owners Corporations", "Strata Managers"],
  },
  {
    icon: Building2, number: "05", title: "Strata Solutions", subtitle: "Strata Compliance & Remedial Works",
    href: "/website/services/strata",
    overview: "NSW has over 85,000 strata schemes with growing compliance obligations. From SBBIS assessments to remedial works — 369 Alliance is the preferred compliance partner for strata portfolios.",
    keyServices: [
      "Strata Building Bond and Inspections Scheme (SBBIS) assessments",
      "Defect identification and investigation in strata buildings",
      "Remedial works specification and tender evaluation",
      "Works supervision and quality assurance",
      "CAS complaint investigation and resolution",
      "Ongoing compliance advisory for owners corporations",
    ],
    who: ["Strata Managers", "Building Managers", "Owners Corporations", "Property Owners"],
  },
  {
    icon: Users, number: "06", title: "CAS Complaints", subtitle: "Complaint Investigation & Resolution",
    href: "/website/services/cas",
    overview: "The Building Commission investigates complaints about building work through the Complaints and Assessment Service (CAS). We provide expert investigation, evidence gathering, and report preparation.",
    keyServices: [
      "Building defect investigation and evidence gathering",
      "Compliance assessment against BCA and Australian Standards",
      "Expert report preparation for the Building Commission",
      "Complaint response strategy for builders and developers",
      "Mediation support and dispute resolution assistance",
      "Ongoing monitoring and compliance verification",
    ],
    who: ["Property Owners", "Strata Managers", "Builders", "Developers"],
  },
];

export default function WebsiteServices() {
  const [popup, setPopup] = useState<PopupType>(null);
  const [signIn, setSignIn] = useState(false);
  const [active, setActive] = useState<number | null>(null);

  return (
    <div className="min-h-screen" style={{ background: "#f8f7f4" }}>
      <WebsiteNav onOpenPopup={setPopup} onOpenSignIn={() => setSignIn(true)} />

      {/* Hero */}
      <section className="relative pt-16 overflow-hidden" style={{ minHeight: "400px" }}>
        <div className="absolute inset-0">
          <img src={HERO_IMG} alt="" className="w-full h-full object-cover" style={{ filter: "brightness(0.35)" }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(160deg, rgba(15,15,30,0.9) 0%, rgba(15,15,30,0.7) 100%)" }} />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 py-24">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px w-10" style={{ background: "#A68A64" }} />
            <span className="text-[11px] font-semibold tracking-[0.2em] uppercase" style={{ color: "#A68A64" }}>Our Services</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-5 leading-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}>
            Six Pillars of<br />Compliance Excellence
          </h1>
          <p className="text-[15px] max-w-lg" style={{ color: "rgba(255,255,255,0.55)" }}>
            The only NSW consultancy offering all six compliance pillars under one roof.
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20"
          style={{ background: "linear-gradient(to top, #f8f7f4, transparent)" }} />
      </section>

      {/* Pillar accordion */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6 lg:px-10 space-y-4">
          {pillars.map((p, i) => {
            const Icon = p.icon;
            const isOpen = active === i;
            return (
              <Reveal key={p.number}>
                <div className="bg-white border overflow-hidden transition-all duration-300"
                  style={{ borderColor: isOpen ? "rgba(166,138,100,0.4)" : "#eae8e3", borderRadius: "6px" }}>
                  <button
                    className="w-full flex items-center gap-5 p-6 text-left group"
                    onClick={() => setActive(isOpen ? null : i)}>
                    <div className="w-12 h-12 flex items-center justify-center flex-shrink-0"
                      style={{ background: "#1a1a2e", borderRadius: "8px" }}>
                      <Icon size={20} style={{ color: "#A68A64" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-0.5">
                        <span className="text-[10px] font-bold tracking-wider" style={{ color: "#A68A64", fontFamily: "'IBM Plex Mono', monospace" }}>
                          PILLAR {p.number}
                        </span>
                      </div>
                      <h2 className="text-lg font-bold truncate" style={{ color: "#1a1a2e", fontFamily: "'Playfair Display', serif" }}>
                        {p.title}
                      </h2>
                    </div>
                    <ChevronDown size={18} className="flex-shrink-0 transition-transform duration-300"
                      style={{ color: "#A68A64", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
                  </button>

                  <div className="overflow-hidden transition-all duration-500"
                    style={{ maxHeight: isOpen ? "600px" : "0", opacity: isOpen ? 1 : 0 }}>
                    <div className="px-6 pb-7 pt-2" style={{ borderTop: "1px solid #f0ede8" }}>
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-5">
                        <div className="lg:col-span-2">
                          <p className="text-[14px] leading-relaxed mb-6" style={{ color: "#374151" }}>{p.overview}</p>
                          <h4 className="text-[10px] font-bold tracking-[0.14em] uppercase mb-4" style={{ color: "#7A6342" }}>Key Services</h4>
                          <ul className="space-y-2.5">
                            {p.keyServices.map((s, j) => (
                              <li key={j} className="flex items-start gap-3">
                                <div className="w-1 h-1 rounded-full mt-2 flex-shrink-0" style={{ background: "#A68A64" }} />
                                <span className="text-[13px] leading-relaxed" style={{ color: "#4b5563" }}>{s}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="text-[10px] font-bold tracking-[0.14em] uppercase mb-4" style={{ color: "#7A6342" }}>Who This Serves</h4>
                          <div className="flex flex-wrap gap-2 mb-6">
                            {p.who.map(w => (
                              <span key={w} className="px-3 py-1.5 text-[11px] font-medium"
                                style={{ background: "rgba(26,26,46,0.05)", color: "#1a1a2e", borderRadius: "3px" }}>
                                {w}
                              </span>
                            ))}
                          </div>
                          <button onClick={() => setPopup("quote")}
                            className="group w-full flex items-center justify-center gap-2 py-2.5 text-[13px] font-semibold text-white transition-all duration-200"
                            style={{ background: "linear-gradient(135deg,#7A6342,#A68A64)", borderRadius: "4px" }}>
                            Request a Quote <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 relative overflow-hidden noise-overlay" style={{ background: "#1a1a2e" }}>
        <div className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "radial-gradient(ellipse at 30% 50%, #A68A64, transparent 55%)" }} />
        <div className="relative z-10 max-w-2xl mx-auto px-6 text-center">
          <Reveal>
            <div className="h-px w-16 mx-auto mb-8" style={{ background: "#A68A64" }} />
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-5" style={{ fontFamily: "'Playfair Display', serif" }}>
              Not Sure Which Service You Need?
            </h2>
            <p className="text-[15px] mb-10" style={{ color: "rgba(255,255,255,0.45)" }}>
              Our team will assess your situation and recommend the right compliance pathway.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button onClick={() => setPopup("quote")}
                className="group flex items-center gap-2 px-7 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:shadow-lg hover:shadow-amber-900/25"
                style={{ background: "linear-gradient(135deg,#7A6342,#A68A64)", borderRadius: "4px" }}>
                Request a Quote <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button onClick={() => setPopup("message")}
                className="px-7 py-3.5 text-sm font-medium border transition-all duration-300 hover:border-white/30"
                style={{ borderColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.6)", borderRadius: "4px" }}>
                Send a Message
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      <WebsiteFooter onOpenPopup={setPopup} />
      <ContactPopup type={popup} onClose={() => setPopup(null)} />
      <SignInPopup open={signIn} onClose={() => setSignIn(false)} />
    </div>
  );
}
