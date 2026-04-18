/**
 * 369 Alliance – About Page
 * Editorial layout — asymmetric, architectural
 */

import { useState, useEffect, useRef } from "react";
import { WebsiteNav } from "@/components/website/WebsiteNav";
import { WebsiteFooter } from "@/components/website/WebsiteFooter";
import { ContactPopup, RoleCTABar, type PopupType } from "@/components/website/ContactPopups";
import { SignInPopup } from "@/components/website/SignInPopup";
import { ArrowRight } from "lucide-react";

const HERO_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310419663029262029/VyKdiatHMkCvCRqZzXD7NF/hero-main-8FrNvVRfi5P2dzSUj8J2RD.webp";
const TEAM_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310419663029262029/VyKdiatHMkCvCRqZzXD7NF/about-team-guSb9WZNFw6o2LtKYrppWf.webp";

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

function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useReveal();
  return <div ref={ref} className={`reveal ${delay ? `reveal-delay-${delay}` : ""} ${className}`}>{children}</div>;
}

export default function WebsiteAbout() {
  const [popup, setPopup] = useState<PopupType>(null);
  const [signIn, setSignIn] = useState(false);

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
            <span className="text-[11px] font-semibold tracking-[0.2em] uppercase" style={{ color: "#A68A64" }}>About Us</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-5 leading-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}>
            Integrity by Design.<br />
            <span style={{ color: "#A68A64" }}>Revolutionising Safety.</span>
          </h1>
          <p className="text-[15px] max-w-lg" style={{ color: "rgba(255,255,255,0.55)" }}>
            Founded on the belief that building compliance should be collaborative, transparent, and empowering.
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20"
          style={{ background: "linear-gradient(to top, #f8f7f4, transparent)" }} />
      </section>

      {/* Mission — asymmetric */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            <div className="lg:col-span-6">
              <Reveal>
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-px w-10" style={{ background: "#A68A64" }} />
                  <span className="text-[11px] font-semibold tracking-[0.2em] uppercase" style={{ color: "#7A6342" }}>Our Mission</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight"
                  style={{ color: "#1a1a2e", fontFamily: "'Playfair Display', serif" }}>
                  Revolutionising Building Safety in NSW
                </h2>
              </Reveal>
              <Reveal delay={1}>
                <p className="text-[15px] leading-relaxed mb-5" style={{ color: "#374151" }}>
                  369 Alliance exists to revolutionise building safety and compliance in NSW. We are not just another consultancy — we are a new kind of partner, combining deep technical expertise with a genuinely collaborative culture.
                </p>
              </Reveal>
              <Reveal delay={2}>
                <p className="text-[15px] leading-relaxed mb-5" style={{ color: "#374151" }}>
                  Our vision is to be the most trusted building compliance consultancy in NSW — the first call for developers, builders, strata managers, and property owners navigating the complex regulatory landscape.
                </p>
              </Reveal>
              <Reveal delay={3}>
                <p className="text-[15px] leading-relaxed" style={{ color: "#6b7280" }}>
                  We are the only NSW consultancy offering all six compliance pillars under one roof: RAB Act, DBP Act, Planning Portal, Project Intervene, Strata Solutions, and CAS Complaints. This integrated approach eliminates managing multiple consultants and ensures seamless compliance across your entire project lifecycle.
                </p>
              </Reveal>
            </div>
            <div className="lg:col-span-5 lg:col-start-8 relative">
              <Reveal>
                <img src={TEAM_IMG} alt="369 Alliance team" className="w-full object-cover shadow-2xl"
                  style={{ height: "480px", borderRadius: "6px" }} />
                <div className="absolute -bottom-6 -right-4 bg-white p-5 shadow-xl border hidden lg:block"
                  style={{ borderColor: "#eae8e3", borderRadius: "6px", maxWidth: "180px" }}>
                  <div className="text-2xl font-bold mb-1" style={{ color: "#1a1a2e", fontFamily: "'Playfair Display', serif" }}>30+</div>
                  <div className="text-[11px] leading-snug" style={{ color: "#6b7280" }}>Years combined experience in NSW building compliance</div>
                </div>
                <div className="absolute -top-3 -left-3 w-8 h-8 border-t-2 border-l-2 hidden lg:block"
                  style={{ borderColor: "rgba(166,138,100,0.25)" }} />
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 relative overflow-hidden noise-overlay" style={{ background: "#1a1a2e" }}>
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10">
          <Reveal>
            <div className="max-w-md mb-14">
              <div className="flex items-center gap-3 mb-5">
                <div className="h-px w-10" style={{ background: "#A68A64" }} />
                <span className="text-[11px] font-semibold tracking-[0.2em] uppercase" style={{ color: "#A68A64" }}>Our Values</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                Three Core Values
              </h2>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { num: "01", title: "Technical Expertise", desc: "Deep, ever-evolving understanding of the NSW regulatory landscape — RAB Act, DBP Act, Planning Portal, and beyond. The most accurate, practical advice available." },
              { num: "02", title: "Collaborative Support", desc: "We work alongside our clients as partners. We listen, understand your goals, and find solutions together — whether you're a developer, builder, or owner." },
              { num: "03", title: "Approachability", desc: "Experts who communicate with clarity, honesty, and respect. Compliance should not be intimidating — we make it accessible." },
            ].map((v, i) => (
              <Reveal key={v.title} delay={Math.min(i + 1, 3) as 1|2|3}>
                <div className="p-8 h-full" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "6px" }}>
                  <span className="text-[11px] font-bold tracking-wider mb-5 block" style={{ color: "#A68A64", fontFamily: "'IBM Plex Mono', monospace" }}>{v.num}</span>
                  <h3 className="text-lg font-bold text-white mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>{v.title}</h3>
                  <p className="text-[13px] leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>{v.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Market position */}
      <section className="py-24" style={{ background: "#fff" }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <Reveal>
            <div className="max-w-md mb-14">
              <div className="flex items-center gap-3 mb-5">
                <div className="h-px w-10" style={{ background: "#A68A64" }} />
                <span className="text-[11px] font-semibold tracking-[0.2em] uppercase" style={{ color: "#7A6342" }}>Market Position</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight"
                style={{ color: "#1a1a2e", fontFamily: "'Playfair Display', serif" }}>
                A Unique Position in the NSW Market
              </h2>
              <p className="text-[15px]" style={{ color: "#6b7280" }}>
                369 Alliance occupies a unique and defensible position in the NSW building compliance market.
              </p>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { stat: "85,000+", label: "Strata schemes in NSW requiring ongoing compliance support" },
              { stat: "6", label: "Integrated compliance pillars — the only consultancy in NSW offering all six" },
              { stat: "First", label: "Mover advantage in RAB Act and DBP Act specialist services" },
            ].map((s, i) => (
              <Reveal key={s.stat} delay={Math.min(i + 1, 3) as 1|2|3}>
                <div className="p-8 bg-white border text-center card-lift h-full"
                  style={{ borderColor: "#eae8e3", borderRadius: "6px" }}>
                  <div className="text-3xl font-bold mb-2" style={{ color: "#1a1a2e", fontFamily: "'Playfair Display', serif" }}>{s.stat}</div>
                  <p className="text-[13px] leading-relaxed" style={{ color: "#6b7280" }}>{s.label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 relative overflow-hidden noise-overlay" style={{ background: "#1a1a2e" }}>
        <div className="relative z-10 max-w-2xl mx-auto px-6 text-center">
          <Reveal>
            <div className="h-px w-16 mx-auto mb-8" style={{ background: "#A68A64" }} />
            <h2 className="text-3xl font-bold text-white mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
              Work with NSW's Leading<br />Compliance Specialists
            </h2>
            <p className="text-[15px] mb-8" style={{ color: "rgba(255,255,255,0.45)" }}>
              Contact our team today to discuss your compliance needs.
            </p>
            <RoleCTABar onOpen={setPopup} />
          </Reveal>
        </div>
      </section>

      <WebsiteFooter onOpenPopup={setPopup} />
      <ContactPopup type={popup} onClose={() => setPopup(null)} />
      <SignInPopup open={signIn} onClose={() => setSignIn(false)} />
    </div>
  );
}
