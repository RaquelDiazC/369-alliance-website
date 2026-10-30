/**
 * The absolute origin used in proposal/invoice links and Stripe return URLs.
 *
 * `Host` and `X-Forwarded-Proto` are attacker-controlled, and these links go
 * out by email and are where a payer lands after paying, so in production the
 * origin must come from configuration: PUBLIC_BASE_URL. Outside production we
 * fall back to the request host so local development needs no setup.
 */
import type { Request } from "express";

/** Configured origin, no trailing slash, or null when it must be configured. */
export function resolvePublicBaseUrl(req: Request): string | null {
  const configured = process.env.PUBLIC_BASE_URL;
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      return null;
    }
  }
  if (process.env.NODE_ENV === "production") return null;
  const proto = (req.headers["x-forwarded-proto"] as string) || req.protocol || "http";
  const host = req.headers.host;
  if (!host) return null;
  try {
    return new URL(`${proto}://${host}`).origin;
  } catch {
    return null;
  }
}

export const PUBLIC_BASE_URL_ERROR =
  "PUBLIC_BASE_URL not configured — required in production so emailed links and payment redirects cannot be set by the request";

/**
 * Resolve a caller-supplied return path against our own origin.
 *
 * Returns null for anything that would leave the origin. A bare `@evil.test`
 * or `.evil.test` concatenated onto an origin lands on the attacker's host, so
 * the path must be site-relative (one leading slash, not two, not a
 * backslash) AND the resolved URL must still be on our origin.
 */
export function safeReturnUrl(origin: string, path: string): string | null {
  if (!/^\/(?![/\\])/.test(path)) return null;
  let url: URL;
  try {
    url = new URL(path, origin);
  } catch {
    return null;
  }
  if (url.origin !== origin) return null;
  return url.toString();
}
