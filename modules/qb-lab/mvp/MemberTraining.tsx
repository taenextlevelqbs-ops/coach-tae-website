"use client";
import { useState } from 'react';
import Link from 'next/link';
import { useMember,memberApi } from './MemberProvider';
import type { TrainingItem } from '../training/types';
import { TrainingHeader,InstructionSteps,CoachTip,MetadataChip } from '../training/AthleteUI';
export function MemberTraining({item}:{item:TrainingItem}){const {profile}=useMember();return <TrainingSession key={`${profile?.id}:${item.slug}`} item={item}/>;}
function TrainingSession({item}:{item:TrainingItem}){
 const {profile,data,loading,reload,account}=useMember();const [busy,setBusy]=useState(false),[notice,setNotice]=useState('');
 const key=`${item.kind}:${item.slug}`;const records=data?.training.filter(r=>r.content_key===key)??[];const active=records.find(r=>!r.completed_at);const completed=records.find(r=>r.completed_at);
 const [attempt,setAttempt]=useState<string|null>(null);
 async function save(complete:boolean){if(!profile||busy)return;setBusy(true);setNotice('');const id=active?.id??attempt??crypto.randomUUID();setAttempt(id);try{await memberApi('training',{athlete:profile.id,attempt:id,contentKey:key,complete});await reload();if(complete)setAttempt(null);setNotice(complete?'Completion saved to your private account.':'Drill started. You can return on another device.');}catch{setNotice('Could not confirm your saved training. Retry uses the same attempt; no completion is assumed.');}finally{setBusy(false);}}
 const coaching=account?.role==='coach'||account?.role==='administrator';
 return <article className="train-page instruction-page"><TrainingHeader title={item.title} subtitle={item.purpose} backHref={item.kind==='workout'?'/qb-lab/workouts':'/qb-lab/recovery'} backLabel={item.kind==='workout'?'Workouts':'Recovery'}/><div className="train-metadata"><MetadataChip>{item.duration}</MetadataChip><MetadataChip>{item.dose}</MetadataChip><MetadataChip>{item.equipment}</MetadataChip></div>
 <p className="train-draft">Instructions prepared for Coach Tae’s review · not a prescribed routine</p><p className="train-safety">{item.safety[0]} Stop if anything hurts. Recovery activities do not diagnose, treat or rehabilitate an injury.</p>
 <section className="instruction-start"><h2>Starting position</h2><p>{item.start}</p></section><InstructionSteps steps={item.steps}/><CoachTip>{item.tip}</CoachTip><details className="train-details"><summary>Safety & common mistakes</summary><ul>{[...item.safety,...item.mistakes].map(s=><li key={s}>{s}</li>)}</ul><p>{item.reviewNote}</p></details>
 <section className="instruction-completion"><h2>Your training</h2>{loading?<p role="status">Loading account history…</p>:!data?<p>Account history is unavailable. Saving remains disabled.</p>:!profile?<p>Select a linked athlete profile to save work.</p>:<><p>{profile.display_name} · {active?'In Progress':completed?'Completed':'Not Started'}</p>{completed&&<p>Last completion: <time dateTime={completed.completed_at!}>{new Date(completed.completed_at!).toLocaleString()}</time></p>}
 {!coaching&&<>{!active?<button className="train-button" disabled={busy} onClick={()=>void save(false)}>{completed?'Start another practice':item.kind==='recovery'?'Start Routine':'Start Drill'}</button>:<button className="train-button" disabled={busy} onClick={()=>void save(true)}>Mark {item.kind==='workout'?'Drill':'Exercise'} Complete</button>}</>}
 <p>Saved to the account database · self-reported completion · no invented score or duration</p><Link className="train-back" href="/qb-lab">See your next session →</Link><details><summary>Completion history ({records.filter(r=>r.completed_at).length})</summary><ul>{records.filter(r=>r.completed_at).map(r=><li key={r.id}><time dateTime={r.completed_at!}>{new Date(r.completed_at!).toLocaleString()}</time></li>)}</ul></details></>}
 <p role="status">{notice}</p></section></article>;
}
