"use client";
import { useState } from 'react';
import { useMember,memberApi } from './MemberProvider';
import { TrainingHeader } from '../training/AthleteUI';
import type { WeeklyQuiz } from './types';
function Quiz({quiz}:{quiz:WeeklyQuiz}){
 const {reload,account}=useMember();const [answers,setAnswers]=useState<(number|null)[]>(Array(10).fill(null)),[busy,setBusy]=useState(false),[notice,setNotice]=useState('');
 const submitted=quiz.score!==null;const coach=account?.role==='coach'||account?.role==='administrator';
 return <section className="lab-panel mvp-quiz"><h2>{quiz.title}</h2><p>{quiz.pathway==='flag'?'Flag Football IQ':'Tackle Football IQ'} · Week of {quiz.week} · Ruleset: {quiz.ruleset}</p>
 {submitted&&<p role="status">Score: <strong>{quiz.score} / 10</strong> · Completed {new Date(quiz.completed_at!).toLocaleString()}. This weekly result is final; reviewing or retaking does not award more credit.</p>}
 <form onSubmit={async event=>{event.preventDefault();if(busy||submitted||coach)return;setBusy(true);setNotice('');try{await memberApi('quiz-submit',{assignment:quiz.assignment,answers});await reload();}catch{setNotice('Could not confirm your quiz result. Your original result is preserved if already submitted.');}finally{setBusy(false);}}}>
 {quiz.questions.map((q,index)=><fieldset key={q.id} className="mvp-question"><legend>{index+1}. {q.prompt}</legend>{q.choices.map((choice,i)=><label key={i}><input type="radio" name={`question-${quiz.assignment}-${index}`} value={i} required checked={submitted?q.selected===i:answers[index]===i} disabled={submitted||busy||coach} onChange={()=>setAnswers(current=>current.map((a,n)=>n===index?i:a))}/>{choice}</label>)}
 {submitted&&<div className="mvp-answer"><p><strong>{q.selected===q.correct?'Correct':'Review this read'}</strong> · Correct answer: {q.choices[q.correct!]}</p><p>{q.explanation}</p>{q.source_url&&<a href={q.source_url} target="_blank" rel="noreferrer">Reviewed source</a>}</div>}</fieldset>)}
 {!submitted&&!coach&&<button className="train-button" disabled={busy||answers.some(a=>a===null)}>Submit 10 answers</button>}
 </form><p role="status">{notice}</p></section>;
}
export function MemberQuizzes(){const {profile,data,loading}=useMember();return <div className="train-page membership-workspace"><TrainingHeader title="Weekly Football IQ" subtitle="Read, choose, then learn from each answer." backHref="/qb-lab" backLabel="Home"/>
 <p>{profile?.display_name??'Your athlete'} · Flag and tackle quizzes use separate question banks and reviewed rulesets. Each weekly assignment contains exactly ten questions.</p>
 {loading?<p role="status">Loading weekly quizzes…</p>:!data?<p>Quiz history is unavailable. No empty history or score is assumed.</p>:!data.quizzes.length?<p>No reviewed weekly quiz has been assigned yet. Coach Tae must approve ten age-appropriate questions from your actual ruleset before publishing.</p>:data.quizzes.map(q=><Quiz key={q.assignment} quiz={q}/>)}
 </div>;}
