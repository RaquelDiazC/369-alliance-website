/**
 * 369 Alliance System – Role Portal
 * Design: Authoritative Dark Navy with Bronze Accents
 * Stakeholder-specific portal views
 */
import { useParams, useLocation } from "wouter";
import { ROLES } from "@/lib/data";

export default function RolePortal() {
  const params = useParams<{ role: string }>();
  const [, navigate] = useLocation();
  const role = ROLES.find(r => r.key === params.role);

  if (!role) {
    return (
      <div style={{ minHeight:"100vh", background:"#f5f4f1", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:48, marginBottom:16 }}>🔍</div>
          <div style={{ fontWeight:700, fontSize:20, color:"#1a1a2e", marginBottom:8 }}>Portal Not Found</div>
          <button onClick={() => navigate("/")} style={{ background:"linear-gradient(135deg,#7A6342,#A68A64)", color:"#fff", border:"none", borderRadius:5, padding:"9px 24px", fontSize:13, fontWeight:600, cursor:"pointer" }}>
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  const portalContent: Record<string, { desc: string; features: string[] }> = {
    developers: {
      desc: "Access your project defect register, respond to BWRO items, track rectification progress, and communicate with the inspection team.",
      features: ["View defect register for your projects", "Submit developer comments and status updates", "Track BWRO deadlines and rectification progress", "Upload supporting documentation", "View inspection reports and orders"]
    },
    builders: {
      desc: "Monitor active construction sites, review inspection findings, and manage rectification works across all your projects.",
      features: ["View active inspection sites", "Review defect findings and orders", "Submit rectification evidence", "Track compliance deadlines", "Communicate with certifiers and inspectors"]
    },
    pca: {
      desc: "Private Certifiers can access project compliance data, review inspection outcomes, and coordinate with the inspection team.",
      features: ["Access compliance documentation", "Review inspection outcomes", "Coordinate rectification timelines", "Submit certification records", "Track project completion status"]
    },
    "design-practitioners": {
      desc: "Design Practitioners can review design-related defects, submit design resolutions, and track approval status.",
      features: ["Review design defect items", "Submit design resolution documentation", "Track design approval status", "Communicate with inspection team", "Access DBP register entries"]
    },
    strata: {
      desc: "Strata Managers can view building compliance status, track rectification works, and access relevant inspection reports.",
      features: ["View building compliance status", "Track rectification progress", "Access inspection reports", "Receive deadline notifications", "Communicate with building manager"]
    },
    "building-manager": {
      desc: "Building Managers can oversee all compliance activities, coordinate with stakeholders, and manage building maintenance records.",
      features: ["Oversee compliance activities", "Coordinate with all stakeholders", "Manage maintenance records", "Track open defect items", "Access full inspection history"]
    },
    owners: {
      desc: "Owners can view the compliance status of their property, track rectification works, and access relevant reports.",
      features: ["View property compliance status", "Track rectification progress", "Access relevant inspection reports", "Submit concerns or complaints", "View building history"]
    },
    government: {
      desc: "Government officers can access comprehensive data across all projects, generate reports, and monitor compliance outcomes.",
      features: ["Access all project data", "Generate compliance reports", "Monitor BWRO and SWO status", "View regional analytics", "Export data for reporting"]
    }
  };

  const content = portalContent[role.key] || { desc: "Portal access for this role.", features: [] };

  return (
    <div style={{ minHeight:"100vh", background:"#f5f4f1", display:"flex", flexDirection:"column" }}>
      {/* Header */}
      <header style={{ background:"#1a1a2e", color:"#fff", height:56, display:"flex", alignItems:"center", padding:"0 20px", gap:16, flexShrink:0 }}>
        <button onClick={() => navigate("/")} style={{ background:"none", border:"none", color:"#A68A64", fontSize:13, cursor:"pointer" }}>← Back to Home</button>
        <div style={{ width:1, height:24, background:"#3a3a5e" }} />
        <span style={{ fontSize:20, marginRight:4 }}>{role.icon}</span>
        <span style={{ fontWeight:700, fontSize:16 }}>{role.label} Portal</span>
        <div style={{ flex:1 }} />
        <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)" }}>369 Alliance System</div>
      </header>

      <div style={{ flex:1, padding:"40px 24px", maxWidth:900, margin:"0 auto", width:"100%" }}>
        {/* Hero */}
        <div style={{ background:"linear-gradient(135deg,#1a1a2e,#2a2a4e)", borderRadius:12, padding:"32px 36px", marginBottom:32, color:"#fff" }}>
          <div style={{ fontSize:48, marginBottom:12 }}>{role.icon}</div>
          <h1 style={{ fontWeight:800, fontSize:28, marginBottom:8 }}>{role.label} Portal</h1>
          <p style={{ fontSize:15, color:"rgba(255,255,255,0.75)", lineHeight:1.6, maxWidth:600 }}>{content.desc}</p>
        </div>

        {/* Features */}
        <div style={{ background:"#fff", borderRadius:8, border:"1px solid #e5e7eb", padding:"24px", marginBottom:24, boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
          <h2 style={{ fontWeight:700, fontSize:15, color:"#1a1a2e", marginBottom:16 }}>Available Features</h2>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(260px, 1fr))", gap:12 }}>
            {content.features.map((f, i) => (
              <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"12px 14px", background:"#f9f8f6", borderRadius:6, border:"1px solid #e5e7eb" }}>
                <div style={{ width:20, height:20, background:"linear-gradient(135deg,#7A6342,#A68A64)", borderRadius:"50%", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", marginTop:1 }}>
                  <span style={{ color:"#fff", fontSize:11, fontWeight:700 }}>✓</span>
                </div>
                <span style={{ fontSize:13, color:"#374151", lineHeight:1.4 }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Login prompt */}
        <div style={{ background:"#fff", borderRadius:8, border:"1px solid #e5e7eb", padding:"24px", textAlign:"center", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize:32, marginBottom:12 }}>🔐</div>
          <h3 style={{ fontWeight:700, fontSize:16, color:"#1a1a2e", marginBottom:8 }}>Secure Portal Access</h3>
          <p style={{ fontSize:13, color:"#6b7280", marginBottom:20, maxWidth:400, margin:"0 auto 20px" }}>
            This portal requires authentication. Please log in with your 369 Alliance credentials to access your data.
          </p>
          <div style={{ display:"flex", gap:12, justifyContent:"center" }}>
            <button style={{ background:"linear-gradient(135deg,#7A6342,#A68A64)", color:"#fff", border:"none", borderRadius:5, padding:"10px 28px", fontSize:13, fontWeight:700, cursor:"pointer" }}>
              Log In to Portal
            </button>
            <button onClick={() => navigate("/")} style={{ background:"#f3f4f6", color:"#374151", border:"1px solid #d1d5db", borderRadius:5, padding:"10px 24px", fontSize:13, fontWeight:600, cursor:"pointer" }}>
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
