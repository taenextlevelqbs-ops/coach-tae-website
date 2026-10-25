-- Synthetic identities and real PostgreSQL RLS/RPCs. Not hosted Auth or consent certification.
update qb_consents set revoked_at=null,expires_at=now()+interval '1 day';
update qb_athletes set display_name='Jordan synthetic',age_group='under13',ruleset='nfl-flag5-guide-review-required' where id='00000000-0000-4000-8000-000000000102';
update qb_athletes set display_name='Alex synthetic',age_group='18plus',ruleset='tackle-fundamentals-review-required' where id='00000000-0000-4000-8000-000000000101';
insert into qb_coach_assignments values('00000000-0000-4000-8000-000000000101','00000000-0000-4000-8000-000000000004');
insert into auth.users values('00000000-0000-4000-8000-000000000007');
insert into qb_accounts values('00000000-0000-4000-8000-000000000007','athlete',false);
insert into qb_athlete_logins values('00000000-0000-4000-8000-000000000007','00000000-0000-4000-8000-000000000102');
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000007',false);
select set_config('request.jwt.claim.aal','aal1',false);
do $$begin
 if not qb_identity_ready() then raise exception 'Consent-authorized athlete login failed';end if;
 if (select count(*) from qb_athletes)<>1 then raise exception 'Athlete login crossed profile boundary';end if;
 if exists(select 1 from qb_question_bank) then raise exception 'Athlete read answer bank';end if;
 begin
 perform * from qb_weekly_quizzes;
 raise exception 'Athlete read private snapshot';exception when insufficient_privilege then null;end;
end$$;
select qb_record_training('00000000-0000-4000-8000-000000000102','00000000-0000-4000-8000-000000000801','workout:reset-your-feet',false);
select qb_record_training('00000000-0000-4000-8000-000000000102','00000000-0000-4000-8000-000000000801','workout:reset-your-feet',true);
select qb_record_training('00000000-0000-4000-8000-000000000102','00000000-0000-4000-8000-000000000801','workout:reset-your-feet',true);
select qb_record_training('00000000-0000-4000-8000-000000000102','00000000-0000-4000-8000-000000000802','recovery:gentle-shoulder-mobility',true);
do $$begin
 if (select count(*) from qb_training_records where completed_at is not null)<>2 then raise exception 'Start/completion/retry persistence failed';end if;
 begin
 perform qb_record_training('00000000-0000-4000-8000-000000000103',gen_random_uuid(),'workout:reset-your-feet',true);
 raise exception 'Cross-athlete completion allowed';exception when insufficient_privilege then null;end;
end$$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000004',false);
select set_config('request.jwt.claim.aal','aal2',false);
do $$begin
 begin
 perform qb_publish_weekly(array['00000000-0000-4000-8000-000000000102']::uuid[],(select array_agg(id order by draft_key) from qb_question_bank where pathway='flag'),date_trunc('week',now() at time zone 'UTC')::date,'Draft cannot publish');
 raise exception 'Unreviewed questions published';exception when invalid_parameter_value then null;end;
end$$;
reset role;
update qb_question_bank set reviewed_by='00000000-0000-4000-8000-000000000004',reviewed_at=now(),review_note='Synthetic fixture review only, not real coaching approval';
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000004',false);
select set_config('request.jwt.claim.aal','aal2',false);
select qb_publish_weekly(array['00000000-0000-4000-8000-000000000102']::uuid[],(select array_agg(id order by draft_key) from qb_question_bank where pathway='flag'),date_trunc('week',now() at time zone 'UTC')::date,'Flag Football IQ');
select qb_publish_weekly(array['00000000-0000-4000-8000-000000000101']::uuid[],(select array_agg(id order by draft_key) from qb_question_bank where pathway='tackle'),date_trunc('week',now() at time zone 'UTC')::date,'Tackle Football IQ');
do $$begin
 begin
 perform qb_publish_weekly(array['00000000-0000-4000-8000-000000000102']::uuid[],(select array_agg(id order by draft_key) from qb_question_bank where pathway='tackle'),(date_trunc('week',now() at time zone 'UTC')+interval '1 week')::date,'Wrong pathway');
 raise exception 'Wrong quiz pathway accepted';exception when invalid_parameter_value then null;end;
 begin
 perform qb_publish_weekly(array['00000000-0000-4000-8000-000000000102']::uuid[],(select array_agg(id order by draft_key) from qb_question_bank where pathway='flag'),date_trunc('week',now() at time zone 'UTC')::date,'Duplicate week');
 raise exception 'Duplicate weekly assignment accepted';exception when unique_violation then null;end;
end$$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000007',false);
select set_config('request.jwt.claim.aal','aal1',false);
do $$declare inbox jsonb; assignment uuid; result integer;begin
 inbox:=qb_weekly_inbox('00000000-0000-4000-8000-000000000102');
 if jsonb_array_length(inbox)<>1 or jsonb_array_length(inbox->0->'questions')<>10 then raise exception 'Weekly ten-question assignment missing';end if;
 if (inbox->0->'questions'->0)?'correct' or (inbox->0->'questions'->0)?'explanation' then raise exception 'Answer key leaked before submission';end if;
 assignment:=(inbox->0->>'assignment')::uuid;
 result:=qb_submit_weekly(assignment,'[0,0,0,0,0,0,0,0,0,0]'::jsonb);
 if result<>3 then raise exception 'Server scoring wrong';end if;
 if qb_submit_weekly(assignment,'[1,1,1,1,1,1,1,1,1,1]'::jsonb)<>3 then raise exception 'Retake changed credited score';end if;
 inbox:=qb_weekly_inbox('00000000-0000-4000-8000-000000000102');
 if (inbox->0->>'score')::integer<>3 or not ((inbox->0->'questions'->0)?'correct') then raise exception 'Review unavailable after submission';end if;
end$$;
-- A second guardian session sees the same durable work/results without browser state.
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000003',false);
do $$begin
 if (select count(*) from qb_training_records where completed_at is not null)<>2 then raise exception 'Guardian cross-session history missing';end if;
 if (select score from qb_quiz_results limit 1)<>3 then raise exception 'Guardian score missing';end if;
end$$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',false);
do $$begin
 if exists(select 1 from qb_training_records) or exists(select 1 from qb_quiz_results) then raise exception 'Unrelated account read MVP records';end if;
 if qb_weekly_inbox('00000000-0000-4000-8000-000000000102')<>'[]'::jsonb then raise exception 'Unrelated weekly inbox leak';end if;
end$$;
reset role;
insert into qb_guardian_tickets(id,guardian_id,reviewed_by,evidence_ref,policy_version,expires_at) values('00000000-0000-4000-8000-000000000901','00000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000004','SYNTHETIC-external-verification','synthetic-policy',now()+interval '1 day');
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000003',false);
do $$begin
 begin
 perform qb_register_managed_athlete('00000000-0000-4000-8000-000000000901','Synthetic newcomer','flag5','under13');
 raise exception 'Disabled minor registration accepted';exception when insufficient_privilege then null;end;
end$$;
reset role;
update qb_mvp_controls set minor_onboarding_enabled=true;
set role authenticated;
select qb_register_managed_athlete('00000000-0000-4000-8000-000000000901','Synthetic newcomer','flag5','under13');
do $$begin
 begin
 perform qb_register_managed_athlete('00000000-0000-4000-8000-000000000901','Duplicate child','flag5','under13');
 raise exception 'Consent ticket reused';exception when insufficient_privilege then null;end;
end$$;
reset role;
-- Media starts disabled. Consent and control must both pass, including direct RPCs.
update qb_consents set revoked_at=now() where purpose='media';
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000003',false);
do $$begin
 begin
 perform qb_begin_film('00000000-0000-4000-8000-000000000102','00000000-0000-4000-8000-000000000004',1024);
 raise exception 'Disabled media accepted';exception when insufficient_privilege then null;end;
end$$;
reset role;
update qb_mvp_controls set synthetic_media_enabled=true;
set role authenticated;
do $$begin
 if (qb_film_upload_options('00000000-0000-4000-8000-000000000102')->>'allowed')::boolean then raise exception 'Training consent implied media consent';end if;
end$$;
reset role;
update qb_consents set revoked_at=null where purpose='media';
set role authenticated;
select set_config('test.film',qb_begin_film('00000000-0000-4000-8000-000000000102','00000000-0000-4000-8000-000000000004',1024)->>'id',false);
do $$begin
 if qb_private.film_allowed(current_setting('test.film')::uuid) then raise exception 'Quarantine film playable';end if;
 begin
 perform qb_release_processed_film(current_setting('test.film')::uuid,gen_random_uuid(),900,5,current_setting('test.film')||'/processed.mp4');
 raise exception 'Guardian impersonated processor';exception when insufficient_privilege then null;end;
end$$;
reset role;
select qb_release_processed_film(current_setting('test.film')::uuid,gen_random_uuid(),900,5,current_setting('test.film')||'/processed.mp4');
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000004',false);
select set_config('request.jwt.claim.aal','aal2',false);
select qb_write_film_feedback(current_setting('test.film')::uuid,'Synthetic coaching feedback: reset your base.');
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000003',false);
select set_config('request.jwt.claim.aal','aal1',false);
do $$begin
 if not qb_private.film_allowed(current_setting('test.film')::uuid) then raise exception 'Authorized guardian playback denied';end if;
 if not exists(select 1 from qb_messages where body like 'Coach Tae added feedback%') then raise exception 'Feedback notification missing';end if;
 if not exists(select 1 from qb_feedback where film_id=current_setting('test.film')::uuid and released_at is not null) then raise exception 'Written feedback hidden';end if;
end$$;
reset role;
update qb_consents set revoked_at=now() where purpose='media';
set role authenticated;
do $$begin
 if qb_private.film_allowed(current_setting('test.film')::uuid) then raise exception 'Revoked media still playable';end if;
end$$;
select qb_delete_film(current_setting('test.film')::uuid);
reset role;
do $$begin
 if not exists(select 1 from qb_film_deletion_jobs where film_id=current_setting('test.film')::uuid) then raise exception 'Physical deletion not queued';end if;
 if not exists(select 1 from qb_film where id=current_setting('test.film')::uuid and state='deleted') then raise exception 'Deleted film remains accessible';end if;
end$$;
update qb_consents set revoked_at=now() where purpose='training';
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000007',false);
do $$begin
 if qb_identity_ready() then raise exception 'Athlete identity survived consent revocation';end if;
 if exists(select 1 from qb_training_records) or exists(select 1 from qb_quiz_results) then raise exception 'Revocation did not remove record access';end if;
end$$;
reset role;
select 'Six-capability MVP: guardian, athlete, training, quiz, messages, film and isolation passed' as result;
