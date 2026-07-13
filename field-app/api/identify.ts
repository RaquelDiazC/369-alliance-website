import { IDENTIFY_MODEL, IDENTIFY_SYSTEM, LIBRARY, anthropicOrNull, clamp01, gate, parseModelJson, readBody, stripDataUrl } from "./_lib";

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
    const findings = (Array.isArray(parsed?.findings) ? parsed.findings : [])
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
        };
      });
    return res.status(200).json({ observation: String(parsed?.observation || "").slice(0, 400), findings });
  } catch (err: any) {
    return res.status(502).json({ error: "identify failed", message: err.message });
  }
}
