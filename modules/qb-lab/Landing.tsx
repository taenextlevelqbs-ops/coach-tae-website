"use client";
import Link from "next/link";
import { PathwaySwitch, useDemo } from "./LabShell";
import { useLocalLab } from "./platform/store";
import { nextStep } from "./platform/next-step";
import { drills } from "./platform/catalog";
const tools = [
  ["iq", "Football IQ", "Learn to see the field", "Study"],
  ["workouts", "Workouts", "Take your next training step", "Train"],
  [
    "mechanics",
    "2D QB Trainer",
    "See the movement, one phase at a time",
    "Practice",
  ],
  ["playbook", "Playbook Studio", "Draw it. Understand it. Run it.", "Create"],
  ["film", "Film Room", "Slow down and learn from a moment", "Review"],
  ["simulator", "Scenario practice", "Make a decision on the field", "Apply"],
];
export function Landing() {
  const { pathway } = useDemo();
  const { state, message } = useLocalLab();
  const next = nextStep(state, pathway);
  const history = state.activities.filter((a) => (a.profile ?? "A") === "A");
  const completed = history.filter((a) => a.kind === "workout");
  return (
    <>
      <div className="lab-page-heading personal-welcome">
        <div>
          <p className="lab-kicker">
            Your personal practice space · Demo athlete A
          </p>
          <h1>Good to have you back, QB.</h1>
          <p className="lab-lede">Coach Tae is with you wherever you train.</p>
        </div>
        <PathwaySwitch />
      </div>
      <div className="personal-home-grid">
        <section className="personal-next" aria-label="Your next step">
          <div>
            <p className="lab-kicker">{next.label}</p>
            <h2>{next.title}</h2>
            <p>{next.why}</p>
            <Link className="lab-button primary" href={next.href}>
              Let’s get started →
            </Link>
            <p className="personal-focus">
              Your focus:{" "}
              {state.goals[0] ?? "Observe first. Understand the change."}
            </p>
          </div>
          <div className="personal-field" aria-hidden="true">
            <svg viewBox="0 0 240 210" fill="none">
              <path
                d="M20 35H220M20 80H220M20 125H220M20 170H220M65 20V190M175 20V190"
                stroke="currentColor"
                opacity=".22"
              />
              <path
                d="M120 165V110Q120 80 155 65L190 45M70 125V75L40 45"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="6 6"
              />
              <circle cx="120" cy="165" r="12" fill="currentColor" />
              <circle
                cx="70"
                cy="125"
                r="9"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                d="m177 43 14 1-5 14"
                stroke="currentColor"
                strokeWidth="3"
              />
            </svg>
            <span>One clear next step.</span>
          </div>
        </section>
        <aside className="personal-coach" aria-label="Coaching feedback">
          <span className="personal-avatar" aria-hidden="true">
            CT
          </span>
          <p className="lab-kicker">Your coaching corner</p>
          <h2>Small steps. Purposeful reps.</h2>
          <p>
            No personal coaching feedback yet. When private coaching is
            available, your notes and corrections will be here.
          </p>
          <Link className="lab-text-link" href="/qb-lab/film">
            Explore a sample film correction →
          </Link>
          <small>
            Illustrated examples, not feedback from Coach Tae about you.
          </small>
        </aside>
      </div>
      <section className="personal-progress" aria-label="Your recent work">
        <div>
          <p className="lab-kicker">Progress you can point to</p>
          <h2>
            {history.length
              ? "You showed up. Here’s your work."
              : "Your first step starts here."}
          </h2>
          <p>
            {history.length
              ? `${history.length} local interactions · ${completed.length} completed workouts`
              : "No completed work yet. Finish a lesson or workout to start your history."}
          </p>
        </div>
        <Link className="lab-text-link" href="/qb-lab/progress">
          See your progress →
        </Link>
      </section>
      {history.length > 0 && (
        <ol className="personal-recent" aria-label="Recent activity">
          {history
            .slice(-3)
            .reverse()
            .map((a) => (
              <li key={a.id}>
                <span>
                  {a.kind === "lesson"
                    ? "Field study explored"
                    : (drills.find((d) => d.id === a.reference)?.title ??
                      `${a.kind} practice recorded`)}
                </span>
                <span>Recorded in this browser</span>
              </li>
            ))}
        </ol>
      )}
      <section className="personal-tools" aria-label="Your development tools">
        <div className="personal-section-title">
          <h2>What would you like to work on?</h2>
          <Link className="lab-text-link" href="/qb-lab/athlete">
            Open Command Center →
          </Link>
        </div>
        <div className="personal-tool-grid">
          {tools.map(([href, title, copy, verb]) => (
            <Link key={href} href={`/qb-lab/${href}`}>
              <span className="lab-kicker">{verb}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
              <span aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
      </section>
      <div className="personal-support">
        <p>
          <strong>
            {pathway === "flag" ? "Your flag pathway" : "Your tackle pathway"}
          </strong>
          <br />
          {pathway === "flag"
            ? "Study space and timing. Rush, contact, eligibility and clock rules depend on your league."
            : "Study the pocket, defensive pictures and passing concepts with your coach."}{" "}
          Ages 8 through college: choose your learning context in Command
          Center. Content remains introductory and pending coaching review.
        </p>
        <Link className="lab-text-link" href="/qb-lab/family">
          Training with a younger athlete? Family Hub →
        </Link>
      </div>
      {message && <p className="lab-fine">{message}</p>}
    </>
  );
}
