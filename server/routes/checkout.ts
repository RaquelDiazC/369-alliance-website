/**
 * Stripe Checkout — card payment for the packaged Regulated Design Audit
 * tiers. Settlement arrives asynchronously on the webhook
 * (routes/stripe-webhook.ts), never from the browser's success redirect.
 *
 *   POST /api/checkout/session  → { url, id } for a redirect to Stripe
 *   GET  /api/checkout/config   → whether card payment is available at all
 *
 * Stripe charges the GROSS amount: the catalogue is ex-GST, so the session
 * line item is subtotal + GST and the split is carried in metadata for the
 * invoice. Quote-only tiers (RDA-3) have no fixed price and are refused here —
 * they go out as a proposal.
 */
import { Router, type Request, type Response } from "express";
import { z } from "zod";
import Stripe from "stripe";
import { getSupabase } from "../lib/supabase.js";
import { INVOICE_COLUMNS, mapInvoice } from "../lib/billing.js";
import {
  GST_RATE,
  gstOn,
  isCheckoutable,
  productByCode,
} from "../../shared/billing.js";

const router = Router();

let cached: Stripe | null = null;

/** The Stripe client, or null when STRIPE_SECRET_KEY is absent. */
function getStripe(): Stripe | null {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  cached = new Stripe(key);
  return cached;
}

function baseUrl(req: Request): string {
  const envBase = process.env.PUBLIC_BASE_URL;
  if (envBase) return envBase.replace(/\/$/, "");
  const proto = (req.headers["x-forwarded-proto"] as string) || req.protocol || "https";
  return `${proto}://${req.headers.host}`;
}

router.get("/config", (_req: Request, res: Response) => {
  res.json({
    cardPaymentAvailable: Boolean(process.env.STRIPE_SECRET_KEY),
    webhookConfigured: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
    currency: "aud",
    gstRate: GST_RATE,
  });
});

const sessionSchema = z
  .object({
    productCode: z.string().min(1).max(40),
    /** Settle an already-issued invoice (preferred — the webhook marks it paid). */
    invoiceId: z.string().uuid().nullish(),
    /** Or pay straight off an accepted proposal. */
    proposalId: z.string().uuid().nullish(),
    email: z.string().email().max(200).nullish(),
    successPath: z.string().max(200).nullish(),
    cancelPath: z.string().max(200).nullish(),
  })
  .strict();

router.post("/session", async (req: Request, res: Response) => {
  const stripe = getStripe();
  if (!stripe) return res.status(503).json({ error: "STRIPE_SECRET_KEY not configured" });

  const parsed = sessionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid session request", message: parsed.error.message });
  }
  const { productCode, invoiceId, proposalId, email, successPath, cancelPath } = parsed.data;

  const product = productByCode(productCode);
  if (!product) return res.status(404).json({ error: `unknown product ${productCode}` });
  if (!isCheckoutable(product)) {
    return res.status(409).json({
      error: `${product.code} is quoted per engagement — send a proposal instead of a checkout link`,
    });
  }

  // An invoice, when given, is the source of truth for the amount: it may
  // carry more than one line or a negotiated figure.
  let subtotalCents = product.amountCents!;
  let gstCents = gstOn(subtotalCents);
  let description = product.name;

  if (invoiceId) {
    const supabase = getSupabase();
    if (!supabase) {
      return res.status(503).json({ error: "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not configured" });
    }
    const { data, error } = await supabase
      .from("invoices")
      .select(INVOICE_COLUMNS)
      .eq("id", invoiceId)
      .maybeSingle();
    if (error) return res.status(502).json({ error: "invoice read failed", message: error.message });
    if (!data) return res.status(404).json({ error: "invoice not found" });
    const invoice = mapInvoice(data);
    if (invoice.status === "paid") return res.status(409).json({ error: "invoice is already paid" });
    if (invoice.status === "void") return res.status(409).json({ error: "invoice is void" });
    const owing = invoice.totalCents - invoice.amountPaidCents;
    if (owing <= 0) return res.status(409).json({ error: "nothing outstanding on this invoice" });
    // Charge what is owed; the GST share is proportional to the invoice split.
    gstCents = Math.round((invoice.gstCents / invoice.totalCents) * owing);
    subtotalCents = owing - gstCents;
    description = `Invoice ${invoice.number} — ${product.name}`;
  }

  const amountCents = subtotalCents + gstCents;
  const origin = baseUrl(req);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      client_reference_id: invoiceId ?? proposalId ?? undefined,
      customer_email: email ?? undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "aud",
            unit_amount: amountCents,
            product_data: {
              name: description,
              description: `${product.summary ?? ""} Includes GST.`.trim(),
            },
          },
        },
      ],
      metadata: {
        productCode: product.code,
        invoiceId: invoiceId ?? "",
        proposalId: proposalId ?? "",
        subtotalCents: String(subtotalCents),
        gstCents: String(gstCents),
      },
      success_url: `${origin}${successPath ?? "/billing/paid"}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}${cancelPath ?? "/billing/cancelled"}`,
    });
    res.status(201).json({ id: session.id, url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(502).json({ error: "checkout session failed", message: message.slice(0, 300) });
  }
});

export default router;
