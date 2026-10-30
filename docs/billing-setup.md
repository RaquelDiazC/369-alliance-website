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
| `PUBLIC_BASE_URL` | server, optional | Absolute origin used in proposal/invoice links and Stripe return URLs. Falls back to the request host |

Missing credentials never crash the API: the billing routes answer
`503 { error: "… not configured" }` and the rest of the app keeps working.

Local development reads `.env` / `.env.local` (see the `start` script). On
Vercel, set all four in Project → Settings → Environment Variables.

## Run the migration

The schema is one file: `supabase/migrations/0001_billing.sql`. It is
idempotent (`create table if not exists`, `on conflict do nothing`), so it is
safe to re-run.

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

Staff routes — these expect to sit behind the staff portal:

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

Public, by token:

```
GET  /api/billing/public/proposal/:token
POST /api/billing/public/proposal/:token/respond
GET  /api/billing/public/invoice/:token
```

Card payment:

```
GET  /api/checkout/config
POST /api/checkout/session
POST /api/stripe/webhook
```

### A full pass by hand

```bash
# 1. a client
curl -s localhost:3000/api/billing/clients -H 'content-type: application/json' \
  -d '{"company":"Example Builders","email":"accounts@example.com"}'

# 2. a proposal for the single-project tier (650000 cents ex-GST)
curl -s localhost:3000/api/billing/proposals -H 'content-type: application/json' \
  -d '{"clientId":"<uuid>","title":"Regulated Design Audit","items":[{"productCode":"RDA-1","description":"Regulated Design Audit — Single Project","quantity":1,"unitAmountCents":650000}]}'

# 3. send it, then accept it (or let the client accept on the public link)
curl -s -X POST localhost:3000/api/billing/proposals/<id>/send
curl -s -X POST localhost:3000/api/billing/proposals/<id>/accept

# 4. issue the invoice — 369-00001, $6,500 + $650 GST = $7,150
curl -s -X POST localhost:3000/api/billing/invoices/from-proposal/<proposalId>

# 5a. settle by bank transfer
curl -s localhost:3000/api/billing/invoices/<id>/payments -H 'content-type: application/json' \
  -d '{"amountCents":715000,"method":"Bank Transfer","reference":"369-00001"}'

# 5b. or get a card checkout link
curl -s localhost:3000/api/checkout/session -H 'content-type: application/json' \
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

Two things to know:

- **Mount order.** The webhook is mounted in `server/app.ts` *before*
  `express.json()`. Signature verification hashes the exact bytes Stripe sent,
  so a parsed body fails every time. If you reorder `createApp()`, keep the
  `/api/stripe` mount first.
- **Idempotency.** `payments.stripe_event_id` is unique. Stripe retries on any
  non-2xx and replays events; a replay returns `duplicate: true` and does not
  take a second payment. The invoice's `amount_paid_cents` is always recomputed
  from its payment rows, never incremented, so it cannot drift.

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
- **Staff auth.** The staff routes have no authentication of their own yet;
  they assume the staff portal in front. Do not expose them publicly as they
  stand.
- **PDF rendering.** The repo already uses jsPDF client-side; proposal and
  invoice PDFs should be generated there from the public token payloads.
