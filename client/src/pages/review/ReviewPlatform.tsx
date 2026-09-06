/**
 * Course Review Platform — entry point (/review).
 *
 * Private tool for reviewing course material before publication:
 *  · Raquel (admin) organises course folders, uploads/reorders/replaces the
 *    slide PDFs, controls which reviewer email sees which course, reads every
 *    comment and answers each one with feedback;
 *  · reviewers sign in with email + access code, read the slides page by page
 *    and leave per-page comments only they (and the admin) can see.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { Bell, KeyRound, LogOut, MailOpen, MonitorX, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Logo369 } from "@/components/Logo369";
import { ProtectionShield } from "@/components/review/Protection";
import {
  formatStamp,
  formatTime,
  isAdminEmail,
  listUnreadMessages,
  markRepliesRead,
  nameFromEmail,
  registerDevice,
  signOut,
  type UnreadMessage,
} from "@/lib/review/api";
import { reviewDb } from "@/lib/review/supabase";

import AdminDashboard from "./AdminDashboard";
import CourseViewer from "./CourseViewer";
import LoginView from "./LoginView";
import ReviewerHome from "./ReviewerHome";

export const NAVY = "#1a1a2e";
export const GOLD = "#A68A64";
export const AMBER = "#C07040";

export type ViewerTarget = { courseId: string; fileId?: string; page?: number; time?: number };
type View = { kind: "home" } | ({ kind: "viewer" } & ViewerTarget);

export default function ReviewPlatform() {
  const [booting, setBooting] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [roleReady, setRoleReady] = useState(false);
  const [deviceLocked, setDeviceLocked] = useState(false);
  const [view, setView] = useState<View>({ kind: "home" });

  const [unread, setUnread] = useState<UnreadMessage[]>([]);
  const [unreadOpen, setUnreadOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);

  const email = session?.user.email?.toLowerCase() ?? "";

  useEffect(() => {
    reviewDb.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setBooting(false);
    });
    const { data: sub } = reviewDb.auth.onAuthStateChange((_evt, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Resolve role + unread feedback whenever the signed-in user changes.
  useEffect(() => {
    let cancelled = false;
    setRoleReady(false);
    setDeviceLocked(false);
    setView({ kind: "home" });
    setUnread([]);
    if (!session) return;
    (async () => {
      try {
        const admin = await isAdminEmail();
        if (cancelled) return;
        setIsAdmin(admin);
        setRoleReady(true);
        if (!admin) {
          // Single-computer lock: the first browser used becomes the only one
          // allowed for this reviewer (fails open on network errors).
          try {
            const dev = await registerDevice();
            if (cancelled) return;
            if (dev.locked) {
              setDeviceLocked(true);
              return;
            }
          } catch {
            /* device check unavailable — do not lock the person out */
          }
          const msgs = await listUnreadMessages();
          if (cancelled) return;
          setUnread(msgs);
          if (msgs.length > 0) setUnreadOpen(true);
        }
      } catch (e) {
        if (!cancelled) {
          setIsAdmin(false);
          setRoleReady(true);
          toast.error(e instanceof Error ? e.message : "Failed to load your profile.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session?.user.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const refreshUnread = useCallback(async () => {
    if (!session || isAdmin) return;
    try {
      setUnread(await listUnreadMessages());
    } catch {
      /* non-fatal */
    }
  }, [session, isAdmin]);

  const openViewer = useCallback((target: ViewerTarget) => {
    setView({ kind: "viewer", ...target });
  }, []);
  const goHome = useCallback(() => {
    setView({ kind: "home" });
    void refreshUnread();
  }, [refreshUnread]);

  const openMessage = useCallback(
    async (m: UnreadMessage) => {
      setUnreadOpen(false);
      try {
        await markRepliesRead([m.reply.id]);
      } catch {
        /* non-fatal */
      }
      setUnread((u) => u.filter((x) => x.reply.id !== m.reply.id));
      openViewer({
        courseId: m.courseId,
        fileId: m.fileId,
        page: m.pageNumber,
        time: m.timeSeconds ?? undefined,
      });
    },
    [openViewer],
  );

  const markAllRead = useCallback(async () => {
    try {
      await markRepliesRead(unread.map((m) => m.reply.id));
      setUnread([]);
      setUnreadOpen(false);
      toast.success("Messages marked as read.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to mark as read.");
    }
  }, [unread]);

  const body = useMemo(() => {
    if (booting) return <CenterNote text="Loading…" />;
    if (!session) return <LoginView />;
    if (!roleReady) return <CenterNote text="Checking access…" />;
    if (!isAdmin && deviceLocked) return <DeviceLockScreen />;
    if (view.kind === "viewer") {
      return (
        <CourseViewer
          // Remount when the target changes so deep links (message → page or
          // video moment) also work while the viewer is already open.
          key={`${view.courseId}·${view.fileId ?? ""}·${view.page ?? ""}·${view.time ?? ""}`}
          courseId={view.courseId}
          initialFileId={view.fileId}
          initialPage={view.page}
          initialTime={view.time}
          isAdmin={isAdmin}
          email={email}
          onBack={goHome}
        />
      );
    }
    return isAdmin ? (
      <AdminDashboard onOpenViewer={openViewer} />
    ) : (
      <ReviewerHome onOpenCourse={(courseId) => openViewer({ courseId })} />
    );
  }, [booting, session, roleReady, deviceLocked, view, isAdmin, email, goHome, openViewer]);

  return (
    <ProtectionShield active={!!session && roleReady && !isAdmin}>
      <div className="flex min-h-screen flex-col" style={{ background: "#f6f5f2", color: NAVY }}>
        <header className="sticky top-0 z-40" style={{ background: NAVY }}>
          <div className="mx-auto flex w-full max-w-[1400px] items-center gap-3 px-4 py-3">
            <Logo369 size={30} variant="dark" />
            <div className="leading-tight">
              <p className="text-[14px] font-black tracking-tight text-white">Course Review</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: GOLD }}>
                369 Alliance · material under review
              </p>
            </div>
            {session && roleReady && (
              <div className="ml-auto flex items-center gap-2">
                {isAdmin ? (
                  <Badge className="gap-1 border-0 text-[10px] font-black uppercase" style={{ background: GOLD, color: NAVY }}>
                    <ShieldCheck size={12} /> Admin
                  </Badge>
                ) : (
                  <>
                    <Badge variant="outline" className="hidden border-white/25 text-[10px] font-bold text-white/80 sm:inline-flex">
                      Reviewer
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="relative text-white hover:bg-white/10 hover:text-white"
                      title="Messages from the admin"
                      onClick={() => {
                        void refreshUnread();
                        setUnreadOpen(true);
                      }}
                    >
                      <Bell size={17} />
                      {unread.length > 0 && (
                        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-black text-white" style={{ background: "#dc2626" }}>
                          {unread.length}
                        </span>
                      )}
                    </Button>
                  </>
                )}
                <span className="hidden max-w-[220px] truncate text-[12px] font-semibold text-white/70 md:inline">
                  {email}
                </span>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/10 hover:text-white"
                    title="Change my password"
                    onClick={() => setPwOpen(true)}
                  >
                    <KeyRound size={16} />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-white hover:bg-white/10 hover:text-white"
                  onClick={() => void signOut()}
                >
                  <LogOut size={15} /> Sign out
                </Button>
              </div>
            )}
          </div>
        </header>

        <main className="flex min-h-0 flex-1 flex-col">{body}</main>
      </div>

      {/* Feedback messages from the admin — shown on entry while unread. */}
      <Dialog open={unreadOpen} onOpenChange={setUnreadOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MailOpen size={18} style={{ color: AMBER }} />
              You have {unread.length} {unread.length === 1 ? "message" : "messages"} from the admin
            </DialogTitle>
            <DialogDescription>
              Replies to your comments. Click a message to open that exact page or video moment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {unread.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">No new messages.</p>
            )}
            {unread.map((m) => (
              <button
                key={m.reply.id}
                onClick={() => void openMessage(m)}
                className="w-full rounded-lg border p-3 text-left transition hover:border-[#A68A64] hover:bg-[#faf8f4]"
              >
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {m.fileName} ·{" "}
                  {m.timeSeconds != null ? `at ${formatTime(m.timeSeconds)}` : `page ${m.pageNumber}`}
                </p>
                <p className="mt-1 text-[13px]">
                  <span className="font-black">
                    {nameFromEmail(m.reply.author_email)} {formatStamp(m.reply.created_at)}
                  </span>
                  {" - "}
                  {m.reply.body}
                </p>
                <p className="mt-1 truncate text-[12px] italic text-muted-foreground">
                  Your comment: “{m.commentBody}”
                </p>
              </button>
            ))}
          </div>
          {unread.length > 0 && (
            <DialogFooter>
              <Button variant="outline" onClick={() => void markAllRead()}>
                Mark all as read
              </Button>
              <Button style={{ background: NAVY }} onClick={() => setUnreadOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      <ChangePasswordDialog open={pwOpen} onOpenChange={setPwOpen} />
    </ProtectionShield>
  );
}

function CenterNote({ text }: { text: string }) {
  return (
    <div className="flex flex-1 items-center justify-center py-24 text-sm font-semibold text-muted-foreground">
      {text}
    </div>
  );
}

/** Shown when a reviewer opens the platform on a second computer. */
function DeviceLockScreen() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-xl border bg-white p-8 text-center shadow-xl">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-600">
          <MonitorX size={22} className="text-white" />
        </div>
        <h1 className="mt-4 text-xl font-black" style={{ color: NAVY }}>
          Access locked to another computer
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          For security, this account only works on the computer where it was first used. If you
          changed computers, ask the admin to unlock your access and sign in again here.
        </p>
        <Button
          className="mt-5 gap-1.5 font-black"
          style={{ background: NAVY }}
          onClick={() => void signOut()}
        >
          <LogOut size={15} /> Sign out
        </Button>
      </div>
    </div>
  );
}

function ChangePasswordDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (pw.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setBusy(true);
    const { error } = await reviewDb.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password changed.");
    setPw("");
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Change my password</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="new-pw">New password</Label>
          <Input
            id="new-pw"
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="min. 8 characters"
          />
        </div>
        <DialogFooter>
          <Button disabled={busy} style={{ background: NAVY }} onClick={() => void save()}>
            {busy ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
