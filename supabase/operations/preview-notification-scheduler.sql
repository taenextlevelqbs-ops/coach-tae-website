-- Optional, explicit STAGING setup. Run only in the staging Supabase project.
-- Requires pg_cron, pg_net and Supabase Vault to be enabled by the project owner.
-- Configure Vault secrets through the dashboard before running this file:
-- coach_tae_preview_jobs_url    = verified preview deployment HTTPS URL + /api/jobs
-- coach_tae_preview_cron_secret = that preview's CRON_SECRET (at least 32 characters)
-- coach_tae_preview_bypass      = optional Vercel protection bypass secret
-- This file contains no credentials and does not change production scheduling.
begin;
do $$
declare endpoint text; bearer text;
begin
 if to_regnamespace('cron') is null or to_regnamespace('net') is null or to_regclass('vault.decrypted_secrets') is null then
 raise exception 'Enable Supabase Cron, pg_net and Vault in the staging project first'; end if;
 -- Some upstream pg_net versions grant queue reads to PUBLIC. Do not install a
 -- secret-bearing HTTP job until the owner has secured these tables and Vault.
 if has_table_privilege('anon','vault.decrypted_secrets','select') or has_table_privilege('authenticated','vault.decrypted_secrets','select') or has_table_privilege('anon','net.http_request_queue','select') or has_table_privilege('authenticated','net.http_request_queue','select') then
 raise exception 'Vault and pg_net request queues must not be readable by anon/authenticated roles; review grants before scheduling'; end if;
 select decrypted_secret into endpoint from vault.decrypted_secrets where name='coach_tae_preview_jobs_url';
 select decrypted_secret into bearer from vault.decrypted_secrets where name='coach_tae_preview_cron_secret';
 if endpoint is null or endpoint !~ '^https://[a-z0-9-]+\.vercel\.app/api/jobs$' or length(coalesce(bearer,''))<32 then
 raise exception 'Configure a verified preview /api/jobs URL and a strong matching cron secret in Vault'; end if;
end $$;
create table if not exists public.ct_preview_scheduler_runs(request_id bigint primary key,requested_at timestamptz not null default now());
alter table public.ct_preview_scheduler_runs enable row level security;
revoke all on public.ct_preview_scheduler_runs from public,anon,authenticated;
grant select on public.ct_preview_scheduler_runs to service_role;
create or replace function public.ct_dispatch_preview_notifications() returns bigint language plpgsql security definer set search_path='' as $$
declare endpoint text; bearer text; bypass text; request_id bigint;
begin
 select decrypted_secret into endpoint from vault.decrypted_secrets where name='coach_tae_preview_jobs_url';
 select decrypted_secret into bearer from vault.decrypted_secrets where name='coach_tae_preview_cron_secret';
 select decrypted_secret into bypass from vault.decrypted_secrets where name='coach_tae_preview_bypass';
 if endpoint is null or endpoint !~ '^https://[a-z0-9-]+\.vercel\.app/api/jobs$' or length(coalesce(bearer,''))<32 then raise exception 'Preview scheduler Vault configuration is missing or invalid'; end if;
 select net.http_post(url:=endpoint,body:='{}'::jsonb,headers:=jsonb_strip_nulls(jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||bearer,'x-coach-tae-environment','preview','x-vercel-protection-bypass',nullif(bypass,''))),timeout_milliseconds:=55000) into request_id;
 insert into public.ct_preview_scheduler_runs(request_id) values(request_id);
 delete from public.ct_preview_scheduler_runs where requested_at<now()-interval '7 days';
 return request_id;
end $$;
revoke all on function public.ct_dispatch_preview_notifications() from public,anon,authenticated;
grant execute on function public.ct_dispatch_preview_notifications() to service_role;
-- pg_cron updates the same named job rather than creating duplicate schedules.
select cron.schedule('coach-tae-preview-notifications','* * * * *','select public.ct_dispatch_preview_notifications();');
commit;
