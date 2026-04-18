/**
 * 369 Alliance — Circular SVG Logo
 * Accurate recreation of the brand mark:
 *   • Three labeled nodes: 9 (top), 3 (lower-right), 6 (lower-left) — 120° apart
 *   • Heavy navy arc 240° from N9 → N3 → N6 (clockwise)
 *   • Thin gold arc 120° from N6 → N9 (clockwise, left side)
 *   • Internal compass grid + centre gold dot
 *
 * variant="light"  → navy arcs on light/white backgrounds
 * variant="dark"   → white arcs on dark/navy backgrounds
 *
 * Numbers are shown when size >= 60px.
 */

interface Logo369Props {
  size?: number;
  variant?: "dark" | "light";
  className?: string;
}

// Arc radius (centre 50,50)
const R = 40;

// Node positions — 120° clockwise starting from top (12 o'clock)
const N9 = { x: 50,                                  y: 50 - R,                               label: "9" }; // top
const N3 = { x: 50 + R * Math.sin((2 * Math.PI) / 3), y: 50 - R * Math.cos((2 * Math.PI) / 3), label: "3" }; // lower-right
const N6 = { x: 50 + R * Math.sin((4 * Math.PI) / 3), y: 50 - R * Math.cos((4 * Math.PI) / 3), label: "6" }; // lower-left

// Rounded arc path values
const [n9x, n9y] = [N9.x.toFixed(2), N9.y.toFixed(2)];
const [n3x, n3y] = [N3.x.toFixed(2), N3.y.toFixed(2)];
const [n6x, n6y] = [N6.x.toFixed(2), N6.y.toFixed(2)];

export function Logo369({ size = 100, variant = "dark", className = "" }: Logo369Props) {
  const isLight   = variant === "light";
  const arcClr    = isLight ? "#1a1a2e" : "#ffffff";
  const nodeBg    = isLight ? "#ffffff" : "#13132a";
  const nodeText  = isLight ? "#1a1a2e" : "#ffffff";
  const innerClr  = isLight ? "rgba(26,26,46,0.25)" : "rgba(255,255,255,0.2)";
  const tickClr   = "#A68A64";
  const showNums  = size >= 60;
  const nr        = 8.2;  // node circle radius

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* ── Outer guide ring ──────────────────────────────────── */}
      <circle cx="50" cy="50" r="47" stroke={arcClr} strokeWidth="0.5" opacity="0.1" />

      {/* ── Main arcs ─────────────────────────────────────────── */}
      {/* Navy/white major arc: N9 → (CW through N3) → N6  (240°, large-arc=1) */}
      <path
        d={`M ${n9x} ${n9y} A ${R} ${R} 0 1 1 ${n6x} ${n6y}`}
        stroke={arcClr}
        strokeWidth="7.5"
        strokeLinecap="butt"
      />
      {/* Gold minor arc: N6 → (CW up-left side) → N9  (120°, large-arc=0) */}
      <path
        d={`M ${n6x} ${n6y} A ${R} ${R} 0 0 1 ${n9x} ${n9y}`}
        stroke="#A68A64"
        strokeWidth="4"
        strokeLinecap="butt"
      />

      {/* ── Inner ring ────────────────────────────────────────── */}
      <circle cx="50" cy="50" r="24" stroke={innerClr} strokeWidth="0.8" />

      {/* ── Compass grid lines ────────────────────────────────── */}
      {/* Main crosshair */}
      <line x1="26" y1="50" x2="74" y2="50" stroke={innerClr} strokeWidth="0.8" strokeLinecap="round" />
      <line x1="50" y1="26" x2="50" y2="74" stroke={innerClr} strokeWidth="0.8" strokeLinecap="round" />
      {/* Diagonals (45°) */}
      <line x1="33" y1="33" x2="67" y2="67" stroke={innerClr} strokeWidth="0.5" strokeLinecap="round" />
      <line x1="67" y1="33" x2="33" y2="67" stroke={innerClr} strokeWidth="0.5" strokeLinecap="round" />

      {/* Cardinal tick marks at r≈29 */}
      <line x1="50" y1="20" x2="50" y2="25" stroke={tickClr} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="50" y1="75" x2="50" y2="80" stroke={tickClr} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="20" y1="50" x2="25" y2="50" stroke={tickClr} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="75" y1="50" x2="80" y2="50" stroke={tickClr} strokeWidth="1.2" strokeLinecap="round" />

      {/* ── Centre dot ────────────────────────────────────────── */}
      <circle cx="50" cy="50" r="4" fill="#A68A64" />
      <circle cx="50" cy="50" r="2" fill={arcClr} />

      {/* ── Node circles (drawn last so they sit on top of arcs) ─ */}
      {[N9, N3, N6].map(({ x, y, label }) => (
        <g key={label}>
          {/* Solid fill first to cover arc endpoint cleanly */}
          <circle cx={x.toFixed(2)} cy={y.toFixed(2)} r={nr} fill={nodeBg} />
          {/* Gold border */}
          <circle cx={x.toFixed(2)} cy={y.toFixed(2)} r={nr} stroke="#A68A64" strokeWidth="1.8" fill="none" />
          {/* Number label */}
          {showNums && (
            <text
              x={x.toFixed(2)}
              y={y.toFixed(2)}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="7.5"
              fontWeight="700"
              fontFamily="Montserrat, sans-serif"
              fill={nodeText}
            >
              {label}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}
