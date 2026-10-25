"use client";
import Link from 'next/link';
import { useMember } from './MemberProvider';
import { workouts } from '../training/workouts';
import { recoveryExercises } from '../training/recovery';
import { AppIcon,type AppIconName } from '../AppIcon';
import { isCoach } from './types';
const cards:{title:string;detail:string;href:string;icon:AppIconName}[]=[{title:'Workouts',detail:'Your quarterback drills',href:'workouts',icon:'workout'},{title:'Recovery',detail:'Stretch & reset',href:'recovery',icon:'recovery'},{title:'QB Simulator',detail:'Optional football practice',href:'simulator',icon:'simulator'},{title:'Film Room',detail:'Your private coaching feedback',href:'film',icon:'film'}];
export function MemberHome(){
 const {profile,data,loading,account,error,reload}=useMember();
 const pending=data?.tasks.find(t=>!t.completed_at);const library=[...workouts,...recoveryExercises];
 const assigned=library.find(item=>`${item.kind}:${item.slug}`===pending?.content_version);
 const next=assigned??library.find(item=>!data?.training.some(r=>r.content_key===`${item.kind}:${item.slug}`&&r.completed_at));
 const quiz=data?.quizzes.find(q=>q.score===null);const note=data?.messages[0];
 if(loading)return <p role="status">Loading your private training space…</p>;
 if(error&&!data)return <section className="train-page"><h1>Your QB LAB</h1><p>Private records are unavailable. No progress or next session is assumed.</p><button className="lab-button" onClick={()=>void reload().catch(()=>{})}>Retry loading records</button></section>;
 if(!profile)return <section className="train-page"><h1>Your QB LAB</h1><p>No athlete profiles are linked yet.</p><Link className="train-button" href="/qb-lab/profile">Manage your account</Link>{account&&isCoach(account.role)&&<Link className="train-button" href="/qb-lab/coach">Open Coach Tae workspace</Link>}</section>;
 return <div className="athlete-dashboard"><section className="dashboard-greeting" aria-label="Your athlete home"><h1>What&apos;s up, {profile.display_name}!</h1><p>Let&apos;s get some work in today.</p><span className="dashboard-demo-label">{profile.pathway} · {profile.age_group??'Age group awaiting review'} · Private account</span></section>
  <section className="session-card" aria-labelledby="today-title"><div className="session-heading"><h2 id="today-title">Today&apos;s Training</h2><span className="session-status">{assigned?'Coach assigned':'Your next step'}</span></div><h3>{next?.title??'Revisit a drill you enjoy.'}</h3><p className="session-description">{assigned?'Coach Tae assigned this activity.':next?'Continue through your training library at your coach’s pace. Instructions await coaching review.':'Your recorded training is available in Progress.'}</p><div className="session-action"><Link className="app-primary-button" href={next?`/qb-lab/${next.kind==='workout'?'workouts':'recovery'}/${next.slug}`:'/qb-lab/progress'}>Start Training<AppIcon name="arrow"/></Link><Link href="/qb-lab/progress">Your training history →</Link></div></section>
  <section className="training-destinations" aria-label="Your training">{cards.map(card=><Link key={card.href} className="training-destination" href={`/qb-lab/${card.href}`}><span className="destination-icon"><AppIcon name={card.icon}/></span><span><strong>{card.title}</strong><small>{card.detail}</small></span><span className="destination-arrow"><AppIcon name="arrow"/></span></Link>)}</section>
  <section className="coach-note-card" aria-labelledby="coach-note-title"><span className="coach-note-avatar" aria-hidden="true">CT</span><div><div className="coach-note-heading"><h2 id="coach-note-title">A Note From Coach Tae</h2></div>{note?<><blockquote>{note.body}</blockquote><time dateTime={note.publish_at}>{new Date(note.publish_at).toLocaleDateString()}</time></>:<p>No coaching messages yet. Coach Tae’s notes will appear here.</p>}<p><Link href="/qb-lab/messages">View message history →</Link></p></div></section>
  <section className="mvp-weekly"><h2>Weekly Football IQ</h2><p>{quiz?`${quiz.title} · 10 questions`:'No new reviewed weekly quiz is assigned.'}</p><Link className="lab-button" href="/qb-lab/iq">{quiz?'Take your weekly quiz':'See quiz history'}</Link></section>
  <p className="dashboard-disclosure">Your account history is saved in the database. Completion is athlete-reported, not a verified performance rating. Training drafts still need Coach Tae’s approval.</p>
 </div>;
}
