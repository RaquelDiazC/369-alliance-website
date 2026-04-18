/**
 * 369 Alliance – Website Navigation Header
 * Premium sticky nav — editorial feel, no AI patterns
 */

import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { type PopupType } from "./ContactPopups";
import { Logo369 } from "@/components/Logo369";

interface WebsiteNavProps {
  onOpenPopup: (t: PopupType) => void;
  onOpenSignIn?: () => void;
}

export function WebsiteNav({ onOpenPopup, onOpenSignIn }: WebsiteNavProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const navLinks = [
    { label: "Home", href: "/website" },
    { label: "Services", href: "/website/services" },
    { label: "About", href: "/website/about" },
    { label: "Contact", href: "/website/contact" },
  ];

  const isActive = (href: string) => {
    if (href === "/website") return location === "/website";
    return location.startsWith(href);
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-[100] transition-all duration-500"
      style={{
        background: scrolled ? "rgba(15,15,30,0.98)" : "transparent",
        backdropFilter: scrolled ? "blur(16px) saturate(1.2)" : "none",
        borderBottom: scrolled ? "1px solid rgba(166,138,100,0.12)" : "1px solid transparent",
      }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 flex items-center justify-between"
        style={{ height: scrolled ? "64px" : "76px", transition: "height 0.4s ease" }}>

        {/* Logo — minimal mark */}
        <Link href="/website">
          <div className="flex items-center gap-3 cursor-pointer group">
            <Logo369
              size={38}
              variant="dark"
              className="transition-transform duration-300 group-hover:scale-105"
            />
            <div className="hidden sm:block">
              <div className="font-black leading-none tracking-tight"
                style={{ color: "#fff", fontFamily: "'Montserrat', sans-serif", fontSize: "1.1rem" }}>
                369<span className="font-medium text-xs ml-1.5 tracking-widest" style={{ color: "rgba(255,255,255,0.5)" }}>ALLIANCE</span>
              </div>
            </div>
          </div>
        </Link>

        {/* Desktop nav — clean, minimal */}
        <nav className="hidden md:flex items-center gap-0.5">
          {navLinks.map(l => (
            <Link key={l.href} href={l.href}>
              <span className="relative px-4 py-2 text-[13px] font-medium tracking-wide cursor-pointer transition-colors duration-200"
                style={{ color: isActive(l.href) ? "#A68A64" : "rgba(255,255,255,0.65)" }}>
                {l.label}
                {isActive(l.href) && (
                  <span className="absolute bottom-0 left-4 right-4 h-px" style={{ background: "#A68A64" }} />
                )}
              </span>
            </Link>
          ))}
        </nav>

        {/* CTA cluster */}
        <div className="hidden md:flex items-center gap-2.5">
          <button
            onClick={() => onOpenSignIn?.()}
            className="px-4 py-2 text-[13px] font-medium tracking-wide transition-colors duration-200"
            style={{ color: "rgba(255,255,255,0.6)" }}>
            Client Login
          </button>
          <button
            onClick={() => onOpenPopup("quote")}
            className="group flex items-center gap-1.5 px-5 py-2.5 text-[13px] font-semibold tracking-wide text-white transition-all duration-300 hover:shadow-lg hover:shadow-amber-900/20"
            style={{
              background: "linear-gradient(135deg, #7A6342 0%, #A68A64 100%)",
              borderRadius: "4px",
            }}>
            Get a Quote
            <ArrowUpRight size={13} className="opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </button>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-white/80 hover:text-white transition-colors" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden px-6 pb-6 pt-2" style={{ background: "rgba(15,15,30,0.98)", backdropFilter: "blur(16px)" }}>
          {navLinks.map(l => (
            <Link key={l.href} href={l.href}>
              <div onClick={() => setMenuOpen(false)}
                className="flex items-center justify-between py-3 border-b cursor-pointer"
                style={{ borderColor: "rgba(255,255,255,0.06)", color: isActive(l.href) ? "#A68A64" : "rgba(255,255,255,0.75)" }}>
                <span className="text-sm font-medium">{l.label}</span>
                {isActive(l.href) && <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#A68A64" }} />}
              </div>
            </Link>
          ))}
          <div className="mt-5 flex flex-col gap-2.5">
            <button onClick={() => { onOpenPopup("quote"); setMenuOpen(false); }}
              className="w-full py-3 text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg,#7A6342,#A68A64)", borderRadius: "4px" }}>
              Get a Quote
            </button>
            <button
              onClick={() => { onOpenSignIn?.(); setMenuOpen(false); }}
              className="w-full py-3 text-sm font-medium border"
              style={{ borderColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)", borderRadius: "4px" }}>
              Client Login
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
