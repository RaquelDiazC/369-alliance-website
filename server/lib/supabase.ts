/**
 * Server-side Supabase client (service role).
 *
 * The service-role key bypasses RLS, so this module must never be imported
 * from client code — every billing table is deny-all under RLS by design and
 * all reads/writes go through the Express routes. Keep SUPABASE_SERVICE_ROLE_KEY
 * out of anything prefixed VITE_.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

/** Whether the billing routes can talk to a database at all. */
export function isBillingConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * The shared service-role client, or null when the env vars are absent — the
 * routes turn that into a 503 rather than throwing at import time, so the rest
 * of the API keeps working on a machine with no billing credentials.
 */
export function getSupabase(): SupabaseClient | null {
  if (cached) return cached;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
