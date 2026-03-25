/**
 * 369 Alliance – Website Home Page
 * Design: Deep Navy + Bronze + Playfair Display headings
 * Sections: Hero (split: left=logo+text, right=role cards), Stats, 6 Pillars, Why 369, Values, CTA
 */

import { useState } from "react";
import { Link } from "wouter";
import { Shield, FileCheck, Globe, Users, Building2, AlertCircle, ChevronRight } from "lucide-react";
import { WebsiteNav } from "@/components/website/WebsiteNav";
import { WebsiteFooter } from "@/components/website/WebsiteFooter";
import { ContactPopup, type PopupType } from "@/components/website/ContactPopups";
import { SignInPopup } from "@/components/website/SignInPopup";

const HERO_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310419663029262029/VyKdiatHMkCvCRqZzXD7NF/hero-main-8FrNvVRfi5P2dzSUj8J2RD.webp";
const COMPLIANCE_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310419663029262029/VyKdiatHMkCvCRqZzXD7NF/hero-compliance-BCrZQQPCPPiibs8a2DQjbZ.webp";
const STRATA_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310419663029262029/VyKdiatHMkCvCRqZzXD7NF/hero-strata-9GMjb3kgydVmf8Q3WY4E6C.webp";
const TEAM_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310419663029262029/VyKdiatHMkCvCRqZzXD7NF/about-team-guSb9WZNFw6o2LtKYrppWf.webp";

// ─── 369 Alliance Logo Symbol SVG ────────────────────────────────────────────────────
// Built from the official Logo Symbol Reference Guide (7 March 2026).
//
// LAYER STRUCTURE (bottom to top):
//   L1: Construction grid — faint grey (#CCCCCC ~30% opacity) horizontal/vertical lines
//   L2: Single arc ring — ~305° coverage, gap at 11-12 o'clock (top-left, ~330°–360°/0°)
//       Gradient: navy #1a1a2e (bottom-left) → gold #A68A64 (top-right)
//       Stroke weight: ~9% of diameter
//   L3: Three nodes at 9/3/6 o'clock — gold fill #A68A64, white numbers #FFFFFF
//       - Node “9” at 9 o'clock (270° from top = LEFT)
//       - Node “3” at 3 o'clock (30° from top = TOP-RIGHT, 120° from “9”)
//       - Node “6” at 6 o'clock (150° from top = BOTTOM-RIGHT, 120° from “3”)
//   L4: Spoke lines — thin grey #AAAAAA lines from center to each node (Y/Mercedes pattern)
//   L5: Center dot — small grey #AAAAAA filled circle
//   L6: Optional Fibonacci spiral — very light grey, low opacity
function Logo369({ size = 130 }: { size?: number }) {
  // Square crop (280x280) centred on the circle — white margins removed on all sides
  // Circle sits centred in the image, so it displays centred in the card
  return (
    <img
      src="https://d2xsxph8kpxj0f.cloudfront.net/310419663029262029/VyKdiatHMkCvCRqZzXD7NF/logo_symbol_square_cd006bc9.png"
      alt="369 Alliance symbol"
      width={size}
      height={size}
      style={{ objectFit: 'contain', display: 'block' }}
    />
  );
}

const pillars = [
  { icon: Shield, number: "01", title: "RAB Act Expertise", subtitle: "Building Inspections & Audits", desc: "Comprehensive compliance inspections and audits under the Residential Apartment Buildings (Compliance and Enforcement Powers) Act 2020. We conduct pre-OC and post-OC audits covering waterproofing, fire safety, structure, cladding, and building services.", href: "/website/services/rab-act" },
  { icon: FileCheck, number: "02", title: "DBP Act Expertise", subtitle: "Design & Building Practitioners", desc: "Specialist consultancy under the Design and Building Practitioners Act 2020. We support developers, builders, and practitioners with design declaration audits, compliance pathway development, and practitioner registration requirements.", href: "/website/services/dbp-act" },
  { icon: Globe, number: "03", title: "Planning Portal Solutions", subtitle: "NSW Planning Portal Management", desc: "End-to-end management of NSW Planning Portal submissions. Our experts handle document preparation, portal lodgement, troubleshooting, and approval tracking — reducing costly errors and project delays.", href: "/website/services/planning-portal" },
  { icon: AlertCircle, number: "04", title: "Project Intervene", subtitle: "Guidance & Coordination", desc: "Proactive management of matters escalated through the NSW Building Commissioner's Project Intervene program. We provide guidance, coordinate defect investigation, rectification strategy, and stakeholder management.", href: "/website/services/project-intervene" },
  { icon: Building2, number: "05", title: "Strata Solutions", subtitle: "Strata Compliance & Remedial Works", desc: "Specialised compliance services for NSW's 85,000+ strata schemes. From SBBIS assessments and defect identification to remedial works specification and tender evaluation — we protect strata communities.", href: "/website/services/strata" },
  { icon: Users, number: "06", title: "CAS Complaints", subtitle: "Complaint Investigation & Resolution", desc: "Expert investigation and resolution of complaints in occupied buildings. We gather evidence, assess compliance against BCA and Australian Standards, and prepare reports for the Building Commission.", href: "/website/services/cas" },
];

const audiences = [
  { role: "Developer", icon: "🏗️", tagline: "Navigate compliance from DA to OC", href: "/website/for/developer" },
  { role: "Builder", icon: "🔨", tagline: "Protect your licence and your project", href: "/website/for/builder" },
  { role: "Private Certifier (PCA)", icon: "📋", tagline: "Independent audit support for complex projects", href: "/website/for/pca" },
  { role: "Design Practitioner", icon: "📐", tagline: "Reduce your DBP Act liability exposure", href: "/website/for/design-practitioner" },
  { role: "Building Practitioner", icon: "🏛️", tagline: "Comprehensive compliance for practitioners", href: "/website/for/building-practitioner" },
  { role: "Strata Manager", icon: "🏢", tagline: "Specialist strata compliance expertise", href: "/website/for/strata" },
  { role: "Building Manager", icon: "🔑", tagline: "Keep your building safe and compliant", href: "/website/for/building-manager" },
  { role: "Owners", icon: "🏠", tagline: "Protect your most valuable investment", href: "/website/for/owners" },
];

const stats = [
  { value: "30+", label: "Years Combined Experience" },
  { value: "6", label: "Integrated Service Pillars" },
  { value: "NSW", label: "Building Compliance Specialists" },
  { value: "100%", label: "Client-Focused Approach" },
];

const values = [
  { title: "Technical Expertise", desc: "We are masters of our craft, with a deep and ever-evolving understanding of the NSW regulatory landscape — RAB Act, DBP Act, Planning Portal, and beyond. We provide the most accurate, up-to-date, and practical advice available.", icon: "⚙️" },
  { title: "Collaborative Support", desc: "We work alongside our clients as partners, not just consultants. We listen to your needs, understand your goals, and work together to find the best solutions — whether you are a developer, builder, strata manager, or owner.", icon: "🤝" },
  { title: "Approachability", desc: "We are experts, but we are also human. We communicate with clarity, honesty, and respect, fostering a culture of open dialogue and mutual trust. Compliance should not be intimidating — we make it accessible.", icon: "💬" },
];

export default function WebsiteHome() {
  const [popup, setPopup] = useState<PopupType>(null);
  const [signIn, setSignIn] = useState(false);

  return (
    <div className="min-h-screen" style={{ background: "#f8f7f5" }}>
      <WebsiteNav onOpenPopup={setPopup} onOpenSignIn={() => setSignIn(true)} />

      {/* ── Hero: Split layout ─────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-stretch overflow-hidden">
        {/* Background image full bleed */}
        <div className="absolute inset-0">
          <img src={HERO_IMG} alt="Sydney skyline" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(105deg, rgba(26,26,46,0.97) 0%, rgba(26,26,46,0.88) 45%, rgba(26,26,46,0.70) 70%, rgba(26,26,46,0.55) 100%)" }} />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pt-24 pb-12 flex flex-col lg:flex-row items-center gap-10">

          {/* LEFT: Logo + headline + description */}
          <div className="flex-1 min-w-0">
            {/* 369 Logo block — white card background, circle + text inline per brand guidelines */}
            <div className="mb-7 inline-flex items-center gap-3 rounded-xl"
              style={{ background: "#ffffff", boxShadow: "0 6px 32px rgba(0,0,0,0.28)", padding: "0 16px 0 0", overflow: "hidden" }}>
              {/* Circle mark — original PNG at 240px, white margins visible but card clips them */}
              <Logo369 size={192} />
              {/* Text block — same vertical centre as circle */}
              <div className="flex flex-col justify-center">
                {/* Gold horizontal rule above 369 — matches business card */}
                <div style={{ width: "60px", height: "2px", background: "linear-gradient(90deg, #C4A46B 0%, #7A6342 100%)", marginBottom: "8px", borderRadius: "1px" }} />
                {/* 369 + PTY LTD on same line — matches reference */}
                <div className="flex items-baseline gap-2 leading-none">
                  <span style={{
                    color: "#1a1a2e",
                    fontFamily: "'Montserrat', 'Arial Black', sans-serif",
                    fontSize: "3.5rem",
                    fontWeight: 900,
                    letterSpacing: "-0.02em",
                    lineHeight: 1,
                  }}>369</span>
                  <span style={{
                    color: "#444",
                    fontFamily: "'Montserrat', Arial, sans-serif",
                    fontSize: "1.05rem",
                    fontWeight: 500,
                    letterSpacing: "0.10em",
                    lineHeight: 1,
                  }}>ALLIANCE PTY LTD</span>
                </div>
                {/* BUILDING COMPLIANCE SPECIALISTS — small caps bronze */}
                <div style={{
                  color: "#9B7D52",
                  fontFamily: "'Montserrat', Arial, sans-serif",
                  fontSize: "0.62rem",
                  fontWeight: 700,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  marginTop: "5px",
                }}>
                  Building Compliance Specialists
                </div>
                {/* Tagline — italic grey */}
                <div style={{
                  color: "#666",
                  fontFamily: "'Montserrat', Arial, sans-serif",
                  fontSize: "0.58rem",
                  fontStyle: "italic",
                  fontWeight: 400,
                  marginTop: "3px",
                }}>
                  Integrity by Design. Revolutionizing Safety
                </div>
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-5 leading-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}>
              Building Compliance<br />
              <span style={{ color: "#A68A64" }}>Specialists.</span>
            </h1>

            <p className="text-base md:text-lg mb-4 font-light" style={{ color: "rgba(255,255,255,0.85)" }}>
              Integrity by Design. Revolutionising Safety in NSW Construction.
            </p>

            <p className="text-sm md:text-base leading-relaxed max-w-xl" style={{ color: "rgba(255,255,255,0.60)" }}>
              369 Alliance is NSW's only integrated six-pillar building compliance consultancy. From RAB Act audits and DBP Act declarations to Planning Portal submissions, Project Intervene coordination, Strata Solutions, and CAS complaints — we are your single trusted partner across the entire compliance lifecycle.
            </p>
          </div>

          {/* RIGHT: Who We Serve cards — visible on first load */}
          <div className="w-full lg:w-80 xl:w-96 flex-shrink-0">
            <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(166,138,100,0.25)", backdropFilter: "blur(8px)" }}>
              <div className="px-5 py-4 border-b" style={{ borderColor: "rgba(166,138,100,0.2)" }}>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#A68A64" }}>Who We Serve</p>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>Select your role to see how we can help</p>
              </div>
              <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                {audiences.map((a) => (
                  <Link key={a.role} href={a.href}>
                    <div className="group flex items-center gap-3 px-5 py-3.5 cursor-pointer transition-all hover:bg-white/10">
                      <span className="text-xl flex-shrink-0">{a.icon}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors truncate">
                          {a.role}
                        </p>
                        <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.45)" }}>{a.tagline}</p>
                      </div>
                      <ChevronRight size={14} className="flex-shrink-0 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" style={{ color: "#A68A64" }} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-bounce opacity-40">
          <span className="text-xs text-white">Scroll</span>
          <div className="w-px h-6" style={{ background: "rgba(255,255,255,0.3)" }} />
        </div>
      </section>

      {/* ── Stats bar ────────────────────────────────────────────────────────── */}
      <section style={{ background: "#1a1a2e", borderTop: "1px solid rgba(166,138,100,0.15)" }}>
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4">
            {stats.map((s, i) => (
              <div key={s.label} className="text-center px-6 py-4"
                style={i < stats.length - 1 ? { borderRight: "1px solid rgba(166,138,100,0.18)" } : {}}>
                <div className="font-bold mb-2 leading-none"
                  style={{ color: "#A68A64", fontFamily: "'Montserrat', 'Arial Black', sans-serif", fontSize: "2.6rem", fontWeight: 800, letterSpacing: "-0.01em" }}>
                  {s.value}
                </div>
                <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.50)", letterSpacing: "0.14em" }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6 Pillars ────────────────────────────────────────────────────────── */}
      <section className="py-24" style={{ background: "#f8f7f5" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-4"
              style={{ background: "rgba(122,99,66,0.1)", color: "#7A6342" }}>
              Our Services
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: "#1a1a2e", fontFamily: "'Playfair Display', serif" }}>
              Six Pillars of Compliance Excellence
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: "#6b7280" }}>
              369 Alliance is the only NSW consultancy offering all six compliance pillars under one roof — eliminating the need to manage multiple consultants across your project lifecycle.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pillars.map((p) => {
              const Icon = p.icon;
              return (
                <Link key={p.number} href={p.href}>
                  <div className="group relative bg-white rounded-2xl p-7 cursor-pointer border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                    style={{ borderColor: "#e5e7eb" }}>
                    <div className="text-6xl font-bold mb-4 leading-none select-none"
                      style={{ color: "rgba(26,26,46,0.06)", fontFamily: "'Playfair Display', serif" }}>
                      {p.number}
                    </div>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 -mt-10"
                      style={{ background: "linear-gradient(135deg,#1a1a2e,#252545)" }}>
                      <Icon size={22} style={{ color: "#A68A64" }} />
                    </div>
                    <h3 className="text-lg font-bold mb-1" style={{ color: "#1a1a2e" }}>{p.title}</h3>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#A68A64" }}>{p.subtitle}</p>
                    <p className="text-sm leading-relaxed" style={{ color: "#6b7280" }}>{p.desc}</p>
                    <div className="flex items-center gap-1 mt-4 text-sm font-semibold group-hover:gap-2 transition-all"
                      style={{ color: "#7A6342" }}>
                      Learn more <ChevronRight size={14} />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: "linear-gradient(90deg,#7A6342,#A68A64)" }} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Why 369 Alliance ─────────────────────────────────────────────────── */}
      <section className="py-20 overflow-hidden" style={{ background: "#1a1a2e" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <img src={COMPLIANCE_IMG} alt="Building compliance inspector" className="w-full rounded-2xl object-cover"
                style={{ height: "480px" }} />
              <div className="absolute -bottom-4 -right-4 w-32 h-32 rounded-2xl overflow-hidden border-4 border-white shadow-xl hidden lg:block">
                <img src={STRATA_IMG} alt="Modern strata building" className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="lg:pl-8">
              <div className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-6"
                style={{ background: "rgba(166,138,100,0.15)", color: "#A68A64" }}>
                Why 369 Alliance
              </div>
              <h2 className="text-4xl font-bold text-white mb-6 leading-tight"
                style={{ fontFamily: "'Playfair Display', serif" }}>
                The Only Integrated<br />Compliance Partner in NSW
              </h2>
              <p className="text-base leading-relaxed mb-8" style={{ color: "rgba(255,255,255,0.65)" }}>
                We offer all six compliance pillars under one roof. Our directors bring over 30 years of combined experience in building surveying, engineering, and compliance — combined with a collaborative, client-first approach that sets us apart from adversarial enforcement-focused competitors.
              </p>
              <div className="space-y-4">
                {[
                  "First-mover advantage in RAB Act and DBP Act specialist services",
                  "End-to-end Planning Portal management reducing costly submission errors",
                  "Guidance with Project Intervene matters",
                  "Preferred compliance partner for strata portfolios across NSW",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: "linear-gradient(135deg,#7A6342,#A68A64)" }}>
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                        <polyline points="2 6 5 9 10 3" stroke="white" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </div>
                    <p className="text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>{item}</p>
                  </div>
                ))}
              </div>
              {/* No "Work with Us" button — removed per request */}
            </div>
          </div>
        </div>
      </section>

      {/* ── Core Values ──────────────────────────────────────────────────────── */}
      <section className="py-24" style={{ background: "#fff" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-6"
                style={{ background: "rgba(122,99,66,0.1)", color: "#7A6342" }}>
                Our Foundation
              </div>
              <h2 className="text-4xl font-bold mb-6" style={{ color: "#1a1a2e", fontFamily: "'Playfair Display', serif" }}>
                Three Core Values That<br />Drive Everything We Do
              </h2>
              <p className="text-base leading-relaxed mb-10" style={{ color: "#6b7280" }}>
                Founded by directors with over 30 years of combined experience, 369 Alliance was built on the belief that building compliance should be a collaborative, transparent, and empowering process — not an adversarial one.
              </p>
              <div className="space-y-6">
                {values.map((v) => (
                  <div key={v.title} className="flex gap-5">
                    <div className="text-3xl flex-shrink-0">{v.icon}</div>
                    <div>
                      <h4 className="font-bold mb-2" style={{ color: "#1a1a2e" }}>{v.title}</h4>
                      <p className="text-sm leading-relaxed" style={{ color: "#6b7280" }}>{v.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <img src={TEAM_IMG} alt="369 Alliance team" className="w-full rounded-2xl object-cover shadow-2xl"
                style={{ height: "520px" }} />
              <div className="absolute -bottom-6 -left-6 bg-white rounded-xl p-5 shadow-xl border"
                style={{ borderColor: "#e5e7eb", maxWidth: "240px" }}>
                <div className="text-2xl font-bold mb-1" style={{ color: "#1a1a2e", fontFamily: "'Playfair Display', serif" }}>
                  $120–200M
                </div>
                <div className="text-xs font-medium" style={{ color: "#6b7280" }}>
                  Total addressable market across all six compliance pillars in NSW annually
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Section ──────────────────────────────────────────────────────── */}
      <section className="py-20 relative overflow-hidden" style={{ background: "#1a1a2e" }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 30% 50%, #A68A64 0%, transparent 60%), radial-gradient(circle at 70% 50%, #7A6342 0%, transparent 60%)" }} />
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6"
            style={{ fontFamily: "'Playfair Display', serif" }}>
            Ready to Work with NSW's Leading Compliance Specialists?
          </h2>
          <p className="text-lg mb-10" style={{ color: "rgba(255,255,255,0.65)" }}>
            Whether you are a developer navigating the DBP Act, a strata manager facing SBBIS requirements, or an owner concerned about defects — 369 Alliance is your trusted partner.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button onClick={() => setPopup("quote")}
              className="px-8 py-4 rounded-full text-base font-semibold text-white hover:opacity-90 transition-all shadow-lg"
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
