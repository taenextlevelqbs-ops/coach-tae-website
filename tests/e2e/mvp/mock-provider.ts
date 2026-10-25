/** Browser component-contract fixture only. It is NOT authentication or a hosted Supabase service.
 * Real authorization/durable transactions are separately exercised against PostgreSQL and server guards.
 * All identities, records, consent tickets and clips below are synthetic. No fixture is shipped to Vercel.
 */
import type { Page,Route } from '@playwright/test';
import { questionDrafts } from '../../../server/qb-lab/mvp/question-drafts';
import type { MemberProfile,MemberRole,TrainingRecord,CoachMessage,WeeklyQuiz,FilmRecord } from '../../../modules/qb-lab/mvp/types';
import { randomUUID } from 'node:crypto';
export type Question={id:string;pathway:string;ruleset:string;difficulty:string;age_groups:string[];prompt:string;choices:string[];correct:number;explanation:string;source_url:string;reviewed_at:string|null};
type Actor='guardian'|'athlete'|'adult'|'coach'|'unrelated';
type StoredQuiz=WeeklyQuiz&{athlete:string};
type StoredFilm=FilmRecord&{bytes:Buffer|null};
export class SyntheticStore{
 profiles:MemberProfile[]=[{id:randomUUID(),display_name:'Alex synthetic',minor:false,pathway:'tackle',age_band:'18plus',age_group:'18plus',experience:'beginner',ruleset:'tackle-fundamentals-review-required'}];
 childId='';training:TrainingRecord[]=[];messages:(CoachMessage&{athlete:string})[]=[];quizzes:StoredQuiz[]=[];films:StoredFilm[]=[];
 bank:Question[]=questionDrafts.map(q=>({id:randomUUID(),pathway:q.pathway,ruleset:q.ruleset,difficulty:q.difficulty,age_groups:q.ages,prompt:q.prompt,choices:q.choices,correct:q.correct,explanation:q.explanation,source_url:q.source_url,reviewed_at:null}));
 ticket= randomUUID();ticketUsed=false;mediaAllowed=true;registrationAllowed=true;
 timestamp(){return new Date().toISOString();}
 allowed(actor:Actor|null,id:string){return actor==='coach'||(actor==='adult'&&id===this.profiles[0].id)||(['guardian','athlete'].includes(actor??'')&&id===this.childId);}
 rows(actor:Actor|null){return actor==='coach'?this.profiles:actor==='adult'?this.profiles.slice(0,1):['guardian','athlete'].includes(actor??'')?this.profiles.filter(p=>p.id===this.childId):[];}
 addMessage(athlete:string,body:string){this.messages.unshift({id:randomUUID(),athlete,body,publish_at:this.timestamp(),task_id:null});}
 processFilms(){for(const film of this.films)if(film.bytes)film.state='validated';}
}
export async function installSyntheticProvider(page:Page,store:SyntheticStore,initial:Actor|null=null){
 let actor=initial;
 const reply=(route:Route,data:unknown,status=200)=>route.fulfill({status,contentType:'application/json',headers:{'Cache-Control':'private, no-store'},body:JSON.stringify(data)});
 await page.route('**/api/qb-lab/**',async route=>{
  const request=route.request(),url=new URL(request.url()),path=url.pathname;const post=request.method()==='POST';
  const input:Record<string,unknown>=post&&request.headers()['content-type']?.includes('application/json')?JSON.parse(request.postData()??'{}'):{};
  if(path.endsWith('/account/login')){
   const known:Record<string,Actor>={'guardian@example.test':'guardian','athlete@example.test':'athlete','adult@example.test':'adult','coach@example.test':'coach','unrelated@example.test':'unrelated'};
   actor=known[String(input.email)]??null;return reply(route,{signedIn:!!actor},actor?200:401);
  }
  if(path.endsWith('/account/logout')){actor=null;return reply(route,{signedIn:false});}
  if(!actor)return reply(route,{code:'SIGN_IN_REQUIRED'},401);
  const role:MemberRole=actor==='coach'?'administrator':actor==='unrelated'?'adult':actor;
  const operation=path.split('/mvp/')[1];
  if(operation==='session')return reply(route,{account:{id:'synthetic-'+actor,role},profiles:store.rows(actor),gates:{media:store.mediaAllowed,onboarding:store.registrationAllowed}});
  if(operation==='tickets')return reply(route,{tickets:actor==='guardian'&&!store.ticketUsed?[{id:store.ticket,expires_at:'2026-12-31T12:00:00Z'}]:[]});
  if(operation==='register-profile'){
   if(actor!=='guardian'||!store.registrationAllowed||store.ticketUsed||input.ticket!==store.ticket)return reply(route,{code:'DENIED'},403);
   store.ticketUsed=true;store.childId=randomUUID();store.profiles.push({id:store.childId,display_name:String(input.name),minor:true,pathway:String(input.pathway),age_group:String(input.ageGroup),age_band:String(input.ageGroup),experience:'beginner',ruleset:null});
   // Synthetic test operator's preapproved child invitation is linked here; this is NOT a product signup API.
   return reply(route,{id:store.childId},201);
  }
  if(operation==='data'){
   const id=url.searchParams.get('athlete')??'';if(!store.allowed(actor,id))return reply(route,{code:'DENIED'},403);
   const quizzes=store.quizzes.filter(q=>q.athlete===id).map(q=>({...q,questions:q.questions.map(question=>q.score===null?{id:question.id,prompt:question.prompt,choices:question.choices}:question)}));
   return reply(route,{training:store.training.filter(r=>r.athlete_id===id),messages:store.messages.filter(m=>m.athlete===id),quizzes,films:store.films.filter(f=>f.athlete_id===id).map(({bytes,...f})=>{void bytes;return f;}),tasks:[]});
  }
  if(operation==='training'){
   if(actor==='coach'||!store.allowed(actor,String(input.athlete)))return reply(route,{code:'DENIED'},403);
   let record=store.training.find(r=>r.id===input.attempt);
   if(!record){record={id:String(input.attempt),athlete_id:String(input.athlete),content_key:String(input.contentKey),kind:String(input.contentKey).startsWith('recovery:')?'recovery':'workout',started_at:store.timestamp(),completed_at:null,source:'self_reported'};store.training.unshift(record);}
   if(input.complete&&!record.completed_at)record.completed_at=store.timestamp();return reply(route,{id:record.id});
  }
  if(operation==='questions')return actor==='coach'?reply(route,{questions:store.bank}):reply(route,{code:'DENIED'},403);
  if(operation==='question-save'){
   if(actor!=='coach')return reply(route,{code:'DENIED'},403);const old=store.bank.find(q=>q.id===input.id);if(!old)return reply(route,{code:'NOT_FOUND'},404);
   Object.assign(old,input.question,{reviewed_at:input.review?store.timestamp():null});return reply(route,{id:old.id});
  }
  if(operation==='profile-ruleset'){
   if(actor!=='coach')return reply(route,{code:'DENIED'},403);const profile=store.profiles.find(p=>p.id===input.athlete);if(profile)profile.ruleset=String(input.ruleset);return reply(route,{saved:true});
  }
  if(operation==='quiz-publish'){
   if(actor!=='coach')return reply(route,{code:'DENIED'},403);
   const selected=store.bank.filter(q=>(input.questions as string[]).includes(q.id));
   const targets=input.athletes as string[];
   if(selected.length!==10||selected.some(q=>!q.reviewed_at)||targets.some(id=>store.quizzes.some(q=>q.athlete===id&&q.week===input.week)))return reply(route,{code:'DENIED'},403);
   for(const id of targets){const profile=store.profiles.find(p=>p.id===id);if(!profile||profile.ruleset!==selected[0].ruleset||(selected[0].pathway==='flag'?!profile.pathway.startsWith('flag'):profile.pathway!=='tackle')||selected.some(q=>!q.age_groups.includes(profile.age_group??'')))return reply(route,{code:'DENIED'},403);store.quizzes.unshift({assignment:randomUUID(),athlete:id,week:String(input.week),title:String(input.title),pathway:selected[0].pathway as 'flag'|'tackle',ruleset:selected[0].ruleset,score:null,completed_at:null,questions:structuredClone(selected)});store.addMessage(id,'Your weekly Football IQ quiz is ready.');}return reply(route,{id:randomUUID()},201);
  }
  if(operation==='quiz-submit'){
   const quiz=store.quizzes.find(q=>q.assignment===input.assignment);if(!quiz||actor==='coach'||!store.allowed(actor,quiz.athlete))return reply(route,{code:'DENIED'},403);
   if(quiz.score===null){const answers=input.answers as number[];quiz.score=quiz.questions.filter((q,i)=>q.correct===answers[i]).length;quiz.completed_at=store.timestamp();quiz.questions=quiz.questions.map((q,i)=>({...q,selected:answers[i]}));}return reply(route,{score:quiz.score});
  }
  if(operation==='film-permission'){const id=url.searchParams.get('athlete')??'';return reply(route,{allowed:store.mediaAllowed&&actor!=='coach'&&store.allowed(actor,id),reviewers:[{id:'00000000-0000-4000-8000-000000000004'}]});}
  if(operation==='film-intent'){
   if(!store.mediaAllowed||actor==='coach'||!store.allowed(actor,String(input.athlete)))return reply(route,{code:'DENIED'},403);const id=randomUUID();store.films.unshift({id,athlete_id:String(input.athlete),created_at:store.timestamp(),retained_until:'2026-12-01T00:00:00Z',state:'quarantine',feedback:[],bytes:null});return reply(route,{id},201);
  }
  if(operation==='film-upload'){
   const film=store.films.find(f=>f.id===url.searchParams.get('id'));if(!film||!store.allowed(actor,film.athlete_id))return reply(route,{code:'DENIED'},403);film.bytes=request.postDataBuffer();return reply(route,{uploaded:true,state:'quarantine'},201);
  }
  if(operation==='film-stream'){
   const film=store.films.find(f=>f.id===url.searchParams.get('id'));if(!film||!store.allowed(actor,film.athlete_id)||!['validated','released'].includes(film.state)||!film.bytes)return reply(route,{code:'DENIED'},403);
   return route.fulfill({status:200,contentType:'video/mp4',headers:{'Cache-Control':'private, no-store'},body:film.bytes});
  }
  if(operation==='film-feedback'){
   if(actor!=='coach')return reply(route,{code:'DENIED'},403);const film=store.films.find(f=>f.id===input.id);if(!film)return reply(route,{code:'DENIED'},403);film.feedback.push({id:randomUUID(),note:String(input.note),released_at:store.timestamp()});film.state='released';store.addMessage(film.athlete_id,'Coach Tae added feedback to your film. Open Film Room to read it.');return reply(route,{id:randomUUID()},201);
  }
  if(operation==='film-delete'){const film=store.films.find(f=>f.id===input.id);if(!film||!store.allowed(actor,film.athlete_id))return reply(route,{code:'DENIED'},403);store.films=store.films.filter(f=>f.id!==film.id);return reply(route,{accessRevoked:true,physicalDeletion:'queued'});}
  if(path.endsWith('/membership')&&post&&actor==='coach'){
   for(const id of input.athletes as string[])store.addMessage(id,String(input.body));return reply(route,{queued:(input.athletes as string[]).length});
  }
  return reply(route,{code:'UNEXPECTED_TEST_REQUEST'},503);
 });
}
