/**
 * DBP drawing compliance analysis API.
 *
 * The problem this solves
 * ----------------------
 * Real-world DBP audit reports are written by specialists. A fire engineer
 * audits the fire drawings; a waterproofing consultant audits the waterproofing.
 * Whichever regime the auditor does not personally practise is the regime that
 * silently passes — which is why no single market report ever lists every defect
 * in a drawing set.
 *
 * So this endpoint does NOT run one generic prompt over the set. It runs a fixed
 * audit plan: a document register + declarability gate, then one dedicated
 * specialist pass per regulated design class (whether or not that discipline
 * appears in the upload — an absent discipline is itself a finding), then a
 * cross-discipline integration pass against DBP Regulation cl 8, then a
 * deterministic coverage and score roll-up.
 *
 * Knowledge injected per pass (verbatim, not paraphrased):
 *   · knowledge/rdgm.json              Regulated Design Guidance Material,
 *                                      Appendix 1 of the Design Practitioners
 *                                      Handbook — minimum scale, portal folder,
 *                                      design aspects and minimum requirements
 *                                      for each design category.
 *   · knowledge/drawing-register.json  The drawing series a complete Class 2/3/9c
 *                                      set is expected to contain, per regime.
 *   · knowledge/audit-findings.json    The four-part finding format used by NSW
 *                                      Building Commission auditors, plus worked
 *                                      examples and the recurring root causes.
 *
 * Endpoints
 *   GET  /api/analyse-drawing/plan       the audit plan (for progress UI)
 *   POST /api/analyse-drawing/intake     multipart upload → file ids + register + gate
 *   POST /api/analyse-drawing/pass       one discipline pass
 *   POST /api/analyse-drawing/integrate  cross-discipline pass + coverage + score
 *   POST /api/analyse-drawing            legacy single-shot (kept for the old client)
 *
 * Staging the passes keeps every request well inside the 60s serverless budget:
 * files are uploaded once to the Anthropic Files API and referenced by id after
 * that, so each pass request carries only a few kilobytes of JSON.
 */
import { Router, Request, Response } from "express";
import multer from "multer";
import Anthropic, { toFile } from "@anthropic-ai/sdk";
import fs from "fs";
import os from "os";
import path from "path";
import rdgm from "../knowledge/rdgm.json" with { type: "json" };
import register from "../knowledge/drawing-register.json" with { type: "json" };
import findingsPack from "../knowledge/audit-findings.json" with { type: "json" };

const router = Router();
const MODEL = "claude-sonnet-5";
/** Referencing an uploaded file by id in a content block needs the Files API beta. */
const FILES_BETA = ["files-api-2025-04-14"] as const;

const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [".pdf", ".png", ".jpg", ".jpeg"];
    cb(null, allowed.includes(path.extname(file.originalname).toLowerCase()));
  },
});

/* ─────────────────────────────── the audit plan ────────────────────────────── */

interface Discipline {
  key: string;
  label: string;
  /** Keys into rdgm.json → classes */
  rdgmClasses: string[];
  /** Keys into drawing-register.json → regimes */
  registerRegimes: string[];
  /** What this specialist must not leave the set without checking. */
  focus: string[];
  /** Hard numbers that are wrong more often than they are right. */
  hardRules: string[];
}

const DISCIPLINES: Discipline[] = [
  {
    key: "architectural",
    label: "Architectural / building design",
    rdgmClasses: ["architectural"],
    registerRegimes: ["general"],
    focus: [
      "Cover page acting as a drawing register for the set, with site and building details",
      "Site plan showing boundaries, fire source features and reduced levels; site setout plan with grids and survey points",
      "Floor plans for every level including roof and basements — dimensioned, room names, FFL/SSL, shafts and risers, exits",
      "Elevations of every aspect and at least two intersecting sections",
      "Egress design: riser and going dimensions, stair widths, landing locations and sizes, head clearance, ramp gradients",
      "Callouts, tags and references from plans to the details, schedules and specifications that carry the real content",
      "Expansion, movement and control joints in any element exposed to rainwater, groundwater, shower water or garden watering — shown as a red dotted line with predicted 10-year movement marked",
    ],
    hardRules: [
      "General arrangement plans and floor plans: minimum 1:100",
      "General elevations: 1:100 (1:200 only where detailed facade documentation is provided)",
      "General sections: 1:100 (1:200 only where details are provided)",
      "General details: 1:20, and 1:10 or 1:5 where the junction demands it",
      "A detail drawn at 1:10 where the Guidance Material calls for 1:5 is a defect in its own right",
    ],
  },
  {
    key: "waterproofing",
    label: "Waterproofing (internal wet areas + external)",
    rdgmClasses: ["architectural"],
    registerRegimes: ["waterproofing"],
    focus: [
      "Plans identifying every area requiring waterproofing, with floor gradients specified and floor waste locations shown",
      "Floor and wall construction/substrates, membrane system and the full extent of coverage",
      "Location and type of water stops; bond breakers at wall/floor intersections",
      "Shower screen type (enclosed / unenclosed) and the waterproofing consequence of each",
      "Termination of the membrane into floor wastes; waterproofing around fixtures; bathtub/wall intersection",
      "External: balconies, roofs and planter boxes — extent of membrane, gradients, floor waste and overflow locations, membrane termination, overflow detail, podium expansion joint section, podium planter box section",
      "Door thresholds: subsill flashing, bond breakers on internal corners, nominated falls, gap between subsill and FFL, sealant at the waterstop angle / subsill junction, notation for the return of the waterstop angle",
    ],
    hardRules: [
      "Waterproofing designs: minimum 1:50, with 1:20, 1:10 or 1:5 where the detail requires it — threshold and junction details are 1:5 work",
      "AS 3740 (internal wet areas) and AS 4654.1/.2 (external above-ground) are the operative Standards; AS 4654.2-2012 Figure 2.8 is the benchmark threshold detail",
      "A membrane shown without a nominated fall, or a wet area with no floor gradient specified, is a critical defect — this is the single most common finding in the regime",
    ],
  },
  {
    key: "fire-safety",
    label: "Fire safety — passive and systems",
    rdgmClasses: ["fire-safety-systems", "fire-safety-engineer", "smoke-control"],
    registerRegimes: ["fire-safety"],
    focus: [
      "Wall type reference plans and fire safety wall type sections — every fire-rated element traceable to a wall type",
      "Fire compartmentation plans and sections; party wall and wall setout plans",
      "Vertical riser shaft sections and details",
      "Fire safety penetration floor plans and the penetration schedule / fire matrix explaining how each FRL is achieved and maintained",
      "Fire rated junction details, fire rated door details, door and fire protection schedules, signage plans and schedules",
      "Hydrant, hose reel, sprinkler, detection and alarm system block plans and schematics; water supply including RPZ devices; fire systems control matrix",
      "Performance solutions: is the report referenced, and is the referenced revision the latest declared revision?",
    ],
    hardRules: [
      "Fire safety services masterplans: minimum 1:500; water supply and fire safety systems generally: minimum 1:100",
      "An FRL shown on a general arrangement plan that conflicts with the FRL on the fire plan is a critical defect — check them against each other, not in isolation",
      "Fire dampers scheduled without an FRL for insulation are non-compliant unless AS 1668.1-2015 cl 3.2.3 is satisfied (shaft-mounted, or ≥2 m of connected duct per cl 2.3.2)",
      "Cladding and attachments: check the NCC fire hazard property requirements for every external material scheduled",
    ],
  },
  {
    key: "structural",
    label: "Structural / load bearing",
    rdgmClasses: ["structural"],
    registerRegimes: ["load-bearing"],
    focus: [
      "Concrete setout, profile and penetration plans; structural sections and elevations",
      "Design loads, design criteria and the assumptions the design rests on",
      "Movement report and the location of expansion, movement and control joints",
      "Fire rating of structural elements and how it is achieved",
      "Service penetrations through structural elements — coordinated, or drawn by one discipline and unknown to the other?",
      "Flood hazard considerations where applicable",
    ],
    hardRules: [
      "Structural plans that do not show elements another discipline depends on (balcony overflow channels, drainage falls, penetrations) are an integration defect under DBP Regulation cl 8, even if the structure itself is sound",
      "A structural concept plan is not a construction issued regulated design — check the set contains design plans and details, not concepts",
    ],
  },
  {
    key: "facade",
    label: "Facade / building enclosure",
    rdgmClasses: ["facade"],
    registerRegimes: ["building-enclosure"],
    focus: [
      "Slab edge details; weatherproofing of external walls for every facade type",
      "External door weatherproofing; external flashing details called out from the general set",
      "External wall to floor/balcony interface; interface between different external wall materials; parapet and eave details",
      "Basement wall construction: waterstops to basement walls and piling, tanking/waterproofing to basement walls",
      "Window, door, glazing and louvre details and schedules; sill flashings on every section through a window",
      "Facade framing, balustrade structural design, thermal compliance details",
      "Building product schedules or specification — is the product identified well enough that a non-compliant substitute cannot be selected?",
    ],
    hardRules: [
      "Sections through a brick veneer wall and window must show sill flashings and be drawn at 1:5 — AS 2047-2014 Figure 7.1 is the benchmark, NCC Vol 1 FP1.4 the performance requirement",
      "A generic product name with no performance specification is a defect: the contractor can lawfully select a non-compliant product",
    ],
  },
  {
    key: "mechanical",
    label: "Mechanical and smoke control",
    rdgmClasses: ["mechanical", "smoke-control"],
    registerRegimes: ["building-services"],
    focus: [
      "Service route masterplan and coordination with the structural and architectural sets",
      "Mechanical ventilation to car parks, sanitary compartments and kitchens; discharge locations",
      "Fire and smoke control systems, dampers and their FRLs",
      "Duct sizing, set-out dimensions and drawn-to-scale ductwork — not single-line diagrams",
      "Product specification for duct and equipment (fire hazard properties)",
      "Penetration protection where ductwork crosses fire-rated construction",
    ],
    hardRules: [
      "Kitchen exhaust must discharge to outdoor air directly or via a shaft/duct — recirculating rangehoods are non-compliant",
      "Ductwork drawn single-line, not to scale and without set-out dimensions cannot be declared and prevents other practitioners from integrating their designs",
      "PVC duct must be specified by performance or make; not all PVC duct on the market complies with the fire hazard property requirements",
    ],
  },
  {
    key: "drainage",
    label: "Drainage / hydraulic and stormwater",
    rdgmClasses: ["drainage"],
    registerRegimes: ["building-services"],
    focus: [
      "Sanitary drainage and stormwater layouts, invert levels and gradients",
      "Spoon and dish drains in basements and car parks — falls to the floor waste nominated",
      "Sub-soil drainage and its gradients",
      "Balcony and roof overflow provisions and how they land on the structural and architectural sets",
      "Specific references to the drawings of other disciplines by number and revision, not 'refer to drawings of others'",
    ],
    hardRules: [
      "Every drain must have a nominated gradient — AS 3500.3 Section 6.3.4 and Table 6.3.4 set the minimum gradients for site stormwater drains",
      "A drainage design with no falls indicated is a critical defect: ponding is the guaranteed outcome and the building practitioner has nothing to build to",
    ],
  },
  {
    key: "electrical",
    label: "Electrical",
    rdgmClasses: ["electrical"],
    registerRegimes: ["building-services"],
    focus: [
      "Distribution, switchboard and submain layouts",
      "Emergency lighting and exit signs — and whether they also appear on the architectural reflected ceiling plans",
      "Fire-rated services and their penetrations through fire-rated construction",
      "Substation and main switchroom fire separation",
    ],
    hardRules: [
      "Emergency lighting and exit signs missing from the architectural RCPs is a coordination defect even when the electrical set is complete",
    ],
  },
  {
    key: "vertical-transportation",
    label: "Vertical transportation",
    rdgmClasses: ["vertical-transportation"],
    registerRegimes: ["building-services"],
    focus: [
      "Lift shaft, pit and overrun setout; machine room and controller locations",
      "Lift car accessibility provisions and car interior details",
      "Fire-isolated lift and lift lobby requirements; fire service controls",
      "Maintenance and rescue access provisions",
    ],
    hardRules: [
      "A lift shown only as a symbol on architectural plans, with no vertical transportation regulated design in the set, means the regime is undocumented — report it as a missing design, not as 'not applicable'",
    ],
  },
  {
    key: "geotechnical",
    label: "Geotechnical, shoring and ground anchors",
    rdgmClasses: ["geotechnical"],
    registerRegimes: ["load-bearing"],
    focus: [
      "Geotechnical investigation report and the assumptions it establishes",
      "Shoring design details and ground anchor design details (both are regulated designs under the DBP Ministerial Order)",
      "Earthwork and excavation details; groundwater and dewatering",
      "Interface with the basement waterproofing and tanking design",
    ],
    hardRules: [
      "Shoring and ground anchors are regulated designs by force of the DBP Ministerial Order — their absence from the set is a finding, not an omission of scope",
    ],
  },
];

/* ───────────────────────────────── helpers ─────────────────────────────────── */

interface ProjectConfig {
  classCode?: string;
  level?: string;
  regime?: string;
  nccVersion?: string;
  projectName?: string;
  projectAddress?: string;
  daNumber?: string;
}

interface UploadedFile {
  id: string;
  name?: string;
  kind: string;
}

function client(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  return apiKey ? new Anthropic({ apiKey }) : null;
}

function cleanup(files?: Express.Multer.File[]) {
  for (const f of files ?? []) fs.unlink(f.path, () => {});
}

/** Strip markdown fences and parse the model's JSON, tolerating stray prose. */
function parseJSON<T>(text: string, fallback: T): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = (fenced ? fenced[1] : text).trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) return fallback;
  try {
    return JSON.parse(raw.slice(start, end + 1)) as T;
  } catch {
    return fallback;
  }
}

function textOf(msg: { content: Array<{ type: string; text?: string }> }): string {
  return msg.content.map(b => (b.type === "text" ? (b.text ?? "") : "")).join("");
}

/**
 * Ask for a result through a forced tool call rather than "return only JSON".
 *
 * Free-text JSON is fragile here: an audit pass carries a long prompt and can
 * write a lot of findings, so a response that runs into max_tokens leaves
 * unbalanced braces and the whole pass silently parses to nothing. A tool call
 * is validated by the API against the schema, so we either get a usable object
 * or an explicit error.
 */
async function structured<T>(
  anthropic: Anthropic,
  opts: {
    name: string;
    description: string;
    schema: Record<string, unknown>;
    prompt: string;
    files: UploadedFile[];
    maxTokens?: number;
  },
  fallback: T,
): Promise<T> {
  const msg = await anthropic.beta.messages.create({
    betas: [...FILES_BETA],
    model: MODEL,
    max_tokens: opts.maxTokens ?? 12000,
    tools: [
      {
        name: opts.name,
        description: opts.description,
        input_schema: opts.schema as never,
      },
    ],
    tool_choice: { type: "tool", name: opts.name },
    messages: [
      {
        role: "user",
        content: [{ type: "text", text: opts.prompt }, ...fileBlocks(opts.files)] as never,
      },
    ],
  });

  const tool = msg.content.find(b => b.type === "tool_use");
  if (tool && "input" in tool) return tool.input as T;

  // Belt and braces: if the model answered in prose anyway, salvage what we can.
  if (msg.stop_reason === "max_tokens") {
    console.warn(`[analyse] ${opts.name} hit max_tokens — result may be partial`);
  }
  return parseJSON(textOf(msg), fallback);
}

/** Build the content blocks that point the model at the already-uploaded files. */
function fileBlocks(files: UploadedFile[]) {
  return files.map(f =>
    f.kind === "pdf"
      ? { type: "document", source: { type: "file", file_id: f.id } }
      : { type: "image", source: { type: "file", file_id: f.id } },
  );
}

/* ─────────────────────────── structured-output schemas ────────────────────── */

const str = (description: string) => ({ type: "string", description });
const strList = (description: string) => ({ type: "array", items: { type: "string" }, description });

const FINDING_SCHEMA = {
  type: "object",
  required: ["id", "regime", "severity", "type", "finding", "issue", "action"],
  properties: {
    id: str("Short stable id, e.g. WP-01"),
    regime: str("Regime / sub-category, e.g. 'Waterproofing — external'"),
    severity: {
      type: "string",
      enum: ["Critical", "Major", "Minor"],
      description:
        "Critical = cannot be declared or built safely as drawn; Major = will cause non-compliance or rework; Minor = documentation quality",
    },
    type: {
      type: "string",
      enum: [
        "MISSING DESIGN",
        "INSUFFICIENT DETAIL",
        "SCALE",
        "NON-COMPLIANCE",
        "SPECIFICATION",
        "INTEGRATION",
        "TITLE BLOCK",
      ],
    },
    finding: str("What is the audit finding? One sentence in the auditor's voice"),
    issue: str("Describe the issue — what fails and against which requirement"),
    action: str("What action is required, with the operative clause quoted"),
    references: strList("NCC/BCA clauses, AS clauses, DBP Act sections or Regulation clauses"),
    rdgmCode: str("Closest Regulated Design Guidance Material design category, or empty"),
    drawing: str("Drawing number / detail reference as printed, or 'not identified'"),
    location: str("Level / area"),
    scaleStated: str("Scale printed on the sheet, or empty"),
    scaleRequired: str("Minimum scale the Guidance Material sets for this category, or empty"),
    disciplines: strList("For integration findings: which sets disagree"),
  },
} as const;

const INTAKE_SCHEMA = {
  type: "object",
  required: ["register", "disciplinesPresent", "gate"],
  properties: {
    register: {
      type: "array",
      description: "One entry per sheet you can see",
      items: {
        type: "object",
        properties: {
          drawingNo: str("Drawing number as printed"),
          title: str("Drawing title as printed"),
          discipline: str(
            "architectural | structural | facade | fire-safety | mechanical | drainage | electrical | vertical-transportation | geotechnical | other",
          ),
          revision: str("Revision"),
          revDate: str("Revision date"),
          scale: str("Scale as stated"),
          issueStatus: str("Issue status printed on the sheet"),
          legible: { type: "boolean" },
        },
      },
    },
    disciplinesPresent: strList("Discipline keys represented in the upload"),
    gate: {
      type: "object",
      required: ["declarable", "cirdStatus", "issues"],
      properties: {
        declarable: { type: "boolean" },
        cirdStatus: str(
          "Issue for Construction | For CC purposes only | Preliminary | Not for construction | Unstated",
        ),
        titleBlock: {
          type: "object",
          properties: Object.fromEntries(
            [
              "regulatedDesignRecordHeader",
              "projectAddress",
              "consentNo",
              "bodyCorporateRegNo",
              "uniqueDrawingNoAndTitle",
              "revisionTableComplete",
              "dpNameAndRegNo",
              "scale",
              "northPoint",
              "gridReferences",
            ].map(k => [k, { type: "boolean" }]),
          ),
        },
        issues: strList("Each disqualifier found, written as a one-line finding"),
      },
    },
  },
} as const;

const PASS_SCHEMA = {
  type: "object",
  required: ["seriesFound", "seriesMissing", "findings"],
  properties: {
    seriesFound: strList("Expected drawing series you could actually see"),
    seriesMissing: strList("Expected drawing series you could not find"),
    findings: { type: "array", items: FINDING_SCHEMA },
    positives: strList(
      "Things this set does correctly in this regime — be specific, practitioners are only ever told what is wrong",
    ),
  },
} as const;

const INTEGRATION_SCHEMA = {
  type: "object",
  required: ["findings", "executiveSummary"],
  properties: {
    findings: { type: "array", items: FINDING_SCHEMA },
    coordinationVerdict: str(
      "One paragraph on whether this set shows evidence of an actual coordination process",
    ),
    executiveSummary: str(
      "3-5 sentences an auditor could paste into the report: what the set is, what the material failures are, and whether it can be declared as-is",
    ),
    positives: strList("Cross-discipline things this set does well"),
  },
} as const;

function projectHeader(c: ProjectConfig): string {
  return [
    `Project: ${c.projectName || "(unnamed)"} at ${c.projectAddress || "(no address)"}`,
    `DA / consent number: ${c.daNumber || "(not supplied)"}`,
    `Building class: ${c.classCode || "2"} — the DBP Act applies to Class 2 (from 1 Jul 2021) and Class 3 / 9c (new work from 3 Jul 2023). Where a building has a prescribed class part, ALL parts of the building are caught.`,
    `Applicable code edition: ${c.nccVersion || "NCC 2022"}`,
    `Level / area under audit: ${c.level || "whole building"}`,
  ].join("\n");
}

/** Shared preamble: who the model is and how it must write. */
const AUDITOR_ROLE = `You are a NSW Building Commission DBP Act 2020 audit practitioner reviewing a set of regulated designs for a prescribed building (Class 2, 3 or 9c).

You are auditing a construction issued regulated design. The test is not "is this a nice drawing" — it is the statutory one: does the design contain the detail needed for the Building Practitioner to carry out the work and build in compliance with the BCA, and does it accord with the Regulated Design Guidance Material? If a building practitioner could not build from it without asking a question, it is not suitable for construction.

Write every finding in the four-part format the Commission's own auditors use:
${findingsPack.format.fields.map(f => `· ${f.label} — ${f.guide}`).join("\n")}

These are the root causes that recur across real audits — look for them specifically:
${findingsPack.recurringCauses.map(c => `· ${c}`).join("\n")}

Worked examples of correctly written findings (match this voice and this level of specificity):
${findingsPack.workedExamples
  .slice(0, 6)
  .map(
    e =>
      `— ${e.regime}\n  Finding: ${e.finding}\n  Issue: ${e.issue}\n  Action: ${e.action}\n  Refs: ${e.references.join("; ")}`,
  )
  .join("\n")}

Rules you must not break:
1. Never invent a clause number. If you are not certain of the clause, cite the Standard or the Act section you ARE certain of and say the clause needs verification.
2. Never report "not applicable" for a regime. If the design for a regime is absent from what you were given, that is a finding of type MISSING DESIGN — an undocumented regime cannot be built compliantly.
3. Quote what you actually see on the sheet (drawing number, detail number, scale, note text) so the finding is auditable.
4. Severity: Critical = the design cannot be declared or built safely as drawn; Major = the work can start but the defect will cause non-compliance or rework; Minor = documentation quality that must be fixed before the next revision.`;

/* ──────────────────────────────── GET /plan ────────────────────────────────── */

router.get("/plan", (_req: Request, res: Response) => {
  res.json({
    ai: Boolean(process.env.ANTHROPIC_API_KEY),
    model: MODEL,
    stages: [
      { key: "intake", label: "Document register & declarability gate" },
      ...DISCIPLINES.map(d => ({ key: d.key, label: d.label })),
      { key: "integration", label: "Cross-discipline integration & clash review" },
    ],
    disciplines: DISCIPLINES.map(d => ({
      key: d.key,
      label: d.label,
      regimes: d.registerRegimes,
      checks: d.focus.length + d.hardRules.length,
    })),
    knowledge: {
      rdgmClasses: Object.keys(rdgm.classes).length,
      registerRegimes: register.regimes.length,
      workedExamples: findingsPack.workedExamples.length,
    },
  });
});

/* ─────────────────────────────── POST /intake ──────────────────────────────── */

const GATE_PROMPT = `${AUDITOR_ROLE}

STAGE 1 of the audit — DOCUMENT REGISTER AND DECLARABILITY GATE.
Do not audit technical content yet. Read the sheets and answer two questions.

A) REGISTER. For every sheet you can see, record: drawing number, drawing title, discipline (architectural / structural / facade / fire safety / mechanical / drainage / electrical / vertical transportation / geotechnical / other), revision, revision date, the drawing scale as stated, and the issue status printed on the sheet.

B) DECLARABILITY GATE. A design cannot be a construction issued regulated design, and cannot be validly declared, if any of these are true. Check each one explicitly:
   · The sheet is stamped "For CC purposes only", "For approval", "Preliminary", "Not for construction" or similar, rather than "Issue for Construction".
   · The content is a hand sketch or a marked-up print rather than a drawn design.
   · There is no Design Practitioner registration number against the person declaring.
   · The revision table does not carry Rev / Date / Description / DP full name / DP registration number.
   · The title block is missing any of: REGULATED DESIGN RECORD header, project address, consent number and body corporate registration number, unique drawing number and title, scale, north point, grid references.
   · The set defers its content to workshop drawings still to be produced (workshop drawings of a regulated design must themselves be declared).

Record your answer with the record_intake tool.`;

router.post("/intake", upload.array("files", 30), async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[] | undefined;
  const anthropic = client();

  if (!anthropic) {
    cleanup(files);
    return res.status(503).json({
      error: "ANTHROPIC_API_KEY not configured",
      message: "Set ANTHROPIC_API_KEY to enable the staged drawing audit.",
    });
  }
  if (!files?.length) return res.status(400).json({ error: "No files uploaded" });

  try {
    const config: ProjectConfig = JSON.parse(req.body.config || "{}");

    // Upload once; every later pass references the file ids instead of re-posting bytes.
    const uploaded: UploadedFile[] = await Promise.all(
      files.map(async f => {
        const ext = path.extname(f.originalname).toLowerCase();
        const type =
          ext === ".pdf" ? "application/pdf" : ext === ".png" ? "image/png" : "image/jpeg";
        const meta = await anthropic.beta.files.upload({
          file: await toFile(fs.createReadStream(f.path), f.originalname, { type }),
        });
        return { id: meta.id, name: f.originalname, kind: ext === ".pdf" ? "pdf" : "image" };
      }),
    );

    const parsed = await structured(
      anthropic,
      {
        name: "record_intake",
        description: "Record the drawing register and the declarability gate result.",
        schema: INTAKE_SCHEMA,
        prompt: `${GATE_PROMPT}\n\n${projectHeader(config)}`,
        files: uploaded,
        maxTokens: 10000,
      },
      {
        register: [] as unknown[],
        disciplinesPresent: [] as string[],
        gate: { declarable: false, cirdStatus: "Unstated", issues: [] as string[], titleBlock: {} },
      },
    );

    res.json({
      files: uploaded,
      register: parsed.register ?? [],
      disciplinesPresent: parsed.disciplinesPresent ?? [],
      gate: parsed.gate,
      plan: DISCIPLINES.map(d => ({ key: d.key, label: d.label })),
    });
  } catch (err) {
    res.status(500).json({ error: "Intake failed", message: (err as Error)?.message ?? String(err) });
  } finally {
    cleanup(files);
  }
});

/* ──────────────────────────────── POST /pass ───────────────────────────────── */

router.post("/pass", async (req: Request, res: Response) => {
  const anthropic = client();
  if (!anthropic) return res.status(503).json({ error: "ANTHROPIC_API_KEY not configured" });

  const { files, config = {}, discipline } = req.body ?? {};
  const d = DISCIPLINES.find(x => x.key === discipline);
  if (!d) return res.status(400).json({ error: `Unknown discipline "${discipline}"` });
  if (!Array.isArray(files) || !files.length)
    return res.status(400).json({ error: "No file ids — call /intake first" });

  const guidance = d.rdgmClasses
    .map(k => {
      const c = (rdgm.classes as Record<string, { label: string; portalFolder: string; guidance: string }>)[k];
      return c ? `### ${c.label} (NSW Planning Portal folder: ${c.portalFolder})\n${c.guidance}` : "";
    })
    .filter(Boolean)
    .join("\n\n");

  const expected = d.registerRegimes
    .map(k => {
      const r = register.regimes.find(x => x.key === k) as
        | { label: string; plans?: string[]; details?: string[]; schedules?: string[] }
        | undefined;
      if (!r) return "";
      const parts = [
        r.plans?.length ? `Plans: ${r.plans.join("; ")}` : "",
        r.details?.length ? `Details: ${r.details.join("; ")}` : "",
        r.schedules?.length ? `Schedules: ${r.schedules.join("; ")}` : "",
      ].filter(Boolean);
      return `### ${r.label}\n${parts.join("\n")}`;
    })
    .filter(Boolean)
    .join("\n\n");

  const prompt = `${AUDITOR_ROLE}

STAGE 2 — SPECIALIST PASS: ${d.label.toUpperCase()}

You are the ${d.label} specialist on this audit. Other specialists are auditing the other regimes in parallel; you are responsible ONLY for this one, and you are responsible for ALL of it. Do not defer anything in your regime to "the other consultant" — that deferral is exactly how real audit reports end up incomplete.

${projectHeader(config)}

AUTHORITATIVE REQUIREMENTS — Regulated Design Guidance Material, Appendix 1 of the Design Practitioners Handbook, approved by the Secretary under cl 9(1)(c) of the DBP Regulation 2021. A regulated design must accord with the relevant elements of this material.
${guidance}

DRAWING SERIES A COMPLETE SET IS EXPECTED TO CONTAIN FOR THIS REGIME:
${expected}

WHAT YOU MUST CHECK:
${d.focus.map(f => `· ${f}`).join("\n")}

HARD RULES — these are wrong more often than they are right:
${d.hardRules.map(r => `· ${r}`).join("\n")}

Work through the sheets. For each defect, name the sheet and the detail. If a required series above is absent from what you can see, raise it as a MISSING DESIGN finding with severity Critical (for a regulated building element) or Major (for a supporting schedule). Prefix each finding id with ${d.key.toUpperCase()}.

Record your answer with the record_pass tool.`;

  try {
    const result = await structured(
      anthropic,
      {
        name: "record_pass",
        description: `Record the ${d.label} specialist audit pass.`,
        schema: PASS_SCHEMA,
        prompt,
        files,
      },
      {
        seriesFound: [] as string[],
        seriesMissing: [] as string[],
        findings: [] as unknown[],
        positives: [] as string[],
      },
    );
    res.json({ discipline: d.key, ...result });
  } catch (err) {
    res
      .status(500)
      .json({ error: `Pass "${d.key}" failed`, message: (err as Error)?.message ?? String(err) });
  }
});

/* ────────────────────────────── POST /integrate ────────────────────────────── */

interface PassResult {
  discipline: string;
  seriesMissing?: string[];
  findings?: Array<{ severity?: string; finding?: string; drawing?: string }>;
}

router.post("/integrate", async (req: Request, res: Response) => {
  const anthropic = client();
  if (!anthropic) return res.status(503).json({ error: "ANTHROPIC_API_KEY not configured" });

  const { files, config = {}, gate } = req.body ?? {};
  const passes: PassResult[] = Array.isArray(req.body?.passes) ? req.body.passes : [];
  if (!Array.isArray(files) || !files.length)
    return res.status(400).json({ error: "No file ids — call /intake first" });

  const digest = passes
    .map(
      p =>
        `## ${p.discipline}\nmissing series: ${(p.seriesMissing || []).join("; ") || "none"}\n` +
        (p.findings || [])
          .map(f => `- [${f.severity}] ${f.finding} (${f.drawing || "?"})`)
          .join("\n"),
    )
    .join("\n\n");

  const prompt = `${AUDITOR_ROLE}

STAGE 3 — CROSS-DISCIPLINE INTEGRATION AND CLASH REVIEW.

Each regime has now been audited separately. Your job is the failure mode that single-discipline auditors structurally cannot catch: designs that are individually defensible but do not agree with each other.

The statutory hook is DBP Regulation cl 8 — a regulated design must, as far as is reasonably practicable, integrate details of (a) other aspects of the building work to which the design relates, and (b) other regulated designs for the work, including designs prepared by other registered design practitioners.

${projectHeader(config)}

COORDINATION EXPECTATIONS THE COMMISSION BENCHMARKS AGAINST:
${register.coordination.expectations.map(e => `· ${e}`).join("\n")}
Practical documentation floor: LOD 350 — "${register.coordination.lod["LOD 350"]}"

DECLARABILITY GATE RESULT: ${JSON.stringify(gate ?? {}, null, 1)}

FINDINGS FROM THE SPECIALIST PASSES:
${digest || "(none supplied)"}

Now look at the drawings again specifically for disagreement between disciplines. Known high-yield checks:
· FRLs on architectural GA plans vs the fire wall type plans vs the door and fire protection schedules
· Service penetrations on mechanical/hydraulic/electrical sets vs the structural penetration plans vs the fire penetration plans
· Balcony and roof falls and overflows on architectural vs structural (hobs, upstands, channels) vs hydraulic (outlets, overflow sizing)
· Reflected ceiling plans vs emergency lighting, exit signage, sprinkler heads, diffusers and detectors
· Wet area layouts vs floor waste positions vs the structural slab set-down
· Facade material schedule vs fire hazard property requirements vs the facade details
· Lift shaft and riser setout on architectural vs structural vs vertical transportation
· Cross-references between sheets: does each reference name a specific drawing number AND revision, and is the referenced revision the latest?
· Performance solutions: is the referenced revision current, and does every discipline that relies on it reference the same one?

Every finding you raise here has type "INTEGRATION" and names the disagreeing sets in "disciplines". Record your answer with the record_integration tool.`;

  try {
    const integration = await structured(
      anthropic,
      {
        name: "record_integration",
        description: "Record the cross-discipline integration and clash review.",
        schema: INTEGRATION_SCHEMA,
        prompt,
        files,
      },
      {
        findings: [] as Array<{ severity?: string }>,
        coordinationVerdict: "",
        executiveSummary: "",
        positives: [] as string[],
      },
    );

    // ── Deterministic roll-up: coverage and score are computed here, not guessed
    //    by the model, so two runs of the same set cannot disagree on the maths.
    const all = [
      ...passes.flatMap(p => p.findings ?? []),
      ...(integration.findings ?? []),
    ] as Array<{ severity?: string }>;
    const count = (s: string) => all.filter(f => (f.severity || "").toLowerCase() === s).length;
    const critical = count("critical");
    const major = count("major");
    const minor = count("minor");
    const score = Math.max(
      0,
      Math.min(100, Math.round(100 - critical * 12 - major * 5 - minor * 1.5)),
    );

    const audited = passes.map(p => p.discipline);
    const coverage = DISCIPLINES.map(d => ({
      key: d.key,
      label: d.label,
      audited: audited.includes(d.key),
      missingSeries: passes.find(p => p.discipline === d.key)?.seriesMissing?.length ?? null,
    }));

    res.json({
      ...integration,
      totals: { critical, major, minor, all: all.length },
      score,
      declarable: critical === 0 && gate?.declarable === true,
      coverage,
      coverageComplete: coverage.every(c => c.audited),
    });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Integration pass failed", message: (err as Error)?.message ?? String(err) });
  }
});

/* ───────────────────────── legacy single-shot endpoint ─────────────────────── */

function legacyPrompt(config: ProjectConfig): string {
  return `${AUDITOR_ROLE}

${projectHeader(config)}

Audit the uploaded drawings across ALL of these regimes in one pass — do not skip a regime because it is not your speciality:
${DISCIPLINES.map(d => `· ${d.label}`).join("\n")}

Return ONLY valid JSON:
{
  "overallCompliant": false,
  "complianceScore": 65,
  "titleBlockIssues": ["title block / CIRD problems"],
  "defects": [
    {
      "id": "D001",
      "category": "TITLE BLOCK|CIRD STATUS|DP REGISTRATION|NCC NON-COMPLIANCE|WATERPROOFING|FIRE PASSIVE|FIRE ACTIVE|PENETRATION SCHEDULE|STRUCTURAL|FACADE/CLADDING|COORDINATION|MISSING DRAWINGS|PORTAL COMPLIANCE",
      "severity": "Critical|Major|Minor",
      "description": "specific defect with clause reference",
      "location": "drawing area/level",
      "reference": "${config.nccVersion || "NCC 2022"} clause / AS clause / DBP Act s",
      "solution": "corrective action required",
      "discipline": "regime name"
    }
  ],
  "missingElements": ["required but absent"],
  "coordinationFlags": ["cross-discipline issues"],
  "positiveFindings": ["compliant aspects"]
}`;
}

router.post("/", upload.array("files", 20), async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[] | undefined;
  const anthropic = client();

  if (!anthropic) {
    cleanup(files);
    return res.status(503).json({
      error: "ANTHROPIC_API_KEY not configured",
      message:
        "Set ANTHROPIC_API_KEY environment variable to enable AI analysis. Using template-based analysis in the meantime.",
    });
  }
  if (!files?.length) return res.status(400).json({ error: "No files uploaded" });

  try {
    const config: ProjectConfig = JSON.parse(req.body.config || "{}");
    const content: Anthropic.Messages.ContentBlockParam[] = [
      { type: "text", text: legacyPrompt(config) },
    ];

    for (const file of files) {
      const base64 = fs.readFileSync(file.path).toString("base64");
      const ext = path.extname(file.originalname).toLowerCase();
      if (ext === ".pdf") {
        content.push({
          type: "document",
          source: { type: "base64", media_type: "application/pdf", data: base64 },
        });
      } else {
        content.push({
          type: "image",
          source: {
            type: "base64",
            media_type: ext === ".png" ? "image/png" : "image/jpeg",
            data: base64,
          },
        });
      }
    }

    const msg = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 8000,
      messages: [{ role: "user", content }],
    });
    const result = parseJSON(textOf(msg), {
      overallCompliant: false,
      complianceScore: 0,
      defects: [] as unknown[],
    });
    res.json({
      classCode: config.classCode,
      level: config.level,
      regime: config.regime,
      ...result,
    });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Analysis failed", message: (err as Error)?.message ?? String(err) });
  } finally {
    cleanup(files);
  }
});

export default router;
