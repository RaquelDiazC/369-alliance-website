/**
 * Live knowledge from the 369 Design Intelligence hub — councils and their
 * digitised controls, state codes, the NCC edition in force, source changes
 * seen on the web, the Australian Standards library. The Brain asks the hub
 * for a context block per question (4 s budget; the Brain answers from its
 * own packs when the hub is offline) and reports the hub in /status.
 *
 *   BRAIN_FEED_URL   base URL of the hub (default http://localhost:3100)
 */
const BASE = () => (process.env.BRAIN_FEED_URL || "http://localhost:3100").replace(/\/+$/, "");

export interface LiveFeed {
  ok: boolean;
  url: string;
  generatedAt?: string;
  councils?: { total: number; byState: Record<string, number>; withDocuments: number; digitised: { lga: string; state: string; instrument: string; records: number }[] };
  ncc?: { currentByState: Record<string, string | null> };
  sources?: { watched: number; lastChecked?: string; alerts: { key: string; status: string; detail?: string }[] };
  standards?: { library: number; checked: number; outdated: string[]; fullText?: { files: number; pages: number } };
  stateCodes?: Record<string, { instrument?: string; records: number; tests: number }>;
  error?: string;
}

let cache: { at: number; feed: LiveFeed } | null = null;
const TTL = 10 * 60 * 1000;

export async function liveFeed(): Promise<LiveFeed> {
  if (cache && Date.now() - cache.at < TTL) return cache.feed;
  const url = `${BASE()}/api/brain/feed`;
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j = (await r.json()) as Omit<LiveFeed, "ok" | "url">;
    cache = { at: Date.now(), feed: { ok: true, url: BASE(), ...j } };
  } catch (err) {
    cache = { at: Date.now(), feed: { ok: false, url: BASE(), error: (err as Error).message } };
  }
  return cache.feed;
}

/** The context block for one question (empty string when the hub is offline). */
export async function liveContext(question: string, state: string, lga?: string): Promise<string> {
  try {
    const q = new URLSearchParams({ q: question, state });
    if (lga) q.set("lga", lga);
    const r = await fetch(`${BASE()}/api/brain/context?${q}`, { signal: AbortSignal.timeout(4000) });
    if (!r.ok) return "";
    const j = (await r.json()) as { text?: string };
    return j.text ?? "";
  } catch {
    return "";
  }
}
