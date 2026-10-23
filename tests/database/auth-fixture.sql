-- Synthetic local auth schema: a test seam only, not JWT verification.
create schema auth;
create role anon nologin;
create role authenticated nologin;
create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
grant usage on schema auth to authenticated;
grant execute on function auth.uid() to authenticated;
create role service_role nologin;
