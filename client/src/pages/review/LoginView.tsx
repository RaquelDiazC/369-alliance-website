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
      toast.error("Informe email e código de acesso.");
      return;
    }
    setBusy(true);
    try {
      await signIn(email, password);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível entrar.");
    } finally {
      setBusy(false);
    }
  };

  const doSetup = async () => {
    if (setupPw.length < 8) {
      toast.error("A senha precisa de pelo menos 8 caracteres.");
      return;
    }
    if (setupPw !== setupPw2) {
      toast.error("As senhas não conferem.");
      return;
    }
    setSetupBusy(true);
    try {
      await bootstrapAdmin(setupEmail, setupPw);
      toast.success("Conta da administradora criada. Entrando…");
      await signIn(setupEmail, setupPw);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível criar a conta.");
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
              Acesso restrito
            </CardTitle>
            <p className="text-center text-[13px] text-muted-foreground">
              Material de curso em revisão. Entre com o email e o código de acesso que você recebeu.
            </p>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="voce@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void doLogin()}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="login-pw">Código de acesso / senha</Label>
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
              <LogIn size={16} /> {busy ? "Entrando…" : "Entrar"}
            </Button>

            <Collapsible open={setupOpen} onOpenChange={setSetupOpen}>
              <CollapsibleTrigger className="flex w-full items-center justify-center gap-1 pt-1 text-[12px] font-semibold text-muted-foreground transition hover:text-foreground">
                Primeiro acesso da administradora
                <ChevronDown size={14} className={`transition ${setupOpen ? "rotate-180" : ""}`} />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 pt-3">
                <p className="rounded-md bg-muted p-2.5 text-[12px] leading-relaxed text-muted-foreground">
                  Só funciona uma vez, para o email registrado como administradora. Crie aqui a sua
                  senha de acesso ao painel.
                </p>
                <div className="space-y-1.5">
                  <Label htmlFor="setup-email">Email da administradora</Label>
                  <Input
                    id="setup-email"
                    type="email"
                    value={setupEmail}
                    onChange={(e) => setSetupEmail(e.target.value)}
                    placeholder="admin@exemplo.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="setup-pw">Senha (mín. 8 caracteres)</Label>
                  <Input
                    id="setup-pw"
                    type="password"
                    autoComplete="new-password"
                    value={setupPw}
                    onChange={(e) => setSetupPw(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="setup-pw2">Confirmar senha</Label>
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
                  {setupBusy ? "Criando…" : "Criar conta da administradora"}
                </Button>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          Conteúdo confidencial · proibido copiar, imprimir ou divulgar
        </p>
      </div>
    </div>
  );
}
