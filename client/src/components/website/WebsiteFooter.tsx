/**
 * 369 Alliance – Website Footer
 * Editorial, architectural footer — no generic patterns
 */

import { Link } from "wouter";
import { type PopupType } from "./ContactPopups";

interface FooterProps {
  onOpenPopup: (t: PopupType) => void;
}

export function WebsiteFooter({ onOpenPopup }: FooterProps) {
  const pillars = [
    { label: "RAB Act Expertise", href: "/website/services/rab-act" },
    { label: "DBP Act Expertise", href: "/website/services/dbp-act" },
    { label: "Planning Portal", href: "/website/services/planning-portal" },
    { label: "Project Intervene", href: "/website/services/project-intervene" },
    { label: "Strata Solutions", href: "/website/services/strata" },
    { label: "CAS Complaints", href: "/website/services/cas" },
  ];

  const audiences = [
    { label: "Developers", href: "/website/for/developer" },
    { label: "Builders", href: "/website/for/builder" },
    { label: "Private Certifiers", href: "/website/for/pca" },
    { label: "Design Practitioners", href: "/website/for/design-practitioner" },
    { label: "Strata Managers", href: "/website/for/strata" },
    { label: "Owners", href: "/website/for/owners" },
  ];

  return (
    <footer style={{ background: "#0c0c1a" }}>
      {/* Top accent line */}
      <div className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent 0%, #7A6342 30%, #A68A64 50%, #7A6342 70%, transparent 100%)" }} />

      <div className="max-w-7xl mx-auto px-6 lg:px-10">

        {/* Main footer grid */}
        <div className="py-16 grid grid-cols-1 md:grid-cols-12 gap-y-12 gap-x-8">

          {/* Brand column */}
          <div className="md:col-span-4">
            <div className="flex items-center gap-3 mb-6">
              <img
                src="https://d2xsxph8kpxj0f.cloudfront.net/310419663029262029/VyKdiatHMkCvCRqZzXD7NF/nav_symbol_tight_9c30a942.png"
                alt="369 Alliance"
                width="36"
                height="36"
                style={{ objectFit: 'contain', borderRadius: '3px' }}
              />
              <div>
                <div className="text-white font-bold text-sm tracking-tight" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                  369 Alliance Pty Ltd
                </div>
                <div className="text-[10px] font-medium tracking-[0.18em] uppercase" style={{ color: "#A68A64" }}>
                  Building Compliance Specialists
                </div>
              </div>
            </div>
            <p className="text-[13px] leading-relaxed mb-6" style={{ color: "rgba(255,255,255,0.4)" }}>
              Integrity by Design. Revolutionising Safety.<br />
              NSW's integrated six-pillar building compliance consultancy.
            </p>
            <div className="space-y-2 text-[13px]" style={{ color: "rgba(255,255,255,0.35)" }}>
              <div>Sydney, NSW, Australia</div>
              <a href="mailto:info@369alliance.com.au" className="block hover:text-white/60 transition-colors duration-200">
                info@369alliance.com.au
              </a>
            </div>
          </div>

          {/* Services */}
          <div className="md:col-span-2 md:col-start-6">
            <h4 className="text-[11px] font-bold tracking-[0.16em] uppercase mb-5" style={{ color: "rgba(255,255,255,0.3)" }}>
              Services
            </h4>
            <ul className="space-y-3">
              {pillars.map(p => (
                <li key={p.href}>
                  <Link href={p.href}>
                    <span className="text-[13px] link-underline cursor-pointer transition-colors duration-200"
                      style={{ color: "rgba(255,255,255,0.5)" }}>
                      {p.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Audiences */}
          <div className="md:col-span-2">
            <h4 className="text-[11px] font-bold tracking-[0.16em] uppercase mb-5" style={{ color: "rgba(255,255,255,0.3)" }}>
              Who We Serve
            </h4>
            <ul className="space-y-3">
              {audiences.map(a => (
                <li key={a.href}>
                  <Link href={a.href}>
                    <span className="text-[13px] link-underline cursor-pointer transition-colors duration-200"
                      style={{ color: "rgba(255,255,255,0.5)" }}>
                      {a.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact CTA */}
          <div className="md:col-span-3 md:col-start-10">
            <h4 className="text-[11px] font-bold tracking-[0.16em] uppercase mb-5" style={{ color: "rgba(255,255,255,0.3)" }}>
              Get in Touch
            </h4>
            <div className="space-y-2.5">
              <button onClick={() => onOpenPopup("quote")}
                className="w-full py-2.5 text-[13px] font-semibold text-white transition-all duration-200 hover:shadow-lg hover:shadow-amber-900/20"
                style={{ background: "linear-gradient(135deg,#7A6342,#A68A64)", borderRadius: "4px" }}>
                Request a Quote
              </button>
              <button onClick={() => onOpenPopup("message")}
                className="w-full py-2.5 text-[13px] font-medium border transition-colors duration-200 hover:border-white/30"
                style={{ borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", borderRadius: "4px" }}>
                Send a Message
              </button>
            </div>
            <div className="mt-6 pt-5" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <Link href="/action-manager">
                <span className="text-[13px] font-medium cursor-pointer link-underline transition-colors duration-200"
                  style={{ color: "#A68A64" }}>
                  Client Portal Login &rarr;
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="py-6 flex flex-col md:flex-row items-center justify-between gap-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <span className="text-[11px] tracking-wide" style={{ color: "rgba(255,255,255,0.2)" }}>
            &copy; {new Date().getFullYear()} 369 Alliance Pty Ltd. All rights reserved.
          </span>
          <div className="flex gap-6 text-[11px] tracking-wide" style={{ color: "rgba(255,255,255,0.2)" }}>
            <span className="hover:text-white/40 cursor-pointer transition-colors">Privacy</span>
            <span className="hover:text-white/40 cursor-pointer transition-colors">Terms</span>
            <span className="hover:text-white/40 cursor-pointer transition-colors">Disclaimer</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
