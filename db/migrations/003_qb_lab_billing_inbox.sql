-- Candidate isolated-staging foundation. No billing worker, customer creation or entitlement activation.
begin;
create table public.qb_billing_customers (
 account_id uuid primary key references public.qb_accounts(id) on delete cascade,
 customer_id text not null unique check(customer_id ~ '^cus_[A-Za-z0-9]+$')
);
create table public.qb_subscription_inbox (
 event_id text primary key check(event_id ~ '^evt_[A-Za-z0-9]+$'),
 event_type text not null check(event_type in ('customer.subscription.created','customer.subscription.updated','customer.subscription.deleted','invoice.paid','invoice.payment_failed')),
 object_id text not null check(length(object_id) between 1 and 120),
 received_at timestamptz not null default now(),
 reconciled_at timestamptz
);
alter table public.qb_billing_customers enable row level security;
alter table public.qb_subscription_inbox enable row level security;
revoke all on public.qb_billing_customers,public.qb_subscription_inbox from public,anon,authenticated;
-- No browser reads/mutations and no raw webhook JSON, email, card or child information stored.
create function public.qb_enqueue_subscription_event(event_id text,event_type text,object_id text) returns boolean
language plpgsql security definer set search_path='' as $$
declare inserted integer;
begin
 insert into public.qb_subscription_inbox(event_id,event_type,object_id)
 values(event_id,event_type,object_id) on conflict do nothing;
 get diagnostics inserted = row_count;
 return inserted=1;
end;
$$;
revoke all on function public.qb_enqueue_subscription_event(text,text,text) from public,anon,authenticated;
grant execute on function public.qb_enqueue_subscription_event(text,text,text) to service_role;
commit;
