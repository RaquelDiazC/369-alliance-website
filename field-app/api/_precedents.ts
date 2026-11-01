/**
 * The regulator's own photographs of each defect code, as visual precedents.
 *
 * api/_examples holds up to three photographs per library code, taken from
 * the Department's RAB Act audit reports and labelled by the auditor's
 * caption (written there by the Design Intelligence script
 * scripts/site-controls/field_precedents.py). The folder is git-ignored and
 * shipped with the functions through vercel.json `includeFiles`; it is read
 * here, on the server, and never served to the browser as a file.
 */
import fs from "fs";
import path from "path";

export interface Precedent {
  code: string;
  caption: string;
  regime: string;
  severity: string | null;
  /** base64 JPEG, 512 px on its long side */
  image: string;
}

const DIR = path.join(process.cwd(), "api", "_examples");
let index: Record<string, { file: string; caption: string; regime: string; severity: string | null }[]> | null = null;

function load() {
  if (index) return index;
  try {
    index = JSON.parse(fs.readFileSync(path.join(DIR, "index.json"), "utf8"));
  } catch {
    index = {};
  }
  return index!;
}

/** Up to `max` precedents for a code, best first; none when the code has no photograph. */
export function precedentsFor(code: string, max = 2): Precedent[] {
  const list = load()[code] ?? [];
  const out: Precedent[] = [];
  for (const p of list.slice(0, max)) {
    try {
      out.push({ code, caption: p.caption, regime: p.regime, severity: p.severity, image: fs.readFileSync(path.join(DIR, p.file)).toString("base64") });
    } catch {
      /* a missing file is skipped, not guessed */
    }
  }
  return out;
}

export function precedentCount(): number {
  return Object.values(load()).reduce((n, l) => n + l.length, 0);
}
