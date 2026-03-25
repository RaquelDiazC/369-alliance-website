/**
 * 369 Alliance System – ADM Landing Page
 * Two main icon cards: Action Management | Dashboard
 * Design: Dark Navy + Bronze Accents (consistent with system theme)
 */
import { useLocation } from "wouter";

export default function AdmLanding() {
  const [, navigate] = useLocation();

  const cards = [
    {
      key: "action",
      icon: (
        <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="56" height="56" rx="14" fill="url(#am-grad)" />
          <rect x="13" y="16" width="30" height="3.5" rx="1.75" fill="#fff" fillOpacity="0.9" />
          <rect x="13" y="24" width="22" height="3.5" rx="1.75" fill="#fff" fillOpacity="0.7" />
          <rect x="13" y="32" width="26" height="3.5" rx="1.75" fill="#fff" fillOpacity="0.7" />
          <rect x="13" y="40" width="18" height="3.5" rx="1.75" fill="#fff" fillOpacity="0.5" />
          <defs>
            <linearGradient id="am-grad" x1="0" y1="0" x2="56" y2="56" gradientUnits="userSpaceOnUse">
              <stop stopColor="#7A6342" />
              <stop offset="1" stopColor="#A68A64" />
            </linearGradient>
          </defs>
        </svg>
      ),
      title: "Action Management",
      desc: "Manage all inspection projects across Proactive Insp, From FORM, and CLIENT tabs. Add, edit, filter, book inspections, and track progress.",
      cta: "Open →",
      path: "/action-manager",
      accent: "linear-gradient(135deg,#7A6342,#A68A64)",
      border: "#A68A64",
    },
    {
      key: "dashboard",
      icon: (
        <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="56" height="56" rx="14" fill="url(#db-grad)" />
          {/* bar chart */}
          <rect x="13" y="32" width="7" height="12" rx="2" fill="#fff" fillOpacity="0.9" />
          <rect x="24" y="24" width="7" height="20" rx="2" fill="#fff" fillOpacity="0.9" />
          <rect x="35" y="16" width="7" height="28" rx="2" fill="#fff" fillOpacity="0.9" />
          {/* baseline */}
          <rect x="11" y="44" width="33" height="2" rx="1" fill="#fff" fillOpacity="0.4" />
          <defs>
            <linearGradient id="db-grad" x1="0" y1="0" x2="56" y2="56" gradientUnits="userSpaceOnUse">
              <stop stopColor="#1e3a5f" />
              <stop offset="1" stopColor="#2d6a8f" />
            </linearGradient>
          </defs>
        </svg>
      ),
      title: "Dashboard",
      desc: "View key metrics, project statistics, inspection timelines, defect summaries, and performance analytics across all active projects.",
      cta: "Open →",
      path: "/dashboard",
      accent: "linear-gradient(135deg,#1e3a5f,#2d6a8f)",
      border: "#2d6a8f",
    },
  ];

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
            fontWeight: 800, fontSize: 16, color: "#fff"
          }}>369</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#fff", letterSpacing: "0.02em" }}>369 Alliance</div>
            <div style={{ fontSize: 11, color: "#A68A64", letterSpacing: "0.06em", textTransform: "uppercase" }}>Administration</div>
          </div>
        </div>
        <button
          onClick={() => navigate("/")}
          style={{ background: "transparent", color: "#A68A64", border: "1px solid #A68A64", borderRadius: 6, padding: "7px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
        >
          ← Home
        </button>
      </header>

      {/* Page title */}
      <div style={{ background: "#1a1a2e", paddingBottom: 40, paddingTop: 36, textAlign: "center" }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: "#fff", letterSpacing: "-0.01em" }}>
          Administration Portal
        </h1>
        <p style={{ margin: "10px auto 0", fontSize: 14, color: "#c5b49a", maxWidth: 480, lineHeight: 1.6 }}>
          Select a module to get started
        </p>
      </div>

      {/* Cards */}
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 24px" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 32,
          maxWidth: 760,
          width: "100%",
        }}>
          {cards.map(card => (
            <button
              key={card.key}
              onClick={() => navigate(card.path)}
              style={{
                background: "#fff",
                border: `2px solid transparent`,
                borderRadius: 16,
                padding: "40px 32px",
                cursor: "pointer",
                textAlign: "left",
                boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
                transition: "transform 0.18s, box-shadow 0.18s, border-color 0.18s",
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-4px)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 12px 40px rgba(0,0,0,0.14)";
                (e.currentTarget as HTMLButtonElement).style.borderColor = card.border;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 24px rgba(0,0,0,0.08)";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "transparent";
              }}
            >
              {card.icon}
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#1a1a2e", marginBottom: 8, fontFamily: "Montserrat, sans-serif" }}>
                  {card.title}
                </div>
                <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.7 }}>
                  {card.desc}
                </div>
              </div>
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: card.accent,
                color: "#fff",
                borderRadius: 6,
                padding: "8px 20px",
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "0.03em",
                alignSelf: "flex-start",
                marginTop: 4,
              }}>
                {card.cta}
              </div>
            </button>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer style={{ background: "#1a1a2e", color: "#6b7280", padding: "16px 24px", textAlign: "center", fontSize: 12 }}>
        <span style={{ color: "#A68A64", fontWeight: 600 }}>369 Alliance</span> · Construction Management System · © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
