/**
 * 369 Alliance – Website Footer
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
    { label: "Planning Portal Solutions", href: "/website/services/planning-portal" },
    { label: "Project Intervene", href: "/website/services/project-intervene" },
    { label: "Strata Solutions", href: "/website/services/strata" },
    { label: "CAS Complaints", href: "/website/services/cas" },
  ];

  const audiences = [
    { label: "Developers", href: "/website/for/developer" },
    { label: "Builders", href: "/website/for/builder" },
    { label: "Private Certifiers (PCA)", href: "/website/for/pca" },
    { label: "Design Practitioners", href: "/website/for/design-practitioner" },
    { label: "Building Practitioners", href: "/website/for/building-practitioner" },
    { label: "Strata Managers", href: "/website/for/strata" },
    { label: "Building Managers", href: "/website/for/building-manager" },
    { label: "Owners", href: "/website/for/owners" },
  ];

  return (
    <footer style={{ background: "#0f0f1e", color: "rgba(255,255,255,0.75)" }}>
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0"
                style={{ background: "linear-gradient(135deg,#7A6342,#A68A64)", color: "#fff", fontFamily: "'IBM Plex Mono', monospace" }}>
                369
              </div>
              <div>
                <div className="text-white font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>369 Alliance</div>
                <div className="text-xs" style={{ color: "#A68A64" }}>Building Compliance Specialists</div>
              </div>
            </div>
            <p className="text-sm leading-relaxed mb-5" style={{ color: "rgba(255,255,255,0.5)" }}>
              Integrity by Design. Revolutionising Safety.<br />
              NSW's only integrated six-pillar building compliance consultancy.
            </p>
            <div className="flex flex-col gap-2 text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
              <span>Sydney, NSW, Australia</span>
              <a href="mailto:info@369alliance.com.au" className="hover:text-amber-400 transition-colors">
                info@369alliance.com.au
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Our 6 Pillars</h4>
            <ul className="space-y-2.5">
              {pillars.map(p => (
                <li key={p.href}>
                  <Link href={p.href}>
                    <span className="text-sm hover:text-amber-400 transition-colors cursor-pointer"
                      style={{ color: "rgba(255,255,255,0.6)" }}>
                      {p.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Who We Serve */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Who We Serve</h4>
            <ul className="space-y-2.5">
              {audiences.map(a => (
                <li key={a.href}>
                  <Link href={a.href}>
                    <span className="text-sm hover:text-amber-400 transition-colors cursor-pointer"
                      style={{ color: "rgba(255,255,255,0.6)" }}>
                      {a.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Get in Touch</h4>
            <div className="space-y-3">
              <button onClick={() => onOpenPopup("quote")}
                className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: "linear-gradient(135deg,#7A6342,#A68A64)" }}>
                Request a Quote
              </button>
              <button onClick={() => onOpenPopup("message")}
                className="w-full py-2.5 rounded-lg text-sm font-medium border transition-colors hover:border-amber-400"
                style={{ borderColor: "rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.75)" }}>
                Send a Message
              </button>
              <button onClick={() => onOpenPopup("support")}
                className="w-full py-2.5 rounded-lg text-sm font-medium border transition-colors hover:border-amber-400"
                style={{ borderColor: "rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.75)" }}>
                Support
              </button>
            </div>
            <div className="mt-5 pt-5 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              <Link href="/action-manager">
                <span className="text-sm font-medium cursor-pointer hover:text-amber-400 transition-colors"
                  style={{ color: "#A68A64" }}>
                  Client Portal Login →
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4 text-xs"
          style={{ borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.35)" }}>
          <span>© {new Date().getFullYear()} 369 Alliance Pty Ltd. All rights reserved. ABN: [To be obtained]</span>
          <div className="flex gap-5">
            <span className="hover:text-white/60 cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-white/60 cursor-pointer transition-colors">Terms of Service</span>
            <span className="hover:text-white/60 cursor-pointer transition-colors">Disclaimer</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
