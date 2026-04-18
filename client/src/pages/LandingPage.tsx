/**
 * 369 Alliance System – Landing Page (Post-Login Portal Selector)
 * Premium dark-navy design with SVG circular logo, glass hero, and role cards.
 * Brand: Deep Navy #1a1a2e · Bronze #7A6342 · Gold #A68A64
 */
import { useLocation } from "wouter";
import { ROLES } from "@/lib/data";
import { Logo369 } from "@/components/Logo369";

// ── Role portal SVG icons ────────────────────────────────────────────────────
const RoleIcon = ({ roleKey }: { roleKey: string }) => {
  const icons: Record<string, React.ReactNode> = {
    developers: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="14" width="4" height="8" rx="1" fill="#f59e0b"/>
        <rect x="7" y="10" width="4" height="12" rx="1" fill="#ef4444"/>
        <rect x="12" y="6" width="4" height="16" rx="1" fill="#3b82f6"/>
        <rect x="17" y="2" width="4" height="20" rx="1" fill="#10b981"/>
        <line x1="2" y1="22" x2="22" y2="22" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M4 13l4-5 4 3 4-6 4-2" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      </svg>
    ),
    builders: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" fill="#f59e0b" stroke="#fff" strokeWidth="1"/>
      </svg>
    ),
    pca: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <rect x="5" y="2" width="14" height="20" rx="2" fill="#3b82f6" opacity="0.9"/>
        <rect x="8" y="2" width="8" height="4" rx="1" fill="#1e3a5f"/>
        <line x1="8" y1="10" x2="16" y2="10" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="8" y1="13" x2="16" y2="13" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
        <polyline points="8 16 10 18 14 15" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      </svg>
    ),
    "design-practitioners": (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <polygon points="3 20 12 4 21 20" fill="#f59e0b" opacity="0.85" stroke="#fff" strokeWidth="1" strokeLinejoin="round"/>
        <line x1="12" y1="9" x2="12" y2="16" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="12" cy="18" r="1" fill="#fff"/>
      </svg>
    ),
    strata: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="8" height="8" rx="1.5" fill="#3b82f6"/>
        <rect x="13" y="3" width="8" height="8" rx="1.5" fill="#10b981"/>
        <rect x="3" y="13" width="8" height="8" rx="1.5" fill="#f59e0b"/>
        <rect x="13" y="13" width="8" height="8" rx="1.5" fill="#ef4444"/>
      </svg>
    ),
    "building-manager": (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4" fill="#f59e0b" opacity="0.9" stroke="#fff" strokeWidth="1"/>
        <path d="M6 20c0-3.31 2.69-6 6-6s6 2.69 6 6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      </svg>
    ),
    owners: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="#3b82f6" opacity="0.85" stroke="#fff" strokeWidth="1"/>
        <rect x="9" y="14" width="6" height="8" rx="1" fill="#fff" opacity="0.9"/>
        <circle cx="12" cy="11" r="1.5" fill="#f59e0b"/>
      </svg>
    ),
    government: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="20" width="20" height="2" rx="1" fill="#fff" opacity="0.7"/>
        <rect x="4" y="10" width="2" height="10" rx="0.5" fill="#f59e0b"/>
        <rect x="8" y="10" width="2" height="10" rx="0.5" fill="#f59e0b"/>
        <rect x="12" y="10" width="2" height="10" rx="0.5" fill="#f59e0b"/>
        <rect x="16" y="10" width="2" height="10" rx="0.5" fill="#f59e0b"/>
        <path d="M2 10l10-7 10 7" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <rect x="9" y="7" width="6" height="3" rx="0.5" fill="#ef4444"/>
      </svg>
    ),
  };

  return (
    <div style={{
      width: 52, height: 52, borderRadius: 13, flexShrink: 0,
      background: "linear-gradient(135deg, #1e2244, #252850)",
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: "0 4px 12px rgba(0,0,0,0.35)",
      border: "1px solid rgba(166,138,100,0.12)",
    }}>
      {icons[roleKey] || (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="18" height="18" rx="2" fill="#A68A64" opacity="0.8"/>
          <path d="M9 12h6M12 9v6" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      )}
    </div>
  );
};

// ── Stat pill ────────────────────────────────────────────────────────────────
const Stat = ({ val, lab }: { val: string; lab: string }) => (
  <div style={{ textAlign: "center", padding: "0 24px" }}>
    <div style={{ fontSize: 26, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", fontFamily: "Montserrat, sans-serif" }}>{val}</div>
    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.12em", marginTop: 2, fontWeight: 500 }}>{lab}</div>
  </div>
);

// ── Main component ───────────────────────────────────────────────────────────
export default function LandingPage() {
  const [, navigate] = useLocation();

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#0f0f1e" }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header style={{
        background: "rgba(15,15,30,0.98)",
        borderBottom: "1px solid rgba(166,138,100,0.12)",
        backdropFilter: "blur(12px)",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Brand mark */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Logo369 size={40} variant="dark" />
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#fff", letterSpacing: "0.02em", fontFamily: "Montserrat, sans-serif" }}>
                369 Alliance
              </div>
              <div style={{ fontSize: 10, color: "#A68A64", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>
                Construction Management System
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => navigate("/adm")}
              style={{
                padding: "7px 18px", borderRadius: 6, fontSize: 12, fontWeight: 700,
                background: "linear-gradient(135deg, #7A6342, #A68A64)", color: "#fff",
                border: "none", cursor: "pointer", letterSpacing: "0.06em", textTransform: "uppercase",
              }}
            >ADM →</button>
            <button
              onClick={() => navigate("/")}
              style={{
                padding: "7px 16px", borderRadius: 6, fontSize: 12, fontWeight: 600,
                background: "transparent", color: "rgba(255,255,255,0.45)",
                border: "1px solid rgba(255,255,255,0.12)", cursor: "pointer",
              }}
            >← Website</button>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <div style={{ position: "relative", overflow: "hidden", background: "linear-gradient(160deg, #0f0f1e 0%, #14142a 60%, #1a1a2e 100%)", paddingTop: 72, paddingBottom: 80 }}>
        {/* Radial glow accents */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(ellipse 600px 400px at 15% 50%, rgba(166,138,100,0.06) 0%, transparent 70%), radial-gradient(ellipse 400px 300px at 85% 30%, rgba(122,99,66,0.05) 0%, transparent 60%)",
          pointerEvents: "none",
        }} />

        {/* Decorative grid lines */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(166,138,100,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(166,138,100,0.03) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          pointerEvents: "none",
        }} />

        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>

            {/* Logo display */}
            <div style={{ marginBottom: 28, position: "relative" }}>
              <div style={{
                width: 112, height: 112, borderRadius: "50%",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(166,138,100,0.18)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 0 40px rgba(166,138,100,0.1)",
              }}>
                <Logo369 size={80} variant="dark" />
              </div>
            </div>

            {/* Eyebrow */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ width: 28, height: 1, background: "#A68A64" }} />
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#A68A64" }}>
                Secure Portal Access
              </span>
              <div style={{ width: 28, height: 1, background: "#A68A64" }} />
            </div>

            {/* Title */}
            <h1 style={{
              margin: 0, fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 800, color: "#fff",
              letterSpacing: "-0.02em", fontFamily: "Montserrat, sans-serif",
              lineHeight: 1.1, marginBottom: 16,
            }}>
              369 Alliance System
            </h1>
            <p style={{ margin: "0 auto", fontSize: 15, color: "rgba(255,255,255,0.45)", maxWidth: 540, lineHeight: 1.7, marginBottom: 48 }}>
              A unified platform for construction project management, defect tracking,
              and compliance across all NSW stakeholders.
            </p>

            {/* Stats bar */}
            <div style={{
              display: "inline-flex", alignItems: "center",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(166,138,100,0.14)",
              borderRadius: 12, padding: "20px 0",
            }}>
              <Stat val="30+" lab="Years Experience" />
              <div style={{ width: 1, height: 32, background: "rgba(166,138,100,0.2)" }} />
              <Stat val="6" lab="Service Pillars" />
              <div style={{ width: 1, height: 32, background: "rgba(166,138,100,0.2)" }} />
              <Stat val="NSW" lab="Specialists" />
              <div style={{ width: 1, height: 32, background: "rgba(166,138,100,0.2)" }} />
              <Stat val="8" lab="Portal Roles" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Portal selection ───────────────────────────────────────────────── */}
      <main style={{ flex: 1, background: "#f5f4f1", padding: "52px 24px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>

          {/* Section header */}
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 20, height: 1, background: "#A68A64" }} />
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#7A6342" }}>Portal Access</span>
              <div style={{ width: 20, height: 1, background: "#A68A64" }} />
            </div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#1a1a2e", marginBottom: 6, fontFamily: "Montserrat, sans-serif" }}>
              Select Your Role
            </h2>
            <p style={{ margin: 0, fontSize: 13, color: "#9ca3af" }}>
              Choose the portal that matches your role to access the relevant section of the system.
            </p>
          </div>

          {/* Cards grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
            gap: 16,
          }}>
            {ROLES.map(role => (
              <RoleCard key={role.key} roleKey={role.key} label={role.label} onClick={() => navigate(`/portal/${role.key}`)} />
            ))}
          </div>
        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer style={{ background: "#0f0f1e", borderTop: "1px solid rgba(166,138,100,0.08)", padding: "18px 24px", textAlign: "center", fontSize: 11, color: "#4b5563" }}>
        <span style={{ color: "#A68A64", fontWeight: 600 }}>369 Alliance</span>
        {" · "}Construction Management System{" · "}© {new Date().getFullYear()}
        {" · "}
        <span style={{ color: "rgba(166,138,100,0.5)" }}>Authorised Access Only</span>
      </footer>
    </div>
  );
}

// ── Role card sub-component ──────────────────────────────────────────────────
function RoleCard({ roleKey, label, onClick }: { roleKey: string; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "#fff",
        border: "1.5px solid #eae8e3",
        borderRadius: 14,
        padding: "24px 20px",
        cursor: "pointer",
        textAlign: "left",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        transition: "all 0.18s ease",
        width: "100%",
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLButtonElement;
        el.style.transform = "translateY(-3px)";
        el.style.boxShadow = "0 8px 28px rgba(0,0,0,0.10)";
        el.style.borderColor = "#A68A64";
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLButtonElement;
        el.style.transform = "translateY(0)";
        el.style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)";
        el.style.borderColor = "#eae8e3";
      }}
    >
      <RoleIcon roleKey={roleKey} />
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a2e", marginBottom: 4, fontFamily: "Montserrat, sans-serif" }}>
          {label}
        </div>
        <div style={{ fontSize: 11, color: "#9ca3af", display: "flex", alignItems: "center", gap: 4 }}>
          Access Portal
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <path d="M2 6h8M6 2l4 4-4 4" stroke="#A68A64" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </button>
  );
}
