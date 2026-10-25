"use client";
import Link from 'next/link';
import { useState } from 'react';
import { workouts } from '../training/workouts';
import { recoveryExercises } from '../training/recovery';
import { useMember } from './MemberProvider';
import { TrainingHeader } from '../training/AthleteUI';
export function MemberLibrary({kind}:{kind:'workout'|'recovery'}){
 const {data,loading}=useMember(),[category,setCategory]=useState('all');const items=kind==='workout'?workouts:recoveryExercises;const categories=[...new Set(items.map(i=>i.category))];
 return <div className="train-page"><TrainingHeader title={kind==='workout'?'Workouts':'Recovery'} subtitle={kind==='workout'?'One clear drill. Your own progress.':'Simple, comfortable movement. Not injury treatment.'} backHref="/qb-lab" backLabel="Home"/>
 <div className="train-category-grid" role="group" aria-label="Training categories"><button className="train-category" aria-pressed={category==='all'} onClick={()=>setCategory('all')}>All {items.length} {kind==='workout'?'workouts':'routines'}</button>{categories.map(c=><button className="train-category" aria-pressed={category===c} key={c} onClick={()=>setCategory(c)}>{c}</button>)}</div>
 <section className="train-list" aria-label="Training library">{items.filter(i=>category==='all'||i.category===category).map(item=>{const history=data?.training.filter(r=>r.content_key===`${kind}:${item.slug}`)??[];const status=!data?(loading?'Loading history':'History unavailable'):history.some(r=>!r.completed_at)?'In Progress':history.some(r=>r.completed_at)?'Completed':'Not Started';return <Link className="train-drill-link" key={item.slug} href={`/qb-lab/${kind==='workout'?'workouts':'recovery'}/${item.slug}`}><span><strong>{item.title}</strong><small className="train-muted">{item.category} · {status}</small></span><span aria-hidden="true">→</span></Link>;})}</section><p className="train-muted">Instructions prepared for Coach Tae’s review. No medical, rehabilitation or guaranteed performance claims. Your coach sets the appropriate training dose.</p></div>;
}
