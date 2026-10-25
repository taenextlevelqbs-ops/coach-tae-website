import { accountConfig } from '@/server/qb-lab/accounts/config';
import { accountClient, verifiedAccount } from '@/server/qb-lab/accounts/session';
import { AccountError, accountResponse, boundedJson, fields, requireOrigin, text, paragraph, uuid } from '@/server/qb-lab/accounts/http';
import { mvpGates } from '@/server/qb-lab/mvp/config';
import { boundedVideo, byteRange } from '@/server/qb-lab/mvp/http';
import { isCoach } from '@/modules/qb-lab/mvp/types';
function check<T>(result:{data:T;error:unknown}) {if(result.error)throw new AccountError(403,'OPERATION_DENIED');return result.data;}
async function handle(request:Request, context:{params:Promise<{operation:string[]}>}){
 const config=accountConfig();if(!config)return accountResponse({code:'ACCOUNTS_NOT_CONFIGURED'},503);
 try{
  if(request.method!=='GET')requireOrigin(request,config.origin);
  const client=await accountClient(config);const account=await verifiedAccount(client);const gates=mvpGates();
  const operation=(await context.params).operation.join('/');const url=new URL(request.url);
  if(request.method==='GET'&&operation==='session'){
   const profiles=check(await client.from('qb_athletes').select('id,display_name,minor,pathway,age_band,age_group,experience,ruleset').order('display_name').limit(100));
   return accountResponse({account,profiles,gates});
  }
  if(request.method==='GET'&&operation==='data'){
   const athlete=uuid(url.searchParams.get('athlete'));
   // RLS plus an explicit profile read; unrelated identifiers never load another family's records.
   const profile=check(await client.from('qb_athletes').select('id').eq('id',athlete).single());if(!profile)throw new AccountError(403,'PROFILE_REQUIRED');
   const results=await Promise.all([
    client.from('qb_training_records').select('id,athlete_id,content_key,kind,started_at,completed_at,source').eq('athlete_id',athlete).order('started_at',{ascending:false}).limit(200),
    client.from('qb_messages').select('id,body,publish_at,task_id').eq('athlete_id',athlete).lte('publish_at',new Date().toISOString()).order('publish_at',{ascending:false}).limit(100),
    client.rpc('qb_weekly_inbox',{target:athlete}),
    client.from('qb_film').select('id,athlete_id,state,created_at,retained_until,qb_feedback(id,note,released_at)').eq('athlete_id',athlete).order('created_at',{ascending:false}).limit(100),
    client.from('qb_tasks').select('id,title,content_version,completed_at').eq('athlete_id',athlete).order('created_at',{ascending:false}).limit(100),
   ]);
   const [training,messages,quizzes,film,tasks]=results.map(check);
   return accountResponse({training,messages,quizzes,films:(film as unknown as Record<string,unknown>[]).map(f=>({...f,feedback:f.qb_feedback})),tasks});
  }
  if(request.method==='GET'&&operation==='questions'){
   if(!isCoach(account.role))throw new AccountError(403,'COACH_REQUIRED');
   return accountResponse({questions:check(await client.from('qb_question_bank').select('*').order('pathway').limit(200))});
  }
  if(request.method==='GET'&&operation==='film-permission')return accountResponse(gates.media?check(await client.rpc('qb_film_upload_options',{target:uuid(url.searchParams.get('athlete'))})):{allowed:false,reviewers:[]});
  if(request.method==='GET'&&operation==='tickets')return accountResponse({tickets:gates.onboarding?check(await client.rpc('qb_registration_tickets')):[]});
  if(request.method==='GET'&&operation==='film-stream'){
   if(!gates.media)throw new AccountError(503,'MEDIA_DISABLED');
   const film=check(await client.from('qb_film').select('id,processed_key,state').eq('id',uuid(url.searchParams.get('id'))).single());
   if(!film?.processed_key||!['validated','released'].includes(film.state))throw new AccountError(403,'FILM_NOT_READY');
   // Download uses the verified member's JWT and storage RLS, not a privileged or public URL.
   const blob=check(await client.storage.from('qb-lab-processed').download(film.processed_key));
   if(!blob||blob.size<1||blob.size>4194304)throw new AccountError(503,'MEDIA_UNAVAILABLE');
   const range=byteRange(request.headers.get('range'),blob.size);const bytes=await blob.slice(range.start,range.end+1).arrayBuffer();
   return new Response(bytes,{status:range.partial?206:200,headers:{'Content-Type':'video/mp4','Content-Length':String(bytes.byteLength),'Accept-Ranges':'bytes',...(range.partial?{'Content-Range':`bytes ${range.start}-${range.end}/${blob.size}`} : {}),'Cache-Control':'private, no-store','Vary':'Cookie','X-Content-Type-Options':'nosniff','Cross-Origin-Resource-Policy':'same-origin','Content-Disposition':'inline; filename="training.mp4"'}});
  }
  if(request.method==='POST'&&operation==='film-upload'){
   if(!gates.media)throw new AccountError(503,'MEDIA_DISABLED');
   const film=check(await client.from('qb_film').select('id,object_key,uploaded_by,declared_bytes,upload_expires_at,state').eq('id',uuid(url.searchParams.get('id'))).single());
   if(!film||film.uploaded_by!==account.id||film.state!=='quarantine'||Date.parse(film.upload_expires_at)<=Date.now())throw new AccountError(403,'UPLOAD_EXPIRED');
   const bytes=await boundedVideo(request,film.declared_bytes);
   check(await client.storage.from('qb-lab-quarantine').upload(film.object_key,bytes,{contentType:'video/mp4',upsert:false}));
   return accountResponse({uploaded:true,state:'quarantine',message:'Private file received; validation is pending. No playback is available yet.'},201);
  }
  if(request.method!=='POST')return accountResponse({code:'NOT_FOUND'},404);
  // Unapproved media/onboarding requests are refused before their JSON bodies are consumed.
  if(['film-intent','film-feedback'].includes(operation)&&!gates.media)throw new AccountError(503,'MEDIA_DISABLED');
  if(operation==='register-profile'&&!gates.onboarding)throw new AccountError(503,'GUARDIAN_ONBOARDING_DISABLED');
  const input=await boundedJson(request);
  if(operation==='training'){
   fields(input,['athlete','attempt','contentKey','complete']);if(typeof input.complete!=='boolean')throw new AccountError(422,'INVALID_ACTIVITY');
   return accountResponse({id:check(await client.rpc('qb_record_training',{target:uuid(input.athlete),attempt:uuid(input.attempt),content:text(input.contentKey,120),complete:input.complete}))});
  }
  if(operation==='quiz-submit'){
   fields(input,['assignment','answers']);if(!Array.isArray(input.answers)||input.answers.length!==10||input.answers.some(x=>!Number.isInteger(x)||Number(x)<0||Number(x)>3))throw new AccountError(422,'TEN_ANSWERS_REQUIRED');
   return accountResponse({score:check(await client.rpc('qb_submit_weekly',{target:uuid(input.assignment),answers:input.answers}))});
  }
  if(operation==='consent-withdraw'){
   fields(input,['athlete','purpose']);if(account.role!=='guardian'||!['training','media'].includes(String(input.purpose)))throw new AccountError(403,'GUARDIAN_REQUIRED');check(await client.rpc('qb_withdraw_consent',{target:uuid(input.athlete),purpose:input.purpose}));return accountResponse({revoked:true,physicalDeletion:'queued'});
  }
  if(operation==='register-profile'){
   fields(input,['ticket','name','pathway','ageGroup']);
   return accountResponse({id:check(await client.rpc('qb_register_managed_athlete',{ticket:uuid(input.ticket),nickname:text(input.name,60),pathway:text(input.pathway,20),age_group:text(input.ageGroup,20)}))},201);
  }
  if(operation==='film-intent'){
   fields(input,['athlete','coach','bytes']);if(!Number.isSafeInteger(input.bytes)||Number(input.bytes)<1||Number(input.bytes)>4194304)throw new AccountError(422,'INVALID_VIDEO_SIZE');
   return accountResponse(check(await client.rpc('qb_begin_film',{target:uuid(input.athlete),reviewer:uuid(input.coach),bytes:input.bytes})),201);
  }
  if(operation==='film-delete'){
   fields(input,['id']);check(await client.rpc('qb_delete_film',{target:uuid(input.id)}));return accountResponse({accessRevoked:true,physicalDeletion:'queued'});
  }
  if(!isCoach(account.role))throw new AccountError(403,'COACH_REQUIRED');
  if(operation==='profile-ruleset'){
   fields(input,['athlete','ruleset','review']);check(await client.rpc('qb_set_profile_ruleset',{target:uuid(input.athlete),rules:text(input.ruleset,160),review:text(input.review,1000)}));return accountResponse({saved:true});
  }
  if(operation==='question-save'){
   fields(input,['id','question','review']);if(!input.question||typeof input.question!=='object'||Array.isArray(input.question))throw new AccountError(422,'INVALID_QUESTION');
   return accountResponse({id:check(await client.rpc('qb_save_question',{target:input.id?uuid(input.id):null,question:input.question,review:input.review?text(input.review,1000):null}))});
  }
  if(operation==='quiz-publish'){
   fields(input,['athletes','questions','week','title']);
   if(!Array.isArray(input.athletes)||input.athletes.length<1||input.athletes.length>100||!Array.isArray(input.questions)||input.questions.length!==10||typeof input.week!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(input.week))throw new AccountError(422,'INVALID_QUIZ');
   return accountResponse({id:check(await client.rpc('qb_publish_weekly',{targets:input.athletes.map(uuid),questions:input.questions.map(uuid),week_start:input.week,quiz_title:text(input.title,160)}))},201);
  }
  if(operation==='film-feedback'){
   fields(input,['id','note']);return accountResponse({id:check(await client.rpc('qb_write_film_feedback',{target:uuid(input.id),feedback:paragraph(input.note,4000)}))},201);
  }
  return accountResponse({code:'NOT_FOUND'},404);
 }catch(error){return error instanceof AccountError?accountResponse({code:error.code},error.status):accountResponse({code:'MVP_SERVICE_UNAVAILABLE'},503);}
}
export const GET=handle;export const POST=handle;
