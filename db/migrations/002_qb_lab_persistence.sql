-- Synthetic staging candidate only. Requires 001 and managed auth; no signup trigger or privilege escalation.
begin;
-- Training consent must never silently authorize media collection/access.
alter table public.qb_consents add column purpose text not null default 'training' check(purpose in ('training','media'));
create or replace function qb_private.allowed(target uuid, coaching_only boolean default false) returns boolean
language sql stable security definer set search_path='' as $$
 select exists (
 select 1 from public.qb_athletes a join public.qb_accounts u on u.id=auth.uid() and u.adult_verified
 where a.id=target
 and (not a.minor or exists(select 1 from public.qb_consents c join public.qb_accounts g on g.id=c.guardian_id and g.adult_verified and g.role='guardian' where c.athlete_id=a.id and c.purpose='training' and length(c.verified_evidence_ref)>0 and length(c.policy_version)>0 and c.revoked_at is null and c.expires_at>now()))
 and ((u.role='coach' and exists(select 1 from public.qb_coach_assignments ca where ca.athlete_id=a.id and ca.coach_id=u.id))
 or (not coaching_only and ((not a.minor and u.role='adult' and a.adult_owner=u.id) or (a.minor and u.role='guardian' and exists(select 1 from public.qb_guardians g where g.athlete_id=a.id and g.account_id=u.id)))))
 );
$$;
alter table public.qb_tasks add column title text not null default 'Assigned activity' check(length(title) between 1 and 160);
alter table public.qb_tasks add column created_at timestamptz not null default now();
create function qb_private.can_record(target uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select qb_private.allowed(target) and exists(select 1 from public.qb_accounts where id=auth.uid() and role in ('adult','guardian'));
$$;
revoke all on function qb_private.can_record(uuid) from public;
grant execute on function qb_private.can_record(uuid) to authenticated;
create table public.qb_learning_events (
 id uuid primary key,
 athlete_id uuid not null references public.qb_athletes(id) on delete cascade,
 recorded_by uuid not null references public.qb_accounts(id),
 kind text not null check(kind in ('lesson','simulation','workout')),
 content_key text not null check(length(content_key) between 1 and 120),
 duration_seconds integer not null check(duration_seconds between 0 and 3600),
 source text not null default 'self_reported' check(source='self_reported'),
 created_at timestamptz not null default now()
);
create index qb_learning_athlete_time on public.qb_learning_events(athlete_id,created_at desc);
alter table public.qb_learning_events enable row level security;
revoke all on public.qb_learning_events from anon,authenticated;
grant select on public.qb_learning_events to authenticated;
grant insert(id,athlete_id,recorded_by,kind,content_key,duration_seconds) on public.qb_learning_events to authenticated;
create policy events_read on public.qb_learning_events for select to authenticated using(qb_private.allowed(athlete_id));
create policy events_create on public.qb_learning_events for insert to authenticated with check(recorded_by=auth.uid() and qb_private.can_record(athlete_id));
grant insert(athlete_id,assigned_by,content_version,title) on public.qb_tasks to authenticated;
create policy tasks_create on public.qb_tasks for insert to authenticated with check(assigned_by=auth.uid() and qb_private.allowed(athlete_id,true));
create function public.qb_complete_task(target uuid, athlete uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
 if not qb_private.can_record(athlete) then raise exception 'Not authorized' using errcode='42501'; end if;
 update public.qb_tasks set completed_at=coalesce(completed_at,now()) where id=target and athlete_id=athlete;
 if not found then raise exception 'Not authorized' using errcode='42501'; end if;
end;
$$;
revoke all on function public.qb_complete_task(uuid,uuid) from public;
grant execute on function public.qb_complete_task(uuid,uuid) to authenticated;
-- Each film has exactly one coach recipient. Existing unpaired records fail closed.
alter table public.qb_film add column coach_id uuid references public.qb_accounts(id);
create function qb_private.film_allowed(target uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.qb_film f join public.qb_athletes a on a.id=f.athlete_id
 join public.qb_accounts u on u.id=auth.uid() and u.adult_verified
 where f.id=target and f.retained_until>now() and f.state in ('validated','released')
 and qb_private.allowed(a.id)
 and (not a.minor or exists(select 1 from public.qb_consents c join public.qb_accounts g on g.id=c.guardian_id and g.role='guardian' and g.adult_verified
 where c.athlete_id=a.id and c.purpose='media' and length(c.verified_evidence_ref)>0 and length(c.policy_version)>0 and c.revoked_at is null and c.expires_at>now()))
 and ((u.role='coach' and u.id=f.coach_id) or (u.role='adult' and not a.minor and a.adult_owner=u.id and f.state='released')));
$$;
revoke all on function qb_private.film_allowed(uuid) from public;
grant execute on function qb_private.film_allowed(uuid) to authenticated;
drop policy film_authorized on public.qb_film;
create policy film_pair on public.qb_film for select to authenticated using(qb_private.film_allowed(id));
drop policy feedback_authorized on public.qb_feedback;
create policy feedback_pair on public.qb_feedback for select to authenticated using(qb_private.film_allowed(film_id) and (released_at is not null or author_id=auth.uid()));
-- No film/feedback mutation or object-store permissions are granted. Media is still disabled.
commit;
