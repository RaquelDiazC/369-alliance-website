-- 369 Alliance — billing backbone (proposals → invoices → payments)
--
-- Shape follows the proven pattern: a priced proposal is sent to the client,
-- acceptance converts it to an invoice, and the invoice is settled by one or
-- more payments. Payment methods are free text so bank-transfer reconciliation
-- (Xero) can be added later without a schema change; Stripe Checkout writes a
-- payment row with the event id for idempotency.
--
-- Money is stored in integer cents (AUD). Products are priced EXCLUDING GST;
-- GST (10%) is computed per document and stored alongside the subtotal so a
-- historic invoice never moves if the rate changes.
--
-- RLS: enabled on every table with NO permissive policy. All access goes
-- through the Express routes in server/routes/billing.ts using the
-- service-role key, which bypasses RLS. This is deliberate and is the safer of
-- the two options: public proposal/invoice links are resolved server-side by
-- view_token, so the anon key can never enumerate clients, prices or payments
-- even though it ships in the browser bundle. When Supabase Auth is wired for
-- staff, add the staff policies at the bottom of this file rather than opening
-- anon access.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- utilities

create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Monotonic, human-quotable invoice number (369-00001). Deliberately not reset
-- per year: it is pasted into the payment reference and must stay unique for
-- the life of the business so a bank transaction maps to exactly one invoice.
create sequence if not exists invoice_number_seq start 1;

create or replace function next_invoice_number() returns text
language sql as $$
  select '369-' || lpad(nextval('invoice_number_seq')::text, 5, '0');
$$;

create sequence if not exists proposal_number_seq start 1;

create or replace function next_proposal_number() returns text
language sql as $$
  select 'P-' || lpad(nextval('proposal_number_seq')::text, 5, '0');
$$;

-- ------------------------------------------------------------------ clients

create table if not exists clients (
  id            uuid primary key default gen_random_uuid(),
  company       text not null,
  contact_name  text,
  email         text,
  phone         text,
  abn           text,
  address       text,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists clients_company_idx on clients (lower(company));
create index if not exists clients_email_idx on clients (lower(email));

-- ----------------------------------------------------------------- products
-- The sellable catalogue. Seeded below with the Regulated Design Audit tiers;
-- the canonical copy of these lives in shared/billing.ts (single source for
-- the client) and is kept in step with this seed.

create table if not exists products (
  id               uuid primary key default gen_random_uuid(),
  code             text not null unique,
  name             text not null,
  summary          text,
  -- null amount = quoted per engagement (tier 3); the UI shows "from".
  amount_cents     integer check (amount_cents is null or amount_cents >= 0),
  from_cents       integer check (from_cents is null or from_cents >= 0),
  to_cents         integer check (to_cents is null or to_cents >= 0),
  gst_applicable   boolean not null default true,
  quote_only       boolean not null default false,
  active           boolean not null default true,
  sort             integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ---------------------------------------------------------------- proposals

create table if not exists proposals (
  id              uuid primary key default gen_random_uuid(),
  number          text not null unique default next_proposal_number(),
  client_id       uuid not null references clients (id) on delete restrict,
  title           text not null,
  status          text not null default 'draft'
                    check (status in ('draft', 'sent', 'accepted', 'declined', 'expired')),
  subtotal_cents  integer not null default 0 check (subtotal_cents >= 0),
  gst_cents       integer not null default 0 check (gst_cents >= 0),
  total_cents     integer not null default 0 check (total_cents >= 0),
  gst_rate        numeric(5, 4) not null default 0.1000,
  terms           text,
  guarantee       text,
  valid_until     date,
  -- Unguessable public link. Resolved only by the server; see the RLS note.
  view_token      uuid not null unique default gen_random_uuid(),
  sent_at         timestamptz,
  responded_at    timestamptz,
  decline_reason  text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists proposals_client_idx on proposals (client_id);
create index if not exists proposals_status_idx on proposals (status);

create table if not exists proposal_line_items (
  id                 uuid primary key default gen_random_uuid(),
  proposal_id        uuid not null references proposals (id) on delete cascade,
  product_code       text,
  description        text not null,
  quantity           numeric(10, 2) not null default 1 check (quantity > 0),
  unit_amount_cents  integer not null check (unit_amount_cents >= 0),
  amount_cents       integer not null check (amount_cents >= 0),
  sort               integer not null default 0,
  created_at         timestamptz not null default now()
);

create index if not exists proposal_line_items_proposal_idx
  on proposal_line_items (proposal_id, sort);

-- ----------------------------------------------------------------- invoices

create table if not exists invoices (
  id                 uuid primary key default gen_random_uuid(),
  number             text not null unique default next_invoice_number(),
  client_id          uuid not null references clients (id) on delete restrict,
  proposal_id        uuid references proposals (id) on delete set null,
  status             text not null default 'draft'
                       check (status in ('draft', 'sent', 'paid', 'overdue', 'void')),
  issue_date         date not null default current_date,
  due_date           date,
  subtotal_cents     integer not null default 0 check (subtotal_cents >= 0),
  gst_cents          integer not null default 0 check (gst_cents >= 0),
  total_cents        integer not null default 0 check (total_cents >= 0),
  gst_rate           numeric(5, 4) not null default 0.1000,
  amount_paid_cents  integer not null default 0 check (amount_paid_cents >= 0),
  line_items         jsonb not null default '[]'::jsonb,
  terms              text,
  notes              text,
  view_token         uuid not null unique default gen_random_uuid(),
  sent_at            timestamptz,
  paid_at            timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists invoices_client_idx on invoices (client_id);
create index if not exists invoices_status_idx on invoices (status);
create index if not exists invoices_proposal_idx on invoices (proposal_id);

-- One invoice per accepted proposal — stops a double issue from a retried call.
create unique index if not exists invoices_one_per_proposal
  on invoices (proposal_id) where proposal_id is not null;

-- ----------------------------------------------------------------- payments
-- method is free text on purpose: 'Bank Transfer', 'Cash', 'Card', 'Stripe',
-- and later 'Bank Transfer (Xero)' when auto-reconciliation lands.

create table if not exists payments (
  id                 uuid primary key default gen_random_uuid(),
  invoice_id         uuid not null references invoices (id) on delete cascade,
  amount_cents       integer not null check (amount_cents > 0),
  method             text not null default 'Bank Transfer',
  reference          text,
  paid_on            date not null default current_date,
  -- Stripe idempotency: a replayed webhook cannot create a second payment.
  stripe_event_id    text unique,
  stripe_session_id  text,
  stripe_payment_intent text,
  created_at         timestamptz not null default now()
);

create index if not exists payments_invoice_idx on payments (invoice_id);

-- -------------------------------------------------------------- updated_at

drop trigger if exists clients_updated_at on clients;
create trigger clients_updated_at before update on clients
  for each row execute function set_updated_at();

drop trigger if exists products_updated_at on products;
create trigger products_updated_at before update on products
  for each row execute function set_updated_at();

drop trigger if exists proposals_updated_at on proposals;
create trigger proposals_updated_at before update on proposals
  for each row execute function set_updated_at();

drop trigger if exists invoices_updated_at on invoices;
create trigger invoices_updated_at before update on invoices
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------- RLS
-- Enabled with no policy: deny-all for anon and authenticated. The service
-- role used by the server bypasses RLS. Do not add an anon policy — the anon
-- key is public in the browser bundle.

alter table clients            enable row level security;
alter table products           enable row level security;
alter table proposals          enable row level security;
alter table proposal_line_items enable row level security;
alter table invoices           enable row level security;
alter table payments           enable row level security;

alter table clients            force row level security;
alter table products           force row level security;
alter table proposals          force row level security;
alter table proposal_line_items force row level security;
alter table invoices           force row level security;
alter table payments           force row level security;

-- When staff sign in through Supabase Auth, grant them read/write here instead
-- of opening anon access, e.g.:
--
--   create policy staff_all on invoices for all to authenticated
--     using (auth.jwt() ->> 'role' = 'staff')
--     with check (auth.jwt() ->> 'role' = 'staff');

-- ------------------------------------------------------- Regulated Design Audit
-- Tiers ex-GST. Tier 3 is quoted per engagement (48k–65k band).

insert into products (code, name, summary, amount_cents, from_cents, to_cents, quote_only, sort)
values
  ('RDA-1',
   'Regulated Design Audit — Single Project',
   'Fixed-fee audit of one Class 2/3/9c regulated design set. Two session days. Seven deliverables the client keeps.',
   650000, null, null, false, 1),
  ('RDA-2',
   'Regulated Design Audit — Practice',
   'Practice-wide audit across live projects. Session days scaled to headcount. Includes the compliance gap register.',
   2400000, null, null, false, 2),
  ('RDA-3',
   'Regulated Design Audit — Enterprise',
   'Multi-project enterprise audit with the build phase scoped. Quoted per engagement.',
   null, 4800000, 6500000, true, 3)
on conflict (code) do nothing;
