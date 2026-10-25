-- Real PostgreSQL RLS tests with synthetic identities, not mocked query results.
update qb_consents set revoked_at=null where purpose='training';
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000004',false);
select set_config('request.jwt.claim.aal','aal1',false);
do $$begin
 if exists(select 1 from qb_athletes) then raise exception 'Coach without MFA read athletes';end if;
 begin
 perform qb_send_message(array['00000000-0000-4000-8000-000000000102']::uuid[],'Blocked',now());
 raise exception 'Coach without MFA sent message';exception when insufficient_privilege then null;end;
end$$;
select set_config('request.jwt.claim.aal','aal2',false);
select qb_send_message(array['00000000-0000-4000-8000-000000000102']::uuid[],'Practice footwork',now(),'reset-your-feet');
select qb_send_message(array['00000000-0000-4000-8000-000000000102']::uuid[],'Tomorrow reminder',now()+interval '1 day');
select qb_schedule_session('00000000-0000-4000-8000-000000000102','Synthetic practice','Example field',now()+interval '2 days',now()+interval '2 days 1 hour');
do $$begin
 if (select count(*) from qb_messages)<>3 then raise exception 'Sent history incomplete';end if;
 begin
 perform qb_send_message(array['00000000-0000-4000-8000-000000000102','00000000-0000-4000-8000-000000000103']::uuid[],'Cross family',now());
 raise exception 'Unauthorized fanout accepted';exception when insufficient_privilege then null;end;
 if (select count(*) from qb_messages)<>3 then raise exception 'Failed fanout partially delivered';end if;
 begin
 insert into qb_messages(athlete_id,author_id,body,publish_at) values('00000000-0000-4000-8000-000000000102',auth.uid(),'Bypass',now());
 raise exception 'Raw message insert allowed';exception when insufficient_privilege then null;end;
end$$;
select qb_schedule_session('00000000-0000-4000-8000-000000000102','Synthetic practice','Example field',starts_at,ends_at,id,revision,true) from qb_training_sessions;
do $$begin
 if not exists(select 1 from qb_training_sessions where status='cancelled' and revision=2) then raise exception 'Cancellation not saved';end if;
 begin
 perform qb_schedule_session('00000000-0000-4000-8000-000000000102','Stale edit','Example field',starts_at,ends_at,id,1,false) from qb_training_sessions;
 raise exception 'Stale edit accepted';exception when insufficient_privilege then null;end;
end$$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000003',false);
select set_config('request.jwt.claim.aal','aal1',false);
do $$declare message_id uuid;begin
 if (select count(*) from qb_messages)<>3 then raise exception 'Guardian cannot see notices or sees future announcement';end if;
 select id into message_id from qb_messages where body='Practice footwork';
 perform qb_mark_message_read(message_id);
 perform qb_mark_message_read(message_id);
 if not (select read_by_me from qb_message_status(message_id)) then raise exception 'Receipt not persisted';end if;
 if (select read_count from qb_message_status(message_id)) is not null then raise exception 'Guardian saw other recipients';end if;
 begin
 perform qb_send_message(array['00000000-0000-4000-8000-000000000102']::uuid[],'Impersonation',now());
 raise exception 'Guardian sent as coach';exception when insufficient_privilege then null;end;
 begin
 perform * from qb_message_reads;
 raise exception 'Recipient identity table exposed';exception when insufficient_privilege then null;end;
end$$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',false);
do $$begin
 if exists(select 1 from qb_messages) or exists(select 1 from qb_training_sessions) then raise exception 'Other family data leaked';end if;
end$$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000004',false);
select set_config('request.jwt.claim.aal','aal2',false);
do $$begin
 if (select read_count from qb_message_status((select id from qb_messages where body='Practice footwork')))<>1 then raise exception 'Coach receipt count wrong';end if;
end$$;
reset role;
do $$begin
 if (select count(*) from qb_audit where action='message.created')<>4 then raise exception 'Message audit missing';end if;
 if (select count(*) from qb_audit where action='schedule.changed')<>2 then raise exception 'Schedule audit missing';end if;
end$$;
update qb_consents set revoked_at=now();
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000003',false);
do $$begin
 if exists(select 1 from qb_messages) or exists(select 1 from qb_training_sessions) then raise exception 'Revoked consent did not remove access';end if;
end$$;
reset role;
select 'Communications, schedules, receipts, atomic fanout, consent and MFA isolation passed' as result;
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000005',false);
select set_config('request.jwt.claim.aal','aal2',false);
do $$begin
 if exists(select 1 from qb_messages) or exists(select 1 from qb_training_sessions) then raise exception 'Administrator bypassed explicit athlete grants';end if;
 begin
 insert into qb_audit(actor_id,action) values(auth.uid(),'password.changed');
 raise exception 'Caller forged audit records';exception when insufficient_privilege then null;end;
end$$;
reset role;
