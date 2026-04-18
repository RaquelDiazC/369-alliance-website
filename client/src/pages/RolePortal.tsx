/**
 * 369 Alliance System – Role Portal
 * Design: Authoritative Dark Navy with Bronze Accents
 * Stakeholder-specific portal views with mock data dashboards
 */
import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { ROLES, getProjects } from "@/lib/data";

// ─── Brand ────────────────────────────────────────────────────────────────────
const navy = "#1a1a2e";
const gold = "#A68A64";
const bg = "#f5f4f1";

// ─── Role config ──────────────────────────────────────────────────────────────
const roleConfig: Record<string, {
  desc: string;
  features: string[];
  accentColor: string;
  gradient: string;
}> = {
  developers: {
    desc: "Access your project defect register, respond to BWRO items, track rectification progress, and communicate with the inspection team.",
    features: ["View defect register for your projects", "Submit developer comments and status updates", "Track BWRO deadlines and rectification progress", "Upload supporting documentation", "View inspection reports and orders"],
    accentColor: "#f59e0b", gradient: "linear-gradient(135deg,#b45309,#f59e0b)",
  },
  builders: {
    desc: "Monitor active construction sites, review inspection findings, and manage rectification works across all your projects.",
    features: ["View active inspection sites", "Review defect findings and orders", "Submit rectification evidence", "Track compliance deadlines", "Communicate with certifiers and inspectors"],
    accentColor: "#ef4444", gradient: "linear-gradient(135deg,#b91c1c,#ef4444)",
  },
  pca: {
    desc: "Private Certifiers can access project compliance data, review inspection outcomes, and coordinate with the inspection team.",
    features: ["Access compliance documentation", "Review inspection outcomes", "Coordinate rectification timelines", "Submit certification records", "Track project completion status"],
    accentColor: "#3b82f6", gradient: "linear-gradient(135deg,#1d4ed8,#3b82f6)",
  },
  "design-practitioners": {
    desc: "Design Practitioners can review design-related defects, submit design resolutions, and track approval status.",
    features: ["Review design defect items", "Submit design resolution documentation", "Track design approval status", "Communicate with inspection team", "Access DBP register entries"],
    accentColor: "#8b5cf6", gradient: "linear-gradient(135deg,#6d28d9,#8b5cf6)",
  },
  strata: {
    desc: "Strata Managers can view building compliance status, track rectification works, and access relevant inspection reports.",
    features: ["View building compliance status", "Track rectification progress", "Access inspection reports", "Receive deadline notifications", "Communicate with building manager"],
    accentColor: "#06b6d4", gradient: "linear-gradient(135deg,#0e7490,#06b6d4)",
  },
  "building-manager": {
    desc: "Building Managers can oversee all compliance activities, coordinate with stakeholders, and manage building maintenance records.",
    features: ["Oversee compliance activities", "Coordinate with all stakeholders", "Manage maintenance records", "Track open defect items", "Access full inspection history"],
    accentColor: "#10b981", gradient: "linear-gradient(135deg,#065f46,#10b981)",
  },
  owners: {
    desc: "Owners can view the compliance status of their property, track rectification works, and access relevant reports.",
    features: ["View property compliance status", "Track rectification progress", "Access relevant inspection reports", "Submit concerns or complaints", "View building history"],
    accentColor: "#ec4899", gradient: "linear-gradient(135deg,#9d174d,#ec4899)",
  },
  government: {
    desc: "Government officers can access comprehensive data across all projects, generate reports, and monitor compliance outcomes.",
    features: ["Access all project data", "Generate compliance reports", "Monitor BWRO and SWO status", "View regional analytics", "Export data for reporting"],
    accentColor: "#64748b", gradient: "linear-gradient(135deg,#334155,#64748b)",
  },
};

// ─── Helper components ────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
      <div style={{ fontSize: 28, fontWeight: 800, color: color || navy, marginBottom: 2, fontFamily: "Montserrat, sans-serif" }}>{value}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function OutcomeBadge({ outcome }: { outcome: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    "WIP": { bg: "#eff6ff", color: "#1d4ed8" },
    "BWRO Draft": { bg: "#fef3c7", color: "#92400e" },
    "BWRO Final": { bg: "#fef3c7", color: "#92400e" },
    "SWO": { bg: "#fef2f2", color: "#dc2626" },
    "Closed": { bg: "#f0fdf4", color: "#16a34a" },
  };
  const s = map[outcome] || { bg: "#f3f4f6", color: "#374151" };
  return <span style={{ ...s, borderRadius: 10, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>{outcome}</span>;
}

function RiskBadge({ risk }: { risk: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    High: { bg: "#fef2f2", color: "#dc2626" },
    Medium: { bg: "#fffbeb", color: "#d97706" },
    Low: { bg: "#f0fdf4", color: "#16a34a" },
  };
  const s = map[risk] || { bg: "#f3f4f6", color: "#374151" };
  return <span style={{ ...s, borderRadius: 10, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>{risk}</span>;
}

// ─── Dashboard content by role ────────────────────────────────────────────────
function PortalDashboard({ roleKey, accentColor, gradient }: { roleKey: string; accentColor: string; gradient: string }) {
  const allProjects = getProjects();

  // Each role sees relevant projects
  const projects = roleKey === "government"
    ? allProjects
    : allProjects.filter((_, i) => i < 4); // show first 4 for others

  const active = projects.filter(p => p.projectOutcome === "WIP").length;
  const bwro = projects.filter(p => p.projectOutcome.includes("BWRO")).length;
  const closed = projects.filter(p => p.projectOutcome === "Closed").length;

  const roleNotices: Record<string, { icon: string; text: string; urgency: "high" | "med" | "low" }[]> = {
    developers: [
      { icon: "⚠️", text: "BWRO response due for 218 Pitt St by 15 Apr 2026", urgency: "high" },
      { icon: "📄", text: "New inspection report available for 123 George St", urgency: "med" },
      { icon: "✅", text: "Rectification evidence received and under review", urgency: "low" },
    ],
    builders: [
      { icon: "🔴", text: "Stop Work Order issued for 88 Walker St — action required", urgency: "high" },
      { icon: "📋", text: "Inspection scheduled for 45 Macquarie St on 2 Apr 2026", urgency: "med" },
      { icon: "📦", text: "3 outstanding defect items require rectification evidence", urgency: "med" },
    ],
    pca: [
      { icon: "📋", text: "2 projects require updated certification records", urgency: "med" },
      { icon: "✅", text: "Compliance documentation accepted for P003", urgency: "low" },
    ],
    "design-practitioners": [
      { icon: "⚠️", text: "Design resolution required for Arc-W1.1 finding at P001", urgency: "high" },
      { icon: "📐", text: "CIRD update requested for 218 Pitt St waterproofing", urgency: "med" },
    ],
    strata: [
      { icon: "📊", text: "Annual compliance report available for download", urgency: "low" },
      { icon: "🔧", text: "Rectification works underway — 8 weeks estimated completion", urgency: "med" },
    ],
    "building-manager": [
      { icon: "📋", text: "3 open action items require stakeholder coordination", urgency: "med" },
      { icon: "📅", text: "Quarterly compliance review due 30 Apr 2026", urgency: "med" },
      { icon: "✅", text: "All maintenance records up to date", urgency: "low" },
    ],
    owners: [
      { icon: "🏠", text: "Your property at 45 Macquarie St — rectification in progress", urgency: "med" },
      { icon: "📄", text: "Latest inspection report now available", urgency: "low" },
    ],
    government: [
      { icon: "📊", text: "Q1 2026 compliance dashboard updated", urgency: "low" },
      { icon: "⚠️", text: "2 projects with overdue BWRO responses require escalation", urgency: "high" },
      { icon: "📈", text: "Regional analytics export ready — 47 projects", urgency: "low" },
    ],
  };

  const notices = roleNotices[roleKey] || [];
  const urgencyStyle = (u: string) => u === "high"
    ? { borderLeft: "3px solid #dc2626", background: "#fef2f2" }
    : u === "med"
      ? { borderLeft: "3px solid #d97706", background: "#fffbeb" }
      : { borderLeft: "3px solid #16a34a", background: "#f0fdf4" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14 }}>
        <StatCard label="Active Projects" value={active} color={accentColor} />
        <StatCard label="BWRO Items" value={bwro} color="#d97706" />
        <StatCard label="Closed" value={closed} color="#16a34a" />
        <StatCard label="Total Projects" value={projects.length} color="#6b7280" />
      </div>

      {/* Notices */}
      {notices.length > 0 && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: navy }}>Notifications</span>
            <span style={{ fontSize: 11, color: "#9ca3af" }}>{notices.length} items</span>
          </div>
          {notices.map((n, i) => (
            <div key={i} style={{ ...urgencyStyle(n.urgency), padding: "12px 18px", marginLeft: 0, display: "flex", alignItems: "flex-start", gap: 10, borderBottom: i < notices.length - 1 ? "1px solid rgba(0,0,0,0.04)" : "none" }}>
              <span style={{ fontSize: 15 }}>{n.icon}</span>
              <span style={{ fontSize: 13, color: "#374151", lineHeight: 1.4 }}>{n.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* Project table */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: navy }}>My Projects</span>
          <span style={{ fontSize: 11, color: "#9ca3af" }}>{projects.length} project{projects.length !== 1 ? "s" : ""}</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9f8f6" }}>
                {["Code", "Address", "Stage", "Risk", "Status"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #e5e7eb" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projects.map((p, i) => (
                <tr key={p.id} style={{ borderBottom: i < projects.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                  <td style={{ padding: "11px 14px", fontSize: 12, fontWeight: 700, color: accentColor }}>{p.projCode}</td>
                  <td style={{ padding: "11px 14px", fontSize: 13, color: "#374151" }}>{p.address}, {p.suburb}</td>
                  <td style={{ padding: "11px 14px", fontSize: 12, color: "#6b7280" }}>{p.stage}</td>
                  <td style={{ padding: "11px 14px" }}><RiskBadge risk={p.riskCategory} /></td>
                  <td style={{ padding: "11px 14px" }}><OutcomeBadge outcome={p.projectOutcome} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Available Features */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: navy, marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.04em" }}>Portal Features</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
          {(roleConfig[roleKey]?.features || []).map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 9, padding: "10px 12px", background: "#f9f8f6", borderRadius: 7, border: "1px solid #e5e7eb" }}>
              <div style={{ width: 18, height: 18, background: gradient, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1 }}>
                <span style={{ color: "#fff", fontSize: 10, fontWeight: 700 }}>✓</span>
              </div>
              <span style={{ fontSize: 12, color: "#374151", lineHeight: 1.4 }}>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Contact card */}
      <div style={{ background: navy, borderRadius: 10, padding: "18px 22px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 3 }}>Need assistance?</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>Contact your 369 Alliance compliance officer.</div>
        </div>
        <a href="mailto:info@369alliance.com.au" style={{ background: `linear-gradient(135deg,#7A6342,#A68A64)`, color: "#fff", borderRadius: 7, padding: "9px 20px", fontSize: 12, fontWeight: 700, textDecoration: "none", letterSpacing: "0.03em" }}>
          Contact Us →
        </a>
      </div>
    </div>
  );
}

// ─── Inline sign-in form ───────────────────────────────────────────────────────
function LoginGate({ roleLabel, onLogin, gradient }: { roleLabel: string; onLogin: () => void; gradient: string }) {
  const [email, setEmail] = useState("demo@369alliance.com");
  const [password, setPassword] = useState("demo");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError("Please enter your email and password."); return; }
    // Dev mode: any credentials work
    onLogin();
  };

  const inputStyle: React.CSSProperties = { width: "100%", border: "1px solid #e5e7eb", borderRadius: 7, padding: "10px 12px", fontSize: 13, color: "#1f2937", outline: "none", boxSizing: "border-box" };

  return (
    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: "32px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", maxWidth: 400, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: gradient, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", fontSize: 22 }}>🔐</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: navy, marginBottom: 4 }}>Sign in to {roleLabel} Portal</div>
        <div style={{ fontSize: 13, color: "#6b7280" }}>Enter your 369 Alliance credentials</div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} placeholder="you@company.com" />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} placeholder="Your password" />
        </div>
        {error && <div style={{ fontSize: 12, color: "#dc2626", background: "#fef2f2", borderRadius: 6, padding: "8px 12px" }}>{error}</div>}
        <button type="submit" style={{ background: gradient, color: "#fff", border: "none", borderRadius: 8, padding: "12px", fontSize: 14, fontWeight: 700, cursor: "pointer", marginTop: 4 }}>
          Sign In →
        </button>
        <div style={{ textAlign: "center", fontSize: 11, color: "#9ca3af" }}>
          Demo mode — any credentials will work
        </div>
      </form>
    </div>
  );
}

// ─── Main export ───────────────────────────────────────────────────────────────
export default function RolePortal() {
  const params = useParams<{ role: string }>();
  const [, navigate] = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const role = ROLES.find(r => r.key === params.role);

  if (!role) {
    return (
      <div style={{ minHeight: "100vh", background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <div style={{ fontWeight: 700, fontSize: 20, color: navy, marginBottom: 8 }}>Portal Not Found</div>
          <button onClick={() => navigate("/")} style={{ background: "linear-gradient(135deg,#7A6342,#A68A64)", color: "#fff", border: "none", borderRadius: 5, padding: "9px 24px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  const cfg = roleConfig[role.key] || { desc: "", features: [], accentColor: gold, gradient: `linear-gradient(135deg,#7A6342,#A68A64)` };

  return (
    <div style={{ minHeight: "100vh", background: bg, display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header style={{ background: navy, color: "#fff", height: 56, display: "flex", alignItems: "center", padding: "0 20px", gap: 16, flexShrink: 0 }}>
        <button onClick={() => navigate("/system")} style={{ background: "none", border: "none", color: gold, fontSize: 13, cursor: "pointer", fontWeight: 600 }}>← Portal Select</button>
        <div style={{ width: 1, height: 24, background: "#3a3a5e" }} />
        <span style={{ fontSize: 20, marginRight: 4 }}>{role.icon}</span>
        <span style={{ fontWeight: 700, fontSize: 15 }}>{role.label} Portal</span>
        {isLoggedIn && (
          <>
            <div style={{ flex: 1 }} />
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: cfg.gradient, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff" }}>
                {role.label.charAt(0)}
              </div>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>demo@369alliance.com</span>
              <button onClick={() => setIsLoggedIn(false)} style={{ background: "none", border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.6)", borderRadius: 4, padding: "3px 10px", fontSize: 11, cursor: "pointer" }}>Sign Out</button>
            </div>
          </>
        )}
      </header>

      {/* Hero band */}
      <div style={{ background: `linear-gradient(135deg,${navy},#22243a)`, padding: "28px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 50, height: 50, borderRadius: 13, background: cfg.gradient, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>{role.icon}</div>
            <div>
              <h1 style={{ fontWeight: 800, fontSize: 22, color: "#fff", margin: 0, fontFamily: "Montserrat, sans-serif" }}>{role.label} Portal</h1>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", margin: "3px 0 0", maxWidth: 520, lineHeight: 1.5 }}>{cfg.desc}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: "32px 24px", maxWidth: 900, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
        {isLoggedIn
          ? <PortalDashboard roleKey={role.key} accentColor={cfg.accentColor} gradient={cfg.gradient} />
          : <LoginGate roleLabel={role.label} onLogin={() => setIsLoggedIn(true)} gradient={cfg.gradient} />
        }
      </div>

      <footer style={{ background: navy, color: "#6b7280", padding: "16px 24px", textAlign: "center", fontSize: 12 }}>
        <span style={{ color: gold, fontWeight: 600 }}>369 Alliance</span> · Construction Management System · © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
