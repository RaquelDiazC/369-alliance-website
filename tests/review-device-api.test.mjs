import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function edge({
  device = "registered",
  authenticated = true,
  isAdmin = false,
  registered = true,
  dbError = false,
} = {}) {
  let handler,
    saved = device,
    writes = 0;
  const email = "reviewer@example.test";
  const client = {
    auth: {
      getUser: async token => ({
        data: {
          user: authenticated && token === "test-jwt" ? { email } : null,
        },
        error: authenticated ? null : Error("invalid token"),
      }),
    },
    from(table) {
      let update,
        onlyNull = false;
      const query = {
        select() {
          return query;
        },
        eq(column, value) {
          assert.equal(column, "email");
          assert.equal(value, email);
          return query;
        },
        ilike(column, value) {
          assert.equal(column, "email");
          assert.equal(value, email);
          return query;
        },
        is(column, value) {
          assert.equal(column, "device_id");
          assert.equal(value, null);
          onlyNull = true;
          return query;
        },
        update(values) {
          update = values;
          return query;
        },
        async maybeSingle() {
          if (table === "review_admins")
            return { data: isAdmin ? { email } : null, error: null };
          assert.equal(table, "review_reviewers");
          if (dbError)
            return { data: null, error: Error("database unavailable") };
          if (!registered) return { data: null, error: null };
          if (update) {
            assert.equal(onlyNull, true, "binding changes must be conditional");
            if (saved !== null) return { data: null, error: null };
            saved = update.device_id;
            writes++;
          }
          return { data: { device_id: saved }, error: null };
        },
      };
      return query;
    },
  };
  const source = fs.readFileSync(
    new URL("../supabase/functions/review-admin/index.ts", import.meta.url),
    "utf8"
  );
  const code = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  vm.runInNewContext(code, {
    exports: {},
    Request,
    Response,
    crypto,
    Deno: {
      env: { get: () => "test-only" },
      serve: fn => {
        handler = fn;
      },
    },
    require: name => {
      assert.equal(name, "npm:@supabase/supabase-js@2");
      return { createClient: () => client };
    },
  });
  return {
    saved: () => saved,
    writes: () => writes,
    request: (body, token = "test-jwt") =>
      handler(
        new Request("https://example.test/review-admin", {
          method: "POST",
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              }
            : {},
          body: JSON.stringify(body),
        })
      ),
  };
}

test("the previously registered browser remains accepted", async () => {
  const e = edge();
  const response = await e.request({
    action: "register_device",
    deviceId: "registered",
  });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).locked, false);
  assert.equal(e.writes(), 0);
});
test("a valid surviving backup repairs a stale local identifier", async () => {
  const e = edge();
  const response = await e.request({
    action: "register_device",
    deviceId: "stale",
    deviceIds: ["stale", "registered"],
  });
  const data = await response.json();
  assert.equal(data.locked, false);
  assert.equal(data.deviceId, "registered");
  assert.equal(e.writes(), 0);
});
test("a different computer stays blocked and does not receive the stored proof", async () => {
  const e = edge();
  const response = await e.request({
    action: "register_device",
    deviceId: "other-computer",
  });
  assert.deepEqual(await response.json(), { ok: false, locked: true });
  assert.equal(e.saved(), "registered");
  assert.equal(e.writes(), 0);
});
test("two simultaneous registrations can only authorise one browser", async () => {
  const e = edge({ device: null });
  const responses = await Promise.all(
    ["browser-a", "browser-b"].map(deviceId =>
      e.request({ action: "register_device", deviceId })
    )
  );
  const bodies = await Promise.all(responses.map(r => r.json()));
  assert.equal(bodies.filter(body => body.ok).length, 1);
  assert.equal(bodies.filter(body => body.locked).length, 1);
  assert.equal(e.writes(), 1);
});
test("simultaneous requests from the same browser remain accepted", async () => {
  const e = edge({ device: null });
  const responses = await Promise.all(
    [1, 2].map(() =>
      e.request({ action: "register_device", deviceId: "same-browser" })
    )
  );
  const bodies = await Promise.all(responses.map(r => r.json()));
  assert.ok(bodies.every(body => body.ok));
  assert.equal(e.writes(), 1);
});
test("missing or expired credentials stay rejected", async () => {
  assert.equal(
    (
      await edge().request(
        { action: "register_device", deviceId: "registered" },
        ""
      )
    ).status,
    401
  );
  assert.equal(
    (
      await edge({ authenticated: false }).request({
        action: "register_device",
        deviceId: "registered",
      })
    ).status,
    401
  );
});
test("uninvited accounts stay rejected", async () => {
  assert.equal(
    (
      await edge({ registered: false }).request({
        action: "register_device",
        deviceId: "registered",
      })
    ).status,
    403
  );
});
test("a reviewer cannot reset another account or unlock itself", async () => {
  for (const action of [
    "unlock_device",
    "upsert_reviewer",
    "reset_code",
    "remove_reviewer",
  ]) {
    assert.equal(
      (await edge().request({ action, email: "someone-else@example.test" }))
        .status,
      403
    );
  }
});
test("a database outage is an error, never a successful registration or false lock", async () => {
  const response = await edge({ dbError: true }).request({
    action: "register_device",
    deviceId: "registered",
  });
  assert.equal(response.status, 500);
  const body = await response.json();
  assert.equal(body.ok, undefined);
  assert.equal(body.locked, undefined);
});
test("malformed or excessive candidates are rejected", async () => {
  const e = edge();
  assert.equal(
    (await e.request({ action: "register_device", deviceId: "" })).status,
    400
  );
  assert.equal(
    (
      await e.request({
        action: "register_device",
        deviceId: "valid",
        deviceIds: ["1", "2", "3", "4", "5"],
      })
    ).status,
    400
  );
});
