/**
 * Course Review Platform — sign-in screen.
 *
 * Reviewers enter the email + access code the admin shared with them.
 * The collapsible block at the bottom lets the admin create her own account
 * on first use (only works for the pre-registered admin email).
 */
import { useState } from "react";
import { ChevronDown, Lock, LogIn } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { bootstrapAdmin, signIn } from "@/lib/review/api";
import { GOLD, NAVY } from "./ReviewPlatform";

export default function LoginView() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const [setupOpen, setSetupOpen] = useState(false);
  const [setupEmail, setSetupEmail] = useState("");
  const [setupPw, setSetupPw] = useState("");
  const [setupPw2, setSetupPw2] = useState("");
  const [setupBusy, setSetupBusy] = useState(false);

  const doLogin = async () => {
    if (!email.trim() || !password) {
      toast.error("Enter your email and access code.");
      return;
    }
    setBusy(true);
    try {
      await signIn(email, password);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not sign you in.");
    } finally {
      setBusy(false);
    }
  };

  const doSetup = async () => {
    if (setupPw.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (setupPw !== setupPw2) {
      toast.error("Passwords do not match.");
      return;
    }
    setSetupBusy(true);
    try {
      await bootstrapAdmin(setupEmail, setupPw);
      toast.success("Admin account created. Signing in…");
      await signIn(setupEmail, setupPw);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create the account.");
    } finally {
      setSetupBusy(false);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-xl">
          <CardHeader className="pb-2">
            <div
              className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ background: NAVY }}
            >
              <Lock size={20} style={{ color: GOLD }} />
            </div>
            <CardTitle className="pt-2 text-center text-xl font-black" style={{ color: NAVY }}>
              Restricted access
            </CardTitle>
            <p className="text-center text-[13px] text-muted-foreground">
              Course material under review. Sign in with the email and access code you received.
            </p>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void doLogin()}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="login-pw">Access code / password</Label>
              <Input
                id="login-pw"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void doLogin()}
              />
            </div>
            <Button
              className="w-full gap-2 font-black"
              style={{ background: NAVY }}
              disabled={busy}
              onClick={() => void doLogin()}
            >
              <LogIn size={16} /> {busy ? "Signing in…" : "Sign in"}
            </Button>

            <Collapsible open={setupOpen} onOpenChange={setSetupOpen}>
              <CollapsibleTrigger className="flex w-full items-center justify-center gap-1 pt-1 text-[12px] font-semibold text-muted-foreground transition hover:text-foreground">
                Admin first-time setup
                <ChevronDown size={14} className={`transition ${setupOpen ? "rotate-180" : ""}`} />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 pt-3">
                <p className="rounded-md bg-muted p-2.5 text-[12px] leading-relaxed text-muted-foreground">
                  This works only once, for the email registered as admin. Create your password for
                  the admin panel here.
                </p>
                <div className="space-y-1.5">
                  <Label htmlFor="setup-email">Admin email</Label>
                  <Input
                    id="setup-email"
                    type="email"
                    value={setupEmail}
                    onChange={(e) => setSetupEmail(e.target.value)}
                    placeholder="admin@example.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="setup-pw">Password (min. 8 characters)</Label>
                  <Input
                    id="setup-pw"
                    type="password"
                    autoComplete="new-password"
                    value={setupPw}
                    onChange={(e) => setSetupPw(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="setup-pw2">Confirm password</Label>
                  <Input
                    id="setup-pw2"
                    type="password"
                    autoComplete="new-password"
                    value={setupPw2}
                    onChange={(e) => setSetupPw2(e.target.value)}
                  />
                </div>
                <Button
                  variant="outline"
                  className="w-full font-bold"
                  disabled={setupBusy}
                  onClick={() => void doSetup()}
                >
                  {setupBusy ? "Creating…" : "Create admin account"}
                </Button>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          Confidential content · copying, printing or sharing is prohibited
        </p>
      </div>
    </div>
  );
}
