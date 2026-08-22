/**
 * Course Review Platform — slide viewer + per-page comment panel.
 *
 * Left: the PDF page rendered onto a canvas (bytes fetched through the
 * authenticated Supabase client — no URL, no download, no text layer).
 * Right: the comment thread for the page currently on screen.
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
  MessageSquare,
  Send,
  Trash2,
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
  listFileComments,
  listFiles,
  markRepliesRead,
  nameFromEmail,
  type ReviewComment,
  type ReviewFile,
} from "@/lib/review/api";
import { reviewDb } from "@/lib/review/supabase";
import { GOLD, NAVY } from "./ReviewPlatform";

interface Props {
  courseId: string;
  initialFileId?: string;
  initialPage?: number;
  isAdmin: boolean;
  email: string;
  onBack: () => void;
}

export default function CourseViewer({
  courseId,
  initialFileId,
  initialPage,
  isAdmin,
  email,
  onBack,
}: Props) {
  const [courseName, setCourseName] = useState("");
  const [files, setFiles] = useState<ReviewFile[] | null>(null);
  const [fileId, setFileId] = useState<string | null>(initialFileId ?? null);
  const [page, setPage] = useState(initialPage ?? 1);
  const [numPages, setNumPages] = useState(0);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [comments, setComments] = useState<ReviewComment[]>([]);

  const pdfRef = useRef<PDFDocumentProxy | null>(null);
  const taskRef = useRef<RenderTask | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const file = useMemo(() => files?.find((f) => f.id === fileId) ?? null, [files, fileId]);

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
        setCourseName(course?.name ?? "Curso");
        setFiles(fs);
        setFileId((cur) => cur ?? fs[0]?.id ?? null);
      } catch (e) {
        if (!cancelled) toast.error(e instanceof Error ? e.message : "Erro ao carregar o curso.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  /* ── load PDF bytes whenever the selected file changes ── */
  useEffect(() => {
    if (!file) return;
    let cancelled = false;
    setPdfLoading(true);
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
        if (!cancelled) toast.error(e instanceof Error ? e.message : "Erro ao abrir o PDF.");
      } finally {
        if (!cancelled) setPdfLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file?.id, file?.storage_path]);

  // Reset to the requested page only when switching files manually.
  const onSelectFile = (id: string) => {
    setFileId(id);
    setPage(1);
  };

  useEffect(
    () => () => {
      taskRef.current?.cancel();
      void pdfRef.current?.loadingTask.destroy();
      pdfRef.current = null;
    },
    [],
  );

  /* ── render current page to canvas (fit inside the stage, retina-aware) ── */
  const renderPage = useCallback(async () => {
    const pdf = pdfRef.current;
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!pdf || !canvas || !wrap || page < 1 || page > pdf.numPages) return;
    try {
      const p = await pdf.getPage(page);
      const base = p.getViewport({ scale: 1 });
      const maxW = Math.max(wrap.clientWidth - 24, 100);
      const maxH = Math.max(wrap.clientHeight - 24, 100);
      const fit = Math.min(maxW / base.width, maxH / base.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const viewport = p.getViewport({ scale: fit * dpr });
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      canvas.style.width = `${Math.floor(viewport.width / dpr)}px`;
      canvas.style.height = `${Math.floor(viewport.height / dpr)}px`;
      taskRef.current?.cancel();
      const task = p.render({ canvas, viewport });
      taskRef.current = task;
      await task.promise;
    } catch {
      /* render cancelled by a newer page — expected */
    }
  }, [page]);

  useEffect(() => {
    void renderPage();
  }, [renderPage, numPages]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const obs = new ResizeObserver(() => void renderPage());
    obs.observe(wrap);
    return () => obs.disconnect();
  }, [renderPage]);

  /* ── keyboard page navigation ── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key === "ArrowLeft") setPage((p) => Math.max(1, p - 1));
      if (e.key === "ArrowRight") setPage((p) => Math.min(numPages || 1, p + 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [numPages]);

  /* ── comments ── */
  const reloadComments = useCallback(async () => {
    if (!fileId) return;
    try {
      setComments(await listFileComments(fileId));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao carregar comentários.");
    }
  }, [fileId]);

  useEffect(() => {
    setComments([]);
    void reloadComments();
  }, [reloadComments]);

  const pageComments = useMemo(
    () => comments.filter((c) => c.page_number === page),
    [comments, page],
  );
  const commentedPages = useMemo(
    () => Array.from(new Set(comments.map((c) => c.page_number))).sort((a, b) => a - b),
    [comments],
  );

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
        <div className="mx-auto flex w-full max-w-[1400px] flex-wrap items-center gap-2 px-4 py-2">
          <Button variant="ghost" size="sm" className="gap-1.5 font-bold" onClick={onBack}>
            <ArrowLeft size={15} /> Voltar
          </Button>
          <span className="hidden text-[13px] font-black sm:inline" style={{ color: NAVY }}>
            {courseName}
          </span>
          <span className="hidden text-muted-foreground sm:inline">·</span>
          <div className="min-w-[200px] max-w-[340px] flex-1">
            <Select value={fileId ?? undefined} onValueChange={onSelectFile}>
              <SelectTrigger className="h-8 text-[13px] font-semibold">
                <SelectValue placeholder={files === null ? "Carregando…" : "Escolha o arquivo"} />
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
            {commentedPages.length > 0 && (
              <Select value="" onValueChange={(v) => setPage(Number(v))}>
                <SelectTrigger className="h-8 w-[170px] text-[12px] font-semibold">
                  <SelectValue placeholder={`Folhas comentadas (${commentedPages.length})`} />
                </SelectTrigger>
                <SelectContent>
                  {commentedPages.map((p) => (
                    <SelectItem key={p} value={String(p)}>
                      Folha {p} — {comments.filter((c) => c.page_number === p).length} comentário(s)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft size={16} />
            </Button>
            <span className="min-w-[90px] text-center text-[13px] font-black" style={{ color: NAVY }}>
              Folha {numPages ? page : "–"} / {numPages || "–"}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={!numPages || page >= numPages}
              onClick={() => setPage((p) => Math.min(numPages, p + 1))}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </div>

      {/* stage + comment panel */}
      <div className="mx-auto flex w-full max-w-[1400px] min-h-0 flex-1 flex-col gap-3 px-4 py-3 lg:flex-row">
        <div
          ref={wrapRef}
          className="relative flex min-h-[420px] flex-1 items-center justify-center overflow-hidden rounded-xl border"
          style={{ background: "#232338" }}
        >
          {files !== null && files.length === 0 ? (
            <p className="px-6 text-center text-sm font-semibold text-white/60">
              Este curso ainda não tem arquivos.
            </p>
          ) : pdfLoading ? (
            <p className="text-sm font-semibold text-white/60">Abrindo o material…</p>
          ) : (
            <>
              <canvas ref={canvasRef} className="max-h-full max-w-full rounded shadow-2xl" />
              {!isAdmin && email && <Watermark email={email} />}
            </>
          )}
        </div>

        {/* right side: comments for the current page */}
        <aside className="flex w-full shrink-0 flex-col rounded-xl border bg-white lg:w-[360px]">
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <MessageSquare size={16} style={{ color: GOLD }} />
            <p className="text-[13px] font-black" style={{ color: NAVY }}>
              Comentários · folha {numPages ? page : "–"}
            </p>
            <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
              {pageComments.length}
            </span>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3 lg:max-h-[calc(100vh-240px)]">
            {!isAdmin && (
              <NewCommentBox
                disabled={!fileId || !numPages}
                onSubmit={async (text) => {
                  if (!fileId) return;
                  await addComment(fileId, page, text);
                  await reloadComments();
                }}
              />
            )}

            {pageComments.length === 0 && (
              <p className="py-8 text-center text-[13px] text-muted-foreground">
                {isAdmin
                  ? "Nenhum comentário nesta folha."
                  : "Você ainda não comentou nesta folha."}
              </p>
            )}

            {pageComments.map((c) => (
              <CommentCard
                key={c.id}
                comment={c}
                isAdmin={isAdmin}
                email={email}
                onChanged={reloadComments}
              />
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ───────────────────────── comment building blocks ───────────────────────── */

function NewCommentBox({
  disabled,
  onSubmit,
}: {
  disabled: boolean;
  onSubmit: (text: string) => Promise<void>;
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const send = async () => {
    const t = text.trim();
    if (!t) return;
    setBusy(true);
    try {
      await onSubmit(t);
      setText("");
      toast.success("Comentário enviado.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao enviar comentário.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="rounded-lg border bg-[#faf9f6] p-2.5">
      <Textarea
        placeholder="Escreva um comentário sobre esta folha…"
        value={text}
        disabled={disabled}
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
          <Send size={13} /> Comentar
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
}: {
  comment: ReviewComment;
  isAdmin: boolean;
  email: string;
  onChanged: () => void | Promise<void>;
  /** Optional "file · page" label shown above the comment (admin overview). */
  context?: string;
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
      toast.success("Feedback enviado. A pessoa verá ao entrar no sistema.");
      await onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao enviar feedback.");
    } finally {
      setBusy(false);
    }
  };

  const doDelete = async () => {
    setBusy(true);
    try {
      await deleteComment(comment.id);
      await onChanged();
      toast.success("Comentário apagado.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao apagar.");
    } finally {
      setBusy(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="rounded-lg border bg-white p-3 shadow-sm">
      {context && (
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {context}
        </p>
      )}
      {/* "Raqueldiaz 22.08 at 2:14pm - comment" — click it to answer (admin). */}
      <div
        role={isAdmin ? "button" : undefined}
        tabIndex={isAdmin ? 0 : undefined}
        onClick={isAdmin ? () => setReplyOpen((v) => !v) : undefined}
        onKeyDown={isAdmin ? (e) => e.key === "Enter" && setReplyOpen((v) => !v) : undefined}
        className={isAdmin ? "cursor-pointer rounded p-0.5 transition hover:bg-[#faf6ef]" : undefined}
        title={isAdmin ? "Clique para responder" : undefined}
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
                nova
              </span>
            )}
          </p>
        </div>
      ))}

      {isAdmin && replyOpen && (
        <div className="mt-2 flex items-center gap-1.5">
          <Input
            autoFocus
            placeholder="Escreva seu feedback para esta pessoa…"
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
              <span className="text-[11px] font-bold text-red-600">Apagar comentário?</span>
              <Button size="sm" variant="destructive" className="h-6 px-2 text-[11px]" disabled={busy} onClick={() => void doDelete()}>
                Sim
              </Button>
              <Button size="sm" variant="outline" className="h-6 px-2 text-[11px]" onClick={() => setConfirmDelete(false)}>
                Não
              </Button>
            </div>
          ) : (
            <button
              className="text-muted-foreground/60 transition hover:text-red-600"
              title="Apagar comentário"
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
