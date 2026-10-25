-- Candidate Supabase/PostgreSQL migration. Applied only in isolated local tests; NOT applied to hosted services or certified for production.
-- No permissive client mutations: writes require a separately reviewed privileged server workflow.
begin;
create schema if not exists qb_private;
revoke all on schema qb_private from public;
create table public.qb_accounts (
 id uuid primary key references auth.users(id) on delete cascade,
 role text not null check(role in ('adult','guardian','coach','administrator')),
 adult_verified boolean not null default false
);
create table public.qb_athletes (
 id uuid primary key default gen_random_uuid(),
 minor boolean not null,
 adult_owner uuid references public.qb_accounts(id),
 pathway text not null check(pathway in ('tackle','flag5','flag7')),
 age_band text not null check(age_band in ('8-10','11-13','14-15','16-18','college')),
 check ((minor and adult_owner is null) or (not minor and adult_owner is not null))
);
create table public.qb_guardians (
 athlete_id uuid references public.qb_athletes(id) on delete cascade,
 account_id uuid references public.qb_accounts(id) on delete cascade,
 verified_at timestamptz not null,
 primary key(athlete_id,account_id)
);
create table public.qb_consents (
 id uuid primary key default gen_random_uuid(),
 athlete_id uuid not null,
 guardian_id uuid not null,
 policy_version text not null,
 verified_evidence_ref text not null,
 expires_at timestamptz not null,
 revoked_at timestamptz,
 foreign key(athlete_id,guardian_id) references public.qb_guardians(athlete_id,account_id) on delete cascade
);
create table public.qb_coach_assignments (
 athlete_id uuid references public.qb_athletes(id) on delete cascade,
 coach_id uuid references public.qb_accounts(id) on delete cascade,
 primary key(athlete_id,coach_id)
);
create function qb_private.allowed(target uuid, coaching_only boolean default false) returns boolean
language sql stable security definer set search_path='' as $$
 select exists (
 select 1 from public.qb_athletes a join public.qb_accounts u on u.id=auth.uid() and u.adult_verified
 where a.id=target
 and (not a.minor or exists(select 1 from public.qb_consents c join public.qb_accounts g on g.id=c.guardian_id and g.adult_verified and g.role='guardian' where c.athlete_id=a.id and c.revoked_at is null and c.expires_at>now()))
 and ((u.role='coach' and exists(select 1 from public.qb_coach_assignments ca where ca.athlete_id=a.id and ca.coach_id=u.id))
 or (not coaching_only and ((not a.minor and u.role='adult' and a.adult_owner=u.id) or (a.minor and u.role='guardian' and exists(select 1 from public.qb_guardians g where g.athlete_id=a.id and g.account_id=u.id)))))
 );
$$;
revoke all on function qb_private.allowed(uuid,boolean) from public;
grant usage on schema qb_private to authenticated;
grant execute on function qb_private.allowed(uuid,boolean) to authenticated;
create table public.qb_film (
 id uuid primary key default gen_random_uuid(),
 athlete_id uuid not null references public.qb_athletes(id) on delete cascade,
 object_key text not null unique,
 state text not null default 'quarantine' check(state in ('quarantine','validated','released','deleted')),
 retained_until timestamptz not null,
 unique(id,athlete_id)
);
create table public.qb_feedback (
 id uuid primary key default gen_random_uuid(),
 film_id uuid not null,
 athlete_id uuid not null references public.qb_athletes(id),
 author_id uuid not null references public.qb_accounts(id),
 timestamp_ms integer not null check(timestamp_ms>=0),
 note text not null check(length(note)<=4000),
 released_at timestamptz,
 foreign key(film_id,athlete_id) references public.qb_film(id,athlete_id) on delete cascade
);
create table public.qb_tasks (
 id uuid primary key default gen_random_uuid(),
 athlete_id uuid not null references public.qb_athletes(id) on delete cascade,
 assigned_by uuid not null references public.qb_accounts(id),
 content_version text not null,
 completed_at timestamptz
);
create table public.qb_entitlements (
 id uuid primary key default gen_random_uuid(),
 account_id uuid not null references public.qb_accounts(id),
 provider_event_id text not null unique,
 product_key text not null,
 expires_at timestamptz not null
);
create table public.qb_audit (
 id uuid primary key default gen_random_uuid(),
 actor_id uuid references public.qb_accounts(id),
 action text not null,
 resource_id uuid,
 created_at timestamptz not null default now()
);
alter table public.qb_accounts enable row level security;
alter table public.qb_athletes enable row level security;
alter table public.qb_guardians enable row level security;
alter table public.qb_consents enable row level security;
alter table public.qb_coach_assignments enable row level security;
alter table public.qb_film enable row level security;
alter table public.qb_feedback enable row level security;
alter table public.qb_tasks enable row level security;
alter table public.qb_entitlements enable row level security;
alter table public.qb_audit enable row level security;
revoke all on public.qb_accounts,public.qb_athletes,public.qb_guardians,public.qb_consents,public.qb_coach_assignments,public.qb_film,public.qb_feedback,public.qb_tasks,public.qb_entitlements,public.qb_audit from anon,authenticated;
grant select on public.qb_accounts,public.qb_athletes,public.qb_guardians,public.qb_consents,public.qb_coach_assignments,public.qb_film,public.qb_feedback,public.qb_tasks,public.qb_entitlements to authenticated;
create policy account_self on public.qb_accounts for select to authenticated using(id=auth.uid());
create policy athlete_authorized on public.qb_athletes for select to authenticated using(qb_private.allowed(id));
create policy guardian_authorized on public.qb_guardians for select to authenticated using(account_id=auth.uid() and qb_private.allowed(athlete_id));
create policy consent_authorized on public.qb_consents for select to authenticated using(guardian_id=auth.uid() and qb_private.allowed(athlete_id));
create policy coach_self on public.qb_coach_assignments for select to authenticated using(coach_id=auth.uid() and qb_private.allowed(athlete_id,true));
create policy film_authorized on public.qb_film for select to authenticated using(retained_until>now() and state in ('validated','released') and qb_private.allowed(athlete_id) and (state='released' or qb_private.allowed(athlete_id,true)));
create policy feedback_authorized on public.qb_feedback for select to authenticated using(qb_private.allowed(athlete_id) and (released_at is not null or qb_private.allowed(athlete_id,true)));
create policy task_authorized on public.qb_tasks for select to authenticated using(qb_private.allowed(athlete_id));
create policy entitlement_self on public.qb_entitlements for select to authenticated using(account_id=auth.uid());
commit;
