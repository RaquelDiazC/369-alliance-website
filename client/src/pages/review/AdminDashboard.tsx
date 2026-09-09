/**
 * Course Review Platform — admin dashboard.
 *
 * "Courses": folder-first navigation — each course is a folder; clicking the
 * folder opens it (the PDFs live inside), renaming is the pencil icon. Each
 * folder row shows a comment indicator (green as soon as any lesson has
 * comments) to the left of the reorder arrows.
 * "Reviewers": add people by email and manage, in one list, which course
 * folder each email can see via tick/untick — comments always survive.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  Copy,
  Eye,
  FilePlus2,
  FileText,
  Film,
  Folder,
  FolderPlus,
  KeyRound,
  MessageSquare,
  Monitor,
  Pencil,
  Plus,
  RefreshCcw,
  Trash2,
  Unlock,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  countCommentsByCourse,
  createCourse,
  deleteCourse,
  deleteFile,
  formatStamp,
  formatTime,
  getVideoDuration,
  listCourseComments,
  listCourses,
  listFiles,
  listReviewers,
  moveCourse,
  moveFile,
  removeReviewer,
  renameCourse,
  renameFile,
  replaceFile,
  resetReviewerCode,
  unlockDevice,
  upsertReviewer,
  uploadCourseFile,
  nameFromEmail,
  type ReviewComment,
  type ReviewCourse,
  type ReviewFile,
  type ReviewerEntry,
} from "@/lib/review/api";
import { countPdfPages } from "@/lib/review/pdf";
import { CommentCard } from "./CourseViewer";
import { GOLD, NAVY, type ViewerTarget } from "./ReviewPlatform";

const GREEN = "#16a34a";

type DetailTab = "files" | "comments";

export default function AdminDashboard({
  onOpenViewer,
}: {
  onOpenViewer: (target: ViewerTarget) => void;
}) {
  const [courses, setCourses] = useState<ReviewCourse[]>([]);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState<{ course: ReviewCourse; tab: DetailTab } | null>(null);

  const reloadCourses = useCallback(async () => {
    try {
      const [cs, counts] = await Promise.all([listCourses(), countCommentsByCourse()]);
      setCourses(cs);
      setCommentCounts(counts);
      setSelected((cur) =>
        cur ? (() => {
          const c = cs.find((x) => x.id === cur.course.id);
          return c ? { course: c, tab: cur.tab } : null;
        })() : null,
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load courses.");
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    void reloadCourses();
  }, [reloadCourses]);

  if (selected) {
    return (
      <CourseDetail
        key={`${selected.course.id}-${selected.tab}`}
        course={selected.course}
        initialTab={selected.tab}
        onBack={() => {
          setSelected(null);
          void reloadCourses();
        }}
        onOpenViewer={() => onOpenViewer({ courseId: selected.course.id })}
        onOpenPage={(fileId, page, time) =>
          onOpenViewer({ courseId: selected.course.id, fileId, page, time })
        }
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 py-8">
      <Tabs defaultValue="courses">
        <TabsList>
          <TabsTrigger value="courses" className="gap-1.5 font-bold">
            <Folder size={15} /> Courses
          </TabsTrigger>
          <TabsTrigger value="reviewers" className="gap-1.5 font-bold">
            <Users size={15} /> Reviewers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="pt-4">
          <CoursesPanel
            courses={courses}
            commentCounts={commentCounts}
            loaded={loaded}
            onChanged={reloadCourses}
            onOpenFolder={(course, tab) => setSelected({ course, tab })}
            onOpenViewer={(id) => onOpenViewer({ courseId: id })}
          />
        </TabsContent>

        <TabsContent value="reviewers" className="pt-4">
          <ReviewersPanel courses={courses} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ─────────────────────────────── courses ─────────────────────────────── */

function CoursesPanel({
  courses,
  commentCounts,
  loaded,
  onChanged,
  onOpenFolder,
  onOpenViewer,
}: {
  courses: ReviewCourse[];
  commentCounts: Record<string, number>;
  loaded: boolean;
  onChanged: () => Promise<void>;
  onOpenFolder: (c: ReviewCourse, tab: DetailTab) => void;
  onOpenViewer: (id: string) => void;
}) {
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const [toDelete, setToDelete] = useState<ReviewCourse | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState("");

  const create = async () => {
    const n = newName.trim();
    if (!n) return;
    setBusy(true);
    try {
      await createCourse(n);
      setNewName("");
      await onChanged();
      toast.success("Course folder created. Click it to add the PDFs inside.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create the course.");
    } finally {
      setBusy(false);
    }
  };

  const saveRename = async (c: ReviewCourse) => {
    const t = renameText.trim();
    setRenamingId(null);
    if (!t || t === c.name) return;
    try {
      await renameCourse(c.id, t);
      await onChanged();
      toast.success("Renamed.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to rename.");
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="New course folder name (e.g. Strata)…"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void create()}
          className="max-w-sm"
        />
        <Button
          className="gap-1.5 font-black"
          style={{ background: NAVY }}
          disabled={busy || !newName.trim()}
          onClick={() => void create()}
        >
          <FolderPlus size={15} /> Create course folder
        </Button>
      </div>
      <p className="mt-2 text-[12px] text-muted-foreground">
        Each course is a folder — click a folder to open it and manage the PDFs and videos inside.
        The green icon lights up as soon as a lesson receives comments.
      </p>

      {loaded && courses.length === 0 && (
        <Card className="mt-6 border-dashed">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Create the first course folder to start uploading PDFs and videos.
          </CardContent>
        </Card>
      )}

      <div className="mt-5 space-y-2">
        {courses.map((c, i) => {
          const count = commentCounts[c.id] ?? 0;
          const renaming = renamingId === c.id;
          return (
            <div
              key={c.id}
              role="button"
              tabIndex={0}
              onClick={() => !renaming && onOpenFolder(c, "files")}
              onKeyDown={(e) => e.key === "Enter" && !renaming && onOpenFolder(c, "files")}
              className="flex cursor-pointer items-center gap-2 rounded-xl border bg-white p-3 shadow-sm transition hover:border-[#A68A64] hover:shadow-md"
            >
              <span className="w-6 text-center text-[12px] font-black text-muted-foreground">{i + 1}</span>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ background: NAVY }}>
                <Folder size={18} style={{ color: GOLD }} />
              </span>
              {renaming ? (
                <Input
                  autoFocus
                  value={renameText}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => setRenameText(e.target.value)}
                  onBlur={() => void saveRename(c)}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === "Enter") void saveRename(c);
                    if (e.key === "Escape") setRenamingId(null);
                  }}
                  className="h-8 min-w-0 flex-1 text-[15px] font-black"
                />
              ) : (
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-black" style={{ color: NAVY }}>
                    {c.name}
                  </span>
                  <span className="block text-[11px] text-muted-foreground">Open folder · lessons inside</span>
                </span>
              )}

              {/* comment indicator — green as soon as the lessons have comments */}
              <button
                title={count > 0 ? `${count} comment${count === 1 ? "" : "s"} — click to view` : "No comments yet"}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenFolder(c, "comments");
                }}
                className="flex h-8 items-center gap-1 rounded-md px-2 transition hover:bg-muted"
              >
                <MessageSquare
                  size={16}
                  style={count > 0 ? { color: GREEN } : { color: "#c9c4ba" }}
                  fill={count > 0 ? GREEN : "none"}
                />
                {count > 0 && (
                  <span className="text-[12px] font-black" style={{ color: GREEN }}>
                    {count}
                  </span>
                )}
              </button>

              <Button
                variant="ghost" size="icon" className="h-8 w-8" title="Move up" disabled={i === 0}
                onClick={(e) => {
                  e.stopPropagation();
                  moveCourse(courses, c.id, -1).then(onChanged).catch((err) => toast.error(String(err.message ?? err)));
                }}
              >
                <ArrowUp size={15} />
              </Button>
              <Button
                variant="ghost" size="icon" className="h-8 w-8" title="Move down" disabled={i === courses.length - 1}
                onClick={(e) => {
                  e.stopPropagation();
                  moveCourse(courses, c.id, 1).then(onChanged).catch((err) => toast.error(String(err.message ?? err)));
                }}
              >
                <ArrowDown size={15} />
              </Button>
              <Button
                variant="outline" size="sm" className="gap-1.5 font-bold" title="Open in the slide viewer"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenViewer(c.id);
                }}
              >
                <Eye size={14} /> Preview
              </Button>
              <Button
                variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" title="Rename folder"
                onClick={(e) => {
                  e.stopPropagation();
                  setRenameText(c.name);
                  setRenamingId(c.id);
                }}
              >
                <Pencil size={14} />
              </Button>
              <Button
                variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600" title="Delete folder"
                onClick={(e) => {
                  e.stopPropagation();
                  setToDelete(c);
                }}
              >
                <Trash2 size={15} />
              </Button>
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        open={!!toDelete}
        title={`Delete the course folder "${toDelete?.name}"?`}
        description="All files (PDFs and videos) and comments in this course will be permanently deleted."
        confirmLabel="Delete folder"
        onCancel={() => setToDelete(null)}
        onConfirm={async () => {
          if (!toDelete) return;
          await deleteCourse(toDelete);
          setToDelete(null);
          await onChanged();
          toast.success("Course folder deleted.");
        }}
      />
    </>
  );
}

/* ──────────────────────────── course folder ──────────────────────────── */

function CourseDetail({
  course,
  initialTab,
  onBack,
  onOpenViewer,
  onOpenPage,
}: {
  course: ReviewCourse;
  initialTab: DetailTab;
  onBack: () => void;
  onOpenViewer: () => void;
  onOpenPage: (fileId: string, page: number, time?: number) => void;
}) {
  const [files, setFiles] = useState<ReviewFile[]>([]);
  const [comments, setComments] = useState<ReviewComment[]>([]);

  const reload = useCallback(async () => {
    try {
      const [fs, cs] = await Promise.all([listFiles(course.id), listCourseComments(course.id)]);
      setFiles(fs);
      setComments(cs);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load the course.");
    }
  }, [course.id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const commentCountByFile = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of comments) m.set(c.file_id, (m.get(c.file_id) ?? 0) + 1);
    return m;
  }, [comments]);

  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 py-8">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" className="gap-1.5 font-bold" onClick={onBack}>
          <ArrowLeft size={15} /> All folders
        </Button>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: NAVY }}>
          <Folder size={15} style={{ color: GOLD }} />
        </span>
        <h1 className="text-xl font-black tracking-tight" style={{ color: NAVY }}>
          {course.name}
        </h1>
        <Button size="sm" className="ml-auto gap-1.5 font-bold" style={{ background: NAVY }} onClick={onOpenViewer}>
          <Eye size={14} /> Open in viewer
        </Button>
      </div>

      <Tabs defaultValue={initialTab} className="mt-5">
        <TabsList>
          <TabsTrigger value="files" className="gap-1.5 font-bold">
            <FileText size={14} /> Files ({files.length})
          </TabsTrigger>
          <TabsTrigger value="comments" className="gap-1.5 font-bold">
            <MessageSquare size={14} /> Comments ({comments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="files" className="pt-4">
          <FilesManager course={course} files={files} commentCountByFile={commentCountByFile} onChanged={reload} />
        </TabsContent>

        <TabsContent value="comments" className="pt-4">
          <CourseCommentsList files={files} comments={comments} onChanged={reload} onOpenPage={onOpenPage} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FilesManager({
  course,
  files,
  commentCountByFile,
  onChanged,
}: {
  course: ReviewCourse;
  files: ReviewFile[];
  commentCountByFile: Map<string, number>;
  onChanged: () => Promise<void>;
}) {
  const uploadRef = useRef<HTMLInputElement>(null);
  const replacePdfRef = useRef<HTMLInputElement>(null);
  const replaceVideoRef = useRef<HTMLInputElement>(null);
  const [replaceTarget, setReplaceTarget] = useState<ReviewFile | null>(null);
  const [toDelete, setToDelete] = useState<ReviewFile | null>(null);
  const [busyMsg, setBusyMsg] = useState<string | null>(null);

  // Per-file cap on the Pro plan (bucket is configured to match).
  const MAX_UPLOAD_BYTES = 2 * 1024 * 1024 * 1024;
  const tooBig = (f: File) => {
    if (f.size <= MAX_UPLOAD_BYTES) return false;
    toast.error(
      `"${f.name}" is over the 2 GB limit (${Math.round(f.size / 1024 / 1024)} MB).`,
    );
    return true;
  };

  const doUpload = async (list: FileList | null) => {
    if (!list || list.length === 0) return;
    for (const f of Array.from(list)) {
      const isPdf = /\.pdf$/i.test(f.name);
      const isMp4 = /\.mp4$/i.test(f.name);
      if (!isPdf && !isMp4) {
        toast.error(`"${f.name}" is not a PDF or an MP4 video.`);
        continue;
      }
      if (tooBig(f)) continue;
      setBusyMsg(`Uploading "${f.name}"…`);
      try {
        if (isMp4) {
          const duration = await getVideoDuration(f);
          await uploadCourseFile(course.id, f, { kind: "video", durationSeconds: duration });
          toast.success(`"${f.name}" uploaded (video, ${formatTime(duration)}).`);
        } else {
          const pages = await countPdfPages(f);
          await uploadCourseFile(course.id, f, { kind: "pdf", pageCount: pages });
          toast.success(`"${f.name}" uploaded (${pages} pages).`);
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : `Failed to upload "${f.name}".`);
      }
    }
    setBusyMsg(null);
    await onChanged();
  };

  const doReplace = async (list: FileList | null) => {
    const target = replaceTarget;
    setReplaceTarget(null);
    const f = list?.[0];
    if (!f || !target) return;
    const wantVideo = target.kind === "video";
    if (wantVideo ? !/\.mp4$/i.test(f.name) : !/\.pdf$/i.test(f.name)) {
      toast.error(
        wantVideo
          ? "Choose an MP4 video — this lesson is a video."
          : "Choose a PDF file — this lesson is a slide deck.",
      );
      return;
    }
    if (tooBig(f)) return;
    setBusyMsg(`Replacing "${target.name}"…`);
    try {
      if (wantVideo) {
        const duration = await getVideoDuration(f);
        await replaceFile(target, f, { kind: "video", durationSeconds: duration });
      } else {
        const pages = await countPdfPages(f);
        await replaceFile(target, f, { kind: "pdf", pageCount: pages });
      }
      toast.success(`"${target.name}" replaced — all comments were kept.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to replace the file.");
    } finally {
      setBusyMsg(null);
      await onChanged();
    }
  };

  return (
    <>
      <input
        ref={uploadRef}
        type="file"
        accept="application/pdf,.pdf,video/mp4,.mp4"
        multiple
        className="hidden"
        onChange={(e) => {
          void doUpload(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={replacePdfRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => {
          void doReplace(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={replaceVideoRef}
        type="file"
        accept="video/mp4,.mp4"
        className="hidden"
        onChange={(e) => {
          void doReplace(e.target.files);
          e.target.value = "";
        }}
      />

      <div className="flex items-center gap-3">
        <Button className="gap-1.5 font-black" style={{ background: NAVY }} disabled={!!busyMsg} onClick={() => uploadRef.current?.click()}>
          <FilePlus2 size={15} /> Upload PDF / MP4
        </Button>
        {busyMsg && <span className="text-[13px] font-semibold text-muted-foreground">{busyMsg}</span>}
      </div>
      <p className="mt-2 text-[12px] text-muted-foreground">
        Slides go up as PDF (comments per page) and lesson videos as MP4 (comments pinned to the
        video time). Files up to 2 GB — large videos may take a few minutes to upload, keep the
        tab open until the confirmation appears.
      </p>

      {files.length === 0 && (
        <Card className="mt-5 border-dashed">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No files in this folder yet. Upload the material as PDF or MP4 — reviewers can comment
            on every page (and on any moment of a video).
          </CardContent>
        </Card>
      )}

      <div className="mt-4 space-y-2">
        {files.map((f, i) => (
          <div key={f.id} className="flex flex-wrap items-center gap-2 rounded-xl border bg-white p-3 shadow-sm">
            <span className="w-6 text-center text-[12px] font-black text-muted-foreground">{i + 1}</span>
            {f.kind === "video" ? (
              <Film size={16} className="shrink-0" style={{ color: GOLD }} />
            ) : (
              <FileText size={16} className="shrink-0" style={{ color: GOLD }} />
            )}
            <InlineRename
              value={f.name}
              onSave={async (name) => {
                await renameFile(f.id, name);
                await onChanged();
              }}
              className="min-w-[160px] flex-1 text-[14px] font-bold"
            />
            <Badge variant="outline" className="text-[11px] font-bold text-muted-foreground">
              {f.kind === "video" ? `video · ${formatTime(f.duration_seconds)}` : `${f.page_count} pages`}
            </Badge>
            <Badge
              variant="outline"
              className="gap-1 text-[11px] font-bold"
              style={(commentCountByFile.get(f.id) ?? 0) > 0 ? { color: GREEN, borderColor: GREEN } : { color: "#a8a29a" }}
            >
              <MessageSquare size={11} /> {commentCountByFile.get(f.id) ?? 0}
            </Badge>
            <div className="ml-auto flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" title="Move up" disabled={i === 0}
                onClick={() => moveFile(files, f.id, -1).then(onChanged).catch((e) => toast.error(String(e.message ?? e)))}>
                <ArrowUp size={15} />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" title="Move down" disabled={i === files.length - 1}
                onClick={() => moveFile(files, f.id, 1).then(onChanged).catch((e) => toast.error(String(e.message ?? e)))}>
                <ArrowDown size={15} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1 text-[12px] font-bold"
                title="Replace the file keeping all comments"
                onClick={() => {
                  setReplaceTarget(f);
                  (f.kind === "video" ? replaceVideoRef : replacePdfRef).current?.click();
                }}
              >
                <RefreshCcw size={13} /> Replace
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600" title="Delete file" onClick={() => setToDelete(f)}>
                <Trash2 size={15} />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={!!toDelete}
        title={`Delete "${toDelete?.name}"?`}
        description="The file and the comments made on it will be permanently deleted. To swap the file without losing comments, use “Replace”."
        confirmLabel="Delete file"
        onCancel={() => setToDelete(null)}
        onConfirm={async () => {
          if (!toDelete) return;
          await deleteFile(toDelete);
          setToDelete(null);
          await onChanged();
          toast.success("File deleted.");
        }}
      />
    </>
  );
}

function CourseCommentsList({
  files,
  comments,
  onChanged,
  onOpenPage,
}: {
  files: ReviewFile[];
  comments: ReviewComment[];
  onChanged: () => Promise<void>;
  onOpenPage: (fileId: string, page: number, time?: number) => void;
}) {
  if (comments.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No comments in this course yet.
        </CardContent>
      </Card>
    );
  }
  const byFile = new Map<string, ReviewComment[]>();
  for (const c of comments) {
    const list = byFile.get(c.file_id) ?? [];
    list.push(c);
    byFile.set(c.file_id, list);
  }
  const orderedFileIds = [
    ...files.map((f) => f.id).filter((id) => byFile.has(id)),
    ...Array.from(byFile.keys()).filter((id) => !files.some((f) => f.id === id)),
  ];
  return (
    <div className="space-y-5">
      <p className="text-[12px] text-muted-foreground">
        Click a comment to reply — the reviewer will see your message when they sign in. Use
        “Open page” / “Open video” to see the exact slide or moment the person is talking about.
      </p>
      {orderedFileIds.map((fid) => {
        const f = files.find((x) => x.id === fid);
        const isVideo = f?.kind === "video";
        const list = (byFile.get(fid) ?? []).slice().sort((a, b) =>
          isVideo
            ? (a.time_seconds ?? 0) - (b.time_seconds ?? 0) ||
              a.created_at.localeCompare(b.created_at)
            : a.page_number - b.page_number || a.created_at.localeCompare(b.created_at),
        );
        return (
          <div key={fid}>
            <h3 className="mb-2 flex items-center gap-1.5 text-[13px] font-black uppercase tracking-wide" style={{ color: NAVY }}>
              {isVideo ? (
                <Film size={14} style={{ color: GOLD }} />
              ) : (
                <FileText size={14} style={{ color: GOLD }} />
              )}{" "}
              {f?.name ?? "Deleted file"}
            </h3>
            <div className="space-y-2">
              {list.map((c) => (
                <CommentCard
                  key={c.id}
                  comment={c}
                  isAdmin
                  email=""
                  context={
                    isVideo
                      ? `At ${formatTime(c.time_seconds)} · ${nameFromEmail(c.author_email)} (${c.author_email})`
                      : `Page ${c.page_number} · ${nameFromEmail(c.author_email)} (${c.author_email})`
                  }
                  openLabel={isVideo ? "Open video" : "Open page"}
                  onChanged={onChanged}
                  onOpenPage={() =>
                    onOpenPage(c.file_id, c.page_number, isVideo ? (c.time_seconds ?? 0) : undefined)
                  }
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ────────────────────────────── reviewers ────────────────────────────── */

function ReviewersPanel({ courses }: { courses: ReviewCourse[] }) {
  const [reviewers, setReviewers] = useState<ReviewerEntry[] | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [codeInfo, setCodeInfo] = useState<{ email: string; code: string } | null>(null);
  const [toRemove, setToRemove] = useState<ReviewerEntry | null>(null);
  const [toReset, setToReset] = useState<ReviewerEntry | null>(null);
  const [toUnlock, setToUnlock] = useState<ReviewerEntry | null>(null);
  const [savingEmail, setSavingEmail] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setReviewers(await listReviewers());
    } catch (e) {
      setReviewers([]);
      toast.error(e instanceof Error ? e.message : "Failed to load reviewers.");
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  /** Tick/untick a course for a reviewer — applies immediately. */
  const toggleAccess = async (r: ReviewerEntry, courseId: string, on: boolean) => {
    const next = on ? [...r.courseIds, courseId] : r.courseIds.filter((id) => id !== courseId);
    setSavingEmail(r.email);
    setReviewers((list) =>
      (list ?? []).map((x) => (x.email === r.email ? { ...x, courseIds: next } : x)),
    );
    try {
      await upsertReviewer(r.email, next);
      const courseName = courses.find((c) => c.id === courseId)?.name ?? "course";
      toast.success(on ? `Access to "${courseName}" granted.` : `Access to "${courseName}" removed. Comments are kept.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update access.");
      await reload();
    } finally {
      setSavingEmail(null);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="max-w-[60ch] text-[13px] text-muted-foreground">
          Each reviewer signs in with their own email + an access code generated here, and the
          account only works on the <b>first computer</b> they use (unlock it here if they change
          machines). Tick or untick the course folders each person can see — changes apply
          instantly, and removing access never deletes the comments they already made.
        </p>
        <Button className="gap-1.5 font-black" style={{ background: NAVY }} onClick={() => setAddOpen(true)}>
          <UserPlus size={15} /> Add reviewer
        </Button>
      </div>

      {reviewers === null && (
        <p className="py-12 text-center text-sm font-semibold text-muted-foreground">Loading…</p>
      )}
      {reviewers !== null && reviewers.length === 0 && (
        <Card className="mt-5 border-dashed">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No reviewers yet. Add someone by email to share a course folder with them.
          </CardContent>
        </Card>
      )}

      <div className="mt-4 space-y-2">
        {(reviewers ?? []).map((r) => (
          <div key={r.email} className="rounded-xl border bg-white p-3 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[14px] font-black" style={{ color: NAVY }}>
                {nameFromEmail(r.email)}
              </span>
              <span className="text-[13px] text-muted-foreground">{r.email}</span>
              {r.access_code && (
                <button
                  className="flex items-center gap-1 rounded-md border bg-muted px-2 py-0.5 font-mono text-[12px] font-bold transition hover:border-[#A68A64]"
                  title="Copy access code"
                  onClick={() => {
                    void navigator.clipboard?.writeText(r.access_code ?? "");
                    toast.success("Code copied.");
                  }}
                >
                  <KeyRound size={12} /> {r.access_code} <Copy size={11} />
                </button>
              )}
              <div className="ml-auto flex items-center gap-1">
                {r.device_id && (
                  <Button variant="ghost" size="sm" className="gap-1 text-[12px] font-bold text-muted-foreground" title="Let this person use a different computer" onClick={() => setToUnlock(r)}>
                    <Unlock size={12} /> Unlock computer
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="gap-1 text-[12px] font-bold text-muted-foreground" title="Generate a new access code" onClick={() => setToReset(r)}>
                  <RefreshCcw size={12} /> New code
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600" title="Remove this person entirely" onClick={() => setToRemove(r)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
            <p className="mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
              <Monitor size={12} />
              {r.device_id
                ? `Locked to 1 computer (registered ${formatStamp(r.device_registered_at ?? r.created_at)})${r.last_seen_ip ? ` · last IP ${r.last_seen_ip}` : ""}`
                : "Computer not registered yet — the first sign-in locks the account to that machine"}
            </p>
            {/* tick/untick access per course folder — applies instantly */}
            <div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-2 border-t pt-2.5">
              {courses.length === 0 && (
                <span className="text-[12px] italic text-muted-foreground">Create a course folder first.</span>
              )}
              {courses.map((c) => {
                const on = r.courseIds.includes(c.id);
                return (
                  <label
                    key={c.id}
                    className="flex cursor-pointer items-center gap-1.5 text-[13px] font-semibold"
                    style={{ color: on ? NAVY : "#8a8478" }}
                  >
                    <Checkbox
                      checked={on}
                      disabled={savingEmail === r.email}
                      onCheckedChange={(v) => void toggleAccess(r, c.id, v === true)}
                    />
                    <Folder size={13} style={{ color: on ? GOLD : "#c9c4ba" }} />
                    {c.name}
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <AddReviewerDialog
        open={addOpen}
        courses={courses}
        onClose={() => setAddOpen(false)}
        onAdded={async (email, code) => {
          setAddOpen(false);
          await reload();
          if (code) setCodeInfo({ email, code });
        }}
      />

      {/* share the generated access code */}
      <Dialog open={!!codeInfo} onOpenChange={(v) => !v && setCodeInfo(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reviewer added</DialogTitle>
            <DialogDescription>
              Share these details with the person — this is how they sign in.
            </DialogDescription>
          </DialogHeader>
          {codeInfo && (
            <div className="space-y-2 rounded-lg border bg-muted/50 p-4 text-center">
              <p className="text-[13px] font-semibold">{codeInfo.email}</p>
              <p className="font-mono text-2xl font-black tracking-[0.2em]" style={{ color: NAVY }}>
                {codeInfo.code}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 font-bold"
                onClick={() => {
                  void navigator.clipboard?.writeText(
                    `369 Alliance course review access\nLink: ${window.location.origin}/review\nEmail: ${codeInfo.email}\nAccess code: ${codeInfo.code}`,
                  );
                  toast.success("Instructions copied.");
                }}
              >
                <Copy size={13} /> Copy access instructions
              </Button>
            </div>
          )}
          <DialogFooter>
            <Button style={{ background: NAVY }} onClick={() => setCodeInfo(null)}>
              <Check size={15} className="mr-1" /> Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!toUnlock}
        title={`Unlock the computer for ${toUnlock?.email}?`}
        description="They will be able to sign in on a different computer — the next computer they use becomes the new registered one."
        confirmLabel="Unlock"
        destructive={false}
        onCancel={() => setToUnlock(null)}
        onConfirm={async () => {
          if (!toUnlock) return;
          await unlockDevice(toUnlock.email);
          setToUnlock(null);
          await reload();
          toast.success("Unlocked. Their next sign-in registers the new computer.");
        }}
      />

      <ConfirmDialog
        open={!!toReset}
        title={`Generate a new code for ${toReset?.email}?`}
        description="The current code stops working immediately. Share the new code with the person."
        confirmLabel="Generate new code"
        destructive={false}
        onCancel={() => setToReset(null)}
        onConfirm={async () => {
          if (!toReset) return;
          const res = await resetReviewerCode(toReset.email);
          setToReset(null);
          await reload();
          setCodeInfo({ email: toReset.email, code: res.accessCode });
        }}
      />

      <ConfirmDialog
        open={!!toRemove}
        title={`Remove ${toRemove?.email}?`}
        description="They will no longer be able to sign in or see any course. The comments they already made are kept. (To just hide a course, untick it instead.)"
        confirmLabel="Remove person"
        onCancel={() => setToRemove(null)}
        onConfirm={async () => {
          if (!toRemove) return;
          await removeReviewer(toRemove.email);
          setToRemove(null);
          await reload();
          toast.success("Access removed. Comments preserved.");
        }}
      />
    </>
  );
}

function AddReviewerDialog({
  open,
  courses,
  onClose,
  onAdded,
}: {
  open: boolean;
  courses: ReviewCourse[];
  onClose: () => void;
  onAdded: (email: string, code: string | null) => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [courseIds, setCourseIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setEmail("");
      setCourseIds([]);
    }
  }, [open]);

  const valid = /.+@.+\..+/.test(email.trim());

  const submit = async () => {
    setBusy(true);
    try {
      const res = await upsertReviewer(email.trim().toLowerCase(), courseIds);
      await onAdded(email.trim().toLowerCase(), res.accessCode ?? null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add the reviewer.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add reviewer</DialogTitle>
          <DialogDescription>
            Only folder names are listed here — the lessons (PDFs and videos) live inside each
            folder.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="rev-email">Reviewer email</Label>
            <Input
              id="rev-email"
              type="email"
              placeholder="colleague@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Course folders this email can see</Label>
            {courses.length === 0 && (
              <p className="text-[12px] italic text-muted-foreground">Create a course folder first.</p>
            )}
            <div className="max-h-56 space-y-1.5 overflow-y-auto rounded-md border p-2.5">
              {courses.map((c) => {
                const on = courseIds.includes(c.id);
                return (
                  <label key={c.id} className="flex cursor-pointer items-center gap-2 text-[13px] font-semibold">
                    <Checkbox
                      checked={on}
                      onCheckedChange={(v) =>
                        setCourseIds(v === true ? [...courseIds, c.id] : courseIds.filter((x) => x !== c.id))
                      }
                    />
                    <Folder size={14} style={{ color: on ? GOLD : "#c9c4ba" }} />
                    {c.name}
                  </label>
                );
              })}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            <X size={14} className="mr-1" /> Cancel
          </Button>
          <Button
            className="gap-1.5 font-black"
            style={{ background: NAVY }}
            disabled={busy || !valid}
            onClick={() => void submit()}
          >
            <Plus size={15} /> {busy ? "Adding…" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────────────────── small shared bits ───────────────────────── */

function InlineRename({
  value,
  onSave,
  className,
}: {
  value: string;
  onSave: (name: string) => Promise<void>;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value);
  const save = async () => {
    const t = text.trim();
    setEditing(false);
    if (!t || t === value) {
      setText(value);
      return;
    }
    try {
      await onSave(t);
      toast.success("Renamed.");
    } catch (e) {
      setText(value);
      toast.error(e instanceof Error ? e.message : "Failed to rename.");
    }
  };
  if (editing) {
    return (
      <Input
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => void save()}
        onKeyDown={(e) => {
          if (e.key === "Enter") void save();
          if (e.key === "Escape") {
            setText(value);
            setEditing(false);
          }
        }}
        className={`h-8 ${className ?? ""}`}
      />
    );
  }
  return (
    <button
      className={`group flex items-center gap-1.5 truncate text-left ${className ?? ""}`}
      style={{ color: NAVY }}
      title="Click to rename"
      onClick={() => {
        setText(value);
        setEditing(true);
      }}
    >
      <span className="truncate">{value}</span>
      <Pencil size={12} className="shrink-0 opacity-0 transition group-hover:opacity-60" />
    </button>
  );
}

function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  destructive = true,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <Dialog open={open} onOpenChange={(v) => !v && !busy && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" disabled={busy} onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant={destructive ? "destructive" : "default"}
            style={destructive ? undefined : { background: NAVY }}
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onConfirm();
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "The operation failed.");
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Please wait…" : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
