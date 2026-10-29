-- Additive, isolated Coach Tae tables. Review against a staging Supabase schema first.
begin;
create table public.ct_coaches (user_id uuid primary key references auth.users(id));
create table public.ct_families (id uuid primary key references auth.users(id), email text not null, stripe_customer_id text unique, created_at timestamptz not null default now());
create table public.ct_athletes (id uuid primary key default gen_random_uuid(), family_id uuid not null references public.ct_families, name text not null check(length(name) between 1 and 100), graduation_year int check(graduation_year between 2020 and 2050), created_at timestamptz not null default now());
create table public.ct_settings (id boolean primary key default true check(id), timezone text not null default 'America/New_York', cancellation_hours int not null default 24 check(cancellation_hours between 0 and 168), reschedule_hours int not null default 24 check(reschedule_hours between 0 and 168), notice_hours int not null default 12 check(notice_hours between 0 and 168), location text not null default 'Location provided by Coach Tae');
insert into public.ct_settings default values;
create table public.ct_rules (id uuid primary key default gen_random_uuid(), kind text not null check(kind in ('private','group')), weekday int not null check(weekday between 0 and 6), local_start time not null, timezone text not null default 'America/New_York', duration_minutes int not null check(duration_minutes between 15 and 180), buffer_minutes int not null default 15 check(buffer_minutes between 0 and 60), capacity int not null check(capacity between 1 and 30), active boolean not null default true, check(kind <> 'private' or capacity=1));
create table public.ct_blocks (id uuid primary key default gen_random_uuid(), starts_at timestamptz not null, ends_at timestamptz not null, reason text not null default '', check(ends_at > starts_at));
create table public.ct_slots (id uuid primary key default gen_random_uuid(), rule_id uuid references public.ct_rules, kind text not null check(kind in ('private','group')), starts_at timestamptz not null, ends_at timestamptz not null, buffer_minutes int not null default 15 check(buffer_minutes between 0 and 60), capacity int not null check(capacity between 1 and 30), occupied_range tstzrange not null, cancelled boolean not null default false, unique(rule_id,starts_at), check(ends_at > starts_at), check(kind <> 'private' or capacity=1));
-- Structural protection even if a future backend forgets the schedule lock.
create function public.ct_slot_range() returns trigger language plpgsql set search_path='' as $$
begin new.occupied_range:=tstzrange(new.starts_at-new.buffer_minutes*interval '1 minute',new.ends_at+new.buffer_minutes*interval '1 minute','[)'); return new; end $$;
create trigger ct_slot_range before insert or update on public.ct_slots for each row execute function public.ct_slot_range();
alter table public.ct_slots add constraint ct_no_coach_overlap exclude using gist (occupied_range with &&) where (not cancelled);
create index ct_slots_start on public.ct_slots(starts_at);
create table public.ct_bookings (id uuid primary key default gen_random_uuid(), family_id uuid not null references public.ct_families, athlete_id uuid not null references public.ct_athletes, slot_id uuid not null references public.ct_slots, status text not null check(status in ('held','confirmed','cancelled','expired')), hold_until timestamptz, paid boolean not null default false, request_id uuid not null unique, version int not null default 1, created_at timestamptz not null default now());
create index ct_booking_slot on public.ct_bookings(slot_id,status);
create table public.ct_credits (id uuid primary key default gen_random_uuid(), family_id uuid not null references public.ct_families, kind text not null check(kind in ('private','group')), delta int not null check(delta<>0), source text not null unique, created_at timestamptz not null default now());
create index ct_credit_family on public.ct_credits(family_id,kind);
create table public.ct_orders (id uuid primary key default gen_random_uuid(), family_id uuid not null references public.ct_families, product_key text not null check(product_key in ('group','private','group_pack','private_pack','lab_monthly','lab_annual')), price_id text not null, booking_id uuid references public.ct_bookings, session_id text unique, payment_intent_id text unique, amount int, currency text, status text not null default 'pending' check(status in ('pending','paid','refund_pending','refunded')), created_at timestamptz not null default now());
create table public.ct_memberships (subscription_id text primary key, family_id uuid not null references public.ct_families, status text not null, access_until timestamptz not null, cancel_at_period_end boolean not null default false, updated_at timestamptz not null default now(), observed_event_created bigint not null default 0);
create index ct_membership_family on public.ct_memberships(family_id);
create table public.ct_invoices (invoice_id text primary key, family_id uuid not null references public.ct_families, amount_paid int not null, currency text not null, status text not null, hosted_invoice_url text, created_at timestamptz not null);
create table public.ct_events (event_id text primary key, event_type text not null, processed_at timestamptz not null default now());
create table public.ct_outbox (id uuid primary key default gen_random_uuid(), dedupe_key text not null unique, kind text not null, family_id uuid references public.ct_families, payload jsonb not null default '{}', run_at timestamptz not null default now(), attempts int not null default 0, locked_until timestamptz, completed_at timestamptz, last_error text, created_at timestamptz not null default now());
create index ct_outbox_due on public.ct_outbox(run_at) where completed_at is null;
create table public.ct_lessons (id uuid primary key default gen_random_uuid(), title text not null, category text not null check(category in ('football_iq','stretching','development','quiz')), body text not null, questions jsonb not null default '[]', published boolean not null default false, created_at timestamptz not null default now());
create table public.ct_progress (athlete_id uuid references public.ct_athletes, lesson_id uuid references public.ct_lessons, score int check(score between 0 and 100), completed_at timestamptz not null default now(), primary key(athlete_id,lesson_id));

-- All writes go through authenticated server handlers and service-role-only RPCs.
-- Browser RLS permits only family-owned reads, coach reads, and entitled lesson reads.
create function public.ct_is_coach() returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from public.ct_coaches where user_id=auth.uid()) $$;
create function public.ct_has_membership(p_family uuid) returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from public.ct_memberships where family_id=p_family and status in ('active','trialing') and access_until>now()) $$;
do $$ declare t text; begin
 foreach t in array array['ct_coaches','ct_families','ct_athletes','ct_settings','ct_rules','ct_blocks','ct_slots','ct_bookings','ct_credits','ct_orders','ct_memberships','ct_invoices','ct_events','ct_outbox','ct_lessons','ct_progress'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon, authenticated',t);
 execute format('grant all on public.%I to service_role',t);
 end loop;
end $$;
grant select on public.ct_families, public.ct_athletes, public.ct_bookings, public.ct_credits, public.ct_orders, public.ct_memberships, public.ct_invoices, public.ct_lessons, public.ct_progress, public.ct_coaches to authenticated;
create policy ct_family_read on public.ct_families for select to authenticated using(id=auth.uid() or public.ct_is_coach());
create policy ct_coach_self on public.ct_coaches for select to authenticated using(user_id=auth.uid());
do $$ declare t text; begin foreach t in array array['ct_athletes','ct_bookings','ct_credits','ct_orders','ct_memberships','ct_invoices'] loop execute format('create policy ct_owned_read on public.%I for select to authenticated using(family_id=auth.uid() or public.ct_is_coach())',t); end loop; end $$;
create policy ct_lesson_read on public.ct_lessons for select to authenticated using(public.ct_is_coach());
create policy ct_progress_read on public.ct_progress for select to authenticated using(public.ct_is_coach() or exists(select 1 from public.ct_athletes a where a.id=athlete_id and a.family_id=auth.uid()));

-- A single transaction-scoped lock serializes the one-coach schedule and ledger.
-- Every capacity/availability/credit mutation below takes the SAME lock.
create function public.ct_enqueue(p_key text,p_kind text,p_family uuid,p_payload jsonb,p_at timestamptz default now()) returns void language sql set search_path='' as $$
 insert into public.ct_outbox(dedupe_key,kind,family_id,payload,run_at) values(p_key,p_kind,p_family,p_payload,p_at) on conflict(dedupe_key) do nothing;
$$;
create function public.ct_assert_slot(p_slot uuid,p_athlete uuid,p_exclude uuid default null) returns public.ct_slots language plpgsql set search_path='' as $$
declare s public.ct_slots; n int; begin
 select * into s from public.ct_slots where id=p_slot for update;
 if not found or s.cancelled or s.starts_at < now()+(select notice_hours from public.ct_settings)*interval '1 hour' then raise exception 'Session unavailable or inside booking notice period'; end if;
 if exists(select 1 from public.ct_blocks b where tstzrange(b.starts_at,b.ends_at,'[)') && tstzrange(s.starts_at-s.buffer_minutes*interval '1 minute',s.ends_at+s.buffer_minutes*interval '1 minute','[)')) then raise exception 'Session blocked'; end if;
 select count(*) into n from public.ct_bookings where slot_id=s.id and id is distinct from p_exclude and (status='confirmed' or (status='held' and hold_until>now()));
 if n>=s.capacity then raise exception 'Session is full'; end if;
 if exists(select 1 from public.ct_bookings b join public.ct_slots x on x.id=b.slot_id where b.athlete_id=p_athlete and b.id is distinct from p_exclude and (b.status='confirmed' or (b.status='held' and b.hold_until>now())) and tstzrange(x.starts_at,x.ends_at,'[)') && tstzrange(s.starts_at,s.ends_at,'[)')) then raise exception 'Athlete already booked at this time'; end if;
 return s;
end $$;
create function public.ct_book(p_family uuid,p_athlete uuid,p_slot uuid,p_credit boolean,p_request uuid) returns public.ct_bookings language plpgsql set search_path='' as $$
declare s public.ct_slots; b public.ct_bookings; balance int; begin
 perform pg_advisory_xact_lock(871204);
 select * into b from public.ct_bookings where request_id=p_request;
 if found then
 if b.family_id<>p_family or b.athlete_id<>p_athlete or b.slot_id<>p_slot then raise exception 'Request already used'; end if; return b; end if;
 if not exists(select 1 from public.ct_athletes where id=p_athlete and family_id=p_family) then raise exception 'Athlete not found'; end if;
 if (select count(*) from public.ct_bookings where family_id=p_family and status='held' and hold_until>now())>=3 then raise exception 'Complete or wait for existing reservations to expire'; end if;
 s:=public.ct_assert_slot(p_slot,p_athlete);
 if p_credit then
 select coalesce(sum(delta),0) into balance from public.ct_credits where family_id=p_family and kind=s.kind;
 if balance<1 then raise exception 'No eligible credits'; end if;
 end if;
 insert into public.ct_bookings(family_id,athlete_id,slot_id,status,hold_until,paid,request_id) values(p_family,p_athlete,p_slot,case when p_credit then 'confirmed' else 'held' end,case when not p_credit then now()+interval '35 minutes' end,p_credit,p_request) returning * into b;
 if p_credit then
 insert into public.ct_credits(family_id,kind,delta,source) values(p_family,s.kind,-1,'booking:'||b.id);
 perform public.ct_enqueue('confirmed:'||b.id,'booking_confirmed',p_family,jsonb_build_object('booking_id',b.id));
 perform public.ct_enqueue('reminder:'||b.id||':1','reminder',p_family,jsonb_build_object('booking_id',b.id,'version',1),greatest(now(),s.starts_at-interval '24 hours'));
 end if;
 return b;
end $$;
create function public.ct_manage_booking(p_family uuid,p_booking uuid,p_target uuid default null) returns public.ct_bookings language plpgsql set search_path='' as $$
declare b public.ct_bookings; old public.ct_slots; s public.ct_slots; cutoff int; begin
 perform pg_advisory_xact_lock(871204);
 select * into b from public.ct_bookings where id=p_booking and family_id=p_family for update;
 if not found then raise exception 'Booking not found'; end if;
 if b.status='cancelled' and p_target is null then return b; end if;
 if b.status<>'confirmed' then raise exception 'Only confirmed bookings can be managed'; end if;
 select * into old from public.ct_slots where id=b.slot_id;
 select case when p_target is null then cancellation_hours else reschedule_hours end into cutoff from public.ct_settings;
 if old.starts_at<now()+cutoff*interval '1 hour' then raise exception 'Outside self-service policy. Contact Coach Tae.'; end if;
 if p_target is null then
 update public.ct_bookings set status='cancelled',version=version+1 where id=b.id returning * into b;
 insert into public.ct_credits(family_id,kind,delta,source) values(p_family,old.kind,1,'cancellation:'||b.id) on conflict(source) do nothing;
 perform public.ct_enqueue('cancelled:'||b.id,'booking_cancelled',p_family,jsonb_build_object('booking_id',b.id));
 else
 if p_target=b.slot_id then return b; end if;
 s:=public.ct_assert_slot(p_target,b.athlete_id,b.id);
 if s.kind<>old.kind then raise exception 'Choose the same training type'; end if;
 update public.ct_bookings set slot_id=p_target,version=version+1 where id=b.id returning * into b;
 perform public.ct_enqueue('rescheduled:'||b.id||':'||b.version,'booking_rescheduled',p_family,jsonb_build_object('booking_id',b.id));
 perform public.ct_enqueue('reminder:'||b.id||':'||b.version,'reminder',p_family,jsonb_build_object('booking_id',b.id,'version',b.version),greatest(now(),s.starts_at-interval '24 hours'));
 end if; return b;
end $$;
create function public.ct_publish(p_days int default 60) returns int language plpgsql set search_path='' as $$
declare r public.ct_rules; d date; start_time timestamptz; finish timestamptz; n int:=0; begin
 perform pg_advisory_xact_lock(871204);
 if p_days<1 or p_days>90 then raise exception 'Invalid publishing window'; end if;
 -- Preserve published IDs, so a cron refresh never invalidates an open booking form.
 for r in select * from public.ct_rules where active loop
 if not exists(select 1 from pg_timezone_names where name=r.timezone) then raise exception 'Invalid timezone'; end if;
 for d in select x::date from generate_series((now() at time zone r.timezone)::date::timestamp,((now() at time zone r.timezone)::date+p_days)::timestamp,interval '1 day') x loop
 if extract(dow from d)=r.weekday then
 start_time:=(d+r.local_start) at time zone r.timezone; finish:=start_time+r.duration_minutes*interval '1 minute';
 if start_time>now() and not exists(select 1 from public.ct_slots s where not s.cancelled and tstzrange(s.starts_at-s.buffer_minutes*interval '1 minute',s.ends_at+s.buffer_minutes*interval '1 minute','[)') && tstzrange(start_time-r.buffer_minutes*interval '1 minute',finish+r.buffer_minutes*interval '1 minute','[)')) and not exists(select 1 from public.ct_blocks b where tstzrange(b.starts_at,b.ends_at,'[)') && tstzrange(start_time-r.buffer_minutes*interval '1 minute',finish+r.buffer_minutes*interval '1 minute','[)')) then
 insert into public.ct_slots(rule_id,kind,starts_at,ends_at,buffer_minutes,capacity) values(r.id,r.kind,start_time,finish,r.buffer_minutes,r.capacity) on conflict(rule_id,starts_at) do update set cancelled=false,capacity=excluded.capacity,buffer_minutes=excluded.buffer_minutes; n:=n+1;
 end if; end if; end loop; end loop; return n;
end $$;
create function public.ct_admin_schedule(p_action text,p_data jsonb) returns void language plpgsql set search_path='' as $$
declare n int; s public.ct_slots; begin
 perform pg_advisory_xact_lock(871204);
 if p_action='block' then
 if exists(select 1 from public.ct_bookings b join public.ct_slots x on x.id=b.slot_id where (b.status='confirmed' or (b.status='held' and b.hold_until>now())) and tstzrange(x.starts_at-x.buffer_minutes*interval '1 minute',x.ends_at+x.buffer_minutes*interval '1 minute','[)') && tstzrange((p_data->>'starts_at')::timestamptz,(p_data->>'ends_at')::timestamptz,'[)')) then raise exception 'Block conflicts with existing bookings. Resolve these first.'; end if;
 insert into public.ct_blocks(starts_at,ends_at,reason) values((p_data->>'starts_at')::timestamptz,(p_data->>'ends_at')::timestamptz,p_data->>'reason');
 elsif p_action='unblock' then delete from public.ct_blocks where id=(p_data->>'id')::uuid;
 elsif p_action='capacity' then
 select * into s from public.ct_slots where id=(p_data->>'id')::uuid for update;
 select count(*) into n from public.ct_bookings where slot_id=s.id and (status='confirmed' or (status='held' and hold_until>now()));
 if (p_data->>'capacity')::int<n then raise exception 'Capacity below existing reservations'; end if;
 update public.ct_slots set capacity=(p_data->>'capacity')::int where id=s.id;
 elsif p_action='rule' then
 insert into public.ct_rules(kind,weekday,local_start,timezone,duration_minutes,buffer_minutes,capacity) values(p_data->>'kind',(p_data->>'weekday')::int,(p_data->>'local_start')::time,p_data->>'timezone',(p_data->>'duration_minutes')::int,(p_data->>'buffer_minutes')::int,(p_data->>'capacity')::int);
 elsif p_action='rule_toggle' then
 update public.ct_rules set active=(p_data->>'active')::boolean where id=(p_data->>'id')::uuid;
 if not (p_data->>'active')::boolean then
 update public.ct_slots generated set cancelled=true where rule_id=(p_data->>'id')::uuid and starts_at>now() and not exists(select 1 from public.ct_bookings b where b.slot_id=generated.id and (b.status='confirmed' or (b.status='held' and b.hold_until>now())));
 end if;
 else raise exception 'Unknown schedule action'; end if;
end $$;

-- Event record, order fulfillment, credits and notifications commit atomically.
create function public.ct_fulfill(p_event text,p_order uuid,p_session text,p_intent text,p_amount int,p_currency text) returns void language plpgsql set search_path='' as $$
declare o public.ct_orders; b public.ct_bookings; s public.ct_slots; k text; units int; n int; begin
 perform pg_advisory_xact_lock(871204);
 if exists(select 1 from public.ct_events where event_id=p_event) then return; end if;
 select * into o from public.ct_orders where id=p_order for update;
 if not found or o.session_id is distinct from p_session then raise exception 'Checkout order mismatch'; end if;
 insert into public.ct_events(event_id,event_type) values(p_event,'checkout.paid');
 if o.status<>'pending' then return; end if;
 update public.ct_orders set status='paid',payment_intent_id=p_intent,amount=p_amount,currency=p_currency where id=o.id;
 if o.product_key in ('group','private','group_pack','private_pack') then
 k:=case when o.product_key like 'private%' then 'private' else 'group' end;
 units:=case when o.product_key like '%pack' then 3 else 1 end;
 if o.booking_id is null then
 insert into public.ct_credits(family_id,kind,delta,source) values(o.family_id,k,units,'order:'||o.id) on conflict(source) do nothing;
 else
 select * into b from public.ct_bookings where id=o.booking_id for update;
 select * into s from public.ct_slots where id=b.slot_id for update;
 select count(*) into n from public.ct_bookings where slot_id=s.id and id<>b.id and (status='confirmed' or (status='held' and hold_until>now()));
 if b.status in ('held','expired') and s.starts_at>now() and not s.cancelled and n<s.capacity and not exists(select 1 from public.ct_bookings x where x.id<>b.id and x.athlete_id=b.athlete_id and x.slot_id=b.slot_id and (x.status='confirmed' or (x.status='held' and x.hold_until>now()))) and not exists(select 1 from public.ct_blocks x where tstzrange(x.starts_at,x.ends_at,'[)') && tstzrange(s.starts_at-s.buffer_minutes*interval '1 minute',s.ends_at+s.buffer_minutes*interval '1 minute','[)')) then
 update public.ct_bookings set status='confirmed',paid=true,hold_until=null where id=b.id;
 perform public.ct_enqueue('confirmed:'||b.id,'booking_confirmed',o.family_id,jsonb_build_object('booking_id',b.id));
 perform public.ct_enqueue('reminder:'||b.id||':1','reminder',o.family_id,jsonb_build_object('booking_id',b.id,'version',1),greatest(now(),s.starts_at-interval '24 hours'));
 else
 update public.ct_orders set status='refund_pending' where id=o.id;
 update public.ct_bookings set status='expired' where id=b.id and status='held';
 perform public.ct_enqueue('refund:'||o.id,'refund',o.family_id,jsonb_build_object('order_id',o.id));
 end if;
 end if; end if;
 perform public.ct_enqueue('payment:'||o.id,'payment_received',o.family_id,jsonb_build_object('order_id',o.id));
end $$;
create function public.ct_sync_membership(p_event text,p_family uuid,p_subscription text,p_status text,p_until timestamptz,p_cancel boolean,p_created bigint) returns void language plpgsql set search_path='' as $$
begin
 perform pg_advisory_xact_lock(871204);
 if exists(select 1 from public.ct_events where event_id=p_event) then return; end if;
 insert into public.ct_events(event_id,event_type) values(p_event,'subscription.sync');
 if exists(select 1 from public.ct_memberships where subscription_id=p_subscription and (observed_event_created>p_created or (status='canceled' and p_status<>'canceled'))) then return; end if;
 insert into public.ct_memberships(subscription_id,family_id,status,access_until,cancel_at_period_end,observed_event_created) values(p_subscription,p_family,p_status,p_until,p_cancel,p_created) on conflict(subscription_id) do update set status=excluded.status,access_until=excluded.access_until,cancel_at_period_end=excluded.cancel_at_period_end,updated_at=now(),observed_event_created=excluded.observed_event_created where public.ct_memberships.observed_event_created<=excluded.observed_event_created and (public.ct_memberships.status<>'canceled' or excluded.status='canceled');
 perform public.ct_enqueue('membership:'||p_subscription||':'||p_status||':'||extract(epoch from p_until)::bigint||':'||p_cancel,'membership_updated',p_family,jsonb_build_object('status',p_status));
end $$;
create function public.ct_claim_jobs(p_limit int default 20) returns setof public.ct_outbox language sql set search_path='' as $$
 update public.ct_outbox set locked_until=now()+interval '5 minutes',attempts=attempts+1 where id in (select id from public.ct_outbox where completed_at is null and attempts<12 and run_at<=now() and (locked_until is null or locked_until<now()) order by run_at for update skip locked limit least(p_limit,50)) returning *;
$$;

create table public.ct_rate_limits (family_id uuid primary key references public.ct_families, window_at timestamptz not null, count int not null);
alter table public.ct_rate_limits enable row level security;
revoke all on public.ct_rate_limits from anon,authenticated;
grant all on public.ct_rate_limits to service_role;
create function public.ct_rate_limit(p_family uuid) returns void language plpgsql set search_path='' as $$
declare n int; begin
 insert into public.ct_rate_limits values(p_family,now(),1) on conflict(family_id) do update set count=case when public.ct_rate_limits.window_at<now()-interval '1 minute' then 1 else public.ct_rate_limits.count+1 end,window_at=case when public.ct_rate_limits.window_at<now()-interval '1 minute' then now() else public.ct_rate_limits.window_at end returning count into n;
 if n>30 then raise exception 'Too many requests. Wait one minute.'; end if;
end $$;
create function public.ct_create_order(p_id uuid,p_family uuid,p_product text,p_price text,p_booking uuid) returns void language plpgsql set search_path='' as $$
declare o public.ct_orders; begin
 perform pg_advisory_xact_lock(871204);
 select * into o from public.ct_orders where id=p_id;
 if found then
 if o.family_id<>p_family or o.product_key<>p_product or o.price_id<>p_price or o.booking_id is distinct from p_booking then raise exception 'Request already used'; end if; return; end if;
 if p_booking is not null and (not exists(select 1 from public.ct_bookings b join public.ct_slots s on s.id=b.slot_id where b.id=p_booking and b.family_id=p_family and b.status='held' and b.hold_until>now()+interval '30 minutes' and s.kind=p_product) or exists(select 1 from public.ct_orders where booking_id=p_booking)) then raise exception 'Reservation unavailable or checkout already exists'; end if;
 if p_product like 'lab_%' and (exists(select 1 from public.ct_orders where family_id=p_family and product_key like 'lab_%' and status='pending' and created_at>now()-interval '1 hour') or exists(select 1 from public.ct_memberships where family_id=p_family and status not in ('canceled','incomplete_expired'))) then raise exception 'Use billing to manage the existing or pending membership'; end if;
 insert into public.ct_orders(id,family_id,product_key,price_id,booking_id) values(p_id,p_family,p_product,p_price,p_booking);
end $$;
create function public.ct_apply_refund(p_event text,p_intent text) returns void language plpgsql set search_path='' as $$
declare o public.ct_orders; k text; units int; begin
 perform pg_advisory_xact_lock(871204);
 if exists(select 1 from public.ct_events where event_id=p_event) then return; end if;
 select * into o from public.ct_orders where payment_intent_id=p_intent for update;
 if not found then raise exception 'Refund payment not yet processed'; end if;
 insert into public.ct_events(event_id,event_type) values(p_event,'payment.refunded');
 if o.status='refunded' then return; end if;
 if o.status='paid' and o.product_key in ('group','private','group_pack','private_pack') then
 k:=case when o.product_key like 'private%' then 'private' else 'group' end;
 units:=case when o.product_key like '%pack' then 3 else 1 end;
 if o.booking_id is null then
 insert into public.ct_credits(family_id,kind,delta,source) values(o.family_id,k,-units,'refund:'||o.id) on conflict(source) do nothing;
 else
 if exists(select 1 from public.ct_bookings where id=o.booking_id and status='cancelled') then insert into public.ct_credits(family_id,kind,delta,source) values(o.family_id,k,-1,'refund:'||o.id) on conflict(source) do nothing; end if;
 update public.ct_bookings set status='cancelled',version=version+1 where id=o.booking_id and status='confirmed';
 perform public.ct_enqueue('refunded-booking:'||o.id,'booking_cancelled',o.family_id,jsonb_build_object('booking_id',o.booking_id));
 end if;
 end if;
 update public.ct_orders set status='refunded' where id=o.id;
 perform public.ct_enqueue('refunded:'||o.id,'payment_refunded',o.family_id,jsonb_build_object('order_id',o.id));
end $$;

-- Functions are callable only by the backend service role; no client can impersonate a family.
do $$ declare r record; begin for r in select p.oid::regprocedure signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname=any(array['ct_is_coach','ct_has_membership','ct_enqueue','ct_slot_range','ct_assert_slot','ct_book','ct_manage_booking','ct_publish','ct_admin_schedule','ct_fulfill','ct_sync_membership','ct_claim_jobs','ct_rate_limit','ct_create_order','ct_apply_refund']) loop execute format('revoke all on function %s from public, anon, authenticated',r.signature); execute format('grant execute on function %s to service_role',r.signature); end loop; end $$;
grant execute on function public.ct_is_coach(),public.ct_has_membership(uuid) to authenticated;
commit;
