/**
 * Apartment Design Guide — 2026 Edition
 * NSW Housing SEPP 2021 / SEPP 65 successor
 *
 * Modern, interactive guide with photorealistic-style SVG illustrations
 * replacing the 2015 line drawings. Print-friendly for PDF export.
 *
 * Brand: Navy #1a1a2e + Bronze #A68A64 + Amber #C07040
 */

import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import {
  ChevronRight, Sun, Wind, Ruler, Home, Trees, Eye,
  Building2, Accessibility, Volume2, ArrowDown, ArrowUp, ArrowRight,
  Printer, BookOpen, Menu, X, Sparkles
} from "lucide-react";
import { WebsiteNav } from "@/components/website/WebsiteNav";
import { WebsiteFooter } from "@/components/website/WebsiteFooter";

// ═══════════════════════════════════════════════════════════════
//                    DESIGN SYSTEM
// ═══════════════════════════════════════════════════════════════

const C = {
  navy: "#1a1a2e",
  navyDeep: "#0f1020",
  bronze: "#A68A64",
  bronzeDeep: "#7A6342",
  amber: "#C07040",
  cream: "#f8f7f4",
  paper: "#fcfbf8",
  ink: "#2a2a3a",
  inkSoft: "#5a5a6a",
  rule: "#d4cfc1",
  // Illustration palette
  sky: "#bfd8ea",
  skyLight: "#e6f0f7",
  sunGold: "#f5c842",
  sunGlow: "#ffd966",
  brick: "#a85e3c",
  brickDark: "#7a3f24",
  glass: "#9fc4d8",
  glassLight: "#cfe2ec",
  concrete: "#d1cdc2",
  concreteDark: "#9a9588",
  vegetation: "#5a8444",
  vegetationDark: "#3d5e2c",
  shadow: "#2a2a3a",
  ground: "#8b7e62",
};

// ═══════════════════════════════════════════════════════════════
//                    TABLE OF CONTENTS
// ═══════════════════════════════════════════════════════════════

const TOC = [
  {
    part: "Introduction",
    sections: [
      { id: "foreword", num: "", title: "Foreword & Purpose" },
      { id: "how-to-use", num: "", title: "How to use this guide" },
      { id: "principles", num: "", title: "9 Design Quality Principles" },
    ],
  },
  {
    part: "Part 1 — Identifying the Context",
    sections: [
      { id: "1A", num: "1A", title: "Apartment building types" },
      { id: "1B", num: "1B", title: "Local character and context" },
    ],
  },
  {
    part: "Part 2 — Developing the Controls",
    sections: [
      { id: "2C", num: "2C", title: "Building height" },
      { id: "2D", num: "2D", title: "Floor space ratio" },
      { id: "2E", num: "2E", title: "Building depth" },
      { id: "2F", num: "2F", title: "Building separation" },
      { id: "2G", num: "2G", title: "Street setbacks" },
      { id: "2H", num: "2H", title: "Side and rear setbacks" },
    ],
  },
  {
    part: "Part 3 — Siting the Development",
    sections: [
      { id: "3B", num: "3B", title: "Orientation" },
      { id: "3C", num: "3C", title: "Public domain interface" },
      { id: "3D", num: "3D", title: "Communal & public open space" },
      { id: "3E", num: "3E", title: "Deep soil zones" },
      { id: "3F", num: "3F", title: "Visual privacy" },
      { id: "3J", num: "3J", title: "Bicycle and car parking" },
    ],
  },
  {
    part: "Part 4 — Designing the Building",
    sections: [
      { id: "4A", num: "4A", title: "Solar and daylight access" },
      { id: "4B", num: "4B", title: "Natural ventilation" },
      { id: "4C", num: "4C", title: "Ceiling heights" },
      { id: "4D", num: "4D", title: "Apartment size and layout" },
      { id: "4E", num: "4E", title: "Private open space and balconies" },
      { id: "4F", num: "4F", title: "Common circulation and spaces" },
      { id: "4G", num: "4G", title: "Storage" },
      { id: "4H", num: "4H", title: "Acoustic privacy" },
      { id: "4M", num: "4M", title: "Facades" },
      { id: "4O", num: "4O", title: "Landscape design" },
      { id: "4Q", num: "4Q", title: "Universal design" },
      { id: "4U", num: "4U", title: "Energy efficiency" },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════
//                    SCROLL OBSERVER
// ═══════════════════════════════════════════════════════════════

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add("adg-visible");
          obs.unobserve(el);
        }
      },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useReveal();
  return (
    <div ref={ref} className={`adg-reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//                    REUSABLE COMPONENTS
// ═══════════════════════════════════════════════════════════════

function SectionHeader({ part, num, title, intro }: { part: string; num: string; title: string; intro: string }) {
  return (
    <div className="mb-12 print:mb-8">
      <div className="flex items-baseline gap-4 mb-2">
        <span className="text-sm font-mono uppercase tracking-[0.3em]" style={{ color: C.bronze }}>
          {part}
        </span>
      </div>
      <div className="flex items-end gap-6 mb-6">
        {num && (
          <span className="font-display text-7xl md:text-8xl font-light leading-none" style={{ color: C.bronze, letterSpacing: "-0.04em" }}>
            {num}
          </span>
        )}
        <h2 className="font-display text-3xl md:text-5xl font-light leading-tight pb-2" style={{ color: C.navy, letterSpacing: "-0.02em" }}>
          {title}
        </h2>
      </div>
      <div className="h-px w-24 mb-6" style={{ background: C.bronze }} />
      <p className="text-lg leading-relaxed max-w-3xl" style={{ color: C.inkSoft }}>
        {intro}
      </p>
    </div>
  );
}

function Objective({ code, title, children }: { code: string; title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8 print:break-inside-avoid">
      <div className="flex items-start gap-4 mb-3">
        <div className="flex-shrink-0 mt-1">
          <div className="px-3 py-1 text-xs font-mono uppercase tracking-wider rounded-sm"
               style={{ background: C.navy, color: C.cream }}>
            Objective {code}
          </div>
        </div>
      </div>
      <h3 className="font-display text-xl md:text-2xl font-medium mb-4 leading-snug" style={{ color: C.navy }}>
        {title}
      </h3>
      <div className="text-base leading-relaxed" style={{ color: C.ink }}>
        {children}
      </div>
    </div>
  );
}

function Criteria({ items }: { items: { num: number; text: string; metric?: string }[] }) {
  return (
    <div className="rounded-sm border-l-4 p-6 my-6 print:break-inside-avoid"
         style={{ background: "#fbf8f0", borderColor: C.amber }}>
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={16} style={{ color: C.amber }} />
        <span className="text-xs font-mono uppercase tracking-[0.2em] font-bold" style={{ color: C.amber }}>
          Design Criteria
        </span>
      </div>
      <ol className="space-y-3">
        {items.map((item) => (
          <li key={item.num} className="flex gap-4">
            <span className="flex-shrink-0 w-6 h-6 rounded-full text-xs font-mono flex items-center justify-center"
                  style={{ background: C.amber, color: "#fff" }}>
              {item.num}
            </span>
            <div className="flex-1">
              <p className="text-sm md:text-base leading-relaxed" style={{ color: C.ink }}>
                {item.text}
              </p>
              {item.metric && (
                <p className="mt-1 text-sm font-mono" style={{ color: C.amber }}>
                  → {item.metric}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Guidance({ items }: { items: string[] }) {
  return (
    <div className="my-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-mono uppercase tracking-[0.2em] font-medium" style={{ color: C.bronze }}>
          Design Guidance
        </span>
        <div className="flex-1 h-px" style={{ background: C.rule }} />
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex gap-3 text-sm md:text-base leading-relaxed" style={{ color: C.ink }}>
            <span className="flex-shrink-0 mt-2 w-1 h-1 rounded-full" style={{ background: C.bronze }} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Caption({ figure, children }: { figure: string; children: React.ReactNode }) {
  return (
    <p className="mt-3 text-xs italic leading-relaxed" style={{ color: C.inkSoft }}>
      <span className="font-mono uppercase not-italic mr-2" style={{ color: C.bronze }}>
        {figure}
      </span>
      {children}
    </p>
  );
}

// ═══════════════════════════════════════════════════════════════
//                    REALISTIC SVG ILLUSTRATIONS
// ═══════════════════════════════════════════════════════════════

// ─── Sun path & solar access ─────────────────────────────────────
function SolarPathDiagram() {
  return (
    <svg viewBox="0 0 800 480" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sky-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#dbe9f4" />
          <stop offset="60%" stopColor="#f4ede0" />
          <stop offset="100%" stopColor={C.cream} />
        </linearGradient>
        <linearGradient id="bldg-front" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8dfc8" />
          <stop offset="100%" stopColor="#c9bfa5" />
        </linearGradient>
        <linearGradient id="bldg-side" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#9a8e75" />
          <stop offset="100%" stopColor="#776c58" />
        </linearGradient>
        <radialGradient id="sun-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={C.sunGlow} stopOpacity="0.9" />
          <stop offset="50%" stopColor={C.sunGold} stopOpacity="0.4" />
          <stop offset="100%" stopColor={C.sunGold} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="winter-ray" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={C.sunGold} stopOpacity="0.7" />
          <stop offset="100%" stopColor={C.sunGold} stopOpacity="0.05" />
        </linearGradient>
        <linearGradient id="summer-ray" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.amber} stopOpacity="0.6" />
          <stop offset="100%" stopColor={C.amber} stopOpacity="0.05" />
        </linearGradient>
      </defs>

      {/* Sky */}
      <rect x="0" y="0" width="800" height="380" fill="url(#sky-grad)" />
      <rect x="0" y="380" width="800" height="100" fill={C.cream} />
      <line x1="0" y1="380" x2="800" y2="380" stroke={C.ink} strokeWidth="0.5" opacity="0.3" />

      {/* Sun arc */}
      <path d="M 60 380 Q 400 -40 740 380" stroke={C.bronze} strokeWidth="1" strokeDasharray="3 4" fill="none" opacity="0.5" />

      {/* Summer sun (high) */}
      <g>
        <circle cx="400" cy="60" r="60" fill="url(#sun-glow)" />
        <circle cx="400" cy="60" r="22" fill={C.sunGold} />
        <circle cx="400" cy="60" r="14" fill={C.sunGlow} />
      </g>

      {/* Winter sun (low) */}
      <g opacity="0.85">
        <circle cx="180" cy="220" r="40" fill="url(#sun-glow)" />
        <circle cx="180" cy="220" r="16" fill={C.sunGold} />
      </g>

      {/* Sun rays — Summer (steep) */}
      <g opacity="0.55">
        {[0, 1, 2, 3, 4].map((i) => (
          <line key={`sm-${i}`}
            x1={400 + i * 14}
            y1={80}
            x2={420 + i * 14}
            y2={380}
            stroke={C.amber} strokeWidth="2" opacity="0.4" />
        ))}
      </g>

      {/* Sun rays — Winter (shallow) */}
      <g opacity="0.7">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <line key={`wt-${i}`}
            x1={210}
            y1={232 + i * 4}
            x2={560}
            y2={345 + i * 4}
            stroke={C.sunGold} strokeWidth="2" opacity="0.5" />
        ))}
      </g>

      {/* Building — 3D isometric apartment block */}
      <g>
        {/* Side face (shadow side) */}
        <polygon points="540,140 540,380 600,380 600,160" fill="url(#bldg-side)" />
        {/* Front face */}
        <polygon points="540,140 540,380 360,380 360,140" fill="url(#bldg-front)" />
        {/* Roof */}
        <polygon points="360,140 540,140 600,160 420,160" fill="#a89a7e" />

        {/* Windows — 4 floors x 4 windows */}
        {[0, 1, 2, 3].map((row) => (
          [0, 1, 2, 3].map((col) => (
            <g key={`w-${row}-${col}`}>
              <rect
                x={372 + col * 42}
                y={158 + row * 55}
                width="28" height="40"
                fill={C.glass}
                stroke={C.navy} strokeWidth="0.5"
              />
              <rect
                x={372 + col * 42}
                y={158 + row * 55}
                width="28" height="20"
                fill={C.glassLight} opacity="0.6"
              />
              {/* Frame */}
              <line x1={386 + col * 42} y1={158 + row * 55} x2={386 + col * 42} y2={198 + row * 55}
                    stroke={C.navy} strokeWidth="0.5" />
            </g>
          ))
        )).flat()}

        {/* Balconies */}
        {[0, 1, 2, 3].map((row) => (
          <g key={`b-${row}`}>
            <rect x={368} y={194 + row * 55} width="170" height="3" fill={C.concreteDark} />
            <rect x={368} y={197 + row * 55} width="170" height="6" fill={C.concrete} />
            {[...Array(15)].map((_, i) => (
              <line key={i}
                x1={372 + i * 11} y1={197 + row * 55}
                x2={372 + i * 11} y2={205 + row * 55}
                stroke={C.navy} strokeWidth="0.4" opacity="0.5" />
            ))}
          </g>
        ))}

        {/* Ground line shadow */}
        <ellipse cx="465" cy="385" rx="120" ry="8" fill={C.shadow} opacity="0.25" />
      </g>

      {/* Annotations: 79° summer */}
      <g>
        <path d="M 540 280 L 470 380" stroke={C.amber} strokeWidth="1.5" strokeDasharray="2 3" fill="none" />
        <text x="500" y="320" fontSize="13" fontFamily="ui-monospace" fill={C.amber} fontWeight="bold">79°</text>
        <text x="495" y="335" fontSize="9" fontFamily="ui-monospace" fill={C.amber}>summer</text>
      </g>

      {/* Annotations: 33° winter */}
      <g>
        <path d="M 540 350 L 280 380" stroke={C.sunGold} strokeWidth="1.5" strokeDasharray="2 3" fill="none" />
        <text x="350" y="370" fontSize="13" fontFamily="ui-monospace" fill={C.bronzeDeep} fontWeight="bold">33°</text>
        <text x="350" y="378" fontSize="9" fontFamily="ui-monospace" fill={C.bronzeDeep}>winter</text>
      </g>

      {/* North arrow */}
      <g transform="translate(720, 60)">
        <circle cx="0" cy="0" r="22" fill="white" stroke={C.navy} strokeWidth="1" />
        <polygon points="0,-15 6,8 0,3 -6,8" fill={C.navy} />
        <text x="0" y="-26" textAnchor="middle" fontSize="10" fontFamily="ui-monospace" fill={C.navy} fontWeight="bold">N</text>
      </g>

      {/* Compass labels */}
      <text x="40" y="380" fontSize="11" fontFamily="ui-monospace" fill={C.inkSoft}>EAST →</text>
      <text x="730" y="395" fontSize="11" fontFamily="ui-monospace" fill={C.inkSoft} textAnchor="end">← WEST</text>
    </svg>
  );
}

// ─── Sun access in winter — 70% rule ─────────────────────────────
function SolarAccessRule() {
  return (
    <svg viewBox="0 0 800 360" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ap-lit" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff7d6" />
          <stop offset="100%" stopColor="#f5dfa0" />
        </linearGradient>
        <linearGradient id="ap-dark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7a7a90" />
          <stop offset="100%" stopColor="#4a4a5a" />
        </linearGradient>
        <linearGradient id="ground-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a89c7c" />
          <stop offset="100%" stopColor="#7a6f54" />
        </linearGradient>
      </defs>

      {/* Sky */}
      <rect x="0" y="0" width="800" height="280" fill={C.skyLight} />
      <rect x="0" y="280" width="800" height="80" fill="url(#ground-grad)" />

      {/* Sun */}
      <circle cx="100" cy="80" r="35" fill={C.sunGold} opacity="0.5" />
      <circle cx="100" cy="80" r="18" fill={C.sunGlow} />
      <text x="100" y="135" fontSize="11" textAnchor="middle" fill={C.bronze} fontFamily="ui-monospace">Mid-winter sun</text>

      {/* Sun rays as wide cone */}
      <g opacity="0.25">
        <polygon points="110,90 800,180 800,260 130,100" fill={C.sunGold} />
      </g>

      {/* Apartment grid — 5x4 = 20 apartments, 14 lit (70%) */}
      <g transform="translate(220, 140)">
        {[0, 1, 2, 3, 4].map((col) => (
          [0, 1, 2, 3].map((row) => {
            // 70% lit pattern — 14 of 20
            const isLit = !((col === 4 && row === 3) || (col === 4 && row === 2) ||
                            (col === 0 && row === 0) || (col === 3 && row === 3) ||
                            (col === 4 && row === 0) || (col === 1 && row === 0));
            return (
              <g key={`${col}-${row}`}>
                <rect
                  x={col * 90}
                  y={row * 35}
                  width="86" height="32"
                  fill={isLit ? "url(#ap-lit)" : "url(#ap-dark)"}
                  stroke={C.navy} strokeWidth="0.8"
                  rx="1"
                />
                {isLit && (
                  <g opacity="0.7">
                    <circle cx={col * 90 + 70} cy={row * 35 + 8} r="3" fill={C.sunGold} />
                    <line x1={col * 90 + 70} y1={row * 35 + 12} x2={col * 90 + 70} y2={row * 35 + 18} stroke={C.sunGold} strokeWidth="1" />
                  </g>
                )}
                {/* Window mullion */}
                <line x1={col * 90 + 43} y1={row * 35 + 4} x2={col * 90 + 43} y2={row * 35 + 28}
                      stroke={C.navy} strokeWidth="0.4" opacity="0.4" />
              </g>
            );
          })
        )).flat()}

        {/* Ground line */}
        <line x1="-10" y1="140" x2="466" y2="140" stroke={C.navy} strokeWidth="1.5" />
      </g>

      {/* Stat callouts */}
      <g transform="translate(60, 240)">
        <rect x="0" y="0" width="120" height="60" fill="white" stroke={C.amber} strokeWidth="1" rx="2" />
        <text x="60" y="22" textAnchor="middle" fontSize="22" fontFamily="ui-monospace" fontWeight="bold" fill={C.amber}>≥ 70%</text>
        <text x="60" y="40" textAnchor="middle" fontSize="9" fill={C.inkSoft}>apartments receive</text>
        <text x="60" y="52" textAnchor="middle" fontSize="9" fill={C.inkSoft}>2hrs direct sunlight</text>
      </g>

      <g transform="translate(680, 240)">
        <rect x="0" y="0" width="100" height="60" fill="white" stroke={C.navy} strokeWidth="1" rx="2" />
        <text x="50" y="22" textAnchor="middle" fontSize="22" fontFamily="ui-monospace" fontWeight="bold" fill={C.navy}>≤ 15%</text>
        <text x="50" y="40" textAnchor="middle" fontSize="9" fill={C.inkSoft}>receive no</text>
        <text x="50" y="52" textAnchor="middle" fontSize="9" fill={C.inkSoft}>direct sunlight</text>
      </g>

      <text x="400" y="335" textAnchor="middle" fontSize="11" fill={C.ink} fontStyle="italic">
        Sydney metropolitan • Newcastle • Wollongong — measured 9am to 3pm, 21 June
      </text>
    </svg>
  );
}

// ─── Cross ventilation diagram ───────────────────────────────────
function CrossVentilationDiagram() {
  return (
    <svg viewBox="0 0 800 380" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="apt-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f5f0e0" />
          <stop offset="100%" stopColor="#e0d5b8" />
        </linearGradient>
        <linearGradient id="wind-arrow" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#5da9d4" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#2d7caa" stopOpacity="0.9" />
        </linearGradient>
        <marker id="arrow-blue" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#2d7caa" />
        </marker>
      </defs>

      <rect width="800" height="380" fill={C.paper} />

      {/* Floor plate plan view of apartment building */}
      <g transform="translate(120, 60)">
        {/* Outer building outline */}
        <rect x="0" y="0" width="560" height="240" fill="url(#apt-floor)" stroke={C.navy} strokeWidth="2" />

        {/* Corridor */}
        <rect x="20" y="105" width="520" height="30" fill={C.concrete} stroke={C.navy} strokeWidth="0.8" opacity="0.5" />
        <text x="280" y="125" textAnchor="middle" fontSize="10" fill={C.inkSoft} fontFamily="ui-monospace">CORRIDOR</text>

        {/* Apartments — top row (5 apts cross-through) */}
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={`top-${i}`}>
            <rect x={20 + i * 104} y="20" width="104" height="85"
                  fill="none" stroke={C.navy} strokeWidth="0.8" />
            {/* Internal walls */}
            <line x1={20 + i * 104 + 40} y1="50" x2={20 + i * 104 + 40} y2="105"
                  stroke={C.navy} strokeWidth="0.5" opacity="0.5" />
            <line x1={20 + i * 104 + 40} y1="50" x2={20 + i * 104 + 104} y2="50"
                  stroke={C.navy} strokeWidth="0.5" opacity="0.5" />
          </g>
        ))}

        {/* Apartments — bottom row (3 single aspect) */}
        {[0, 1, 2].map((i) => (
          <g key={`bot-${i}`}>
            <rect x={20 + i * 173} y="135" width="173" height="85"
                  fill="none" stroke={C.navy} strokeWidth="0.8" />
            <line x1={20 + i * 173 + 90} y1="135" x2={20 + i * 173 + 90} y2="180"
                  stroke={C.navy} strokeWidth="0.5" opacity="0.5" />
          </g>
        ))}

        {/* Windows (top) */}
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={`tw-${i}`} x={32 + i * 104} y="17" width="80" height="6"
                fill={C.glass} stroke={C.navy} strokeWidth="0.5" />
        ))}
        {/* Windows (bottom) */}
        {[0, 1, 2].map((i) => (
          <rect key={`bw-${i}`} x={32 + i * 173} y="217" width="149" height="6"
                fill={C.glass} stroke={C.navy} strokeWidth="0.5" />
        ))}

        {/* Cross ventilation arrows for top row */}
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={`vt-${i}`}>
            <path d={`M ${20 + i * 104 + 52} -5 L ${20 + i * 104 + 52} 230`}
                  stroke="url(#wind-arrow)" strokeWidth="14" fill="none"
                  opacity="0.45" markerEnd="url(#arrow-blue)" />
          </g>
        ))}

        {/* Single aspect — limited airflow indicator */}
        {[0, 1, 2].map((i) => (
          <g key={`sa-${i}`}>
            <path d={`M ${20 + i * 173 + 86} 240 L ${20 + i * 173 + 86} 195`}
                  stroke="#a35858" strokeWidth="3" fill="none"
                  strokeDasharray="4 3" opacity="0.6" markerEnd="url(#arrow-blue)" />
          </g>
        ))}

        {/* Apt labels */}
        {[0, 1, 2, 3, 4].map((i) => (
          <text key={`lt-${i}`} x={20 + i * 104 + 52} y="65" textAnchor="middle"
                fontSize="9" fill={C.bronze} fontFamily="ui-monospace" fontWeight="bold">
            CROSS-THROUGH
          </text>
        ))}
        {[0, 1, 2].map((i) => (
          <text key={`lb-${i}`} x={20 + i * 173 + 86} y="180" textAnchor="middle"
                fontSize="9" fill={C.inkSoft} fontFamily="ui-monospace" fontWeight="bold">
            SINGLE ASPECT
          </text>
        ))}

        {/* Building depth indicator */}
        <g>
          <line x1="-15" y1="0" x2="-15" y2="240" stroke={C.amber} strokeWidth="1" />
          <line x1="-20" y1="0" x2="-10" y2="0" stroke={C.amber} strokeWidth="1" />
          <line x1="-20" y1="240" x2="-10" y2="240" stroke={C.amber} strokeWidth="1" />
          <text x="-22" y="125" textAnchor="end" fontSize="11" fill={C.amber} fontFamily="ui-monospace" fontWeight="bold">
            ≤ 18m
          </text>
          <text x="-22" y="138" textAnchor="end" fontSize="9" fill={C.amber} fontFamily="ui-monospace">
            building depth
          </text>
        </g>
      </g>

      {/* Wind direction label (top) */}
      <text x="400" y="40" textAnchor="middle" fontSize="12" fill="#2d7caa" fontFamily="ui-monospace" fontWeight="bold">
        ↓ PREVAILING NE BREEZE
      </text>
      <text x="400" y="350" textAnchor="middle" fontSize="11" fill={C.inkSoft} fontFamily="ui-monospace">
        EXHAUST AIR ↓
      </text>

      {/* Stats */}
      <g transform="translate(20, 20)">
        <rect x="0" y="0" width="90" height="60" fill={C.amber} rx="2" />
        <text x="45" y="22" textAnchor="middle" fontSize="20" fontFamily="ui-monospace" fontWeight="bold" fill="white">≥ 60%</text>
        <text x="45" y="38" textAnchor="middle" fontSize="8" fill="white">cross-vented</text>
        <text x="45" y="50" textAnchor="middle" fontSize="8" fill="white">first 9 storeys</text>
      </g>
    </svg>
  );
}

// ─── Building section — ceiling heights ──────────────────────────
function CeilingHeightsDiagram() {
  return (
    <svg viewBox="0 0 800 460" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ch-resi" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f5e6c8" />
          <stop offset="100%" stopColor="#e3cb95" />
        </linearGradient>
        <linearGradient id="ch-mixed" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d8c8a0" />
          <stop offset="100%" stopColor="#bca57a" />
        </linearGradient>
        <linearGradient id="ch-retail" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c4a878" />
          <stop offset="100%" stopColor="#9a805a" />
        </linearGradient>
      </defs>

      <rect width="800" height="460" fill={C.paper} />

      {/* Sky */}
      <rect x="0" y="0" width="800" height="60" fill={C.skyLight} />
      <line x1="0" y1="430" x2="800" y2="430" stroke={C.ground} strokeWidth="2" />
      <rect x="0" y="430" width="800" height="30" fill={C.ground} opacity="0.4" />

      {/* Building section — left column = mixed use, right column = residential */}

      {/* Mixed-use building (left) */}
      <g transform="translate(80, 60)">
        {/* Roof */}
        <polygon points="0,0 180,0 180,15 0,15" fill={C.brick} />

        {/* Floor 5 — Residential top */}
        <rect x="0" y="15" width="180" height="65" fill="url(#ch-resi)" stroke={C.navy} strokeWidth="0.8" />
        <text x="90" y="55" textAnchor="middle" fontSize="11" fill={C.navy} fontWeight="bold">2.7m</text>
        <text x="90" y="70" textAnchor="middle" fontSize="8" fill={C.inkSoft}>habitable</text>

        {/* Floor 4 */}
        <rect x="0" y="80" width="180" height="65" fill="url(#ch-resi)" stroke={C.navy} strokeWidth="0.8" />
        <text x="90" y="120" textAnchor="middle" fontSize="11" fill={C.navy} fontWeight="bold">2.7m</text>
        <text x="90" y="135" textAnchor="middle" fontSize="8" fill={C.inkSoft}>habitable</text>

        {/* Floor 3 */}
        <rect x="0" y="145" width="180" height="65" fill="url(#ch-resi)" stroke={C.navy} strokeWidth="0.8" />
        <text x="90" y="185" textAnchor="middle" fontSize="11" fill={C.navy} fontWeight="bold">2.7m</text>
        <text x="90" y="200" textAnchor="middle" fontSize="8" fill={C.inkSoft}>habitable</text>

        {/* Floor 2 */}
        <rect x="0" y="210" width="180" height="65" fill="url(#ch-resi)" stroke={C.navy} strokeWidth="0.8" />
        <text x="90" y="250" textAnchor="middle" fontSize="11" fill={C.navy} fontWeight="bold">2.7m</text>
        <text x="90" y="265" textAnchor="middle" fontSize="8" fill={C.inkSoft}>habitable</text>

        {/* Floor 1 — Mixed use (residential transition) */}
        <rect x="0" y="275" width="180" height="80" fill="url(#ch-mixed)" stroke={C.navy} strokeWidth="0.8" />
        <text x="90" y="320" textAnchor="middle" fontSize="11" fill={C.navy} fontWeight="bold">3.3m</text>
        <text x="90" y="335" textAnchor="middle" fontSize="8" fill={C.inkSoft}>mixed use floor</text>

        {/* Ground floor — Retail/Cafe */}
        <rect x="0" y="355" width="180" height="115" fill="url(#ch-retail)" stroke={C.navy} strokeWidth="0.8" />
        <text x="90" y="410" textAnchor="middle" fontSize="13" fill="white" fontWeight="bold">4.0m</text>
        <text x="90" y="425" textAnchor="middle" fontSize="8" fill="white">cafe / restaurant</text>

        {/* Storefront windows */}
        <rect x="20" y="395" width="35" height="55" fill={C.glassLight} stroke={C.navy} strokeWidth="0.5" opacity="0.7" />
        <rect x="65" y="395" width="35" height="55" fill={C.glassLight} stroke={C.navy} strokeWidth="0.5" opacity="0.7" />
        <rect x="110" y="395" width="35" height="55" fill={C.glassLight} stroke={C.navy} strokeWidth="0.5" opacity="0.7" />

        {/* Apartment windows on each floor */}
        {[0, 1, 2, 3].map((i) => (
          <g key={`mu-w-${i}`}>
            <rect x={20} y={30 + i * 65} width="40" height="35" fill={C.glass} stroke={C.navy} strokeWidth="0.4" />
            <rect x={70} y={30 + i * 65} width="40" height="35" fill={C.glass} stroke={C.navy} strokeWidth="0.4" />
            <rect x={120} y={30 + i * 65} width="40" height="35" fill={C.glass} stroke={C.navy} strokeWidth="0.4" />
          </g>
        ))}

        {/* Total height marker */}
        <line x1="-25" y1="15" x2="-25" y2="470" stroke={C.amber} strokeWidth="1" />
        <line x1="-30" y1="15" x2="-20" y2="15" stroke={C.amber} strokeWidth="1" />
        <line x1="-30" y1="470" x2="-20" y2="470" stroke={C.amber} strokeWidth="1" />

        {/* Title */}
        <text x="90" y="-25" textAnchor="middle" fontSize="12" fill={C.navy} fontWeight="bold">MIXED USE</text>
        <text x="90" y="-10" textAnchor="middle" fontSize="9" fill={C.inkSoft} fontStyle="italic">flexible ground floor</text>
      </g>

      {/* Pure residential building (right) */}
      <g transform="translate(450, 60)">
        <polygon points="0,0 180,0 180,15 0,15" fill={C.brick} />

        {/* 6 residential floors at 2.7m */}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <g key={`res-f-${i}`}>
            <rect x="0" y={15 + i * 65} width="180" height="65" fill="url(#ch-resi)" stroke={C.navy} strokeWidth="0.8" />
            <text x="90" y={56 + i * 65} textAnchor="middle" fontSize="11" fill={C.navy} fontWeight="bold">2.7m</text>
            <text x="90" y={70 + i * 65} textAnchor="middle" fontSize="8" fill={C.inkSoft}>habitable</text>
            {/* Windows */}
            <rect x={20} y={32 + i * 65} width="40" height="35" fill={C.glass} stroke={C.navy} strokeWidth="0.4" />
            <rect x={70} y={32 + i * 65} width="40" height="35" fill={C.glass} stroke={C.navy} strokeWidth="0.4" />
            <rect x={120} y={32 + i * 65} width="40" height="35" fill={C.glass} stroke={C.navy} strokeWidth="0.4" />
          </g>
        ))}

        {/* Ground floor — extra height for entry */}
        <rect x="0" y="405" width="180" height="65" fill="url(#ch-mixed)" stroke={C.navy} strokeWidth="0.8" />
        <text x="90" y="445" textAnchor="middle" fontSize="11" fill={C.navy} fontWeight="bold">2.7m</text>
        <text x="90" y="460" textAnchor="middle" fontSize="8" fill={C.inkSoft}>ground floor entry</text>

        {/* Title */}
        <text x="90" y="-25" textAnchor="middle" fontSize="12" fill={C.navy} fontWeight="bold">RESIDENTIAL</text>
        <text x="90" y="-10" textAnchor="middle" fontSize="9" fill={C.inkSoft} fontStyle="italic">consistent floor heights</text>
      </g>

      {/* Legend / spec callout */}
      <g transform="translate(645, 80)">
        <rect x="0" y="0" width="135" height="200" fill="white" stroke={C.bronze} strokeWidth="1" rx="2" />
        <text x="10" y="20" fontSize="10" fontFamily="ui-monospace" fill={C.bronze} fontWeight="bold">MINIMUMS</text>

        <line x1="10" y1="28" x2="125" y2="28" stroke={C.rule} />

        <text x="10" y="48" fontSize="9" fill={C.ink}>Habitable</text>
        <text x="125" y="48" textAnchor="end" fontSize="11" fontWeight="bold" fill={C.navy} fontFamily="ui-monospace">2.7m</text>

        <text x="10" y="68" fontSize="9" fill={C.ink}>Non-habitable</text>
        <text x="125" y="68" textAnchor="end" fontSize="11" fontWeight="bold" fill={C.navy} fontFamily="ui-monospace">2.4m</text>

        <text x="10" y="88" fontSize="9" fill={C.ink}>Adaptable</text>
        <text x="125" y="88" textAnchor="end" fontSize="11" fontWeight="bold" fill={C.navy} fontFamily="ui-monospace">2.4m</text>

        <text x="10" y="108" fontSize="9" fill={C.ink}>Mixed-use floor</text>
        <text x="125" y="108" textAnchor="end" fontSize="11" fontWeight="bold" fill={C.navy} fontFamily="ui-monospace">3.3m</text>

        <text x="10" y="128" fontSize="9" fill={C.ink}>Cafe/restaurant</text>
        <text x="125" y="128" textAnchor="end" fontSize="11" fontWeight="bold" fill={C.amber} fontFamily="ui-monospace">4.0m</text>

        <line x1="10" y1="140" x2="125" y2="140" stroke={C.rule} />

        <text x="10" y="158" fontSize="8" fill={C.inkSoft}>Attic spaces</text>
        <text x="125" y="158" textAnchor="end" fontSize="10" fill={C.inkSoft} fontFamily="ui-monospace">1.8m</text>

        <text x="10" y="178" fontSize="8" fill={C.inkSoft} fontStyle="italic">FFL → FCL</text>
      </g>
    </svg>
  );
}

// ─── Apartment floor plan with dimensions ────────────────────────
function ApartmentLayoutPlan() {
  return (
    <svg viewBox="0 0 800 460" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="floor-pattern" patternUnits="userSpaceOnUse" width="20" height="20">
          <rect width="20" height="20" fill="#f4ecd8" />
          <line x1="0" y1="0" x2="0" y2="20" stroke="#e0d4b0" strokeWidth="0.3" />
          <line x1="0" y1="0" x2="20" y2="0" stroke="#e0d4b0" strokeWidth="0.3" />
        </pattern>
        <pattern id="tile-pattern" patternUnits="userSpaceOnUse" width="14" height="14">
          <rect width="14" height="14" fill="#dde3e8" />
          <line x1="0" y1="0" x2="0" y2="14" stroke="#bcc4cc" strokeWidth="0.3" />
          <line x1="0" y1="0" x2="14" y2="0" stroke="#bcc4cc" strokeWidth="0.3" />
        </pattern>
        <pattern id="balcony-deck" patternUnits="userSpaceOnUse" width="40" height="6">
          <rect width="40" height="6" fill="#a89376" />
          <line x1="0" y1="0" x2="40" y2="0" stroke="#7a6849" strokeWidth="0.4" />
        </pattern>
      </defs>

      <rect width="800" height="460" fill={C.paper} />

      {/* 2-bed apartment plan */}
      <g transform="translate(80, 60)">
        {/* Outer wall */}
        <rect x="0" y="0" width="540" height="320" fill="none" stroke={C.navy} strokeWidth="3" />

        {/* Living/Dining */}
        <rect x="0" y="0" width="280" height="200" fill="url(#floor-pattern)" />
        <text x="140" y="90" textAnchor="middle" fontSize="14" fill={C.navy} fontWeight="bold">LIVING / DINING</text>
        <text x="140" y="108" textAnchor="middle" fontSize="10" fill={C.inkSoft} fontFamily="ui-monospace">≥ 25 m²</text>
        <text x="140" y="124" textAnchor="middle" fontSize="9" fill={C.inkSoft} fontStyle="italic">min 3.6m wide</text>

        {/* Kitchen */}
        <rect x="280" y="0" width="120" height="80" fill="url(#tile-pattern)" />
        <text x="340" y="36" textAnchor="middle" fontSize="11" fill={C.navy} fontWeight="bold">KITCHEN</text>
        <text x="340" y="52" textAnchor="middle" fontSize="9" fill={C.inkSoft} fontFamily="ui-monospace">≥ 6.0 m²</text>
        {/* Kitchen counters */}
        <rect x="285" y="5" width="110" height="14" fill="#cdb88f" stroke={C.navy} strokeWidth="0.3" />
        <rect x="285" y="60" width="50" height="14" fill="#cdb88f" stroke={C.navy} strokeWidth="0.3" />
        {/* Stove */}
        <rect x="290" y="6" width="20" height="12" fill="#3a3a3a" />
        <circle cx="294" cy="12" r="2" fill="#7a7a7a" />
        <circle cx="306" cy="12" r="2" fill="#7a7a7a" />
        {/* Sink */}
        <rect x="350" y="6" width="22" height="12" fill="#a8a8a8" rx="1" />

        {/* Bedroom 1 (master) */}
        <rect x="280" y="80" width="160" height="120" fill="url(#floor-pattern)" />
        <text x="360" y="130" textAnchor="middle" fontSize="13" fill={C.navy} fontWeight="bold">BEDROOM 1</text>
        <text x="360" y="146" textAnchor="middle" fontSize="9" fill={C.inkSoft} fontFamily="ui-monospace">≥ 10 m² · 3.0m wide</text>
        {/* Bed */}
        <rect x="298" y="155" width="62" height="38" fill="#d4c8a8" stroke={C.navy} strokeWidth="0.4" rx="2" />
        <rect x="304" y="158" width="50" height="10" fill="#fff" stroke={C.navy} strokeWidth="0.3" rx="1" />
        <rect x="304" y="170" width="50" height="20" fill="#e8dec0" stroke={C.navy} strokeWidth="0.3" />
        <text x="329" y="184" textAnchor="middle" fontSize="7" fill={C.inkSoft}>QUEEN</text>

        {/* Bedroom 2 */}
        <rect x="0" y="200" width="200" height="120" fill="url(#floor-pattern)" />
        <text x="100" y="248" textAnchor="middle" fontSize="13" fill={C.navy} fontWeight="bold">BEDROOM 2</text>
        <text x="100" y="264" textAnchor="middle" fontSize="9" fill={C.inkSoft} fontFamily="ui-monospace">≥ 9 m² · 3.0m wide</text>
        <rect x="20" y="275" width="55" height="32" fill="#d4c8a8" stroke={C.navy} strokeWidth="0.4" rx="2" />
        <rect x="25" y="278" width="45" height="8" fill="#fff" stroke={C.navy} strokeWidth="0.3" rx="1" />
        <rect x="25" y="288" width="45" height="16" fill="#e8dec0" stroke={C.navy} strokeWidth="0.3" />

        {/* Bathroom */}
        <rect x="200" y="200" width="80" height="120" fill="url(#tile-pattern)" />
        <text x="240" y="240" textAnchor="middle" fontSize="9" fill={C.navy} fontWeight="bold">BATH</text>
        {/* Toilet */}
        <ellipse cx="220" cy="265" rx="9" ry="11" fill="white" stroke={C.navy} strokeWidth="0.5" />
        {/* Shower */}
        <rect x="240" y="255" width="32" height="32" fill="white" stroke={C.navy} strokeWidth="0.5" />
        <line x1="240" y1="255" x2="272" y2="287" stroke={C.navy} strokeWidth="0.3" opacity="0.5" />
        <line x1="272" y1="255" x2="240" y2="287" stroke={C.navy} strokeWidth="0.3" opacity="0.5" />
        {/* Vanity */}
        <rect x="208" y="294" width="60" height="12" fill="#cdb88f" stroke={C.navy} strokeWidth="0.3" />
        <ellipse cx="238" cy="300" rx="6" ry="3" fill="white" stroke={C.navy} strokeWidth="0.3" />

        {/* Entry */}
        <rect x="280" y="200" width="60" height="120" fill="#e8e3d2" stroke={C.navy} strokeWidth="0.5" />
        <text x="310" y="258" textAnchor="middle" fontSize="9" fill={C.inkSoft} fontWeight="bold">ENTRY</text>
        {/* Door swing */}
        <path d="M 280 220 A 30 30 0 0 1 308 248" fill="none" stroke={C.navy} strokeWidth="0.4" strokeDasharray="2 2" />

        {/* Storage / Laundry */}
        <rect x="340" y="200" width="100" height="120" fill="#e0dac8" stroke={C.navy} strokeWidth="0.5" />
        <text x="390" y="240" textAnchor="middle" fontSize="9" fill={C.inkSoft} fontWeight="bold">STORAGE</text>
        <text x="390" y="252" textAnchor="middle" fontSize="9" fill={C.inkSoft} fontWeight="bold">/ LAUNDRY</text>
        <text x="390" y="270" textAnchor="middle" fontSize="8" fill={C.inkSoft} fontFamily="ui-monospace">≥ 8 m³</text>
        {/* Washing machine */}
        <rect x="350" y="280" width="22" height="22" fill="white" stroke={C.navy} strokeWidth="0.4" />
        <circle cx="361" cy="291" r="6" fill="none" stroke={C.navy} strokeWidth="0.5" />

        {/* Internal walls */}
        <line x1="280" y1="0" x2="280" y2="320" stroke={C.navy} strokeWidth="2" />
        <line x1="0" y1="200" x2="540" y2="200" stroke={C.navy} strokeWidth="2" />
        <line x1="200" y1="200" x2="200" y2="320" stroke={C.navy} strokeWidth="2" />
        <line x1="280" y1="80" x2="540" y2="80" stroke={C.navy} strokeWidth="2" />
        <line x1="280" y1="200" x2="280" y2="320" stroke={C.navy} strokeWidth="2" />
        <line x1="340" y1="200" x2="340" y2="320" stroke={C.navy} strokeWidth="2" />
        <line x1="440" y1="80" x2="440" y2="320" stroke={C.navy} strokeWidth="2" />

        {/* Doors (gaps in walls) */}
        <line x1="240" y1="200" x2="270" y2="200" stroke="white" strokeWidth="3" />
        <line x1="295" y1="200" x2="320" y2="200" stroke="white" strokeWidth="3" />
        <line x1="345" y1="200" x2="370" y2="200" stroke="white" strokeWidth="3" />
        <line x1="280" y1="125" x2="280" y2="155" stroke="white" strokeWidth="3" />
        <line x1="200" y1="270" x2="200" y2="295" stroke="white" strokeWidth="3" />

        {/* Balcony */}
        <rect x="440" y="80" width="100" height="120" fill="url(#balcony-deck)" stroke={C.navy} strokeWidth="1" />
        <text x="490" y="135" textAnchor="middle" fontSize="11" fill="white" fontWeight="bold">BALCONY</text>
        <text x="490" y="150" textAnchor="middle" fontSize="9" fill="white" fontFamily="ui-monospace">≥ 10m² · 2m deep</text>
        {/* Plant */}
        <circle cx="455" cy="95" r="6" fill={C.vegetation} />
        <circle cx="525" cy="190" r="8" fill={C.vegetationDark} />
        {/* Outdoor furniture */}
        <rect x="465" y="160" width="14" height="14" fill="#8a6f4f" stroke={C.navy} strokeWidth="0.3" />
        <rect x="500" y="160" width="14" height="14" fill="#8a6f4f" stroke={C.navy} strokeWidth="0.3" />

        {/* Windows on outer walls */}
        {/* North (top) */}
        <line x1="40" y1="0" x2="120" y2="0" stroke={C.glass} strokeWidth="6" />
        <line x1="160" y1="0" x2="240" y2="0" stroke={C.glass} strokeWidth="6" />
        <line x1="290" y1="0" x2="370" y2="0" stroke={C.glass} strokeWidth="6" />
        {/* East — sliding door to balcony */}
        <line x1="440" y1="120" x2="440" y2="180" stroke={C.glass} strokeWidth="5" />
        {/* South — bedroom 2 */}
        <line x1="40" y1="320" x2="160" y2="320" stroke={C.glass} strokeWidth="6" />
        {/* West */}
        <line x1="0" y1="40" x2="0" y2="160" stroke={C.glass} strokeWidth="6" />

        {/* Dimension lines */}
        {/* Width */}
        <g>
          <line x1="0" y1="-25" x2="540" y2="-25" stroke={C.amber} strokeWidth="0.7" />
          <line x1="0" y1="-30" x2="0" y2="-20" stroke={C.amber} strokeWidth="0.7" />
          <line x1="540" y1="-30" x2="540" y2="-20" stroke={C.amber} strokeWidth="0.7" />
          <text x="270" y="-30" textAnchor="middle" fontSize="11" fill={C.amber} fontFamily="ui-monospace" fontWeight="bold">14.0 m</text>
        </g>
        {/* Height */}
        <g>
          <line x1="-20" y1="0" x2="-20" y2="320" stroke={C.amber} strokeWidth="0.7" />
          <line x1="-25" y1="0" x2="-15" y2="0" stroke={C.amber} strokeWidth="0.7" />
          <line x1="-25" y1="320" x2="-15" y2="320" stroke={C.amber} strokeWidth="0.7" />
          <text x="-30" y="165" textAnchor="end" fontSize="11" fill={C.amber} fontFamily="ui-monospace" fontWeight="bold">9.0m</text>
        </g>

        {/* North arrow */}
        <g transform="translate(620, 50)">
          <circle cx="0" cy="0" r="20" fill="white" stroke={C.navy} strokeWidth="1" />
          <polygon points="0,-13 5,7 0,3 -5,7" fill={C.navy} />
          <text x="0" y="-22" textAnchor="middle" fontSize="9" fill={C.navy} fontFamily="ui-monospace" fontWeight="bold">N</text>
        </g>

        {/* Total area */}
        <g transform="translate(620, 130)">
          <rect x="0" y="0" width="100" height="80" fill={C.navy} rx="2" />
          <text x="50" y="20" textAnchor="middle" fontSize="9" fill={C.bronze} fontFamily="ui-monospace" fontWeight="bold">2 BEDROOM</text>
          <line x1="10" y1="26" x2="90" y2="26" stroke={C.bronze} opacity="0.5" />
          <text x="50" y="48" textAnchor="middle" fontSize="22" fill="white" fontFamily="ui-monospace" fontWeight="bold">75 m²</text>
          <text x="50" y="64" textAnchor="middle" fontSize="8" fill={C.bronze}>internal area</text>
          <text x="50" y="74" textAnchor="middle" fontSize="8" fill={C.bronze}>(min 70m²)</text>
        </g>
      </g>

      {/* Caption labels at bottom */}
      <g transform="translate(80, 410)">
        <text x="0" y="0" fontSize="11" fill={C.navy} fontWeight="bold">Two-bedroom apartment, dual aspect, NE corner</text>
        <text x="0" y="16" fontSize="10" fill={C.inkSoft}>Naturally cross-ventilated · Living &amp; Master Bedroom face north for solar access</text>
      </g>
    </svg>
  );
}

// ─── Visual privacy — separation distances ───────────────────────
function VisualPrivacyDiagram() {
  return (
    <svg viewBox="0 0 800 380" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="priv-bldg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8dfc8" />
          <stop offset="100%" stopColor="#beb39a" />
        </linearGradient>
      </defs>

      <rect width="800" height="380" fill={C.paper} />

      {/* Ground */}
      <line x1="0" y1="320" x2="800" y2="320" stroke={C.ground} strokeWidth="2" />
      <rect x="0" y="320" width="800" height="60" fill={C.ground} opacity="0.3" />

      {/* Boundary */}
      <line x1="400" y1="60" x2="400" y2="320" stroke={C.amber} strokeWidth="1.2" strokeDasharray="6 4" />
      <text x="400" y="345" textAnchor="middle" fontSize="9" fill={C.amber} fontFamily="ui-monospace" fontWeight="bold">SITE BOUNDARY</text>

      {/* Building A (left) */}
      <g>
        {/* Body */}
        <rect x="60" y="120" width="160" height="200" fill="url(#priv-bldg)" stroke={C.navy} strokeWidth="1" />
        {/* Roof */}
        <polygon points="60,120 220,120 215,108 65,108" fill="#a89a7e" />

        {/* Windows */}
        {[0, 1, 2, 3].map((row) => (
          [0, 1, 2].map((col) => (
            <g key={`a-${row}-${col}`}>
              <rect
                x={75 + col * 50}
                y={140 + row * 45}
                width="32" height="28"
                fill={C.glass}
                stroke={C.navy} strokeWidth="0.4"
              />
              <line x1={91 + col * 50} y1={140 + row * 45} x2={91 + col * 50} y2={168 + row * 45}
                    stroke={C.navy} strokeWidth="0.3" />
            </g>
          ))
        )).flat()}

        {/* Balcony on top floor */}
        <rect x="55" y="148" width="170" height="4" fill={C.concreteDark} />

        <text x="140" y="100" textAnchor="middle" fontSize="11" fill={C.navy} fontWeight="bold">BUILDING A</text>
        <text x="140" y="338" textAnchor="middle" fontSize="9" fill={C.inkSoft} fontStyle="italic">Habitable rooms · balconies</text>
      </g>

      {/* Building B (right) */}
      <g>
        <rect x="580" y="160" width="160" height="160" fill="url(#priv-bldg)" stroke={C.navy} strokeWidth="1" />
        <polygon points="580,160 740,160 735,148 585,148" fill="#a89a7e" />

        {[0, 1, 2].map((row) => (
          [0, 1, 2].map((col) => (
            <g key={`b-${row}-${col}`}>
              <rect
                x={595 + col * 50}
                y={180 + row * 45}
                width="32" height="28"
                fill={C.glass}
                stroke={C.navy} strokeWidth="0.4"
              />
              <line x1={611 + col * 50} y1={180 + row * 45} x2={611 + col * 50} y2={208 + row * 45}
                    stroke={C.navy} strokeWidth="0.3" />
            </g>
          ))
        )).flat()}

        <text x="660" y="140" textAnchor="middle" fontSize="11" fill={C.navy} fontWeight="bold">BUILDING B</text>
        <text x="660" y="338" textAnchor="middle" fontSize="9" fill={C.inkSoft} fontStyle="italic">Up to 4 storeys (≤ 12m)</text>
      </g>

      {/* Separation arrow + dimension */}
      <g>
        <line x1="220" y1="220" x2="580" y2="220" stroke={C.amber} strokeWidth="2" />
        <polygon points="225,215 215,220 225,225" fill={C.amber} />
        <polygon points="575,215 585,220 575,225" fill={C.amber} />

        <rect x="350" y="200" width="100" height="40" fill="white" stroke={C.amber} strokeWidth="1.5" rx="2" />
        <text x="400" y="218" textAnchor="middle" fontSize="14" fontWeight="bold" fill={C.amber} fontFamily="ui-monospace">12 m</text>
        <text x="400" y="232" textAnchor="middle" fontSize="8" fill={C.amber}>habitable to habitable</text>
      </g>

      {/* Sight cone visualization (privacy concern) */}
      <g opacity="0.18">
        <polygon points="220,170 580,180 580,260 220,250" fill={C.amber} />
      </g>

      {/* Side annotations */}
      <g>
        <text x="140" y="125" textAnchor="middle" fontSize="8" fill={C.inkSoft} fontFamily="ui-monospace">UP TO 4 STOREYS (≤ 12m HEIGHT)</text>
      </g>

      {/* Bottom caption */}
      <text x="400" y="370" textAnchor="middle" fontSize="10" fill={C.inkSoft} fontStyle="italic">
        Building separation (habitable ↔ habitable). Increases to 18m at 5–8 storeys, 24m at 9+ storeys.
      </text>
    </svg>
  );
}

// ─── Building separation comparison (3 height tiers) ─────────────
function BuildingSeparationTiers() {
  return (
    <svg viewBox="0 0 900 320" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bs-bldg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8dfc8" />
          <stop offset="100%" stopColor="#beb39a" />
        </linearGradient>
      </defs>

      <rect width="900" height="320" fill={C.paper} />
      <line x1="0" y1="280" x2="900" y2="280" stroke={C.ground} strokeWidth="1.5" />

      {/* Tier 1: Up to 4 storeys */}
      <g transform="translate(40, 140)">
        <rect x="0" y="0" width="60" height="140" fill="url(#bs-bldg)" stroke={C.navy} strokeWidth="0.8" />
        <rect x="100" y="0" width="60" height="140" fill="url(#bs-bldg)" stroke={C.navy} strokeWidth="0.8" />
        {/* windows */}
        {[0, 1, 2, 3].map(i => (
          <g key={`t1-${i}`}>
            <rect x={10} y={10 + i * 32} width="40" height="20" fill={C.glass} stroke={C.navy} strokeWidth="0.3" />
            <rect x={110} y={10 + i * 32} width="40" height="20" fill={C.glass} stroke={C.navy} strokeWidth="0.3" />
          </g>
        ))}

        {/* Separation arrow */}
        <line x1="60" y1="80" x2="100" y2="80" stroke={C.amber} strokeWidth="1.5" />
        <polygon points="65,76 60,80 65,84" fill={C.amber} />
        <polygon points="95,76 100,80 95,84" fill={C.amber} />
        <text x="80" y="72" textAnchor="middle" fontSize="11" fontWeight="bold" fill={C.amber} fontFamily="ui-monospace">12m</text>

        <text x="80" y="-15" textAnchor="middle" fontSize="11" fontWeight="bold" fill={C.navy}>UP TO 4 STOREYS</text>
        <text x="80" y="-2" textAnchor="middle" fontSize="9" fill={C.inkSoft}>(building height ≤ 12m)</text>

        <text x="80" y="160" textAnchor="middle" fontSize="9" fill={C.inkSoft} fontStyle="italic">Habitable to habitable</text>
      </g>

      {/* Tier 2: 5–8 storeys */}
      <g transform="translate(280, 80)">
        <rect x="0" y="0" width="60" height="200" fill="url(#bs-bldg)" stroke={C.navy} strokeWidth="0.8" />
        <rect x="160" y="0" width="60" height="200" fill="url(#bs-bldg)" stroke={C.navy} strokeWidth="0.8" />
        {[0, 1, 2, 3, 4, 5, 6].map(i => (
          <g key={`t2-${i}`}>
            <rect x={10} y={10 + i * 26} width="40" height="16" fill={C.glass} stroke={C.navy} strokeWidth="0.3" />
            <rect x={170} y={10 + i * 26} width="40" height="16" fill={C.glass} stroke={C.navy} strokeWidth="0.3" />
          </g>
        ))}

        <line x1="60" y1="100" x2="160" y2="100" stroke={C.amber} strokeWidth="1.5" />
        <polygon points="65,96 60,100 65,104" fill={C.amber} />
        <polygon points="155,96 160,100 155,104" fill={C.amber} />
        <text x="110" y="92" textAnchor="middle" fontSize="11" fontWeight="bold" fill={C.amber} fontFamily="ui-monospace">18m</text>

        <text x="110" y="-15" textAnchor="middle" fontSize="11" fontWeight="bold" fill={C.navy}>5 – 8 STOREYS</text>
        <text x="110" y="-2" textAnchor="middle" fontSize="9" fill={C.inkSoft}>(up to ≤ 25m height)</text>

        <text x="110" y="220" textAnchor="middle" fontSize="9" fill={C.inkSoft} fontStyle="italic">Habitable to habitable</text>
      </g>

      {/* Tier 3: 9+ storeys */}
      <g transform="translate(580, 30)">
        <rect x="0" y="0" width="60" height="250" fill="url(#bs-bldg)" stroke={C.navy} strokeWidth="0.8" />
        <rect x="220" y="0" width="60" height="250" fill="url(#bs-bldg)" stroke={C.navy} strokeWidth="0.8" />
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
          <g key={`t3-${i}`}>
            <rect x={10} y={10 + i * 23} width="40" height="14" fill={C.glass} stroke={C.navy} strokeWidth="0.3" />
            <rect x={230} y={10 + i * 23} width="40" height="14" fill={C.glass} stroke={C.navy} strokeWidth="0.3" />
          </g>
        ))}

        <line x1="60" y1="125" x2="220" y2="125" stroke={C.amber} strokeWidth="1.5" />
        <polygon points="65,121 60,125 65,129" fill={C.amber} />
        <polygon points="215,121 220,125 215,129" fill={C.amber} />
        <text x="140" y="117" textAnchor="middle" fontSize="11" fontWeight="bold" fill={C.amber} fontFamily="ui-monospace">24m</text>

        <text x="140" y="-15" textAnchor="middle" fontSize="11" fontWeight="bold" fill={C.navy}>9+ STOREYS</text>
        <text x="140" y="-2" textAnchor="middle" fontSize="9" fill={C.inkSoft}>(over 25m height)</text>

        <text x="140" y="270" textAnchor="middle" fontSize="9" fill={C.inkSoft} fontStyle="italic">Habitable to habitable</text>
      </g>
    </svg>
  );
}

// ─── Communal open space — site plan ─────────────────────────────
function CommunalOpenSpaceDiagram() {
  return (
    <svg viewBox="0 0 800 460" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grass" patternUnits="userSpaceOnUse" width="20" height="20">
          <rect width="20" height="20" fill="#7ba85f" />
          <circle cx="5" cy="6" r="0.6" fill="#5a8444" />
          <circle cx="14" cy="11" r="0.6" fill="#5a8444" />
          <circle cx="9" cy="16" r="0.6" fill="#5a8444" />
        </pattern>
        <pattern id="paving" patternUnits="userSpaceOnUse" width="24" height="24">
          <rect width="24" height="24" fill="#c9c1ad" />
          <line x1="0" y1="12" x2="24" y2="12" stroke="#a89e80" strokeWidth="0.5" />
          <line x1="12" y1="0" x2="12" y2="24" stroke="#a89e80" strokeWidth="0.5" />
        </pattern>
      </defs>

      <rect width="800" height="460" fill={C.paper} />

      {/* Site outline */}
      <rect x="60" y="40" width="680" height="380" fill="#e8dfc8" stroke={C.amber} strokeWidth="1.2" strokeDasharray="6 4" />
      <text x="400" y="32" textAnchor="middle" fontSize="9" fill={C.amber} fontFamily="ui-monospace" fontWeight="bold">SITE BOUNDARY · 2,400 m²</text>

      {/* Building footprints */}
      <g>
        <rect x="80" y="60" width="270" height="120" fill="url(#bldg-front)" stroke={C.navy} strokeWidth="1.2" />
        <text x="215" y="120" textAnchor="middle" fontSize="11" fill={C.navy} fontWeight="bold">BUILDING A</text>
        <text x="215" y="135" textAnchor="middle" fontSize="9" fill={C.inkSoft}>32 apartments · 7 storeys</text>

        <rect x="450" y="60" width="270" height="120" fill="url(#bldg-front)" stroke={C.navy} strokeWidth="1.2" />
        <text x="585" y="120" textAnchor="middle" fontSize="11" fill={C.navy} fontWeight="bold">BUILDING B</text>
        <text x="585" y="135" textAnchor="middle" fontSize="9" fill={C.inkSoft}>28 apartments · 7 storeys</text>
      </g>

      {/* Communal open space */}
      <g>
        <rect x="80" y="200" width="640" height="180" fill="url(#grass)" stroke={C.vegetation} strokeWidth="1" />

        {/* Paved path */}
        <path d="M 215 200 Q 250 240 200 280 Q 150 320 220 380" fill="none" stroke="url(#paving)" strokeWidth="14" />
        <path d="M 585 200 Q 555 245 600 280 Q 645 320 580 380" fill="none" stroke="url(#paving)" strokeWidth="14" />
        <line x1="215" y1="200" x2="585" y2="200" stroke="url(#paving)" strokeWidth="14" opacity="0.5" />

        {/* Trees — large canopy */}
        {[
          { cx: 130, cy: 230, r: 22 },
          { cx: 670, cy: 230, r: 22 },
          { cx: 350, cy: 270, r: 28 },
          { cx: 450, cy: 270, r: 28 },
          { cx: 200, cy: 350, r: 18 },
          { cx: 600, cy: 350, r: 18 },
          { cx: 130, cy: 380, r: 14 },
          { cx: 670, cy: 380, r: 14 },
        ].map((t, i) => (
          <g key={`tree-${i}`}>
            <circle cx={t.cx} cy={t.cy} r={t.r} fill={C.vegetationDark} opacity="0.4" />
            <circle cx={t.cx - 2} cy={t.cy - 2} r={t.r - 3} fill={C.vegetation} />
            <circle cx={t.cx - 5} cy={t.cy - 5} r={t.r - 8} fill="#85b870" />
            <circle cx={t.cx} cy={t.cy} r="2" fill="#5a3a20" />
          </g>
        ))}

        {/* Benches */}
        <g>
          <rect x="280" y="320" width="20" height="6" fill="#7a5e3c" stroke={C.navy} strokeWidth="0.4" />
          <rect x="490" y="320" width="20" height="6" fill="#7a5e3c" stroke={C.navy} strokeWidth="0.4" />
        </g>

        {/* Children's play area */}
        <g>
          <rect x="350" y="320" width="100" height="50" fill="#e8c898" stroke={C.navy} strokeWidth="0.5" rx="4" />
          <circle cx="375" cy="345" r="6" fill="#d0a868" stroke={C.navy} strokeWidth="0.4" />
          <rect x="400" y="335" width="10" height="20" fill="#a85e3c" stroke={C.navy} strokeWidth="0.4" />
          <rect x="425" y="328" width="20" height="14" fill={C.amber} stroke={C.navy} strokeWidth="0.4" />
          <text x="400" y="385" textAnchor="middle" fontSize="8" fill={C.inkSoft} fontStyle="italic">play area</text>
        </g>

        {/* Label */}
        <rect x="280" y="225" width="240" height="30" fill="white" stroke={C.vegetation} strokeWidth="1" rx="2" />
        <text x="400" y="245" textAnchor="middle" fontSize="11" fill={C.vegetationDark} fontWeight="bold">COMMUNAL OPEN SPACE</text>
      </g>

      {/* North arrow */}
      <g transform="translate(70, 60)">
        <circle cx="0" cy="0" r="15" fill="white" stroke={C.navy} strokeWidth="0.8" />
        <polygon points="0,-10 4,5 0,2 -4,5" fill={C.navy} />
        <text x="0" y="-17" textAnchor="middle" fontSize="8" fill={C.navy} fontFamily="ui-monospace" fontWeight="bold">N</text>
      </g>

      {/* Stats panel */}
      <g transform="translate(80, 200)">
        <rect x="-20" y="0" width="180" height="0" />
      </g>

      {/* Bottom annotations */}
      <g transform="translate(60, 430)">
        <rect x="0" y="0" width="220" height="22" fill={C.vegetationDark} rx="2" />
        <text x="110" y="15" textAnchor="middle" fontSize="11" fill="white" fontWeight="bold">25%+ COMMUNAL OPEN SPACE</text>

        <rect x="240" y="0" width="220" height="22" fill={C.bronze} rx="2" />
        <text x="350" y="15" textAnchor="middle" fontSize="11" fill="white" fontWeight="bold">7%+ DEEP SOIL ZONE</text>

        <rect x="480" y="0" width="220" height="22" fill={C.amber} rx="2" />
        <text x="590" y="15" textAnchor="middle" fontSize="11" fill="white" fontWeight="bold">50%+ DIRECT SUNLIGHT 2HR</text>
      </g>
    </svg>
  );
}

// ─── Universal design — accessibility ────────────────────────────
function UniversalDesignDiagram() {
  return (
    <svg viewBox="0 0 800 380" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
      <rect width="800" height="380" fill={C.paper} />

      {/* Apartment layout (simplified) showing accessibility features */}
      <g transform="translate(60, 40)">
        <rect x="0" y="0" width="380" height="280" fill="#f4ecd8" stroke={C.navy} strokeWidth="2" />

        {/* Internal walls */}
        <line x1="180" y1="0" x2="180" y2="280" stroke={C.navy} strokeWidth="1.5" />
        <line x1="180" y1="160" x2="380" y2="160" stroke={C.navy} strokeWidth="1.5" />
        <line x1="290" y1="0" x2="290" y2="160" stroke={C.navy} strokeWidth="1.5" />

        {/* Living room */}
        <text x="90" y="80" textAnchor="middle" fontSize="12" fill={C.navy} fontWeight="bold">LIVING</text>
        {/* Couch */}
        <rect x="20" y="130" width="60" height="22" fill="#b8a070" stroke={C.navy} strokeWidth="0.4" rx="2" />
        {/* Turning circle 1.5m */}
        <circle cx="100" cy="220" r="36" fill="none" stroke={C.amber} strokeWidth="1.2" strokeDasharray="3 3" />
        <text x="100" y="225" textAnchor="middle" fontSize="9" fill={C.amber} fontWeight="bold" fontFamily="ui-monospace">1500ø</text>

        {/* Kitchen */}
        <rect x="200" y="10" width="80" height="60" fill="#dde3e8" stroke={C.navy} strokeWidth="0.5" />
        <text x="240" y="40" textAnchor="middle" fontSize="11" fill={C.navy} fontWeight="bold">KITCHEN</text>
        <rect x="205" y="15" width="70" height="10" fill="#cdb88f" stroke={C.navy} strokeWidth="0.3" />
        {/* Turning circle in kitchen */}
        <circle cx="240" cy="100" r="36" fill="none" stroke={C.amber} strokeWidth="1.2" strokeDasharray="3 3" />

        {/* Bathroom (accessible) */}
        <rect x="290" y="0" width="90" height="160" fill="#e8e8ee" stroke={C.navy} strokeWidth="0.5" />
        <text x="335" y="22" textAnchor="middle" fontSize="10" fill={C.navy} fontWeight="bold">BATHROOM</text>
        {/* Accessible toilet with grab bars */}
        <ellipse cx="310" cy="60" rx="9" ry="11" fill="white" stroke={C.navy} strokeWidth="0.5" />
        <line x1="304" y1="48" x2="320" y2="48" stroke="#888" strokeWidth="2" />
        <line x1="304" y1="72" x2="320" y2="72" stroke="#888" strokeWidth="2" />
        {/* Roll-in shower */}
        <rect x="330" y="50" width="40" height="40" fill="white" stroke={C.navy} strokeWidth="0.5" />
        <line x1="350" y1="50" x2="350" y2="90" stroke={C.navy} strokeWidth="0.3" opacity="0.4" />
        <line x1="330" y1="70" x2="370" y2="70" stroke={C.navy} strokeWidth="0.3" opacity="0.4" />
        {/* Vanity */}
        <rect x="295" y="100" width="80" height="14" fill="#cdb88f" stroke={C.navy} strokeWidth="0.4" />
        <ellipse cx="335" cy="107" rx="7" ry="3" fill="white" stroke={C.navy} strokeWidth="0.3" />
        {/* Turning circle */}
        <circle cx="335" cy="135" r="22" fill="none" stroke={C.amber} strokeWidth="1.2" strokeDasharray="3 3" />
        <text x="335" y="140" textAnchor="middle" fontSize="7" fill={C.amber} fontWeight="bold" fontFamily="ui-monospace">1500ø</text>

        {/* Bedroom */}
        <text x="250" y="200" textAnchor="middle" fontSize="11" fill={C.navy} fontWeight="bold">BEDROOM</text>
        {/* Bed */}
        <rect x="230" y="210" width="60" height="38" fill="#d4c8a8" stroke={C.navy} strokeWidth="0.4" rx="2" />
        {/* Clearance */}
        <rect x="290" y="210" width="84" height="38" fill="none" stroke={C.amber} strokeWidth="0.5" strokeDasharray="2 2" />
        <text x="330" y="232" textAnchor="middle" fontSize="8" fill={C.amber} fontWeight="bold">1000mm</text>

        {/* Doorways — 850mm clear */}
        {/* Door labels */}
        <g>
          <rect x="172" y="100" width="16" height="25" fill="white" stroke={C.amber} strokeWidth="0.5" rx="1" />
          <text x="180" y="116" textAnchor="middle" fontSize="6" fill={C.amber} fontWeight="bold" transform="rotate(-90 180 116)">850mm</text>
        </g>
      </g>

      {/* Annotations */}
      <g transform="translate(490, 60)">
        <text x="0" y="0" fontSize="14" fill={C.navy} fontWeight="bold">ADAPTABLE FEATURES</text>
        <line x1="0" y1="6" x2="40" y2="6" stroke={C.amber} strokeWidth="2" />

        {[
          { icon: "○", label: "1500mm turning circle", detail: "in kitchen, bathroom, living" },
          { icon: "—", label: "850mm clear doorways", detail: "throughout including ensuites" },
          { icon: "▢", label: "1000mm clearance", detail: "to one side of bed" },
          { icon: "≡", label: "Reinforced walls", detail: "future grab rail installation" },
          { icon: "↕", label: "Step-free entry", detail: "from common area to all rooms" },
          { icon: "◆", label: "Roll-in shower", detail: "with continuous floor finish" },
          { icon: "↟", label: "Power outlets at 600mm", detail: "switches at 900–1100mm" },
        ].map((item, i) => (
          <g key={i} transform={`translate(0, ${30 + i * 36})`}>
            <circle cx="10" cy="6" r="9" fill={C.amber} />
            <text x="10" y="10" textAnchor="middle" fontSize="11" fill="white" fontWeight="bold">{item.icon}</text>
            <text x="28" y="6" fontSize="11" fill={C.navy} fontWeight="bold">{item.label}</text>
            <text x="28" y="20" fontSize="9" fill={C.inkSoft}>{item.detail}</text>
          </g>
        ))}
      </g>

      <text x="60" y="365" fontSize="10" fill={C.inkSoft} fontStyle="italic">
        Compliant with AS 4299 (Adaptable Housing) Class C requirements · 20% of all dwellings in larger developments
      </text>
    </svg>
  );
}

// ─── Building depth diagram ──────────────────────────────────────
function BuildingDepthDiagram() {
  return (
    <svg viewBox="0 0 800 360" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="depth-bldg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8dfc8" />
          <stop offset="100%" stopColor="#b5a988" />
        </linearGradient>
      </defs>

      <rect width="800" height="360" fill={C.paper} />
      <line x1="0" y1="320" x2="800" y2="320" stroke={C.ground} strokeWidth="1.5" />

      {/* Mixed-use building cross-section */}
      <g transform="translate(80, 60)">
        {/* Residential narrow tower (top) */}
        <rect x="80" y="0" width="240" height="160" fill="url(#depth-bldg)" stroke={C.navy} strokeWidth="1.2" />
        <text x="200" y="80" textAnchor="middle" fontSize="11" fill={C.navy} fontWeight="bold">RESIDENTIAL</text>
        <text x="200" y="98" textAnchor="middle" fontSize="9" fill={C.inkSoft}>narrower for amenity</text>

        {/* Commercial podium (bottom) */}
        <rect x="0" y="160" width="400" height="100" fill="#a8997a" stroke={C.navy} strokeWidth="1.2" />
        <text x="200" y="210" textAnchor="middle" fontSize="11" fill="white" fontWeight="bold">COMMERCIAL / RETAIL</text>
        <text x="200" y="226" textAnchor="middle" fontSize="9" fill="white" opacity="0.85">deeper plate, fills 80–85% of envelope</text>

        {/* Car parking basement */}
        <rect x="0" y="260" width="400" height="60" fill="#5a5a6a" stroke={C.navy} strokeWidth="1.2" />
        <text x="200" y="295" textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">CAR PARKING (basement)</text>

        {/* Window pattern residential */}
        {[0, 1, 2, 3, 4].map(i => (
          <g key={`d-${i}`}>
            <rect x={95 + i * 44} y={20} width="30" height="22" fill={C.glass} stroke={C.navy} strokeWidth="0.3" />
            <rect x={95 + i * 44} y={60} width="30" height="22" fill={C.glass} stroke={C.navy} strokeWidth="0.3" />
            <rect x={95 + i * 44} y={100} width="30" height="22" fill={C.glass} stroke={C.navy} strokeWidth="0.3" />
            <rect x={95 + i * 44} y={130} width="30" height="22" fill={C.glass} stroke={C.navy} strokeWidth="0.3" />
          </g>
        ))}

        {/* Storefront */}
        {[0, 1, 2, 3].map(i => (
          <rect key={`sf-${i}`} x={20 + i * 95} y={170} width="75" height="80" fill={C.glassLight} stroke={C.navy} strokeWidth="0.5" opacity="0.7" />
        ))}

        {/* Building depth dimensions */}
        {/* Residential — 12-18m */}
        <g>
          <line x1="80" y1="-25" x2="320" y2="-25" stroke={C.amber} strokeWidth="1" />
          <line x1="80" y1="-30" x2="80" y2="-20" stroke={C.amber} strokeWidth="1" />
          <line x1="320" y1="-30" x2="320" y2="-20" stroke={C.amber} strokeWidth="1" />
          <text x="200" y="-32" textAnchor="middle" fontSize="11" fontWeight="bold" fill={C.amber} fontFamily="ui-monospace">12 – 18 m</text>
          <text x="200" y="-42" textAnchor="middle" fontSize="8" fill={C.amber}>residential building depth</text>
        </g>

        {/* Commercial — wider */}
        <g>
          <line x1="0" y1="280" x2="400" y2="280" stroke="#888" strokeWidth="1" />
          <line x1="0" y1="275" x2="0" y2="285" stroke="#888" strokeWidth="1" />
          <line x1="400" y1="275" x2="400" y2="285" stroke="#888" strokeWidth="1" />
          <text x="200" y="296" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#666" fontFamily="ui-monospace">25 – 40 m</text>
          <text x="200" y="308" textAnchor="middle" fontSize="8" fill="#666">commercial depth</text>
        </g>
      </g>

      {/* Right side — apartment layout illustrations */}
      <g transform="translate(540, 60)">
        <text x="0" y="0" fontSize="11" fill={C.navy} fontWeight="bold">DEPTH AFFECTS LAYOUT</text>
        <line x1="0" y1="6" x2="40" y2="6" stroke={C.amber} strokeWidth="2" />

        {/* Cross-through diagram */}
        <g transform="translate(0, 25)">
          <rect x="0" y="0" width="200" height="50" fill="#e8dfc8" stroke={C.navy} strokeWidth="0.6" />
          <line x1="0" y1="22" x2="200" y2="22" stroke={C.navy} strokeWidth="0.4" />
          <line x1="50" y1="0" x2="50" y2="22" stroke={C.navy} strokeWidth="0.3" />
          <line x1="100" y1="0" x2="100" y2="22" stroke={C.navy} strokeWidth="0.3" />
          <line x1="150" y1="0" x2="150" y2="22" stroke={C.navy} strokeWidth="0.3" />
          <text x="100" y="42" textAnchor="middle" fontSize="9" fill={C.navy} fontWeight="bold">Living areas (north)</text>
          <text x="100" y="14" textAnchor="middle" fontSize="7" fill={C.inkSoft}>Bedrooms (south)</text>
          {/* Airflow */}
          <path d="M 25 -8 L 25 60" stroke="#2d7caa" strokeWidth="1.5" fill="none" markerEnd="url(#arrow-blue)" opacity="0.7" />
          <path d="M 100 -8 L 100 60" stroke="#2d7caa" strokeWidth="1.5" fill="none" markerEnd="url(#arrow-blue)" opacity="0.7" />
          <path d="M 175 -8 L 175 60" stroke="#2d7caa" strokeWidth="1.5" fill="none" markerEnd="url(#arrow-blue)" opacity="0.7" />
          <text x="0" y="-15" fontSize="9" fill={C.navy} fontWeight="bold">CROSS-THROUGH (≤ 18m)</text>
        </g>

        {/* Single aspect */}
        <g transform="translate(0, 130)">
          <rect x="0" y="0" width="100" height="50" fill="#e8dfc8" stroke={C.navy} strokeWidth="0.6" />
          <line x1="50" y1="0" x2="50" y2="50" stroke={C.navy} strokeWidth="0.3" />
          <text x="50" y="30" textAnchor="middle" fontSize="9" fill={C.navy} fontWeight="bold">Living + bed</text>
          {/* limited airflow */}
          <path d="M 25 -8 L 25 30" stroke="#a35858" strokeWidth="1.5" fill="none" strokeDasharray="3 2" opacity="0.6" />
          <path d="M 75 -8 L 75 30" stroke="#a35858" strokeWidth="1.5" fill="none" strokeDasharray="3 2" opacity="0.6" />
          <text x="0" y="-15" fontSize="9" fill={C.inkSoft} fontWeight="bold">SINGLE ASPECT (limited)</text>
        </g>

        <text x="0" y="220" fontSize="9" fill={C.inkSoft} fontStyle="italic">Narrower depths = better daylight + ventilation</text>
        <text x="0" y="232" fontSize="9" fill={C.inkSoft} fontStyle="italic">to all rooms.</text>
      </g>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════
//                    MAIN PAGE
// ═══════════════════════════════════════════════════════════════

export default function ApartmentDesignGuide() {
  const [navOpen, setNavOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("foreword");

  // Scroll spy
  useEffect(() => {
    const sections = document.querySelectorAll("[data-section]");
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && e.intersectionRatio > 0.3) {
            setActiveSection(e.target.getAttribute("data-section") || "");
          }
        });
      },
      { threshold: [0.3, 0.6] }
    );
    sections.forEach((s) => obs.observe(s));
    return () => obs.disconnect();
  }, []);

  const handlePrint = () => window.print();

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setNavOpen(false);
  };

  return (
    <div className="min-h-screen" style={{ background: C.cream }}>
      {/* Print + global styles */}
      <style>{`
        .adg-reveal { opacity: 0; transform: translateY(24px); transition: opacity 700ms ease, transform 700ms cubic-bezier(.2,.8,.2,1); }
        .adg-visible { opacity: 1; transform: translateY(0); }
        .font-display { font-family: ui-serif, "Cormorant Garamond", "Playfair Display", Georgia, serif; }
        .font-mono { font-family: ui-monospace, "JetBrains Mono", monospace; }

        @media print {
          body { background: white !important; }
          .adg-no-print { display: none !important; }
          .adg-reveal { opacity: 1 !important; transform: none !important; }
          .adg-page-break { break-before: page; }
          section { break-inside: avoid; }
          h2 { break-after: avoid; }
          .adg-hero { min-height: auto !important; }
        }
      `}</style>

      {/* Top nav (hidden on print) */}
      <div className="adg-no-print">
        <WebsiteNav onOpenPopup={() => {}} onOpenSignIn={() => {}} />
      </div>

      {/* Floating side nav */}
      <aside className={`adg-no-print fixed left-4 top-24 z-40 transition-all ${navOpen ? "translate-x-0" : "-translate-x-[110%]"} md:translate-x-0`}>
        <div className="w-72 max-h-[80vh] overflow-y-auto rounded-sm shadow-2xl"
             style={{ background: C.navy, color: C.cream, padding: "20px 24px" }}>
          <div className="flex items-center justify-between mb-4 pb-3 border-b" style={{ borderColor: C.bronze }}>
            <span className="text-xs font-mono uppercase tracking-[0.3em]" style={{ color: C.bronze }}>Contents</span>
            <button onClick={() => setNavOpen(false)} className="md:hidden" aria-label="Close">
              <X size={16} />
            </button>
          </div>

          {TOC.map((part) => (
            <div key={part.part} className="mb-5">
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] mb-2 opacity-60">
                {part.part}
              </p>
              {part.sections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  className={`flex items-baseline gap-2 w-full text-left py-1 text-sm transition-colors ${
                    activeSection === s.id ? "text-amber-300" : "hover:text-amber-200"
                  }`}
                  style={{ color: activeSection === s.id ? "#f5c842" : C.cream }}
                >
                  {s.num && <span className="font-mono text-[10px] opacity-70 w-6">{s.num}</span>}
                  <span>{s.title}</span>
                </button>
              ))}
            </div>
          ))}

          <div className="pt-4 mt-4 border-t flex gap-2" style={{ borderColor: C.bronze }}>
            <button
              onClick={handlePrint}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-mono uppercase tracking-wider rounded-sm transition"
              style={{ background: C.bronze, color: C.navy }}
            >
              <Printer size={14} /> Print / PDF
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile nav toggle */}
      <button
        onClick={() => setNavOpen(true)}
        className="adg-no-print md:hidden fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-xl"
        style={{ background: C.navy, color: C.cream }}
        aria-label="Open contents"
      >
        <Menu size={20} />
      </button>

      {/* ═══════════════════════════════════════════════════ */}
      {/*               COVER / HERO                          */}
      {/* ═══════════════════════════════════════════════════ */}
      <section className="adg-hero relative min-h-[90vh] flex items-end overflow-hidden" data-section="cover">
        {/* Architectural backdrop SVG */}
        <svg viewBox="0 0 1600 900" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="hero-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1a1a2e" />
              <stop offset="50%" stopColor="#3a3a52" />
              <stop offset="100%" stopColor="#7a6f54" />
            </linearGradient>
            <linearGradient id="hero-bldg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3a3a52" />
              <stop offset="100%" stopColor="#1a1a2e" />
            </linearGradient>
            <linearGradient id="hero-bldg-light" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5a5a72" />
              <stop offset="100%" stopColor="#3a3a52" />
            </linearGradient>
            <radialGradient id="hero-sun" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f5c842" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#C07040" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#1a1a2e" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Sky */}
          <rect width="1600" height="900" fill="url(#hero-sky)" />

          {/* Sun glow */}
          <circle cx="1280" cy="280" r="380" fill="url(#hero-sun)" />
          <circle cx="1280" cy="280" r="60" fill="#f5c842" opacity="0.9" />

          {/* Distant skyline (back) */}
          <g opacity="0.4">
            {[
              [40, 480, 60], [100, 440, 70], [160, 470, 50], [220, 420, 80],
              [280, 460, 55], [340, 410, 75], [400, 450, 60], [460, 430, 70]
            ].map(([x, y, h], i) => (
              <rect key={`bg-${i}`} x={x} y={y} width="50" height={h * 4} fill="url(#hero-bldg)" />
            ))}
          </g>

          {/* Mid-ground apartment buildings */}
          <g>
            {/* Tower 1 */}
            <rect x="200" y="320" width="180" height="500" fill="url(#hero-bldg)" />
            {[...Array(15)].map((_, row) => (
              [...Array(5)].map((_, col) => {
                const lit = Math.random() > 0.55;
                return (
                  <rect key={`t1-${row}-${col}`}
                    x={210 + col * 33} y={335 + row * 32}
                    width="22" height="22"
                    fill={lit ? "#f5c842" : "#2a2a42"}
                    opacity={lit ? 0.85 : 1}
                  />
                );
              })
            ))}

            {/* Tower 2 — wider */}
            <rect x="430" y="220" width="280" height="600" fill="url(#hero-bldg-light)" />
            {[...Array(18)].map((_, row) => (
              [...Array(8)].map((_, col) => {
                const lit = (row + col) % 3 !== 0 && Math.random() > 0.4;
                return (
                  <rect key={`t2-${row}-${col}`}
                    x={440 + col * 33} y={240 + row * 32}
                    width="22" height="22"
                    fill={lit ? "#ffd966" : "#3a3a52"}
                    opacity={lit ? 0.75 : 1}
                  />
                );
              })
            ))}
            {/* Balconies on Tower 2 */}
            {[...Array(18)].map((_, row) => (
              <rect key={`b2-${row}`} x="425" y={262 + row * 32} width="290" height="3" fill="#7a6f54" opacity="0.6" />
            ))}

            {/* Tower 3 */}
            <rect x="760" y="280" width="200" height="540" fill="url(#hero-bldg)" />
            {[...Array(16)].map((_, row) => (
              [...Array(6)].map((_, col) => {
                const lit = Math.random() > 0.55;
                return (
                  <rect key={`t3-${row}-${col}`}
                    x={770 + col * 31} y={300 + row * 32}
                    width="20" height="22"
                    fill={lit ? "#f5c842" : "#2a2a42"}
                    opacity={lit ? 0.85 : 1}
                  />
                );
              })
            ))}

            {/* Tower 4 */}
            <rect x="1010" y="180" width="240" height="640" fill="url(#hero-bldg-light)" />
            {[...Array(20)].map((_, row) => (
              [...Array(7)].map((_, col) => {
                const lit = Math.random() > 0.45;
                return (
                  <rect key={`t4-${row}-${col}`}
                    x={1020 + col * 32} y={200 + row * 32}
                    width="22" height="22"
                    fill={lit ? "#ffd966" : "#3a3a52"}
                    opacity={lit ? 0.8 : 1}
                  />
                );
              })
            ))}

            {/* Tower 5 — silhouette */}
            <rect x="1300" y="350" width="160" height="470" fill="url(#hero-bldg)" />
            {[...Array(13)].map((_, row) => (
              [...Array(5)].map((_, col) => {
                const lit = Math.random() > 0.5;
                return (
                  <rect key={`t5-${row}-${col}`}
                    x={1310 + col * 30} y={365 + row * 32}
                    width="20" height="22"
                    fill={lit ? "#f5c842" : "#2a2a42"}
                    opacity={lit ? 0.75 : 1}
                  />
                );
              })
            ))}
          </g>

          {/* Ground / harbour */}
          <rect x="0" y="820" width="1600" height="80" fill="#1a1a2e" />
          {/* Reflections */}
          <g opacity="0.2">
            {[300, 540, 850, 1130, 1380].map((x, i) => (
              <rect key={`r-${i}`} x={x} y="820" width="2" height="60" fill="#f5c842" />
            ))}
          </g>
        </svg>

        {/* Vignette */}
        <div className="absolute inset-0" style={{
          background: "linear-gradient(to top, rgba(26,26,46,0.95), rgba(26,26,46,0.5) 60%, transparent)"
        }} />

        {/* Hero content */}
        <div className="relative z-10 w-full">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20 pb-16 md:pb-24">
            <div className="grid md:grid-cols-12 gap-8 items-end">
              <div className="md:col-span-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-px w-12" style={{ background: C.bronze }} />
                  <span className="text-xs font-mono uppercase tracking-[0.4em]" style={{ color: C.bronze }}>
                    NSW Housing SEPP 2021 · 2026 Edition
                  </span>
                </div>
                <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-light leading-[0.95] mb-6"
                    style={{ color: C.cream, letterSpacing: "-0.03em" }}>
                  Apartment<br />
                  <span style={{ color: C.bronze, fontStyle: "italic" }}>Design</span> Guide
                </h1>
                <p className="text-lg md:text-xl max-w-2xl leading-relaxed font-light"
                   style={{ color: "#d8d4c8" }}>
                  Tools for improving the design of residential apartment development —
                  modernised for the Housing SEPP, Low &amp; Mid-Rise Housing reforms,
                  and 21st-century apartment living.
                </p>
              </div>
              <div className="md:col-span-4 md:text-right">
                <div className="inline-block text-left">
                  <p className="text-xs font-mono uppercase tracking-[0.3em] mb-2"
                     style={{ color: C.bronze }}>Published by</p>
                  <p className="font-display text-2xl mb-1" style={{ color: C.cream }}>369 Alliance</p>
                  <p className="text-xs font-mono opacity-60" style={{ color: C.cream }}>
                    Built Environment Compliance · NSW
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-16 flex items-center gap-6 text-sm font-mono uppercase tracking-[0.2em]"
                 style={{ color: C.bronze, opacity: 0.7 }}>
              <span>Foreword</span>
              <ArrowDown size={14} />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/*               FOREWORD                              */}
      {/* ═══════════════════════════════════════════════════ */}
      <section id="foreword" data-section="foreword" className="py-24 md:py-32 px-6 md:px-12 lg:px-20">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <SectionHeader
              part="Introduction"
              num=""
              title="Foreword"
              intro="The way we live in apartments has fundamentally changed. So has our climate, our population, and our expectations of home. This guide updates the 2015 Apartment Design Guide for the era of the Housing SEPP, Low and Mid-Rise reforms, and a far more demanding standard of liveability."
            />
          </Reveal>

          <Reveal>
            <div className="grid md:grid-cols-2 gap-12 mb-16">
              <div>
                <p className="text-base leading-relaxed mb-4" style={{ color: C.ink }}>
                  In 2002, NSW introduced State Environmental Planning Policy No. 65 — the first major policy initiative in Australia to lift the quality of apartment design. In 2015, that work matured into the Apartment Design Guide.
                </p>
                <p className="text-base leading-relaxed mb-4" style={{ color: C.ink }}>
                  In December 2023, the provisions of SEPP 65 were transferred to the State Environmental Planning Policy (Housing) 2021. The Apartment Design Guide remains the design instrument for all residential apartment development that meets the Housing SEPP threshold — three or more storeys (excluding levels below ground used for parking) and four or more dwellings.
                </p>
              </div>
              <div>
                <p className="text-base leading-relaxed mb-4" style={{ color: C.ink }}>
                  This 2026 edition retains the structure that has served NSW well: identifying context, developing controls, siting the development, and designing the building. What has changed is the visual language. Diagrams that once relied on simple line drawings now show real materiality, real proportions, real sun. The aim is not decoration — it is clarity.
                </p>
                <p className="text-base leading-relaxed" style={{ color: C.ink }}>
                  Good apartment design produces homes that are bright, naturally ventilated, dignified in their public face, generous in their private rooms, and durable across the next half-century. This guide exists to make that outcome the rule, not the exception.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-12 border-t" style={{ borderColor: C.rule }}>
              {[
                { num: "180+", label: "Pages of guidance" },
                { num: "9", label: "Design quality principles" },
                { num: "27", label: "Design objectives" },
                { num: "Housing SEPP", label: "2021 (consolidated 2023)" },
              ].map((s, i) => (
                <div key={i}>
                  <p className="font-display text-3xl md:text-4xl font-light mb-1" style={{ color: C.bronze }}>
                    {s.num}
                  </p>
                  <p className="text-xs font-mono uppercase tracking-wider" style={{ color: C.inkSoft }}>
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/*               DESIGN QUALITY PRINCIPLES             */}
      {/* ═══════════════════════════════════════════════════ */}
      <section id="principles" data-section="principles" className="py-24 px-6 md:px-12 lg:px-20"
               style={{ background: C.navy, color: C.cream }}>
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <div className="mb-16">
              <span className="text-xs font-mono uppercase tracking-[0.3em]" style={{ color: C.bronze }}>
                Schedule 9 · Housing SEPP 2021
              </span>
              <h2 className="font-display text-4xl md:text-6xl font-light mt-2 mb-6 leading-tight"
                  style={{ letterSpacing: "-0.02em" }}>
                The 9 Design Quality<br />Principles
              </h2>
              <div className="h-px w-24" style={{ background: C.bronze }} />
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-px" style={{ background: C.bronze }}>
            {[
              { num: "01", title: "Context & neighbourhood character", desc: "Responding to the existing and desired future character of an area." },
              { num: "02", title: "Built form & scale", desc: "Producing well-composed buildings that contribute positively to the public realm." },
              { num: "03", title: "Density", desc: "Sustainable density that delivers great places without overwhelming infrastructure." },
              { num: "04", title: "Sustainability", desc: "Reducing operational energy, water and embodied carbon over the building's life." },
              { num: "05", title: "Landscape", desc: "Integrated landscape design that improves microclimate, ecology and amenity." },
              { num: "06", title: "Amenity", desc: "Daylight, ventilation, privacy, outlook, and acoustic comfort for every apartment." },
              { num: "07", title: "Safety", desc: "Casual surveillance, legible movement, and robust public-private interfaces." },
              { num: "08", title: "Housing diversity & social interaction", desc: "Mix of dwelling types, sizes and tenures to support varied households." },
              { num: "09", title: "Aesthetics", desc: "Considered composition, materials, detailing, and architectural quality." },
            ].map((p, i) => (
              <Reveal key={p.num} delay={i * 60}>
                <div className="p-8 h-full" style={{ background: C.navy }}>
                  <span className="font-display text-5xl font-light block mb-3" style={{ color: C.bronze }}>{p.num}</span>
                  <h3 className="font-display text-xl font-medium mb-3 leading-snug">{p.title}</h3>
                  <p className="text-sm leading-relaxed opacity-80">{p.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/*               PART 2: BUILDING DEPTH (2E)            */}
      {/* ═══════════════════════════════════════════════════ */}
      <section id="2E" data-section="2E" className="py-24 px-6 md:px-12 lg:px-20 adg-page-break">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <SectionHeader
              part="Part 2 — Developing the Controls"
              num="2E"
              title="Building depth"
              intro="Building depth is one of the most consequential controls in apartment design. Narrower depths deliver better daylight, better natural ventilation, and richer apartment layouts. Wider depths fit more floor area but compromise amenity. The control's job is to keep the trade-off honest."
            />
          </Reveal>

          <Reveal>
            <div className="my-12 p-2 bg-white rounded-sm border" style={{ borderColor: C.rule }}>
              <BuildingDepthDiagram />
              <Caption figure="Figure 2E.1">
                Mixed-use building cross-section. Residential floors stay narrow (12–18m) to maintain daylight and cross-ventilation; commercial podium fills 80–85% of envelope. Note transition between uses.
              </Caption>
            </div>
          </Reveal>

          <Reveal>
            <Objective code="2E-1" title="Building depths support apartment layouts that achieve the objectives of the guide.">
              <Criteria items={[
                { num: 1, text: "Maximum apartment depth (cross-through or cross-over)", metric: "≤ 18m glass-line to glass-line" },
                { num: 2, text: "Range of building depths to test against indicative layouts", metric: "12 – 18m (residential)" },
              ]} />

              <Guidance items={[
                "Use a range of 12–18m apartment depths when precinct planning. This ensures apartments receive adequate daylight and natural ventilation, and optimises cross ventilation.",
                "Test building depths against indicative floor plates and apartment layouts before fixing controls.",
                "Vary building depth relative to orientation. East-west buildings can be deeper (up to 18m) because they capture sun on both faces. North-south buildings should be narrower to avoid south-facing apartments with no direct sunlight.",
                "Coordinate building depth with ceiling height. Greater depths can be acceptable where higher ceilings are provided — for example in adaptive reuse of warehouse buildings.",
                "For mixed-use buildings, transition from deeper podium plates (commercial/retail) to narrower upper plates (residential).",
              ]} />
            </Objective>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/*               PART 2: BUILDING SEPARATION (2F)       */}
      {/* ═══════════════════════════════════════════════════ */}
      <section id="2F" data-section="2F" className="py-24 px-6 md:px-12 lg:px-20"
               style={{ background: C.paper }}>
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <SectionHeader
              part="Part 2 — Developing the Controls"
              num="2F"
              title="Building separation"
              intro="Building separation is the distance between buildings on the same site, or between a building and the boundary. It governs daylight to apartments, visual privacy, urban form, and the experience of the public domain — and increases as buildings get taller."
            />
          </Reveal>

          <Reveal>
            <div className="my-12 p-2 bg-white rounded-sm border" style={{ borderColor: C.rule }}>
              <BuildingSeparationTiers />
              <Caption figure="Figure 2F.1">
                Building separation increases with height. Three tiers: 12m (up to 4 storeys), 18m (5–8 storeys), 24m (9+ storeys). Distances apply between habitable rooms and balconies of facing buildings.
              </Caption>
            </div>
          </Reveal>

          <Reveal>
            <Objective code="2F-1" title="Adequate building separation distances are shared equitably between neighbouring sites.">
              <Criteria items={[
                { num: 1, text: "Up to 4 storeys / ≤ 12m height — habitable to habitable", metric: "12m" },
                { num: 2, text: "5–8 storeys / up to 25m height — habitable to habitable", metric: "18m" },
                { num: 3, text: "9+ storeys / over 25m height — habitable to habitable", metric: "24m" },
                { num: 4, text: "Half of the separation distance is contained on each site (where buildings are on different sites).", metric: "" },
              ]} />

              <Guidance items={[
                "Separation between non-habitable rooms (kitchens, bathrooms, laundries) and habitable rooms can be reduced by up to 25%.",
                "Separation distances are measured between the external wall of one building and the external wall of the other (excluding eaves and minor projections of less than 600mm).",
                "Where building separation cannot be achieved, screening, offset of windows, sill heights of 1500mm+, or fixed glazing may be considered to mitigate privacy impacts.",
                "Building separation is critical for solar access — narrow gaps create deep shadows and undermine the 70% solar access target.",
              ]} />
            </Objective>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/*               PART 3: COMMUNAL OPEN SPACE (3D)       */}
      {/* ═══════════════════════════════════════════════════ */}
      <section id="3D" data-section="3D" className="py-24 px-6 md:px-12 lg:px-20">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <SectionHeader
              part="Part 3 — Siting the Development"
              num="3D"
              title="Communal & public open space"
              intro="Communal open space is the shared backyard of apartment living. It supports recreation, social interaction, and ecological function. The criteria are simple but unforgiving: enough area, enough sunlight, enough deep soil for trees to actually mature."
            />
          </Reveal>

          <Reveal>
            <div className="my-12 p-2 bg-white rounded-sm border" style={{ borderColor: C.rule }}>
              <CommunalOpenSpaceDiagram />
              <Caption figure="Figure 3D.1">
                Indicative site plan. Two apartment buildings (60 dwellings combined) on a 2,400m² site. Communal open space wraps the courtyard and includes mature trees, paved paths, seating, and a play area for children.
              </Caption>
            </div>
          </Reveal>

          <Reveal>
            <Objective code="3D-1" title="An adequate area of communal open space is provided to enhance residential amenity and to provide opportunities for landscaping.">
              <Criteria items={[
                { num: 1, text: "Communal open space, as a percentage of site area", metric: "≥ 25%" },
                { num: 2, text: "Direct sunlight to at least 50% of the principal usable area on 21 June", metric: "≥ 2 hours, 9am–3pm" },
                { num: 3, text: "Deep soil zone — minimum dimension and area", metric: "≥ 7% of site, min 6m wide" },
              ]} />

              <Guidance items={[
                "Communal open space should be consolidated, not fragmented. A single courtyard 400m² works better than four 100m² leftover spaces.",
                "Locate communal open space adjoining the most public face of the building, not tucked behind service areas.",
                "Provide a mix of activities: passive seating, play space for children, a barbecue area, and space simply to walk through.",
                "Deep soil zones must be capable of supporting large canopy trees (≥ 12m mature height). Concrete-bottomed planters do not count.",
                "Rooftop communal spaces can supplement (not replace) ground-level open space, and need wind protection, shade, and step-free access.",
              ]} />
            </Objective>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/*               PART 3: VISUAL PRIVACY (3F)            */}
      {/* ═══════════════════════════════════════════════════ */}
      <section id="3F" data-section="3F" className="py-24 px-6 md:px-12 lg:px-20"
               style={{ background: C.paper }}>
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <SectionHeader
              part="Part 3 — Siting the Development"
              num="3F"
              title="Visual privacy"
              intro="Visual privacy is the right to exist inside your apartment without being watched. Adequate separation between habitable rooms and balconies — combined with thoughtful window placement, screening, and outlook — keeps neighbours civil and homes liveable."
            />
          </Reveal>

          <Reveal>
            <div className="my-12 p-2 bg-white rounded-sm border" style={{ borderColor: C.rule }}>
              <VisualPrivacyDiagram />
              <Caption figure="Figure 3F.1">
                Plan view of two apartment buildings on adjoining sites. Habitable-to-habitable separation of 12m (up to 4 storeys) protects against direct overlooking from facing windows and balconies.
              </Caption>
            </div>
          </Reveal>

          <Reveal>
            <Objective code="3F-1" title="Adequate building separation distances and design features protect the visual privacy of residents and their neighbours.">
              <Guidance items={[
                "Apply building separation distances from section 2F as the primary tool for visual privacy.",
                "Where separation cannot be achieved, mitigate through: offset window placement, sill heights ≥ 1.5m, fixed/obscured glazing, external louvres, planting screens, and balcony privacy screens.",
                "Avoid balconies that face directly into a neighbouring habitable room within the minimum separation distance.",
                "Use level changes (lowered ground floor courtyards, raised mezzanines) to break direct sight lines between adjoining apartments.",
                "Internal layouts should locate bedrooms away from facing windows where separation is constrained.",
              ]} />
            </Objective>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/*               PART 4: SOLAR ACCESS (4A)              */}
      {/* ═══════════════════════════════════════════════════ */}
      <section id="4A" data-section="4A" className="py-24 px-6 md:px-12 lg:px-20 adg-page-break">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <SectionHeader
              part="Part 4 — Designing the Building"
              num="4A"
              title="Solar and daylight access"
              intro="Direct sunlight is a non-negotiable amenity of apartment living. It dries clothes, kills mould, lifts mood, and lowers winter heating loads. The 2-hour mid-winter target — 70% of all apartments — is one of the most important numbers in this entire guide."
            />
          </Reveal>

          <Reveal>
            <div className="my-12 p-2 bg-white rounded-sm border" style={{ borderColor: C.rule }}>
              <SolarPathDiagram />
              <Caption figure="Figure 4A.1">
                Sydney sun path. Summer noon altitude reaches 79° — almost overhead. Winter noon altitude drops to 33° — light enters deep into apartments. Eaves, balconies, and shading devices are designed against these two extremes.
              </Caption>
            </div>
          </Reveal>

          <Reveal>
            <Objective code="4A-1" title="To optimise the number of apartments receiving sunlight to habitable rooms, primary windows, and private open space.">
              <Criteria items={[
                { num: 1, text: "Apartments receiving ≥ 2 hours direct sunlight between 9am and 3pm at mid-winter (Sydney metro, Newcastle, Wollongong)", metric: "≥ 70%" },
                { num: 2, text: "Apartments receiving ≥ 3 hours direct sunlight elsewhere in NSW", metric: "≥ 70%" },
                { num: 3, text: "Apartments that receive no direct sunlight between 9am and 3pm at mid-winter", metric: "≤ 15%" },
              ]} />
            </Objective>
          </Reveal>

          <Reveal>
            <div className="my-12 p-2 bg-white rounded-sm border" style={{ borderColor: C.rule }}>
              <SolarAccessRule />
              <Caption figure="Figure 4A.2">
                The 70% rule visualised. Of every 20 apartments in a building, at least 14 must receive 2 hours of direct sunlight between 9am and 3pm on 21 June. No more than 3 apartments may receive no sunlight at all.
              </Caption>
            </div>
          </Reveal>

          <Reveal>
            <Objective code="4A-2" title="Daylight access is maximised where direct sunlight is limited.">
              <Guidance items={[
                "Courtyards, skylights, and high-level windows (sills ≥ 1.5m) are used only as a secondary light source in habitable rooms.",
                "Where courtyards are used: restrict to kitchens, bathrooms, and service areas; conceal building services; keep the courtyard open to the sky; ensure access for cleaning and maintenance.",
                "Optimise reflected light through: reflective exterior surfaces opposite south-facing windows, light-coloured internal finishes, integrated light shelves, and positioning windows to face other reflective surfaces.",
              ]} />
            </Objective>
          </Reveal>

          <Reveal>
            <Objective code="4A-3" title="Design incorporates shading and glare control, particularly for the warmer months.">
              <Guidance items={[
                "Balconies and sun shading extend far enough to shade summer sun (high angle), but allow winter sun (low angle) to penetrate living areas.",
                "Use horizontal shading (eaves, awnings, balconies) for north-facing windows.",
                "Use vertical shading (louvres, fins) for east and especially west-facing windows.",
                "Operable shading is preferred — residents can adjust to weather and season.",
                "High-performance glass with reflectance below 20% (avoid mirror-finish reflective films which dazzle neighbours).",
              ]} />
            </Objective>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/*               PART 4: NATURAL VENTILATION (4B)       */}
      {/* ═══════════════════════════════════════════════════ */}
      <section id="4B" data-section="4B" className="py-24 px-6 md:px-12 lg:px-20"
               style={{ background: C.paper }}>
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <SectionHeader
              part="Part 4 — Designing the Building"
              num="4B"
              title="Natural ventilation"
              intro="Cross ventilation is the difference between an apartment that breathes and one that requires air-conditioning. Two openings on different aspects, of similar area, with prevailing breezes drawn through — that's the principle. The criteria translate it into design."
            />
          </Reveal>

          <Reveal>
            <div className="my-12 p-2 bg-white rounded-sm border" style={{ borderColor: C.rule }}>
              <CrossVentilationDiagram />
              <Caption figure="Figure 4B.1">
                Floor plate plan. The top row (5 cross-through apartments) achieves natural cross ventilation — prevailing NE breeze enters one face, exhausts through the other. The bottom row (3 single-aspect apartments) does not. Building depth ≤ 18m glass-to-glass.
              </Caption>
            </div>
          </Reveal>

          <Reveal>
            <Objective code="4B-1" title="All habitable rooms are naturally ventilated.">
              <Guidance items={[
                "Building orientation maximises capture of prevailing breezes for natural ventilation.",
                "Habitable room depths support natural ventilation.",
                "Unobstructed window opening area ≥ 5% of the floor area served.",
                "Light wells are not the primary air source for habitable rooms.",
                "Use adjustable windows with large effective openable areas; provide a variety of window types (awnings, louvres, casement) so occupants can configure the airflow.",
              ]} />
            </Objective>
          </Reveal>

          <Reveal>
            <Objective code="4B-3" title="The number of apartments with natural cross ventilation is maximised.">
              <Criteria items={[
                { num: 1, text: "Cross-ventilated apartments in the first 9 storeys", metric: "≥ 60%" },
                { num: 2, text: "Apartments at 10+ storeys are deemed cross-ventilated only if balcony enclosures allow adequate ventilation and cannot be fully sealed.", metric: "" },
                { num: 3, text: "Overall depth of a cross-over or cross-through apartment, glass-line to glass-line", metric: "≤ 18m" },
              ]} />

              <Guidance items={[
                "Buildings should include dual aspect, cross-through, and corner apartments.",
                "In cross-through apartments, inlet and outlet window areas should be approximately equal — this drives airflow most effectively.",
                "Minimise corners, doors, and rooms that obstruct airflow between inlet and outlet.",
                "Combine appropriate ceiling heights with limited apartment depth to maximise natural ventilation.",
              ]} />
            </Objective>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/*               PART 4: CEILING HEIGHTS (4C)           */}
      {/* ═══════════════════════════════════════════════════ */}
      <section id="4C" data-section="4C" className="py-24 px-6 md:px-12 lg:px-20">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <SectionHeader
              part="Part 4 — Designing the Building"
              num="4C"
              title="Ceiling heights"
              intro="Ceiling height is one of the cheapest amenity wins in apartment design. Every extra 100mm makes rooms feel larger, daylight reach further, and ventilation work better. It also future-proofs ground floors for adaptive reuse — yesterday's parking can become tomorrow's cafe."
            />
          </Reveal>

          <Reveal>
            <div className="my-12 p-2 bg-white rounded-sm border" style={{ borderColor: C.rule }}>
              <CeilingHeightsDiagram />
              <Caption figure="Figure 4C.1">
                Two building sections. Left: mixed-use building with 4.0m cafe ground floor, 3.3m mixed-use first floor, then residential at 2.7m. Right: pure residential building with 2.7m throughout. Heights measured FFL (finished floor level) to FCL (finished ceiling level).
              </Caption>
            </div>
          </Reveal>

          <Reveal>
            <Objective code="4C-1" title="Ceiling height achieves sufficient natural ventilation and daylight access.">
              <Criteria items={[
                { num: 1, text: "Habitable rooms in apartments and mixed-use buildings", metric: "≥ 2.7m" },
                { num: 2, text: "Non-habitable rooms (bathrooms, kitchens with mechanical exhaust, hallways)", metric: "≥ 2.4m" },
                { num: 3, text: "Adaptable apartments — main living and circulation", metric: "≥ 2.4m" },
                { num: 4, text: "Mixed-use building floors — first level above ground", metric: "≥ 3.3m" },
                { num: 5, text: "Cafe and restaurant ground floor (allowing for servicing)", metric: "≥ 4.0m" },
                { num: 6, text: "Attic spaces — minimum useful height", metric: "≥ 1.8m" },
              ]} />

              <Guidance items={[
                "Increase ceiling height to 3.0m+ for the ground floor of all residential buildings to support adaptive reuse.",
                "For two-storey apartments, 2.7m is required only for the main living area floor.",
                "Provide higher ceilings for double-height living spaces, lobbies, and primary entries — they signal generosity and orientation.",
                "Allow for structural depth, services, and finishes when calculating overall building height (typically +0.4m per floor on top of ceiling height).",
              ]} />
            </Objective>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/*               PART 4: APARTMENT SIZE (4D)            */}
      {/* ═══════════════════════════════════════════════════ */}
      <section id="4D" data-section="4D" className="py-24 px-6 md:px-12 lg:px-20"
               style={{ background: C.paper }}>
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <SectionHeader
              part="Part 4 — Designing the Building"
              num="4D"
              title="Apartment size and layout"
              intro="The minimum apartment sizes set the floor — literally. They are not aspirational targets, they are the smallest dwelling NSW will accept. A good apartment exceeds them in proportion as well as in raw area: rooms have width, not just floor space."
            />
          </Reveal>

          <Reveal>
            <div className="my-12 p-2 bg-white rounded-sm border" style={{ borderColor: C.rule }}>
              <ApartmentLayoutPlan />
              <Caption figure="Figure 4D.1">
                Two-bedroom dual-aspect corner apartment. 75m² internal area exceeds the 70m² minimum. Living and master bedroom face north; balcony deep enough (2m) for a table and chairs. Storage and laundry consolidated. Cross-ventilated.
              </Caption>
            </div>
          </Reveal>

          <Reveal>
            <Objective code="4D-1" title="The layout of rooms within an apartment supports liveable, functional spaces.">
              <Criteria items={[
                { num: 1, text: "Studio apartment — minimum internal area", metric: "35 m²" },
                { num: 2, text: "1 bedroom — minimum internal area", metric: "50 m²" },
                { num: 3, text: "2 bedroom — minimum internal area", metric: "70 m²" },
                { num: 4, text: "3 bedroom — minimum internal area", metric: "90 m²" },
                { num: 5, text: "Add for each additional bathroom beyond one", metric: "+5 m²" },
                { num: 6, text: "Master bedroom — minimum dimensions", metric: "≥ 10m² · 3.0m wide" },
                { num: 7, text: "Other bedrooms — minimum dimensions", metric: "≥ 9m² · 3.0m wide" },
                { num: 8, text: "Living/dining — minimum width (2-bed and larger)", metric: "≥ 4.0m" },
              ]} />

              <Guidance items={[
                "Minimum sizes apply to internal area only (excluding balconies, courtyards, terraces, storage, lift overruns, and parking).",
                "Bedroom width of 3.0m is critical — it allows a queen bed plus circulation.",
                "Living areas should be combined with dining and located adjacent to the kitchen for flexibility.",
                "Avoid corridor-style layouts where you walk through the kitchen to reach the bedroom.",
                "Habitable room depth (room dimension into building) should not exceed 2.5x the ceiling height for adequate daylight.",
              ]} />
            </Objective>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/*               PART 4: PRIVATE OPEN SPACE (4E)        */}
      {/* ═══════════════════════════════════════════════════ */}
      <section id="4E" data-section="4E" className="py-24 px-6 md:px-12 lg:px-20">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <SectionHeader
              part="Part 4 — Designing the Building"
              num="4E"
              title="Private open space and balconies"
              intro="A balcony is not a balcony if you cannot sit two people at a small table on it. The minimum dimensions exist precisely to keep developers from labelling a 1m-deep ledge as 'private open space'. Depth, not just area, makes a balcony useful."
            />
          </Reveal>

          <Reveal>
            <Objective code="4E-1" title="Private open space (balcony, terrace or courtyard) is provided for every apartment.">
              <Criteria items={[
                { num: 1, text: "Studio apartment", metric: "≥ 4 m² · no minimum depth" },
                { num: 2, text: "1 bedroom — balcony", metric: "≥ 8 m² · ≥ 2m deep" },
                { num: 3, text: "2 bedroom — balcony", metric: "≥ 10 m² · ≥ 2m deep" },
                { num: 4, text: "3+ bedroom — balcony", metric: "≥ 12 m² · ≥ 2.4m deep" },
                { num: 5, text: "Ground floor apartments (terrace/courtyard) — minimum dimension", metric: "≥ 15 m² · ≥ 3m deep" },
              ]} />

              <Guidance items={[
                "Locate primary balconies adjacent to the main living area — the door from living to balcony should slide or open generously.",
                "Provide privacy from neighbouring balconies through solid screens, planting, or offset arrangement.",
                "Wintergardens (enclosable balconies) work well for noisy or windy environments. They count as balcony area only if they remain operable.",
                "Provide a tap, drainage, and a power outlet on every balcony — clothes drying, plant watering, and outdoor cooking depend on these.",
                "Balconies on the ground floor, opening directly to communal open space, should still feel private — use level changes, low walls, and planting.",
              ]} />
            </Objective>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/*               PART 4: UNIVERSAL DESIGN (4Q)          */}
      {/* ═══════════════════════════════════════════════════ */}
      <section id="4Q" data-section="4Q" className="py-24 px-6 md:px-12 lg:px-20"
               style={{ background: C.paper }}>
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <SectionHeader
              part="Part 4 — Designing the Building"
              num="4Q"
              title="Universal design"
              intro="A home that works for an 80-year-old works for everyone. Universal design is about removing the small frictions — door widths, step heights, switch positions — that turn an ordinary apartment into an obstacle course as occupants age or as needs change."
            />
          </Reveal>

          <Reveal>
            <div className="my-12 p-2 bg-white rounded-sm border" style={{ borderColor: C.rule }}>
              <UniversalDesignDiagram />
              <Caption figure="Figure 4Q.1">
                Adaptable apartment plan. 1500mm turning circles in living, kitchen, and bathroom. 850mm clear doorways throughout. 1000mm clearance to one side of the bed. Roll-in shower with continuous floor finish.
              </Caption>
            </div>
          </Reveal>

          <Reveal>
            <Objective code="4Q-1" title="Universal design features are included to promote flexible housing.">
              <Criteria items={[
                { num: 1, text: "Adaptable apartments in larger developments (60+ units)", metric: "≥ 20% of total" },
                { num: 2, text: "Step-free path of travel from main entry to all habitable rooms", metric: "Required" },
                { num: 3, text: "Clear width of internal doorways", metric: "≥ 850mm" },
                { num: 4, text: "Turning circles in kitchens, bathrooms, living rooms", metric: "≥ 1500mm ø" },
                { num: 5, text: "Compliance with AS 4299 — Adaptable Housing", metric: "Class C" },
              ]} />

              <Guidance items={[
                "Reinforce bathroom walls behind future grab-rail locations during construction — adding them later means cutting tiles.",
                "Power outlets at 600mm above finished floor; light switches at 900–1100mm.",
                "Provide 1000mm clearance to one side of beds in adaptable apartments.",
                "Roll-in (curbless) showers with linear drainage achieve both accessibility and contemporary design language.",
                "Consider the entire journey — kerb cut at street, lift size, lobby width, apartment door, internal circulation.",
              ]} />
            </Objective>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/*               CLOSING / NEXT STEPS                  */}
      {/* ═══════════════════════════════════════════════════ */}
      <section className="py-24 px-6 md:px-12 lg:px-20" style={{ background: C.navy, color: C.cream }}>
        <div className="max-w-5xl mx-auto text-center">
          <Reveal>
            <span className="text-xs font-mono uppercase tracking-[0.3em]" style={{ color: C.bronze }}>
              Closing
            </span>
            <h2 className="font-display text-4xl md:text-6xl font-light mt-4 mb-8 leading-tight"
                style={{ letterSpacing: "-0.02em" }}>
              The next 50 years of apartment living will be designed in the next 5.
            </h2>
            <p className="text-lg leading-relaxed max-w-3xl mx-auto opacity-80 mb-12">
              This guide covers the most consequential sections of the Apartment Design Guide.
              The full instrument runs to 27 design objectives and hundreds of pages of guidance —
              accessible at the NSW Planning Portal and through your registered design practitioner.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="https://www.planning.nsw.gov.au/policy-and-legislation/housing/apartment-design-guide"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-sm transition"
                style={{ background: C.bronze, color: C.navy }}
              >
                NSW Planning Portal <ArrowRight size={16} />
              </a>
              <Link
                href="/website/contact"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-sm border transition"
                style={{ borderColor: C.bronze, color: C.cream }}
              >
                Talk to 369 Alliance <ArrowRight size={16} />
              </Link>
              <button
                onClick={handlePrint}
                className="adg-no-print inline-flex items-center gap-2 px-6 py-3 rounded-sm border transition"
                style={{ borderColor: C.bronze, color: C.cream }}
              >
                <Printer size={16} /> Print this guide
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      <div className="adg-no-print">
        <WebsiteFooter onOpenPopup={() => {}} />
      </div>
    </div>
  );
}
