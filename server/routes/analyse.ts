/**
 * Drawing compliance analysis API endpoint.
 * POST /api/analyse-drawing
 *
 * Accepts multipart form data with PDF files + project config JSON.
 * Uses Anthropic Claude API to analyse drawings against NCC/DBP Act.
 * Falls back gracefully if ANTHROPIC_API_KEY is not set.
 */
import { Router, Request, Response } from "express";
import multer from "multer";
import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";

const router = Router();

// Store uploads in temp directory
const upload = multer({
  dest: path.join(process.cwd(), "tmp_uploads"),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB per file
  fileFilter: (_req, file, cb) => {
    const allowed = [".pdf", ".png", ".jpg", ".jpeg"];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

interface ProjectConfig {
  classCode: string;
  level: string;
  regime: string;
  nccVersion: string;
  projectName: string;
  projectAddress: string;
  daNumber: string;
}

function buildAnalysisPrompt(config: ProjectConfig): string {
  return `You are an NSW Building Commission expert DBP Act 2020 inspector.
NCC Version: ${config.nccVersion}
Building Class: ${config.classCode}
Regime: ${config.regime}
Level: ${config.level}
Project: ${config.projectName} at ${config.projectAddress}
DA Number: ${config.daNumber}

PRESCRIBED BUILDINGS: Class 2 (1 Jul 2021), Class 3/9c new (3 Jul 2023). Mixed-use: if any part is Class 2/3/9c, DBP applies to ALL parts.

CIRD DISQUALIFIERS: "For CC purposes only" stamp | hand sketches | missing DP Registration Number | not "Issue for Construction" status

DBP TITLE BLOCK REQUIRED: REGULATED DESIGN RECORD header | Project Address | Consent No + Body Corporate Reg No | Drawing No + Title (unique) | Rev table with Rev/Date/Description/DP Full Name/Reg No | Issue for Construction | Scale | North Point | Grid refs

WATERPROOFING CRITICAL (NCC 2022): Internal wet area substrate MUST have min 1:100 fall (AS 3740:2021). Critical defects: no puddle/leak control flange | upturns below 150mm at walls / 200mm at shower | no bond breaker fillet | no separate WPP plan series | membrane without CodeMark.

FIRE: Check FRL consistency between GA plans and FRL plans. C1.9 cladding compliance. Penetration schedule AG-FP-01 required. 5 Fire DP Registration Classes must match practitioner registration.

Analyse the uploaded drawing(s) for compliance with ${config.nccVersion} and the DBP Act 2020.

Return ONLY valid JSON with this structure:
{
  "overallCompliant": false,
  "complianceScore": 65,
  "titleBlockIssues": ["list of title block problems"],
  "defects": [
    {
      "id": "D001",
      "category": "TITLE BLOCK|CIRD STATUS|DP REGISTRATION|NCC NON-COMPLIANCE|WATERPROOFING|FIRE PASSIVE|FIRE ACTIVE|PENETRATION SCHEDULE|STRUCTURAL|FACADE/CLADDING|COORDINATION|MISSING DRAWINGS|PORTAL COMPLIANCE",
      "severity": "Critical|Major|Minor",
      "description": "specific defect with clause reference",
      "location": "drawing area/level",
      "reference": "${config.nccVersion} Clause X / AS XXXX / DBP Act s.X",
      "solution": "corrective action required",
      "discipline": "regime name"
    }
  ],
  "missingElements": ["list of required but absent items"],
  "coordinationFlags": ["cross-discipline issues"],
  "positiveFindings": ["compliant aspects"]
}`;
}

router.post("/", upload.array("files", 20), async (req: Request, res: Response) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Clean up uploaded files
    const files = req.files as Express.Multer.File[] | undefined;
    if (files) {
      for (const f of files) {
        fs.unlink(f.path, () => {});
      }
    }
    return res.status(503).json({
      error: "ANTHROPIC_API_KEY not configured",
      message: "Set ANTHROPIC_API_KEY environment variable to enable AI analysis. Using template-based analysis in the meantime.",
    });
  }

  try {
    const config: ProjectConfig = JSON.parse(req.body.config || "{}");
    const files = req.files as Express.Multer.File[] | undefined;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const anthropic = new Anthropic({ apiKey });

    // Build content array with images from uploaded files
    const content: Anthropic.Messages.ContentBlockParam[] = [
      { type: "text", text: buildAnalysisPrompt(config) },
    ];

    for (const file of files) {
      const data = fs.readFileSync(file.path);
      const base64 = data.toString("base64");
      const ext = path.extname(file.originalname).toLowerCase();

      if (ext === ".pdf") {
        // For PDFs, send as document
        content.push({
          type: "document",
          source: {
            type: "base64",
            media_type: "application/pdf",
            data: base64,
          },
        } as any);
      } else {
        // For images (png, jpg)
        const mediaType = ext === ".png" ? "image/png" : "image/jpeg";
        content.push({
          type: "image",
          source: {
            type: "base64",
            media_type: mediaType,
            data: base64,
          },
        });
      }
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8192,
      messages: [{ role: "user", content }],
    });

    // Clean up temp files
    for (const file of files) {
      fs.unlink(file.path, () => {});
    }

    // Extract JSON from response
    const responseText = message.content
      .filter((block): block is Anthropic.Messages.TextBlock => block.type === "text")
      .map(block => block.text)
      .join("");

    // Parse the JSON from the response (may be wrapped in markdown code blocks)
    let jsonStr = responseText;
    const jsonMatch = responseText.match(/```json?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    const result = JSON.parse(jsonStr.trim());

    return res.json({
      classCode: config.classCode,
      level: config.level,
      regime: config.regime,
      ...result,
    });
  } catch (err: any) {
    // Clean up uploaded files on error
    const files = req.files as Express.Multer.File[] | undefined;
    if (files) {
      for (const f of files) {
        fs.unlink(f.path, () => {});
      }
    }

    console.error("Analysis error:", err.message);
    return res.status(500).json({
      error: "Analysis failed",
      message: err.message,
    });
  }
});

export default router;
