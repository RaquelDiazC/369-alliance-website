/**
 * Course Review Platform — Supabase client.
 *
 * The URL/key below are the project's *publishable* credentials (safe to ship
 * to the browser); every read/write is enforced server-side by Row Level
 * Security. Override via VITE_REVIEW_SUPABASE_URL / VITE_REVIEW_SUPABASE_ANON_KEY
 * if the backend project ever changes.
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  import.meta.env.VITE_REVIEW_SUPABASE_URL || "https://iknjmeatyxzrwtejbwvm.supabase.co";

const SUPABASE_ANON_KEY =
  import.meta.env.VITE_REVIEW_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrbmptZWF0eXh6cnd0ZWpid3ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczNjM1MjMsImV4cCI6MjEwMjkzOTUyM30.uLKlCgiNNibi6HN6SCTaO5U17oNtxiGs0hpdcLbG5PY";

export const reviewDb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // Keep this tool's session separate from anything else on the site.
    storageKey: "369-review-auth",
    persistSession: true,
    autoRefreshToken: true,
  },
});

export const REVIEW_BUCKET = "course-review-pdfs";
