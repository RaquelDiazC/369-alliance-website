/**
 * Staff authentication for the billing API.
 *
 * vercel.json rewrites every `/api/(.*)` to the single serverless function, so
 * anything mounted on the Express app is reachable from the internet. The
 * billing staff routes read and write client records, invoices and payments,
 * so they need a guard of their own — there is no portal in front of the
 * Express app to inherit one from.
 *
 * Shared-secret in a header, compared in constant time. Deliberately
 * fail-closed: with no STAFF_API_TOKEN set the routes answer 503, never open.
 * Swap this for Supabase Auth JWT verification when staff sign-in exists; the
 * mount points stay the same.
 *
 * Exempt by design: `/api/billing/public/*` (unguessable view_token, minimal
 * fields) and `/api/stripe/webhook` (Stripe signature).
 */
import { createHash, timingSafeEqual } from "crypto";
import type { NextFunction, Request, Response } from "express";

/** Hash both sides so the comparison is constant time AND constant length. */
function digest(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
}

function presentedToken(req: Request): string | null {
  const header = req.headers["x-staff-token"];
  if (typeof header === "string" && header.length > 0) return header;
  const auth = req.headers.authorization;
  if (typeof auth === "string" && auth.startsWith("Bearer ")) return auth.slice(7);
  return null;
}

export function isStaffAuthConfigured(): boolean {
  return Boolean(process.env.STAFF_API_TOKEN);
}

/**
 * Require a valid staff token. 503 when unconfigured (fail closed), 401 when
 * absent or wrong — never a hint about which.
 */
export function requireStaff(req: Request, res: Response, next: NextFunction): void {
  const expected = process.env.STAFF_API_TOKEN;
  if (!expected) {
    res.status(503).json({ error: "STAFF_API_TOKEN not configured — billing API is closed" });
    return;
  }
  const presented = presentedToken(req);
  if (!presented || !timingSafeEqual(digest(presented), digest(expected))) {
    res.status(401).json({ error: "staff authentication required" });
    return;
  }
  next();
}
