import { useEffect, useState } from "react";
import { Link } from "wouter";

/** Embedded workbench, through the server's allowlisted same-origin gateway. */
export default function ProjectReview() {
  const [state, setState] = useState<"loading" | "ready" | "locked" | "unavailable">("loading");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  async function connect() {
    try {
      const response = await fetch("/api/project-review/connection");
      if (!response.ok) throw new Error("Não foi possível verificar a conexão.");
      const data = await response.json();
      setState(!data.configured || (!data.authorized && !data.requires_access) ? "unavailable" : data.authorized ? "ready" : "locked");
    } catch { setState("unavailable"); }
  }
  useEffect(() => { void connect(); }, []);
  async function unlock(event: React.FormEvent) {
    event.preventDefault(); setError("");
    try {
      const response = await fetch("/api/project-review/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: code }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Acesso não autorizado.");
      setCode(""); await connect();
    } catch (err) { setError(err instanceof Error ? err.message : "Falha na conexão."); }
  }
  return <div style={{ minHeight: "100vh", background: "#f5f5f2", color: "#1a1a2e" }}>
    <header style={{ padding: "14px 24px", display: "flex", gap: 24, alignItems: "center", borderBottom: "1px solid #ddd", background: "white" }}>
      <Link href="/home" style={{ fontWeight: 700 }}>369 Alliance</Link>
      <span style={{ fontSize: 13 }}>Terreno · projetos · coordenação · conformidade</span>
      <Link href="/brain" style={{ marginLeft: "auto", fontSize: 12 }}>Expert Brain ↗</Link>
      <Link href="/drawing-analyser" style={{ fontSize: 12 }}>Revisão visual por especialistas ↗</Link>
    </header>
    {state === "ready" ? <iframe title="369 Project Intelligence" src="/api/project-review/workspace" style={{ display: "block", width: "100%", height: "calc(100vh - 51px)", border: 0 }} /> :
      <main style={{ maxWidth: 650, margin: "70px auto", padding: 30 }}>
        <p style={{ color: "#967a55", fontWeight: 700 }}>PROJECT INTELLIGENCE</p>
        <h1 style={{ fontSize: 32, margin: "16px 0" }}>Do terreno à revisão do projeto.</h1>
        {state === "loading" ? <p>Verificando conexão ao serviço de análise…</p> : state === "locked" ?
          <form onSubmit={unlock} style={{ display: "grid", gap: 14 }}><p>Informe o código do workspace autorizado para abrir projetos e fontes.</p><label>Código de acesso<input type="password" value={code} autoComplete="current-password" onChange={event => setCode(event.target.value)} required style={{ display: "block", width: "100%", padding: 12, border: "1px solid #ccc", marginTop: 8 }} /></label><button type="submit" style={{ padding: 12, background: "#1a1a2e", color: "white", border: 0 }}>Abrir workspace</button>{error && <p role="alert">{error}</p>}</form> :
          <><p>O módulo está integrado à plataforma. O serviço de análise precisa estar disponível neste ambiente para receber arquivos e consultar fontes.</p><p style={{ marginTop: 14 }}>Nenhum documento ou acervo do computador é publicado automaticamente. A configuração do serviço é feita no servidor da 369.</p><button onClick={() => void connect()} style={{ marginTop: 20, padding: 12, border: "1px solid #aaa", background: "white" }}>Verificar novamente</button></>}
      </main>}
  </div>;
}
