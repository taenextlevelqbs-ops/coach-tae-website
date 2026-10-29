-- Optional, explicit PRODUCTION setup. Run only in the production Supabase project.
-- Requires pg_cron, pg_net and Supabase Vault to be enabled by the project owner.
-- Configure Vault secrets through the dashboard before running this file:
-- coach_tae_production_jobs_url    = https://coachtaeqb.com/api/jobs
-- coach_tae_production_cron_secret = that production's CRON_SECRET (at least 32 characters)
-- Explicit production operations only: not an automatic migration.
-- The production release must have passed hosted Auth, Stripe test-mode and delivery checks first.
begin;
do $$
declare endpoint text; bearer text;
begin
 if to_regnamespace('cron') is null or to_regnamespace('net') is null or to_regclass('vault.decrypted_secrets') is null then
 raise exception 'Enable Supabase Cron, pg_net and Vault in the production project first'; end if;
 -- Some upstream pg_net versions grant queue reads to PUBLIC. Do not install a
 -- secret-bearing HTTP job until the owner has secured these tables and Vault.
 if has_table_privilege('anon','vault.decrypted_secrets','select') or has_table_privilege('authenticated','vault.decrypted_secrets','select') or has_table_privilege('anon','net.http_request_queue','select') or has_table_privilege('authenticated','net.http_request_queue','select') then
 raise exception 'Vault and pg_net request queues must not be readable by anon/authenticated roles; review grants before scheduling'; end if;
 select decrypted_secret into endpoint from vault.decrypted_secrets where name='coach_tae_production_jobs_url';
 select decrypted_secret into bearer from vault.decrypted_secrets where name='coach_tae_production_cron_secret';
 if endpoint is null or endpoint !~ '^https://coachtaeqb\.com/api/jobs$' or length(coalesce(bearer,''))<32 then
 raise exception 'Configure https://coachtaeqb.com/api/jobs and a strong matching production cron secret in Vault'; end if;
end $$;
create table if not exists public.ct_production_scheduler_runs(request_id bigint primary key,requested_at timestamptz not null default now());
alter table public.ct_production_scheduler_runs enable row level security;
revoke all on public.ct_production_scheduler_runs from public,anon,authenticated;
grant select on public.ct_production_scheduler_runs to service_role;
create or replace function public.ct_dispatch_production_notifications() returns bigint language plpgsql security definer set search_path='' as $$
declare endpoint text; bearer text; request_id bigint;
begin
 select decrypted_secret into endpoint from vault.decrypted_secrets where name='coach_tae_production_jobs_url';
 select decrypted_secret into bearer from vault.decrypted_secrets where name='coach_tae_production_cron_secret';
 if endpoint is null or endpoint !~ '^https://coachtaeqb\.com/api/jobs$' or length(coalesce(bearer,''))<32 then raise exception 'Preview scheduler Vault configuration is missing or invalid'; end if;
 select net.http_post(url:=endpoint,body:='{}'::jsonb,headers:=jsonb_strip_nulls(jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||bearer,'x-coach-tae-environment','production')),timeout_milliseconds:=55000) into request_id;
 insert into public.ct_production_scheduler_runs(request_id) values(request_id);
 delete from public.ct_production_scheduler_runs where requested_at<now()-interval '7 days';
 return request_id;
end $$;
revoke all on function public.ct_dispatch_production_notifications() from public,anon,authenticated;
grant execute on function public.ct_dispatch_production_notifications() to service_role;
-- pg_cron updates the same named job rather than creating duplicate schedules.
select cron.schedule('coach-tae-production-notifications','* * * * *','select public.ct_dispatch_production_notifications();');
commit;
