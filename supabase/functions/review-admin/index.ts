// Course Review Platform — privileged admin actions.
// verify_jwt is disabled because this function implements its own auth:
// every action except `bootstrap` requires a valid user JWT belonging to an
// email listed in public.review_admins. `bootstrap` only ever creates the
// FIRST auth account for an email already seeded in review_admins.
import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

// Unambiguous alphabet (no 0/O, 1/I/L) so codes are easy to share by phone.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
function newAccessCode(len = 8): string {
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
}

async function findUserByEmail(email: string) {
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(error.message);
    const hit = data.users.find((u) => (u.email ?? "").toLowerCase() === email);
    if (hit) return hit;
    if (data.users.length < 200) break;
  }
  return null;
}

async function isAdminEmail(email: string): Promise<boolean> {
  const { data } = await admin
    .from("review_admins")
    .select("email")
    .ilike("email", email)
    .maybeSingle();
  return !!data;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json(405, { error: "method not allowed" });

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return json(400, { error: "invalid json" });
  }
  const action = String(payload?.action ?? "");

  try {
    if (action === "bootstrap") {
      const email = String(payload.email ?? "").trim().toLowerCase();
      const password = String(payload.password ?? "");
      if (!email || password.length < 8) {
        return json(400, {
          error: "Informe o email da administradora e uma senha com pelo menos 8 caracteres.",
        });
      }
      if (!(await isAdminEmail(email))) {
        return json(403, { error: "Este email não está registrado como administradora." });
      }
      if (await findUserByEmail(email)) {
        return json(409, { error: "A conta da administradora já existe. Use a tela de login." });
      }
      const { error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (error) return json(500, { error: error.message });
      return json(200, { ok: true });
    }

    // Every other action requires a logged-in admin.
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    if (!token) return json(401, { error: "não autenticado" });
    const { data: caller, error: authErr } = await admin.auth.getUser(token);
    const callerEmail = caller?.user?.email?.toLowerCase() ?? "";
    if (authErr || !callerEmail) return json(401, { error: "não autenticado" });
    if (!(await isAdminEmail(callerEmail))) {
      return json(403, { error: "acesso restrito à administradora" });
    }

    if (action === "upsert_reviewer") {
      const email = String(payload.email ?? "").trim().toLowerCase();
      const courseIds: string[] = Array.isArray(payload.courseIds)
        ? (payload.courseIds as unknown[]).map(String)
        : [];
      if (!email || !email.includes("@")) return json(400, { error: "email inválido" });

      const existingUser = await findUserByEmail(email);
      const { data: reg } = await admin
        .from("review_reviewers")
        .select("access_code")
        .eq("email", email)
        .maybeSingle();
      let code: string | null = (reg?.access_code as string | undefined) ?? null;

      if (!existingUser) {
        code = newAccessCode();
        const { error } = await admin.auth.admin.createUser({
          email,
          password: code,
          email_confirm: true,
        });
        if (error) return json(500, { error: error.message });
      } else if (!code) {
        code = newAccessCode();
        const { error } = await admin.auth.admin.updateUserById(existingUser.id, {
          password: code,
        });
        if (error) return json(500, { error: error.message });
      }

      const displayName = email.split("@")[0];
      const up = await admin
        .from("review_reviewers")
        .upsert({ email, display_name: displayName, access_code: code });
      if (up.error) return json(500, { error: up.error.message });

      // Replace this reviewer's course access with exactly `courseIds`.
      // Comments are keyed by email and are never touched here.
      const del = await admin.from("review_access").delete().eq("email", email);
      if (del.error) return json(500, { error: del.error.message });
      if (courseIds.length > 0) {
        const ins = await admin
          .from("review_access")
          .insert(courseIds.map((course_id) => ({ course_id, email })));
        if (ins.error) return json(500, { error: ins.error.message });
      }
      return json(200, { ok: true, accessCode: code });
    }

    if (action === "reset_code") {
      const email = String(payload.email ?? "").trim().toLowerCase();
      const user = await findUserByEmail(email);
      if (!user) return json(404, { error: "conta não encontrada" });
      const code = newAccessCode();
      const { error } = await admin.auth.admin.updateUserById(user.id, { password: code });
      if (error) return json(500, { error: error.message });
      await admin.from("review_reviewers").update({ access_code: code }).eq("email", email);
      return json(200, { ok: true, accessCode: code });
    }

    if (action === "remove_reviewer") {
      const email = String(payload.email ?? "").trim().toLowerCase();
      if (await isAdminEmail(email)) {
        return json(400, { error: "não é possível remover a administradora" });
      }
      await admin.from("review_access").delete().eq("email", email);
      await admin.from("review_reviewers").delete().eq("email", email);
      const user = await findUserByEmail(email);
      if (user) await admin.auth.admin.deleteUser(user.id);
      // review_comments / review_replies stay untouched (keyed by email).
      return json(200, { ok: true });
    }

    return json(400, { error: "ação desconhecida" });
  } catch (e) {
    return json(500, { error: e instanceof Error ? e.message : "erro interno" });
  }
});
