"use client";
import Link from "next/link";
import { useDemo } from "./LabShell";
import { AppIcon, type AppIconName } from "./AppIcon";
import { useLocalLab } from "./platform/store";
import { nextStep } from "./platform/next-step";
const destinations: {
  title: string;
  detail: string;
  href: string;
  icon: AppIconName;
  color: string;
}[] = [
  {
    title: "Football IQ",
    detail: "Read the defense",
    href: "iq",
    icon: "iq",
    color: "blue",
  },
  {
    title: "Workouts",
    detail: "Train anywhere",
    href: "workouts",
    icon: "workout",
    color: "orange",
  },
  {
    title: "Film Room",
    detail: "Review your reps",
    href: "film",
    icon: "film",
    color: "violet",
  },
  {
    title: "Playbook",
    detail: "Learn your plays",
    href: "playbook",
    icon: "plays",
    color: "green",
  },
  {
    title: "QB Simulator",
    detail: "Practice decisions",
    href: "simulator",
    icon: "simulator",
    color: "blue",
  },
  {
    title: "Progress",
    detail: "See your growth",
    href: "progress",
    icon: "progress",
    color: "orange",
  },
];
export function HomeDashboard() {
  const { profile } = useDemo();
  const { state } = useLocalLab();
  const activities = state.activities.filter(
    (a) => (a.profile ?? "A") === profile.id,
  );
  const hasAssignedWork = state.assignments.some(
    (a) => a.profile === profile.id && a.status === "assigned",
  );
  const next = nextStep(state, profile.pathway, profile.id);
  const started = activities.length > 0 || hasAssignedWork;
  return (
    <div className="athlete-dashboard">
      <section className="dashboard-greeting" aria-label="Your athlete home">
        <div>
          <h1>Good afternoon, {profile.name}.</h1>
          <p>
            Your QB Lab <span>·</span>{" "}
            {profile.pathway === "flag" ? "Flag football" : "Tackle football"}{" "}
            <span>·</span> Age {profile.age}
          </p>
        </div>
        <span className="dashboard-demo-label">Demo athlete</span>
      </section>
      <section className="session-card" aria-labelledby="next-session-title">
        <div className="session-heading">
          <span className="session-indicator" aria-hidden="true" />
          <p>YOUR NEXT SESSION</p>
          <span className="session-demo">Sample assignment</span>
        </div>
        <h2 id="next-session-title">
          {started ? next.title : "Let's work on reading Cover 2."}
        </h2>
        <p className="session-description">
          {started
            ? next.why
            : "Coach Tae assigned a 10-minute lesson and a short footwork drill for today."}
        </p>
        <div className="session-action">
          <span className="session-time">
            <AppIcon name="clock" />
            {started ? "Go at your pace" : "10 minutes"}
          </span>
          <Link
            className="app-primary-button"
            href={started ? next.href : "/qb-lab/session"}
          >
            Start training <AppIcon name="arrow" />
          </Link>
        </div>
      </section>
      <section className="dashboard-training" aria-labelledby="your-training">
        <h2 id="your-training">Your training</h2>
        <div className="training-destinations">
          {destinations.map((item) => (
            <Link
              key={item.href}
              href={`/qb-lab/${item.href}${item.href === "workouts" ? `?profile=${profile.id}` : ""}`}
              className="training-destination"
            >
              <span className={`destination-icon ${item.color}`}>
                <AppIcon name={item.icon} />
              </span>
              <span>
                <strong>{item.title}</strong>
                <small>{item.detail}</small>
              </span>
              <span className="destination-arrow">
                <AppIcon name="arrow" />
              </span>
            </Link>
          ))}
        </div>
      </section>
      <section className="coach-note-card" aria-labelledby="coach-note-title">
        <span className="coach-note-avatar" aria-hidden="true">
          CT
        </span>
        <div>
          <div className="coach-note-heading">
            <h2 id="coach-note-title">A note from Coach Tae</h2>
            <span>Sample coaching note</span>
          </div>
          <blockquote>
            “
            {profile.id === "B"
              ? "Great work last session. This week, focus on keeping your base balanced and identifying the safeties before the snap."
              : "Take your time with each rep. Notice the defensive picture, then talk through your next decision with your coach."}
            ”
          </blockquote>
        </div>
      </section>
      <p className="dashboard-disclosure">
        {profile.name}, the assignment and coaching note are synthetic
        demonstration data, not real athlete records. Your local activity is
        available in Progress.
      </p>
    </div>
  );
}
