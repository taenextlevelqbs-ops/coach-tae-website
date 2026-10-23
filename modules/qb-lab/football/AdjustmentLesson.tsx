"use client";
import { useState } from "react";
import Link from "next/link";
import { useDemo } from "../LabShell";
import { recordActivity } from "../platform/store";
const base = [
  { prompt: "Two safeties are deep before the snap. What can you say?", answers: ["It must be Cover 2", "Two-high is a clue; confirm the rotation and underneath responsibilities after the snap", "Both safeties must rush"], correct: 1, why: "Cover 2, quarters, split-field calls and disguises can share a two-high presentation. Read movement rather than naming coverage from the shell alone." },
  { prompt: "A corner follows your receiver across the formation. What is your next step?", answers: ["Throw immediately because man is guaranteed", "Treat it as a man clue, retain a zone answer and confirm leverage after the snap", "Ignore the defender"], correct: 1, why: "Motion can reveal information, but match rules, exchanges and disguises can imitate man. Confirm leverage and your coach's progression." },
];
export function AdjustmentLesson() {
  const { profile } = useDemo();
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [complete, setComplete] = useState(false);
  const [score, setScore] = useState(0);
  const pressure = profile.pathway === "flag"
    ? { prompt: "A flag defender walks toward the line. What adjustment is safe to assume?", answers: ["The rush is legal in every flag league", "Check the selected league's rush distance, timing and QB-run rules before choosing an answer", "Use tackle pass protection"], correct: 1, why: "Flag formats do not define a universal rush rule. Confirm league requirements; tackle blocking and protection assumptions do not transfer automatically." }
    : { prompt: "Six potential rushers threaten your five-man protection. What should you do?", answers: ["Assume all six will blitz", "Identify the possible free threat and use the coach's protection/help or quick-answer rules, then confirm who rushes", "Keep the same slow-developing read regardless"], correct: 1, why: "Potential rushers may drop. Check protection and eligibility: adding an RB/TE helper removes that receiver from this exercise's routes. A hot answer is system-dependent, not a universal route." };
  const questions = [...base, pressure];
  const current = questions[index];
  function check() {
    if (answer === null || checked) return;
    const nextScore = score + Number(answer === current.correct);
    setScore(nextScore); setChecked(true);
    if (index === questions.length - 1) {
      recordActivity("lesson", `pre-snap-adjustments:${profile.pathway}`, undefined, profile.id, undefined, { correct: nextScore, total: 3 });
      setComplete(true);
    }
  }
  return <section className="adjustment-lesson" aria-label="Pre-snap adjustment lesson">
    <h2>Clue. Confirm. Adjust.</h2><p>Three short decisions · {profile.pathway === "flag" ? "Flag" : "Tackle"} pathway · coaching review required</p>
    <fieldset disabled={checked}><legend>{index + 1} of {questions.length}: {current.prompt}</legend>{current.answers.map((text, i) => <label key={text}><input type="radio" name={`adjustment-${profile.id}`} checked={answer === i} onChange={() => setAnswer(i)} />{text}</label>)}</fieldset>
    <button type="button" className="lab-button primary" disabled={answer === null || checked} onClick={check}>Check adjustment</button>
    {checked && <p role="status">{answer === current.correct ? "Good observation. " : "Review the clue. "}{current.why}</p>}
    {checked && !complete && <button className="lab-button" onClick={() => { setIndex(i => i + 1); setAnswer(null); setChecked(false); }}>Next adjustment</button>}
    {complete && <p>Completed locally: {score} of {questions.length} correct · all decisions reviewed. <Link href="/qb-lab/simulator/engine">Try the live pocket →</Link> <Link href="/qb-lab/progress">View actual activity →</Link></p>}
  </section>;
}
