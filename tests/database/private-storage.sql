update qb_consents set revoked_at=null,expires_at=now()+interval '1 day';
update qb_mvp_controls set synthetic_media_enabled=true;
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000003',false);
select set_config('request.jwt.claim.aal','aal1',false);
select set_config('test.private_film',qb_begin_film('00000000-0000-4000-8000-000000000102','00000000-0000-4000-8000-000000000004',1000)::text,false);
insert into storage.objects(bucket_id,name) values('qb-lab-quarantine',current_setting('test.private_film')::jsonb->>'object_key');
do $$begin
 if exists(select 1 from storage.objects) then raise exception 'Raw quarantine object exposed';end if;
 begin
 insert into storage.objects(bucket_id,name) values('qb-lab-processed','forged/processed.mp4');
 raise exception 'Client wrote a processed clip';exception when insufficient_privilege then null;end;
 begin
 update storage.objects set name='rewrite';raise exception 'Raw clip overwrite allowed';exception when insufficient_privilege then null;end;
 begin
 perform qb_claim_next_film();raise exception 'Client claimed processor job';exception when insufficient_privilege then null;end;
end$$;
reset role;
select set_config('test.first_claim',qb_claim_next_film()::text,false);
do $$begin if qb_claim_next_film() is not null then raise exception 'Processing lease claimed twice';end if;end$$;
-- Expired lease is reclaimable, but the stale worker cannot release its output.
update qb_film set processing_lease_until=now()-interval '1 second' where id=(current_setting('test.private_film')::jsonb->>'id')::uuid;
select set_config('test.second_claim',qb_claim_next_film()::text,false);
do $$declare f jsonb:=current_setting('test.first_claim')::jsonb;begin
 begin
 perform qb_release_processed_film((f->>'id')::uuid,gen_random_uuid(),800,1,(f->>'id')||'/processed.mp4',(f->>'claim')::uuid);
 raise exception 'Stale processing lease released';exception when insufficient_privilege then null;end;
end$$;
select qb_release_processed_film((current_setting('test.second_claim')::jsonb->>'id')::uuid,gen_random_uuid(),800,1,(current_setting('test.second_claim')::jsonb->>'id')||'/processed.mp4',(current_setting('test.second_claim')::jsonb->>'claim')::uuid);
insert into storage.objects(bucket_id,name) values('qb-lab-processed',(current_setting('test.private_film')::jsonb->>'id')||'/processed.mp4');
set role authenticated;
do $$begin
 if (select count(*) from storage.objects)<>1 then raise exception 'Authorized private derivative missing';end if;
end$$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',false);
do $$begin if exists(select 1 from storage.objects) then raise exception 'Unrelated family listed private film';end if;end$$;
reset role;
update qb_mvp_controls set synthetic_media_enabled=false;
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000003',false);
do $$begin if exists(select 1 from storage.objects) then raise exception 'Media kill switch did not stop direct storage read';end if;end$$;
reset role;
update qb_mvp_controls set synthetic_media_enabled=true;
set role authenticated;
select qb_withdraw_consent('00000000-0000-4000-8000-000000000102','media');
do $$begin
 if exists(select 1 from storage.objects) then raise exception 'Consent withdrawal left object readable';end if;
 if (qb_film_upload_options('00000000-0000-4000-8000-000000000102')->>'allowed')::boolean then raise exception 'Withdrawal still accepts new media';end if;
end$$;
reset role;
do $$begin
 if not exists(select 1 from qb_film_deletion_jobs where film_id=(current_setting('test.private_film')::jsonb->>'id')::uuid) then raise exception 'Withdrawal did not queue physical deletion';end if;
 if exists(select 1 from storage.buckets where public or file_size_limit<>4194304) then raise exception 'Bucket privacy/size configuration invalid';end if;
end$$;
select 'Private storage isolation, lease ownership, kill switch and withdrawal passed' as result;
-- A rejected clip is never playable, but its owner can see that validation failed.
update qb_consents set revoked_at=null,expires_at=now()+interval '1 day';
set role authenticated;
select set_config('test.rejected_film',qb_begin_film('00000000-0000-4000-8000-000000000102','00000000-0000-4000-8000-000000000004',1000)->>'id',false);
reset role;
select qb_reject_film(current_setting('test.rejected_film')::uuid);
set role authenticated;
do $$begin
 if not exists(select 1 from qb_film where id=current_setting('test.rejected_film')::uuid and state='rejected') then raise exception 'Rejection status hidden from owner';end if;
 if qb_private.film_allowed(current_setting('test.rejected_film')::uuid) then raise exception 'Rejected clip became playable';end if;
end$$;
reset role;
-- A valid but email-unconfirmed identity cannot bypass the application guard via direct database RPCs.
update auth.users set email_confirmed_at=null where id='00000000-0000-4000-8000-000000000001';
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',false);
do $$begin
 if qb_private.allowed('00000000-0000-4000-8000-000000000101') then raise exception 'Unconfirmed email accessed athlete directly';end if;
 begin
 perform qb_record_training('00000000-0000-4000-8000-000000000101',gen_random_uuid(),'workout:reset-your-feet',true);
 raise exception 'Unconfirmed email wrote training directly';exception when insufficient_privilege then null;end;
end$$;
reset role;
update auth.users set email_confirmed_at=now() where id='00000000-0000-4000-8000-000000000001';
-- Confirmation is restricted to the physical-deletion worker; requested metadata/feedback is then purged.
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000003',false);
do $$begin
 begin perform qb_confirm_film_deletion((current_setting('test.private_film')::jsonb->>'id')::uuid);
 raise exception 'Client forged physical deletion';exception when insufficient_privilege then null;end;
end$$;
reset role;
select qb_confirm_film_deletion((current_setting('test.private_film')::jsonb->>'id')::uuid);
do $$begin
 if exists(select 1 from qb_film where id=(current_setting('test.private_film')::jsonb->>'id')::uuid) or exists(select 1 from qb_feedback where film_id=(current_setting('test.private_film')::jsonb->>'id')::uuid) then raise exception 'Requested film metadata/feedback retained after purge confirmation';end if;
end$$;
-- Future assignments and their notices must not pretend the quiz is available early.
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000007',false);
select set_config('test.ready_notices',(select count(*)::text from qb_messages where body='Your weekly Football IQ quiz is ready.'),false);
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000004',false);
select set_config('request.jwt.claim.aal','aal2',false);
select qb_publish_weekly(array['00000000-0000-4000-8000-000000000102']::uuid[],(select array_agg(id order by draft_key) from qb_question_bank where pathway='flag'),(date_trunc('week',now() at time zone 'UTC')+interval '1 week')::date,'Next week synthetic flag quiz');
reset role;
select set_config('test.future_assignment',(select id::text from qb_weekly_assignments where athlete_id='00000000-0000-4000-8000-000000000102' and week>date_trunc('week',now() at time zone 'UTC')::date),false);
select set_config('test.snapshot_correct',(select questions->0->>'correct' from qb_weekly_quizzes where pathway='flag' and week=date_trunc('week',now() at time zone 'UTC')::date),false);
update qb_question_bank set correct=(correct+1)%4 where id=(select (questions->0->>'id')::uuid from qb_weekly_quizzes where pathway='flag' and week=date_trunc('week',now() at time zone 'UTC')::date);
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000007',false);
select set_config('request.jwt.claim.aal','aal1',false);
do $$declare inbox jsonb:=qb_weekly_inbox('00000000-0000-4000-8000-000000000102');begin
 if jsonb_array_length(inbox)<>1 then raise exception 'Future weekly quiz visible early';end if;
 if (select count(*) from qb_messages where body='Your weekly Football IQ quiz is ready.')<>current_setting('test.ready_notices')::integer then raise exception 'Future notice claimed quiz ready';end if;
 if inbox->0->'questions'->0->>'correct' is distinct from current_setting('test.snapshot_correct') then raise exception 'Bank edit changed completed quiz snapshot';end if;
 begin
 perform qb_submit_weekly(current_setting('test.future_assignment')::uuid,'[0,0,0,0,0,0,0,0,0,0]'::jsonb);
 raise exception 'Future weekly quiz submitted early';exception when insufficient_privilege then null;end;
end$$;
reset role;
select 'Future scheduling, immutable answer snapshots and final six-capability boundaries passed' as result;
