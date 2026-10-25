-- Run only in approved dedicated synthetic staging, after migrations 001-007.
-- Existing buckets must be inspected; this deliberately fails instead of silently reusing them.
begin;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('qb-lab-quarantine','qb-lab-quarantine',false,4194304,array['video/mp4']),
 ('qb-lab-processed','qb-lab-processed',false,4194304,array['video/mp4']);
create function qb_private.media_upload_allowed(object_name text) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.qb_mvp_controls where singleton and synthetic_media_enabled)
 and exists(select 1 from public.qb_film f where f.object_key=object_name and f.uploaded_by=auth.uid() and f.state='quarantine' and f.upload_expires_at>now() and qb_private.can_record(f.athlete_id) and qb_private.media_consent(f.athlete_id));
$$;
create function qb_private.media_storage_read_allowed(object_name text) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.qb_mvp_controls where singleton and synthetic_media_enabled)
 and exists(select 1 from public.qb_film f where f.processed_key=object_name and qb_private.film_allowed(f.id));
$$;
revoke all on function qb_private.media_upload_allowed(text),qb_private.media_storage_read_allowed(text) from public;
grant execute on function qb_private.media_upload_allowed(text),qb_private.media_storage_read_allowed(text) to authenticated;
create policy qb_mvp_quarantine_intent on storage.objects for insert to authenticated with check(bucket_id='qb-lab-quarantine' and qb_private.media_upload_allowed(name));
create policy qb_mvp_processed_read on storage.objects for select to authenticated using(bucket_id='qb-lab-processed' and qb_private.media_storage_read_allowed(name));
-- No raw-file SELECT, anonymous access, listing of other families, overwrite or client delete policy.
commit;
