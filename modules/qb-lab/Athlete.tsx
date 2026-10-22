"use client";
import { useState } from "react";
import Link from "next/link";
import { PathwaySwitch, useDemo } from "./LabShell";
import { ageGroups, experiences, pathways } from "./demo";
import { Field } from "./Field";
import { ActivityDesk } from "./platform/ActivityDesk";

export function Athlete() {
  const { pathway, profile } = useDemo();
  const [age, setAge] = useState<string>("11–13");
  const [experience, setExperience] = useState<string>("Getting started");
  const [done, setDone] = useState<string[]>([]);
  const [reset, setReset] = useState(false);
  const tasks = [
    "Observe a starting alignment",
    "Explain what changes after the snap",
    "Prepare one question for a coach",
  ];
  return (
    <>
      <div className="lab-page-heading">
        <div>
          <p className="lab-kicker">COMMAND CENTER / YOUR WORKING SESSION</p>
          <h1>Your plan. Your next step.</h1>
          <p className="lab-lede">
            Choose a learning context, explore a field study and reflect on what
            you notice.
          </p>
        </div>
        <PathwaySwitch />
      </div>
      <ActivityDesk profile={profile.id} />
      <section className="lab-settings" aria-label="Learning context">
        <label>
          Age group
          <select
            aria-label="Age group"
            value={age}
            onChange={(e) => setAge(e.target.value)}
          >
            {ageGroups.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </label>
        <label>
          Experience
          <select
            aria-label="Experience"
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
          >
            {experiences.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </label>
        <div>
          <span className="lab-kicker">YOUR CONTEXT</span>
          <p>
            {pathway === "tackle" ? "Tackle" : "Flag"} · {age} · {experience}
          </p>
          <small>Selections guide this preview, not a skill assessment.</small>
        </div>
      </section>
      <section className="lab-session-ledger" aria-label="Session overview">
        <div>
          <p className="lab-kicker">CURRENT FOCUS</p>
          <h2>Observe before you label.</h2>
          <p>A starting picture is a clue, not a conclusion.</p>
        </div>
        <div>
          <p className="lab-kicker">THIS TAB / CHECKLIST</p>
          <strong>
            {done.length}
            <span> / 3</span>
          </strong>
          <progress
            aria-label="Demo checklist completion"
            value={done.length}
            max={3}
          />
          <p>Demo tasks checked. Not an ability score.</p>
        </div>
        <div>
          <p className="lab-kicker">NEXT STEP</p>
          <h3>
            {done.length === 3
              ? "Bring your question."
              : "Read the starting picture."}
          </h3>
          <Link
            className="lab-text-link"
            href={done.length === 3 ? "/qb-lab/film" : "/qb-lab/iq"}
          >
            {done.length === 3
              ? "Continue to film review →"
              : "Begin the field study →"}
          </Link>
        </div>
      </section>
      <div className="lab-dashboard-grid">
        <section className="lab-study-card">
          <div className="lab-card-top">
            <span className="lab-chip">TODAY’S FIELD STUDY</span>
            <span className="lab-muted">OBSERVE → REASSESS</span>
          </div>
          <Field pathway={pathway} />
          <div className="lab-study-copy">
            <h2>The picture before the play.</h2>
            <p>
              Recognize what is visible. Learn why an initial alignment is a
              clue, not a complete answer.
            </p>
            <Link className="lab-button primary" href="/qb-lab/iq">
              Open Football IQ →
            </Link>
          </div>
        </section>
        <aside className="lab-panel">
          <p className="lab-kicker">SMALL STEPS / CLEAR INTENT</p>
          <h2>The session notebook.</h2>
          <p className="lab-muted">
            Record your interaction with this preview. This is not a training
            record.
          </p>
          <div className="lab-checklist">
            {tasks.map((task) => (
              <label key={task}>
                <input
                  type="checkbox"
                  checked={done.includes(task)}
                  onChange={() => {
                    setReset(false);
                    setDone(
                      done.includes(task)
                        ? done.filter((t) => t !== task)
                        : [...done, task],
                    );
                  }}
                />
                <span>{task}</span>
              </label>
            ))}
          </div>
          <p className="lab-session-count" role="status">
            {done.length} of 3 demo tasks checked
          </p>
          <button
            className="lab-button"
            onClick={() => {
              setDone([]);
              setReset(true);
            }}
          >
            Reset checklist
          </button>
          {reset && (
            <p role="status" className="lab-muted">
              Demo checklist reset.
            </p>
          )}
        </aside>
      </div>
      <section
        className="lab-session-agenda"
        aria-label="Suggested session sequence"
      >
        <p className="lab-kicker">
          SUGGESTED ORDER / NO SCHEDULED APPOINTMENTS
        </p>
        <ol>
          <li>
            <div>
              <h3>Observe the alignment</h3>
              <p>Start with the visible depth. Nothing to memorize yet.</p>
            </div>
            <Link href="/qb-lab/iq">Classroom →</Link>
          </li>
          <li>
            <div>
              <h3>Return to the moment</h3>
              <p>Scrub the illustration. Tag a detail worth discussing.</p>
            </div>
            <Link href="/qb-lab/film">Film room →</Link>
          </li>
          <li>
            <div>
              <h3>Take one question to a coach</h3>
              <p>Connect the observation to your own football context.</p>
            </div>
            <Link href="/#training">Training options →</Link>
          </li>
        </ol>
      </section>
      <section
        className="personal-command-support"
        aria-label="Your coaching and schedule"
      >
        <div>
          <h2>Your schedule</h2>
          <p>
            No training appointments are connected. Completing a demo assignment
            does not book a session.
          </p>
          <Link className="lab-text-link" href="/qb-lab/family">
            View family planning →
          </Link>
        </div>
        <div>
          <h2>Coaching messages</h2>
          <p>
            No private messages yet. Secure coach communication is not available
            in this prototype.
          </p>
          <Link className="lab-text-link" href="/qb-lab/progress">
            Choose a development goal →
          </Link>
        </div>
      </section>
      <section className="lab-bottom-grid">
        <div className="lab-panel">
          <p className="lab-kicker">YOUR PATHWAY</p>
          <h2>{pathways[pathway].title}</h2>
          <p>{pathways[pathway].note}</p>
          <span className="lab-chip">
            {age === "8–10"
              ? "Short, guided observations with an adult"
              : age === "College"
                ? "Add scheme context with your coach"
                : "Match the challenge to your experience"}
          </span>
        </div>
        <div className="lab-panel lab-empty">
          <span className="lab-empty-icon" aria-hidden="true">
            ◎
          </span>
          <h2>A clean starting point.</h2>
          <p>
            Completed local activities appear in Progress Center. Personal
            coaching, verified training records and private film need a secure
            connected account.
          </p>
          <Link className="lab-text-link" href="/qb-lab/film">
            Explore the illustrated film room →
          </Link>
        </div>
      </section>
    </>
  );
}
