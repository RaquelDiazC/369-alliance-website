/**
 * 369 Alliance System – Landing Page
 * Design: Authoritative Dark Navy with Bronze Accents
 * Deep Navy (#1a1a2e) header, Bronze gradient CTAs, role cards grid
 * Icons: Full-colour SVG inside dark navy rounded-square tiles (ADM style)
 */
import { useLocation } from "wouter";
import { ROLES } from "@/lib/data";

// Full-colour SVG icon components for each portal role
const RoleIcon = ({ roleKey }: { roleKey: string }) => {
  const icons: Record<string, React.ReactNode> = {
    developers: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="14" width="4" height="8" rx="1" fill="#f59e0b"/>
        <rect x="7" y="10" width="4" height="12" rx="1" fill="#ef4444"/>
        <rect x="12" y="6" width="4" height="16" rx="1" fill="#3b82f6"/>
        <rect x="17" y="2" width="4" height="20" rx="1" fill="#10b981"/>
        <line x1="2" y1="22" x2="22" y2="22" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M4 13l4-5 4 3 4-6 4-2" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      </svg>
    ),
    builders: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" fill="#f59e0b" stroke="#fff" strokeWidth="1"/>
      </svg>
    ),
    pca: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <rect x="5" y="2" width="14" height="20" rx="2" fill="#3b82f6" opacity="0.9"/>
        <rect x="8" y="2" width="8" height="4" rx="1" fill="#1e3a5f"/>
        <line x1="8" y1="10" x2="16" y2="10" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="8" y1="13" x2="16" y2="13" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
        <polyline points="8 16 10 18 14 15" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      </svg>
    ),
    "design-practitioners": (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <polygon points="3 20 12 4 21 20" fill="#f59e0b" opacity="0.85" stroke="#fff" strokeWidth="1" strokeLinejoin="round"/>
        <line x1="12" y1="9" x2="12" y2="16" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="12" cy="18" r="1" fill="#fff"/>
      </svg>
    ),
    strata: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="8" height="8" rx="1.5" fill="#3b82f6"/>
        <rect x="13" y="3" width="8" height="8" rx="1.5" fill="#10b981"/>
        <rect x="3" y="13" width="8" height="8" rx="1.5" fill="#f59e0b"/>
        <rect x="13" y="13" width="8" height="8" rx="1.5" fill="#ef4444"/>
      </svg>
    ),
    "building-manager": (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="9" r="4" fill="#f59e0b" opacity="0.9" stroke="#fff" strokeWidth="1"/>
        <circle cx="12" cy="9" r="1.5" fill="#1a1a2e"/>
        <path d="M12 13v3M9 16h6" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"/>
        <path d="M6 20c0-3.31 2.69-6 6-6s6 2.69 6 6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      </svg>
    ),
    owners: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="#3b82f6" opacity="0.85" stroke="#fff" strokeWidth="1"/>
        <rect x="9" y="14" width="6" height="8" rx="1" fill="#fff" opacity="0.9"/>
        <circle cx="12" cy="11" r="1.5" fill="#f59e0b"/>
      </svg>
    ),
    government: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
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
      width: 56, height: 56, borderRadius: 14,
      background: "linear-gradient(135deg, #1a1a2e, #252545)",
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
    }}>
      {icons[roleKey] || (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="18" height="18" rx="2" fill="#A68A64" opacity="0.8"/>
          <path d="M9 12h6M12 9v6" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      )}
    </div>
  );
};

// Full-colour SVG icons for feature strip
const FeatureIcon = ({ type }: { type: string }) => {
  const icons: Record<string, React.ReactNode> = {
    inspection: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
        <circle cx="11" cy="11" r="7" fill="#3b82f6" opacity="0.2"/>
        <circle cx="11" cy="11" r="7" stroke="#3b82f6" strokeWidth="2" fill="none"/>
        <line x1="16.5" y1="16.5" x2="21" y2="21" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round"/>
        <polyline points="8 11 10 13 14 9" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      </svg>
    ),
    report: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="2" width="16" height="20" rx="2" fill="#f59e0b" opacity="0.15"/>
        <rect x="4" y="2" width="16" height="20" rx="2" stroke="#f59e0b" strokeWidth="1.5" fill="none"/>
        <line x1="8" y1="8" x2="16" y2="8" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="8" y1="12" x2="16" y2="12" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="8" y1="16" x2="12" y2="16" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M14 15l2 2 4-4" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      </svg>
    ),
    timeline: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="6" width="20" height="12" rx="2" fill="#8b5cf6" opacity="0.15"/>
        <rect x="2" y="6" width="20" height="12" rx="2" stroke="#8b5cf6" strokeWidth="1.5" fill="none"/>
        <rect x="4" y="9" width="6" height="3" rx="1" fill="#3b82f6"/>
        <rect x="11" y="9" width="9" height="3" rx="1" fill="#f59e0b"/>
        <rect x="4" y="14" width="4" height="2" rx="1" fill="#10b981"/>
        <rect x="9" y="14" width="7" height="2" rx="1" fill="#ef4444"/>
      </svg>
    ),
    defect: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" fill="#ef4444" opacity="0.15" stroke="#ef4444" strokeWidth="1.5"/>
        <line x1="12" y1="9" x2="12" y2="13" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="12" cy="17" r="1" fill="#ef4444"/>
      </svg>
    ),
  };
  return <div style={{ marginBottom: 4 }}>{icons[type]}</div>;
};

export default function LandingPage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#f5f4f1" }}>
      {/* Header */}
      <header className="bg-navy text-white" style={{ background: "#1a1a2e" }}>
        <div className="max-w-7xl mx-auto px-6 py-0 flex items-center justify-between" style={{ height: 64 }}>
          <div className="flex items-center gap-3">
            <div style={{
              width: 40, height: 40,
              background: "linear-gradient(135deg, #7A6342, #A68A64)",
              borderRadius: 10,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 800, fontSize: 16, color: "#fff", letterSpacing: "0.02em"
            }}>369</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, letterSpacing: "0.02em" }}>369 Alliance</div>
              <div style={{ fontSize: 11, color: "#A68A64", letterSpacing: "0.06em", textTransform: "uppercase" }}>Construction Management System</div>
            </div>
          </div>
          <button
            onClick={() => navigate("/adm")}
            className="btn-bronze"
            style={{
              padding: "8px 20px", borderRadius: 6, fontSize: 13, fontWeight: 600,
              background: "linear-gradient(135deg, #7A6342, #A68A64)", color: "#fff",
              border: "none", cursor: "pointer", letterSpacing: "0.04em"
            }}
          >
            ADM →
          </button>
        </div>
      </header>

      {/* Hero */}
      <div style={{ background: "#1a1a2e", paddingBottom: 48, paddingTop: 48 }}>
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 style={{ fontSize: 36, fontWeight: 700, color: "#fff", marginBottom: 12, letterSpacing: "-0.01em" }}>
            369 Alliance System
          </h1>
          <p style={{ fontSize: 16, color: "#c5b49a", maxWidth: 560, margin: "0 auto 28px", lineHeight: 1.6 }}>
            A unified platform for construction project management, defect tracking, and compliance across all stakeholders.
          </p>

        </div>
      </div>

      {/* Role Cards */}
      <main className="max-w-7xl mx-auto px-6 py-12 w-full">
        <div style={{ marginBottom: 32, textAlign: "center" }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#1a1a2e", marginBottom: 6 }}>Select Your Portal</h2>
          <p style={{ fontSize: 14, color: "#6b7280" }}>Choose your role to access the relevant section of the system.</p>
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: 20
        }}>
          {ROLES.map(role => (
            <div
              key={role.key}
              className="role-card"
              onClick={() => navigate(`/portal/${role.key}`)}
            >
              <RoleIcon roleKey={role.key} />
              <div style={{ fontWeight: 600, fontSize: 14, color: "#1a1a2e", textAlign: "center" }}>{role.label}</div>
              <div style={{ fontSize: 12, color: "#9ca3af" }}>Access Portal →</div>
            </div>
          ))}
        </div>


      </main>

      {/* Footer */}
      <footer style={{ background: "#1a1a2e", color: "#6b7280", padding: "20px 24px", textAlign: "center", fontSize: 12, marginTop: "auto" }}>
        <span style={{ color: "#A68A64", fontWeight: 600 }}>369 Alliance</span> · Construction Management System · © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
