/** Browser proof must only be reconciled after the server accepts it. */
const DEVICE_KEY = "369-review-device-id";
const DATABASE = "369-review-device";
const STORE = "identity";
let memoryDeviceId: string | null = null;
let pendingCandidate: string | null = null;
const validId = (value: unknown): value is string =>
  typeof value === "string" && /^[A-Za-z0-9-]{1,100}$/.test(value);

function localId(): string | null {
  try {
    const value = localStorage.getItem(DEVICE_KEY);
    return validId(value) ? value : null;
  } catch {
    return null;
  }
}
function cookieId(): string | null {
  try {
    const entry = document.cookie
      .split(";")
      .map(value => value.trim())
      .find(value => value.startsWith(`${DEVICE_KEY}=`));
    const value = entry
      ? decodeURIComponent(entry.slice(DEVICE_KEY.length + 1))
      : null;
    return validId(value) ? value : null;
  } catch {
    return null;
  }
}

// IndexedDB provides a third copy if a browser/extension removes only one store.
// A blocked database must never leave sign-in waiting indefinitely.
function databaseId(write?: string): Promise<string | null> {
  return new Promise(resolve => {
    let db: IDBDatabase | undefined;
    let transaction: IDBTransaction | undefined;
    let done = false;
    const finish = (value: string | null) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      db?.close();
      resolve(value);
    };
    const timer = setTimeout(() => {
      try {
        transaction?.abort();
      } catch {
        /* transaction already finished */
      }
      finish(null);
    }, 1500);
    try {
      const open = indexedDB.open(DATABASE, 1);
      open.onupgradeneeded = () => {
        if (!open.result.objectStoreNames.contains(STORE))
          open.result.createObjectStore(STORE);
      };
      open.onerror = open.onblocked = () => finish(null);
      open.onsuccess = () => {
        db = open.result;
        if (done) {
          db.close();
          return;
        }
        try {
          transaction = db.transaction(STORE, write ? "readwrite" : "readonly");
          const store = transaction.objectStore(STORE);
          const request = write
            ? store.put(write, DEVICE_KEY)
            : store.get(DEVICE_KEY);
          let value: string | null = null;
          request.onsuccess = () => {
            value = write || (validId(request.result) ? request.result : null);
          };
          transaction.oncomplete = () => finish(value);
          transaction.onerror = transaction.onabort = () => finish(null);
        } catch {
          finish(null);
        }
      };
    } catch {
      finish(null);
    }
  });
}

/** Read all proofs before writing anything; a stale store must not erase a good backup. */
export async function getDeviceCandidates(): Promise<string[]> {
  const candidates = [
    localId(),
    cookieId(),
    await databaseId(),
    memoryDeviceId,
  ].filter(validId);
  if (candidates.length) return Array.from(new Set(candidates));
  pendingCandidate ??= crypto.randomUUID();
  // Do not bind an ephemeral identifier that will disappear after a reload.
  const saved = await persistDeviceId(pendingCandidate);
  if (!saved)
    throw new Error(
      "Allow this website to save browser data, then try again. Avoid private browsing for course review."
    );
  return [pendingCandidate];
}

export async function persistDeviceId(id: string): Promise<boolean> {
  if (!validId(id)) throw new Error("Invalid browser identifier.");
  let saved = false;
  try {
    localStorage.setItem(DEVICE_KEY, id);
    saved = localStorage.getItem(DEVICE_KEY) === id;
  } catch {
    /* try independent backups */
  }
  try {
    document.cookie = `${DEVICE_KEY}=${encodeURIComponent(id)}; Path=/review; Max-Age=31536000; SameSite=Strict${location.protocol === "https:" ? "; Secure" : ""}`;
    saved = cookieId() === id || saved;
  } catch {
    /* try IndexedDB */
  }
  saved = (await databaseId(id)) === id || saved;
  if (saved) memoryDeviceId = id;
  return saved;
}
