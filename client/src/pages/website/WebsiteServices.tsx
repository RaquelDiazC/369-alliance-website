/**
 * 369 Alliance – Services Page (All 6 Pillars)
 */

import { useState } from "react";
import { Link } from "wouter";
import { Shield, FileCheck, Globe, AlertCircle, Building2, Users, ChevronRight, ArrowRight } from "lucide-react";
import { WebsiteNav } from "@/components/website/WebsiteNav";
import { WebsiteFooter } from "@/components/website/WebsiteFooter";
import { ContactPopup, type PopupType } from "@/components/website/ContactPopups";
import { SignInPopup } from "@/components/website/SignInPopup";

const HERO_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310419663029262029/VyKdiatHMkCvCRqZzXD7NF/hero-compliance-BCrZQQPCPPiibs8a2DQjbZ.webp";

const pillars = [
  {
    icon: Shield,
    number: "01",
    title: "RAB Act Expertise",
    subtitle: "Residential Apartment Buildings Act 2020",
    href: "/website/services/rab-act",
    color: "#1a1a2e",
    overview: "The Residential Apartment Buildings (Compliance and Enforcement Powers) Act 2020 (RAB Act) gives the NSW Building Commissioner broad powers to inspect, audit, and issue Work Direction Notices for serious and potential serious defects in residential apartment buildings. 369 Alliance provides comprehensive RAB Act compliance services.",
    keyServices: [
      "Pre-OC compliance audits covering waterproofing, fire safety, structure, cladding, and building services",
      "Post-OC defect identification and rectification coordination",
      "Work Direction Notice (WDN) management and response",
      "Stop-work order management and compliance pathways",
      "Independent superintendent services for Project Intervene matters",
      "Serious defect risk assessment and mitigation strategy",
    ],
    who: ["Developers", "Builders", "Private Certifiers", "Building Practitioners"],
  },
  {
    icon: FileCheck,
    number: "02",
    title: "DBP Act Expertise",
    subtitle: "Design and Building Practitioners Act 2020",
    href: "/website/services/dbp-act",
    color: "#1e2a3a",
    overview: "The Design and Building Practitioners Act 2020 (DBP Act) mandates that registered practitioners declare that their designs and buildings comply with the Building Code of Australia. 369 Alliance provides specialist consultancy to help practitioners meet their obligations and manage liability.",
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
    icon: Globe,
    number: "03",
    title: "Planning Portal Solutions",
    subtitle: "NSW Planning Portal Management",
    href: "/website/services/planning-portal",
    color: "#1a2e2a",
    overview: "The NSW Planning Portal is the mandatory platform for all development applications, construction certificates, and occupation certificates. Errors in portal submissions cause costly delays. 369 Alliance provides end-to-end portal management to keep your project on track.",
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
    icon: AlertCircle,
    number: "04",
    title: "Project Intervene",
    subtitle: "Independent Superintendent Services",
    href: "/website/services/project-intervene",
    color: "#2a1a1a",
    overview: "Project Intervene is the NSW Building Commissioner's program for escalated compliance matters in residential apartment buildings. 369 Alliance serves as independent superintendents, coordinating defect investigation, rectification strategy, and stakeholder management.",
    keyServices: [
      "Independent superintendent appointment and management",
      "Defect investigation and evidence gathering",
      "Rectification strategy development and coordination",
      "Stakeholder management (developers, builders, owners)",
      "Progress monitoring and compliance reporting",
      "Liaison with the NSW Building Commission",
    ],
    who: ["Developers", "Builders", "Owners Corporations", "Strata Managers"],
  },
  {
    icon: Building2,
    number: "05",
    title: "Strata Solutions",
    subtitle: "Strata Compliance & Remedial Works",
    href: "/website/services/strata",
    color: "#1a1e2e",
    overview: "NSW has over 85,000 strata schemes, and compliance obligations for strata buildings are growing. From mandatory SBBIS assessments to remedial works coordination and CAS complaint management, 369 Alliance is the preferred compliance partner for strata portfolios.",
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
    icon: Users,
    number: "06",
    title: "CAS Complaints",
    subtitle: "Complaint Investigation & Resolution",
    href: "/website/services/cas",
    color: "#1e1a2e",
    overview: "The NSW Building Commission investigates complaints about building work and building practitioners through the Complaints and Assessment Service (CAS). 369 Alliance provides expert investigation, evidence gathering, and report preparation for CAS matters.",
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
    <div className="min-h-screen" style={{ background: "#f8f7f5" }}>
      <WebsiteNav onOpenPopup={setPopup} onOpenSignIn={() => setSignIn(true)} />

      {/* Hero */}
      <section className="relative pt-16 overflow-hidden" style={{ minHeight: "380px" }}>
        <div className="absolute inset-0">
          <img src={HERO_IMG} alt="Services" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(26,26,46,0.95) 0%, rgba(26,26,46,0.8) 60%, rgba(26,26,46,0.65) 100%)" }} />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
          <div className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-5"
            style={{ background: "rgba(166,138,100,0.2)", border: "1px solid rgba(166,138,100,0.4)", color: "#A68A64" }}>
            Our Services
          </div>
          <h1 className="text-5xl font-bold text-white mb-5" style={{ fontFamily: "'Playfair Display', serif" }}>
            Six Pillars of Compliance Excellence
          </h1>
          <p className="text-lg max-w-2xl" style={{ color: "rgba(255,255,255,0.7)" }}>
            369 Alliance is the only NSW consultancy offering all six compliance pillars under one roof — eliminating the need to manage multiple consultants across your project lifecycle.
          </p>
        </div>
      </section>

      {/* Pillars */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 space-y-8">
          {pillars.map((p, i) => {
            const Icon = p.icon;
            const isOpen = active === i;
            return (
              <div key={p.number}
                className="bg-white rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-lg"
                style={{ borderColor: isOpen ? "#A68A64" : "#e5e7eb" }}>
                {/* Header row */}
                <button
                  className="w-full flex items-center gap-6 p-7 text-left"
                  onClick={() => setActive(isOpen ? null : i)}>
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "linear-gradient(135deg,#1a1a2e,#252545)" }}>
                    <Icon size={24} style={{ color: "#A68A64" }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xs font-bold" style={{ color: "#A68A64", fontFamily: "'IBM Plex Mono', monospace" }}>
                        PILLAR {p.number}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold" style={{ color: "#1a1a2e", fontFamily: "'Playfair Display', serif" }}>{p.title}</h2>
                    <p className="text-sm" style={{ color: "#6b7280" }}>{p.subtitle}</p>
                  </div>
                  <ChevronRight size={20} className="flex-shrink-0 transition-transform"
                    style={{ color: "#A68A64", transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }} />
                </button>

                {/* Expanded content */}
                {isOpen && (
                  <div className="px-7 pb-7 border-t" style={{ borderColor: "#f0ede8" }}>
                    <div className="pt-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                      <div className="lg:col-span-2">
                        <p className="text-sm leading-relaxed mb-6" style={{ color: "#374151" }}>{p.overview}</p>
                        <h4 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: "#7A6342" }}>Key Services</h4>
                        <ul className="space-y-2.5">
                          {p.keyServices.map((s, j) => (
                            <li key={j} className="flex items-start gap-3">
                              <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ background: "#A68A64" }} />
                              <span className="text-sm" style={{ color: "#374151" }}>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: "#7A6342" }}>Who This Serves</h4>
                        <div className="flex flex-wrap gap-2 mb-6">
                          {p.who.map(w => (
                            <span key={w} className="px-3 py-1.5 rounded-full text-xs font-medium"
                              style={{ background: "rgba(26,26,46,0.07)", color: "#1a1a2e" }}>
                              {w}
                            </span>
                          ))}
                        </div>
                        <div className="flex flex-col gap-3">
                          <button onClick={() => setPopup("quote")}
                            className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white"
                            style={{ background: "linear-gradient(135deg,#7A6342,#A68A64)" }}>
                            Request a Quote <ArrowRight size={14} />
                          </button>
                          <Link href={p.href}>
                            <div className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium border cursor-pointer hover:bg-gray-50 transition-colors"
                              style={{ borderColor: "#e5e7eb", color: "#374151" }}>
                              Learn More <ChevronRight size={14} />
                            </div>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20" style={{ background: "#1a1a2e" }}>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-5" style={{ fontFamily: "'Playfair Display', serif" }}>
            Not Sure Which Service You Need?
          </h2>
          <p className="text-lg mb-8" style={{ color: "rgba(255,255,255,0.6)" }}>
            Our team will assess your situation and recommend the right compliance pathway for your project.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button onClick={() => setPopup("quote")}
              className="px-8 py-4 rounded-full text-base font-semibold text-white hover:opacity-90 transition-all"
              style={{ background: "linear-gradient(135deg,#7A6342,#A68A64)" }}>
              Request a Quote
            </button>
            <button onClick={() => setPopup("message")}
              className="px-8 py-4 rounded-full text-base font-semibold border-2 hover:bg-white/10 transition-all"
              style={{ borderColor: "rgba(255,255,255,0.4)", color: "#fff" }}>
              Send a Message
            </button>
          </div>
        </div>
      </section>

      <WebsiteFooter onOpenPopup={setPopup} />
      <ContactPopup type={popup} onClose={() => setPopup(null)} />
      <SignInPopup open={signIn} onClose={() => setSignIn(false)} />
    </div>
  );
}
