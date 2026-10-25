"use client";
import Link from "next/link";
import { useDemo } from "./LabShell";
import { useLocalLab } from "./platform/store";
import { dailySession, pendingTrainingAssignment } from "./training/daily";
import { statusFor } from "./training/progress";
import { TrainingHeader, TrainingProgress } from "./training/AthleteUI";
import { AppIcon } from "./AppIcon";
export function DemoSession() {
  const { profile, pathway } = useDemo();
  const { state } = useLocalLab();
  const session = dailySession(pathway);
  const completed = session.filter(step => statusFor(state.activities, profile.id, step.reference) === "completed").length;
  const assigned = pendingTrainingAssignment(state, pathway, profile.id);
  return <section className="train-page">
    <TrainingHeader title="Today's Training" subtitle={`A simple sample session for ${profile.name}. One activity at a time.`} backHref="/qb-lab" backLabel="Home" />
    <p className="train-demo-note">This is a fixed draft example, not a daily assignment from Coach Tae. Your coach sets the time and reps. Completion is self-reported in this browser; Football IQ records a completed recognition exercise.</p>
    {assigned && <aside className="train-assignment"><h2>{assigned.title}</h2><p>{assigned.detail}</p><Link className="train-button" href={assigned.href}>Open assigned activity<AppIcon name="arrow" /></Link></aside>}
    <TrainingProgress complete={completed} total={session.length} label="Sample session progress" />
    <ol className="train-session-list">{session.map(step => {
      const status = statusFor(state.activities, profile.id, step.reference);
      const label = status === "completed" ? "Completed" : status === "in-progress" ? "In Progress" : "Not Started";
      return <li key={step.id}><div><span className="train-draft">{label}</span><h2>{step.title}</h2><p>{step.detail}</p></div>
        <Link className="train-button train-button-secondary" href={step.href}>{status === "completed" ? "Review" : status === "in-progress" ? "Continue" : "Start"}<span className="lab-sr"> {step.title}</span><AppIcon name="arrow" /></Link>
      </li>;
    })}</ol>
    <p className="train-muted">Nothing resets at midnight. These are your actual local actions, not a streak, score or verified movement assessment.</p>
    <Link className="train-back" href="/qb-lab/progress">See your practice history →</Link>
  </section>;
}
