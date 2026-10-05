// A browser identifier, not a hardware fingerprint. Preserve existing IDs.
const DEVICE_KEY = "369-review-device-id";
let memoryDeviceId: string | null = null;

export function getOrCreateDeviceId(): string {
  let stored: string | null = null;
  try { stored = localStorage.getItem(DEVICE_KEY); } catch { /* storage blocked */ }
  let cookie: string | null = null;
  try {
    cookie = document.cookie.split("; ").find((item) => item.startsWith(`${DEVICE_KEY}=`))?.slice(DEVICE_KEY.length + 1) || null;
    if (cookie) cookie = decodeURIComponent(cookie);
  } catch { /* cookies blocked */ }
  const id = stored || cookie || memoryDeviceId || crypto.randomUUID();
  memoryDeviceId = id;
  try { localStorage.setItem(DEVICE_KEY, id); } catch { /* cookie is the backup */ }
  try {
    document.cookie = `${DEVICE_KEY}=${encodeURIComponent(id)}; Path=/review; Max-Age=31536000; SameSite=Strict${location.protocol === "https:" ? "; Secure" : ""}`;
  } catch { /* keep the ID stable in memory if both stores are blocked */ }
  return id;
}
