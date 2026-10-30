/**
 * Billing API — proposal → invoice → payment, the way the work actually gets
 * paid for. Stripe Checkout lives in routes/checkout.ts and the settlement
 * webhook in routes/stripe-webhook.ts; both share server/lib/billing.ts.
 *
 * Staff routes (expect to sit behind the staff portal):
 *   GET  /api/billing/products                       → the sellable catalogue
 *   GET  /api/billing/clients                        → list clients
 *   POST /api/billing/clients                        → create a client
 *   GET  /api/billing/proposals                      → list proposals
 *   POST /api/billing/proposals                      → draft a proposal
 *   GET  /api/billing/proposals/:id                  → one proposal + items
 *   POST /api/billing/proposals/:id/send             → mark sent, return link
 *   POST /api/billing/proposals/:id/accept           → accept on the client's behalf
 *   GET  /api/billing/invoices                       → list invoices
 *   GET  /api/billing/invoices/:id                   → one invoice + payments
 *   POST /api/billing/invoices/from-proposal/:id     → issue from an accepted proposal
 *   POST /api/billing/invoices/:id/send              → mark sent, return link
 *   POST /api/billing/invoices/:id/payments          → record a payment manually
 *
 * Public routes (unguessable view_token, no auth — deliberately minimal fields):
 *   GET  /api/billing/public/proposal/:token
 *   POST /api/billing/public/proposal/:token/respond → accept or decline
 *   GET  /api/billing/public/invoice/:token
 *
 * Every table is deny-all under RLS; these routes hold the only key (see
 * server/lib/supabase.ts).
 */
import { Router, type Request, type Response } from "express";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabase } from "../lib/supabase.js";
import {
  INVOICE_COLUMNS,
  PROPOSAL_COLUMNS,
  mapInvoice,
  mapLineItem,
  mapPayment,
  mapProposal,
  recordPayment,
} from "../lib/billing.js";
import {
  GST_RATE,
  PAYMENT_METHODS,
  RDA_GUARANTEE,
  RDA_PRODUCTS,
  RDA_TERMS,
  computeTotals,
  dueDateFrom,
  lineAmount,
  priceLabel,
  type LineItem,
} from "../../shared/billing.js";

const router = Router();

/** Resolve the service-role client or answer 503 — mirrors the other routes. */
function db(res: Response): SupabaseClient | null {
  const supabase = getSupabase();
  if (!supabase) {
    res.status(503).json({ error: "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not configured" });
    return null;
  }
  return supabase;
}

function fail(res: Response, status: number, error: string, err?: unknown) {
  const message = err instanceof Error ? err.message : err ? String(err) : undefined;
  return res.status(status).json(message ? { error, message: message.slice(0, 300) } : { error });
}

const lineItemSchema = z.object({
  productCode: z.string().max(40).nullish(),
  description: z.string().min(1).max(400),
  quantity: z.number().positive().max(1000).default(1),
  unitAmountCents: z.number().int().min(0),
});

/** Amounts are always recomputed server-side — the client never sets a total. */
function normaliseItems(items: z.infer<typeof lineItemSchema>[]): LineItem[] {
  return items.map(i => ({
    productCode: i.productCode ?? null,
    description: i.description,
    quantity: i.quantity,
    unitAmountCents: i.unitAmountCents,
    amountCents: lineAmount(i.quantity, i.unitAmountCents),
  }));
}

function publicBaseUrl(req: Request): string {
  const envBase = process.env.PUBLIC_BASE_URL;
  if (envBase) return envBase.replace(/\/$/, "");
  const proto = (req.headers["x-forwarded-proto"] as string) || req.protocol || "https";
  return `${proto}://${req.headers.host}`;
}

// ---------------------------------------------------------------- catalogue

router.get("/products", (_req: Request, res: Response) => {
  res.json({
    products: RDA_PRODUCTS.map(p => ({ ...p, priceLabel: priceLabel(p) })),
    gstRate: GST_RATE,
    guarantee: RDA_GUARANTEE,
    terms: RDA_TERMS,
    paymentMethods: PAYMENT_METHODS,
  });
});

// ------------------------------------------------------------------ clients

const clientSchema = z.object({
  company: z.string().min(1).max(200),
  contactName: z.string().max(160).nullish(),
  email: z.string().email().max(200).nullish(),
  phone: z.string().max(60).nullish(),
  abn: z.string().max(20).nullish(),
  address: z.string().max(400).nullish(),
  notes: z.string().max(2000).nullish(),
});

router.get("/clients", async (_req: Request, res: Response) => {
  const supabase = db(res);
  if (!supabase) return;
  const { data, error } = await supabase
    .from("clients")
    .select("id, company, contact_name, email, phone, abn, address, notes")
    .order("company", { ascending: true });
  if (error) return fail(res, 502, "clients read failed", error.message);
  res.json({ clients: data ?? [] });
});

router.post("/clients", async (req: Request, res: Response) => {
  const supabase = db(res);
  if (!supabase) return;
  const parsed = clientSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, 400, "invalid client", parsed.error.message);
  const c = parsed.data;
  const { data, error } = await supabase
    .from("clients")
    .insert({
      company: c.company,
      contact_name: c.contactName ?? null,
      email: c.email ?? null,
      phone: c.phone ?? null,
      abn: c.abn ?? null,
      address: c.address ?? null,
      notes: c.notes ?? null,
    })
    .select("id, company, contact_name, email, phone, abn, address, notes")
    .single();
  if (error) return fail(res, 502, "client create failed", error.message);
  res.status(201).json({ client: data });
});

// ---------------------------------------------------------------- proposals

const proposalSchema = z.object({
  clientId: z.string().uuid(),
  title: z.string().min(1).max(200),
  items: z.array(lineItemSchema).min(1).max(50),
  terms: z.string().max(4000).nullish(),
  guarantee: z.string().max(1000).nullish(),
  validUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish(),
  gstRate: z.number().min(0).max(1).optional(),
});

router.get("/proposals", async (_req: Request, res: Response) => {
  const supabase = db(res);
  if (!supabase) return;
  const { data, error } = await supabase
    .from("proposals")
    .select(PROPOSAL_COLUMNS)
    .order("created_at", { ascending: false });
  if (error) return fail(res, 502, "proposals read failed", error.message);
  res.json({ proposals: (data ?? []).map(r => mapProposal(r)) });
});

router.post("/proposals", async (req: Request, res: Response) => {
  const supabase = db(res);
  if (!supabase) return;
  const parsed = proposalSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, 400, "invalid proposal", parsed.error.message);
  const p = parsed.data;

  const items = normaliseItems(p.items);
  const totals = computeTotals(items, p.gstRate ?? GST_RATE);

  const { data: proposal, error } = await supabase
    .from("proposals")
    .insert({
      client_id: p.clientId,
      title: p.title,
      subtotal_cents: totals.subtotalCents,
      gst_cents: totals.gstCents,
      total_cents: totals.totalCents,
      gst_rate: totals.gstRate,
      terms: p.terms ?? RDA_TERMS,
      guarantee: p.guarantee ?? RDA_GUARANTEE,
      valid_until: p.validUntil ?? null,
    })
    .select(PROPOSAL_COLUMNS)
    .single();
  if (error) return fail(res, 502, "proposal create failed", error.message);

  const { error: itemsError } = await supabase.from("proposal_line_items").insert(
    items.map((i, index) => ({
      proposal_id: proposal.id,
      product_code: i.productCode,
      description: i.description,
      quantity: i.quantity,
      unit_amount_cents: i.unitAmountCents,
      amount_cents: i.amountCents,
      sort: index,
    })),
  );
  if (itemsError) return fail(res, 502, "proposal items create failed", itemsError.message);

  res.status(201).json({ proposal: mapProposal(proposal, items) });
});

async function loadProposal(supabase: SupabaseClient, column: "id" | "view_token", value: string) {
  const { data, error } = await supabase
    .from("proposals")
    .select(PROPOSAL_COLUMNS)
    .eq(column, value)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const { data: itemRows, error: itemsError } = await supabase
    .from("proposal_line_items")
    .select("product_code, description, quantity, unit_amount_cents, amount_cents, sort")
    .eq("proposal_id", data.id)
    .order("sort", { ascending: true });
  if (itemsError) throw new Error(itemsError.message);
  return mapProposal(data, (itemRows ?? []).map(mapLineItem));
}

router.get("/proposals/:id", async (req: Request, res: Response) => {
  const supabase = db(res);
  if (!supabase) return;
  try {
    const proposal = await loadProposal(supabase, "id", req.params.id);
    if (!proposal) return fail(res, 404, "proposal not found");
    res.json({ proposal });
  } catch (err) {
    fail(res, 502, "proposal read failed", err);
  }
});

router.post("/proposals/:id/send", async (req: Request, res: Response) => {
  const supabase = db(res);
  if (!supabase) return;
  const { data, error } = await supabase
    .from("proposals")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", req.params.id)
    .in("status", ["draft", "sent"])
    .select(PROPOSAL_COLUMNS)
    .maybeSingle();
  if (error) return fail(res, 502, "proposal send failed", error.message);
  if (!data) return fail(res, 409, "proposal not found or already answered");
  res.json({
    proposal: mapProposal(data),
    link: `${publicBaseUrl(req)}/api/billing/public/proposal/${data.view_token}`,
  });
});

const respondSchema = z.object({
  decision: z.enum(["accept", "decline"]),
  reason: z.string().max(500).nullish(),
});

async function respondToProposal(
  supabase: SupabaseClient,
  column: "id" | "view_token",
  value: string,
  decision: "accept" | "decline",
  reason: string | null,
) {
  const { data, error } = await supabase
    .from("proposals")
    .update({
      status: decision === "accept" ? "accepted" : "declined",
      responded_at: new Date().toISOString(),
      decline_reason: decision === "decline" ? reason : null,
    })
    .eq(column, value)
    .in("status", ["draft", "sent"])
    .select(PROPOSAL_COLUMNS)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

router.post("/proposals/:id/accept", async (req: Request, res: Response) => {
  const supabase = db(res);
  if (!supabase) return;
  try {
    const data = await respondToProposal(supabase, "id", req.params.id, "accept", null);
    if (!data) return fail(res, 409, "proposal not found or already answered");
    res.json({ proposal: mapProposal(data) });
  } catch (err) {
    fail(res, 502, "proposal accept failed", err);
  }
});

// ----------------------------------------------------------------- invoices

router.get("/invoices", async (_req: Request, res: Response) => {
  const supabase = db(res);
  if (!supabase) return;
  const { data, error } = await supabase
    .from("invoices")
    .select(INVOICE_COLUMNS)
    .order("issue_date", { ascending: false });
  if (error) return fail(res, 502, "invoices read failed", error.message);
  res.json({ invoices: (data ?? []).map(mapInvoice) });
});

/**
 * Issue the invoice for an accepted proposal. The line items are snapshotted
 * into the invoice so editing the proposal afterwards cannot change what was
 * billed; the unique index on proposal_id makes a retried call a 409 rather
 * than a second invoice.
 */
router.post("/invoices/from-proposal/:proposalId", async (req: Request, res: Response) => {
  const supabase = db(res);
  if (!supabase) return;
  try {
    const proposal = await loadProposal(supabase, "id", req.params.proposalId);
    if (!proposal) return fail(res, 404, "proposal not found");
    if (proposal.status !== "accepted") {
      return fail(res, 409, `proposal is ${proposal.status} — accept it before invoicing`);
    }

    const issueDate = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from("invoices")
      .insert({
        client_id: proposal.clientId,
        proposal_id: proposal.id,
        issue_date: issueDate,
        due_date: dueDateFrom(issueDate),
        subtotal_cents: proposal.subtotalCents,
        gst_cents: proposal.gstCents,
        total_cents: proposal.totalCents,
        gst_rate: proposal.gstRate,
        line_items: proposal.lineItems,
        terms: proposal.terms,
      })
      .select(INVOICE_COLUMNS)
      .single();
    if (error) {
      if (error.code === "23505") return fail(res, 409, "this proposal is already invoiced");
      return fail(res, 502, "invoice create failed", error.message);
    }
    res.status(201).json({ invoice: mapInvoice(data) });
  } catch (err) {
    fail(res, 502, "invoice create failed", err);
  }
});

router.get("/invoices/:id", async (req: Request, res: Response) => {
  const supabase = db(res);
  if (!supabase) return;
  const { data, error } = await supabase
    .from("invoices")
    .select(INVOICE_COLUMNS)
    .eq("id", req.params.id)
    .maybeSingle();
  if (error) return fail(res, 502, "invoice read failed", error.message);
  if (!data) return fail(res, 404, "invoice not found");
  const { data: paymentRows, error: paymentsError } = await supabase
    .from("payments")
    .select("id, invoice_id, amount_cents, method, reference, paid_on")
    .eq("invoice_id", req.params.id)
    .order("paid_on", { ascending: true });
  if (paymentsError) return fail(res, 502, "payments read failed", paymentsError.message);
  res.json({
    invoice: mapInvoice(data),
    payments: (paymentRows ?? []).map(mapPayment),
  });
});

router.post("/invoices/:id/send", async (req: Request, res: Response) => {
  const supabase = db(res);
  if (!supabase) return;
  const { data, error } = await supabase
    .from("invoices")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", req.params.id)
    .in("status", ["draft", "sent", "overdue"])
    .select(INVOICE_COLUMNS)
    .maybeSingle();
  if (error) return fail(res, 502, "invoice send failed", error.message);
  if (!data) return fail(res, 409, "invoice not found or not sendable");
  res.json({
    invoice: mapInvoice(data),
    link: `${publicBaseUrl(req)}/api/billing/public/invoice/${data.view_token}`,
  });
});

const paymentSchema = z.object({
  amountCents: z.number().int().positive(),
  method: z.string().min(1).max(60).default("Bank Transfer"),
  reference: z.string().max(140).nullish(),
  paidOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish(),
});

/** Manual settlement — bank transfer, cash or a card taken over the phone. */
router.post("/invoices/:id/payments", async (req: Request, res: Response) => {
  const supabase = db(res);
  if (!supabase) return;
  const parsed = paymentSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, 400, "invalid payment", parsed.error.message);
  try {
    const result = await recordPayment(supabase, {
      invoiceId: req.params.id,
      amountCents: parsed.data.amountCents,
      method: parsed.data.method,
      reference: parsed.data.reference ?? null,
      paidOn: parsed.data.paidOn ?? null,
    });
    res.status(201).json({ invoice: result.invoice, payment: result.payment });
  } catch (err) {
    fail(res, 502, "payment record failed", err);
  }
});

// ------------------------------------------------------------ public views
// Resolved by unguessable token. Only the fields the recipient needs — no
// client id, no notes, no other documents.

router.get("/public/proposal/:token", async (req: Request, res: Response) => {
  const supabase = db(res);
  if (!supabase) return;
  try {
    const proposal = await loadProposal(supabase, "view_token", req.params.token);
    if (!proposal) return fail(res, 404, "not found");
    const { data: client } = await supabase
      .from("clients")
      .select("company")
      .eq("id", proposal.clientId)
      .maybeSingle();
    res.json({
      proposal: {
        number: proposal.number,
        title: proposal.title,
        status: proposal.status,
        lineItems: proposal.lineItems,
        subtotalCents: proposal.subtotalCents,
        gstCents: proposal.gstCents,
        totalCents: proposal.totalCents,
        terms: proposal.terms,
        guarantee: proposal.guarantee,
        validUntil: proposal.validUntil,
      },
      client: { company: client?.company ?? null },
    });
  } catch (err) {
    fail(res, 502, "proposal read failed", err);
  }
});

router.post("/public/proposal/:token/respond", async (req: Request, res: Response) => {
  const supabase = db(res);
  if (!supabase) return;
  const parsed = respondSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, 400, "invalid response", parsed.error.message);
  try {
    const data = await respondToProposal(
      supabase,
      "view_token",
      req.params.token,
      parsed.data.decision,
      parsed.data.reason ?? null,
    );
    if (!data) return fail(res, 409, "this proposal has already been answered");
    res.json({ status: data.status, number: data.number });
  } catch (err) {
    fail(res, 502, "proposal response failed", err);
  }
});

router.get("/public/invoice/:token", async (req: Request, res: Response) => {
  const supabase = db(res);
  if (!supabase) return;
  const { data, error } = await supabase
    .from("invoices")
    .select(INVOICE_COLUMNS)
    .eq("view_token", req.params.token)
    .maybeSingle();
  if (error) return fail(res, 502, "invoice read failed", error.message);
  if (!data) return fail(res, 404, "not found");
  const invoice = mapInvoice(data);
  const { data: client } = await supabase
    .from("clients")
    .select("company, abn")
    .eq("id", invoice.clientId)
    .maybeSingle();
  res.json({
    invoice: {
      number: invoice.number,
      status: invoice.status,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      lineItems: invoice.lineItems,
      subtotalCents: invoice.subtotalCents,
      gstCents: invoice.gstCents,
      totalCents: invoice.totalCents,
      amountPaidCents: invoice.amountPaidCents,
      terms: invoice.terms,
    },
    client: { company: client?.company ?? null, abn: client?.abn ?? null },
  });
});

export default router;
