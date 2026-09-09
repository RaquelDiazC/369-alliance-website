/**
 * Course Review Platform — typed data access.
 *
 * All queries run under the signed-in user's JWT; RLS decides what each row
 * returns (a reviewer only ever receives their own comments, the admin
 * receives everything), so the same functions serve both roles.
 */
import { FunctionsHttpError } from "@supabase/supabase-js";
import { REVIEW_BUCKET, reviewDb } from "./supabase";

/* ────────────────────────────── types ────────────────────────────── */

export interface ReviewCourse {
  id: string;
  name: string;
  position: number;
  created_at: string;
}

export type ReviewFileKind = "pdf" | "video";

export interface ReviewFile {
  id: string;
  course_id: string;
  name: string;
  storage_path: string;
  /** "pdf" (slide deck, per-page comments) or "video" (per-timestamp comments). */
  kind: ReviewFileKind;
  page_count: number;
  duration_seconds: number | null;
  position: number;
  created_at: string;
  updated_at: string;
}

/** What the admin uploads alongside the file: pages for PDFs, length for videos. */
export interface UploadInfo {
  kind: ReviewFileKind;
  pageCount?: number;
  durationSeconds?: number;
}

export interface ReviewReply {
  id: string;
  comment_id: string;
  author_email: string;
  body: string;
  created_at: string;
  read_at: string | null;
}

export interface ReviewComment {
  id: string;
  file_id: string;
  page_number: number;
  /** Video comments only: playback position (in seconds) captured when the
   *  reviewer clicked the comment box. Null for PDF comments. */
  time_seconds: number | null;
  author_email: string;
  body: string;
  created_at: string;
  replies?: ReviewReply[];
}

export interface ReviewerEntry {
  email: string;
  display_name: string | null;
  access_code: string | null;
  created_at: string;
  device_id: string | null;
  device_registered_at: string | null;
  last_seen_ip: string | null;
  courseIds: string[];
}

export interface UnreadMessage {
  reply: ReviewReply;
  commentBody: string;
  pageNumber: number;
  /** Set when the comment was made on a video (playback position). */
  timeSeconds: number | null;
  fileId: string;
  fileName: string;
  courseId: string;
}

/* ─────────────────────────── formatting ──────────────────────────── */

/** "raqueldiaz@raqueldiaz.com.br" → "Raqueldiaz" */
export function nameFromEmail(email: string): string {
  const local = (email.split("@")[0] || email).trim();
  return local ? local.charAt(0).toUpperCase() + local.slice(1) : email;
}

/** Video position "205.4" → "3:25" (or "1:02:05" past the hour). */
export function formatTime(seconds: number | null | undefined): string {
  const total = Math.max(0, Math.floor(seconds ?? 0));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  return `${h > 0 ? `${h}:` : ""}${mm}:${String(s).padStart(2, "0")}`;
}

/** Comment header stamp, exactly "22.08 at 2:14pm". */
export function formatStamp(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  let h = d.getHours();
  const ampm = h >= 12 ? "pm" : "am";
  h = h % 12 || 12;
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}.${mm} at ${h}:${min}${ampm}`;
}

/* ────────────────────────────── auth ─────────────────────────────── */

export async function signIn(email: string, password: string) {
  const { error } = await reviewDb.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) throw new Error(translateAuthError(error.message));
}

export async function signOut() {
  await reviewDb.auth.signOut();
}

function translateAuthError(msg: string): string {
  if (/invalid login credentials/i.test(msg)) return "Incorrect email or access code.";
  if (/rate limit/i.test(msg)) return "Too many attempts. Wait a moment and try again.";
  return msg;
}

export async function isAdminEmail(): Promise<boolean> {
  const { data } = await reviewDb.from("review_admins").select("email").limit(1);
  return !!data && data.length > 0;
}

/* ─────────────────────── admin edge function ─────────────────────── */

async function invokeAdmin<T = Record<string, unknown>>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await reviewDb.functions.invoke("review-admin", { body });
  if (error) {
    let msg = error.message;
    if (error instanceof FunctionsHttpError) {
      try {
        const j = await error.context.json();
        if (j?.error) msg = j.error;
      } catch {
        /* keep original message */
      }
    }
    throw new Error(msg);
  }
  const d = data as { error?: string } & T;
  if (d && typeof d === "object" && "error" in d && d.error) throw new Error(String(d.error));
  return d;
}

/** First-time creation of the admin account (email must be pre-registered). */
export function bootstrapAdmin(email: string, password: string) {
  return invokeAdmin({ action: "bootstrap", email, password });
}

/** Create/update a reviewer and set their course access to exactly courseIds. */
export function upsertReviewer(email: string, courseIds: string[]) {
  return invokeAdmin<{ accessCode: string }>({ action: "upsert_reviewer", email, courseIds });
}

export function resetReviewerCode(email: string) {
  return invokeAdmin<{ accessCode: string }>({ action: "reset_code", email });
}

/** Removes login + access. Comments stay (they are keyed by email). */
export function removeReviewer(email: string) {
  return invokeAdmin({ action: "remove_reviewer", email });
}

/* ───────────────────────── device lock ───────────────────────────── */

const DEVICE_KEY = "369-review-device-id";
let memoryDeviceId: string | null = null;

function getOrCreateDeviceId(): string {
  try {
    const cur = localStorage.getItem(DEVICE_KEY);
    if (cur) return cur;
    const id = crypto.randomUUID();
    localStorage.setItem(DEVICE_KEY, id);
    return id;
  } catch {
    if (!memoryDeviceId) memoryDeviceId = crypto.randomUUID();
    return memoryDeviceId;
  }
}

/**
 * Binds this browser as the reviewer's single allowed computer (first call
 * registers it; later calls validate). Returns { locked: true } when the
 * account is already bound to a different computer.
 */
export async function registerDevice(): Promise<{ locked: boolean }> {
  const res = await invokeAdmin<{ ok: boolean; locked?: boolean }>({
    action: "register_device",
    deviceId: getOrCreateDeviceId(),
  });
  return { locked: !!res.locked };
}

/** Admin: clear the binding so the person can use a new computer. */
export function unlockDevice(email: string) {
  return invokeAdmin({ action: "unlock_device", email });
}

/* ───────────────────────────── courses ───────────────────────────── */

export async function listCourses(): Promise<ReviewCourse[]> {
  const { data, error } = await reviewDb
    .from("review_courses")
    .select("*")
    .order("position")
    .order("created_at");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createCourse(name: string): Promise<void> {
  const { data } = await reviewDb
    .from("review_courses")
    .select("position")
    .order("position", { ascending: false })
    .limit(1);
  const next = (data?.[0]?.position ?? 0) + 1;
  const { error } = await reviewDb.from("review_courses").insert({ name, position: next });
  if (error) throw new Error(error.message);
}

export async function renameCourse(id: string, name: string): Promise<void> {
  const { error } = await reviewDb.from("review_courses").update({ name }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteCourse(course: ReviewCourse): Promise<void> {
  // Remove every stored PDF under the course folder first.
  const { data: objects } = await reviewDb.storage.from(REVIEW_BUCKET).list(course.id, {
    limit: 1000,
  });
  if (objects && objects.length > 0) {
    await reviewDb.storage
      .from(REVIEW_BUCKET)
      .remove(objects.map((o) => `${course.id}/${o.name}`));
  }
  const { error } = await reviewDb.from("review_courses").delete().eq("id", course.id);
  if (error) throw new Error(error.message);
}

/** Swap the course with its neighbour above/below. */
export async function moveCourse(list: ReviewCourse[], id: string, dir: -1 | 1): Promise<void> {
  await swapPositions("review_courses", list, id, dir);
}

/* ────────────────────────────── files ────────────────────────────── */

export async function listFiles(courseId: string): Promise<ReviewFile[]> {
  const { data, error } = await reviewDb
    .from("review_files")
    .select("*")
    .eq("course_id", courseId)
    .order("position")
    .order("created_at");
  if (error) throw new Error(error.message);
  return data ?? [];
}

const KIND_EXT: Record<ReviewFileKind, string> = { pdf: "pdf", video: "mp4" };
const KIND_MIME: Record<ReviewFileKind, string> = {
  pdf: "application/pdf",
  video: "video/mp4",
};

export async function uploadCourseFile(
  courseId: string,
  file: File,
  info: UploadInfo,
): Promise<void> {
  const id = crypto.randomUUID();
  const path = `${courseId}/${id}.${KIND_EXT[info.kind]}`;
  const up = await reviewDb.storage.from(REVIEW_BUCKET).upload(path, file, {
    contentType: KIND_MIME[info.kind],
  });
  if (up.error) throw new Error(up.error.message);

  const { data } = await reviewDb
    .from("review_files")
    .select("position")
    .eq("course_id", courseId)
    .order("position", { ascending: false })
    .limit(1);
  const next = (data?.[0]?.position ?? 0) + 1;

  const cleanName = file.name.replace(/\.(pdf|mp4)$/i, "");
  const { error } = await reviewDb.from("review_files").insert({
    id,
    course_id: courseId,
    name: cleanName,
    storage_path: path,
    kind: info.kind,
    page_count: info.pageCount ?? 0,
    duration_seconds: info.durationSeconds ?? null,
    position: next,
  });
  if (error) {
    await reviewDb.storage.from(REVIEW_BUCKET).remove([path]);
    throw new Error(error.message);
  }
}

export async function renameFile(id: string, name: string): Promise<void> {
  const { error } = await reviewDb.from("review_files").update({ name }).eq("id", id);
  if (error) throw new Error(error.message);
}

/** Replace the file's content (same kind), keeping the record and all comments. */
export async function replaceFile(f: ReviewFile, file: File, info: UploadInfo): Promise<void> {
  const newPath = `${f.course_id}/${f.id}-${Date.now()}.${KIND_EXT[f.kind]}`;
  const up = await reviewDb.storage.from(REVIEW_BUCKET).upload(newPath, file, {
    contentType: KIND_MIME[f.kind],
  });
  if (up.error) throw new Error(up.error.message);
  const { error } = await reviewDb
    .from("review_files")
    .update({
      storage_path: newPath,
      page_count: info.pageCount ?? 0,
      duration_seconds: info.durationSeconds ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", f.id);
  if (error) {
    await reviewDb.storage.from(REVIEW_BUCKET).remove([newPath]);
    throw new Error(error.message);
  }
  await reviewDb.storage.from(REVIEW_BUCKET).remove([f.storage_path]);
}

export async function deleteFile(f: ReviewFile): Promise<void> {
  const { error } = await reviewDb.from("review_files").delete().eq("id", f.id);
  if (error) throw new Error(error.message);
  await reviewDb.storage.from(REVIEW_BUCKET).remove([f.storage_path]);
}

export async function moveFile(list: ReviewFile[], id: string, dir: -1 | 1): Promise<void> {
  await swapPositions("review_files", list, id, dir);
}

/** Download the PDF bytes through the authenticated client (RLS-checked). */
export async function downloadPdfBytes(storagePath: string): Promise<ArrayBuffer> {
  const { data, error } = await reviewDb.storage.from(REVIEW_BUCKET).download(storagePath);
  if (error) throw new Error(error.message);
  return data.arrayBuffer();
}

/** Download a stored file as a Blob through the authenticated client. */
export async function downloadFileBlob(storagePath: string): Promise<Blob> {
  const { data, error } = await reviewDb.storage.from(REVIEW_BUCKET).download(storagePath);
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Short-lived signed URL for streaming playback of large videos (the browser
 * then uses HTTP range requests, so playback starts immediately instead of
 * waiting for hundreds of MB to download). Creating the URL is RLS-checked —
 * only someone with access to the course can obtain it — and it expires.
 */
export async function getSignedFileUrl(
  storagePath: string,
  expiresInSeconds = 6 * 60 * 60,
): Promise<string> {
  const { data, error } = await reviewDb.storage
    .from(REVIEW_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}

/** Read the duration (seconds) of a local video file before uploading it. */
export function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(v.duration) ? v.duration : 0);
    };
    v.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read this video. Make sure it is a valid MP4."));
    };
    v.src = url;
  });
}

/* ──────────────────────────── comments ───────────────────────────── */

const COMMENT_SELECT = "*, replies:review_replies(*)";

export async function listFileComments(fileId: string): Promise<ReviewComment[]> {
  const { data, error } = await reviewDb
    .from("review_comments")
    .select(COMMENT_SELECT)
    .eq("file_id", fileId)
    .order("page_number")
    .order("created_at");
  if (error) throw new Error(error.message);
  return sortReplies(data ?? []);
}

/** Admin dashboard: total comment count per course (RLS: admin sees all). */
export async function countCommentsByCourse(): Promise<Record<string, number>> {
  const { data, error } = await reviewDb
    .from("review_comments")
    .select("id, file:review_files!inner(course_id)");
  if (error) throw new Error(error.message);
  const counts: Record<string, number> = {};
  for (const row of (data ?? []) as unknown as { file: { course_id: string } }[]) {
    counts[row.file.course_id] = (counts[row.file.course_id] ?? 0) + 1;
  }
  return counts;
}

export async function listCourseComments(courseId: string): Promise<ReviewComment[]> {
  const { data, error } = await reviewDb
    .from("review_comments")
    .select(`${COMMENT_SELECT}, file:review_files!inner(id, course_id)`)
    .eq("file.course_id", courseId)
    .order("created_at");
  if (error) throw new Error(error.message);
  return sortReplies(data ?? []);
}

function sortReplies(comments: ReviewComment[]): ReviewComment[] {
  for (const c of comments) {
    c.replies?.sort((a, b) => a.created_at.localeCompare(b.created_at));
  }
  return comments;
}

export async function addComment(
  fileId: string,
  page: number,
  body: string,
  timeSeconds?: number | null,
): Promise<void> {
  const { data: session } = await reviewDb.auth.getSession();
  const email = session.session?.user.email?.toLowerCase();
  if (!email) throw new Error("Session expired. Please sign in again.");
  const { error } = await reviewDb.from("review_comments").insert({
    file_id: fileId,
    page_number: page,
    time_seconds: timeSeconds ?? null,
    author_email: email,
    body,
  });
  if (error) throw new Error(error.message);
}

export async function deleteComment(id: string): Promise<void> {
  const { error } = await reviewDb.from("review_comments").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function addReply(commentId: string, body: string): Promise<void> {
  const { data: session } = await reviewDb.auth.getSession();
  const email = session.session?.user.email?.toLowerCase();
  if (!email) throw new Error("Session expired. Please sign in again.");
  const { error } = await reviewDb.from("review_replies").insert({
    comment_id: commentId,
    author_email: email,
    body,
  });
  if (error) throw new Error(error.message);
}

/* ─────────────── unread feedback messages (reviewer) ─────────────── */

interface UnreadRow extends ReviewReply {
  comment: {
    id: string;
    body: string;
    page_number: number;
    time_seconds: number | null;
    file: { id: string; name: string; course_id: string };
  };
}

export async function listUnreadMessages(): Promise<UnreadMessage[]> {
  const { data, error } = await reviewDb
    .from("review_replies")
    .select(
      "*, comment:review_comments!inner(id, body, page_number, time_seconds, file:review_files!inner(id, name, course_id))",
    )
    .is("read_at", null)
    .order("created_at");
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as unknown as UnreadRow[];
  return rows.map((r) => ({
    reply: {
      id: r.id,
      comment_id: r.comment_id,
      author_email: r.author_email,
      body: r.body,
      created_at: r.created_at,
      read_at: r.read_at,
    },
    commentBody: r.comment.body,
    pageNumber: r.comment.page_number,
    timeSeconds: r.comment.time_seconds,
    fileId: r.comment.file.id,
    fileName: r.comment.file.name,
    courseId: r.comment.file.course_id,
  }));
}

export async function markRepliesRead(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await reviewDb
    .from("review_replies")
    .update({ read_at: new Date().toISOString() })
    .in("id", ids);
  if (error) throw new Error(error.message);
}

/* ─────────────────────── reviewers (admin) ───────────────────────── */

export async function listReviewers(): Promise<ReviewerEntry[]> {
  const [{ data: regs, error: e1 }, { data: access, error: e2 }] = await Promise.all([
    reviewDb.from("review_reviewers").select("*").order("created_at"),
    reviewDb.from("review_access").select("email, course_id"),
  ]);
  if (e1) throw new Error(e1.message);
  if (e2) throw new Error(e2.message);
  const byEmail = new Map<string, string[]>();
  for (const a of access ?? []) {
    const list = byEmail.get(a.email) ?? [];
    list.push(a.course_id);
    byEmail.set(a.email, list);
  }
  return (regs ?? []).map((r) => ({ ...r, courseIds: byEmail.get(r.email) ?? [] }));
}

/* ───────────────────────── shared helpers ────────────────────────── */

async function swapPositions(
  table: "review_courses" | "review_files",
  ordered: { id: string; position: number }[],
  id: string,
  dir: -1 | 1,
): Promise<void> {
  const idx = ordered.findIndex((x) => x.id === id);
  const other = ordered[idx + dir];
  if (idx < 0 || !other) return;
  const a = ordered[idx];
  // Positions can collide after deletions; renumber deterministically.
  const posA = other.position === a.position ? a.position + dir : other.position;
  const posB = a.position;
  const r1 = await reviewDb.from(table).update({ position: posA }).eq("id", a.id);
  if (r1.error) throw new Error(r1.error.message);
  const r2 = await reviewDb.from(table).update({ position: posB }).eq("id", other.id);
  if (r2.error) throw new Error(r2.error.message);
}
