-- Atomic invoice settlement.
--
-- The first cut read the payment rows, summed them in the application and then
-- wrote amount_paid_cents back. Two settlements landing together (a Stripe
-- webhook and a staff-recorded transfer, or a webhook retried while the first
-- call is still in flight) could interleave between the read and the write and
-- leave the invoice under-credited. It self-corrected on the next settlement,
-- but an invoice that reads as part-paid when it is fully paid is the kind of
-- thing that gets chased.
--
-- This closes the window: `for update` serialises concurrent settlements of
-- the same invoice, and the sum is taken after the lock is held.
--
-- Settlement stays derived, never incremented — amount_paid_cents is always
-- recomputed from the payment rows, so it cannot drift from what was received.

create or replace function settle_invoice(p_invoice_id uuid)
returns invoices
language plpgsql
as $$
declare
  v_invoice invoices;
  v_paid    integer;
  v_covered boolean;
begin
  -- Serialise against any other settlement of this invoice.
  select * into v_invoice from invoices where id = p_invoice_id for update;
  if not found then
    raise exception 'invoice % not found', p_invoice_id using errcode = 'no_data_found';
  end if;

  select coalesce(sum(amount_cents), 0)::integer
    into v_paid
    from payments
   where invoice_id = p_invoice_id;

  v_covered := v_invoice.total_cents > 0 and v_paid >= v_invoice.total_cents;

  update invoices
     set amount_paid_cents = v_paid,
         status = case
                    when v_invoice.status = 'void' then v_invoice.status
                    when v_covered then 'paid'
                    -- A payment was removed or corrected downward: reopen it.
                    when v_invoice.status = 'paid' then 'sent'
                    else v_invoice.status
                  end,
         paid_at = case
                     when v_invoice.status = 'void' then v_invoice.paid_at
                     when v_covered then coalesce(v_invoice.paid_at, now())
                     else null
                   end
   where id = p_invoice_id
  returning * into v_invoice;

  return v_invoice;
end;
$$;

-- Security invoker (the default): called with the service role, which bypasses
-- RLS. Anon and authenticated are denied the tables anyway, but do not leave
-- them able to call it.
revoke all on function settle_invoice(uuid) from public;
revoke all on function settle_invoice(uuid) from anon;
revoke all on function settle_invoice(uuid) from authenticated;
grant execute on function settle_invoice(uuid) to service_role;
