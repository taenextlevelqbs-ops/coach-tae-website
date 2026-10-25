-- FINAL six-capability MVP. Candidate until reviewed/applied to dedicated synthetic staging.
begin;
alter table public.qb_accounts drop constraint qb_accounts_role_check;
alter table public.qb_accounts add constraint qb_accounts_role_check check(role in ('adult','guardian','athlete','coach','administrator'));
alter table public.qb_athletes drop constraint qb_athletes_age_band_check;
alter table public.qb_athletes add constraint qb_athletes_age_band_check check(age_band in ('8-10','11-13','14-15','16-18','college','under13','13-17','18plus'));
alter table public.qb_athletes add column display_name text not null default 'Athlete' check(length(btrim(display_name)) between 1 and 60);
alter table public.qb_athletes add column ruleset text check(length(ruleset) between 1 and 160);
create table public.qb_athlete_logins (
 account_id uuid primary key references public.qb_accounts(id) on delete cascade,
 athlete_id uuid not null unique references public.qb_athletes(id) on delete cascade
);
alter table public.qb_athlete_logins enable row level security;
revoke all on public.qb_athlete_logins from public,anon,authenticated;
create function qb_private.identity_verified() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from auth.users where id=auth.uid() and email_confirmed_at is not null);
$$;
revoke all on function qb_private.identity_verified() from public;
grant execute on function qb_private.identity_verified() to authenticated;
create or replace function qb_private.coach_ready() returns boolean
language sql stable security definer set search_path='' as $$
 select qb_private.identity_verified() and coalesce(auth.jwt()->>'aal','')='aal2' and exists(select 1 from public.qb_accounts where id=auth.uid() and adult_verified and role in ('coach','administrator'));
$$;
create or replace function qb_private.allowed(target uuid, coaching_only boolean default false) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.qb_athletes a join public.qb_accounts u on u.id=auth.uid()
 where a.id=target and qb_private.identity_verified() and (u.adult_verified or (u.role='athlete' and exists(select 1 from public.qb_athlete_logins l where l.athlete_id=a.id and l.account_id=u.id)))
 and (not a.minor or exists(select 1 from public.qb_consents c join public.qb_accounts g on g.id=c.guardian_id and g.adult_verified and g.role='guardian' where c.athlete_id=a.id and c.purpose='training' and length(c.verified_evidence_ref)>0 and length(c.policy_version)>0 and c.revoked_at is null and c.expires_at>now()))
 and ((u.role in ('coach','administrator') and qb_private.coach_ready() and exists(select 1 from public.qb_coach_assignments ca where ca.athlete_id=a.id and ca.coach_id=u.id))
 or (not coaching_only and ((not a.minor and u.role='adult' and a.adult_owner=u.id)
 or (u.role='athlete' and exists(select 1 from public.qb_athlete_logins l where l.athlete_id=a.id and l.account_id=u.id))
 or (a.minor and u.role='guardian' and exists(select 1 from public.qb_guardians g where g.athlete_id=a.id and g.account_id=u.id)))))
 );
$$;
create or replace function qb_private.can_record(target uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select qb_private.allowed(target) and exists(select 1 from public.qb_accounts where id=auth.uid() and role in ('adult','guardian','athlete'));
$$;
create function public.qb_identity_ready() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.qb_athlete_logins l join public.qb_accounts a on a.id=l.account_id and a.role='athlete' where l.account_id=auth.uid() and qb_private.allowed(l.athlete_id));
$$;
revoke all on function public.qb_identity_ready() from public;
grant execute on function public.qb_identity_ready() to authenticated;
-- Owner-issued verification tickets, never a guardian checkbox or client-created evidence.
create table public.qb_guardian_tickets (
 id uuid primary key default gen_random_uuid(), guardian_id uuid not null references public.qb_accounts(id),
 reviewed_by uuid not null references public.qb_accounts(id), evidence_ref text not null check(length(btrim(evidence_ref)) between 1 and 250),
 policy_version text not null check(length(btrim(policy_version)) between 1 and 100), expires_at timestamptz not null,
 consumed_at timestamptz, revoked_at timestamptz
);
alter table public.qb_guardian_tickets enable row level security;
revoke all on public.qb_guardian_tickets from public,anon,authenticated;
create function public.qb_registration_tickets() returns table(id uuid,expires_at timestamptz) language sql stable security definer set search_path='' as $$
 select t.id,t.expires_at from public.qb_guardian_tickets t join public.qb_accounts a on a.id=auth.uid() and a.id=t.guardian_id and a.role='guardian' and a.adult_verified
 where qb_private.identity_verified() and t.consumed_at is null and t.revoked_at is null and t.expires_at>now();
$$;
create function public.qb_register_managed_athlete(ticket uuid, nickname text, pathway text, age_group text) returns uuid
language plpgsql security definer set search_path='' as $$
declare t public.qb_guardian_tickets; result uuid;
begin
 select x.* into t from public.qb_guardian_tickets x join public.qb_accounts a on a.id=auth.uid() and a.id=x.guardian_id and a.role='guardian' and a.adult_verified
 where qb_private.identity_verified() and x.id=ticket and x.consumed_at is null and x.revoked_at is null and x.expires_at>now() for update of x;
 if t.id is null or nickname is null or length(btrim(nickname)) not between 1 and 60 or pathway is null or pathway not in ('tackle','passing7','flag5','flag7','flag8') or age_group is null or age_group not in ('under13','13-17') then raise exception 'Not authorized or invalid profile' using errcode='42501';end if;
 insert into public.qb_athletes(minor,display_name,pathway,age_band,age_group) values(true,btrim(nickname),pathway,age_group,age_group) returning id into result;
 -- Legacy age_band is not an exact age. MVP uses age_group and never asks for birth dates.
 insert into public.qb_guardians(athlete_id,account_id,verified_at) values(result,auth.uid(),now());
 insert into public.qb_consents(athlete_id,guardian_id,policy_version,verified_evidence_ref,expires_at,purpose) values(result,auth.uid(),t.policy_version,t.evidence_ref,t.expires_at,'training');
 update public.qb_guardian_tickets set consumed_at=now() where id=ticket;
 if not exists(select 1 from public.qb_accounts where id=t.reviewed_by and adult_verified and role in ('coach','administrator')) then raise exception 'Reviewed coach required';end if;
 insert into public.qb_coach_assignments(athlete_id,coach_id) values(result,t.reviewed_by);
 insert into public.qb_audit(actor_id,action,resource_id) values(auth.uid(),'guardian.profile_registered',result);
 return result;
end;
$$;
revoke all on function public.qb_registration_tickets(),public.qb_register_managed_athlete(uuid,text,text,text) from public;
grant execute on function public.qb_registration_tickets(),public.qb_register_managed_athlete(uuid,text,text,text) to authenticated;
create table public.qb_training_catalog (
 content_key text primary key, kind text not null check(kind in ('workout','recovery')), title text not null,
 content_version text not null, reviewed_by uuid references public.qb_accounts(id), reviewed_at timestamptz, review_note text
);
alter table public.qb_training_catalog enable row level security;
revoke all on public.qb_training_catalog from anon,authenticated;
grant select on public.qb_training_catalog to authenticated;
create policy catalog_member on public.qb_training_catalog for select to authenticated using(exists(select 1 from public.qb_accounts where id=auth.uid()));
create table public.qb_training_records (
 id uuid primary key, athlete_id uuid not null references public.qb_athletes(id) on delete cascade,
 content_key text not null references public.qb_training_catalog(content_key),
 kind text not null check(kind in ('workout','recovery')),
 started_at timestamptz not null default now(), completed_at timestamptz,
 source text not null default 'self_reported' check(source='self_reported'), completed_by uuid references public.qb_accounts(id), recorded_by uuid not null references public.qb_accounts(id)
);
create index qb_training_history on public.qb_training_records(athlete_id,started_at desc);
alter table public.qb_training_records enable row level security;
revoke all on public.qb_training_records from public,anon,authenticated;
grant select on public.qb_training_records to authenticated;
create policy training_read on public.qb_training_records for select to authenticated using(qb_private.allowed(athlete_id));
create function public.qb_record_training(target uuid, attempt uuid, content text, complete boolean default false) returns uuid
language plpgsql security definer set search_path='' as $$
declare item public.qb_training_catalog; record public.qb_training_records;
begin
 if not qb_private.can_record(target) or attempt is null or complete is null then raise exception 'Not authorized' using errcode='42501';end if;
 select * into item from public.qb_training_catalog where content_key=content;
 if item.content_key is null then raise exception 'Unknown activity' using errcode='22023';end if;
 insert into public.qb_training_records(id,athlete_id,content_key,kind,recorded_by) values(attempt,target,content,item.kind,auth.uid()) on conflict do nothing;
 select * into record from public.qb_training_records where id=attempt for update;
 if record.athlete_id<>target or record.content_key<>content then raise exception 'Not authorized' using errcode='42501';end if;
 if complete and record.completed_at is null then
 update public.qb_training_records set completed_at=now(),completed_by=auth.uid() where id=attempt;
 update public.qb_tasks set completed_at=coalesce(completed_at,now()) where athlete_id=target and content_version=content;
 insert into public.qb_audit(actor_id,action,resource_id) values(auth.uid(),'training.self_reported_complete',attempt);
 end if;
 return attempt;
end;
$$;
revoke all on function public.qb_record_training(uuid,uuid,text,boolean) from public;
grant execute on function public.qb_record_training(uuid,uuid,text,boolean) to authenticated;
-- Answer keys never have an athlete SELECT policy. Published quizzes are immutable snapshots.
create table public.qb_question_bank (
 id uuid primary key default gen_random_uuid(), draft_key text unique,
 pathway text not null check(pathway in ('flag','tackle')), ruleset text not null check(length(ruleset) between 1 and 160),
 difficulty text not null check(difficulty in ('foundation','developing','advanced')),
 age_groups text[] not null check(cardinality(age_groups) between 1 and 3 and age_groups<@array['under13','13-17','18plus']::text[]),
 prompt text not null check(length(btrim(prompt)) between 1 and 400),
 choices jsonb not null check(jsonb_typeof(choices)='array' and jsonb_array_length(choices)=4),
 correct integer not null check(correct between 0 and 3), explanation text not null check(length(btrim(explanation)) between 1 and 1000),
 source_url text not null check(source_url ~ '^https://'), reviewed_by uuid references public.qb_accounts(id), reviewed_at timestamptz, review_note text,
 check(not ('under13'=any(age_groups)) or difficulty='foundation')
);
alter table public.qb_question_bank enable row level security;
revoke all on public.qb_question_bank from public,anon,authenticated;
grant select on public.qb_question_bank to authenticated;
create policy bank_coach on public.qb_question_bank for select to authenticated using(qb_private.coach_ready());
create function public.qb_save_question(target uuid, question jsonb, review text default null) returns uuid
language plpgsql security definer set search_path='' as $$
declare result uuid; ages text[];
begin
 if not qb_private.coach_ready() or question is null or jsonb_typeof(question)<>'object' then raise exception 'Not authorized' using errcode='42501';end if;
 if jsonb_typeof(question->'choices')<>'array' or jsonb_array_length(question->'choices')<>4
 or (select count(distinct value) from jsonb_array_elements_text(question->'choices'))<>4
 or exists(select 1 from jsonb_array_elements(question->'choices') c where jsonb_typeof(c)<>'string' or length(c#>>'{}') not between 1 and 200)
 then raise exception 'Invalid choices' using errcode='22023';end if;
 select array_agg(value) into ages from jsonb_array_elements_text(question->'age_groups');
 if target is null then
 insert into public.qb_question_bank(pathway,ruleset,difficulty,age_groups,prompt,choices,correct,explanation,source_url,reviewed_by,reviewed_at,review_note)
 values(question->>'pathway',question->>'ruleset',question->>'difficulty',ages,question->>'prompt',question->'choices',(question->>'correct')::integer,question->>'explanation',question->>'source_url',case when length(btrim(review))>0 then auth.uid() end,case when length(btrim(review))>0 then now() end,review) returning id into result;
 else
 update public.qb_question_bank set pathway=question->>'pathway',ruleset=question->>'ruleset',difficulty=question->>'difficulty',age_groups=ages,prompt=question->>'prompt',choices=question->'choices',correct=(question->>'correct')::integer,explanation=question->>'explanation',source_url=question->>'source_url',reviewed_by=case when length(btrim(review))>0 then auth.uid() end,reviewed_at=case when length(btrim(review))>0 then now() end,review_note=review where id=target returning id into result;
 end if;
 if result is null then raise exception 'Question unavailable';end if;
 insert into public.qb_audit(actor_id,action,resource_id) values(auth.uid(),'quiz.question_saved',result);
 return result;
end;
$$;
create table public.qb_weekly_quizzes (
 id uuid primary key default gen_random_uuid(), week date not null check(extract(isodow from week)=1),
 title text not null check(length(title) between 1 and 160), pathway text not null check(pathway in ('flag','tackle')), ruleset text not null,
 questions jsonb not null check(jsonb_typeof(questions)='array' and jsonb_array_length(questions)=10),
 published_by uuid not null references public.qb_accounts(id), created_at timestamptz not null default now()
);
create table public.qb_weekly_assignments (
 id uuid primary key default gen_random_uuid(), quiz_id uuid not null references public.qb_weekly_quizzes(id), athlete_id uuid not null references public.qb_athletes(id) on delete cascade,
 week date not null, unique(athlete_id,week)
);
create table public.qb_quiz_results (
 assignment_id uuid primary key references public.qb_weekly_assignments(id) on delete cascade,
 athlete_id uuid not null references public.qb_athletes(id) on delete cascade, answers jsonb not null,
 score integer not null check(score between 0 and 10), completed_at timestamptz not null default now(), submitted_by uuid not null references public.qb_accounts(id)
);
alter table public.qb_weekly_quizzes enable row level security;
alter table public.qb_weekly_assignments enable row level security;
alter table public.qb_quiz_results enable row level security;
revoke all on public.qb_weekly_quizzes,public.qb_weekly_assignments,public.qb_quiz_results from public,anon,authenticated;
grant select on public.qb_quiz_results to authenticated;
create policy result_authorized on public.qb_quiz_results for select to authenticated using(qb_private.allowed(athlete_id));
create function public.qb_publish_weekly(targets uuid[], questions uuid[], week_start date, quiz_title text) returns uuid
language plpgsql security definer set search_path='' as $$
declare snapshot jsonb; rule text; format text; target uuid; athlete public.qb_athletes; result uuid;
begin
 if not qb_private.coach_ready() or coalesce(cardinality(targets),0) not between 1 and 100 or cardinality(targets)<>(select count(distinct x) from unnest(targets) x) or coalesce(cardinality(questions),0)<>10 or (select count(distinct x) from unnest(questions) x)<>10 then raise exception 'Invalid quiz' using errcode='42501';end if;
 select jsonb_agg(to_jsonb(q) order by x.ordinality),min(q.ruleset),min(q.pathway) into snapshot,rule,format from unnest(questions) with ordinality x(id,ordinality) join public.qb_question_bank q on q.id=x.id and q.reviewed_at is not null and length(btrim(q.review_note))>0;
 if jsonb_array_length(snapshot)<>10 or snapshot is null or (select count(distinct q.ruleset) from public.qb_question_bank q where q.id=any(questions))<>1 or (select count(distinct q.pathway) from public.qb_question_bank q where q.id=any(questions))<>1 then raise exception 'Ten reviewed questions from one ruleset required' using errcode='22023';end if;
 foreach target in array targets loop
 if not qb_private.allowed(target,true) then raise exception 'Not authorized' using errcode='42501';end if;
 select * into athlete from public.qb_athletes a where a.id=target;
 if athlete.ruleset is distinct from rule or (format='tackle' and athlete.pathway<>'tackle') or (format='flag' and athlete.pathway not like 'flag%') or athlete.age_group is null or exists(select 1 from public.qb_question_bank q where q.id=any(questions) and not athlete.age_group=any(q.age_groups)) then raise exception 'Pathway, age or ruleset mismatch' using errcode='22023';end if;
 end loop;
 insert into public.qb_weekly_quizzes(week,title,pathway,ruleset,questions,published_by) values(week_start,quiz_title,format,rule,snapshot,auth.uid()) returning id into result;
 foreach target in array targets loop
 insert into public.qb_weekly_assignments(quiz_id,athlete_id,week) values(result,target,week_start);
 end loop;
 perform public.qb_send_message(targets,'Your weekly Football IQ quiz is ready.',greatest(now(),week_start::timestamp at time zone 'UTC'));
 insert into public.qb_audit(actor_id,action,resource_id) values(auth.uid(),'quiz.week_published',result);
 return result;
end;
$$;
create function public.qb_weekly_inbox(target uuid) returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('assignment',a.id,'week',a.week,'title',q.title,'pathway',q.pathway,'ruleset',q.ruleset,'score',r.score,'completed_at',r.completed_at,'questions',
 (select jsonb_agg(case when r.assignment_id is null then jsonb_build_object('id',x.value->>'id','prompt',x.value->>'prompt','choices',x.value->'choices') else jsonb_build_object('id',x.value->>'id','prompt',x.value->>'prompt','choices',x.value->'choices','correct',x.value->'correct','selected',r.answers->(x.ordinality::integer-1),'explanation',x.value->>'explanation','source_url',x.value->>'source_url') end order by x.ordinality) from jsonb_array_elements(q.questions) with ordinality x(value,ordinality))) order by a.week desc),'[]'::jsonb)
 from public.qb_weekly_assignments a join public.qb_weekly_quizzes q on q.id=a.quiz_id left join public.qb_quiz_results r on r.assignment_id=a.id
 where a.athlete_id=target and a.week<=date_trunc('week',now() at time zone 'UTC')::date and qb_private.allowed(target);
$$;
create function public.qb_submit_weekly(target uuid, answers jsonb) returns integer language plpgsql security definer set search_path='' as $$
declare assignment public.qb_weekly_assignments; quiz public.qb_weekly_quizzes; result integer;
begin
 select * into assignment from public.qb_weekly_assignments a where a.id=target for update;
 if assignment.id is null or not qb_private.can_record(assignment.athlete_id) or assignment.week>date_trunc('week',now() at time zone 'UTC')::date then raise exception 'Not authorized' using errcode='42501';end if;
 select score into result from public.qb_quiz_results where assignment_id=target;
 if result is not null then return result;end if;
 if answers is null or jsonb_typeof(answers)<>'array' or jsonb_array_length(answers)<>10 or exists(select 1 from jsonb_array_elements(answers) a where jsonb_typeof(a)<>'number' or a::text !~ '^[0-3]$') then raise exception 'Exactly ten answers required' using errcode='22023';end if;
 select * into quiz from public.qb_weekly_quizzes where id=assignment.quiz_id;
 select count(*) into result from jsonb_array_elements(quiz.questions) with ordinality x(value,ordinality) where (x.value->>'correct')::integer=(answers->>(x.ordinality::integer-1))::integer;
 insert into public.qb_quiz_results(assignment_id,athlete_id,answers,score,submitted_by) values(target,assignment.athlete_id,answers,result,auth.uid());
 insert into public.qb_audit(actor_id,action,resource_id) values(auth.uid(),'quiz.submitted',target);
 return result;
end;
$$;
revoke all on function public.qb_save_question(uuid,jsonb,text),public.qb_publish_weekly(uuid[],uuid[],date,text),public.qb_weekly_inbox(uuid),public.qb_submit_weekly(uuid,jsonb) from public;
grant execute on function public.qb_save_question(uuid,jsonb,text),public.qb_publish_weekly(uuid[],uuid[],date,text),public.qb_weekly_inbox(uuid),public.qb_submit_weekly(uuid,jsonb) to authenticated;
create function public.qb_set_profile_ruleset(target uuid, rules text, review text) returns void language plpgsql security definer set search_path='' as $$
begin
 if not qb_private.allowed(target,true) or rules is null or length(btrim(rules)) not between 1 and 160 or review is null or length(btrim(review)) not between 1 and 1000 then raise exception 'Not authorized or review required' using errcode='42501';end if;
 update public.qb_athletes set ruleset=btrim(rules) where id=target;
 insert into public.qb_audit(actor_id,action,resource_id) values(auth.uid(),'athlete.ruleset_reviewed',target);
end;
$$;
revoke all on function public.qb_set_profile_ruleset(uuid,text,text) from public;
grant execute on function public.qb_set_profile_ruleset(uuid,text,text) to authenticated;
commit;
