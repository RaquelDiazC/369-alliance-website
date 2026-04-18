/**
 * 369 Alliance – Website Home Page
 * Editorial, hand-crafted design — asymmetric layouts, architectural lines,
 * scroll-triggered reveals, and intentional white space.
 * Brand: Deep Navy #1a1a2e + Bronze #7A6342–#A68A64
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "wouter";
import { Shield, FileCheck, Globe, Users, Building2, AlertCircle, ArrowRight, ArrowUpRight } from "lucide-react";
import { WebsiteNav } from "@/components/website/WebsiteNav";
import { WebsiteFooter } from "@/components/website/WebsiteFooter";
import { ContactPopup, type PopupType } from "@/components/website/ContactPopups";
import { SignInPopup } from "@/components/website/SignInPopup";
import { Logo369 } from "@/components/Logo369";

const HERO_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310419663029262029/VyKdiatHMkCvCRqZzXD7NF/hero-main-8FrNvVRfi5P2dzSUj8J2RD.webp";
const COMPLIANCE_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310419663029262029/VyKdiatHMkCvCRqZzXD7NF/hero-compliance-BCrZQQPCPPiibs8a2DQjbZ.webp";
const STRATA_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310419663029262029/VyKdiatHMkCvCRqZzXD7NF/hero-strata-9GMjb3kgydVmf8Q3WY4E6C.webp";
const TEAM_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310419663029262029/VyKdiatHMkCvCRqZzXD7NF/about-team-guSb9WZNFw6o2LtKYrppWf.webp";

// ─── Scroll reveal hook ──────────────────────────────────────
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add("visible"); obs.unobserve(el); } },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useReveal();
  return (
    <div ref={ref} className={`reveal ${delay ? `reveal-delay-${delay}` : ""} ${className}`}>
      {children}
    </div>
  );
}

// ─── Data ────────────────────────────────────────────────────
const pillars = [
  { icon: Shield, num: "01", title: "RAB Act Expertise", sub: "Building Inspections & Audits", desc: "Comprehensive compliance inspections and audits under the Residential Apartment Buildings Act 2020 — from pre-OC to post-OC, covering waterproofing, fire safety, structure, and cladding.", href: "/website/services/rab-act" },
  { icon: FileCheck, num: "02", title: "DBP Act Expertise", sub: "Design & Building Practitioners", desc: "Specialist consultancy under the Design and Building Practitioners Act 2020. Design declaration audits, compliance pathways, and practitioner registration support.", href: "/website/services/dbp-act" },
  { icon: Globe, num: "03", title: "Planning Portal", sub: "NSW Portal Management", desc: "End-to-end management of NSW Planning Portal submissions — document preparation, lodgement, troubleshooting, and approval tracking.", href: "/website/services/planning-portal" },
  { icon: AlertCircle, num: "04", title: "Project Intervene", sub: "Guidance & Coordination", desc: "Management of matters escalated through the NSW Building Commissioner's Project Intervene program — investigation, rectification strategy, and stakeholder coordination.", href: "/website/services/project-intervene" },
  { icon: Building2, num: "05", title: "Strata Solutions", sub: "Compliance & Remedial Works", desc: "Specialised compliance services for NSW's 85,000+ strata schemes — SBBIS assessments, defect identification, remedial works specification, and tender evaluation.", href: "/website/services/strata" },
  { icon: Users, num: "06", title: "CAS Complaints", sub: "Investigation & Resolution", desc: "Expert investigation and resolution of building complaints — evidence gathering, BCA compliance assessment, and reports for the Building Commission.", href: "/website/services/cas" },
];

const audiences = [
  { role: "Developer", tagline: "Navigate compliance from DA to OC", href: "/website/for/developer" },
  { role: "Builder", tagline: "Protect your licence and your project", href: "/website/for/builder" },
  { role: "Private Certifier", tagline: "Independent audit support", href: "/website/for/pca" },
  { role: "Design Practitioner", tagline: "Reduce your DBP Act liability", href: "/website/for/design-practitioner" },
  { role: "Strata Manager", tagline: "Specialist strata compliance", href: "/website/for/strata" },
  { role: "Building Manager", tagline: "Keep your building compliant", href: "/website/for/building-manager" },
  { role: "Owners", tagline: "Protect your investment", href: "/website/for/owners" },
];

// ─── Component ───────────────────────────────────────────────
export default function WebsiteHome() {
  const [popup, setPopup] = useState<PopupType>(null);
  const [signIn, setSignIn] = useState(false);

  return (
    <div className="min-h-screen" style={{ background: "#f8f7f4" }}>
      <WebsiteNav onOpenPopup={setPopup} onOpenSignIn={() => setSignIn(true)} />

      {/* ═══ HERO ═══════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[100vh] flex items-center overflow-hidden">
        {/* BG image */}
        <div className="absolute inset-0">
          <img src={HERO_IMG} alt="" className="w-full h-full object-cover" style={{ filter: "brightness(0.35)" }} />
          <div className="absolute inset-0"
            style={{ background: "linear-gradient(160deg, rgba(10,10,28,0.94) 0%, rgba(10,10,28,0.82) 55%, rgba(10,10,28,0.65) 100%)" }} />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-10 pt-28 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">

            {/* ── LEFT: Logo card + headline + CTAs ────────────────── */}
            <div className="lg:col-span-7">

              {/* Brand logo card — white, matches business card */}
              <div className="flex items-center gap-6 bg-white rounded-xl shadow-2xl mb-8 overflow-hidden"
                style={{ padding: "24px 28px", maxWidth: 480 }}>
                <Logo369 size={150} variant="light" />
                <div style={{ borderLeft: "1px solid #e5e3de", paddingLeft: 20, flex: 1 }}>
                  <div className="font-black leading-none tracking-tight"
                    style={{ fontSize: 52, color: "#1a1a2e", fontFamily: "'Montserrat', sans-serif", lineHeight: 1 }}>
                    369
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.18em", color: "#1a1a2e", marginTop: 4, textTransform: "uppercase" }}>
                    Alliance Pty Ltd
                  </div>
                  <div style={{ height: 1, background: "#A68A64", margin: "10px 0" }} />
                  <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.18em", color: "#A68A64", textTransform: "uppercase", lineHeight: 1.4 }}>
                    Building Compliance<br />Specialists
                  </div>
                  <div style={{ fontSize: 9, fontStyle: "italic", color: "#9ca3af", marginTop: 6, lineHeight: 1.5 }}>
                    Integrity by Design.<br />Revolutionising Safety
                  </div>
                </div>
              </div>

              {/* Headline */}
              <h1 className="mb-5 leading-[1.05]" style={{ fontFamily: "'Playfair Display', serif" }}>
                <span className="block text-[clamp(2.2rem,4.5vw,3.8rem)] font-bold text-white">
                  Building Compliance
                </span>
                <span className="block text-[clamp(2.2rem,4.5vw,3.8rem)] font-bold" style={{ color: "#A68A64" }}>
                  Specialists.
                </span>
              </h1>

              <p className="text-sm leading-relaxed max-w-lg mb-8"
                style={{ color: "rgba(255,255,255,0.5)" }}>
                369 Alliance is NSW's only integrated six-pillar building compliance consultancy — your single trusted partner across the entire compliance lifecycle.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-4">
                <button onClick={() => setPopup("quote")}
                  className="group flex items-center gap-2 px-7 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:shadow-lg hover:shadow-amber-900/25"
                  style={{ background: "linear-gradient(135deg,#7A6342,#A68A64)", borderRadius: "4px" }}>
                  Request a Quote
                  <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <Link href="/website/services">
                  <span className="group flex items-center gap-2 px-7 py-3.5 text-sm font-medium border cursor-pointer transition-all duration-300 hover:border-white/30"
                    style={{ color: "rgba(255,255,255,0.65)", borderColor: "rgba(255,255,255,0.15)", borderRadius: "4px" }}>
                    Our Services
                    <ArrowUpRight size={14} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                  </span>
                </Link>
              </div>
            </div>

            {/* ── RIGHT: Who We Serve panel ─────────────────────────── */}
            <div className="lg:col-span-5 lg:pt-2">
              <div className="rounded-xl overflow-hidden"
                style={{
                  background: "rgba(12,12,30,0.72)",
                  backdropFilter: "blur(14px)",
                  border: "1px solid rgba(166,138,100,0.2)",
                }}>
                {/* Panel header */}
                <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(166,138,100,0.12)" }}>
                  <div className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: "#A68A64" }}>
                    Who We Serve
                  </div>
                  <div className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                    Select your role to see how we can help
                  </div>
                </div>
                {/* Role rows */}
                {audiences.map((a) => (
                  <Link key={a.role} href={a.href}>
                    <div
                      className="group flex items-center justify-between cursor-pointer transition-colors duration-150"
                      style={{ padding: "11px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = "rgba(166,138,100,0.07)"}
                      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = "transparent"}
                    >
                      <div>
                        <div className="text-[13px] font-semibold text-white group-hover:text-amber-300 transition-colors">
                          {a.role}
                        </div>
                        <div className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                          {a.tagline}
                        </div>
                      </div>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0 ml-3 opacity-30 group-hover:opacity-70 transition-opacity">
                        <path d="M3 7h8M7 3l4 4-4 4" stroke="#A68A64" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24"
          style={{ background: "linear-gradient(to top, #f8f7f4, transparent)" }} />
      </section>

      {/* ═══ WHO WE SERVE — horizontal scroll strip ═════════════════════════ */}
      <section className="py-16 overflow-hidden" style={{ background: "#f8f7f4" }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <Reveal>
            <div className="flex items-center gap-3 mb-10">
              <div className="h-px w-10" style={{ background: "#A68A64" }} />
              <span className="text-[11px] font-semibold tracking-[0.2em] uppercase" style={{ color: "#7A6342" }}>Who We Serve</span>
            </div>
          </Reveal>
          <div className="flex gap-3 overflow-x-auto pb-4 -mx-2 px-2 scrollbar-none" style={{ scrollbarWidth: "none" }}>
            {audiences.map((a, i) => (
              <Reveal key={a.role} delay={Math.min(i + 1, 5) as 1|2|3|4|5}>
                <Link href={a.href}>
                  <div className="group flex-shrink-0 w-52 p-5 bg-white border cursor-pointer card-lift"
                    style={{ borderColor: "#e8e6e1", borderRadius: "6px" }}>
                    <div className="text-sm font-bold mb-1 group-hover:text-amber-800 transition-colors" style={{ color: "#1a1a2e" }}>
                      {a.role}
                    </div>
                    <div className="text-xs leading-relaxed" style={{ color: "#9ca3af" }}>{a.tagline}</div>
                    <div className="mt-3 h-px w-0 group-hover:w-full transition-all duration-500" style={{ background: "#A68A64" }} />
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 6 PILLARS — alternating layout ═════════════════════════════════ */}
      <section className="py-24 relative" style={{ background: "#fff" }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <Reveal>
            <div className="max-w-xl mb-16">
              <div className="flex items-center gap-3 mb-5">
                <div className="h-px w-10" style={{ background: "#A68A64" }} />
                <span className="text-[11px] font-semibold tracking-[0.2em] uppercase" style={{ color: "#7A6342" }}>Our Services</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-4"
                style={{ color: "#1a1a2e", fontFamily: "'Playfair Display', serif" }}>
                Six Pillars of<br />Compliance Excellence
              </h2>
              <p className="text-[15px] leading-relaxed" style={{ color: "#6b7280" }}>
                The only NSW consultancy offering all six compliance pillars under one roof — eliminating the need to manage multiple consultants.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
            {pillars.map((p, i) => {
              const Icon = p.icon;
              return (
                <Reveal key={p.num} delay={Math.min((i % 3) + 1, 3) as 1|2|3}>
                  <Link href={p.href}>
                    <div className="group relative bg-white border p-7 cursor-pointer card-lift h-full"
                      style={{ borderColor: "#eae8e3", borderRadius: "6px" }}>
                      {/* Large number watermark */}
                      <span className="absolute top-4 right-5 text-6xl font-bold select-none pointer-events-none"
                        style={{ color: "rgba(26,26,46,0.03)", fontFamily: "'Playfair Display', serif" }}>
                        {p.num}
                      </span>
                      {/* Icon */}
                      <div className="w-11 h-11 flex items-center justify-center mb-5"
                        style={{ background: "#1a1a2e", borderRadius: "8px" }}>
                        <Icon size={20} style={{ color: "#A68A64" }} />
                      </div>
                      <h3 className="text-[15px] font-bold mb-1 group-hover:text-amber-800 transition-colors" style={{ color: "#1a1a2e" }}>
                        {p.title}
                      </h3>
                      <p className="text-[11px] font-semibold tracking-wider uppercase mb-3" style={{ color: "#A68A64" }}>
                        {p.sub}
                      </p>
                      <p className="text-[13px] leading-relaxed mb-5" style={{ color: "#6b7280" }}>
                        {p.desc}
                      </p>
                      {/* Animated underline on hover */}
                      <span className="inline-flex items-center gap-1 text-[13px] font-semibold group-hover:gap-2 transition-all"
                        style={{ color: "#7A6342" }}>
                        Learn more <ArrowRight size={13} />
                      </span>
                      {/* Bottom accent bar */}
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"
                        style={{ background: "linear-gradient(90deg,#7A6342,#A68A64)" }} />
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ WHY 369 — asymmetric image + text ══════════════════════════════ */}
      <section className="relative py-28 overflow-hidden noise-overlay" style={{ background: "#1a1a2e" }}>
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            {/* Image cluster — overlapping, not centered */}
            <div className="lg:col-span-5 relative">
              <Reveal>
                <div className="relative">
                  <img src={COMPLIANCE_IMG} alt="Building compliance"
                    className="w-full object-cover shadow-2xl"
                    style={{ height: "520px", borderRadius: "6px" }} />
                  {/* Overlapping inset image */}
                  <div className="absolute -bottom-6 -right-4 w-36 h-36 border-4 shadow-xl hidden lg:block overflow-hidden"
                    style={{ borderColor: "#1a1a2e", borderRadius: "6px" }}>
                    <img src={STRATA_IMG} alt="" className="w-full h-full object-cover" />
                  </div>
                  {/* Decorative corner */}
                  <div className="absolute -top-3 -left-3 w-8 h-8 border-t-2 border-l-2 hidden lg:block"
                    style={{ borderColor: "rgba(166,138,100,0.3)" }} />
                </div>
              </Reveal>
            </div>

            {/* Text */}
            <div className="lg:col-span-6 lg:col-start-7">
              <Reveal>
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-px w-10" style={{ background: "#A68A64" }} />
                  <span className="text-[11px] font-semibold tracking-[0.2em] uppercase" style={{ color: "#A68A64" }}>Why 369 Alliance</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-6"
                  style={{ fontFamily: "'Playfair Display', serif" }}>
                  The Only Integrated<br />Compliance Partner in NSW
                </h2>
                <p className="text-[15px] leading-relaxed mb-10" style={{ color: "rgba(255,255,255,0.55)" }}>
                  Our directors bring over 30 years of combined experience in building surveying, engineering, and compliance — combined with a collaborative, client-first approach that sets us apart.
                </p>
              </Reveal>

              <div className="space-y-5">
                {[
                  "First-mover advantage in RAB Act and DBP Act specialist services",
                  "End-to-end Planning Portal management reducing costly submission errors",
                  "Guidance with Project Intervene matters",
                  "Preferred compliance partner for strata portfolios across NSW",
                ].map((item, i) => (
                  <Reveal key={i} delay={Math.min(i + 1, 4) as 1|2|3|4}>
                    <div className="flex items-start gap-4">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: "rgba(166,138,100,0.15)", border: "1px solid rgba(166,138,100,0.3)" }}>
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                          <polyline points="2 6 5 9 10 3" stroke="#A68A64" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </div>
                      <p className="text-[14px] leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>{item}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ VALUES — editorial cards ════════════════════════════════════════ */}
      <section className="py-28" style={{ background: "#f8f7f4" }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">

            {/* Left text */}
            <div className="lg:col-span-5">
              <Reveal>
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-px w-10" style={{ background: "#A68A64" }} />
                  <span className="text-[11px] font-semibold tracking-[0.2em] uppercase" style={{ color: "#7A6342" }}>Our Foundation</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-6"
                  style={{ color: "#1a1a2e", fontFamily: "'Playfair Display', serif" }}>
                  Three Core Values<br />That Drive Everything
                </h2>
                <p className="text-[15px] leading-relaxed mb-10" style={{ color: "#6b7280" }}>
                  Built on the belief that building compliance should be collaborative, transparent, and empowering — never adversarial.
                </p>
              </Reveal>

              <div className="space-y-8">
                {[
                  { title: "Technical Expertise", desc: "Deep, ever-evolving understanding of the NSW regulatory landscape — RAB Act, DBP Act, Planning Portal, and beyond. The most accurate, practical advice available." },
                  { title: "Collaborative Support", desc: "We work alongside our clients as partners. We listen, understand your goals, and find the best solutions — whether you're a developer, builder, or owner." },
                  { title: "Approachability", desc: "Experts who communicate with clarity, honesty, and respect. Compliance should not be intimidating — we make it accessible." },
                ].map((v, i) => (
                  <Reveal key={v.title} delay={Math.min(i + 1, 3) as 1|2|3}>
                    <div className="flex gap-5">
                      <div className="flex-shrink-0 w-8 text-right">
                        <span className="text-[11px] font-bold" style={{ color: "#A68A64", fontFamily: "'IBM Plex Mono', monospace" }}>
                          0{i + 1}
                        </span>
                      </div>
                      <div className="flex-1" style={{ borderLeft: "1px solid #e5e3de", paddingLeft: "20px" }}>
                        <h4 className="text-sm font-bold mb-2" style={{ color: "#1a1a2e" }}>{v.title}</h4>
                        <p className="text-[13px] leading-relaxed" style={{ color: "#6b7280" }}>{v.desc}</p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>

            {/* Right image */}
            <div className="lg:col-span-6 lg:col-start-7 relative">
              <Reveal>
                <img src={TEAM_IMG} alt="369 Alliance team" className="w-full object-cover shadow-2xl"
                  style={{ height: "560px", borderRadius: "6px" }} />
                {/* Market callout — offset */}
                <div className="absolute -bottom-8 -left-4 bg-white p-5 shadow-xl border hidden lg:block"
                  style={{ borderColor: "#eae8e3", borderRadius: "6px", maxWidth: "220px" }}>
                  <div className="text-2xl font-bold mb-1" style={{ color: "#1a1a2e", fontFamily: "'Playfair Display', serif" }}>
                    $120–200M
                  </div>
                  <div className="text-[11px] leading-snug" style={{ color: "#6b7280" }}>
                    Total addressable market across all six pillars in NSW annually
                  </div>
                </div>
                {/* Decorative corner */}
                <div className="absolute -bottom-3 -right-3 w-8 h-8 border-b-2 border-r-2 hidden lg:block"
                  style={{ borderColor: "rgba(166,138,100,0.25)" }} />
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CTA — cinematic band ═══════════════════════════════════════════ */}
      <section className="relative py-24 overflow-hidden noise-overlay" style={{ background: "#1a1a2e" }}>
        {/* Radial accents */}
        <div className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "radial-gradient(ellipse at 20% 50%, #A68A64 0%, transparent 50%), radial-gradient(ellipse at 80% 50%, #7A6342 0%, transparent 50%)" }} />

        <div className="relative z-10 max-w-3xl mx-auto px-6 lg:px-10 text-center">
          <Reveal>
            <div className="h-px w-16 mx-auto mb-8" style={{ background: "#A68A64" }} />
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-5 leading-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}>
              Ready to Work with NSW's<br />Leading Compliance Specialists?
            </h2>
            <p className="text-[15px] mb-10 max-w-lg mx-auto" style={{ color: "rgba(255,255,255,0.5)" }}>
              Whether you're navigating the DBP Act, facing SBBIS requirements, or concerned about defects — we're your trusted partner.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button onClick={() => setPopup("quote")}
                className="group flex items-center gap-2 px-7 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:shadow-lg hover:shadow-amber-900/25"
                style={{ background: "linear-gradient(135deg,#7A6342,#A68A64)", borderRadius: "4px" }}>
                Request a Quote
                <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
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
