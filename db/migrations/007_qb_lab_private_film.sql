-- Private media remains disabled at both application and database gates until owner approval.
begin;
create table public.qb_mvp_controls (
 singleton boolean primary key default true check(singleton), synthetic_media_enabled boolean not null default false,
 minor_onboarding_enabled boolean not null default false
);
insert into public.qb_mvp_controls(singleton) values(true);
alter table public.qb_mvp_controls enable row level security;
revoke all on public.qb_mvp_controls from public,anon,authenticated;
-- Protect the registration RPC even if called directly through the provider REST API.
alter function public.qb_register_managed_athlete(uuid,text,text,text) rename to qb_register_managed_athlete_checked;
revoke all on function public.qb_register_managed_athlete_checked(uuid,text,text,text) from public,anon,authenticated;
create function public.qb_register_managed_athlete(ticket uuid,nickname text,pathway text,age_group text) returns uuid language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.qb_mvp_controls where singleton and minor_onboarding_enabled) then raise exception 'Onboarding disabled' using errcode='42501';end if;
 return public.qb_register_managed_athlete_checked(ticket,nickname,pathway,age_group);
end;
$$;
revoke all on function public.qb_register_managed_athlete(uuid,text,text,text) from public;
grant execute on function public.qb_register_managed_athlete(uuid,text,text,text) to authenticated;
alter table public.qb_film drop constraint qb_film_state_check;
alter table public.qb_film add constraint qb_film_state_check check(state in ('quarantine','validated','released','deleted','rejected'));
alter table public.qb_film add column created_at timestamptz not null default now();
alter table public.qb_film add column uploaded_by uuid references public.qb_accounts(id);
alter table public.qb_film add column declared_bytes bigint check(declared_bytes between 1 and 4194304);
alter table public.qb_film add column actual_bytes bigint check(actual_bytes between 1 and 4194304);
alter table public.qb_film add column duration_seconds numeric check(duration_seconds>0 and duration_seconds<=60);
alter table public.qb_film add column processed_key text unique;
alter table public.qb_film add column upload_expires_at timestamptz;
alter table public.qb_film add column processing_event uuid unique;
alter table public.qb_film add column processing_claim uuid;
alter table public.qb_film add column processing_lease_until timestamptz;
create table public.qb_film_deletion_jobs (
 film_id uuid primary key references public.qb_film(id), source_key text not null, processed_key text,
 created_at timestamptz not null default now(), completed_at timestamptz
);
alter table public.qb_film_deletion_jobs enable row level security;
revoke all on public.qb_film_deletion_jobs from public,anon,authenticated;
create function qb_private.media_consent(target uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.qb_athletes a where a.id=target and (not a.minor or exists(select 1 from public.qb_consents c join public.qb_accounts g on g.id=c.guardian_id and g.role='guardian' and g.adult_verified where c.athlete_id=a.id and c.purpose='media' and length(btrim(c.verified_evidence_ref))>0 and length(btrim(c.policy_version))>0 and c.revoked_at is null and c.expires_at>now())));
$$;
revoke all on function qb_private.media_consent(uuid) from public;
grant execute on function qb_private.media_consent(uuid) to authenticated;
create function qb_private.film_metadata_allowed(target uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.qb_film f join public.qb_accounts u on u.id=auth.uid() where f.id=target and f.state<>'deleted' and f.retained_until>now() and qb_private.allowed(f.athlete_id) and qb_private.media_consent(f.athlete_id)
 and ((u.role in ('coach','administrator') and f.coach_id=u.id) or (u.role in ('adult','guardian','athlete') and qb_private.can_record(f.athlete_id))));
$$;
revoke all on function qb_private.film_metadata_allowed(uuid) from public;
grant execute on function qb_private.film_metadata_allowed(uuid) to authenticated;
create or replace function qb_private.film_allowed(target uuid) returns boolean language sql stable security definer set search_path='' as $$
 select qb_private.film_metadata_allowed(target) and exists(select 1 from public.qb_film f where f.id=target and f.state in ('validated','released') and f.processed_key is not null);
$$;
drop policy film_pair on public.qb_film;
create policy film_metadata on public.qb_film for select to authenticated using(qb_private.film_metadata_allowed(id));
create function public.qb_begin_film(target uuid, reviewer uuid, bytes bigint) returns jsonb language plpgsql security definer set search_path='' as $$
declare result uuid:=gen_random_uuid(); key text;
begin
 if not exists(select 1 from public.qb_mvp_controls where singleton and synthetic_media_enabled)
 or not qb_private.can_record(target) or not qb_private.media_consent(target) or bytes is null or bytes not between 1 and 4194304
 or not exists(select 1 from public.qb_coach_assignments ca join public.qb_accounts c on c.id=ca.coach_id and c.adult_verified and c.role in ('coach','administrator') where ca.athlete_id=target and ca.coach_id=reviewer)
 or (select count(*) from public.qb_film where uploaded_by=auth.uid() and created_at>now()-interval '1 day')>=10 then raise exception 'Media disabled or not authorized' using errcode='42501';end if;
 key:=auth.uid()::text||'/'||result::text||'/source.mp4';
 insert into public.qb_film(id,athlete_id,object_key,state,retained_until,coach_id,uploaded_by,declared_bytes,upload_expires_at) values(result,target,key,'quarantine',now()+interval '30 days',reviewer,auth.uid(),bytes,now()+interval '5 minutes');
 insert into public.qb_audit(actor_id,action,resource_id) values(auth.uid(),'film.intent_created',result);
 return jsonb_build_object('id',result,'object_key',key,'upload_expires_at',now()+interval '5 minutes');
end;
$$;
-- Processor service only. It must validate/decode/strip metadata/transcode before invoking this.
create function public.qb_release_processed_film(target uuid, event uuid, bytes bigint, seconds numeric, object_key text, expected_claim uuid default null) returns void language plpgsql security definer set search_path='' as $$
declare film public.qb_film;
begin
 select * into film from public.qb_film where id=target for update;
 if film.id is null or film.state='deleted' or film.retained_until<=now() or not qb_private.media_consent(film.athlete_id) then raise exception 'Film unavailable';end if;
 if film.processing_event=event then return;end if;
 if film.processing_claim is not null and film.processing_claim is distinct from expected_claim then raise exception 'Processing lease lost' using errcode='42501';end if;
 if film.state<>'quarantine' or event is null or bytes is null or bytes not between 1 and 4194304 or seconds is null or seconds<=0 or seconds>60 or object_key is distinct from target::text||'/processed.mp4' then raise exception 'Invalid processed film';end if;
 if not exists(select 1 from public.qb_coach_assignments where athlete_id=film.athlete_id and coach_id=film.coach_id) then raise exception 'Reviewer no longer assigned';end if;
 if exists(select 1 from public.qb_athletes a where a.id=film.athlete_id and a.minor and not exists(select 1 from public.qb_consents c where c.athlete_id=a.id and c.purpose='training' and c.revoked_at is null and c.expires_at>now())) then raise exception 'Consent revoked';end if;
 update public.qb_film set state='validated',actual_bytes=bytes,duration_seconds=seconds,processed_key=qb_release_processed_film.object_key,processing_event=event where id=target;
 insert into public.qb_audit(action,resource_id) values('film.processor_validated',target);
end;
$$;
create function public.qb_write_film_feedback(target uuid, feedback text) returns uuid language plpgsql security definer set search_path='' as $$
declare film public.qb_film; result uuid;
begin
 select * into film from public.qb_film where id=target for update;
 if not qb_private.coach_ready() or film.coach_id is distinct from auth.uid() or not qb_private.film_allowed(target) or feedback is null or length(btrim(feedback)) not between 1 and 4000 then raise exception 'Not authorized' using errcode='42501';end if;
 insert into public.qb_feedback(film_id,athlete_id,author_id,timestamp_ms,note,released_at) values(target,film.athlete_id,auth.uid(),0,btrim(feedback),now()) returning id into result;
 update public.qb_film set state='released' where id=target;
 perform public.qb_send_message(array[film.athlete_id],'Coach Tae added feedback to your film. Open Film Room to read it.',now());
 insert into public.qb_audit(actor_id,action,resource_id) values(auth.uid(),'film.feedback_released',result);
 return result;
end;
$$;
create function public.qb_delete_film(target uuid) returns void language plpgsql security definer set search_path='' as $$
declare film public.qb_film;
begin
 select * into film from public.qb_film where id=target for update;
 -- Verified owners/guardians may request deletion even after consent withdrawal. No playback right is restored.
 if not qb_private.identity_verified() or not exists(select 1 from public.qb_athletes a join public.qb_accounts u on u.id=auth.uid() where a.id=film.athlete_id and ((u.role='adult' and u.adult_verified and a.adult_owner=u.id) or (u.role='guardian' and u.adult_verified and exists(select 1 from public.qb_guardians g where g.athlete_id=a.id and g.account_id=u.id)) or (u.role='athlete' and exists(select 1 from public.qb_athlete_logins l where l.athlete_id=a.id and l.account_id=u.id)))) then raise exception 'Not authorized' using errcode='42501';end if;
 update public.qb_film set state='deleted' where id=target;
 insert into public.qb_film_deletion_jobs(film_id,source_key,processed_key) values(target,film.object_key,film.processed_key) on conflict(film_id) do update set completed_at=null;
 insert into public.qb_audit(actor_id,action,resource_id) values(auth.uid(),'film.deletion_requested',target);
end;
$$;
create function public.qb_media_retention_sweep() returns integer language plpgsql security definer set search_path='' as $$
declare n integer;
begin
 update public.qb_film set state='deleted' where retained_until<=now() or not qb_private.media_consent(athlete_id) or (state='quarantine' and upload_expires_at<now()-interval '1 day');
 insert into public.qb_film_deletion_jobs(film_id,source_key,processed_key)
 select id,object_key,processed_key from public.qb_film where state='deleted' on conflict(film_id) do update set completed_at=null;
 get diagnostics n=row_count;return n;
end;
$$;
revoke all on function public.qb_begin_film(uuid,uuid,bigint),public.qb_write_film_feedback(uuid,text),public.qb_delete_film(uuid),public.qb_release_processed_film(uuid,uuid,bigint,numeric,text,uuid),public.qb_media_retention_sweep() from public;
grant execute on function public.qb_begin_film(uuid,uuid,bigint),public.qb_write_film_feedback(uuid,text),public.qb_delete_film(uuid) to authenticated;
grant execute on function public.qb_release_processed_film(uuid,uuid,bigint,numeric,text,uuid),public.qb_media_retention_sweep() to service_role;
create function public.qb_reject_film(target uuid, expected_claim uuid default null) returns void language plpgsql security definer set search_path='' as $$
begin
 insert into public.qb_film_deletion_jobs(film_id,source_key,processed_key) select id,object_key,processed_key from public.qb_film where id=target and state='quarantine' and (processing_claim is null or processing_claim=expected_claim) on conflict do nothing;
 update public.qb_film set state='rejected' where id=target and state='quarantine' and (processing_claim is null or processing_claim=expected_claim);
 if found then insert into public.qb_audit(action,resource_id) values('film.processing_rejected',target);end if;
end;
$$;
revoke all on function public.qb_reject_film(uuid,uuid) from public;
grant execute on function public.qb_reject_film(uuid,uuid) to service_role;
grant select on public.qb_film,public.qb_film_deletion_jobs to service_role;
grant update(completed_at) on public.qb_film_deletion_jobs to service_role;
create function public.qb_film_upload_options(target uuid) returns jsonb language sql stable security definer set search_path='' as $$
 select case when exists(select 1 from public.qb_mvp_controls where singleton and synthetic_media_enabled) and qb_private.can_record(target) and qb_private.media_consent(target)
 then jsonb_build_object('allowed',true,'reviewers',(select coalesce(jsonb_agg(jsonb_build_object('id',c.id)), '[]'::jsonb) from public.qb_coach_assignments ca join public.qb_accounts c on c.id=ca.coach_id and c.adult_verified and c.role in ('coach','administrator') where ca.athlete_id=target))
 else jsonb_build_object('allowed',false,'reviewers','[]'::jsonb) end;
$$;
revoke all on function public.qb_film_upload_options(uuid) from public;
grant execute on function public.qb_film_upload_options(uuid) to authenticated;
create function public.qb_claim_next_film() returns jsonb language plpgsql security definer set search_path='' as $$
declare film public.qb_film; claim uuid:=gen_random_uuid();
begin
 if not exists(select 1 from public.qb_mvp_controls where singleton and synthetic_media_enabled) then return null;end if;
 select * into film from public.qb_film f where f.state='quarantine' and f.uploaded_by is not null and f.retained_until>now() and (f.processing_lease_until is null or f.processing_lease_until<now()) order by f.created_at for update skip locked limit 1;
 if film.id is null then return null;end if;
 update public.qb_film set processing_claim=claim,processing_lease_until=now()+interval '5 minutes' where id=film.id;
 return jsonb_build_object('id',film.id,'object_key',film.object_key,'claim',claim);
end;
$$;
revoke all on function public.qb_claim_next_film() from public;
grant execute on function public.qb_claim_next_film() to service_role;
create function public.qb_withdraw_consent(target uuid, purpose text) returns void language plpgsql security definer set search_path='' as $$
begin
 if not qb_private.identity_verified() or purpose is null or purpose not in ('training','media') or not exists(select 1 from public.qb_guardians g join public.qb_accounts a on a.id=g.account_id and a.adult_verified and a.role='guardian' where g.athlete_id=target and g.account_id=auth.uid()) then raise exception 'Verified guardian required' using errcode='42501';end if;
 -- Any linked verified guardian may stop collection pending an owner review of conflicting requests.
 update public.qb_consents c set revoked_at=coalesce(revoked_at,now()) where athlete_id=target and (c.purpose=qb_withdraw_consent.purpose or qb_withdraw_consent.purpose='training');
 insert into public.qb_film_deletion_jobs(film_id,source_key,processed_key) select id,object_key,processed_key from public.qb_film where athlete_id=target on conflict(film_id) do update set completed_at=null;
 update public.qb_film set state='deleted' where athlete_id=target;
 insert into public.qb_audit(actor_id,action,resource_id) values(auth.uid(),'consent.'||purpose||'_withdrawn',target);
end;
$$;
revoke all on function public.qb_withdraw_consent(uuid,text) from public;
grant execute on function public.qb_withdraw_consent(uuid,text) to authenticated;
create or replace function public.qb_registration_tickets() returns table(id uuid,expires_at timestamptz) language sql stable security definer set search_path='' as $$
 select t.id,t.expires_at from public.qb_guardian_tickets t join public.qb_accounts a on a.id=auth.uid() and a.id=t.guardian_id and a.role='guardian' and a.adult_verified
 where qb_private.identity_verified() and exists(select 1 from public.qb_mvp_controls where singleton and minor_onboarding_enabled)
 and t.consumed_at is null and t.revoked_at is null and t.expires_at>now();
$$;
create function public.qb_confirm_film_deletion(target uuid) returns void language plpgsql security definer set search_path='' as $$
declare state text;
begin
 select f.state into state from public.qb_film f join public.qb_film_deletion_jobs j on j.film_id=f.id where f.id=target for update of f;
 if state is null then return;end if;
 if state='rejected' then
 update public.qb_film_deletion_jobs set completed_at=now() where film_id=target;
 elsif state='deleted' then
 delete from public.qb_film_deletion_jobs where film_id=target;
 delete from public.qb_film where id=target; -- cascades written feedback; no private film metadata remains.
 else raise exception 'Deletion not requested';end if;
 insert into public.qb_audit(action,resource_id) values('film.physical_deletion_confirmed',target);
end;
$$;
revoke all on function public.qb_confirm_film_deletion(uuid) from public;
grant execute on function public.qb_confirm_film_deletion(uuid) to service_role;
commit;
