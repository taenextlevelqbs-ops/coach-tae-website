-- Additive cutover protection. Does not read, delete or modify external appointments.
begin;
create table public.ct_legacy_busy_times (
 source_ref text primary key check(source_ref ~ '^[a-f0-9]{64}$'),
 block_id uuid not null unique references public.ct_blocks(id) on delete cascade,
 imported_at timestamptz not null default now()
);
alter table public.ct_legacy_busy_times enable row level security;
revoke all on public.ct_legacy_busy_times from public,anon,authenticated;
grant all on public.ct_legacy_busy_times to service_role;
create function public.ct_import_busy_times(p_items jsonb) returns int language plpgsql set search_path='' as $$
declare item jsonb; start_at timestamptz; end_at timestamptz; block uuid; existing public.ct_blocks; added int:=0;
begin
 perform pg_advisory_xact_lock(871204);
 if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items)>1000 then raise exception 'Supply at most 1000 occupied intervals'; end if;
 for item in select value from jsonb_array_elements(p_items) loop
 if coalesce(item->>'source_ref','') !~ '^[a-f0-9]{64}$' or coalesce(item->>'starts_at','') !~ '(Z|[+-][0-9]{2}:[0-9]{2})$' or coalesce(item->>'ends_at','') !~ '(Z|[+-][0-9]{2}:[0-9]{2})$' then raise exception 'Invalid occupied interval'; end if;
 start_at:=(item->>'starts_at')::timestamptz; end_at:=(item->>'ends_at')::timestamptz;
 if start_at is null or end_at is null or not isfinite(start_at) or not isfinite(end_at) or end_at<=start_at then raise exception 'Invalid occupied interval'; end if;
 select b.* into existing from public.ct_legacy_busy_times l join public.ct_blocks b on b.id=l.block_id where l.source_ref=item->>'source_ref';
 if found then
 if existing.starts_at<>start_at or existing.ends_at<>end_at then raise exception 'Previously imported appointment changed; review its existing block before retrying'; end if;
 continue;
 end if;
 if end_at<=now() then raise exception 'Import only upcoming or currently occupied times'; end if;
 if exists(select 1 from public.ct_bookings b join public.ct_slots s on s.id=b.slot_id where (b.status='confirmed' or (b.status='held' and b.hold_until>now())) and s.occupied_range && tstzrange(start_at,end_at,'[)')) then raise exception 'Existing native reservation overlaps imported appointment; resolve before cutover'; end if;
 insert into public.ct_blocks(starts_at,ends_at,reason) values(start_at,end_at,'Existing training appointment') returning id into block;
 insert into public.ct_legacy_busy_times(source_ref,block_id) values(item->>'source_ref',block);
 added:=added+1;
 end loop;
 return added;
end $$;
revoke all on function public.ct_import_busy_times(jsonb) from public,anon,authenticated;
grant execute on function public.ct_import_busy_times(jsonb) to service_role;
commit;
