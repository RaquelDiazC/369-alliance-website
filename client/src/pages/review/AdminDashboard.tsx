/**
 * Course Review Platform — admin dashboard.
 *
 * "Cursos": course folders with the PDF manager (upload, rename, reorder,
 * delete, replace) and the full comment overview with inline feedback.
 * "Revisores": which email can open which course folder — add/edit/remove
 * access (comments always survive), access codes to share, code reset.
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
  FolderPlus,
  KeyRound,
  MessageSquare,
  Pencil,
  Plus,
  RefreshCcw,
  Trash2,
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
  createCourse,
  deleteCourse,
  deleteFile,
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
import { GOLD, NAVY } from "./ReviewPlatform";

export default function AdminDashboard({
  onOpenCourse,
}: {
  onOpenCourse: (courseId: string) => void;
}) {
  const [courses, setCourses] = useState<ReviewCourse[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState<ReviewCourse | null>(null);

  const reloadCourses = useCallback(async () => {
    try {
      const cs = await listCourses();
      setCourses(cs);
      setSelected((cur) => (cur ? (cs.find((c) => c.id === cur.id) ?? null) : null));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao carregar cursos.");
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
        course={selected}
        onBack={() => setSelected(null)}
        onOpenViewer={() => onOpenCourse(selected.id)}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 py-8">
      <Tabs defaultValue="courses">
        <TabsList>
          <TabsTrigger value="courses" className="gap-1.5 font-bold">
            <FileText size={15} /> Cursos
          </TabsTrigger>
          <TabsTrigger value="reviewers" className="gap-1.5 font-bold">
            <Users size={15} /> Revisores
          </TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="pt-4">
          <CoursesPanel
            courses={courses}
            loaded={loaded}
            onChanged={reloadCourses}
            onSelect={setSelected}
            onOpenViewer={onOpenCourse}
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
  loaded,
  onChanged,
  onSelect,
  onOpenViewer,
}: {
  courses: ReviewCourse[];
  loaded: boolean;
  onChanged: () => Promise<void>;
  onSelect: (c: ReviewCourse) => void;
  onOpenViewer: (id: string) => void;
}) {
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const [toDelete, setToDelete] = useState<ReviewCourse | null>(null);

  const create = async () => {
    const n = newName.trim();
    if (!n) return;
    setBusy(true);
    try {
      await createCourse(n);
      setNewName("");
      await onChanged();
      toast.success("Curso criado.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao criar curso.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Nome do novo curso (pasta)…"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void create()}
          className="max-w-sm"
        />
        <Button className="gap-1.5 font-black" style={{ background: NAVY }} disabled={busy || !newName.trim()} onClick={() => void create()}>
          <FolderPlus size={15} /> Criar curso
        </Button>
      </div>

      {loaded && courses.length === 0 && (
        <Card className="mt-6 border-dashed">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Crie a primeira pasta de curso para começar a subir os PDFs.
          </CardContent>
        </Card>
      )}

      <div className="mt-5 space-y-2">
        {courses.map((c, i) => (
          <div key={c.id} className="flex items-center gap-2 rounded-xl border bg-white p-3 shadow-sm">
            <span className="w-6 text-center text-[12px] font-black text-muted-foreground">{i + 1}</span>
            <InlineRename
              value={c.name}
              onSave={async (name) => {
                await renameCourse(c.id, name);
                await onChanged();
              }}
              className="min-w-0 flex-1 text-[15px] font-black"
            />
            <Button variant="ghost" size="icon" className="h-8 w-8" title="Mover para cima" disabled={i === 0}
              onClick={() => moveCourse(courses, c.id, -1).then(onChanged).catch((e) => toast.error(String(e.message ?? e)))}>
              <ArrowUp size={15} />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" title="Mover para baixo" disabled={i === courses.length - 1}
              onClick={() => moveCourse(courses, c.id, 1).then(onChanged).catch((e) => toast.error(String(e.message ?? e)))}>
              <ArrowDown size={15} />
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 font-bold" onClick={() => onSelect(c)}>
              <FileText size={14} /> Arquivos & comentários
            </Button>
            <Button size="sm" className="gap-1.5 font-bold" style={{ background: NAVY }} onClick={() => onOpenViewer(c.id)}>
              <Eye size={14} /> Abrir
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600" title="Apagar curso" onClick={() => setToDelete(c)}>
              <Trash2 size={15} />
            </Button>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={!!toDelete}
        title={`Apagar o curso "${toDelete?.name}"?`}
        description="Todos os PDFs e comentários deste curso serão apagados de forma definitiva."
        confirmLabel="Apagar curso"
        onCancel={() => setToDelete(null)}
        onConfirm={async () => {
          if (!toDelete) return;
          await deleteCourse(toDelete);
          setToDelete(null);
          await onChanged();
          toast.success("Curso apagado.");
        }}
      />
    </>
  );
}

/* ──────────────────────────── course detail ──────────────────────────── */

function CourseDetail({
  course,
  onBack,
  onOpenViewer,
}: {
  course: ReviewCourse;
  onBack: () => void;
  onOpenViewer: () => void;
}) {
  const [files, setFiles] = useState<ReviewFile[]>([]);
  const [comments, setComments] = useState<ReviewComment[]>([]);

  const reload = useCallback(async () => {
    try {
      const [fs, cs] = await Promise.all([listFiles(course.id), listCourseComments(course.id)]);
      setFiles(fs);
      setComments(cs);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao carregar o curso.");
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
          <ArrowLeft size={15} /> Todos os cursos
        </Button>
        <h1 className="text-xl font-black tracking-tight" style={{ color: NAVY }}>
          {course.name}
        </h1>
        <Button size="sm" className="ml-auto gap-1.5 font-bold" style={{ background: NAVY }} onClick={onOpenViewer}>
          <Eye size={14} /> Abrir no visualizador
        </Button>
      </div>

      <Tabs defaultValue="files" className="mt-5">
        <TabsList>
          <TabsTrigger value="files" className="gap-1.5 font-bold">
            <FileText size={14} /> Arquivos ({files.length})
          </TabsTrigger>
          <TabsTrigger value="comments" className="gap-1.5 font-bold">
            <MessageSquare size={14} /> Comentários ({comments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="files" className="pt-4">
          <FilesManager course={course} files={files} commentCountByFile={commentCountByFile} onChanged={reload} />
        </TabsContent>

        <TabsContent value="comments" className="pt-4">
          <CourseCommentsList files={files} comments={comments} onChanged={reload} />
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
  const replaceRef = useRef<HTMLInputElement>(null);
  const [replaceTarget, setReplaceTarget] = useState<ReviewFile | null>(null);
  const [toDelete, setToDelete] = useState<ReviewFile | null>(null);
  const [busyMsg, setBusyMsg] = useState<string | null>(null);

  const doUpload = async (list: FileList | null) => {
    if (!list || list.length === 0) return;
    for (const f of Array.from(list)) {
      if (!/\.pdf$/i.test(f.name)) {
        toast.error(`"${f.name}" não é um PDF.`);
        continue;
      }
      setBusyMsg(`Enviando "${f.name}"…`);
      try {
        const pages = await countPdfPages(f);
        await uploadCourseFile(course.id, f, pages);
        toast.success(`"${f.name}" enviado (${pages} folhas).`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : `Erro ao enviar "${f.name}".`);
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
    if (!/\.pdf$/i.test(f.name)) {
      toast.error("Escolha um arquivo PDF.");
      return;
    }
    setBusyMsg(`Substituindo "${target.name}"…`);
    try {
      const pages = await countPdfPages(f);
      await replaceFile(target, f, pages);
      toast.success(`"${target.name}" substituído — os comentários foram mantidos.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao substituir o arquivo.");
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
        accept="application/pdf,.pdf"
        multiple
        className="hidden"
        onChange={(e) => {
          void doUpload(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={replaceRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => {
          void doReplace(e.target.files);
          e.target.value = "";
        }}
      />

      <div className="flex items-center gap-3">
        <Button className="gap-1.5 font-black" style={{ background: NAVY }} disabled={!!busyMsg} onClick={() => uploadRef.current?.click()}>
          <FilePlus2 size={15} /> Subir PDF(s)
        </Button>
        {busyMsg && <span className="text-[13px] font-semibold text-muted-foreground">{busyMsg}</span>}
      </div>

      {files.length === 0 && (
        <Card className="mt-5 border-dashed">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Nenhum PDF neste curso ainda. Suba o material em PDF — cada folha (página) poderá ser
            comentada pelos revisores.
          </CardContent>
        </Card>
      )}

      <div className="mt-4 space-y-2">
        {files.map((f, i) => (
          <div key={f.id} className="flex flex-wrap items-center gap-2 rounded-xl border bg-white p-3 shadow-sm">
            <span className="w-6 text-center text-[12px] font-black text-muted-foreground">{i + 1}</span>
            <FileText size={16} className="shrink-0" style={{ color: GOLD }} />
            <InlineRename
              value={f.name}
              onSave={async (name) => {
                await renameFile(f.id, name);
                await onChanged();
              }}
              className="min-w-[160px] flex-1 text-[14px] font-bold"
            />
            <Badge variant="outline" className="text-[11px] font-bold text-muted-foreground">
              {f.page_count} folhas
            </Badge>
            <Badge variant="outline" className="gap-1 text-[11px] font-bold text-muted-foreground">
              <MessageSquare size={11} /> {commentCountByFile.get(f.id) ?? 0}
            </Badge>
            <div className="ml-auto flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" title="Mover para cima" disabled={i === 0}
                onClick={() => moveFile(files, f.id, -1).then(onChanged).catch((e) => toast.error(String(e.message ?? e)))}>
                <ArrowUp size={15} />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" title="Mover para baixo" disabled={i === files.length - 1}
                onClick={() => moveFile(files, f.id, 1).then(onChanged).catch((e) => toast.error(String(e.message ?? e)))}>
                <ArrowDown size={15} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1 text-[12px] font-bold"
                title="Substituir o PDF mantendo os comentários"
                onClick={() => {
                  setReplaceTarget(f);
                  replaceRef.current?.click();
                }}
              >
                <RefreshCcw size={13} /> Substituir
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600" title="Apagar arquivo" onClick={() => setToDelete(f)}>
                <Trash2 size={15} />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={!!toDelete}
        title={`Apagar "${toDelete?.name}"?`}
        description="O PDF e os comentários feitos nele serão apagados de forma definitiva. Para trocar o arquivo sem perder comentários, use “Substituir”."
        confirmLabel="Apagar arquivo"
        onCancel={() => setToDelete(null)}
        onConfirm={async () => {
          if (!toDelete) return;
          await deleteFile(toDelete);
          setToDelete(null);
          await onChanged();
          toast.success("Arquivo apagado.");
        }}
      />
    </>
  );
}

function CourseCommentsList({
  files,
  comments,
  onChanged,
}: {
  files: ReviewFile[];
  comments: ReviewComment[];
  onChanged: () => Promise<void>;
}) {
  if (comments.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Nenhum comentário neste curso ainda.
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
        Clique em um comentário para responder — a pessoa verá a sua mensagem ao entrar no sistema.
      </p>
      {orderedFileIds.map((fid) => {
        const f = files.find((x) => x.id === fid);
        const list = (byFile.get(fid) ?? []).slice().sort(
          (a, b) => a.page_number - b.page_number || a.created_at.localeCompare(b.created_at),
        );
        return (
          <div key={fid}>
            <h3 className="mb-2 flex items-center gap-1.5 text-[13px] font-black uppercase tracking-wide" style={{ color: NAVY }}>
              <FileText size={14} style={{ color: GOLD }} /> {f?.name ?? "Arquivo removido"}
            </h3>
            <div className="space-y-2">
              {list.map((c) => (
                <CommentCard
                  key={c.id}
                  comment={c}
                  isAdmin
                  email=""
                  context={`Folha ${c.page_number} · ${nameFromEmail(c.author_email)} (${c.author_email})`}
                  onChanged={onChanged}
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
  const [editor, setEditor] = useState<{ email: string; courseIds: string[]; isNew: boolean } | null>(null);
  const [codeInfo, setCodeInfo] = useState<{ email: string; code: string } | null>(null);
  const [toRemove, setToRemove] = useState<ReviewerEntry | null>(null);
  const [toReset, setToReset] = useState<ReviewerEntry | null>(null);

  const reload = useCallback(async () => {
    try {
      setReviewers(await listReviewers());
    } catch (e) {
      setReviewers([]);
      toast.error(e instanceof Error ? e.message : "Erro ao carregar revisores.");
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const courseName = (id: string) => courses.find((c) => c.id === id)?.name ?? "—";

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="max-w-[60ch] text-[13px] text-muted-foreground">
          Cada revisor entra com o próprio email + um código de acesso gerado aqui. Você controla
          quais pastas de curso cada email pode ver. Remover uma pessoa nunca apaga os comentários
          que ela já fez.
        </p>
        <Button className="gap-1.5 font-black" style={{ background: NAVY }} onClick={() => setEditor({ email: "", courseIds: [], isNew: true })}>
          <UserPlus size={15} /> Adicionar revisor
        </Button>
      </div>

      {reviewers === null && (
        <p className="py-12 text-center text-sm font-semibold text-muted-foreground">Carregando…</p>
      )}
      {reviewers !== null && reviewers.length === 0 && (
        <Card className="mt-5 border-dashed">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Nenhum revisor cadastrado ainda.
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
                  title="Copiar código de acesso"
                  onClick={() => {
                    void navigator.clipboard?.writeText(r.access_code ?? "");
                    toast.success("Código copiado.");
                  }}
                >
                  <KeyRound size={12} /> {r.access_code} <Copy size={11} />
                </button>
              )}
              <div className="ml-auto flex items-center gap-1">
                <Button variant="outline" size="sm" className="gap-1 text-[12px] font-bold"
                  onClick={() => setEditor({ email: r.email, courseIds: r.courseIds, isNew: false })}>
                  <Pencil size={12} /> Editar acesso
                </Button>
                <Button variant="ghost" size="sm" className="gap-1 text-[12px] font-bold text-muted-foreground" title="Gerar um novo código de acesso" onClick={() => setToReset(r)}>
                  <RefreshCcw size={12} /> Novo código
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600" title="Remover acesso" onClick={() => setToRemove(r)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {r.courseIds.length === 0 && (
                <span className="text-[12px] italic text-muted-foreground">Sem cursos liberados</span>
              )}
              {r.courseIds.map((cid) => (
                <Badge key={cid} className="border-0 text-[11px] font-bold" style={{ background: "#efe9dd", color: NAVY }}>
                  {courseName(cid)}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* add / edit access */}
      <Dialog open={!!editor} onOpenChange={(v) => !v && setEditor(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editor?.isNew ? "Adicionar revisor" : `Acesso de ${editor?.email}`}</DialogTitle>
            <DialogDescription>
              Marque as pastas de curso que este email pode revisar.
            </DialogDescription>
          </DialogHeader>
          {editor && (
            <div className="space-y-4">
              {editor.isNew && (
                <div className="space-y-1.5">
                  <Label htmlFor="rev-email">Email do revisor</Label>
                  <Input
                    id="rev-email"
                    type="email"
                    placeholder="colega@exemplo.com"
                    value={editor.email}
                    onChange={(e) => setEditor({ ...editor, email: e.target.value })}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label>Cursos liberados</Label>
                {courses.length === 0 && (
                  <p className="text-[12px] italic text-muted-foreground">Crie um curso primeiro.</p>
                )}
                <div className="max-h-56 space-y-1.5 overflow-y-auto rounded-md border p-2.5">
                  {courses.map((c) => {
                    const on = editor.courseIds.includes(c.id);
                    return (
                      <label key={c.id} className="flex cursor-pointer items-center gap-2 text-[13px] font-semibold">
                        <Checkbox
                          checked={on}
                          onCheckedChange={(v) =>
                            setEditor({
                              ...editor,
                              courseIds: v === true
                                ? [...editor.courseIds, c.id]
                                : editor.courseIds.filter((x) => x !== c.id),
                            })
                          }
                        />
                        {c.name}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditor(null)}>
              <X size={14} className="mr-1" /> Cancelar
            </Button>
            <SubmitReviewerButton
              editor={editor}
              onDone={async (email, code, isNew) => {
                setEditor(null);
                await reload();
                if (isNew && code) setCodeInfo({ email, code });
                else toast.success("Acesso atualizado.");
              }}
            />
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* share the generated access code */}
      <Dialog open={!!codeInfo} onOpenChange={(v) => !v && setCodeInfo(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Revisor adicionado</DialogTitle>
            <DialogDescription>
              Compartilhe estes dados com a pessoa — é com eles que ela entra no sistema.
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
                    `Acesso à revisão de cursos 369 Alliance\nLink: ${window.location.origin}/review\nEmail: ${codeInfo.email}\nCódigo de acesso: ${codeInfo.code}`,
                  );
                  toast.success("Instruções copiadas.");
                }}
              >
                <Copy size={13} /> Copiar instruções de acesso
              </Button>
            </div>
          )}
          <DialogFooter>
            <Button style={{ background: NAVY }} onClick={() => setCodeInfo(null)}>
              <Check size={15} className="mr-1" /> Entendi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!toReset}
        title={`Gerar novo código para ${toReset?.email}?`}
        description="O código atual deixa de funcionar na hora. Compartilhe o novo código com a pessoa."
        confirmLabel="Gerar novo código"
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
        title={`Remover o acesso de ${toRemove?.email}?`}
        description="A pessoa não conseguirá mais entrar nem ver nenhum curso. Os comentários que ela já fez são mantidos."
        confirmLabel="Remover acesso"
        onCancel={() => setToRemove(null)}
        onConfirm={async () => {
          if (!toRemove) return;
          await removeReviewer(toRemove.email);
          setToRemove(null);
          await reload();
          toast.success("Acesso removido. Comentários preservados.");
        }}
      />
    </>
  );
}

function SubmitReviewerButton({
  editor,
  onDone,
}: {
  editor: { email: string; courseIds: string[]; isNew: boolean } | null;
  onDone: (email: string, code: string | null, isNew: boolean) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  if (!editor) return null;
  const valid = /.+@.+\..+/.test(editor.email.trim());
  return (
    <Button
      className="gap-1.5 font-black"
      style={{ background: NAVY }}
      disabled={busy || !valid}
      onClick={async () => {
        setBusy(true);
        try {
          const res = await upsertReviewer(editor.email.trim().toLowerCase(), editor.courseIds);
          await onDone(editor.email.trim().toLowerCase(), res.accessCode ?? null, editor.isNew);
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Erro ao salvar revisor.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <Plus size={15} /> {busy ? "Salvando…" : editor.isNew ? "Adicionar" : "Salvar acesso"}
    </Button>
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
      toast.success("Renomeado.");
    } catch (e) {
      setText(value);
      toast.error(e instanceof Error ? e.message : "Erro ao renomear.");
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
      title="Clique para renomear"
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
            Cancelar
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
                toast.error(e instanceof Error ? e.message : "A operação falhou.");
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Aguarde…" : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
