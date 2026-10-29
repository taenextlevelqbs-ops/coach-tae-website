-- Additive lifecycle states and transactional hold release. Never deletes appointments.
begin;
alter table public.ct_orders drop constraint ct_orders_status_check;
alter table public.ct_orders add constraint ct_orders_status_check check(status in ('pending','paid','refund_pending','refunded','cancelled','expired','failed'));
create function public.ct_close_checkout(p_event text,p_order uuid,p_session text,p_status text) returns boolean language plpgsql set search_path='' as $$
declare o public.ct_orders;
begin
 perform pg_advisory_xact_lock(871204);
 if p_status is null or p_status not in ('cancelled','expired','failed') or coalesce(p_event,'')='' then raise exception 'Invalid closure'; end if;
 if exists(select 1 from public.ct_events where event_id=p_event) then return false; end if;
 select * into o from public.ct_orders where id=p_order for update;
 if not found or o.session_id is distinct from p_session or p_session is null then raise exception 'Checkout order mismatch'; end if;
 insert into public.ct_events(event_id,event_type) values(p_event,'checkout.'||p_status);
 if o.status<>'pending' then return false; end if;
 update public.ct_orders set status=p_status where id=o.id;
 update public.ct_bookings set status=case when p_status='expired' then 'expired' else 'cancelled' end,hold_until=null,version=version+1 where id=o.booking_id and status='held' and not paid;
 return true;
end $$;
revoke all on function public.ct_close_checkout(text,uuid,text,text) from public,anon,authenticated;
grant execute on function public.ct_close_checkout(text,uuid,text,text) to service_role;
create or replace function public.ct_fulfill(p_event text,p_order uuid,p_session text,p_intent text,p_amount int,p_currency text) returns void language plpgsql set search_path='' as $$
declare o public.ct_orders; b public.ct_bookings; s public.ct_slots; k text; units int; n int; begin
 perform pg_advisory_xact_lock(871204);
 if exists(select 1 from public.ct_events where event_id=p_event) then return; end if;
 select * into o from public.ct_orders where id=p_order for update;
 if not found or o.session_id is distinct from p_session then raise exception 'Checkout order mismatch'; end if;
 insert into public.ct_events(event_id,event_type) values(p_event,'checkout.paid');
 if o.status in ('cancelled','expired','failed') and o.product_key not like 'lab_%' then
 update public.ct_orders set status='refund_pending',payment_intent_id=p_intent,amount=p_amount,currency=p_currency where id=o.id;
 perform public.ct_enqueue('refund:'||o.id,'refund',o.family_id,jsonb_build_object('order_id',o.id));
 perform public.ct_enqueue('payment:'||o.id,'payment_received',o.family_id,jsonb_build_object('order_id',o.id));
 return;
 elsif o.status not in ('pending','cancelled','expired','failed') then return; end if;
 update public.ct_orders set status='paid',payment_intent_id=p_intent,amount=p_amount,currency=p_currency where id=o.id;
 if o.product_key in ('group','private','group_pack','private_pack') then
 k:=case when o.product_key like 'private%' then 'private' else 'group' end;
 units:=case when o.product_key like '%pack' then 3 else 1 end;
 if o.booking_id is null then
 insert into public.ct_credits(family_id,kind,delta,source) values(o.family_id,k,units,'order:'||o.id) on conflict(source) do nothing;
 else
 select * into b from public.ct_bookings where id=o.booking_id for update;
 select * into s from public.ct_slots where id=b.slot_id for update;
 select count(*) into n from public.ct_bookings where slot_id=s.id and id<>b.id and (status='confirmed' or (status='held' and hold_until>now()));
 if b.status in ('held','expired') and s.starts_at>now() and not s.cancelled and n<s.capacity and not exists(select 1 from public.ct_bookings x where x.id<>b.id and x.athlete_id=b.athlete_id and x.slot_id=b.slot_id and (x.status='confirmed' or (x.status='held' and x.hold_until>now()))) and not exists(select 1 from public.ct_blocks x where tstzrange(x.starts_at,x.ends_at,'[)') && tstzrange(s.starts_at-s.buffer_minutes*interval '1 minute',s.ends_at+s.buffer_minutes*interval '1 minute','[)')) then
 update public.ct_bookings set status='confirmed',paid=true,hold_until=null where id=b.id;
 perform public.ct_enqueue('confirmed:'||b.id,'booking_confirmed',o.family_id,jsonb_build_object('booking_id',b.id));
 perform public.ct_enqueue('reminder:'||b.id||':1','reminder',o.family_id,jsonb_build_object('booking_id',b.id,'version',1),greatest(now(),s.starts_at-interval '24 hours'));
 else
 update public.ct_orders set status='refund_pending' where id=o.id;
 update public.ct_bookings set status='expired' where id=b.id and status='held';
 perform public.ct_enqueue('refund:'||o.id,'refund',o.family_id,jsonb_build_object('order_id',o.id));
 end if;
 end if; end if;
 perform public.ct_enqueue('payment:'||o.id,'payment_received',o.family_id,jsonb_build_object('order_id',o.id));
end $$;
commit;
