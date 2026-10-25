"use client";
import Link from "next/link";
import { useDemo } from "./LabShell";
import { AppIcon, type AppIconName } from "./AppIcon";
import { useLocalLab } from "./platform/store";
import { dailySession, nextDailyStep, pendingTrainingAssignment } from "./training/daily";
import { statusFor } from "./training/progress";
import { TrainingProgress } from "./training/AthleteUI";

const destinations: { title: string; detail: string; href: string; icon: AppIconName }[] = [
  { title: "Workouts", detail: "Backyard QB drills", href: "workouts", icon: "workout" },
  { title: "Recovery", detail: "Stretch & reset", href: "recovery", icon: "recovery" },
  { title: "QB Simulator", detail: "Train your football IQ", href: "simulator", icon: "simulator" },
  { title: "Film Room", detail: "Coach feedback", href: "film", icon: "film" },
];
export function HomeDashboard() {
  const { profile, pathway } = useDemo();
  const { state } = useLocalLab();
  const session = dailySession(pathway);
  const completed = session.filter(step => statusFor(state.activities, profile.id, step.reference) === "completed").length;
  const assigned = pendingTrainingAssignment(state, pathway, profile.id);
  const next = assigned ?? nextDailyStep(state.activities, profile.id, pathway);
  const started = session.some(step => statusFor(state.activities, profile.id, step.reference) !== "not-started");
  const trainingStatus = assigned ? "Not Started" : completed === session.length ? "Completed" : started ? "In Progress" : "Not Started";
  return <div className="athlete-dashboard">
    <section className="dashboard-greeting" aria-label="Your athlete home">
      <h1>What&apos;s up, {profile.name}!</h1>
      <p>Let&apos;s get some work in today.</p>
      <span className="dashboard-demo-label">{profile.name} · demo athlete · {pathway === "flag" ? "Flag" : "Tackle"} football</span>
    </section>
    <section className="session-card" aria-labelledby="today-title">
      <div className="session-heading"><h2 id="today-title">Today&apos;s Training</h2><span className="session-status">{trainingStatus}</span></div>
      <h3>{next?.title ?? "Your sample session is complete."}</h3>
      <p className="session-description">{assigned ? assigned.detail : next?.id === "daily-footwork" ? "Work on a balanced drop, then reset your feet. Start slowly with your coach's guidance." : next ? next.detail : "You recorded all three activities in this browser. Revisit a drill or see what you completed."}</p>
      <div className="session-action">
        <span className="session-time"><AppIcon name="clock" />{assigned ? "Go at your pace" : next?.id === "daily-footwork" ? "5 min · draft estimate" : "At your pace"}</span>
        <Link className="app-primary-button" href={next?.href ?? "/qb-lab/session"}>{next ? "Start Training" : "Review Training"}<AppIcon name="arrow" /></Link>
      </div>
      <TrainingProgress complete={assigned ? 0 : completed} total={assigned ? 1 : session.length} label={assigned ? "Local assignment progress" : "Sample session progress"} />
      <p className="session-demo">{assigned ? "Coach demo assignment · this browser only" : "Fixed sample session · coaching review pending · saved on this device"}</p>
    </section>
    <section className="training-destinations" aria-label="Your training">
      {destinations.map(item => <Link href={`/qb-lab/${item.href}`} key={item.href} className="training-destination">
        <span className="destination-icon"><AppIcon name={item.icon} /></span>
        <span><strong>{item.title}</strong><small>{item.detail}</small></span>
        <span className="destination-arrow"><AppIcon name="arrow" /></span>
      </Link>)}
    </section>
    <section className="coach-note-card" aria-labelledby="coach-note-title">
      <span className="coach-note-avatar" aria-hidden="true">CT</span>
      <div><div className="coach-note-heading"><h2 id="coach-note-title">A Note From Coach Tae</h2><span>Sample coaching note</span></div>
        <blockquote>“Take your time with each rep. Stay curious, talk through what you see and ask your coach when you need a hand.”</blockquote>
        <Link className="lab-text-link" href="/qb-lab/messages">Account notifications &amp; schedule →</Link>
      </div>
    </section>
    <p className="dashboard-disclosure">{profile.name} and this coaching note are synthetic examples. Training content is draft, not an approved personal prescription. Local practice history is available in your <Link href="/qb-lab/progress">Progress</Link>.</p>
  </div>;
}
