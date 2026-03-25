/**
 * 369 Alliance System – Landing Page
 * Design: Authoritative Dark Navy with Bronze Accents
 * Deep Navy (#1a1a2e) header, Bronze gradient CTAs, role cards grid
 */
import { useLocation } from "wouter";
import { ROLES } from "@/lib/data";

const ROLE_ICONS: Record<string, string> = {
  developers: "🏗️",
  builders: "🔨",
  pca: "📋",
  "design-practitioners": "📐",
  strata: "🏢",
  "building-manager": "🔑",
  owners: "🏠",
  government: "⚖️",
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
            onClick={() => navigate("/action-manager")}
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
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => navigate("/action-manager")}
              style={{
                padding: "11px 28px", borderRadius: 6, fontSize: 14, fontWeight: 600,
                background: "linear-gradient(135deg, #7A6342, #A68A64)", color: "#fff",
                border: "none", cursor: "pointer", letterSpacing: "0.03em"
              }}
            >
              Open Action Manager
            </button>
            <button
              style={{
                padding: "11px 28px", borderRadius: 6, fontSize: 14, fontWeight: 600,
                background: "transparent", color: "#A68A64",
                border: "1px solid #A68A64", cursor: "pointer", letterSpacing: "0.03em"
              }}
            >
              Learn More
            </button>
          </div>
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
              <div className="role-card-icon">
                <span style={{ fontSize: 26 }}>{ROLE_ICONS[role.key] || "📁"}</span>
              </div>
              <div style={{ fontWeight: 600, fontSize: 14, color: "#1a1a2e", textAlign: "center" }}>{role.label}</div>
              <div style={{ fontSize: 12, color: "#9ca3af" }}>Access Portal →</div>
            </div>
          ))}
        </div>

        {/* Features strip */}
        <div style={{
          marginTop: 56,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 20
        }}>
          {[
            { icon: "🔍", title: "Inspection Tracking", desc: "Track all inspections across INTEL, OC, and DBP categories with full history." },
            { icon: "📄", title: "Report Management", desc: "Upload iAuditor, PDF or Word reports and automatically extract defect data." },
            { icon: "📊", title: "Overview Timeline", desc: "6-month Gantt timeline view with filters for all active projects." },
            { icon: "🔔", title: "Defect Workflow", desc: "Manage defect lifecycle from identification through rectification to closure." },
          ].map(f => (
            <div key={f.title} style={{
              background: "#fff", borderRadius: 10, padding: "20px 18px",
              border: "1px solid #e5e7eb", display: "flex", flexDirection: "column", gap: 8
            }}>
              <div style={{ fontSize: 28 }}>{f.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a2e" }}>{f.title}</div>
              <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.5 }}>{f.desc}</div>
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
