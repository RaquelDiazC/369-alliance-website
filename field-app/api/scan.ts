import { LIBRARY, SCAN_MODEL, SCAN_SYSTEM, anthropicOrNull, clamp01, gate, parseModelJson, readBody, stripDataUrl } from "./_lib";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  if (gate(req, res)) return;
  const client = anthropicOrNull();
  if (!client) return res.status(503).json({ error: "ANTHROPIC_API_KEY not configured" });

  const image = stripDataUrl(String(readBody(req).image || ""));
  if (!image) return res.status(400).json({ error: "image (base64 jpeg) required" });

  try {
    const message = await client.messages.create({
      model: SCAN_MODEL,
      max_tokens: 300,
      system: [{ type: "text", text: SCAN_SYSTEM, cache_control: { type: "ephemeral" } }],
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: "image/jpeg", data: image } },
            { type: "text", text: "Scan this frame. JSON only." },
          ],
        },
      ],
    });
    const text = message.content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("");
    const parsed = parseModelJson(text);
    const detections = (Array.isArray(parsed?.detections) ? parsed.detections : [])
      .filter((d: any) => d && typeof d.id === "string" && LIBRARY[d.id])
      .slice(0, 2)
      .map((d: any) => ({
        id: d.id,
        label: String(d.label || LIBRARY[d.id].d || d.id).slice(0, 80),
        regime: LIBRARY[d.id].rg,
        cx: clamp01(d.cx, 0.5),
        cy: clamp01(d.cy, 0.5),
        r: Math.min(0.45, Math.max(0.04, clamp01(d.r, 0.12))),
        confidence: d.confidence === "high" ? "high" : "medium",
      }));
    return res.status(200).json({ detections });
  } catch (err: any) {
    return res.status(502).json({ error: "scan failed", message: err.message });
  }
}
