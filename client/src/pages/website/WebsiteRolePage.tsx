/**
 * 369 Alliance – Role-Specific Page
 * Renders tailored content for each of the 8 audience types.
 * Route: /website/for/:role
 */

import { useState } from "react";
import { useParams, Link } from "wouter";
import { ArrowLeft, CheckCircle2, ChevronRight } from "lucide-react";
import { WebsiteNav } from "@/components/website/WebsiteNav";
import { WebsiteFooter } from "@/components/website/WebsiteFooter";
import { ContactPopup, RoleCTABar, type PopupType } from "@/components/website/ContactPopups";
import { SignInPopup } from "@/components/website/SignInPopup";

const HERO_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310419663029262029/VyKdiatHMkCvCRqZzXD7NF/hero-compliance-BCrZQQPCPPiibs8a2DQjbZ.webp";
const STRATA_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310419663029262029/VyKdiatHMkCvCRqZzXD7NF/hero-strata-9GMjb3kgydVmf8Q3WY4E6C.webp";

type RoleData = {
  title: string;
  icon: string;
  heroTagline: string;
  heroDesc: string;
  challenges: string[];
  services: { name: string; desc: string }[];
  howWeHelp: string[];
  image: string;
};

const roleData: Record<string, RoleData> = {
  developer: {
    title: "Developers",
    icon: "🏗️",
    heroTagline: "Navigate Compliance from DA to OC — and Beyond",
    heroDesc: "Development projects in NSW face an increasingly complex regulatory landscape. The RAB Act and DBP Act have fundamentally transformed compliance obligations, creating new risks and new requirements at every stage of your project. 369 Alliance is the partner developers need to navigate this landscape with confidence.",
    challenges: [
      "Serious defect liability under the RAB Act 2020",
      "Mandatory DBP Act declarations and compliance pathway requirements",
      "NSW Planning Portal submissions — errors cause costly delays",
      "Project Intervene escalation and independent superintendent requirements",
      "Work Direction Notices and rectification obligations",
      "Managing multiple compliance consultants across a single project",
    ],
    services: [
      { name: "RAB Act Audits", desc: "Pre-OC and post-OC compliance audits covering waterproofing, fire safety, structure, cladding, and building services. We identify serious defects before they become your liability." },
      { name: "DBP Act Compliance", desc: "Design declaration audits, compliance pathway development, and practitioner registration support — ensuring your project meets all DBP Act obligations." },
      { name: "Planning Portal Solutions", desc: "End-to-end portal submission management, document preparation, and troubleshooting. We reduce errors and accelerate approvals." },
      { name: "Project Intervene Coordination", desc: "If your project is escalated to the Building Commissioner's Project Intervene program, we serve as your independent superintendent — managing defect investigation, rectification strategy, and stakeholder coordination." },
    ],
    howWeHelp: [
      "Pre-construction design reviews to identify compliance risks before work begins",
      "Stage inspections at critical construction milestones",
      "OC audit preparation and submission support",
      "Work Direction Notice management and rectification coordination",
      "Single point of contact across all six compliance pillars",
    ],
    image: HERO_IMG,
  },
  builder: {
    title: "Builders",
    icon: "🔨",
    heroTagline: "Protect Your Licence, Your Project, and Your Reputation",
    heroDesc: "Builders operating in NSW face unprecedented compliance obligations under the RAB Act and DBP Act. Work Direction Notices, stop-work orders, and CAS complaints can halt your project and threaten your licence. 369 Alliance works alongside builders as a trusted compliance partner — keeping your project moving and your obligations met.",
    challenges: [
      "Stop-work orders and rectification obligations",
      "DBP Act compliance declarations and practitioner registration",
      "CAS complaint investigations in occupied buildings",
      "Managing defect rectification across multiple subcontractors",
      "Demonstrating compliance with BCA and Australian Standards",
    ],
    services: [
      { name: "RAB Act Inspections", desc: "Construction stage inspections at critical milestones, identifying non-compliances before they escalate to WDNs or stop-work orders." },
      { name: "DBP Act Support", desc: "Compliance pathway development, declaration support, and practitioner registration assistance tailored to your project's specific requirements." },
      { name: "CAS Complaint Response", desc: "Expert investigation and evidence gathering for CAS complaints, preparing comprehensive reports for the Building Commission." },
      { name: "Defect Rectification Coordination", desc: "We develop rectification strategies, coordinate with subcontractors, and verify completion — providing the documentation you need to satisfy the regulator." },
    ],
    howWeHelp: [
      "Pre-construction compliance review of designs and documentation",
      "Stage inspections with photographic evidence and compliance reports",
      "Rapid response to Orders and WDNs",
      "Expert representation in Building Commission matters",
      "Ongoing compliance support across your project portfolio",
    ],
    image: HERO_IMG,
  },
  pca: {
    title: "Private Certifiers (PCA)",
    icon: "📋",
    heroTagline: "Independent Compliance Support for Complex Certifications",
    heroDesc: "Private Certifiers of Accreditation face increasing scrutiny and liability under the NSW regulatory framework. 369 Alliance provides independent technical support, peer review, and compliance verification — giving you the confidence to certify complex projects.",
    challenges: [
      "Coordinating Work Direction Notices across multiple parties",
      "Managing multi-stage compliance for complex developments",
      "NSW Planning Portal submission accuracy and troubleshooting",
      "Independent verification of compliance declarations",
      "Technical peer review of reports and documentation",
      "Liability exposure under the DBP Act",
    ],
    services: [
      { name: "Independent Audit Support", desc: "We conduct independent compliance audits that complement your certification process, providing additional technical verification and photographic evidence." },
      { name: "DBP Act Declaration Review", desc: "Peer review of design and building practitioner declarations to verify accuracy and completeness before you rely on them for certification." },
      { name: "Planning Portal Assistance", desc: "Technical support for complex portal submissions, troubleshooting, and liaison with the NSW Planning Portal team." },
      { name: "Compliance Pathway Development", desc: "We develop tailored compliance pathways for complex or non-standard projects, providing the technical foundation for your certification decisions." },
    ],
    howWeHelp: [
      "Independent technical verification of compliance at critical stages",
      "Peer review of all technical reports and declarations",
      "Rapid turnaround on compliance assessments",
      "Expert opinion for complex or disputed compliance matters",
      "Documentation support for Building Commission inquiries",
    ],
    image: HERO_IMG,
  },
  "design-practitioner": {
    title: "Design Practitioners",
    icon: "📐",
    heroTagline: "Reduce Your DBP Act Liability with Expert Compliance Support",
    heroDesc: "The Design and Building Practitioners Act 2020 has created significant new obligations and liability exposure for design practitioners in NSW. 369 Alliance helps architects, engineers, and other design practitioners meet their compliance obligations and manage professional risk.",
    challenges: [
      "DBP Act liability exposure for design declarations",
      "Mandatory design declaration requirements and registration",
      "Compliance with BCA and Australian Standards in declared designs",
      "Managing design changes and their compliance implications",
      "Coordinating compliance across the design team",
      "Responding to compliance queries from builders and certifiers",
    ],
    services: [
      { name: "Design Declaration Audits", desc: "Comprehensive review of your designs and declarations to verify compliance with the DBP Act, BCA, and relevant Australian Standards before you lodge." },
      { name: "Compliance Pathway Development", desc: "We develop tailored compliance strategies that address the specific requirements of your project type, building class, and design approach." },
      { name: "Practitioner Registration Support", desc: "Guidance on DBP Act registration requirements, supporting documentation, and ongoing compliance obligations for registered design practitioners." },
      { name: "Technical Peer Review", desc: "Independent peer review of designs and compliance documentation, providing an additional layer of assurance before declaration." },
    ],
    howWeHelp: [
      "Pre-declaration review of designs and compliance documentation",
      "Identification of compliance risks before they become defects",
      "Clear, practical advice on BCA and Australian Standards compliance",
      "Support for complex or performance-based compliance solutions",
      "Ongoing compliance advisory retainer for your practice",
    ],
    image: HERO_IMG,
  },
  "building-practitioner": {
    title: "Building Practitioners",
    icon: "🏛️",
    heroTagline: "Comprehensive Compliance Support Across Your Projects",
    heroDesc: "Building practitioners in NSW operate under the most demanding compliance environment in the country. The DBP Act, RAB Act, and Planning Portal requirements create a complex web of obligations. 369 Alliance is your integrated compliance partner — covering every pillar.",
    challenges: [
      "DBP Act practitioner registration and compliance declarations",
      "RAB Act audit obligations and defect management",
      "Planning Portal submission requirements",
      "CAS complaint investigations and responses",
      "Managing compliance across multiple concurrent projects",
      "Liability exposure under both the RAB Act and DBP Act",
    ],
    services: [
      { name: "DBP Act Compliance", desc: "Registration support, compliance declarations, and ongoing compliance pathway development tailored to your practice and project portfolio." },
      { name: "RAB Act Audits", desc: "Construction stage and post-OC inspections, defect identification, and rectification coordination — keeping your projects compliant with the RAB Act." },
      { name: "Planning Portal Solutions", desc: "End-to-end portal submission management, reducing errors and delays across your project pipeline." },
      { name: "CAS Complaint Management", desc: "Expert investigation and response to CAS complaints, protecting your reputation and licence." },
    ],
    howWeHelp: [
      "Integrated compliance support across all six pillars",
      "Retainer-based advisory for ongoing compliance management",
      "Rapid response to compliance issues and regulatory inquiries",
      "Documentation and reporting to the required standard",
      "Expert representation in Building Commission matters",
    ],
    image: HERO_IMG,
  },
  strata: {
    title: "Strata Managers",
    icon: "🏢",
    heroTagline: "Specialist Strata Compliance for NSW's 85,000+ Schemes",
    heroDesc: "Strata managers face increasing compliance obligations under the NSW strata framework, including mandatory SBBIS requirements, remedial works management, and CAS complaint resolution. 369 Alliance is the preferred compliance partner for strata portfolios across NSW.",
    challenges: [
      "Strata Building Bond and Inspections Scheme (SBBIS) compliance",
      "Identifying and managing serious defects in strata buildings",
      "Coordinating remedial works across owners corporations",
      "CAS complaint investigations in occupied strata buildings",
      "Managing compliance for large and diverse strata portfolios",
      "Post-OC RAB Act audit obligations",
    ],
    services: [
      { name: "SBBIS Compliance", desc: "Comprehensive SBBIS assessments, defect identification, and compliance reporting — meeting all mandatory requirements for your strata schemes." },
      { name: "Defect Investigation", desc: "Expert investigation of building defects, including waterproofing, fire safety, structure, and essential services — with detailed reports and rectification recommendations." },
      { name: "Remedial Works Coordination", desc: "Remedial works specification, tender evaluation support, and works supervision — ensuring quality outcomes for your owners corporations." },
      { name: "CAS Complaint Management", desc: "Investigation and resolution of CAS complaints in occupied buildings, protecting your schemes and their residents." },
    ],
    howWeHelp: [
      "Portfolio-wide compliance assessment and risk management",
      "Preferred partner retainer arrangements for strata managers",
      "Rapid response to urgent compliance issues",
      "Clear, accessible reporting for owners corporations and committees",
      "Expert representation in Building Commission",
    ],
    image: STRATA_IMG,
  },
  "building-manager": {
    title: "Building Managers",
    icon: "🔑",
    heroTagline: "Keep Your Building Safe, Compliant, and Well-Managed",
    heroDesc: "Building managers are on the front line of building safety and compliance. From essential services maintenance to defect management and CAS complaint response, 369 Alliance provides the expert compliance support you need to protect your building and its residents.",
    challenges: [
      "Essential services compliance and maintenance obligations",
      "Identifying and reporting building defects",
      "Responding to resident complaints and CAS investigations",
      "Managing compliance documentation and records",
      "Coordinating with owners corporations and strata managers",
      "Understanding your obligations under the RAB Act and strata legislation",
    ],
    services: [
      { name: "Essential Services Audits", desc: "Comprehensive audits of fire safety systems, mechanical services, lifts, and other essential services — verifying compliance and identifying maintenance requirements." },
      { name: "Defect Identification", desc: "Expert building inspections identifying defects in waterproofing, structure, cladding, and services — with clear reports and rectification recommendations." },
      { name: "CAS Complaint Support", desc: "Expert assistance with CAS complaint investigations, evidence gathering, and response preparation." },
      { name: "Compliance Advisory", desc: "Ongoing compliance advisory support, helping you understand and meet your obligations under NSW building legislation." },
    ],
    howWeHelp: [
      "Regular compliance audits and defect monitoring",
      "Clear, practical advice on your compliance obligations",
      "Rapid response to urgent compliance issues",
      "Documentation and reporting to the required standard",
      "Liaison with owners corporations, strata managers, and regulators",
    ],
    image: STRATA_IMG,
  },
  owners: {
    title: "Property Owners",
    icon: "🏠",
    heroTagline: "Protect Your Most Valuable Investment with Independent Expert Advice",
    heroDesc: "Whether you are purchasing a new apartment, concerned about defects in your building, or navigating a strata dispute — 369 Alliance provides independent expert advice that protects your investment and your rights as a property owner.",
    challenges: [
      "Identifying serious defects in new or recently completed buildings",
      "Understanding your rights under the RAB Act and strata legislation",
      "Pre-purchase due diligence for residential apartments",
      "Navigating CAS complaints and Building Commission processes",
      "Managing defect disputes with builders and developers",
      "Understanding strata compliance obligations",
    ],
    services: [
      { name: "Pre-Purchase Inspections", desc: "Comprehensive pre-purchase building inspections providing you with an independent expert assessment of the property's condition before you commit." },
      { name: "Defect Investigation", desc: "Expert investigation of building defects — waterproofing, fire safety, structure, cladding, and services — with detailed reports and advice on your options." },
      { name: "CAS Complaint Assistance", desc: "We help property owners navigate the CAS complaint process, gathering evidence and preparing reports for the Building Commission." },
      { name: "Strata Compliance Support", desc: "Independent advice on strata compliance matters, SBBIS requirements, and remedial works — protecting your interests as a lot owner." },
    ],
    howWeHelp: [
      "Independent expert advice with no conflict of interest",
      "Clear, plain-language reports and recommendations",
      "Support throughout the Building Commission process",
      "Advice on your rights and options under NSW legislation",
      "Referrals to specialist legal and technical professionals as needed",
    ],
    image: STRATA_IMG,
  },
};

export default function WebsiteRolePage() {
  const params = useParams<{ role: string }>();
  const role = params.role || "developer";
  const [popup, setPopup] = useState<PopupType>(null);
  const [signIn, setSignIn] = useState(false);

  const data = roleData[role] || roleData.developer;

  return (
    <div className="min-h-screen" style={{ background: "#f8f7f5" }}>
      <WebsiteNav onOpenPopup={setPopup} onOpenSignIn={() => setSignIn(true)} />

      {/* Hero */}
      <section className="relative pt-16 overflow-hidden" style={{ minHeight: "480px" }}>
        <div className="absolute inset-0">
          <img src={data.image} alt={data.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(26,26,46,0.95) 0%, rgba(26,26,46,0.8) 50%, rgba(26,26,46,0.6) 100%)" }} />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
          <Link href="/website">
            <div className="inline-flex items-center gap-2 text-sm mb-6 cursor-pointer hover:opacity-80 transition-opacity"
              style={{ color: "#ffffff" }}>
              <ArrowLeft size={14} /> Back to Home
            </div>
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <span className="text-5xl">{data.icon}</span>
            <div className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider"
              style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.25), rgba(255,255,255,0.12))", border: "1px solid rgba(255,255,255,0.35)", color: "#ffffff", backdropFilter: "blur(4px)" }}>
              {data.title}
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 max-w-3xl leading-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}>
            {data.heroTagline}
          </h1>
          <p className="text-lg max-w-2xl leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>
            {data.heroDesc}
          </p>
        </div>
      </section>

      {/* Main content */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Left: Challenges + How we help */}
            <div className="lg:col-span-1 space-y-8">
              {/* Challenges */}
              <div className="bg-white rounded-2xl p-7 border" style={{ borderColor: "#e5e7eb" }}>
                <h3 className="font-bold mb-5" style={{ color: "#1a1a2e", fontFamily: "'Playfair Display', serif", fontSize: "1.1rem" }}>
                  Key Challenges You Face
                </h3>
                <ul className="space-y-3">
                  {data.challenges.map((c, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: "rgba(122,99,66,0.1)" }}>
                        <span className="text-xs font-bold" style={{ color: "#7A6342" }}>{i + 1}</span>
                      </div>
                      <span className="text-sm leading-relaxed" style={{ color: "#374151" }}>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* How we help */}
              <div className="rounded-2xl p-7" style={{ background: "#1a1a2e" }}>
                <h3 className="font-bold mb-5 text-white" style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem" }}>
                  How We Help
                </h3>
                <ul className="space-y-3">
                  {data.howWeHelp.map((h, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" style={{ color: "#A68A64" }} />
                      <span className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right: Services */}
            <div className="lg:col-span-2">
              <div className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-6"
                style={{ background: "rgba(122,99,66,0.1)", color: "#7A6342" }}>
                Our Services for {data.title}
              </div>
              <h2 className="text-3xl font-bold mb-8" style={{ color: "#1a1a2e", fontFamily: "'Playfair Display', serif" }}>
                Tailored Compliance Solutions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
                {data.services.map((s, i) => (
                  <div key={i} className="bg-white rounded-2xl p-6 border group hover:border-amber-300 transition-all hover:shadow-lg"
                    style={{ borderColor: "#e5e7eb" }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-4"
                      style={{ background: "linear-gradient(135deg,#1a1a2e,#252545)" }}>
                      <span className="text-xs font-bold" style={{ color: "#A68A64", fontFamily: "'IBM Plex Mono', monospace" }}>
                        0{i + 1}
                      </span>
                    </div>
                    <h4 className="font-bold mb-2" style={{ color: "#1a1a2e" }}>{s.name}</h4>
                    <p className="text-sm leading-relaxed" style={{ color: "#6b7280" }}>{s.desc}</p>
                    <div className="flex items-center gap-1 mt-4 text-xs font-semibold group-hover:gap-2 transition-all"
                      style={{ color: "#7A6342" }}>
                      Learn more <ChevronRight size={12} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Why 369 box */}
              <div className="rounded-2xl p-7 border-l-4" style={{ background: "rgba(122,99,66,0.06)", borderLeftColor: "#A68A64" }}>
                <h4 className="font-bold mb-3" style={{ color: "#1a1a2e" }}>Why Choose 369 Alliance?</h4>
                <p className="text-sm leading-relaxed" style={{ color: "#374151" }}>
                  369 Alliance is the only NSW consultancy offering all six compliance pillars under one roof. Our directors bring over 30 years of combined experience, and our collaborative approach means we work with you — not against you. We are not just box-tickers; we are problem-solvers who provide practical, commercially-astute advice that protects your interests.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA bar */}
      <section className="py-16" style={{ background: "#1a1a2e" }}>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            Ready to Get Started?
          </h2>
          <p className="mb-8" style={{ color: "rgba(255,255,255,0.6)" }}>
            Contact our team today to discuss your compliance needs. We respond within 1 business day.
          </p>
          <RoleCTABar onOpen={setPopup} />
        </div>
      </section>

      {/* Other roles */}
      <section className="py-16" style={{ background: "#f8f7f5" }}>
        <div className="max-w-7xl mx-auto px-6">
          <h3 className="text-xl font-bold mb-8 text-center" style={{ color: "#1a1a2e", fontFamily: "'Playfair Display', serif" }}>
            Also Serving
          </h3>
          <div className="flex flex-wrap gap-3 justify-center">
            {Object.entries(roleData)
              .filter(([key]) => key !== role)
              .map(([key, r]) => (
                <Link key={key} href={`/website/for/${key}`}>
                  <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border cursor-pointer hover:border-amber-300 hover:shadow-md transition-all text-sm font-medium"
                    style={{ borderColor: "#e5e7eb", color: "#374151" }}>
                    <span>{r.icon}</span> {r.title}
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </section>

      <WebsiteFooter onOpenPopup={setPopup} />
      <ContactPopup type={popup} onClose={() => setPopup(null)} />
      <SignInPopup open={signIn} onClose={() => setSignIn(false)} />
    </div>
  );
}
