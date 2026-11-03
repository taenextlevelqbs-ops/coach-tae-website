-- REVIEW against the existing project before applying. All athlete data is server-only.
create extension if not exists btree_gist;
create table public.ct_session_types (
 id uuid primary key default gen_random_uuid(), name text not null,
 kind text not null check(kind in ('private','group')), amount integer not null check(amount > 0),
 duration_minutes integer not null default 60 check(duration_minutes between 15 and 240),
 stripe_price_id text unique not null, active boolean not null default false
);
create table public.ct_offers (
 id uuid primary key default gen_random_uuid(), session_type_id uuid not null references public.ct_session_types,
 name text not null, amount integer not null check(amount>0), stripe_price_id text unique not null,
 credits integer not null check(credits=3), active boolean not null default false
);
create table public.ct_availability_rules (
 id uuid primary key default gen_random_uuid(), weekday integer not null check(weekday between 0 and 6),
 local_start time not null, local_end time not null, timezone text not null default 'America/New_York',
 session_type_id uuid not null references public.ct_session_types, capacity integer not null check(capacity between 1 and 30)
);
create table public.ct_sessions (
 id uuid primary key default gen_random_uuid(), session_type_id uuid not null references public.ct_session_types,
 starts_at timestamptz not null, ends_at timestamptz not null, capacity integer not null check(capacity between 1 and 30),
 closed boolean not null default false, check(ends_at > starts_at),
 exclude using gist (tstzrange(starts_at,ends_at,'[)') with &&)
);
create table public.ct_availability_exceptions (
 id uuid primary key default gen_random_uuid(), starts_at timestamptz not null, ends_at timestamptz not null,
 reason text not null, check(ends_at > starts_at)
);
create table public.ct_native_bookings (
 id uuid primary key default gen_random_uuid(), session_id uuid not null references public.ct_sessions,
 parent_name text not null, athlete_name text not null, email text not null, phone text not null,
 offer_id uuid references public.ct_offers, credit_id uuid,
 status text not null default 'held' check(status in ('held','confirmed','expired','cancelled','payment_review')),
 expires_at timestamptz not null default now()+interval '31 minutes',
 stripe_session_id text unique, stripe_payment_id text unique, amount integer not null,
 created_at timestamptz not null default now()
);
create table public.ct_package_credits (
 id uuid primary key default gen_random_uuid(), parent_email text not null, source_booking_id uuid unique not null references public.ct_native_bookings, stripe_payment_id text unique not null,
 session_type_id uuid not null references public.ct_session_types, remaining integer not null check(remaining >= 0)
);
create table public.ct_payment_events (id text primary key, processed_at timestamptz not null default now());
create table public.ct_notifications (
 id uuid primary key default gen_random_uuid(), booking_id uuid not null references public.ct_native_bookings,
 kind text not null, delivered_at timestamptz, attempts integer not null default 0,
 unique(booking_id,kind)
);
-- No public SELECT or write policies. Supabase service role is used only in server routes.
do $$ declare t text; begin
 foreach t in array array['ct_session_types','ct_offers','ct_availability_rules','ct_sessions','ct_availability_exceptions','ct_native_bookings','ct_package_credits','ct_payment_events','ct_notifications'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon, authenticated',t);
 execute format('grant select,insert,update,delete on public.%I to service_role',t);
 end loop;
end $$;
create function public.ct_hold(p_session uuid,p_parent text,p_athlete text,p_email text,p_phone text,p_offer uuid default null)
returns public.ct_native_bookings language plpgsql security definer set search_path=public as $$
declare s ct_sessions; t ct_session_types; b ct_native_bookings; o ct_offers; n integer;
begin
 -- Serialize a parent's checkout attempts to bound hold spam without exposing their information.
 perform pg_advisory_xact_lock(hashtextextended(lower(p_email),0));
 if (select count(*) from ct_native_bookings where email=lower(p_email) and created_at>now()-interval '1 hour')>=5 then raise exception 'Too many booking attempts'; end if;
 select * into s from ct_sessions where id=p_session for update;
 if not found or s.closed or s.starts_at < now()+interval '1 hour' then raise exception 'Unavailable'; end if;
 if exists(select 1 from ct_availability_exceptions e where tstzrange(e.starts_at,e.ends_at,'[)') && tstzrange(s.starts_at,s.ends_at,'[)')) then raise exception 'Blocked'; end if;
 select * into t from ct_session_types where id=s.session_type_id and active;
 if not found then raise exception 'Inactive'; end if;
 update ct_native_bookings set status='expired' where session_id=s.id and status='held' and expires_at<=now();
 select count(*) into n from ct_native_bookings where session_id=s.id and (status='confirmed' or (status='held' and expires_at>now()));
 if n>=s.capacity then raise exception 'Full'; end if;
 if p_offer is not null then
 select * into o from ct_offers where id=p_offer and session_type_id=t.id and active;
 if not found then raise exception 'Unavailable package'; end if;
 end if;
 insert into ct_native_bookings(session_id,parent_name,athlete_name,email,phone,amount,offer_id) values(s.id,p_parent,p_athlete,lower(p_email),p_phone,coalesce(o.amount,t.amount),p_offer) returning * into b;
 return b;
end $$;
create function public.ct_confirm(p_event text,p_booking uuid,p_checkout text,p_payment text,p_amount integer)
returns void language plpgsql security definer set search_path=public as $$
declare b ct_native_bookings; s ct_sessions;
begin
 if exists(select 1 from ct_payment_events where id=p_event) then return; end if;
 select * into b from ct_native_bookings where id=p_booking;
 if not found then raise exception 'Unknown booking'; end if;
 select * into s from ct_sessions where id=b.session_id for update;
 select * into b from ct_native_bookings where id=p_booking for update;
 if b.stripe_session_id is distinct from p_checkout or b.amount<>p_amount then raise exception 'Payment mismatch'; end if;
 if b.stripe_payment_id is not null then
 if b.stripe_payment_id<>p_payment then raise exception 'Payment reference mismatch'; end if;
 insert into ct_payment_events(id) values(p_event) on conflict do nothing;
 return;
 end if;
 if b.status<>'confirmed' then
 if b.status<>'held' or b.expires_at<=now() then
 update ct_native_bookings set status='payment_review',stripe_payment_id=p_payment where id=b.id;
 insert into ct_notifications(booking_id,kind) values(b.id,'payment_review') on conflict do nothing;
 else
 update ct_native_bookings set status='confirmed',stripe_payment_id=p_payment where id=b.id;
 insert into ct_notifications(booking_id,kind) values(b.id,'confirmation') on conflict do nothing;
 if b.offer_id is not null then
 insert into ct_package_credits(parent_email,source_booking_id,stripe_payment_id,session_type_id,remaining)
 select lower(b.email),b.id,p_payment,s.session_type_id,o.credits-1 from ct_offers o where o.id=b.offer_id on conflict do nothing;
 end if;
 end if;
 end if;
 insert into ct_payment_events(id) values(p_event) on conflict do nothing;
end $$;
revoke all on function public.ct_hold(uuid,text,text,text,text,uuid) from public,anon,authenticated;
revoke all on function public.ct_confirm(text,uuid,text,text,integer) from public,anon,authenticated;
grant execute on function public.ct_hold(uuid,text,text,text,text,uuid) to service_role;
grant execute on function public.ct_confirm(text,uuid,text,text,integer) to service_role;
-- Atomic schedule changes serialize against checkout and webhook transactions.
create function public.ct_manage(p_action text,p_id uuid,p_target uuid default null)
returns void language plpgsql security definer set search_path=public as $$
declare b ct_native_bookings; target ct_sessions; old_session uuid; n integer;
begin
 if p_action in ('cancel','reschedule') then
 select session_id into old_session from ct_native_bookings where id=p_id;
 -- Lock sessions in deterministic order to prevent opposite-direction move deadlocks.
 perform id from ct_sessions where id in (old_session,p_target) order by id for update;
 select * into b from ct_native_bookings where id=p_id for update;
 if not found or b.status<>'confirmed' then raise exception 'Only confirmed appointments may be changed'; end if;
 if p_action='cancel' then
 update ct_native_bookings set status='cancelled' where id=p_id;
 insert into ct_notifications(booking_id,kind) values(p_id,'cancelled-'||gen_random_uuid());
 else
 select * into target from ct_sessions where id=p_target;
 if not found or target.closed or target.starts_at<=now() then raise exception 'Unavailable'; end if;
 if exists(select 1 from ct_availability_exceptions e where tstzrange(e.starts_at,e.ends_at,'[)') && tstzrange(target.starts_at,target.ends_at,'[)')) then raise exception 'Blocked'; end if;
 if (select session_type_id from ct_sessions where id=old_session)<>target.session_type_id then raise exception 'Different session type'; end if;
 select count(*) into n from ct_native_bookings where session_id=p_target and (status='confirmed' or(status='held' and expires_at>now()));
 if n>=target.capacity then raise exception 'Full'; end if;
 update ct_native_bookings set session_id=p_target where id=p_id;
 insert into ct_notifications(booking_id,kind) values(p_id,'rescheduled-'||gen_random_uuid());
 end if;
 elsif p_action in ('delete','close') then
 perform id from ct_sessions where id=p_id for update;
 if p_action='delete' then
 if exists(select 1 from ct_native_bookings where session_id=p_id) then raise exception 'Session has booking history; close it instead'; end if;
 delete from ct_sessions where id=p_id;
 else update ct_sessions set closed=true where id=p_id;
 end if;
 else raise exception 'Unknown action'; end if;
end $$;
revoke all on function public.ct_manage(text,uuid,uuid) from public,anon,authenticated;
grant execute on function public.ct_manage(text,uuid,uuid) to service_role;
create function public.ct_recurring(p_weekday integer,p_start time,p_end time,p_type uuid,p_capacity integer,p_dates jsonb)
returns void language plpgsql security definer set search_path=public as $$
declare v jsonb;
begin
 if jsonb_array_length(p_dates)>14 or jsonb_array_length(p_dates)<1 or p_end<=p_start then raise exception 'Invalid recurrence'; end if;
 insert into ct_availability_rules(weekday,local_start,local_end,session_type_id,capacity) values(p_weekday,p_start,p_end,p_type,p_capacity);
 for v in select * from jsonb_array_elements(p_dates) loop
 insert into ct_sessions(session_type_id,starts_at,ends_at,capacity) values(p_type,(v->>'start')::timestamptz,(v->>'end')::timestamptz,p_capacity);
 end loop;
end $$;
revoke all on function public.ct_recurring(integer,time,time,uuid,integer,jsonb) from public,anon,authenticated;
grant execute on function public.ct_recurring(integer,time,time,uuid,integer,jsonb) to service_role;

create function public.ct_redeem(p_credit uuid,p_session uuid,p_parent text,p_athlete text,p_email text,p_phone text)
returns uuid language plpgsql security definer set search_path=public as $$
declare c ct_package_credits; b ct_native_bookings;
begin
 select * into c from ct_package_credits where id=p_credit for update;
 if not found or c.parent_email<>lower(p_email) or c.remaining<1 then raise exception 'No available credits'; end if;
 if not exists(select 1 from ct_sessions where id=p_session and session_type_id=c.session_type_id) then raise exception 'Wrong session type'; end if;
 select * into b from ct_hold(p_session,p_parent,p_athlete,p_email,p_phone);
 update ct_native_bookings set status='confirmed',credit_id=c.id,amount=0 where id=b.id;
 update ct_package_credits set remaining=remaining-1 where id=c.id;
 insert into ct_notifications(booking_id,kind) values(b.id,'confirmation');
 return b.id;
end $$;
revoke all on function public.ct_redeem(uuid,uuid,text,text,text,text) from public,anon,authenticated;
grant execute on function public.ct_redeem(uuid,uuid,text,text,text,text) to service_role;
alter table public.ct_notifications add column payload jsonb;
alter table public.ct_notifications add column created_at timestamptz not null default now();
create function public.ct_notification_snapshot() returns trigger language plpgsql set search_path=public as $$
begin
 select to_jsonb(b)||jsonb_build_object('ct_sessions',to_jsonb(s)) into new.payload
 from ct_native_bookings b join ct_sessions s on s.id=b.session_id where b.id=new.booking_id;
 return new;
end $$;
create trigger ct_notification_snapshot before insert on public.ct_notifications for each row execute function public.ct_notification_snapshot();
revoke all on function public.ct_notification_snapshot() from public,anon,authenticated;
create function public.ct_edit(p_id uuid,p_start timestamptz,p_end timestamptz,p_capacity integer,p_type uuid)
returns void language plpgsql security definer set search_path=public as $$
declare s ct_sessions; n integer;
begin
 select * into s from ct_sessions where id=p_id for update;
 if not found then raise exception 'Unknown session'; end if;
 if exists(select 1 from ct_native_bookings where session_id=p_id) and (s.starts_at<>p_start or s.ends_at<>p_end or s.session_type_id<>p_type) then raise exception 'Reschedule individual bookings instead'; end if;
 select count(*) into n from ct_native_bookings where session_id=p_id and(status='confirmed' or(status='held' and expires_at>now()));
 if p_capacity<n then raise exception 'Capacity below booked and held places'; end if;
 update ct_sessions set starts_at=p_start,ends_at=p_end,capacity=p_capacity,session_type_id=p_type where id=p_id;
end $$;
revoke all on function public.ct_edit(uuid,timestamptz,timestamptz,integer,uuid) from public,anon,authenticated;
grant execute on function public.ct_edit(uuid,timestamptz,timestamptz,integer,uuid) to service_role;
create index ct_bookings_capacity on public.ct_native_bookings(session_id,status,expires_at);
create index ct_bookings_parent_attempts on public.ct_native_bookings(email,created_at);
create index ct_notifications_pending on public.ct_notifications(created_at) where delivered_at is null;
create function public.ct_public_availability() returns jsonb language sql stable security definer set search_path=public as $$
 select jsonb_build_object(
 'types',coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',name,'kind',kind,'amount',amount,'duration_minutes',duration_minutes)) from ct_session_types where active),'[]'::jsonb),
 'offers',coalesce((select jsonb_agg(jsonb_build_object('id',o.id,'session_type_id',o.session_type_id,'name',o.name,'amount',o.amount,'credits',o.credits)) from ct_offers o join ct_session_types t on t.id=o.session_type_id where o.active and t.active),'[]'::jsonb),
 'slots',coalesce((select jsonb_agg(to_jsonb(v)) from (
 select s.id,s.session_type_id,s.starts_at,s.ends_at,s.capacity,
 s.capacity-(select count(*) from ct_native_bookings b where b.session_id=s.id and (b.status='confirmed' or(b.status='held' and b.expires_at>now()))) as remaining
 from ct_sessions s join ct_session_types t on t.id=s.session_type_id
 where not s.closed and t.active and s.starts_at>now()+interval '1 hour' and s.starts_at<now()+interval '90 days'
 and not exists(select 1 from ct_availability_exceptions e where tstzrange(e.starts_at,e.ends_at,'[)') && tstzrange(s.starts_at,s.ends_at,'[)'))
 order by s.starts_at
 ) v where v.remaining>0),'[]'::jsonb));
$$;
revoke all on function public.ct_public_availability() from public,anon,authenticated;
grant execute on function public.ct_public_availability() to service_role;
