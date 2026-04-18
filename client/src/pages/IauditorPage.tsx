/**
 * 369 Alliance – iAuditor for RAB Act
 * Launcher page that opens SafetyCulture iAuditor
 */
import { useLocation } from "wouter";

export default function IauditorPage() {
  const [, navigate] = useLocation();

  return (
    <div style={{ minHeight: "100vh", background: "#f5f4f1", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header style={{ background: "#1a1a2e", height: 64, display: "flex", alignItems: "center", padding: "0 32px", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 40, height: 40,
            background: "linear-gradient(135deg,#7A6342,#A68A64)",
            borderRadius: 10,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 800, fontSize: 16, color: "#fff",
          }}>369</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#fff", letterSpacing: "0.02em" }}>369 Alliance</div>
            <div style={{ fontSize: 11, color: "#A68A64", letterSpacing: "0.06em", textTransform: "uppercase" }}>iAuditor · RAB Act</div>
          </div>
        </div>
        <button
          onClick={() => navigate("/adm")}
          style={{ background: "transparent", color: "#A68A64", border: "1px solid #A68A64", borderRadius: 6, padding: "7px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
        >
          ← Back
        </button>
      </header>

      {/* Hero band */}
      <div style={{ background: "#1a1a2e", paddingBottom: 48, paddingTop: 40, textAlign: "center" }}>
        {/* SafetyCulture-style icon */}
        <div style={{
          width: 72, height: 72, borderRadius: 18, margin: "0 auto 20px",
          background: "linear-gradient(135deg,#2d7a4f,#3da068)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
            <rect x="6" y="5" width="22" height="26" rx="3" stroke="#fff" strokeWidth="2" fill="none" />
            <rect x="12" y="2" width="10" height="6" rx="3" fill="#fff" fillOpacity="0.9" />
            <polyline points="11,17 14,20 21,13" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="11" y="24" width="12" height="2" rx="1" fill="#fff" fillOpacity="0.6" />
          </svg>
        </div>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: "#fff" }}>
          iAuditor for RAB Act
        </h1>
        <p style={{ margin: "10px auto 0", fontSize: 14, color: "#c5b49a", maxWidth: 480, lineHeight: 1.7 }}>
          Conduct site inspections and compliance audits under the<br />
          <strong style={{ color: "#A68A64" }}>Residential Apartment Buildings Act</strong> using SafetyCulture iAuditor.
        </p>
      </div>

      {/* Main card */}
      <main style={{ flex: 1, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "48px 24px" }}>
        <div style={{ maxWidth: 600, width: "100%" }}>

          {/* Launch card */}
          <div style={{
            background: "#fff",
            borderRadius: 16,
            boxShadow: "0 4px 24px rgba(0,0,0,0.09)",
            overflow: "hidden",
            marginBottom: 24,
          }}>
            <div style={{ background: "linear-gradient(135deg,#2d7a4f,#3da068)", padding: "24px 32px" }}>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>
                SafetyCulture Platform
              </div>
              <div style={{ fontSize: 20, color: "#fff", fontWeight: 700 }}>Open iAuditor</div>
            </div>
            <div style={{ padding: "28px 32px" }}>
              <p style={{ margin: "0 0 20px", fontSize: 14, color: "#4b5563", lineHeight: 1.7 }}>
                iAuditor by SafetyCulture is used by 369 Alliance to capture RAB Act inspection data,
                log non-conformances, assign corrective actions, and generate compliance reports on site.
              </p>
              <ul style={{ margin: "0 0 28px", paddingLeft: 20, fontSize: 13, color: "#6b7280", lineHeight: 2 }}>
                <li>RAB Act site inspection checklists</li>
                <li>Non-conformance logging with photo evidence</li>
                <li>Corrective action assignment and tracking</li>
                <li>Automated PDF compliance reports</li>
                <li>Offline capability for on-site use</li>
              </ul>
              <a
                href="https://safetyculture.com/iauditor"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "linear-gradient(135deg,#2d7a4f,#3da068)",
                  color: "#fff",
                  borderRadius: 8,
                  padding: "12px 28px",
                  fontSize: 14,
                  fontWeight: 700,
                  textDecoration: "none",
                  letterSpacing: "0.02em",
                }}
              >
                Open iAuditor
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M10 3h4v4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
                </svg>
              </a>
              <div style={{ marginTop: 12, fontSize: 12, color: "#9ca3af" }}>
                Opens safetyculture.com/iauditor in a new tab
              </div>
            </div>
          </div>

          {/* Info chips */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {["RAB Act 2020", "NSW Building Commission", "Residential Apartments", "Stage Inspections"].map(tag => (
              <div key={tag} style={{
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 20,
                padding: "6px 14px",
                fontSize: 12,
                color: "#374151",
                fontWeight: 500,
              }}>{tag}</div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ background: "#1a1a2e", color: "#6b7280", padding: "16px 24px", textAlign: "center", fontSize: 12 }}>
        <span style={{ color: "#A68A64", fontWeight: 600 }}>369 Alliance</span> · Construction Management System · © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
