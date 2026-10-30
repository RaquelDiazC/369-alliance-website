import { test } from "node:test";
import assert from "node:assert/strict";

async function browser({
  local = null,
  cookie = "",
  db = null,
  blockLocal = false,
  blockCookie = false,
  blockDb = false,
} = {}) {
  let saved = local,
    databaseValue = db;
  const jar = new Map(cookie ? [["369-review-device-id", cookie]] : []);
  globalThis.localStorage = {
    getItem() {
      if (blockLocal) throw Error("blocked");
      return saved;
    },
    setItem(_key, value) {
      if (blockLocal) throw Error("blocked");
      saved = value;
    },
  };
  globalThis.document = {
    get cookie() {
      if (blockCookie) throw Error("blocked");
      return [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
    },
    set cookie(value) {
      if (!blockCookie) {
        const [k, v] = value.split(";")[0].split("=");
        jar.set(k, v);
      }
    },
  };
  globalThis.location = { protocol: "https:" };
  globalThis.indexedDB = {
    open() {
      if (blockDb) throw Error("blocked");
      const request = {};
      queueMicrotask(() => {
        request.result = {
          close() {},
          transaction() {
            const transaction = {
              objectStore() {
                const operation = (value, write) => {
                  const result = {};
                  queueMicrotask(() => {
                    if (write) databaseValue = value;
                    result.result = databaseValue;
                    result.onsuccess?.();
                    transaction.oncomplete?.();
                  });
                  return result;
                };
                return {
                  get: () => operation(null, false),
                  put: value => operation(value, true),
                };
              },
              abort() {
                transaction.onabort?.();
              },
            };
            return transaction;
          },
        };
        request.onsuccess?.();
      });
      return request;
    },
  };
  const methods = await import(
    `../client/src/lib/review/device.ts?test=${Math.random()}`
  );
  return { ...methods, saved: () => saved, db: () => databaseValue, jar };
}

test("conflicting copies are preserved until the server accepts a proof", async () => {
  const b = await browser({
    local: "stale",
    cookie: "registered",
    db: "registered",
  });
  assert.deepEqual(await b.getDeviceCandidates(), ["stale", "registered"]);
  assert.equal(b.jar.get("369-review-device-id"), "registered");
  assert.equal(b.saved(), "stale");
  assert.equal(await b.persistDeviceId("registered"), true);
  assert.equal(b.saved(), "registered");
  assert.equal(b.db(), "registered");
});
test("cookie survives loss of local storage", async () => {
  const b = await browser({ cookie: "registered" });
  assert.deepEqual(await b.getDeviceCandidates(), ["registered"]);
});
test("IndexedDB survives loss of both local storage and cookie", async () => {
  const b = await browser({ db: "registered" });
  assert.deepEqual(await b.getDeviceCandidates(), ["registered"]);
});
test("cookies alone keep the same identity over reloads", async () => {
  const first = await browser({ blockLocal: true, blockDb: true });
  const [id] = await first.getDeviceCandidates();
  const second = await browser({ cookie: id, blockLocal: true, blockDb: true });
  assert.deepEqual(await second.getDeviceCandidates(), [id]);
});
test("fresh browser saves proof before registering it", async () => {
  const b = await browser();
  const [id] = await b.getDeviceCandidates();
  assert.match(id, /^[0-9a-f-]{36}$/);
  assert.equal(b.saved(), id);
  assert.equal(b.db(), id);
  assert.deepEqual(await b.getDeviceCandidates(), [id]);
});
test("blocking every store does not create an ephemeral server binding", async () => {
  const b = await browser({
    blockLocal: true,
    blockCookie: true,
    blockDb: true,
  });
  await assert.rejects(b.getDeviceCandidates(), /Allow this website/);
});
test("malformed cookie does not crash access or overwrite a valid local copy", async () => {
  const b = await browser({ local: "registered", cookie: "%broken" });
  assert.deepEqual(await b.getDeviceCandidates(), ["registered"]);
});
