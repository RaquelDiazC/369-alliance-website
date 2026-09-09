/**
 * Course Review Platform — lesson viewer + comment panel.
 *
 * PDF lessons: the page renders onto a canvas (bytes fetched through the
 * authenticated Supabase client — no URL, no download, no text layer) and the
 * right panel shows the comments for the page on screen.
 *
 * Video lessons (MP4): the bytes are downloaded the same authenticated way
 * and played from an in-memory object URL (never a public link). Comments are
 * anchored to the playback time — clicking the comment box captures the
 * current time automatically (and pauses the video); the panel lists every
 * comment of the video ordered by that time, each one jumping the player
 * back to its moment.
 *
 * The same component serves both roles: RLS means a reviewer's query only
 * returns their own comments, while the admin receives everyone's and can
 * answer each comment inline ("click the comment, a line appears").
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getDocument, type PDFDocumentProxy, type RenderTask } from "@/lib/review/pdf";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CornerDownRight,
  Eye,
  MessageSquare,
  PanelRightClose,
  PanelRightOpen,
  Play,
  RefreshCcw,
  Send,
  Trash2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Watermark } from "@/components/review/Protection";
import {
  addComment,
  addReply,
  deleteComment,
  downloadPdfBytes,
  formatStamp,
  formatTime,
  getSignedFileUrl,
  listFileComments,
  listFiles,
  markRepliesRead,
  nameFromEmail,
  type ReviewComment,
  type ReviewFile,
} from "@/lib/review/api";
import { reviewDb } from "@/lib/review/supabase";
import { GOLD, NAVY } from "./ReviewPlatform";

const MAX_ZOOM = 3;

interface Props {
  courseId: string;
  initialFileId?: string;
  initialPage?: number;
  /** Video lessons: open the player already positioned at this second. */
  initialTime?: number;
  isAdmin: boolean;
  email: string;
  onBack: () => void;
}

export default function CourseViewer({
  courseId,
  initialFileId,
  initialPage,
  initialTime,
  isAdmin,
  email,
  onBack,
}: Props) {
  const [courseName, setCourseName] = useState("");
  const [files, setFiles] = useState<ReviewFile[] | null>(null);
  const [fileId, setFileId] = useState<string | null>(initialFileId ?? null);
  const [page, setPage] = useState(initialPage ?? 1);
  const [numPages, setNumPages] = useState(0);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [comments, setComments] = useState<ReviewComment[]>([]);
  const [zoom, setZoom] = useState(1);
  const [panelOpen, setPanelOpen] = useState(true);

  const pdfRef = useRef<PDFDocumentProxy | null>(null);
  const taskRef = useRef<RenderTask | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  // Applied once the video metadata loads (deep links from messages/comments).
  const pendingSeekRef = useRef<number | null>(initialTime ?? null);

  const file = useMemo(() => files?.find((f) => f.id === fileId) ?? null, [files, fileId]);
  const isVideo = file?.kind === "video";

  /* ── course + files ── */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [{ data: course }, fs] = await Promise.all([
          reviewDb.from("review_courses").select("name").eq("id", courseId).maybeSingle(),
          listFiles(courseId),
        ]);
        if (cancelled) return;
        setCourseName(course?.name ?? "Course");
        setFiles(fs);
        setFileId((cur) => cur ?? fs[0]?.id ?? null);
      } catch (e) {
        if (!cancelled) toast.error(e instanceof Error ? e.message : "Failed to load the course.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  /* ── load PDF bytes whenever a PDF file is selected ── */
  useEffect(() => {
    if (!file || file.kind === "video") return;
    let cancelled = false;
    setMediaLoading(true);
    setNumPages(0);
    (async () => {
      try {
        const bytes = await downloadPdfBytes(file.storage_path);
        if (cancelled) return;
        const doc = await getDocument({ data: bytes }).promise;
        if (cancelled) {
          void doc.loadingTask.destroy();
          return;
        }
        void pdfRef.current?.loadingTask.destroy();
        pdfRef.current = doc;
        setNumPages(doc.numPages);
        setPage((p) => Math.min(Math.max(1, p), doc.numPages));
      } catch (e) {
        if (!cancelled) toast.error(e instanceof Error ? e.message : "Failed to open the PDF.");
      } finally {
        if (!cancelled) setMediaLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file?.id, file?.storage_path, file?.kind]);

  /* ── load the video as a short-lived signed URL so the browser streams it
        with range requests (instant start + seeking, even for 600 MB files).
        Obtaining the URL is authenticated + RLS-checked and it expires. ── */
  useEffect(() => {
    if (!file || file.kind !== "video") {
      setVideoUrl(null);
      return;
    }
    let cancelled = false;
    setMediaLoading(true);
    setNumPages(0);
    setVideoUrl(null);
    (async () => {
      try {
        const url = await getSignedFileUrl(file.storage_path);
        if (cancelled) return;
        setVideoUrl(url);
      } catch (e) {
        if (!cancelled) toast.error(e instanceof Error ? e.message : "Failed to open the video.");
      } finally {
        if (!cancelled) setMediaLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file?.id, file?.storage_path, file?.kind]);

  /* ── video helpers: jump to a moment / capture the moment for a comment ── */
  const seekTo = useCallback((t: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    v.currentTime = Math.max(0, t);
  }, []);

  const captureVideoTime = useCallback(() => {
    const v = videoRef.current;
    if (!v) return 0;
    v.pause(); // the person types the comment, then resumes playback
    return v.currentTime;
  }, []);

  // Reset to the first page only when switching files manually.
  const onSelectFile = (id: string) => {
    setFileId(id);
    setPage(1);
    setZoom(1);
    pendingSeekRef.current = null; // a deep link only applies to the file it targeted
  };

  useEffect(
    () => () => {
      taskRef.current?.cancel();
      void pdfRef.current?.loadingTask.destroy();
      pdfRef.current = null;
    },
    [],
  );

  /* ── render current page to canvas (fit inside the stage, retina-aware,
        zoom scrolls inside the stage) ── */
  const renderPage = useCallback(async () => {
    const pdf = pdfRef.current;
    const canvas = canvasRef.current;
    const scroller = scrollRef.current;
    if (!pdf || !canvas || !scroller || page < 1 || page > pdf.numPages) return;
    try {
      const p = await pdf.getPage(page);
      const base = p.getViewport({ scale: 1 });
      const maxW = Math.max(scroller.clientWidth - 24, 100);
      const maxH = Math.max(scroller.clientHeight - 24, 100);
      const fit = Math.min(maxW / base.width, maxH / base.height);
      const cssScale = fit * zoom;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      let renderScale = cssScale * dpr;
      // Cap the backing bitmap so deep zooms stay fast.
      const MAX_BITMAP_W = 4500;
      if (base.width * renderScale > MAX_BITMAP_W) renderScale = MAX_BITMAP_W / base.width;
      const viewport = p.getViewport({ scale: renderScale });
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      canvas.style.width = `${Math.floor(base.width * cssScale)}px`;
      canvas.style.height = `${Math.floor(base.height * cssScale)}px`;
      taskRef.current?.cancel();
      const task = p.render({ canvas, viewport });
      taskRef.current = task;
      await task.promise;
    } catch {
      /* render cancelled by a newer page — expected */
    }
  }, [page, zoom]);

  useEffect(() => {
    void renderPage();
  }, [renderPage, numPages]);

  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    const obs = new ResizeObserver(() => void renderPage());
    obs.observe(scroller);
    return () => obs.disconnect();
  }, [renderPage]);

  /* ── keyboard page navigation (PDF only — the video player owns the keys) ── */
  useEffect(() => {
    if (isVideo) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key === "ArrowLeft") setPage((p) => Math.max(1, p - 1));
      if (e.key === "ArrowRight") setPage((p) => Math.min(numPages || 1, p + 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [numPages, isVideo]);

  /* ── comments ── */
  const reloadComments = useCallback(async () => {
    if (!fileId) return;
    try {
      setComments(await listFileComments(fileId));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load comments.");
    }
  }, [fileId]);

  useEffect(() => {
    setComments([]);
    void reloadComments();
  }, [reloadComments]);

  /** Panel content: video → every comment ordered by its moment; PDF → the
   *  current page's comments. */
  const pageComments = useMemo(
    () =>
      isVideo
        ? [...comments].sort(
            (a, b) =>
              (a.time_seconds ?? 0) - (b.time_seconds ?? 0) ||
              a.created_at.localeCompare(b.created_at),
          )
        : comments.filter((c) => c.page_number === page),
    [comments, page, isVideo],
  );
  const commentedPages = useMemo(
    () =>
      isVideo
        ? []
        : Array.from(new Set(comments.map((c) => c.page_number))).sort((a, b) => a - b),
    [comments, isVideo],
  );
  const commentedTimes = useMemo(() => {
    if (!isVideo) return [] as number[];
    return Array.from(
      new Set(comments.map((c) => Math.floor(c.time_seconds ?? 0))),
    ).sort((a, b) => a - b);
  }, [comments, isVideo]);

  // Reviewer: seeing a reply on screen marks it as read.
  useEffect(() => {
    if (isAdmin) return;
    const unreadIds = pageComments
      .flatMap((c) => c.replies ?? [])
      .filter((r) => !r.read_at)
      .map((r) => r.id);
    if (unreadIds.length === 0) return;
    void markRepliesRead(unreadIds)
      .then(() =>
        setComments((cs) =>
          cs.map((c) => ({
            ...c,
            replies: c.replies?.map((r) =>
              unreadIds.includes(r.id) ? { ...r, read_at: new Date().toISOString() } : r,
            ),
          })),
        ),
      )
      .catch(() => {});
  }, [isAdmin, pageComments]);

  /* ────────────────────────────── UI ────────────────────────────── */

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* toolbar */}
      <div className="border-b bg-white">
        <div className="flex w-full flex-wrap items-center gap-2 px-4 py-2">
          <Button variant="ghost" size="sm" className="gap-1.5 font-bold" onClick={onBack}>
            <ArrowLeft size={15} /> Back
          </Button>
          <span className="hidden text-[13px] font-black sm:inline" style={{ color: NAVY }}>
            {courseName}
          </span>
          <span className="hidden text-muted-foreground sm:inline">·</span>
          <div className="min-w-[200px] max-w-[340px] flex-1">
            <Select value={fileId ?? undefined} onValueChange={onSelectFile}>
              <SelectTrigger className="h-8 text-[13px] font-semibold">
                <SelectValue placeholder={files === null ? "Loading…" : "Choose a file"} />
              </SelectTrigger>
              <SelectContent>
                {(files ?? []).map((f, i) => (
                  <SelectItem key={f.id} value={f.id}>
                    {i + 1}. {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            {!isVideo && commentedPages.length > 0 && (
              <Select value="" onValueChange={(v) => setPage(Number(v))}>
                <SelectTrigger className="h-8 w-[170px] text-[12px] font-semibold">
                  <SelectValue placeholder={`Commented pages (${commentedPages.length})`} />
                </SelectTrigger>
                <SelectContent>
                  {commentedPages.map((p) => (
                    <SelectItem key={p} value={String(p)}>
                      Page {p} — {comments.filter((c) => c.page_number === p).length} comment(s)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {isVideo && commentedTimes.length > 0 && (
              <Select value="" onValueChange={(v) => seekTo(Number(v))}>
                <SelectTrigger className="h-8 w-[190px] text-[12px] font-semibold">
                  <SelectValue placeholder={`Commented moments (${commentedTimes.length})`} />
                </SelectTrigger>
                <SelectContent>
                  {commentedTimes.map((t) => (
                    <SelectItem key={t} value={String(t)}>
                      {formatTime(t)} —{" "}
                      {comments.filter((c) => Math.floor(c.time_seconds ?? 0) === t).length}{" "}
                      comment(s)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {!isVideo && (
              <>
                <span className="min-w-[86px] text-center text-[13px] font-black" style={{ color: NAVY }}>
                  Page {numPages ? page : "–"} / {numPages || "–"}
                </span>

                {/* zoom controls */}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  title="Zoom out"
                  disabled={zoom <= 1}
                  onClick={() => setZoom((z) => Math.max(1, Math.round((z - 0.25) * 100) / 100))}
                >
                  <ZoomOut size={15} />
                </Button>
                <button
                  className="min-w-[48px] rounded-md border px-1.5 py-1 text-[12px] font-black transition hover:bg-muted"
                  title="Reset zoom (fit page)"
                  onClick={() => setZoom(1)}
                >
                  {Math.round(zoom * 100)}%
                </button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  title="Zoom in"
                  disabled={zoom >= MAX_ZOOM}
                  onClick={() => setZoom((z) => Math.min(MAX_ZOOM, Math.round((z + 0.25) * 100) / 100))}
                >
                  <ZoomIn size={15} />
                </Button>
              </>
            )}

            {/* hide/show the comment panel to give the lesson the full width */}
            <Button
              variant="outline"
              size="sm"
              className="relative h-8 gap-1.5 text-[12px] font-bold"
              title={panelOpen ? "Hide comments — bigger view" : "Show comments"}
              onClick={() => setPanelOpen((v) => !v)}
            >
              {panelOpen ? <PanelRightClose size={15} /> : <PanelRightOpen size={15} />}
              {panelOpen ? (isVideo ? "Bigger video" : "Bigger slide") : "Comments"}
              {!panelOpen && pageComments.length > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-black text-white" style={{ background: "#dc2626" }}>
                  {pageComments.length}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* stage + comment panel */}
      <div className="flex w-full min-h-0 flex-1 flex-col gap-3 px-3 py-3 lg:flex-row">
        <div className="relative min-h-[480px] flex-1">
          <div
            ref={scrollRef}
            className="absolute inset-0 overflow-auto rounded-xl border"
            style={{ background: "#232338" }}
          >
            {files !== null && files.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="px-6 text-center text-sm font-semibold text-white/60">
                  This course has no files yet.
                </p>
              </div>
            ) : mediaLoading ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm font-semibold text-white/60">Opening the material…</p>
              </div>
            ) : isVideo ? (
              <div className="flex h-full items-center justify-center p-3">
                {videoUrl && (
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    controls
                    playsInline
                    // Reviewers: no download button, no fullscreen (fullscreen
                    // would escape the watermark), no casting. The admin keeps
                    // fullscreen for her own checks.
                    controlsList={
                      isAdmin ? "nodownload" : "nodownload nofullscreen noremoteplayback"
                    }
                    disablePictureInPicture={!isAdmin}
                    onContextMenu={(e) => e.preventDefault()}
                    onLoadedMetadata={() => {
                      const t = pendingSeekRef.current;
                      pendingSeekRef.current = null;
                      if (t != null && videoRef.current) videoRef.current.currentTime = t;
                    }}
                    className="max-h-full max-w-full rounded shadow-2xl"
                  />
                )}
              </div>
            ) : (
              <div
                className="flex min-h-full items-center justify-center p-3"
                style={{ minWidth: "100%", width: "max-content" }}
              >
                <canvas ref={canvasRef} className="rounded shadow-2xl" />
              </div>
            )}
          </div>

          {!isAdmin && email && !mediaLoading && <Watermark email={email} />}

          {/* image-viewer style page arrows, floating over the slide (PDF only) */}
          {!isVideo && numPages > 0 && !mediaLoading && (
            <>
              <button
                aria-label="Previous page"
                title="Previous page"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="absolute left-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white shadow-lg backdrop-blur-sm transition hover:bg-black/65 disabled:cursor-default disabled:opacity-20 disabled:hover:bg-black/40"
              >
                <ChevronLeft size={26} />
              </button>
              <button
                aria-label="Next page"
                title="Next page"
                disabled={page >= numPages}
                onClick={() => setPage((p) => Math.min(numPages, p + 1))}
                className="absolute right-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white shadow-lg backdrop-blur-sm transition hover:bg-black/65 disabled:cursor-default disabled:opacity-20 disabled:hover:bg-black/40"
              >
                <ChevronRight size={26} />
              </button>
              <span className="pointer-events-none absolute bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-full bg-black/45 px-3 py-1 text-[12px] font-bold text-white backdrop-blur-sm">
                {page} / {numPages}
              </span>
            </>
          )}
        </div>

        {/* right side: comments for the current page */}
        {panelOpen && (
          <aside className="flex w-full shrink-0 flex-col rounded-xl border bg-white lg:w-[360px]">
            <div className="flex items-center gap-2 border-b px-4 py-3">
              <MessageSquare size={16} style={{ color: GOLD }} />
              <p className="text-[13px] font-black" style={{ color: NAVY }}>
                {isVideo ? "Comments · this video" : `Comments · page ${numPages ? page : "–"}`}
              </p>
              <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
                {pageComments.length}
              </span>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3 lg:max-h-[calc(100vh-240px)]">
              {!isAdmin && (
                <NewCommentBox
                  disabled={!fileId || (isVideo ? !videoUrl : !numPages)}
                  captureTime={isVideo ? captureVideoTime : undefined}
                  onSubmit={async (text, timeSeconds) => {
                    if (!fileId) return;
                    await addComment(
                      fileId,
                      isVideo ? 1 : page,
                      text,
                      isVideo ? (timeSeconds ?? 0) : null,
                    );
                    await reloadComments();
                  }}
                />
              )}

              {pageComments.length === 0 && (
                <p className="py-8 text-center text-[13px] text-muted-foreground">
                  {isVideo
                    ? isAdmin
                      ? "No comments on this video."
                      : "You haven't commented on this video yet."
                    : isAdmin
                      ? "No comments on this page."
                      : "You haven't commented on this page yet."}
                </p>
              )}

              {pageComments.map((c) => (
                <CommentCard
                  key={c.id}
                  comment={c}
                  isAdmin={isAdmin}
                  email={email}
                  onChanged={reloadComments}
                  timeLabel={
                    isVideo && c.time_seconds != null ? formatTime(c.time_seconds) : undefined
                  }
                  onSeek={isVideo ? () => seekTo(c.time_seconds ?? 0) : undefined}
                />
              ))}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

/* ───────────────────────── comment building blocks ───────────────────────── */

function NewCommentBox({
  disabled,
  onSubmit,
  captureTime,
}: {
  disabled: boolean;
  onSubmit: (text: string, timeSeconds: number | null) => Promise<void>;
  /** Video mode: returns the current playback time (and pauses the video).
   *  Clicking the box captures the moment automatically. */
  captureTime?: () => number;
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [capturedTime, setCapturedTime] = useState<number | null>(null);

  const capture = () => {
    if (captureTime) setCapturedTime(captureTime());
  };

  const send = async () => {
    const t = text.trim();
    if (!t) return;
    setBusy(true);
    try {
      await onSubmit(t, capturedTime);
      setText("");
      setCapturedTime(null);
      toast.success("Comment posted.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to post the comment.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="rounded-lg border bg-[#faf9f6] p-2.5">
      {captureTime && capturedTime !== null && (
        <div className="flex items-center gap-1.5 px-1 pb-1">
          <span
            className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-black text-white"
            style={{ background: NAVY }}
            title="This comment will be pinned to this moment of the video"
          >
            <Play size={9} fill="white" /> at {formatTime(capturedTime)}
          </span>
          <button
            className="text-muted-foreground/70 transition hover:text-foreground"
            title="Update to the current video time"
            onClick={capture}
          >
            <RefreshCcw size={12} />
          </button>
        </div>
      )}
      <Textarea
        placeholder={
          captureTime
            ? "Click here to comment — the video time is captured automatically…"
            : "Write a comment about this page…"
        }
        value={text}
        disabled={disabled}
        onFocus={() => {
          // First click (or click after posting) freezes the moment the person
          // is talking about — even while the video is still playing.
          if (captureTime && capturedTime === null && !text.trim()) capture();
        }}
        onChange={(e) => setText(e.target.value)}
        className="min-h-[64px] resize-none border-0 bg-transparent p-1 text-[13px] shadow-none focus-visible:ring-0"
      />
      <div className="flex justify-end pt-1">
        <Button
          size="sm"
          className="h-7 gap-1.5 text-[12px] font-black"
          style={{ background: NAVY }}
          disabled={disabled || busy || !text.trim()}
          onClick={() => void send()}
        >
          <Send size={13} /> Comment
        </Button>
      </div>
    </div>
  );
}

export function CommentCard({
  comment,
  isAdmin,
  email,
  onChanged,
  context,
  onOpenPage,
  openLabel,
  timeLabel,
  onSeek,
}: {
  comment: ReviewComment;
  isAdmin: boolean;
  email: string;
  onChanged: () => void | Promise<void>;
  /** Optional "file · page" label shown above the comment (admin overview). */
  context?: string;
  /** Optional: open the lesson at this comment's page/moment (admin overview). */
  onOpenPage?: () => void;
  /** Label for the open button — "Open page" (default) or "Open video". */
  openLabel?: string;
  /** Video comments: the "3:25" chip pinned to this comment. */
  timeLabel?: string;
  /** Video comments (in the viewer): jump the player to this moment. */
  onSeek?: () => void;
}) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const own = comment.author_email.toLowerCase() === email.toLowerCase();
  const canDelete = isAdmin || own;

  const sendReply = async () => {
    const t = replyText.trim();
    if (!t) return;
    setBusy(true);
    try {
      await addReply(comment.id, t);
      setReplyText("");
      setReplyOpen(false);
      toast.success("Feedback sent. They will see it when they sign in.");
      await onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send feedback.");
    } finally {
      setBusy(false);
    }
  };

  const doDelete = async () => {
    setBusy(true);
    try {
      await deleteComment(comment.id);
      await onChanged();
      toast.success("Comment deleted.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete.");
    } finally {
      setBusy(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="rounded-lg border bg-white p-3 shadow-sm">
      {context && (
        <div className="mb-1 flex items-center justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {context}
          </p>
          {onOpenPage && (
            <button
              onClick={onOpenPage}
              title="Open the lesson at this exact spot"
              className="flex shrink-0 items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-bold text-muted-foreground transition hover:border-[#A68A64] hover:text-foreground"
            >
              <Eye size={11} /> {openLabel ?? "Open page"}
            </button>
          )}
        </div>
      )}
      {timeLabel && (
        <button
          onClick={onSeek}
          disabled={!onSeek}
          title={onSeek ? "Jump the video to this moment" : undefined}
          className={`mb-1 flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-black transition ${
            onSeek ? "hover:border-[#A68A64] hover:bg-[#faf6ef]" : "cursor-default"
          }`}
          style={{ color: NAVY }}
        >
          <Play size={9} fill={NAVY} /> {timeLabel}
        </button>
      )}
      {/* "Raqueldiaz 22.08 at 2:14pm - comment" — click it to answer (admin). */}
      <div
        role={isAdmin ? "button" : undefined}
        tabIndex={isAdmin ? 0 : undefined}
        onClick={isAdmin ? () => setReplyOpen((v) => !v) : undefined}
        onKeyDown={isAdmin ? (e) => e.key === "Enter" && setReplyOpen((v) => !v) : undefined}
        className={isAdmin ? "cursor-pointer rounded p-0.5 transition hover:bg-[#faf6ef]" : undefined}
        title={isAdmin ? "Click to reply" : undefined}
      >
        <p className="text-[13px] leading-relaxed">
          <span className="font-black" style={{ color: NAVY }}>
            {nameFromEmail(comment.author_email)} {formatStamp(comment.created_at)}
          </span>
          {" - "}
          <span className="whitespace-pre-wrap">{comment.body}</span>
        </p>
      </div>

      {(comment.replies ?? []).map((r) => (
        <div
          key={r.id}
          className="mt-2 flex gap-1.5 rounded-md border-l-2 py-1.5 pl-2 pr-1"
          style={{
            borderColor: GOLD,
            background: r.read_at ? "#faf8f4" : "#fdf3e4",
          }}
        >
          <CornerDownRight size={13} className="mt-0.5 shrink-0" style={{ color: GOLD }} />
          <p className="text-[12.5px] leading-relaxed">
            <span className="font-black" style={{ color: "#8a6d3b" }}>
              {nameFromEmail(r.author_email)} {formatStamp(r.created_at)}
            </span>
            {" - "}
            <span className="whitespace-pre-wrap">{r.body}</span>
            {!r.read_at && (
              <span className="ml-1.5 rounded-full bg-amber-600 px-1.5 py-px align-middle text-[9px] font-black uppercase text-white">
                new
              </span>
            )}
          </p>
        </div>
      ))}

      {isAdmin && replyOpen && (
        <div className="mt-2 flex items-center gap-1.5">
          <Input
            autoFocus
            placeholder="Write your feedback for this person…"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void sendReply()}
            className="h-8 text-[13px]"
          />
          <Button
            size="icon"
            className="h-8 w-8 shrink-0"
            style={{ background: NAVY }}
            disabled={busy || !replyText.trim()}
            onClick={() => void sendReply()}
          >
            <Send size={14} />
          </Button>
        </div>
      )}

      {canDelete && (
        <div className="mt-1.5 flex justify-end">
          {confirmDelete ? (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-red-600">Delete comment?</span>
              <Button size="sm" variant="destructive" className="h-6 px-2 text-[11px]" disabled={busy} onClick={() => void doDelete()}>
                Yes
              </Button>
              <Button size="sm" variant="outline" className="h-6 px-2 text-[11px]" onClick={() => setConfirmDelete(false)}>
                No
              </Button>
            </div>
          ) : (
            <button
              className="text-muted-foreground/60 transition hover:text-red-600"
              title="Delete comment"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
