import { IDENTIFY_MODEL, IDENTIFY_SYSTEM, LIBRARY, anthropicOrNull, clamp01, gate, parseModelJson, readBody, stripDataUrl } from "./_lib";
import { precedentsFor, type Precedent } from "./_precedents";

const COMPARE_SYSTEM = `You are an expert NSW site inspector checking a classification against the regulator's own evidence.
You get ONE photo taken by the inspector, then, for each candidate defect code, photographs the NSW Building Commission auditors took of that same defect on audited buildings, each with the auditor's caption.
For each candidate, judge whether the inspector's photo shows the SAME defect as the precedents (same element and same failure), not merely the same kind of place.
Reply with ONLY this JSON (no markdown):
{"ranking":[{"id":"W1.3","match":"same|similar|different","note":"one sentence: what matches or differs"}]}
- Keep every candidate id, best match first.
- "same": the visible failure is the one the precedents show. "similar": same element, the failure is not clearly visible. "different": another element or another failure.`;

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  if (gate(req, res)) return;
  const client = anthropicOrNull();
  if (!client) return res.status(503).json({ error: "ANTHROPIC_API_KEY not configured" });

  const body = readBody(req);
  const image = stripDataUrl(String(body.image || ""));
  if (!image) return res.status(400).json({ error: "image (base64 jpeg) required" });
  const hintIds = (Array.isArray(body.hintIds) ? body.hintIds : [])
    .filter((id: unknown): id is string => typeof id === "string" && !!LIBRARY[id])
    .slice(0, 3);

  try {
    const message = await client.messages.create({
      model: IDENTIFY_MODEL,
      max_tokens: 1200,
      system: [{ type: "text", text: IDENTIFY_SYSTEM, cache_control: { type: "ephemeral" } }],
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: "image/jpeg", data: image } },
            {
              type: "text",
              text: hintIds.length
                ? `Photo taken by the inspector. Live scan suggested: ${hintIds.join(", ")} — verify, do not blindly accept. JSON only.`
                : "Photo taken by the inspector. JSON only.",
            },
          ],
        },
      ],
    });
    const text = message.content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("");
    const parsed = parseModelJson(text);
    let findings = (Array.isArray(parsed?.findings) ? parsed.findings : [])
      .filter((f: any) => f && typeof f.id === "string" && LIBRARY[f.id])
      .slice(0, 3)
      .map((f: any) => {
        const e = LIBRARY[f.id];
        return {
          id: e.id,
          regime: e.rg,
          subcategory: e.sub,
          description: e.d,
          status: e.st,
          ncc2022Refs: e.c22,
          ncc2019Refs: e.c19,
          pathway: e.pw,
          scopePreview: e.sw,
          cx: clamp01(f.cx, 0.5),
          cy: clamp01(f.cy, 0.5),
          r: Math.min(0.45, Math.max(0.04, clamp01(f.r, 0.15))),
          confidence: ["high", "medium", "low"].includes(f.confidence) ? f.confidence : "low",
          note: String(f.note || "").slice(0, 300),
          precedent: null as null | { caption: string; severity: string | null; image: string; match: string; note: string },
        };
      });

    // Second look: the candidates the regulator has photographed are compared
    // with those photographs. A candidate the precedents contradict drops to
    // low confidence and to the end; the one they confirm comes first.
    const withPrecedents = findings.map((f: any) => ({ f, p: precedentsFor(f.id, 2) })).filter((x: any) => x.p.length);
    if (withPrecedents.length) {
      const content: any[] = [
        { type: "text", text: "Inspector's photo:" },
        { type: "image", source: { type: "base64", media_type: "image/jpeg", data: image } },
      ];
      for (const { f, p } of withPrecedents as { f: any; p: Precedent[] }[]) {
        content.push({ type: "text", text: `Candidate ${f.id} — ${f.description}. Regulator's photographs of this defect:` });
        p.forEach((x, i) => {
          content.push({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: x.image } });
          content.push({ type: "text", text: `(${f.id} precedent ${i + 1}) auditor's caption: ${x.caption}` });
        });
      }
      content.push({ type: "text", text: "Compare and rank. JSON only." });
      try {
        const cmp = await client.messages.create({ model: IDENTIFY_MODEL, max_tokens: 600, system: COMPARE_SYSTEM, messages: [{ role: "user", content }] });
        const ctext = cmp.content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("");
        const ranking: { id: string; match: string; note: string }[] = Array.isArray(parseModelJson(ctext)?.ranking) ? parseModelJson(ctext).ranking : [];
        const order = new Map(ranking.map((r, i) => [r.id, i]));
        for (const { f, p } of withPrecedents as { f: any; p: Precedent[] }[]) {
          const r = ranking.find(x => x.id === f.id);
          const match = r && ["same", "similar", "different"].includes(r.match) ? r.match : "similar";
          f.precedent = { caption: p[0].caption, severity: p[0].severity, image: p[0].image, match, note: String(r?.note || "").slice(0, 200) };
          if (match === "different") f.confidence = "low";
          if (match === "same" && f.confidence === "low") f.confidence = "medium";
        }
        const weight = (f: any) => (f.precedent?.match === "different" ? 2 : 0) + (order.has(f.id) ? order.get(f.id)! / 10 : 1);
        findings = [...findings].sort((a: any, b: any) => weight(a) - weight(b));
      } catch {
        /* the first reading stands when the comparison fails */
      }
    }
    return res.status(200).json({ observation: String(parsed?.observation || "").slice(0, 400), findings });
  } catch (err: any) {
    return res.status(502).json({ error: "identify failed", message: err.message });
  }
}
