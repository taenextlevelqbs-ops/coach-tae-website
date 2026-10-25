-- Integration-ready candidate; isolated synthetic testing only. No youth login or public signup.
begin;
alter table public.qb_athletes drop constraint qb_athletes_pathway_check;
alter table public.qb_athletes add constraint qb_athletes_pathway_check check(pathway in ('tackle','passing7','flag5','flag7','flag8'));
-- Do not guess age from ambiguous historic bands (11-13, 16-18). Provisioner must review.
alter table public.qb_athletes add column age_group text check(age_group in ('under13','13-17','18plus'));
alter table public.qb_athletes add constraint qb_athlete_age_owner check(age_group is null or (minor and age_group in ('under13','13-17')) or (not minor and age_group='18plus'));
alter table public.qb_athletes add column experience text not null default 'beginner' check(experience in ('beginner','developing','advanced'));
alter table public.qb_learning_events drop constraint qb_learning_events_kind_check;
alter table public.qb_learning_events add constraint qb_learning_events_kind_check check(kind in ('lesson','simulation','workout','recovery'));
-- Privileged accounts require a provider-verified second factor, including direct database access.
create function qb_private.coach_ready() returns boolean
language sql stable security definer set search_path='' as $$
 select coalesce(auth.jwt()->>'aal','')='aal2' and exists(select 1 from public.qb_accounts where id=auth.uid() and adult_verified and role='coach');
$$;
revoke all on function qb_private.coach_ready() from public;
grant execute on function qb_private.coach_ready() to authenticated;
-- Preserve the existing function OID so every existing policy receives the MFA check.
create or replace function qb_private.allowed(target uuid, coaching_only boolean default false) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.qb_athletes a join public.qb_accounts u on u.id=auth.uid() and u.adult_verified
 where a.id=target
 and (not a.minor or exists(select 1 from public.qb_consents c join public.qb_accounts g on g.id=c.guardian_id and g.adult_verified and g.role='guardian' where c.athlete_id=a.id and c.purpose='training' and length(c.verified_evidence_ref)>0 and length(c.policy_version)>0 and c.revoked_at is null and c.expires_at>now()))
 and ((u.role='coach' and qb_private.coach_ready() and exists(select 1 from public.qb_coach_assignments ca where ca.athlete_id=a.id and ca.coach_id=u.id))
 or (not coaching_only and ((not a.minor and u.role='adult' and a.adult_owner=u.id) or (a.minor and u.role='guardian' and exists(select 1 from public.qb_guardians g where g.athlete_id=a.id and g.account_id=u.id)))))
 );
$$;
create table public.qb_messages (
 id uuid primary key default gen_random_uuid(),
 athlete_id uuid not null references public.qb_athletes(id) on delete cascade,
 author_id uuid not null references public.qb_accounts(id),
 body text not null check(length(btrim(body)) between 1 and 2000),
 publish_at timestamptz not null,
 created_at timestamptz not null default now(),
 task_id uuid references public.qb_tasks(id)
);
create index qb_messages_inbox on public.qb_messages(athlete_id,publish_at desc);
create table public.qb_message_reads (
 message_id uuid references public.qb_messages(id) on delete cascade,
 account_id uuid references public.qb_accounts(id) on delete cascade,
 read_at timestamptz not null default now(),
 primary key(message_id,account_id)
);
create table public.qb_training_sessions (
 id uuid primary key default gen_random_uuid(),
 athlete_id uuid not null references public.qb_athletes(id) on delete cascade,
 coach_id uuid not null references public.qb_accounts(id),
 title text not null check(length(btrim(title)) between 1 and 160),
 location text not null check(length(btrim(location)) between 1 and 200),
 starts_at timestamptz not null,
 ends_at timestamptz not null,
 status text not null default 'scheduled' check(status in ('scheduled','cancelled')),
 revision integer not null default 1,
 check(ends_at>starts_at and ends_at<=starts_at+interval '8 hours')
);
alter table public.qb_messages enable row level security;
alter table public.qb_message_reads enable row level security;
alter table public.qb_training_sessions enable row level security;
revoke all on public.qb_messages,public.qb_message_reads,public.qb_training_sessions from anon,authenticated;
grant select on public.qb_messages,public.qb_training_sessions to authenticated;
-- Minors are guardian-managed: every linked, consent-authorized guardian sees coaching messages.
create policy message_read on public.qb_messages for select to authenticated using(qb_private.allowed(athlete_id) and (publish_at<=now() or (author_id=auth.uid() and qb_private.coach_ready())));
create policy session_read on public.qb_training_sessions for select to authenticated using(qb_private.allowed(athlete_id));
-- No direct receipt table access: never expose one family's account identifiers.
create function public.qb_message_status(target uuid) returns table(read_by_me boolean,read_count bigint)
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.qb_message_reads r where r.message_id=m.id and r.account_id=auth.uid()),
 case when m.author_id=auth.uid() and qb_private.coach_ready() then (select count(*) from public.qb_message_reads r where r.message_id=m.id) else null end
 from public.qb_messages m where m.id=target and qb_private.allowed(m.athlete_id) and (m.publish_at<=now() or (m.author_id=auth.uid() and qb_private.coach_ready()));
$$;
create function public.qb_send_message(targets uuid[], message text, delivery timestamptz, content_key text default null) returns integer
language plpgsql security definer set search_path='' as $$
declare target uuid; task uuid; message_id uuid;
begin
 if not qb_private.coach_ready() or cardinality(targets) not between 1 and 100 or cardinality(targets)<>(select count(distinct x) from unnest(targets) x) or message is null or length(btrim(message)) not between 1 and 2000 or delivery is null or delivery>now()+interval '90 days' then raise exception 'Not authorized or invalid request' using errcode='42501';end if;
 -- All-or-nothing fanout. Client supplied groups cannot broaden coach assignments.
 foreach target in array targets loop
 if not coalesce(qb_private.allowed(target,true),false) then raise exception 'Not authorized' using errcode='42501';end if;
 end loop;
 foreach target in array targets loop
 task:=null;
 if content_key is not null then
 if length(btrim(content_key)) not between 1 and 120 then raise exception 'Invalid content';end if;
 insert into public.qb_tasks(athlete_id,assigned_by,content_version,title) values(target,auth.uid(),content_key,'Coach assigned training') returning id into task;
 end if;
 insert into public.qb_messages(athlete_id,author_id,body,publish_at,task_id) values(target,auth.uid(),btrim(message),greatest(delivery,now()),task) returning id into message_id;
 insert into public.qb_audit(actor_id,action,resource_id) values(auth.uid(),'message.created',message_id);
 end loop;
 return cardinality(targets);
end;
$$;
create function public.qb_mark_message_read(target uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.qb_messages m where m.id=target and m.publish_at<=now() and qb_private.allowed(m.athlete_id) and qb_private.can_record(m.athlete_id)) then raise exception 'Not authorized' using errcode='42501';end if;
 insert into public.qb_message_reads(message_id,account_id) values(target,auth.uid()) on conflict do nothing;
end;
$$;
create function public.qb_schedule_session(target uuid, session_title text, place text, starts timestamptz, ends timestamptz, existing uuid default null, expected_revision integer default null, cancel boolean default false) returns uuid
language plpgsql security definer set search_path='' as $$
declare result uuid;
begin
 if not qb_private.allowed(target,true) then raise exception 'Not authorized' using errcode='42501';end if;
 if existing is null then
 if cancel or starts<now() then raise exception 'Invalid schedule';end if;
 insert into public.qb_training_sessions(athlete_id,coach_id,title,location,starts_at,ends_at) values(target,auth.uid(),session_title,place,starts,ends) returning id into result;
 else
 update public.qb_training_sessions set title=session_title,location=place,starts_at=starts,ends_at=ends,status=case when cancel then 'cancelled' else 'scheduled' end,revision=revision+1
 where id=existing and athlete_id=target and coach_id=auth.uid() and revision=expected_revision returning id into result;
 if result is null then raise exception 'Not authorized or stale schedule' using errcode='42501';end if;
 end if;
 -- Every update/cancellation generates an in-app notice, no external delivery claim.
 perform public.qb_send_message(array[target],case when cancel then 'Training cancelled: ' else 'Training schedule updated: ' end||session_title||' · '||starts::text,now());
 insert into public.qb_audit(actor_id,action,resource_id) values(auth.uid(),'schedule.changed',result);
 return result;
end;
$$;
revoke all on function public.qb_message_status(uuid),public.qb_send_message(uuid[],text,timestamptz,text),public.qb_mark_message_read(uuid),public.qb_schedule_session(uuid,text,text,timestamptz,timestamptz,uuid,integer,boolean) from public;
grant execute on function public.qb_message_status(uuid),public.qb_send_message(uuid[],text,timestamptz,text),public.qb_mark_message_read(uuid),public.qb_schedule_session(uuid,text,text,timestamptz,timestamptz,uuid,integer,boolean) to authenticated;
commit;
