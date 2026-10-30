/** Same-origin gateway to the separately hosted project analysis service. */
import { Router, json, type Request, type Response } from "express";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const router = Router();
router.use(json({ limit: "45mb" }));
const COOKIE = "review369_session";

function settings() {
  const production = process.env.NODE_ENV === "production" || !!process.env.VERCEL;
  const configured = process.env.PROJECT_REVIEW_SERVICE_URL;
  const key = process.env.PROJECT_REVIEW_ACCESS_KEY;
  if (production && (!configured || !key || key.length < 24)) return null;
  let url: URL;
  try { url = new URL(configured || "http://127.0.0.1:8769"); } catch { return null; }
  const loopback = ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname);
  if (url.username || url.password || url.search || url.hash || url.pathname !== "/") return null;
  if (url.protocol !== "https:" && !(url.protocol === "http:" && loopback && !production)) return null;
  return { url, key, production };
}

function signature(value: string, key: string) {
  return createHmac("sha256", key).update(value).digest("hex");
}
function same(a: string, b: string) {
  const left = Buffer.from(a), right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
function authenticated(req: Request, key: string | undefined, production: boolean) {
  if (!production && !key) return ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(req.socket.remoteAddress || "");
  if (!key) return false;
  const token = (req.headers.cookie || "").split(";").map(x => x.trim()).find(x => x.startsWith(COOKIE + "="))?.slice(COOKIE.length + 1);
  if (!token) return false;
  const [expires, nonce, signed] = token.split(".");
  return !!expires && !!nonce && !!signed && Number(expires) > Date.now() && Number(expires) < Date.now() + 9 * 3600000 && same(signed, signature(expires + "." + nonce, key));
}
function validOrigin(req: Request) {
  if (req.headers["sec-fetch-site"] === "cross-site") return false;
  if (!req.headers.origin) return true;
  try { return new URL(req.headers.origin).host === req.headers.host; } catch { return false; }
}

router.get("/connection", (req, res) => {
  try {
    const config = settings();
    res.setHeader("Cache-Control", "no-store");
    res.json({ configured: !!config, authorized: !!config && authenticated(req, config.key, config.production), requires_access: !!config?.key });
  } catch { res.json({ configured: false, authorized: false, requires_access: false }); }
});
router.post("/session", (req, res) => {
  const config = settings();
  if (!config) return res.status(503).json({ error: "O serviço de análise ainda não foi configurado neste ambiente." });
  if (!validOrigin(req)) return res.status(403).json({ error: "Origem não autorizada." });
  if (!config.key) return res.status(authenticated(req, config.key, config.production) ? 200 : 403).json({ authorized: authenticated(req, config.key, config.production) });
  const submitted = typeof req.body?.key === "string" ? req.body.key : "";
  if (!same(submitted, config.key)) return res.status(401).json({ error: "Código de acesso inválido." });
  const value = (Date.now() + 8 * 3600000) + "." + randomBytes(16).toString("hex");
  res.setHeader("Set-Cookie", `${COOKIE}=${value}.${signature(value, config.key)}; Path=/api/project-review; Max-Age=28800; HttpOnly; SameSite=Strict${config.production ? "; Secure" : ""}`);
  return res.json({ authorized: true });
});

const apiPaths = [
  /^\/(?:status|capabilities|sources|rules|demo|review|recheck)$/,
  /^\/library\/(?:status|index|catalogue)$/,
  /^\/site\/(?:search|assess|concept)$/,
  /^\/site\/studies(?:\/[a-f0-9]{16}(?:\/(?:export|options))?)?$/,
  /^\/design-library(?:\/index|\/[a-f0-9]{16}\/preview)?$/,
  /^\/model\/(?:import|federate)$/,
  /^\/drawings\/inspect$/,
  /^\/alliance\/(?:summary|knowledge|visual\/status)$/,
  /^\/projects\/[a-f0-9]{16}(?:\/(?:export|decision)|\/documents\/[a-f0-9]{16}(?:\/page\/[1-9]\d{0,3})?)?$/,
  /^\/projects\/[a-f0-9]{16}\/visual\/(?:intake|extract|pass|clash)$/,
];

router.use(async (req: Request, res: Response) => {
  let config: ReturnType<typeof settings>;
  try { config = settings(); } catch { config = null; }
  if (!config) return res.status(503).json({ error: "Configure PROJECT_REVIEW_SERVICE_URL e PROJECT_REVIEW_ACCESS_KEY no servidor. Nenhum acervo local é publicado automaticamente." });
  if (!authenticated(req, config.key, config.production)) return res.status(401).json({ error: "Acesso ao workspace requer autorização." });
  if (!validOrigin(req)) return res.status(403).json({ error: "Origem não autorizada." });
  if (!["GET", "POST"].includes(req.method)) return res.status(405).json({ error: "Método não permitido." });
  const queryIndex = req.url.indexOf("?");
  const pathname = queryIndex < 0 ? req.url : req.url.slice(0, queryIndex);
  const query = queryIndex < 0 ? "" : req.url.slice(queryIndex);
  const staticPaths: Record<string, string> = { "/workspace": "/", "/app.js": "/app.js", "/styles.css": "/styles.css", "/extensions.js": "/extensions.js", "/geometry-viewer.js": "/geometry-viewer.js", "/feasibility.js": "/feasibility.js", "/concept-design.js": "/concept-design.js" };
  const staticPath = staticPaths[pathname];
  if (!staticPath && !apiPaths.some(pattern => pattern.test(pathname))) return res.status(404).json({ error: "Operação não disponível." });
  if (staticPath && req.method !== "GET") return res.status(405).json({ error: "Método não permitido." });
  if (pathname === "/site/concept" && req.method !== "POST") return res.status(405).json({ error: "Método não permitido." });
  if ((pathname === "/design-library/index" || /^\/site\/studies\/[a-f0-9]{16}\/options$/.test(pathname)) && req.method !== "POST") return res.status(405).json({ error: "Método não permitido." });
  if ((pathname === "/design-library" || /^\/design-library\/[a-f0-9]{16}\/preview$/.test(pathname)) && req.method !== "GET") return res.status(405).json({ error: "Método não permitido." });
  if (pathname === "/library/catalogue" && req.method !== "GET") return res.status(405).json({ error: "Método não permitido." });
  try {
    const target = new URL((staticPath || "/api" + pathname) + query, config.url);
    const headers: Record<string, string> = { Accept: req.headers.accept || "application/json" };
    if (req.method === "POST") headers["Content-Type"] = "application/json";
    if (process.env.PROJECT_REVIEW_SERVICE_TOKEN) headers.Authorization = "Bearer " + process.env.PROJECT_REVIEW_SERVICE_TOKEN;
    const upstream = await fetch(target, { method: req.method, headers, body: req.method === "POST" ? JSON.stringify(req.body || {}) : undefined, signal: AbortSignal.timeout(120000), redirect: "error" });
    res.status(upstream.status);
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Content-Type", upstream.headers.get("content-type") || "application/octet-stream");
    const disposition = upstream.headers.get("content-disposition");
    if (disposition) res.setHeader("Content-Disposition", disposition);
    if (staticPath === "/") {
      const document = (await upstream.text()).replace('href="/styles.css"', 'href="/api/project-review/styles.css"').replace('src="/app.js"', 'src="/api/project-review/app.js"').replace('src="/extensions.js"', 'src="/api/project-review/extensions.js"').replace('src="/geometry-viewer.js"', 'src="/api/project-review/geometry-viewer.js"').replace('src="/feasibility.js"', 'src="/api/project-review/feasibility.js"').replace('src="/concept-design.js"', 'src="/api/project-review/concept-design.js"').replace('class="brand" href="/"', 'class="brand" href="/project-review" target="_top"');
      res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; object-src 'none'; frame-ancestors 'self'");
      return res.send(document);
    }
    return res.send(Buffer.from(await upstream.arrayBuffer()));
  } catch {
    return res.status(502).json({ error: "O serviço de análise não respondeu. Verifique sua execução e a configuração de conexão." });
  }
});

export default router;
