/**
 * 369 Alliance – About Page
 */

import { useState } from "react";
import { WebsiteNav } from "@/components/website/WebsiteNav";
import { WebsiteFooter } from "@/components/website/WebsiteFooter";
import { ContactPopup, RoleCTABar, type PopupType } from "@/components/website/ContactPopups";

const HERO_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310419663029262029/VyKdiatHMkCvCRqZzXD7NF/hero-main-8FrNvVRfi5P2dzSUj8J2RD.webp";
const TEAM_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310419663029262029/VyKdiatHMkCvCRqZzXD7NF/about-team-guSb9WZNFw6o2LtKYrppWf.webp";

const values = [
  {
    icon: "⚙️",
    title: "Technical Expertise",
    desc: "We are masters of our craft, with a deep and ever-evolving understanding of the NSW regulatory landscape — RAB Act, DBP Act, Planning Portal, and beyond. We provide the most accurate, up-to-date, and practical advice available.",
  },
  {
    icon: "🤝",
    title: "Collaborative Support",
    desc: "We work alongside our clients as partners, not just consultants. We listen to your needs, understand your goals, and work together to find the best solutions — whether you are a developer, builder, strata manager, or owner.",
  },
  {
    icon: "💬",
    title: "Approachability",
    desc: "We are experts, but we are also human. We communicate with clarity, honesty, and respect, fostering a culture of open dialogue and mutual trust. Compliance should not be intimidating — we make it accessible.",
  },
];

const milestones = [
  { year: "2024", event: "369 Alliance Pty Ltd incorporated in NSW" },
  { year: "2024", event: "Directors bring 30+ years of combined building compliance experience" },
  { year: "2025", event: "Launch of six-pillar integrated compliance service offering" },
  { year: "2025", event: "Preferred compliance partner for strata portfolios across NSW" },
  { year: "2026", event: "Expansion of Project Intervene independent superintendent services" },
];

export default function WebsiteAbout() {
  const [popup, setPopup] = useState<PopupType>(null);

  return (
    <div className="min-h-screen" style={{ background: "#f8f7f5" }}>
      <WebsiteNav onOpenPopup={setPopup} />

      {/* Hero */}
      <section className="relative pt-16 overflow-hidden" style={{ minHeight: "380px" }}>
        <div className="absolute inset-0">
          <img src={HERO_IMG} alt="About 369 Alliance" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(26,26,46,0.95) 0%, rgba(26,26,46,0.8) 60%, rgba(26,26,46,0.6) 100%)" }} />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
          <div className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-5"
            style={{ background: "rgba(166,138,100,0.2)", border: "1px solid rgba(166,138,100,0.4)", color: "#A68A64" }}>
            About Us
          </div>
          <h1 className="text-5xl font-bold text-white mb-5" style={{ fontFamily: "'Playfair Display', serif" }}>
            Integrity by Design.<br />Revolutionising Safety.
          </h1>
          <p className="text-lg max-w-2xl" style={{ color: "rgba(255,255,255,0.7)" }}>
            369 Alliance was founded on the belief that building compliance should be a collaborative, transparent, and empowering process — not an adversarial one.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-6"
                style={{ background: "rgba(122,99,66,0.1)", color: "#7A6342" }}>
                Our Mission
              </div>
              <h2 className="text-4xl font-bold mb-6" style={{ color: "#1a1a2e", fontFamily: "'Playfair Display', serif" }}>
                Revolutionising Building Safety in NSW
              </h2>
              <p className="text-base leading-relaxed mb-5" style={{ color: "#374151" }}>
                369 Alliance exists to revolutionise building safety and compliance in NSW. We are not just another compliance consultancy — we are a new kind of partner, one that combines deep technical expertise with a genuinely collaborative and approachable culture.
              </p>
              <p className="text-base leading-relaxed mb-5" style={{ color: "#374151" }}>
                Our vision is to be the most trusted and respected building compliance consultancy in NSW — the first call for developers, builders, strata managers, and property owners who need expert guidance through the complex NSW regulatory landscape.
              </p>
              <p className="text-base leading-relaxed" style={{ color: "#374151" }}>
                We are the only NSW consultancy offering all six compliance pillars under one roof: RAB Act expertise, DBP Act expertise, Planning Portal solutions, Project Intervene coordination, Strata Solutions, and CAS complaints. This integrated approach eliminates the need to manage multiple consultants and ensures seamless compliance across your entire project lifecycle.
              </p>
            </div>
            <div className="relative">
              <img src={TEAM_IMG} alt="369 Alliance team" className="w-full rounded-2xl object-cover shadow-2xl"
                style={{ height: "480px" }} />
              <div className="absolute -bottom-5 -right-5 bg-white rounded-xl p-5 shadow-xl border"
                style={{ borderColor: "#e5e7eb", maxWidth: "200px" }}>
                <div className="text-2xl font-bold mb-1" style={{ color: "#1a1a2e", fontFamily: "'Playfair Display', serif" }}>30+</div>
                <div className="text-xs" style={{ color: "#6b7280" }}>Years combined experience in NSW building compliance</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20" style={{ background: "#1a1a2e" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <div className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-4"
              style={{ background: "rgba(166,138,100,0.15)", color: "#A68A64" }}>
              Our Values
            </div>
            <h2 className="text-4xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
              Three Core Values
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((v) => (
              <div key={v.title} className="rounded-2xl p-8" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="text-4xl mb-5">{v.icon}</div>
                <h3 className="text-xl font-bold text-white mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>{v.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Market Position */}
      <section className="py-20" style={{ background: "#fff" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <div className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-4"
              style={{ background: "rgba(122,99,66,0.1)", color: "#7A6342" }}>
              Market Position
            </div>
            <h2 className="text-4xl font-bold mb-4" style={{ color: "#1a1a2e", fontFamily: "'Playfair Display', serif" }}>
              A Unique Position in the NSW Market
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: "#6b7280" }}>
              369 Alliance occupies a unique and defensible position in the NSW building compliance market.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { stat: "85,000+", label: "Strata schemes in NSW requiring ongoing compliance support" },
              { stat: "6", label: "Integrated compliance pillars — the only consultancy in NSW offering all six" },
              { stat: "First", label: "Mover advantage in RAB Act and DBP Act specialist services" },
            ].map((s) => (
              <div key={s.stat} className="bg-white rounded-2xl p-7 border text-center hover:shadow-lg transition-all"
                style={{ borderColor: "#e5e7eb" }}>
                <div className="text-4xl font-bold mb-2" style={{ color: "#1a1a2e", fontFamily: "'Playfair Display', serif" }}>{s.stat}</div>
                <p className="text-sm" style={{ color: "#6b7280" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16" style={{ background: "#1a1a2e" }}>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            Work with NSW's Leading Compliance Specialists
          </h2>
          <p className="mb-8" style={{ color: "rgba(255,255,255,0.6)" }}>
            Contact our team today to discuss your compliance needs.
          </p>
          <RoleCTABar onOpen={setPopup} />
        </div>
      </section>

      <WebsiteFooter onOpenPopup={setPopup} />
      <ContactPopup type={popup} onClose={() => setPopup(null)} />
    </div>
  );
}
