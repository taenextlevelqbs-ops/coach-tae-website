begin;
alter table public.ct_orders add column refunded_amount int not null default 0 check(refunded_amount>=0),add column revoked_units int not null default 0 check(revoked_units between 0 and 3);
-- Preserve previously recorded full refunds while upgrading the reconciliation model.
update public.ct_orders set refunded_amount=coalesce(amount,0),revoked_units=case when product_key like '%pack' then 3 when product_key in ('private','group') then 1 else 0 end where status='refunded';
create function public.ct_reconcile_refund(p_event text,p_intent text,p_refunded int) returns void language plpgsql set search_path='' as $$
declare o public.ct_orders; k text; total_units int; target_units int:=0; remove_units int:=0; available int; take int; begin
 perform pg_advisory_xact_lock(871204);
 if exists(select 1 from public.ct_events where event_id=p_event) then return; end if;
 select * into o from public.ct_orders where payment_intent_id=p_intent for update;
 if not found or o.amount is null then raise exception 'Payment not yet fulfilled'; end if;
 if p_refunded<0 or p_refunded>o.amount then raise exception 'Refund amount does not match payment'; end if;
 insert into public.ct_events(event_id,event_type) values(p_event,'payment.refund_reconciled');
 if p_refunded<=o.refunded_amount then return; end if;
 if o.product_key in ('group','private','group_pack','private_pack') and o.status='paid' then
 k:=case when o.product_key like 'private%' then 'private' else 'group' end;
 total_units:=case when o.product_key like '%pack' then 3 else 1 end;
 target_units:=least(total_units,floor(p_refunded::numeric/(o.amount::numeric/total_units))::int);
 remove_units:=greatest(0,target_units-o.revoked_units);
 if remove_units>0 then
 if o.booking_id is null or exists(select 1 from public.ct_bookings where id=o.booking_id and status='cancelled') then
 select coalesce(sum(delta),0) into available from public.ct_credits where family_id=o.family_id and kind=k;
 take:=least(remove_units,available);
 if take>0 then insert into public.ct_credits(family_id,kind,delta,source) values(o.family_id,k,-take,'refund-units:'||o.id||':'||target_units); end if;
 if take<remove_units then insert into public.ct_credit_recovery(family_id,kind,units) values(o.family_id,k,remove_units-take) on conflict(family_id,kind) do update set units=public.ct_credit_recovery.units+excluded.units; end if;
 elsif target_units=total_units then
 update public.ct_bookings set status='cancelled',version=version+1 where id=o.booking_id and status='confirmed';
 perform public.ct_enqueue('refunded-booking:'||o.id,'booking_cancelled',o.family_id,jsonb_build_object('booking_id',o.booking_id));
 end if;
 end if; end if;
 update public.ct_orders set refunded_amount=p_refunded,revoked_units=greatest(revoked_units,target_units),status=case when p_refunded=amount then 'refunded' else status end where id=o.id;
 perform public.ct_enqueue('refund-update:'||o.id||':'||p_refunded,'payment_refunded',o.family_id,jsonb_build_object('order_id',o.id));
end $$;
create or replace function public.ct_apply_refund(p_event text,p_intent text) returns void language plpgsql set search_path='' as $$
declare amount int; begin
 select o.amount into amount from public.ct_orders o where o.payment_intent_id=p_intent;
 if amount is null then raise exception 'Payment not yet fulfilled'; end if;
 perform public.ct_reconcile_refund(p_event,p_intent,amount);
end $$;
revoke all on function public.ct_reconcile_refund(text,text,int) from public,anon,authenticated;
grant execute on function public.ct_reconcile_refund(text,text,int) to service_role;
create function public.ct_immutable_credit() returns trigger language plpgsql set search_path='' as $$
begin raise exception 'Credit ledger entries are immutable. Use an audited adjustment.'; end $$;
create trigger ct_immutable_credit before update or delete on public.ct_credits for each row execute function public.ct_immutable_credit();
revoke all on function public.ct_immutable_credit() from public,anon,authenticated;
grant execute on function public.ct_immutable_credit() to service_role;
commit;
