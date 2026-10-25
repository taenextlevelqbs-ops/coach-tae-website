/** Run once per approved isolated worker schedule. Not a Vercel request function or deployed job. */
import { createClient } from '@supabase/supabase-js';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { processFilm } from './media-process.mjs';
const env=process.env;
if(env.QB_LAB_MEDIA_WORKER_STAGE!=='synthetic-staging' || env.VERCEL_ENV==='production' || !env.QB_LAB_SUPABASE_URL || !/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(env.QB_LAB_SUPABASE_URL) || !env.QB_LAB_MEDIA_WORKER_KEY?.startsWith('sb_secret_')) throw new Error('ISOLATED_SYNTHETIC_WORKER_NOT_CONFIGURED');
const client=createClient(env.QB_LAB_SUPABASE_URL,env.QB_LAB_MEDIA_WORKER_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const check=result=>{if(result.error)throw new Error('MEDIA_SERVICE_UNAVAILABLE');return result.data;};
check(await client.rpc('qb_media_retention_sweep'));
let processedCandidates=0,transientFailures=0;
for(let count=0;count<5;count++){
 const film=check(await client.rpc('qb_claim_next_film'));if(!film)break;processedCandidates++;
 const source=await client.storage.from('qb-lab-quarantine').download(film.object_key);
 if(source.error)continue; // An intent may exist before the bounded direct upload finishes.
 const folder=await mkdtemp(join(tmpdir(),'qb-media-'));
 let validating=true;
 try{
  if(source.data.size>4194304)throw new Error('MEDIA_REJECTED');
  const bytes=Buffer.from(await source.data.arrayBuffer());if(bytes.length<12 || bytes.toString('ascii',4,8)!=='ftyp')throw new Error('MEDIA_REJECTED');
  const input=join(folder,'source.mp4'),output=join(folder,'processed.mp4');await writeFile(input,bytes,{mode:0o600});
  const metadata=await processFilm(input,output);const processed=await readFile(output);let actualBytes=processed.length;const key=film.id+'/processed.mp4';
  validating=false;
  const stored=await client.storage.from('qb-lab-processed').upload(key,processed,{contentType:'video/mp4',upsert:false});
  if(stored.error){
   // Retry after a previous worker stored the derivative but crashed before DB release.
   const existing=check(await client.storage.from('qb-lab-processed').download(key));
   await writeFile(output,Buffer.from(await existing.arrayBuffer()),{mode:0o600});
   const accepted=await processFilm(output,join(folder,'retry.mp4'));
   metadata.duration=accepted.duration;actualBytes=existing.size;
  }
  check(await client.rpc('qb_release_processed_film',{target:film.id,event:randomUUID(),bytes:actualBytes,seconds:metadata.duration,object_key:key,expected_claim:film.claim}));
 }catch{
  // No codec errors, child data, URLs, names, keys or tokens enter logs.
  if(validating)check(await client.rpc('qb_reject_film',{target:film.id,expected_claim:film.claim}));else transientFailures++;
 }finally{await rm(folder,{recursive:true,force:true});}
}
const deletions=check(await client.from('qb_film_deletion_jobs').select('film_id,source_key,processed_key').is('completed_at',null).limit(100));
for(const job of deletions){
 check(await client.storage.from('qb-lab-quarantine').remove([job.source_key]));
 // A rejected job may have written a derivative before its DB release failed.
 check(await client.storage.from('qb-lab-processed').remove([job.processed_key ?? job.film_id+'/processed.mp4']));
 check(await client.rpc('qb_confirm_film_deletion',{target:job.film_id}));
}
console.log(JSON.stringify({processedCandidates,deletionJobs:deletions.length,transientFailures}));
if(transientFailures)throw new Error('MEDIA_PROCESSING_RETRY_REQUIRED');
