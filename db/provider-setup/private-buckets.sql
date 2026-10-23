-- DO NOT APPLY before owner approval of a dedicated synthetic staging project and provider agreements.
-- Separate provider setup (not part of local migrations); no upload/SELECT policies are granted.
-- Public storage flags must be checked in the provider dashboard after application.
begin;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values
 ('qb-lab-quarantine','qb-lab-quarantine',false,104857600,array['video/mp4','video/quicktime']),
 ('qb-lab-processed','qb-lab-processed',false,104857600,array['video/mp4']);
-- Deliberately no ON CONFLICT: existing buckets require manual inspection, not silent reuse.
-- No storage.objects policy: anon/authenticated roles must receive no grants to either namespace.
-- No client signer/upload URL exists. Future server processing requires explicit owner approval.
commit;
