# Billing setup — proposals, invoices, payments, Stripe

The billing backbone is proposal → invoice → payment. A priced proposal goes to
the client on an unguessable link; accepting it issues the invoice; the invoice
is settled either by a recorded bank transfer or by card through Stripe
Checkout. Everything is AUD, in integer cents, ex-GST in the catalogue with GST
added per document.

## Environment variables

| Variable | Where | What it does |
| --- | --- | --- |
| `SUPABASE_URL` | server | Project URL, e.g. `https://xxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | server | Service role key. **Never** prefix with `VITE_` or send to the browser — it bypasses RLS |
| `STRIPE_SECRET_KEY` | server | `sk_test_…` while testing, `sk_live_…` in production |
| `STRIPE_WEBHOOK_SECRET` | server | `whsec_…` from `stripe listen` or the Dashboard endpoint |
| `STAFF_API_TOKEN` | server | **Required.** Shared secret for the staff routes. Without it `/api/billing` and `/api/checkout` answer 503 — closed, not open |
| `PUBLIC_BASE_URL` | server | **Required in production.** Absolute origin for emailed links and Stripe return URLs. Falls back to the request host only outside production |

Missing credentials never crash the API: the billing routes answer
`503 { error: "… not configured" }` and the rest of the app keeps working.

Local development reads `.env` / `.env.local` (see the `start` script). On
Vercel, set all six in Project → Settings → Environment Variables.

### Why those last two are not optional

`vercel.json` rewrites every `/api/(.*)` to the one serverless function, so
anything mounted on the Express app is on the public internet. The staff routes
read and write client records, invoices and payments, and there is no portal in
front of Express to inherit authentication from — hence `STAFF_API_TOKEN`.
Generate one with `openssl rand -hex 32`.

`PUBLIC_BASE_URL` matters because `Host` and `X-Forwarded-Proto` are set by the
caller. Those headers would otherwise decide where an emailed proposal link
points and where a payer lands after paying, so in production the origin has to
come from configuration.

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are the same names the existing
`supabase/functions/review-admin` edge function already reads, so a deployment
that has those set is already half configured. Note that the course review
platform points its browser client at `VITE_REVIEW_SUPABASE_URL`, which may or
may not be the same project — decide whether billing shares that project or
gets its own before running the migration.

## Run the migration

Two files, both idempotent (`create table if not exists`, `create or replace`,
`on conflict do nothing`), so they are safe to re-run:

- `supabase/migrations/20261030120000_billing.sql` — the tables, sequences and
  the Regulated Design Audit seed.
- `supabase/migrations/20261030140000_billing_settle_invoice.sql` — the
  `settle_invoice` function, which settles an invoice atomically under a row
  lock so a Stripe webhook and a staff-recorded transfer arriving together
  cannot interleave and under-credit it.

With the Supabase CLI, from the repo root:

```bash
supabase db push
```

Or paste the file into the SQL editor in the Supabase dashboard. It creates
`clients`, `products`, `proposals`, `proposal_line_items`, `invoices`,
`payments`, the invoice/proposal number sequences, and seeds the three
Regulated Design Audit tiers.

### Row Level Security

RLS is **enabled and forced on every table with no permissive policy** — anon
and authenticated are denied outright. All access goes through the Express
routes using the service-role key, which bypasses RLS.

This is deliberate. The anon key ships in the browser bundle, so any anon
policy is a policy the public holds. Public proposal and invoice links are
resolved server-side by `view_token` and return only the fields the recipient
needs — never a client id, notes or other documents. When staff sign in through
Supabase Auth, add staff policies (there is a worked example at the bottom of
the migration) rather than opening anon access.

## API surface

Staff routes — all require the staff token, as
`X-Staff-Token: $STAFF_API_TOKEN` or `Authorization: Bearer $STAFF_API_TOKEN`:

```
GET  /api/billing/products
GET  /api/billing/clients
POST /api/billing/clients
GET  /api/billing/proposals
POST /api/billing/proposals
GET  /api/billing/proposals/:id
POST /api/billing/proposals/:id/send
POST /api/billing/proposals/:id/accept
GET  /api/billing/invoices
GET  /api/billing/invoices/:id
POST /api/billing/invoices/from-proposal/:proposalId
POST /api/billing/invoices/:id/send
POST /api/billing/invoices/:id/payments
```

Public, by `view_token` — no staff token, and exported as a separate router so
the guard cannot be applied to them by accident:

```
GET  /api/billing/public/proposal/:token
POST /api/billing/public/proposal/:token/respond
GET  /api/billing/public/invoice/:token
```

Card payment — the two `/api/checkout` routes are **staff-only**; the webhook
authenticates with Stripe's signature instead:

```
GET  /api/checkout/config
POST /api/checkout/session
POST /api/stripe/webhook
```

A client-facing "pay this invoice" button does not exist yet. When it is added
it needs its own endpoint scoped to the invoice's `view_token` — do not open
`/api/checkout` to do it.

### Checking the guards

```bash
node scripts/check-billing-guards.mjs
```

Stands the real Express app up on an ephemeral port and asserts that the staff
routes refuse an absent or wrong token, fail closed with no `STAFF_API_TOKEN`
set, let a correct one through, and still serve the public token links; then
checks that a caller-supplied return path cannot leave our origin. Exits
non-zero on any failure.

### A full pass by hand

```bash
# every staff call carries the token
AUTH="-H x-staff-token:$STAFF_API_TOKEN -H content-type:application/json"

# 1. a client
curl -s $AUTH localhost:3000/api/billing/clients \
  -d '{"company":"Example Builders","email":"accounts@example.com"}'

# 2. a proposal for the single-project tier (650000 cents ex-GST)
curl -s $AUTH localhost:3000/api/billing/proposals \
  -d '{"clientId":"<uuid>","title":"Regulated Design Audit","items":[{"productCode":"RDA-1","description":"Regulated Design Audit — Single Project","quantity":1,"unitAmountCents":650000}]}'

# 3. send it, then accept it (or let the client accept on the public link)
curl -s $AUTH -X POST localhost:3000/api/billing/proposals/<id>/send
curl -s $AUTH -X POST localhost:3000/api/billing/proposals/<id>/accept

# 4. issue the invoice — 369-00001, $6,500 + $650 GST = $7,150
curl -s $AUTH -X POST localhost:3000/api/billing/invoices/from-proposal/<proposalId>

# 5a. settle by bank transfer
curl -s $AUTH localhost:3000/api/billing/invoices/<id>/payments \
  -d '{"amountCents":715000,"method":"Bank Transfer","reference":"369-00001"}'

# 5b. or get a card checkout link
curl -s $AUTH localhost:3000/api/checkout/session \
  -d '{"productCode":"RDA-1","invoiceId":"<id>"}'
```

## Testing the webhook

The webhook is the only thing that marks an invoice paid by card — the success
redirect in the browser is not trusted.

```bash
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

`stripe listen` prints a `whsec_…`; put it in `STRIPE_WEBHOOK_SECRET` and
restart the server. Then either complete a real test checkout (card
`4242 4242 4242 4242`) or fire an event:

```bash
stripe trigger checkout.session.completed
```

A triggered event carries no `invoiceId`, so it answers
`{ received: true, settled: false, reason: "no invoice on session" }` — that is
the correct response, not a failure. To exercise settlement end to end, create
a session with `POST /api/checkout/session` including an `invoiceId`, open the
returned `url` and pay with the test card.

Four things to know:

- **Mount order.** The webhook is mounted in `server/app.ts` *before*
  `express.json()`. Signature verification hashes the exact bytes Stripe sent,
  so a parsed body fails every time. If you reorder `createApp()`, keep the
  `/api/stripe` mount first.
- **Idempotency.** `payments.stripe_event_id` is unique. Stripe retries on any
  non-2xx and replays events; a replay returns `duplicate: true` and does not
  take a second payment. The invoice's `amount_paid_cents` is always recomputed
  from its payment rows, never incremented, so it cannot drift.
- **`completed` is not proof of payment.** A deferred method (BECS Direct
  Debit, common in Australian B2B) completes the session before the money
  arrives, so settlement requires `payment_status === "paid"`.
  `checkout.session.async_payment_succeeded` is what settles those, and
  `async_payment_failed` is acknowledged without settling. Sessions are also
  currently filtered to card (`allowed_payment_method_types`), so widening that
  in the Dashboard will not quietly mark an unpaid invoice paid.
- **Currency.** The ledger is AUD cents. A session in any other currency is
  acknowledged but not settled — recording another currency's minor units as
  AUD would corrupt the ledger, so the invoice stays open for someone to look
  at.

## Money, GST and numbering

- Integer cents everywhere. `shared/billing.ts` holds the helpers (`toCents`,
  `gstOn`, `computeTotals`, `formatAUD`) and is the single source of the
  catalogue for the client.
- The catalogue is **ex-GST**. GST (10%) is computed per document and the rate
  is stored on the document, so a historic invoice never moves if the rate
  changes.
- Stripe charges the **gross** amount; the ex-GST/GST split travels in the
  session metadata.
- Invoice numbers come from Postgres: `369-00001`, monotonic, never reset per
  year. The number is what gets pasted into a bank payment reference, so it has
  to stay unique for the life of the business. Proposals are `P-00001`.
- Payment terms default to 7 days from issue.

## Regulated Design Audit tiers

Seeded in the migration and mirrored in `shared/billing.ts` — change both
together.

| Code | Tier | Price (ex-GST) |
| --- | --- | --- |
| `RDA-1` | Single Project | $6,500 |
| `RDA-2` | Practice | $24,000 |
| `RDA-3` | Enterprise | $48,000–$65,000, quoted per engagement |

`RDA-3` has no fixed price, so `POST /api/checkout/session` refuses it with a
409 — it goes out as a proposal instead.

The guarantee carried on proposals: **if the audit returns no P1 or P2 finding,
you do not pay.**

## Not built yet

- **Xero reconciliation.** `payments.method` is free text and already includes
  `Bank Transfer (Xero)` in the shared enum, so auto-matching a bank
  transaction's reference against an invoice number can be added without a
  schema change.
- **Supabase Auth for staff.** `STAFF_API_TOKEN` is a shared secret, which is
  enough for a small team but gives no per-person identity and no revocation
  short of rotating it. `server/lib/staff-auth.ts` is one function and one
  `router.use` per router, so swapping it for Supabase Auth JWT verification
  touches nothing else.
- **A client-facing pay button.** `/api/checkout` is staff-only. Letting a
  client pay their own invoice needs an endpoint scoped to that invoice's
  `view_token`, not an opening of the staff routes.
- **PDF rendering.** The repo already uses jsPDF client-side; proposal and
  invoice PDFs should be generated there from the public token payloads.
