/**
 * Billing types, money helpers and the sellable catalogue — shared by the
 * client and the Express routes (`@shared/billing`).
 *
 * Money is integer cents (AUD) everywhere. Never float: a proposal that says
 * $6,500.00 must invoice as 650000 cents and reconcile to the cent against a
 * bank transfer. Catalogue prices EXCLUDE GST; GST is added per document and
 * the rate is stored on the document so a historic invoice never moves.
 *
 * The catalogue below mirrors the seed in supabase/migrations/0001_billing.sql
 * — change both together.
 */

/** Australian GST. Applies to these services; stored per document. */
export const GST_RATE = 0.1;

export const PROPOSAL_STATUSES = ["draft", "sent", "accepted", "declined", "expired"] as const;
export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];

export const INVOICE_STATUSES = ["draft", "sent", "paid", "overdue", "void"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

/**
 * Free text by design. 'Bank Transfer' is the default (it is how the work gets
 * paid today), 'Stripe' is written by the webhook, and 'Bank Transfer (Xero)'
 * is reserved for the auto-reconciliation step that comes later.
 */
export const PAYMENT_METHODS = [
  "Bank Transfer",
  "Cash",
  "Card",
  "Stripe",
  "Bank Transfer (Xero)",
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export interface Client {
  id: string;
  company: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  abn: string | null;
  address: string | null;
  notes: string | null;
}

export interface Product {
  code: string;
  name: string;
  summary: string | null;
  /** Fixed price ex-GST, or null when quoted per engagement. */
  amountCents: number | null;
  fromCents: number | null;
  toCents: number | null;
  quoteOnly: boolean;
  gstApplicable: boolean;
}

export interface LineItem {
  productCode: string | null;
  description: string;
  quantity: number;
  unitAmountCents: number;
  amountCents: number;
}

export interface DocumentTotals {
  subtotalCents: number;
  gstCents: number;
  totalCents: number;
  gstRate: number;
}

export interface Proposal extends DocumentTotals {
  id: string;
  number: string;
  clientId: string;
  title: string;
  status: ProposalStatus;
  lineItems: LineItem[];
  terms: string | null;
  guarantee: string | null;
  validUntil: string | null;
  viewToken: string;
  sentAt: string | null;
  respondedAt: string | null;
  declineReason: string | null;
}

export interface Invoice extends DocumentTotals {
  id: string;
  number: string;
  clientId: string;
  proposalId: string | null;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string | null;
  amountPaidCents: number;
  lineItems: LineItem[];
  terms: string | null;
  notes: string | null;
  viewToken: string;
  sentAt: string | null;
  paidAt: string | null;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amountCents: number;
  method: string;
  reference: string | null;
  paidOn: string;
}

// ------------------------------------------------------------------- money

/** Dollars (as typed by a human) → integer cents. */
export function toCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/** GST on an ex-GST amount, rounded to the cent. */
export function gstOn(subtotalCents: number, rate: number = GST_RATE): number {
  return Math.round(subtotalCents * rate);
}

/** Line amount from quantity × unit, rounded to the cent. */
export function lineAmount(quantity: number, unitAmountCents: number): number {
  return Math.round(quantity * unitAmountCents);
}

/** Roll line items up into subtotal / GST / total. */
export function computeTotals(items: LineItem[], rate: number = GST_RATE): DocumentTotals {
  const subtotalCents = items.reduce((sum, i) => sum + i.amountCents, 0);
  const gstCents = gstOn(subtotalCents, rate);
  return { subtotalCents, gstCents, totalCents: subtotalCents + gstCents, gstRate: rate };
}

/** What is still owed on an invoice. */
export function balanceCents(invoice: Pick<Invoice, "totalCents" | "amountPaidCents">): number {
  return Math.max(0, invoice.totalCents - invoice.amountPaidCents);
}

const AUD = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  minimumFractionDigits: 2,
});

/** 650000 → "$6,500.00" */
export function formatAUD(cents: number): string {
  return AUD.format(cents / 100);
}

/** "$6,500" for headline prices — no cents when the amount is whole dollars. */
export function formatAUDShort(cents: number): string {
  return cents % 100 === 0
    ? new Intl.NumberFormat("en-AU", {
        style: "currency",
        currency: "AUD",
        maximumFractionDigits: 0,
      }).format(cents / 100)
    : formatAUD(cents);
}

/** How a price reads on the site: fixed, or a "from" band for quoted tiers. */
export function priceLabel(product: Product): string {
  if (product.amountCents !== null) return `${formatAUDShort(product.amountCents)} + GST`;
  if (product.fromCents !== null && product.toCents !== null) {
    return `${formatAUDShort(product.fromCents)}–${formatAUDShort(product.toCents)} + GST`;
  }
  if (product.fromCents !== null) return `from ${formatAUDShort(product.fromCents)} + GST`;
  return "Quoted per engagement";
}

/** Invoice numbers are issued by Postgres (next_invoice_number); 369-00001. */
export const INVOICE_NUMBER_PREFIX = "369-";
export const PROPOSAL_NUMBER_PREFIX = "P-";

/** Default payment terms — 7 days, matching how the invoice copy reads. */
export const PAYMENT_TERMS_DAYS = 7;

export function dueDateFrom(issueDate: string, days: number = PAYMENT_TERMS_DAYS): string {
  const d = new Date(`${issueDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// -------------------------------------------------- Regulated Design Audit

/**
 * The inverted guarantee: the audit is only worth paying for if it finds
 * something, so the fee is contingent on a material finding. P1/P2 are the
 * severities used by the DBP audit (P1 critical, P2 major).
 */
export const RDA_GUARANTEE =
  "If the audit returns no P1 or P2 finding, you do not pay.";

export const RDA_TERMS = `Payment is due within ${PAYMENT_TERMS_DAYS} days of invoice. Invoices are raised on delivery of the audit deliverables. Payment can be made by bank transfer or by card. All amounts are in AUD and exclude GST unless stated.`;

export const RDA_PRODUCTS: Product[] = [
  {
    code: "RDA-1",
    name: "Regulated Design Audit — Single Project",
    summary:
      "Fixed-fee audit of one Class 2/3/9c regulated design set. Two session days. Seven deliverables the client keeps.",
    amountCents: toCents(6_500),
    fromCents: null,
    toCents: null,
    quoteOnly: false,
    gstApplicable: true,
  },
  {
    code: "RDA-2",
    name: "Regulated Design Audit — Practice",
    summary:
      "Practice-wide audit across live projects. Session days scaled to headcount. Includes the compliance gap register.",
    amountCents: toCents(24_000),
    fromCents: null,
    toCents: null,
    quoteOnly: false,
    gstApplicable: true,
  },
  {
    code: "RDA-3",
    name: "Regulated Design Audit — Enterprise",
    summary:
      "Multi-project enterprise audit with the build phase scoped. Quoted per engagement.",
    amountCents: null,
    fromCents: toCents(48_000),
    toCents: toCents(65_000),
    quoteOnly: true,
    gstApplicable: true,
  },
];

export function productByCode(code: string): Product | undefined {
  return RDA_PRODUCTS.find(p => p.code === code);
}

/** Products that can go straight to Stripe Checkout (a fixed price exists). */
export function isCheckoutable(product: Product): boolean {
  return !product.quoteOnly && product.amountCents !== null;
}
