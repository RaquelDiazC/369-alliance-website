/**
 * Stripe webhook — the only thing that marks an invoice paid by card.
 *
 *   POST /api/stripe/webhook  → signature-verified Stripe events
 *
 * MOUNT ORDER MATTERS: this router must be mounted in server/app.ts BEFORE
 * `app.use(express.json(...))`. Signature verification hashes the exact bytes
 * Stripe sent, so a JSON-parsed body fails every time. `express.raw` here
 * keeps the Buffer intact even if the mount order is ever disturbed.
 *
 * Idempotency is the event id, held by a unique index on
 * payments.stripe_event_id — Stripe retries on any non-2xx and replays events,
 * and a replay must not take a second payment.
 *
 * Settling requires `payment_status === "paid"` and AUD. A session completes
 * before the money arrives for deferred methods (BECS Direct Debit and the
 * like), so "completed" alone is not proof of payment —
 * checkout.session.async_payment_succeeded is what settles those.
 */
import { Router, type Request, type Response } from "express";
import express from "express";
import Stripe from "stripe";
import { getSupabase } from "../lib/supabase.js";
import { recordPayment } from "../lib/billing.js";

const router = Router();

let cached: Stripe | null = null;

function getStripe(): Stripe | null {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  cached = new Stripe(key);
  return cached;
}

router.post(
  "/webhook",
  express.raw({ type: "application/json", limit: "1mb" }),
  async (req: Request, res: Response) => {
    const stripe = getStripe();
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!stripe) return res.status(503).json({ error: "STRIPE_SECRET_KEY not configured" });
    if (!secret) return res.status(503).json({ error: "STRIPE_WEBHOOK_SECRET not configured" });

    const signature = req.headers["stripe-signature"];
    if (typeof signature !== "string") {
      return res.status(400).json({ error: "missing stripe-signature header" });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(req.body as Buffer, signature, secret);
    } catch (err) {
      // Unverified payload: refuse it and do not retry-loop on our side.
      const message = err instanceof Error ? err.message : String(err);
      return res.status(400).json({ error: "signature verification failed", message: message.slice(0, 200) });
    }

    const settleable =
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded";

    if (event.type === "checkout.session.async_payment_failed") {
      // The deferred payment bounced. The invoice was never settled, so there
      // is nothing to undo — just acknowledge and let the follow-up happen.
      const failed = event.data.object as Stripe.Checkout.Session;
      return res.json({
        received: true,
        settled: false,
        reason: "async payment failed",
        session: failed.id,
      });
    }

    if (!settleable) {
      // Acknowledge everything else so Stripe stops resending it.
      return res.json({ received: true, ignored: event.type });
    }

    const session = event.data.object as Stripe.Checkout.Session;
    const invoiceId = session.metadata?.invoiceId || session.client_reference_id || "";
    const amountCents = session.amount_total ?? 0;

    // "completed" fires for a deferred method before the funds arrive; only
    // payment_status proves we have the money.
    if (session.payment_status !== "paid") {
      return res.json({
        received: true,
        settled: false,
        reason: `payment_status is ${session.payment_status}`,
        session: session.id,
      });
    }

    // The ledger is AUD cents. Recording another currency's minor units as AUD
    // would quietly corrupt it, so refuse and leave the invoice open for
    // someone to look at.
    if (session.currency && session.currency.toLowerCase() !== "aud") {
      return res.json({
        received: true,
        settled: false,
        reason: `unexpected currency ${session.currency}`,
        session: session.id,
      });
    }

    if (!invoiceId || amountCents <= 0) {
      // Nothing to settle (e.g. a checkout started without an invoice). This
      // is not an error Stripe can fix by retrying.
      return res.json({ received: true, settled: false, reason: "no invoice on session" });
    }

    const supabase = getSupabase();
    if (!supabase) {
      // Retryable: the credentials, not the event, are the problem.
      return res.status(503).json({ error: "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not configured" });
    }

    try {
      const result = await recordPayment(supabase, {
        invoiceId,
        amountCents,
        method: "Stripe",
        reference: session.payment_intent ? String(session.payment_intent) : session.id,
        stripeEventId: event.id,
        stripeSessionId: session.id,
        stripePaymentIntent: session.payment_intent ? String(session.payment_intent) : null,
      });
      return res.json({
        received: true,
        settled: true,
        duplicate: result.duplicate,
        invoice: { number: result.invoice.number, status: result.invoice.status },
      });
    } catch (err) {
      // 5xx so Stripe retries — the payment is real and must not be dropped.
      const message = err instanceof Error ? err.message : String(err);
      return res.status(500).json({ error: "settlement failed", message: message.slice(0, 300) });
    }
  },
);

export default router;
