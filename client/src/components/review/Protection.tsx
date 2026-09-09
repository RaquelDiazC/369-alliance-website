/**
 * Course Review Platform — content protection layer.
 *
 * Best-effort, defence-in-depth blocking for reviewers:
 *  · text selection, copy/cut, right-click and drag are disabled;
 *  · Ctrl/Cmd +P/S/C/X/U and DevTools shortcuts are swallowed;
 *  · printing renders a blank page (CSS kill + beforeprint blackout);
 *  · PrintScreen and focus-loss (snipping tools steal focus) black the
 *    screen out with "Não autorizado screenshot";
 *  · every slide is watermarked with the signed-in reviewer's email.
 *
 * A browser cannot fully forbid OS-level captures (e.g. photographing the
 * monitor); the watermark exists so any leaked image identifies its source.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Ban } from "lucide-react";

const BLOCKED_KEYS = new Set(["p", "s", "c", "x", "u", "g"]);

export function ProtectionShield({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  const [blackout, setBlackout] = useState<null | "screenshot" | "blur">(null);
  const timerRef = useRef<number | null>(null);

  const flashScreenshot = useCallback(() => {
    setBlackout("screenshot");
    try {
      // Best effort: replace whatever PrintScreen put on the clipboard.
      void navigator.clipboard?.writeText("Screenshot not authorized");
    } catch {
      /* clipboard may be unavailable — the overlay still shows */
    }
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setBlackout(null), 3000);
  }, []);

  useEffect(() => {
    if (!active) return;

    const stop = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && BLOCKED_KEYS.has(k)) stop(e);
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && ["i", "j", "c", "s"].includes(k)) stop(e);
      if (e.key === "F12") stop(e);
      if (e.key === "PrintScreen") {
        stop(e);
        flashScreenshot();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      // Windows only delivers PrintScreen reliably on keyup.
      if (e.key === "PrintScreen") flashScreenshot();
    };
    const onBlur = () => setBlackout((b) => (b === "screenshot" ? b : "blur"));
    const onFocus = () => setBlackout((b) => (b === "blur" ? null : b));
    const onVisibility = () => {
      if (document.visibilityState === "hidden") onBlur();
      else onFocus();
    };
    const onBeforePrint = (e: Event) => {
      stop(e);
      flashScreenshot();
    };

    document.addEventListener("contextmenu", stop, true);
    document.addEventListener("copy", stop, true);
    document.addEventListener("cut", stop, true);
    document.addEventListener("dragstart", stop, true);
    document.addEventListener("selectstart", stop, true);
    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("keyup", onKeyUp, true);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    window.addEventListener("beforeprint", onBeforePrint);
    return () => {
      document.removeEventListener("contextmenu", stop, true);
      document.removeEventListener("copy", stop, true);
      document.removeEventListener("cut", stop, true);
      document.removeEventListener("dragstart", stop, true);
      document.removeEventListener("selectstart", stop, true);
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("keyup", onKeyUp, true);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("beforeprint", onBeforePrint);
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [active, flashScreenshot]);

  return (
    <div className={active ? "select-none" : undefined} style={active ? { WebkitUserSelect: "none", userSelect: "none" } : undefined}>
      {active && (
        <style>{`
          @media print {
            body * { display: none !important; visibility: hidden !important; }
            body::after {
              content: "Printing is not authorized — 369 Alliance Course Review";
              display: block !important; visibility: visible !important;
              padding: 40px; font-family: sans-serif; font-weight: 700;
            }
          }
        `}</style>
      )}
      {children}
      {active && blackout && (
        <div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-4 bg-black"
          aria-live="assertive"
        >
          {blackout === "screenshot" ? (
            <>
              <Ban size={56} className="text-red-500" />
              <p className="px-6 text-center text-2xl font-black text-white">
                Screenshot not authorized
              </p>
              <p className="px-6 text-center text-sm text-white/50">
                This material is confidential and protected.
              </p>
            </>
          ) : (
            <p className="px-6 text-center text-lg font-bold text-white/70">
              Content hidden — return to this window to continue.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/** Faint repeated email watermark laid over every rendered slide. */
export function Watermark({ email }: { email: string }) {
  const stamp = useMemo(() => {
    const d = new Date();
    return `${email} · ${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  }, [email]);
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-10 flex flex-wrap items-center justify-center gap-x-16 gap-y-20 overflow-hidden"
    >
      {Array.from({ length: 24 }).map((_, i) => (
        <span
          key={i}
          className="whitespace-nowrap text-[13px] font-bold"
          style={{ transform: "rotate(-28deg)", color: "rgba(26,26,46,0.08)" }}
        >
          {stamp}
        </span>
      ))}
    </div>
  );
}
