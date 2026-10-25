insert into auth.users select ('00000000-0000-4000-8000-'||lpad(i::text,12,'0'))::uuid from generate_series(1,5)i;
insert into qb_accounts values
('00000000-0000-4000-8000-000000000001','adult',true),
('00000000-0000-4000-8000-000000000002','adult',true),
('00000000-0000-4000-8000-000000000003','guardian',true),
('00000000-0000-4000-8000-000000000004','coach',true),
('00000000-0000-4000-8000-000000000005','administrator',true);
insert into qb_athletes values
('00000000-0000-4000-8000-000000000101',false,'00000000-0000-4000-8000-000000000001','tackle','college'),
('00000000-0000-4000-8000-000000000102',true,null,'flag5','8-10'),
('00000000-0000-4000-8000-000000000103',false,'00000000-0000-4000-8000-000000000002','tackle','college');
insert into qb_guardians values('00000000-0000-4000-8000-000000000102','00000000-0000-4000-8000-000000000003',now());
insert into qb_consents(athlete_id,guardian_id,policy_version,verified_evidence_ref,expires_at) values('00000000-0000-4000-8000-000000000102','00000000-0000-4000-8000-000000000003','test-v1','synthetic-evidence',now()+interval '1 day');
insert into qb_coach_assignments values('00000000-0000-4000-8000-000000000102','00000000-0000-4000-8000-000000000004');
insert into qb_film(id,athlete_id,object_key,state,retained_until) values
('00000000-0000-4000-8000-000000000201','00000000-0000-4000-8000-000000000102','synthetic/released','released',now()+interval '1 day'),
('00000000-0000-4000-8000-000000000202','00000000-0000-4000-8000-000000000102','synthetic/validated','validated',now()+interval '1 day'),
('00000000-0000-4000-8000-000000000203','00000000-0000-4000-8000-000000000102','synthetic/quarantine','quarantine',now()+interval '1 day'),
('00000000-0000-4000-8000-000000000204','00000000-0000-4000-8000-000000000102','synthetic/deleted','deleted',now()+interval '1 day');
do $$begin begin
 insert into qb_feedback(film_id,athlete_id,author_id,timestamp_ms,note) values('00000000-0000-4000-8000-000000000201','00000000-0000-4000-8000-000000000103','00000000-0000-4000-8000-000000000004',0,'Synthetic mismatched athlete');
 raise exception 'Cross-athlete feedback join unexpectedly allowed';
 exception when foreign_key_violation then null;end;end$$;
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000003',false);
do $$begin
 if (select count(*) from qb_athletes)<>1 then raise exception 'Guardian athlete isolation failed';end if;
 if (select count(*) from qb_film)<>1 then raise exception 'Guardian unreleased film leaked';end if;
 begin
 update qb_accounts set role='administrator';
 raise exception 'Client role mutation unexpectedly allowed';
 exception when insufficient_privilege then null;end;
end$$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000004',false);
do $$begin
 if (select count(*) from qb_athletes)<>1 then raise exception 'Coach assignment isolation failed';end if;
 if (select count(*) from qb_film)<>2 then raise exception 'Coach quarantine/deletion isolation failed';end if;
end$$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',false);
do $$begin
 if (select count(*) from qb_athletes)<>1 then raise exception 'Adult ownership isolation failed';end if;
 if (select count(*) from qb_film)<>0 then raise exception 'Cross-account film leaked';end if;
end$$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000005',false);
do $$begin
 if (select count(*) from qb_athletes)<>0 then raise exception 'Administrator bypassed explicit grants';end if;
end$$;
reset role;
update qb_consents set revoked_at=now();
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000003',false);
do $$begin if (select count(*) from qb_athletes)<>0 then raise exception 'Consent revocation failed';end if;end$$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000004',false);
do $$begin if (select count(*) from qb_film)<>0 then raise exception 'Coach retained access after revoked consent';end if;end$$;
reset role;
set role anon;
do $$begin begin
 perform count(*) from public.qb_athletes;
 raise exception 'Anonymous data access unexpectedly allowed';
 exception when insufficient_privilege then null;end;end$$;
reset role;
select 'Database isolation checks passed' as result;
