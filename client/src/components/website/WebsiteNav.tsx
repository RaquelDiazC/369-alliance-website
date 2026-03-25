/**
 * 369 Alliance – Website Navigation Header
 * Sticky nav with logo, links, and CTA button
 */

import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import { type PopupType } from "./ContactPopups";

interface WebsiteNavProps {
  onOpenPopup: (t: PopupType) => void;
}

export function WebsiteNav({ onOpenPopup }: WebsiteNavProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const navLinks = [
    { label: "Home", href: "/website" },
    { label: "Services", href: "/website/services" },
    { label: "About", href: "/website/about" },
    { label: "Contact", href: "/website/contact" },
  ];

  return (
    <header
      className="fixed top-0 left-0 right-0 z-[100] transition-all duration-300"
      style={{
        background: scrolled ? "rgba(26,26,46,0.97)" : "rgba(26,26,46,0.85)",
        backdropFilter: "blur(12px)",
        borderBottom: scrolled ? "1px solid rgba(166,138,100,0.2)" : "none",
        boxShadow: scrolled ? "0 4px 24px rgba(0,0,0,0.3)" : "none",
      }}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/website">
          <div className="flex items-center gap-2 cursor-pointer">
            {/* Nav logo — exact business card symbol */}
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310419663029262029/VyKdiatHMkCvCRqZzXD7NF/nav_symbol_tight_9c30a942.png"
              alt="369 Alliance symbol"
              width="40"
              height="40"
              style={{ objectFit: 'contain', borderRadius: '4px' }}
            />
            <div>
              <div className="font-black leading-none" style={{ color: "#ffffff", fontFamily: "'Montserrat', 'Arial Black', sans-serif", fontSize: "1.05rem", letterSpacing: "-0.01em" }}>
                369
              </div>
              <div className="font-medium" style={{ color: "#A68A64", fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "0.55rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>Alliance Pty Ltd</div>
            </div>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(l => (
            <Link key={l.href} href={l.href}>
              <span className="px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer"
                style={{ color: location.startsWith(l.href.split("#")[0]) && l.href !== "/website" ? "#A68A64" : "rgba(255,255,255,0.8)" }}>
                {l.label}
              </span>
            </Link>
          ))}
        </nav>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => onOpenPopup("quote")}
            className="px-5 py-2 rounded-full text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-lg"
            style={{ background: "linear-gradient(135deg,#7A6342,#A68A64)" }}>
            Get a Quote
          </button>
          <a
            href="https://alliance369-vykdiath.manus.space/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2 rounded-full text-sm font-semibold transition-all hover:opacity-90 hover:shadow-lg cursor-pointer inline-block"
            style={{ background: "linear-gradient(135deg,rgba(255,255,255,0.95),rgba(220,220,230,0.85))", color: "#1a1a2e", textDecoration: "none" }}>
            Client System
          </a>
        </div>

        {/* Mobile menu button */}
        <button className="md:hidden text-white" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t px-6 py-4 space-y-1" style={{ background: "#1a1a2e", borderColor: "rgba(166,138,100,0.2)" }}>
          {navLinks.map(l => (
            <Link key={l.href} href={l.href}>
              <div onClick={() => setMenuOpen(false)}
                className="block px-3 py-2.5 text-sm font-medium rounded-lg cursor-pointer"
                style={{ color: "rgba(255,255,255,0.85)" }}>
                {l.label}
              </div>
            </Link>
          ))}
          <div className="pt-3 flex flex-col gap-2">
            <button onClick={() => { onOpenPopup("quote"); setMenuOpen(false); }}
              className="w-full py-2.5 rounded-full text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg,#7A6342,#A68A64)" }}>
              Get a Quote
            </button>
            <a
              href="https://alliance369-vykdiath.manus.space/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMenuOpen(false)}
              className="w-full py-2.5 rounded-full text-sm font-semibold text-center cursor-pointer block"
              style={{ background: "linear-gradient(135deg,rgba(255,255,255,0.95),rgba(220,220,230,0.85))", color: "#1a1a2e", textDecoration: "none" }}>
              Client System
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
