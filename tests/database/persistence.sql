-- Prior isolation fixture ended with revoked consent. Re-enable only this synthetic fixture.
update qb_consents set revoked_at=null;
update qb_film set coach_id='00000000-0000-4000-8000-000000000004';
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000004',false);
do $$begin if exists(select 1 from qb_film) then raise exception 'Training consent incorrectly grants media access';end if;end$$;
reset role;
-- Only the privileged synthetic fixture can add this evidence; no application consent write exists.
insert into qb_consents(athlete_id,guardian_id,policy_version,verified_evidence_ref,expires_at,purpose)
select athlete_id,guardian_id,policy_version,'synthetic-media-evidence',expires_at,'media' from qb_consents where purpose='training';
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',false);
insert into qb_learning_events(id,athlete_id,recorded_by,kind,content_key,duration_seconds) values
('00000000-0000-4000-8000-000000000301','00000000-0000-4000-8000-000000000101','00000000-0000-4000-8000-000000000001','lesson','cover2-v1',60);
do $$begin
 if (select count(*) from qb_learning_events)<>1 then raise exception 'Own progress not visible';end if;
 begin
 insert into qb_learning_events(id,athlete_id,recorded_by,kind,content_key,duration_seconds) values
 ('00000000-0000-4000-8000-000000000302','00000000-0000-4000-8000-000000000103','00000000-0000-4000-8000-000000000001','simulation','rep',1);
 raise exception 'Cross-account progress write allowed';
 exception when insufficient_privilege then null;end;
 begin
 update qb_learning_events set duration_seconds=999;
 raise exception 'History rewrite allowed';
 exception when insufficient_privilege then null;end;
end$$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000004',false);
insert into qb_tasks(athlete_id,assigned_by,content_version,title) values
('00000000-0000-4000-8000-000000000102','00000000-0000-4000-8000-000000000004','cover2-v1','Read the safeties');
do $$begin
 if (select count(*) from qb_film)<>2 then raise exception 'Paired coach cannot review';end if;
 begin
 insert into qb_learning_events(id,athlete_id,recorded_by,kind,content_key,duration_seconds) values
 ('00000000-0000-4000-8000-000000000303','00000000-0000-4000-8000-000000000102','00000000-0000-4000-8000-000000000004','lesson','fake',1);
 raise exception 'Coach fabricated athlete completion';
 exception when insufficient_privilege then null;end;
end$$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000003',false);
select qb_complete_task((select id from qb_tasks limit 1),'00000000-0000-4000-8000-000000000102');
do $$begin
 if not exists(select 1 from qb_tasks where completed_at is not null) then raise exception 'Guardian completion not persisted';end if;
 if exists(select 1 from qb_film) then raise exception 'Guardian playback access leaked';end if;
end$$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',false);
do $$begin
 if exists(select 1 from qb_learning_events) then raise exception 'Other athlete history leaked';end if;
 begin
 perform qb_complete_task('00000000-0000-4000-8000-000000000999','00000000-0000-4000-8000-000000000101');
 raise exception 'Other account completed assignment';
 exception when insufficient_privilege then null;end;
end$$;
reset role;
update qb_consents set revoked_at=now();
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000003',false);
do $$begin
 if exists(select 1 from qb_tasks) then raise exception 'Revoked consent exposes tasks';end if;
end$$;
reset role;
select 'Persistent progress and exact-pair isolation passed' as result;
-- A second assigned coach still cannot read a film paired to the first coach.
insert into auth.users values('00000000-0000-4000-8000-000000000006');
insert into qb_accounts values('00000000-0000-4000-8000-000000000006','coach',true);
insert into qb_coach_assignments values('00000000-0000-4000-8000-000000000102','00000000-0000-4000-8000-000000000006');
update qb_consents set revoked_at=null;
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000006',false);
do $$begin
 if (select count(*) from qb_athletes)<>1 then raise exception 'Second coach fixture not assigned';end if;
 if exists(select 1 from qb_film) then raise exception 'Unpaired coach accessed film';end if;
end$$;
reset role;
update qb_consents set revoked_at=now();
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000003',false);
do $$begin begin
 insert into qb_learning_events(id,athlete_id,recorded_by,kind,content_key,duration_seconds) values
 ('00000000-0000-4000-8000-000000000304','00000000-0000-4000-8000-000000000102','00000000-0000-4000-8000-000000000003','lesson','revoked',1);
 raise exception 'Revoked consent permitted progress writes';
 exception when insufficient_privilege then null;end;end$$;
reset role;
update qb_consents set revoked_at=null where purpose='training';
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000004',false);
do $$begin
 if (select count(*) from qb_athletes)<>1 then raise exception 'Training consent should still permit assigned coaching';end if;
 if exists(select 1 from qb_film) then raise exception 'Revoked media consent leaked film despite valid training consent';end if;
end$$;
reset role;
select 'Purpose-specific consent checks passed' as result;
