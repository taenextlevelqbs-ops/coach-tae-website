"use client";
import { useState } from "react";
import Link from "next/link";
import { PathwaySwitch, useDemo } from "./LabShell";
import { ageGroups, experiences, pathways } from "./demo";
import { Field } from "./Field";

export function Athlete() {
  const { pathway } = useDemo();
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
          <p className="lab-kicker">ATHLETE STUDIO / DEMO SESSION</p>
          <h1>
            Your next rep
            <br />
            starts <em>here.</em>
          </h1>
          <p className="lab-lede">
            Choose a learning context, explore a field study and reflect on what
            you notice.
          </p>
        </div>
        <PathwaySwitch />
      </div>
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
          <h2>Your demo checklist</h2>
          <p className="lab-muted">
            Record your interaction with this preview. This is not a training
            record.
          </p>
          <div className="lab-checklist">
            {tasks.map((task, i) => (
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
                <span>
                  <small>0{i + 1}</small>
                  {task}
                </span>
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
            No training sessions, film reviews or athlete statistics are
            recorded here. A connected account and reviewed content are future
            work.
          </p>
          <Link className="lab-text-link" href="/qb-lab/film">
            Explore the illustrated film room →
          </Link>
        </div>
      </section>
    </>
  );
}
