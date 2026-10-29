-- Synchronous HTTP alternative: credentials never enter pg_net's shared request queue.
-- Apply only to the existing Coach Tae project after configuring its Vault secrets.
begin;
create table if not exists public.ct_production_http_dispatch_runs (
 id bigint generated always as identity primary key,
 requested_at timestamptz not null default now(),
 http_status integer not null
);
alter table public.ct_production_http_dispatch_runs enable row level security;
revoke all on public.ct_production_http_dispatch_runs from public,anon,authenticated;
grant select on public.ct_production_http_dispatch_runs to service_role;
create or replace function public.ct_dispatch_production_http_notifications() returns integer
language plpgsql security definer set search_path='' as $$
declare endpoint text; bearer text; response extensions.http_response;
begin
 if has_table_privilege('anon','vault.decrypted_secrets','select') or has_table_privilege('authenticated','vault.decrypted_secrets','select') then raise exception 'Vault access is not private'; end if;
 select decrypted_secret into endpoint from vault.decrypted_secrets where name='coach_tae_production_jobs_url';
 select decrypted_secret into bearer from vault.decrypted_secrets where name='coach_tae_production_cron_secret';
 if endpoint is distinct from 'https://coachtaeqb.com/api/jobs' or length(coalesce(bearer,''))<32 then raise exception 'Production notification configuration is incomplete'; end if;
 perform extensions.http_set_curlopt('CURLOPT_TIMEOUT_MS','55000');
 select * into response from extensions.http(('POST',endpoint,array[
  row('Authorization','Bearer '||bearer)::extensions.http_header,
  row('x-coach-tae-environment','production')::extensions.http_header
 ],'application/json','{}')::extensions.http_request);
 if response.status<>200 then raise exception 'Production notification endpoint returned HTTP %',response.status; end if;
 insert into public.ct_production_http_dispatch_runs(http_status) values(response.status);
 delete from public.ct_production_http_dispatch_runs where requested_at<now()-interval '7 days';
 return response.status;
end $$;
revoke all on function public.ct_dispatch_production_http_notifications() from public,anon,authenticated;
grant execute on function public.ct_dispatch_production_http_notifications() to service_role;
select cron.schedule('coach-tae-production-notifications','* * * * *','select public.ct_dispatch_production_http_notifications();');
commit;
