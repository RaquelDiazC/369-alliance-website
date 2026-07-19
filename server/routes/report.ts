/**
 * Report Studio API — evidence-based audit reporting in the official NSW
 * OC Audit format (Audit_Report_New_Format / OC Audit Defect Matrix, DCS).
 *
 *   POST /api/report/analyse-item  → one evidence item (drawing PDF or photo)
 *                                    → findings classified per the official
 *                                    defect matrix (serious → rectification /
 *                                    potential-serious → stop work / minor →
 *                                    direction / compliant → recommendation)
 *   POST /api/report/summarise     → executive summary per regime from the
 *                                    accumulated findings register
 *
 * Report assembly/export is client-side (ReportStudio.tsx, jsPDF) — the
 * document structure mirrors the Government reports in
 * OneDrive/3. Working/4. Reports/Reports and Certifications/7.1 OC Reports.
 */
import { Router, Request, Response } from "express";
import Anthropic from "@anthropic-ai/sdk";
import multer from "multer";
import fs from "fs";
import os from "os";
import path from "path";
import defectLibraryJson from "../defect-library.json" with { type: "json" };
import { STATE_BY_CODE, stateProfileText } from "../brain/states.js";

const router = Router();
const MODEL = "claude-sonnet-5";

const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [".pdf", ".png", ".jpg", ".jpeg", ".webp"];
    cb(null, allowed.includes(path.extname(file.originalname).toLowerCase()));
  },
});

const DEFECTS = defectLibraryJson as unknown as Record<
  string,
  { id: string; regime: string; subcategory: string | null; description: string | null; ncc2022: string | null; status: string }
>;

const DEFECT_INDEX = Object.values(DEFECTS)
  .filter(e => e.status === "active")
  .map(e => `${e.id}|${e.regime}|${e.subcategory || "-"}|${(e.description || "").replace(/\s+/g, " ").slice(0, 100)}`)
  .join("\n");

/** Official OC Audit defect matrix (OC Audit Defect Matrix 20200814, DCS). */
export const DEFECT_MATRIX = [
  { category: "extremely-serious", label: "Extremely serious", action: "Prohibition order", colour: "Red" },
  { category: "serious", label: "Serious", action: "Rectification order", colour: "Red" },
  { category: "potential-serious", label: "Potentially serious", action: "Stop work order", colour: "Amber" },
  { category: "minor", label: "Minor", action: "Direction", colour: "Amber" },
  { category: "compliant", label: "Compliant", action: "Recommendation", colour: "Green" },
] as const;

const CATEGORIES = new Set(DEFECT_MATRIX.map(m => m.category));

const REGIMES = ["Waterproofing", "Fire Safety", "Structural", "Building Enclosure", "Essential Services", "Other"];

const ANALYSE_SYSTEM = `You are a NSW Building Commission authorised officer conducting an OC audit under the Residential Apartment Buildings (Compliance and Enforcement Powers) Act 2020, assessing evidence (a design drawing or a site photo) against BCA/NCC Volume One, the relevant Australian Standards and the approved plans.

CLASSIFY every finding per the official OC Audit Defect Matrix:
- serious — defect in a building element attributable to a failure to comply with the BCA performance requirements, the relevant Australian Standards or the approved plans (RAB Act s3) → Rectification order
- potential-serious — high likelihood / moderate risk that, unless rectified, it becomes a serious defect → Stop work order
- minor — non-conformance requiring a direction (process, documentation, sequencing) → Direction
- compliant — meets DtS / performance solutions; note good practice → Recommendation
- extremely-serious — reserved for statutory triggers (missing expected completion notice, existing rectification/development control orders); only use when the evidence explicitly shows one.

METHOD
1. Describe what the evidence shows (drawing discipline/title or photo subject).
2. For DRAWINGS: check title block (revision, "Issued for Construction" status, practitioner details), completeness of details for the stated regime, NCC/AS compliance of what is drawn, coordination signals with other disciplines. Missing critical detail = a finding.
3. For PHOTOS: only report what is genuinely visible; match the MASTER DEFECT INDEX where an id fits.
4. Cite precisely: NCC 2022 clause codes (e.g. F1D7, C2D10), AS with clause (e.g. AS 4654.2 §2.8), approved-plan discrepancies.
5. PRECISION OVER RECALL — do not invent defects. If the evidence is compliant, return one "compliant" finding saying so.

OUTPUT — exactly these tags:
<observation>
1-3 sentences: what this evidence item is and shows.
</observation>
<findings>
One finding per line, pipe-separated, 7 fields:
element|category|observation|breach|rectification|defect_id|confidence
- element: building element/system (e.g. "Balcony membrane termination")
- category: serious | potential-serious | minor | compliant | extremely-serious
- observation: what is wrong (or right), specific and factual
- breach: NCC/AS/plan references (e.g. "F1P4; F1D7; AS 4654.2 §2.9")
- rectification: required corrective action (short imperative)
- defect_id: MASTER DEFECT INDEX id if one fits (e.g. W1.3) else -
- confidence: high | medium | low
Max 12 findings, most serious first.
</findings>

MASTER DEFECT INDEX (id|regime|subcategory|defect):
${DEFECT_INDEX}`;

const SUMMARISE_SYSTEM = `You are the lead authorised officer writing the Executive Summary of a NSW OC Audit Report (RAB Act 2020). You receive the findings register. Write in the official report voice: factual, third person, no speculation.

OUTPUT — exactly these tags:
<overall>
2-4 sentences: overall condition of the building work, count of serious / potential serious defects, and the recommended course (e.g. rectification orders prior to OC).
</overall>
<regimes>
One line per audited regime present in the register:
Regime name|1-2 sentence summary of that regime's findings|worst category in that regime (serious/potential-serious/minor/compliant)
</regimes>`;

function extractTag(text: string, tag: string): string | null {
  const m = text.match(new RegExp(`<${tag}>([\\s\\S]*?)(?:</${tag}>|$)`));
  return m ? m[1].trim() : null;
}

function apiErrorMessage(err: any): string {
  const inner = err?.error?.error?.message || err?.error?.message;
  const msg = inner || err?.message || String(err);
  if (/credit balance/i.test(msg)) return "Anthropic API credit balance is exhausted — top up at console.anthropic.com (Plans & Billing).";
  return msg.slice(0, 300);
}

router.post("/analyse-item", upload.single("file"), async (req: Request, res: Response) => {
  const file = req.file;
  const cleanup = () => { if (file) fs.unlink(file.path, () => {}); };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) { cleanup(); return res.status(503).json({ error: "ANTHROPIC_API_KEY not configured" }); }
  if (!file) return res.status(400).json({ error: "file required (pdf/jpg/png/webp)" });

  const kind = req.body.kind === "photo" ? "photo" : "drawing";
  const regime = REGIMES.includes(req.body.regime) ? req.body.regime : "Other";
  const location = String(req.body.location || "").slice(0, 120);
  const note = String(req.body.note || "").slice(0, 500);
  const classCode = String(req.body.classCode || "2").slice(0, 3);
  const nccVersion = String(req.body.nccVersion || "NCC 2022").slice(0, 30);
  const stateCode = String(req.body.state || "NSW").toUpperCase();
  const state = STATE_BY_CODE[stateCode] || STATE_BY_CODE.NSW;

  try {
    const data = fs.readFileSync(file.path);
    cleanup();
    const base64 = data.toString("base64");
    const ext = path.extname(file.originalname).toLowerCase();
    const evidenceBlock =
      ext === ".pdf"
        ? ({ type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } } as any)
        : ({
            type: "image",
            source: {
              type: "base64",
              media_type: (ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg") as any,
              data: base64,
            },
          } as any);

    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 3000,
      system: [
        { type: "text", text: ANALYSE_SYSTEM, cache_control: { type: "ephemeral" } },
        { type: "text", text: stateProfileText(state) },
      ],
      messages: [
        {
          role: "user",
          content: [
            evidenceBlock,
            {
              type: "text",
              text: `Evidence item: ${kind.toUpperCase()} — regime: ${regime} — location: ${location || "not stated"} — building class ${classCode} — ${nccVersion} — file "${file.originalname}".${note ? ` Auditor note: ${note}` : ""}\nAssess and reply in the OUTPUT tags exactly.`,
            },
          ],
        },
      ],
    });

    const text = message.content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("");
    const findings = (extractTag(text, "findings") || "")
      .split("\n")
      .map(l => l.trim())
      .filter(l => l && l.includes("|"))
      .map(l => {
        const [element, category, observation, breach, rectification, defectId, confidence] = l.split("|").map(s => (s || "").trim());
        const cat = CATEGORIES.has(category as any) ? category : "minor";
        const matrix = DEFECT_MATRIX.find(m => m.category === cat)!;
        return {
          element: element.slice(0, 160),
          category: cat,
          label: matrix.label,
          action: matrix.action,
          colour: matrix.colour,
          observation: observation.slice(0, 600),
          breach: breach.slice(0, 300),
          rectification: rectification.slice(0, 400),
          defectId: defectId && DEFECTS[defectId] ? defectId : null,
          confidence: ["high", "medium", "low"].includes(confidence) ? confidence : "medium",
          regime,
          location,
          source: file.originalname,
          kind,
        };
      })
      .slice(0, 12);

    return res.json({
      observation: (extractTag(text, "observation") || "").slice(0, 700),
      findings,
    });
  } catch (err: any) {
    cleanup();
    return res.status(502).json({ error: "analyse failed", message: apiErrorMessage(err) });
  }
});

router.post("/summarise", async (req: Request, res: Response) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(503).json({ error: "ANTHROPIC_API_KEY not configured" });
  const findings = Array.isArray(req.body?.findings) ? req.body.findings.slice(0, 120) : [];
  if (!findings.length) return res.status(400).json({ error: "findings required" });
  const site = String(req.body?.site || "").slice(0, 200);

  const register = findings
    .map((f: any, i: number) =>
      `${i + 1}|${f.regime}|${f.location || "-"}|${f.element}|${f.label}|${String(f.observation || "").slice(0, 160)}|${f.breach || "-"}`,
    )
    .join("\n");

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 1500,
      system: [{ type: "text", text: SUMMARISE_SYSTEM, cache_control: { type: "ephemeral" } }],
      messages: [
        {
          role: "user",
          content: `Site: ${site || "the development site"}\nFindings register (no|regime|location|element|category|observation|breach):\n${register}\n\nReply in the OUTPUT tags exactly.`,
        },
      ],
    });
    const text = message.content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("");
    const regimes = (extractTag(text, "regimes") || "")
      .split("\n")
      .map(l => l.trim())
      .filter(l => l && l.includes("|"))
      .map(l => {
        const [regime, summary, worst] = l.split("|").map(s => (s || "").trim());
        return { regime: regime.slice(0, 40), summary: summary.slice(0, 500), worst: worst.slice(0, 30) };
      });
    return res.json({ overall: (extractTag(text, "overall") || "").slice(0, 1200), regimes });
  } catch (err: any) {
    return res.status(502).json({ error: "summarise failed", message: apiErrorMessage(err) });
  }
});

router.get("/matrix", (_req: Request, res: Response) => {
  res.json({ matrix: DEFECT_MATRIX, regimes: REGIMES });
});

export default router;
