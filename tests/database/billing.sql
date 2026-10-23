set role authenticated;
do $$begin begin
 perform public.qb_enqueue_subscription_event('evt_forged','invoice.paid','in_forged');
 raise exception 'Browser forged verified payment event';
 exception when insufficient_privilege then null;end;
 begin
 perform count(*) from public.qb_subscription_inbox;
 raise exception 'Browser read billing inbox';
 exception when insufficient_privilege then null;end;
end$$;
reset role;
set role service_role;
do $$begin
 if not public.qb_enqueue_subscription_event('evt_synthetic','invoice.paid','in_synthetic') then raise exception 'Initial event not recorded';end if;
 if public.qb_enqueue_subscription_event('evt_synthetic','invoice.paid','in_synthetic') then raise exception 'Duplicate event processed twice';end if;
end$$;
reset role;
do $$begin
 if (select count(*) from qb_subscription_inbox)<>1 then raise exception 'Event inbox dedup failed';end if;
 if exists(select 1 from qb_entitlements) then raise exception 'Enqueue incorrectly granted entitlement';end if;
end$$;
select 'Billing inbox isolation and idempotence passed' as result;
