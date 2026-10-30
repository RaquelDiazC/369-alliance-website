/**
 * Billing data access — row mappers and the payment/settlement logic shared by
 * the staff routes (server/routes/billing.ts) and the Stripe webhook
 * (server/routes/stripe-webhook.ts).
 *
 * Settlement rule: a payment row is the fact, the invoice's amount_paid_cents
 * is derived from the sum of its payments. Recomputing (rather than
 * incrementing) means a replayed webhook or a corrected payment can never
 * drift the invoice away from its payments.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  balanceCents,
  type Invoice,
  type LineItem,
  type Payment,
  type Proposal,
} from "../../shared/billing.js";

/** Postgres unique-violation — how we detect an already-processed event. */
const UNIQUE_VIOLATION = "23505";

export const PROPOSAL_COLUMNS =
  "id, number, client_id, title, status, subtotal_cents, gst_cents, total_cents, gst_rate, terms, guarantee, valid_until, view_token, sent_at, responded_at, decline_reason";

export const INVOICE_COLUMNS =
  "id, number, client_id, proposal_id, status, issue_date, due_date, subtotal_cents, gst_cents, total_cents, gst_rate, amount_paid_cents, line_items, terms, notes, view_token, sent_at, paid_at";

export function mapProposal(row: any, lineItems: LineItem[] = []): Proposal {
  return {
    id: row.id,
    number: row.number,
    clientId: row.client_id,
    title: row.title,
    status: row.status,
    subtotalCents: row.subtotal_cents,
    gstCents: row.gst_cents,
    totalCents: row.total_cents,
    gstRate: Number(row.gst_rate),
    lineItems,
    terms: row.terms,
    guarantee: row.guarantee,
    validUntil: row.valid_until,
    viewToken: row.view_token,
    sentAt: row.sent_at,
    respondedAt: row.responded_at,
    declineReason: row.decline_reason,
  };
}

export function mapLineItem(row: any): LineItem {
  return {
    productCode: row.product_code ?? null,
    description: row.description,
    quantity: Number(row.quantity),
    unitAmountCents: row.unit_amount_cents,
    amountCents: row.amount_cents,
  };
}

export function mapInvoice(row: any): Invoice {
  return {
    id: row.id,
    number: row.number,
    clientId: row.client_id,
    proposalId: row.proposal_id,
    status: row.status,
    issueDate: row.issue_date,
    dueDate: row.due_date,
    subtotalCents: row.subtotal_cents,
    gstCents: row.gst_cents,
    totalCents: row.total_cents,
    gstRate: Number(row.gst_rate),
    amountPaidCents: row.amount_paid_cents,
    lineItems: Array.isArray(row.line_items) ? (row.line_items as LineItem[]) : [],
    terms: row.terms,
    notes: row.notes,
    viewToken: row.view_token,
    sentAt: row.sent_at,
    paidAt: row.paid_at,
  };
}

export function mapPayment(row: any): Payment {
  return {
    id: row.id,
    invoiceId: row.invoice_id,
    amountCents: row.amount_cents,
    method: row.method,
    reference: row.reference,
    paidOn: row.paid_on,
  };
}

export interface RecordPaymentInput {
  invoiceId: string;
  amountCents: number;
  method: string;
  reference?: string | null;
  paidOn?: string | null;
  stripeEventId?: string | null;
  stripeSessionId?: string | null;
  stripePaymentIntent?: string | null;
}

export interface RecordPaymentResult {
  /** True when this exact Stripe event had already been recorded. */
  duplicate: boolean;
  invoice: Invoice;
  payment: Payment | null;
}

/**
 * Record a payment against an invoice and settle the invoice.
 *
 * Idempotent on stripeEventId: a replayed Stripe event hits the unique index
 * and returns `duplicate: true` without writing a second payment or moving the
 * invoice. Resolves the invoice state from the payment rows afterwards, so the
 * stored total always equals what was actually received.
 */
export async function recordPayment(
  supabase: SupabaseClient,
  input: RecordPaymentInput,
): Promise<RecordPaymentResult> {
  const insert = await supabase
    .from("payments")
    .insert({
      invoice_id: input.invoiceId,
      amount_cents: input.amountCents,
      method: input.method,
      reference: input.reference ?? null,
      paid_on: input.paidOn ?? new Date().toISOString().slice(0, 10),
      stripe_event_id: input.stripeEventId ?? null,
      stripe_session_id: input.stripeSessionId ?? null,
      stripe_payment_intent: input.stripePaymentIntent ?? null,
    })
    .select("id, invoice_id, amount_cents, method, reference, paid_on")
    .single();

  const duplicate = Boolean(insert.error && insert.error.code === UNIQUE_VIOLATION);
  if (insert.error && !duplicate) throw new Error(insert.error.message);

  const invoice = await settleInvoice(supabase, input.invoiceId);
  return {
    duplicate,
    invoice,
    payment: insert.data ? mapPayment(insert.data) : null,
  };
}

/**
 * Recompute amount_paid_cents from the invoice's payments and move the status.
 * Fully covered → paid; partially paid stays where it is (sent/overdue) so the
 * follow-up still shows; a void invoice is never resurrected.
 *
 * The work happens in Postgres (`settle_invoice`, see
 * supabase/migrations/20261030140000_billing_settle_invoice.sql) because it
 * has to be atomic: a Stripe webhook and a staff-recorded transfer arriving
 * together must not interleave between reading the payments and writing the
 * total. The function takes a row lock on the invoice first.
 */
export async function settleInvoice(
  supabase: SupabaseClient,
  invoiceId: string,
): Promise<Invoice> {
  const { data, error } = await supabase
    .rpc("settle_invoice", { p_invoice_id: invoiceId })
    .single();
  if (error) throw new Error(error.message);
  if (!data) throw new Error(`invoice ${invoiceId} not found`);
  return mapInvoice(data);
}

/** Outstanding amount on an invoice, in cents. */
export function outstanding(invoice: Invoice): number {
  return balanceCents(invoice);
}
