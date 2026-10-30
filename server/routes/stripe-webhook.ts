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

    if (event.type !== "checkout.session.completed") {
      // Acknowledge everything else so Stripe stops resending it.
      return res.json({ received: true, ignored: event.type });
    }

    const session = event.data.object as Stripe.Checkout.Session;
    const invoiceId = session.metadata?.invoiceId || session.client_reference_id || "";
    const amountCents = session.amount_total ?? 0;

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
