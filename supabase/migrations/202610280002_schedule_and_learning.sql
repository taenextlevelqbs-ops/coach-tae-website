begin;
-- Extend the existing schema; never replace an existing hosted project.
alter table public.ct_rules add column local_end time, add column superseded_by uuid references public.ct_rules(id);
alter table public.ct_rules add constraint ct_window_order check(local_end is null or local_end>local_start);
alter table public.ct_lessons add column slug text unique, add column level text not null default 'beginner' check(level in ('beginner','intermediate','advanced')), add column topic text not null default 'Fundamentals', add column diagram text, add column sort_order int not null default 0;
create table public.ct_credit_recovery (family_id uuid references public.ct_families,kind text check(kind in ('private','group')),units int not null check(units>=0),primary key(family_id,kind));
alter table public.ct_credit_recovery enable row level security;
revoke all on public.ct_credit_recovery from anon,authenticated;
grant select on public.ct_credit_recovery to authenticated;
grant all on public.ct_credit_recovery to service_role;
create policy ct_recovery_read on public.ct_credit_recovery for select to authenticated using(family_id=auth.uid() or public.ct_is_coach());
-- Normalize any previously recorded refund deficit into an explicit recovery record.
-- Ledger history is retained, and spendable balances become zero rather than negative.
do $$ declare r record; begin
 for r in select family_id,kind,sum(delta) balance from public.ct_credits group by family_id,kind having sum(delta)<0 loop
 insert into public.ct_credits(family_id,kind,delta,source) values(r.family_id,r.kind,-r.balance,'recovery-normalization:'||r.family_id||':'||r.kind);
 insert into public.ct_credit_recovery values(r.family_id,r.kind,-r.balance);
 end loop;
end $$;
create function public.ct_guard_credit() returns trigger language plpgsql set search_path='' as $$
begin
 perform pg_advisory_xact_lock(871204);
 -- Let ON CONFLICT handle an already-processed source without failing a retry.
 if exists(select 1 from public.ct_credits where source=new.source) then return new; end if;
 if new.delta<0 and (select coalesce(sum(delta),0) from public.ct_credits where family_id=new.family_id and kind=new.kind)+new.delta<0 then raise exception 'Insufficient available credits'; end if;
 return new;
end $$;
create trigger ct_guard_credit before insert on public.ct_credits for each row execute function public.ct_guard_credit();
create function public.ct_recover_credit() returns trigger language plpgsql set search_path='' as $$
declare due int; take int; begin
 if new.delta<=0 then return new; end if;
 select units into due from public.ct_credit_recovery where family_id=new.family_id and kind=new.kind for update;
 take:=least(coalesce(due,0),new.delta);
 if take>0 then
 update public.ct_credit_recovery set units=units-take where family_id=new.family_id and kind=new.kind;
 insert into public.ct_credits(family_id,kind,delta,source) values(new.family_id,new.kind,-take,'recovered:'||new.source);
 end if; return new;
end $$;
create trigger ct_recover_credit after insert on public.ct_credits for each row execute function public.ct_recover_credit();

create or replace function public.ct_apply_refund(p_event text,p_intent text) returns void language plpgsql set search_path='' as $$
declare o public.ct_orders; k text; units int; available int; take int; begin
 perform pg_advisory_xact_lock(871204);
 if exists(select 1 from public.ct_events where event_id=p_event) then return; end if;
 select * into o from public.ct_orders where payment_intent_id=p_intent for update;
 if not found then raise exception 'Refund payment not yet processed'; end if;
 insert into public.ct_events(event_id,event_type) values(p_event,'payment.refunded');
 if o.status='refunded' then return; end if;
 if o.status='paid' and o.product_key in ('group','private','group_pack','private_pack') then
 k:=case when o.product_key like 'private%' then 'private' else 'group' end;
 units:=case when o.product_key like '%pack' then 3 else 1 end;
 if o.booking_id is null or exists(select 1 from public.ct_bookings where id=o.booking_id and status='cancelled') then
 select coalesce(sum(delta),0) into available from public.ct_credits where family_id=o.family_id and kind=k;
 take:=least(units,available);
 if take>0 then insert into public.ct_credits(family_id,kind,delta,source) values(o.family_id,k,-take,'refund:'||o.id) on conflict(source) do nothing; end if;
 if take<units then insert into public.ct_credit_recovery(family_id,kind,units) values(o.family_id,k,units-take) on conflict(family_id,kind) do update set units=public.ct_credit_recovery.units+excluded.units; end if;
 end if;
 if o.booking_id is not null then
 update public.ct_bookings set status='cancelled',version=version+1 where id=o.booking_id and status='confirmed';
 perform public.ct_enqueue('refunded-booking:'||o.id,'booking_cancelled',o.family_id,jsonb_build_object('booking_id',o.booking_id));
 end if; end if;
 update public.ct_orders set status='refunded' where id=o.id;
 perform public.ct_enqueue('refunded:'||o.id,'payment_refunded',o.family_id,jsonb_build_object('order_id',o.id));
end $$;

create or replace function public.ct_publish(p_days int default 60) returns int language plpgsql set search_path='' as $$
declare r public.ct_rules; d date; local_time timestamp; start_time timestamptz; finish timestamptz; cutoff timestamp; n int:=0; begin
 perform pg_advisory_xact_lock(871204);
 if p_days<1 or p_days>90 then raise exception 'Invalid publishing window'; end if;
 for r in select * from public.ct_rules where active order by id loop
 if not exists(select 1 from pg_timezone_names where name=r.timezone) then raise exception 'Invalid timezone'; end if;
 for d in select x::date from generate_series((now() at time zone r.timezone)::date::timestamp,((now() at time zone r.timezone)::date+p_days)::timestamp,interval '1 day') x loop
 if extract(dow from d)=r.weekday then
 local_time:=d+r.local_start; cutoff:=case when r.local_end is null then local_time+r.duration_minutes*interval '1 minute' else d+r.local_end end;
 while local_time+r.duration_minutes*interval '1 minute'<=cutoff loop
 start_time:=local_time at time zone r.timezone; finish:=start_time+r.duration_minutes*interval '1 minute';
 if (start_time at time zone r.timezone)=local_time and start_time>now() and not exists(select 1 from public.ct_slots existing where not existing.cancelled and existing.occupied_range && tstzrange(start_time-r.buffer_minutes*interval '1 minute',finish+r.buffer_minutes*interval '1 minute','[)')) and not exists(select 1 from public.ct_blocks b where tstzrange(b.starts_at,b.ends_at,'[)') && tstzrange(start_time-r.buffer_minutes*interval '1 minute',finish+r.buffer_minutes*interval '1 minute','[)')) then
 insert into public.ct_slots(rule_id,kind,starts_at,ends_at,buffer_minutes,capacity) values(r.id,r.kind,start_time,finish,r.buffer_minutes,r.capacity) on conflict(rule_id,starts_at) do update set cancelled=false;
 n:=n+1;
 end if;
 local_time:=local_time+(r.duration_minutes+2*r.buffer_minutes)*interval '1 minute';
 end loop; end if; end loop; end loop; return n;
end $$;
create function public.ct_save_windows(p_id uuid,p_data jsonb) returns int language plpgsql set search_path='' as $$
declare day_value int; new_id uuid; old public.ct_rules; n int:=0; begin
 perform pg_advisory_xact_lock(871204);
 if not exists(select 1 from pg_timezone_names where name=p_data->>'timezone') then raise exception 'Invalid timezone'; end if;
 if (p_data->>'local_end')::time<=(p_data->>'local_start')::time or ((p_data->>'local_end')::time-(p_data->>'local_start')::time)<(p_data->>'duration_minutes')::int*interval '1 minute' then raise exception 'Window must fit at least one full session'; end if;
 if p_id is not null then
 select * into old from public.ct_rules where id=p_id and superseded_by is null for update;
 if not found then raise exception 'Availability changed. Refresh and try again.'; end if;
 if jsonb_array_length(p_data->'weekdays')<>1 then raise exception 'Edit one day at a time'; end if;
 update public.ct_rules set active=false where id=p_id;
 update public.ct_slots slot set cancelled=true where rule_id=p_id and starts_at>now() and not exists(select 1 from public.ct_bookings b where b.slot_id=slot.id and (b.status='confirmed' or (b.status='held' and b.hold_until>now())));
 end if;
 for day_value in select distinct value::int from jsonb_array_elements_text(p_data->'weekdays') loop
 insert into public.ct_rules(kind,weekday,local_start,local_end,timezone,duration_minutes,buffer_minutes,capacity) values(p_data->>'kind',day_value,(p_data->>'local_start')::time,(p_data->>'local_end')::time,p_data->>'timezone',(p_data->>'duration_minutes')::int,(p_data->>'buffer_minutes')::int,(p_data->>'capacity')::int) returning id into new_id;
 if p_id is not null then update public.ct_rules set superseded_by=new_id where id=p_id; end if;
 end loop;
 n:=public.ct_publish(60); return n;
end $$;
create function public.ct_one_time(p_data jsonb) returns uuid language plpgsql set search_path='' as $$
declare result uuid; begin
 perform pg_advisory_xact_lock(871204);
 if (p_data->>'starts_at')::timestamptz<=now() then raise exception 'Choose a future time'; end if;
 if exists(select 1 from public.ct_blocks where tstzrange(starts_at,ends_at,'[)') && tstzrange((p_data->>'starts_at')::timestamptz-((p_data->>'buffer_minutes')::int)*interval '1 minute',(p_data->>'ends_at')::timestamptz+((p_data->>'buffer_minutes')::int)*interval '1 minute','[)')) then raise exception 'Session conflicts with blocked time'; end if;
 insert into public.ct_slots(kind,starts_at,ends_at,buffer_minutes,capacity) values(p_data->>'kind',(p_data->>'starts_at')::timestamptz,(p_data->>'ends_at')::timestamptz,(p_data->>'buffer_minutes')::int,(p_data->>'capacity')::int) returning id into result; return result;
end $$;
create function public.ct_coach_booking(p_coach uuid,p_booking uuid,p_target uuid default null) returns void language plpgsql set search_path='' as $$
declare b public.ct_bookings; old public.ct_slots; dest public.ct_slots; begin
 perform pg_advisory_xact_lock(871204);
 if not exists(select 1 from public.ct_coaches where user_id=p_coach) then raise exception 'Coach access required'; end if;
 select * into b from public.ct_bookings where id=p_booking for update;
 if not found then raise exception 'Booking not found'; end if;
 if b.status='cancelled' and p_target is null then return; end if;
 if b.status not in ('confirmed','held') then raise exception 'Booking cannot be changed'; end if;
 select * into old from public.ct_slots where id=b.slot_id;
 if old.starts_at<now() then raise exception 'Past sessions cannot be changed'; end if;
 if p_target is null then
 update public.ct_bookings set status='cancelled',version=version+1 where id=b.id;
 if b.status='confirmed' then insert into public.ct_credits(family_id,kind,delta,source) values(b.family_id,old.kind,1,'cancellation:'||b.id) on conflict(source) do nothing; end if;
 perform public.ct_enqueue('cancelled:'||b.id,'booking_cancelled',b.family_id,jsonb_build_object('booking_id',b.id));
 else
 if b.status<>'confirmed' then raise exception 'An unpaid hold cannot be moved'; end if;
 select * into dest from public.ct_slots where id=p_target for update;
 if not found or dest.cancelled or dest.starts_at<=now() or dest.kind<>old.kind then raise exception 'Choose an available session of the same type'; end if;
 if p_target=b.slot_id then return; end if;
 if exists(select 1 from public.ct_blocks where tstzrange(starts_at,ends_at,'[)') && dest.occupied_range) then raise exception 'Session blocked'; end if;
 if (select count(*) from public.ct_bookings where slot_id=p_target and id<>b.id and (status='confirmed' or (status='held' and hold_until>now())))>=dest.capacity then raise exception 'Session full'; end if;
 if exists(select 1 from public.ct_bookings x where x.slot_id=p_target and x.athlete_id=b.athlete_id and x.id<>b.id and (x.status='confirmed' or (x.status='held' and x.hold_until>now()))) then raise exception 'Athlete already booked'; end if;
 update public.ct_bookings set slot_id=p_target,version=version+1 where id=b.id returning * into b;
 perform public.ct_enqueue('rescheduled:'||b.id||':'||b.version,'booking_rescheduled',b.family_id,jsonb_build_object('booking_id',b.id));
 perform public.ct_enqueue('reminder:'||b.id||':'||b.version,'reminder',b.family_id,jsonb_build_object('booking_id',b.id,'version',b.version),greatest(now(),dest.starts_at-interval '24 hours'));
 end if;
end $$;
create function public.ct_cancel_session(p_coach uuid,p_slot uuid) returns void language plpgsql set search_path='' as $$
declare b record; begin
 perform pg_advisory_xact_lock(871204);
 if not exists(select 1 from public.ct_coaches where user_id=p_coach) then raise exception 'Coach access required'; end if;
 for b in select id from public.ct_bookings where slot_id=p_slot and (status='confirmed' or (status='held' and hold_until>now())) loop perform public.ct_coach_booking(p_coach,b.id,null); end loop;
 insert into public.ct_blocks(starts_at,ends_at,reason) select starts_at,ends_at,'Session cancelled by coach' from public.ct_slots where id=p_slot and starts_at>now() and not cancelled;
 update public.ct_slots set cancelled=true where id=p_slot and starts_at>now();
end $$;
-- Publish changes immediately, under the same lock used by reservation writes.
create function public.ct_calendar_action(p_action text,p_data jsonb) returns void language plpgsql set search_path='' as $$
begin
 perform pg_advisory_xact_lock(871204);
 perform public.ct_admin_schedule(p_action,p_data);
 perform public.ct_publish(60);
end $$;
create function public.ct_balances(p_family uuid) returns table(kind text,available bigint,recovery int) language sql set search_path='' as $$
 select k,coalesce((select sum(c.delta) from public.ct_credits c where c.family_id=p_family and c.kind=k),0),coalesce((select r.units from public.ct_credit_recovery r where r.family_id=p_family and r.kind=k),0) from unnest(array['private','group']) k;
$$;
create function public.ct_availability(p_from timestamptz,p_until timestamptz,p_kind text) returns table(id uuid,kind text,starts_at timestamptz,ends_at timestamptz,capacity int,remaining bigint) language sql set search_path='' as $$
 select s.id,s.kind,s.starts_at,s.ends_at,s.capacity,s.capacity-(select count(*) from public.ct_bookings b where b.slot_id=s.id and (b.status='confirmed' or (b.status='held' and b.hold_until>now()))) remaining
 from public.ct_slots s where s.kind=p_kind and not s.cancelled and s.starts_at>=p_from and s.starts_at<p_until and s.starts_at>now()+(select notice_hours from public.ct_settings)*interval '1 hour' and not exists(select 1 from public.ct_blocks b where tstzrange(b.starts_at,b.ends_at,'[)') && s.occupied_range)
 and s.capacity>(select count(*) from public.ct_bookings b where b.slot_id=s.id and (b.status='confirmed' or (b.status='held' and b.hold_until>now()))) order by s.starts_at;
$$;
revoke all on function public.ct_balances(uuid),public.ct_availability(timestamptz,timestamptz,text) from public,anon,authenticated;
grant execute on function public.ct_balances(uuid),public.ct_availability(timestamptz,timestamptz,text) to service_role;
do $$ declare f record; begin for f in select p.oid::regprocedure signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname=any(array['ct_guard_credit','ct_recover_credit','ct_save_windows','ct_one_time','ct_coach_booking','ct_cancel_session','ct_calendar_action']) loop execute format('revoke all on function %s from public,anon,authenticated',f.signature);execute format('grant execute on function %s to service_role',f.signature);end loop;end $$;
commit;
