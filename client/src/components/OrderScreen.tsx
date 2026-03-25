/**
 * 369 Alliance System – Order Screen
 */
import { useState } from "react";
import { type Project, addOrder } from "@/lib/data";
import { toast } from "sonner";

interface Props {
  onBack: () => void;
  projects: Project[];
  onRefresh: () => void;
}

export default function OrderScreen({ onBack, projects, onRefresh }: Props) {
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const handleFileUpload = (file: File) => {
    setFileName(file.name);
    toast.success(`Order document "${file.name}" ready to upload.`);
  };

  const handleProceed = () => {
    if (!selectedProjectId) { toast.error("Please select a building address."); return; }
    if (!fileName) { toast.error("Please upload an order document first."); return; }
    addOrder(selectedProjectId, { date: new Date().toLocaleDateString("en-AU"), fileName, type: "PDF" });
    onRefresh();
    toast.success("Order saved successfully.");
    onBack();
  };

  return (
    <div style={{ minHeight:"100vh", background:"#f5f4f1", display:"flex", flexDirection:"column" }}>
      <header style={{ background:"#1a1a2e", color:"#fff", height:56, display:"flex", alignItems:"center", padding:"0 20px", gap:16, flexShrink:0 }}>
        <button onClick={onBack} style={{ background:"none", border:"none", color:"#A68A64", fontSize:13, cursor:"pointer" }}>← Back to Dashboard</button>
        <div style={{ width:1, height:24, background:"#3a3a5e" }} />
        <span style={{ fontWeight:700, fontSize:16 }}>Order Management</span>
      </header>

      <div style={{ flex:1, padding:"24px", maxWidth:800, margin:"0 auto", width:"100%" }}>
        <div style={{ background:"#fff", borderRadius:8, border:"1px solid #e5e7eb", padding:"24px", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
          <h2 style={{ fontWeight:700, fontSize:16, color:"#1a1a2e", marginBottom:20 }}>Upload Order</h2>

          <div style={{ marginBottom:20 }}>
            <label style={{ fontSize:11, fontWeight:600, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.05em", display:"block", marginBottom:6 }}>Building Address</label>
            <select
              value={selectedProjectId}
              onChange={e => setSelectedProjectId(e.target.value)}
              style={{ width:"100%", border:"1px solid #d1d5db", borderRadius:6, padding:"9px 12px", fontSize:13, background:"#fff", color:"#1a1a2e", outline:"none" }}
            >
              <option value="">— Select building address —</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.address}, {p.suburb} {p.postcode} (#{p.projCode})</option>
              ))}
            </select>
          </div>

          <div
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={e => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFileUpload(f); }}
            style={{ border:`2px dashed ${isDragging ? "#A68A64" : "#d1d5db"}`, borderRadius:8, padding:"48px 20px", textAlign:"center", background: isDragging ? "#fef8f0" : "#fafaf9", cursor:"pointer" }}
            onClick={() => document.getElementById("order-file-input")?.click()}
          >
            <div style={{ fontSize:40, marginBottom:10 }}>📋</div>
            <div style={{ fontWeight:600, fontSize:14, color:"#374151", marginBottom:4 }}>Drop your Order document here</div>
            <div style={{ fontSize:12, color:"#9ca3af", marginBottom:14 }}>PDF or Word format accepted</div>
            <button style={{ background:"linear-gradient(135deg,#7A6342,#A68A64)", color:"#fff", border:"none", borderRadius:5, padding:"8px 20px", fontSize:13, fontWeight:600, cursor:"pointer" }}>
              📄 Upload PDF or Word Order
            </button>
            <input id="order-file-input" type="file" accept=".pdf,.doc,.docx" style={{ display:"none" }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }} />
          </div>
          {fileName && <div style={{ marginTop:8, fontSize:12, color:"#2d6a4f", fontWeight:600 }}>✓ Loaded: {fileName}</div>}

          <div style={{ display:"flex", justifyContent:"flex-end", gap:12, marginTop:24 }}>
            <button onClick={onBack} style={{ background:"#f3f4f6", color:"#374151", border:"1px solid #d1d5db", borderRadius:5, padding:"9px 24px", fontSize:13, fontWeight:600, cursor:"pointer" }}>Cancel</button>
            <button onClick={handleProceed} style={{ background:"linear-gradient(135deg,#7A6342,#A68A64)", color:"#fff", border:"none", borderRadius:5, padding:"9px 28px", fontSize:13, fontWeight:700, cursor:"pointer" }}>Proceed</button>
          </div>
        </div>
      </div>
    </div>
  );
}
