/**
 * Billing security checks — the two guards that are easy to regress silently.
 *
 *   node scripts/check-billing-guards.mjs
 *
 * 1. Staff auth. Every /api/* path is public on this deployment (vercel.json
 *    rewrites them all to one function), so /api/billing and /api/checkout
 *    must demand a staff token, fail CLOSED when STAFF_API_TOKEN is unset, and
 *    still let the public view_token links through.
 * 2. Return-URL validation. successPath / cancelPath come from the request and
 *    end up in front of someone who has just paid us, so they must resolve
 *    back onto our own origin. A bare "@evil.test" or ".evil.test" appended to
 *    an origin lands on the attacker's host.
 *
 * No test runner in this repo, so this is a plain script: it bundles the two
 * modules with the esbuild that is already a dependency, exercises them over a
 * real socket, and exits non-zero on any failure.
 */
import { build } from "esbuild";
import { mkdirSync, rmSync } from "fs";
import { fileURLToPath, pathToFileURL } from "url";
import path from "path";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// Inside node_modules so the bundle resolves its external packages, and so it
// is never committed.
const outDir = path.join(repoRoot, "node_modules", ".cache", "billing-guards");

mkdirSync(outDir, { recursive: true });
await build({
  absWorkingDir: repoRoot,
  entryPoints: ["server/app.ts", "server/lib/public-url.ts"],
  outdir: outDir,
  outbase: ".",
  platform: "node",
  format: "esm",
  bundle: true,
  packages: "external",
  logLevel: "error",
});
// Dynamic import of an absolute path needs a file:// URL on Windows.
const bundled = name => pathToFileURL(path.join(outDir, name)).href;

const { createApp } = await import(bundled("server/app.js"));
const { safeReturnUrl } = await import(bundled("server/lib/public-url.js"));

const TOKEN = "check-staff-token-abc123";
let failures = 0;

function report(ok, label, detail) {
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label.padEnd(48)} ${detail}`);
}

// ------------------------------------------------------------- staff guard

async function request(env, pathname, headers) {
  delete process.env.STAFF_API_TOKEN;
  Object.assign(process.env, env);
  const app = createApp();
  const server = app.listen(0);
  await new Promise(resolve => server.once("listening", resolve));
  const { port } = server.address();
  const res = await fetch(`http://127.0.0.1:${port}${pathname}`, { headers });
  const body = await res.json().catch(() => ({}));
  await new Promise(resolve => server.close(resolve));
  return { status: res.status, body };
}

const withToken = { STAFF_API_TOKEN: TOKEN };

console.log("staff guard");
{
  const r = await request({}, "/api/billing/products", {});
  report(
    r.status === 503 && /STAFF_API_TOKEN/.test(r.body.error ?? ""),
    "unset STAFF_API_TOKEN fails closed",
    `${r.status} ${r.body.error ?? ""}`,
  );
}
for (const [label, headers] of [
  ["no token", {}],
  ["wrong token", { "x-staff-token": "wrong-token-same-length!" }],
]) {
  for (const pathname of [
    "/api/billing/products",
    "/api/billing/clients",
    "/api/billing/invoices",
    "/api/billing/proposals",
    "/api/checkout/config",
  ]) {
    const r = await request(withToken, pathname, headers);
    report(r.status === 401, `${label}: ${pathname}`, String(r.status));
  }
}
for (const [label, headers] of [
  ["x-staff-token header", { "x-staff-token": TOKEN }],
  ["Authorization Bearer", { authorization: `Bearer ${TOKEN}` }],
]) {
  const r = await request(withToken, "/api/billing/products", headers);
  report(
    r.status === 200 && Array.isArray(r.body.products),
    `correct token via ${label}`,
    `${r.status} ${r.body.products?.length ?? 0} products`,
  );
}
{
  // Reaching the route and complaining about SUPABASE_* proves the guard let
  // it past; a 401 here would mean public links are broken.
  const r = await request(
    withToken,
    "/api/billing/public/proposal/11111111-1111-1111-1111-111111111111",
    {},
  );
  report(
    r.status !== 401 && /SUPABASE/.test(r.body.error ?? ""),
    "public token link bypasses the guard",
    `${r.status} ${r.body.error ?? ""}`,
  );
}

// -------------------------------------------------------------- return URLs

console.log("\nreturn-url validation");
const ORIGIN = "https://369-alliance.example";
const urlCases = [
  ["@evil.example", null],
  [".evil.example", null],
  ["//evil.example/pay", null],
  ["https://evil.example/pay", null],
  ["\\\\evil.example/pay", null],
  ["/\\evil.example", null],
  ["javascript:alert(1)", null],
  ["billing/paid", null],
  ["", null],
  ["/billing/paid", "369-alliance.example"],
  ["/billing/paid?ref=abc", "369-alliance.example"],
  ["/portal/invoices/369-00001", "369-alliance.example"],
];
for (const [input, expectedHost] of urlCases) {
  const got = safeReturnUrl(ORIGIN, input);
  const host = got === null ? null : new URL(got).host;
  report(
    host === expectedHost,
    `${JSON.stringify(input)}`,
    got === null ? "rejected" : `${host}`,
  );
}

rmSync(outDir, { recursive: true, force: true });
console.log(`\n${failures === 0 ? "all billing guard checks pass" : `${failures} CHECK(S) FAILED`}`);
process.exitCode = failures === 0 ? 0 : 1;
