import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div style={{ minHeight: "100vh", background: "#f5f4f1", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header style={{ background: "#1a1a2e", height: 64, display: "flex", alignItems: "center", padding: "0 32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, background: "linear-gradient(135deg,#7A6342,#A68A64)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16, color: "#fff" }}>369</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#fff" }}>369 Alliance</div>
            <div style={{ fontSize: 11, color: "#A68A64", letterSpacing: "0.06em", textTransform: "uppercase" }}>Construction Management System</div>
          </div>
        </div>
      </header>

      {/* 404 content */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ textAlign: "center", maxWidth: 480 }}>
          {/* 404 number */}
          <div style={{ fontSize: 96, fontWeight: 900, color: "#1a1a2e", lineHeight: 1, fontFamily: "Montserrat, sans-serif", letterSpacing: "-0.04em", marginBottom: 8, opacity: 0.12 }}>404</div>
          <div style={{ marginTop: -60, marginBottom: 24 }}>
            <div style={{ width: 64, height: 64, background: "linear-gradient(135deg,#7A6342,#A68A64)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="#fff" strokeWidth="2" />
                <line x1="12" y1="8" x2="12" y2="13" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="12" cy="16.5" r="1.25" fill="#fff" />
              </svg>
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: "#1a1a2e", margin: "0 0 10px", fontFamily: "Montserrat, sans-serif" }}>Page Not Found</h1>
            <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.7, margin: "0 0 32px" }}>
              The page you're looking for doesn't exist or has been moved.<br />
              Use the links below to get back on track.
            </p>
          </div>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => setLocation("/")}
              style={{ background: "linear-gradient(135deg,#7A6342,#A68A64)", color: "#fff", border: "none", borderRadius: 8, padding: "11px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer", letterSpacing: "0.02em" }}
            >
              ← Home
            </button>
            <button
              onClick={() => setLocation("/system")}
              style={{ background: "#fff", color: "#1a1a2e", border: "1px solid #e5e7eb", borderRadius: 8, padding: "11px 28px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
            >
              Client System
            </button>
            <button
              onClick={() => setLocation("/adm")}
              style={{ background: "#fff", color: "#1a1a2e", border: "1px solid #e5e7eb", borderRadius: 8, padding: "11px 28px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
            >
              ADM Portal
            </button>
          </div>
        </div>
      </div>

      <footer style={{ background: "#1a1a2e", color: "#6b7280", padding: "16px 24px", textAlign: "center", fontSize: 12 }}>
        <span style={{ color: "#A68A64", fontWeight: 600 }}>369 Alliance</span> · Construction Management System · © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
