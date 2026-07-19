/**
 * AUS Legislation Brain API — state-aware Australian building legislation Q&A.
 *
 *   GET  /api/brain/status → { ai, counts, states[] }
 *   POST /api/brain/ask    → { state, question, history? } → grounded answer + enriched citations
 *   POST /api/brain/photo  → { state, image, question? }  → photo → legislation findings
 *
 * Grounding: NCC 2022 knowledge packs built from the 369 Alliance MASTER
 * NCC+AS Legislation Reference Excel (server/brain/*.json) + curated state
 * profiles (server/brain/states.ts) + the BCNSW Master Defect Library.
 */
import { Router, Request, Response } from "express";
import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";
import nccPack from "../brain/ncc2022.json";
import referencePack from "../brain/reference.json";
import topicsPack from "../brain/topics.json";
import boardsPack from "../brain/boards.json";
import defectLibraryJson from "../defect-library.json";
import { NATIONAL, STATES, STATE_BY_CODE, stateProfileText } from "../brain/states.js";
import { PERSONAS, PERSONA_BY_KEY, PERSONA_SECTIONS, TEMPLATES, personaText, Persona } from "../brain/personas.js";
import type { StateProfile } from "../brain/states.js";

const router = Router();
const MODEL = "claude-sonnet-5";

// Clause "evidence board" PNGs live outside the repo (OneDrive). boards.json is
// the committed index; images are served from disk when the folder is present.
const BOARDS_DIR =
  process.env.BRAIN_BOARDS_DIR ||
  "C:/Users/raque/OneDrive/3. Working/0. For review/2. Legislation";
const BOARDS_MAIN = (boardsPack as any).main as Record<string, string>;
const BOARDS_STATE = (boardsPack as any).state as Record<string, Record<string, string>>;
const BOARDS_PLAIN = ((boardsPack as any).plain || {}) as Record<string, string>;
const BOARDS_AVAILABLE = fs.existsSync(BOARDS_DIR);

function boardFile(rel: string | undefined): string | null {
  if (!rel || !BOARDS_AVAILABLE) return null;
  const abs = path.join(BOARDS_DIR, rel.replace(/\\/g, path.sep));
  return fs.existsSync(abs) ? abs : null;
}

// ---------------------------------------------------------------- knowledge
interface Vol1Clause {
  t: string; s: string; p: string; pt: string; k: string; x: string;
  pg: number | null; l19: string; as: string; asc: string; d: string;
}
interface HpClause {
  t: string; sec: string; st: string; p: string; pt: string; as: string; asc: string; d: string;
}

const VOL1 = (nccPack as any).vol1 as Record<string, Vol1Clause>;
const HP = (nccPack as any).hp as Record<string, HpClause>;
const SECTIONS = (nccPack as any).sections as Record<string, string>;
const TOPICS = (topicsPack as any).topics as string[][]; // [topic, subIssue, v1, v2, as, tolerances]
const STANDARDS = (referencePack as any).standards as string[][]; // [code, title, versions, years]
const EDITIONS = (referencePack as any).editions as string[][]; // [c22, t22, sec, l19, t19, t16, t15]

const DEFECTS = defectLibraryJson as unknown as Record<
  string,
  { id: string; regime: string; subcategory: string | null; description: string | null; ncc2019: string | null; ncc2022: string | null; section_choice: string | null; status: string }
>;

// legacy NCC 2019 ref → 2022 code
const LEGACY_TO_2022: Record<string, string> = {};
for (const [code, c] of Object.entries(VOL1)) {
  if (c.l19) LEGACY_TO_2022[c.l19.toUpperCase()] = code;
}

// Compact clause index for the cached system prompt (code|title per line).
const VOL1_INDEX = Object.entries(VOL1)
  .map(([code, c]) => `${code}|${c.t}`)
  .join("\n");
const HP_INDEX = Object.entries(HP)
  .map(([code, c]) => `${code}|${c.t}`)
  .join("\n");
const DEFECT_INDEX = Object.values(DEFECTS)
  .filter(e => e.status === "active")
  .map(e => `${e.id}|${e.regime}|${e.subcategory || "-"}|${(e.description || "").replace(/\s+/g, " ").slice(0, 100)}`)
  .join("\n");

// ---------------------------------------------------------------- retrieval
const STOP = new Set("the a an and or of to in for is are be with on at by from as it this that what which how does do can must should under about".split(" "));
const SYNONYMS: Record<string, string[]> = {
  waterproofing: ["damp", "weatherproofing", "wet", "membrane"],
  waterproof: ["damp", "weatherproofing", "wet", "membrane"],
  balcony: ["roof", "membrane", "drainage", "barrier"],
  balustrade: ["barrier", "fall"],
  handrail: ["stairway", "ramp", "barrier"],
  stair: ["stairway", "going", "riser"],
  stairs: ["stairway", "going", "riser"],
  sprinkler: ["fire", "suppression", "automatic"],
  cladding: ["external", "wall", "attachment", "combustible"],
  window: ["glazing", "glass", "opening"],
  disabled: ["accessible", "access"],
  disability: ["accessible", "access"],
  wheelchair: ["accessible", "access", "ramp"],
  insulation: ["thermal", "energy"],
  mould: ["condensation", "ventilation", "damp"],
  mold: ["condensation", "ventilation", "damp"],
  leak: ["waterproofing", "damp", "drainage"],
  smoke: ["fire", "alarm", "detection"],
  garage: ["carpark", "vehicle"],
  lift: ["passenger", "accessible"],
  ceiling: ["height", "room"],
  bushfire: ["bushfire-prone", "3959"],
  pool: ["swimming", "barrier"],
  waste: ["sanitary", "drainage"],
  bathroom: ["sanitary", "wet", "shower"],
  kitchen: ["sanitary", "facilities"],
  soundproof: ["sound", "insulation", "transmission"],
  acoustic: ["sound", "insulation", "transmission"],
};

function tokens(q: string): string[] {
  const base = (q.toLowerCase().match(/[a-z0-9.]{3,}/g) || []).filter(w => !STOP.has(w));
  const out = new Set(base);
  for (const w of base) for (const s of SYNONYMS[w] || []) out.add(s);
  return Array.from(out);
}

function countHits(hay: string, needle: string): number {
  let n = 0, i = 0;
  while ((i = hay.indexOf(needle, i)) !== -1 && n < 5) { n++; i += needle.length; }
  return n;
}

interface Retrieved { code: string; score: number }

function retrieveClauses(question: string, limit = 8): Retrieved[] {
  const toks = tokens(question);
  const explicit = new Set<string>();
  for (const m of question.toUpperCase().match(/\b[A-J]\d{1,2}[OFPDV]\d{1,2}\b/g) || []) {
    if (VOL1[m]) explicit.add(m);
  }
  for (const m of question.toUpperCase().match(/\b[A-J]{1,2}[OFPV]?\d{1,2}\.\d{1,2}(\.\d{1,2})?\b/g) || []) {
    const mapped = LEGACY_TO_2022[m];
    if (mapped) explicit.add(mapped);
  }
  const scored: Retrieved[] = [];
  for (const [code, c] of Object.entries(VOL1)) {
    let score = explicit.has(code) ? 100 : 0;
    const title = c.t.toLowerCase();
    const part = c.pt.toLowerCase();
    const text = c.x.toLowerCase();
    for (const tk of toks) {
      score += countHits(title, tk) * 6 + countHits(part, tk) * 2 + countHits(text, tk);
    }
    // Prefer clauses with substance (real text) when scores tie.
    if (score > 0) scored.push({ code, score: score + Math.min(1, c.x.length / 4000) });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).filter(r => r.score >= 3 || explicit.has(r.code));
}

function retrieveTopics(question: string, limit = 4): string[][] {
  const toks = tokens(question);
  const scored: { row: string[]; score: number }[] = [];
  for (const row of TOPICS) {
    const hay = (row[0] + " " + row[1]).toLowerCase();
    let score = 0;
    for (const tk of toks) score += countHits(hay, tk) * 2;
    if (score > 0) scored.push({ row, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(s => s.row);
}

function contextBlock(question: string): string {
  const clauses = retrieveClauses(question);
  const topics = retrieveTopics(question);
  const parts: string[] = [];
  if (clauses.length) {
    parts.push("RETRIEVED NCC 2022 VOLUME ONE CLAUSES (authoritative extracts from the 369 Alliance master register):");
    for (const { code } of clauses) {
      const c = VOL1[code];
      const head = `### ${code} — ${c.t} [Section ${c.s} ${SECTIONS[c.s] || ""} · ${c.pt || c.p} · ${c.k}${c.l19 ? ` · NCC 2019: ${c.l19}` : ""}]`;
      const asLine = c.as ? `Referenced AS: ${c.as}${c.asc ? ` (${c.asc.slice(0, 300)})` : ""}` : "";
      const defLine = c.d ? `Linked NSW defect ids: ${c.d}` : "";
      parts.push([head, c.x.slice(0, 2200), asLine, defLine].filter(Boolean).join("\n"));
    }
  }
  if (topics.length) {
    parts.push("TOPIC CROSSWALK (complaint topic → code refs → AS → Guide to Standards & Tolerances):");
    for (const [topic, sub, v1, v2, as, tol] of topics) {
      parts.push(`- ${topic} / ${sub}\n  Vol1: ${v1.slice(0, 350)}\n  Vol2: ${v2.slice(0, 250)}\n  AS: ${as.slice(0, 250)}${tol ? `\n  Tolerances: ${tol.slice(0, 200)}` : ""}`);
    }
  }
  return parts.join("\n\n");
}

// ---------------------------------------------------------------- prompts
const OUTPUT_SPEC = `OUTPUT FORMAT — reply with exactly these tags, nothing outside them:
<answer>
The full answer in Markdown (## headings, bullet lists, **bold** codes).
</answer>
<citations>
one per line as ref|kind|note — e.g.
F1D7|ncc|DtS clause requiring the membrane to AS 4654.1/.2
Home Building Act 1989 (NSW) s18B|state|statutory warranties for residential work
kinds: ncc (Vol 1 2022 code) | hp (Housing Provisions clause) | as (Australian Standard) | state (state act/regulation) | other. 3-8 lines, most load-bearing first (omit lines you cannot fill honestly).
</citations>
<followups>
up to 3 short suggested follow-up questions, one per line
</followups>`;

const BUSINESS_RULES = `You are one of the 369 Alliance Expert Brains — a panel of specialist advisers for Australian construction and design businesses. Answer strictly in the ACTIVE PERSONA's voice, priorities and communication style given below.

RULES
1. Be practical and construction-industry fluent; give concrete, actionable advice, not generic business platitudes.
2. Use the selected jurisdiction for regulatory colour (licensing, contracts, insurance, market), but defer deep legislation analysis to the legislation brains — say so when a question needs one.
3. Dollar figures and thresholds: flag "verify current" when threshold-sensitive.
4. If the question is outside the persona's lane, answer briefly and name the better-suited brain.

${OUTPUT_SPEC}`;

const PANEL_RULES = `MULTI-PERSONA CONSULTATION MODE
The user has convened a panel of the personas listed below. In <answer>:
- Each persona speaks under a "## <Persona Name>" heading — concise (2-3 short paragraphs or bullets), unmistakably in its own voice and priorities. Personas may disagree.
- Close with "## Panel Synthesis" — the combined recommendation, trade-offs and next actions.`;

const PERSONA = `You are the 369 Alliance AUS Construction Expert Brain — a senior Australian building-legislation adviser (NCC, Australian Standards, and every state/territory building act). You answer questions from builders, certifiers, designers, inspectors and owners.

RULES
1. Answer for the SELECTED JURISDICTION given below. The NCC is national; apply that state's adopting act, licensing, warranty/insurance, contract and dispute regimes, and its NCC variations. If the question concerns a different state, say so and answer for the state asked.
2. Cite precisely: NCC 2022 clause codes (e.g. F1D5, B1P1, D2D14), ABCB Housing Provisions clauses (e.g. 10.2.3) for Class 1/10, Australian Standards with clause numbers (e.g. AS 3740 §3.2), and state acts with section numbers where you are confident (e.g. Home Building Act 1989 (NSW) s18B).
3. Use RETRIEVED clause extracts as the authoritative NCC text. You may also cite any clause from the CLAUSE INDEX; never invent codes that are in neither.
4. NCC 2022 is the baseline. If an older edition (2019/2016/2015) or NCC 2025 matters, note the difference and the legacy code (e.g. F1D5 was FP1.4/F1.9 territory in 2019).
5. Dollar thresholds, insurance caps and adoption dates change: state the figure with "verify current" when it is threshold-sensitive.
6. Be practical: classification first (building class, jurisdiction, work type), then requirement, then compliance pathway (DtS / Performance Solution), then who is responsible.
7. If the question is outside building legislation (e.g. tax, migration), say so briefly.

${OUTPUT_SPEC}`;

const CLAUSE_INDEX_BLOCK = `NCC 2022 VOLUME ONE CLAUSE INDEX (code|title):
${VOL1_INDEX}

ABCB HOUSING PROVISIONS (Class 1/10) CLAUSE INDEX (code|title):
${HP_INDEX}

NATIONAL FRAME
${NATIONAL.summary}
Key national instruments:
${NATIONAL.instruments.map(i => `- ${i}`).join("\n")}`;

const PHOTO_PERSONA = `You are the 369 Alliance AUS Construction Expert Brain inspecting a PHOTO from a building site or existing building. Identify what is shown, whether it complies, and exactly which legislation applies in the SELECTED JURISDICTION.

METHOD
1. Observe: element, material, location, what is visibly wrong (or compliant).
2. Match against the NSW MASTER DEFECT INDEX below when a defect fits (ids like W1.3, F2.1). The index is NSW-authored but its NCC/AS logic applies nationally — translate the consequence into the selected state's enforcement regime.
3. Cite NCC 2022 clause codes, Australian Standards and the state's acts exactly as a written finding would.
4. PRECISION OVER RECALL: only flag what is genuinely visible. If the photo shows no defect, say so and describe what a compliant installation requires.
5. Dollar thresholds and adoption dates: flag "verify current" where sensitive.

OUTPUT FORMAT — reply with exactly these tags, nothing outside them:
<observation>
1-2 sentences on what the photo shows.
</observation>
<answer>
Full assessment in Markdown: what it is, compliance status, applicable legislation for the selected state, recommended action.
</answer>
<defects>
matching MASTER DEFECT INDEX ids, comma-separated, best first, max 3 (empty if none) — e.g. W1.3, W1.5
</defects>
<citations>
one per line as ref|kind|note — kinds: ncc | hp | as | state | other
</citations>
<followups>
up to 3 short suggested follow-up questions, one per line
</followups>

MASTER DEFECT INDEX (id|regime|subcategory|defect):
${DEFECT_INDEX}`;

// ---------------------------------------------------------------- helpers
function anthropicOrNull(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  return apiKey ? new Anthropic({ apiKey }) : null;
}

function extractTag(text: string, tag: string): string | null {
  const m = text.match(new RegExp(`<${tag}>([\\s\\S]*?)(?:</${tag}>|$)`));
  return m ? m[1].trim() : null;
}

const CITE_KINDS = new Set(["ncc", "hp", "as", "state", "other"]);

function parseCitationLines(block: string | null): { ref: string; kind: string; note: string }[] {
  if (!block) return [];
  return block
    .split("\n")
    .map(l => l.trim())
    .filter(l => l && l.includes("|") && !l.toLowerCase().startsWith("kinds:") && !l.toLowerCase().startsWith("one per line"))
    .map(l => {
      let [ref, kind, ...note] = l.split("|");
      ref = (ref || "").trim();
      kind = (kind || "other").trim().toLowerCase();
      // Tolerate swapped order (model wrote kind|ref|note).
      if (CITE_KINDS.has(ref.toLowerCase()) && !CITE_KINDS.has(kind)) {
        const k = ref.toLowerCase();
        ref = (l.split("|")[1] || "").trim();
        kind = k;
      }
      if (!CITE_KINDS.has(kind)) {
        kind = /^[A-J]\d{1,2}[OFPDV]\d{1,2}$/i.test(ref) ? "ncc" : /^AS[\s/]/i.test(ref) ? "as" : "other";
      }
      return { ref, kind, note: note.join("|").trim() };
    })
    .filter(c => c.ref);
}

function parseLines(block: string | null, max: number): string[] {
  if (!block) return [];
  return block
    .split("\n")
    .map(l => l.replace(/^[-*\d.\s]+/, "").trim())
    .filter(l => l.length > 3 && !l.toLowerCase().startsWith("up to"))
    .slice(0, max);
}

/** Strip any stray protocol tags if the model forgot the format. */
function fallbackAnswer(text: string): string {
  return text.replace(/<\/?(?:answer|citations|followups|observation|defects)>/g, "").trim();
}

/** Human-readable message from an Anthropic SDK error. */
function apiErrorMessage(err: any): string {
  const inner = err?.error?.error?.message || err?.error?.message;
  const msg = inner || err?.message || String(err);
  if (/credit balance/i.test(msg)) return "Anthropic API credit balance is exhausted — top up at console.anthropic.com (Plans & Billing).";
  if (/api.?key/i.test(msg) && /invalid|unauthor/i.test(msg)) return "ANTHROPIC_API_KEY is invalid — check .env.";
  return msg.slice(0, 300);
}

interface Citation {
  ref: string;
  kind: string;
  note: string;
  title?: string;
  section?: string;
  part?: string;
  clauseType?: string;
  text?: string;
  as?: string;
  asClauses?: string;
  page?: number | null;
  legacy2019?: string;
  volume?: string;
  standardTitle?: string;
  board?: boolean; // evidence-board PNG available for this clause
  stateBoard?: boolean; // selected state has a variation board for this clause
  variations?: string[]; // all states with a variation board for this clause
}

function boardFlags(ref: string, stateCode: string) {
  const variations = Object.keys(BOARDS_STATE).filter(st => BOARDS_STATE[st][ref]);
  return {
    board: BOARDS_AVAILABLE && !!BOARDS_MAIN[ref],
    stateBoard: BOARDS_AVAILABLE && !!BOARDS_STATE[stateCode]?.[ref],
    variations: variations.length ? variations : undefined,
  };
}

function enrichCitations(raw: any[], answerMd: string, stateCode: string): Citation[] {
  const seen = new Set<string>();
  const out: Citation[] = [];
  const push = (c: Citation) => {
    const key = c.kind + ":" + c.ref.toUpperCase();
    if (seen.has(key) || out.length >= 10) return;
    seen.add(key);
    out.push(c);
  };

  const enrichNcc = (refRaw: string, note: string): Citation | null => {
    let ref = refRaw.toUpperCase().replace(/\s+/g, "");
    if (!VOL1[ref] && LEGACY_TO_2022[ref]) ref = LEGACY_TO_2022[ref];
    const c = VOL1[ref];
    if (!c) return null;
    return {
      ref, kind: "ncc", note, title: c.t, section: `${c.s} — ${SECTIONS[c.s] || ""}`,
      part: c.pt || c.p, clauseType: c.k, text: c.x.slice(0, 1500), as: c.as,
      asClauses: c.asc.slice(0, 400), page: c.pg, legacy2019: c.l19, volume: "Volume One",
      ...boardFlags(ref, stateCode),
    };
  };

  for (const r of Array.isArray(raw) ? raw : []) {
    if (!r || typeof r.ref !== "string") continue;
    const ref = r.ref.trim();
    const note = String(r.note || "").slice(0, 200);
    const kind = String(r.kind || "other");
    if (kind === "ncc") {
      const c = enrichNcc(ref, note);
      if (c) { push(c); continue; }
    }
    if (kind === "hp" && HP[ref]) {
      const h = HP[ref];
      push({ ref, kind: "hp", note, title: h.t, section: `${h.sec} — ${h.st}`, part: h.pt || h.p, as: h.as, asClauses: h.asc.slice(0, 400), volume: "Housing Provisions" });
      continue;
    }
    if (kind === "as") {
      const num = (ref.match(/\d{4}(\.\d+)?/) || [])[0];
      const std = num ? STANDARDS.find(s => s[0].startsWith(num)) : undefined;
      push({ ref, kind: "as", note, standardTitle: std?.[1] });
      continue;
    }
    push({ ref: ref.slice(0, 120), kind: ["state", "other"].includes(kind) ? kind : "other", note });
  }

  // Guarantee cards for NCC codes mentioned in the answer body.
  for (const m of Array.from(new Set(answerMd.toUpperCase().match(/\b[A-J]\d{1,2}[OFPDV]\d{1,2}\b/g) || []))) {
    if (out.length >= 10) break;
    const c = enrichNcc(m, "Cited in answer");
    if (c) push(c);
  }
  return out;
}

/** Extra system line telling the model which clauses have NCC state variations for the selected state. */
function variationNote(stateCode: string): string {
  const codes = Object.keys(BOARDS_STATE[stateCode] || {});
  if (!codes.length) return "";
  return `\n\nNCC STATE VARIATIONS (${stateCode}): the state appendix varies these NCC 2022 clauses — when citing one of them, flag that a ${stateCode} variation applies and answer per the variation: ${codes.sort().join(", ")}`;
}

function historyMessages(history: any): { role: "user" | "assistant"; content: string }[] {
  if (!Array.isArray(history)) return [];
  return history
    .filter(h => h && ["user", "assistant"].includes(h.role) && typeof h.content === "string")
    .slice(-6)
    .map(h => ({ role: h.role, content: String(h.content).slice(0, 4000) }));
}

// ---------------------------------------------------------------- routes
router.get("/status", (_req: Request, res: Response) => {
  res.json({
    ai: !!process.env.ANTHROPIC_API_KEY,
    model: MODEL,
    counts: {
      vol1: Object.keys(VOL1).length,
      hp: Object.keys(HP).length,
      standards: STANDARDS.length,
      topics: TOPICS.length,
      defects: Object.keys(DEFECTS).length,
      editions: EDITIONS.length,
      boards: BOARDS_AVAILABLE ? Object.keys(BOARDS_MAIN).length : 0,
      stateBoards: BOARDS_AVAILABLE
        ? Object.values(BOARDS_STATE).reduce((n, m) => n + Object.keys(m).length, 0)
        : 0,
    },
    variationBoards: Object.fromEntries(Object.entries(BOARDS_STATE).map(([st, m]) => [st, Object.keys(m).length])),
    national: NATIONAL,
    states: STATES,
    personaSections: PERSONA_SECTIONS,
    personas: PERSONAS,
    templates: TEMPLATES,
  });
});

// Clause evidence-board PNGs (served from the local boards folder when present).
router.get("/board/:code", (req: Request, res: Response) => {
  const abs = boardFile(BOARDS_MAIN[String(req.params.code).toUpperCase()]);
  if (!abs) return res.status(404).json({ error: "no board" });
  res.set("Cache-Control", "public, max-age=86400");
  return res.sendFile(abs);
});

router.get("/board/:state/:code", (req: Request, res: Response) => {
  const st = String(req.params.state).toUpperCase();
  const abs = boardFile(BOARDS_STATE[st]?.[String(req.params.code).toUpperCase()]);
  if (!abs) return res.status(404).json({ error: "no board" });
  res.set("Cache-Control", "public, max-age=86400");
  return res.sendFile(abs);
});

router.get("/plainboard/:code", (req: Request, res: Response) => {
  const abs = boardFile(BOARDS_PLAIN[String(req.params.code).toUpperCase()]);
  if (!abs) return res.status(404).json({ error: "no plain board" });
  res.set("Cache-Control", "public, max-age=86400");
  return res.sendFile(abs);
});

// ---------------------------------------------------------------- training support
const SECTION_TITLES: Record<string, string> = { ...SECTIONS, S: "Specifications" };
const SECTION_ORDER = ["A", "B", "C", "D", "E", "F", "G", "I", "J", "S"];

interface TocPart { p: string; pt: string; clauses: [string, string, string][] }
const TOC: { s: string; title: string; parts: TocPart[] }[] = (() => {
  const bySec = new Map<string, Map<string, TocPart>>();
  for (const [code, c] of Object.entries(VOL1)) {
    const sec = c.s || "?";
    if (!bySec.has(sec)) bySec.set(sec, new Map());
    const parts = bySec.get(sec)!;
    const pKey = c.p || sec;
    if (!parts.has(pKey)) parts.set(pKey, { p: pKey, pt: c.pt || pKey, clauses: [] });
    parts.get(pKey)!.clauses.push([code, c.t, c.k.slice(0, 1)]);
  }
  return SECTION_ORDER.filter(s => bySec.has(s)).map(s => ({
    s,
    title: SECTION_TITLES[s] || s,
    parts: Array.from(bySec.get(s)!.values()),
  }));
})();

const CLAUSE_ORDER: string[] = TOC.flatMap(sec => sec.parts.flatMap(p => p.clauses.map(c => c[0])));

router.get("/toc", (_req: Request, res: Response) => {
  res.set("Cache-Control", "public, max-age=3600");
  res.json({ toc: TOC, total: CLAUSE_ORDER.length });
});

router.get("/clause/:code", (req: Request, res: Response) => {
  const code = String(req.params.code).toUpperCase();
  const c = VOL1[code];
  if (!c) return res.status(404).json({ error: "unknown clause" });
  const idx = CLAUSE_ORDER.indexOf(code);
  res.json({
    code,
    title: c.t,
    section: c.s,
    sectionTitle: SECTION_TITLES[c.s] || c.s,
    part: c.p,
    partTitle: c.pt,
    kind: c.k,
    text: c.x,
    page: c.pg,
    legacy2019: c.l19,
    as: c.as,
    asClauses: c.asc,
    defectIds: c.d,
    board: BOARDS_AVAILABLE && !!BOARDS_MAIN[code],
    plain: BOARDS_AVAILABLE && !!BOARDS_PLAIN[code],
    variations: Object.keys(BOARDS_STATE).filter(st => BOARDS_STATE[st][code]),
    prev: idx > 0 ? CLAUSE_ORDER[idx - 1] : null,
    next: idx >= 0 && idx < CLAUSE_ORDER.length - 1 ? CLAUSE_ORDER[idx + 1] : null,
  });
});

router.post("/ask", async (req: Request, res: Response) => {
  const client = anthropicOrNull();
  if (!client) return res.status(503).json({ error: "ANTHROPIC_API_KEY not configured" });

  const stateCode = String(req.body?.state || "NSW").toUpperCase();
  const state = STATE_BY_CODE[stateCode];
  if (!state) return res.status(400).json({ error: `unknown state '${stateCode}'` });
  const question = String(req.body?.question || "").trim().slice(0, 4000);
  if (!question) return res.status(400).json({ error: "question required" });

  // Persona modes: none (base brain) | single persona | multi-persona panel.
  const personaKey = typeof req.body?.persona === "string" ? req.body.persona : "";
  const single: Persona | null = personaKey ? PERSONA_BY_KEY[personaKey] || null : null;
  if (personaKey && !single) return res.status(400).json({ error: `unknown persona '${personaKey}'` });
  const panel: Persona[] = (Array.isArray(req.body?.personas) ? req.body.personas : [])
    .map((k: any) => PERSONA_BY_KEY[String(k)])
    .filter(Boolean)
    .slice(0, 4);

  const shortState = (s: StateProfile) =>
    `SELECTED JURISDICTION: ${s.name} (${s.code}). Regulator: ${s.regulator}. Licensing: ${s.licensing}. Consumer cover: ${s.warranty}.`;

  let system: { type: "text"; text: string; cache_control?: { type: "ephemeral" } }[];
  let userText: string;
  let maxTokens = 3000;

  if (panel.length >= 2) {
    const cards = panel.map(personaText).join("\n\n---\n\n");
    const hasLeg = panel.some(p => p.kind === "legislation");
    maxTokens = 4000;
    if (hasLeg) {
      const context = contextBlock(question);
      system = [
        { type: "text", text: PERSONA + "\n\n" + CLAUSE_INDEX_BLOCK, cache_control: { type: "ephemeral" } },
        { type: "text", text: PANEL_RULES + "\n\n" + cards + "\n\n" + stateProfileText(state) + variationNote(state.code) },
      ];
      userText = `${context ? context + "\n\n" : ""}PANEL QUESTION (${state.name}): ${question}\n\nReply in the OUTPUT FORMAT tags exactly.`;
    } else {
      system = [
        { type: "text", text: BUSINESS_RULES, cache_control: { type: "ephemeral" } },
        { type: "text", text: PANEL_RULES + "\n\n" + cards + "\n\n" + shortState(state) },
      ];
      userText = `PANEL QUESTION (${state.name}): ${question}\n\nReply in the OUTPUT FORMAT tags exactly.`;
    }
  } else if (single && single.kind === "business") {
    system = [
      { type: "text", text: BUSINESS_RULES, cache_control: { type: "ephemeral" } },
      { type: "text", text: personaText(single) + "\n\n" + shortState(state) },
    ];
    userText = `QUESTION (${state.name}): ${question}\n\nReply in the OUTPUT FORMAT tags exactly.`;
  } else {
    const context = contextBlock(question);
    system = [
      { type: "text", text: PERSONA + "\n\n" + CLAUSE_INDEX_BLOCK, cache_control: { type: "ephemeral" } },
      { type: "text", text: (single ? personaText(single) + "\n\n" : "") + stateProfileText(state) + variationNote(state.code) },
    ];
    userText = `${context ? context + "\n\n" : ""}QUESTION (${state.name}): ${question}\n\nReply in the OUTPUT FORMAT tags exactly.`;
  }

  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages: [...historyMessages(req.body?.history), { role: "user", content: userText }],
    });
    const text = message.content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("");
    const answer = (extractTag(text, "answer") || fallbackAnswer(text)).slice(0, 20000);
    return res.json({
      state: state.code,
      persona: single?.key,
      personas: panel.length >= 2 ? panel.map(p => p.key) : undefined,
      answer,
      citations: enrichCitations(parseCitationLines(extractTag(text, "citations")), answer, state.code),
      followups: parseLines(extractTag(text, "followups"), 3).map(f => f.slice(0, 160)),
    });
  } catch (err: any) {
    return res.status(502).json({ error: "ask failed", message: apiErrorMessage(err) });
  }
});

router.post("/photo", async (req: Request, res: Response) => {
  const client = anthropicOrNull();
  if (!client) return res.status(503).json({ error: "ANTHROPIC_API_KEY not configured" });

  const stateCode = String(req.body?.state || "NSW").toUpperCase();
  const state = STATE_BY_CODE[stateCode];
  if (!state) return res.status(400).json({ error: `unknown state '${stateCode}'` });

  const raw = String(req.body?.image || "");
  const mediaMatch = raw.match(/^data:(image\/(?:jpeg|png|webp));base64,/);
  const mediaType = (mediaMatch?.[1] || "image/jpeg") as "image/jpeg" | "image/png" | "image/webp";
  const image = raw.replace(/^data:[^;]+;base64,/, "");
  if (!image) return res.status(400).json({ error: "image (base64) required" });
  const question = String(req.body?.question || "").trim().slice(0, 2000);
  const personaKey = typeof req.body?.persona === "string" ? req.body.persona : "";
  const persona: Persona | null = personaKey ? PERSONA_BY_KEY[personaKey] || null : null;
  if (personaKey && !persona) return res.status(400).json({ error: `unknown persona '${personaKey}'` });

  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 3000,
      system: [
        { type: "text", text: PHOTO_PERSONA, cache_control: { type: "ephemeral" } },
        { type: "text", text: (persona ? personaText(persona) + "\n\n" : "") + stateProfileText(state) + variationNote(state.code) },
      ],
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: image } },
            { type: "text", text: (question ? `Inspector note: ${question}\n` : "") + `Assess this photo for ${state.name}. Reply in the OUTPUT FORMAT tags exactly.` },
          ],
        },
      ],
    });
    const text = message.content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("");
    const answer = (extractTag(text, "answer") || fallbackAnswer(text)).slice(0, 20000);
    const defectIds = (extractTag(text, "defects") || "")
      .split(/[,\n]/)
      .map(s => s.trim())
      .filter(id => id && DEFECTS[id])
      .slice(0, 3);
    return res.json({
      state: state.code,
      observation: (extractTag(text, "observation") || "").slice(0, 500),
      answer,
      defects: defectIds.map((id: string) => {
        const d = DEFECTS[id];
        return { id, regime: d.regime, subcategory: d.subcategory, description: d.description, ncc2022: d.ncc2022, ncc2019: d.ncc2019, pathway: d.section_choice };
      }),
      citations: enrichCitations(parseCitationLines(extractTag(text, "citations")), answer, state.code),
      followups: parseLines(extractTag(text, "followups"), 3).map(f => f.slice(0, 160)),
    });
  } catch (err: any) {
    return res.status(502).json({ error: "photo failed", message: apiErrorMessage(err) });
  }
});

export default router;
