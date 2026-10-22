"use client";
import { useState } from "react";
import Link from "next/link";
import { drills } from "./catalog";
import { recordActivity, useLocalLab } from "./store";
import { ageGroups, experiences } from "../demo";
import { PathwaySwitch, useDemo } from "../LabShell";
export function Workouts({
  initialActivity = "observe",
  profile,
}: {
  initialActivity?: string;
  profile?: "A" | "B";
}) {
  const { pathway, profile: demoProfile } = useDemo();
  const activeProfile = profile ?? demoProfile.id;
  return (
    <WorkoutsBody
      key={pathway + activeProfile}
      initialActivity={initialActivity}
      profile={activeProfile}
    />
  );
}
function WorkoutsBody({
  initialActivity,
  profile,
}: {
  initialActivity: string;
  profile: "A" | "B";
}) {
  const { pathway } = useDemo();
  const { state, message: storageMessage } = useLocalLab();
  const [age, setAge] = useState<string>("11–13");
  const [experience, setExperience] = useState("All");
  const [category, setCategory] = useState("All");
  const [selected, setSelected] = useState<string>(initialActivity);
  const [step, setStep] = useState(0);
  const [complete, setComplete] = useState(false);
  const [message, setMessage] = useState("");
  const visible = drills.filter(
    (d) =>
      (d.pathway === "both" || d.pathway === pathway) &&
      (d.ages as readonly string[]).includes(age) &&
      (experience === "All" ||
        d.experience === "All" ||
        d.experience === experience) &&
      (category === "All" || d.category === category),
  );
  const current = visible.find((d) => d.id === selected) ?? visible[0];
  function change() {
    setStep(0);
    setComplete(false);
    setMessage("");
  }
  return (
    <>
      <div className="lab-page-heading">
        <div>
          <p className="lab-kicker">WORKOUTS / GUIDED PREPARATION</p>
          <h1>Give the rep a purpose.</h1>
          <p className="lab-lede">
            Five introductory activities with actual step tracking. Content is
            pending qualified coaching review; this is not a complete exercise
            program.
          </p>
        </div>
        <PathwaySwitch />
      </div>
      <div className="lab-app-toolbar">
        <label>
          Age group
          <select
            aria-label="Workout age group"
            value={age}
            onChange={(e) => {
              setAge(e.target.value);
              change();
            }}
          >
            {ageGroups.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </label>
        <label>
          Experience
          <select
            aria-label="Workout experience"
            value={experience}
            onChange={(e) => {
              setExperience(e.target.value);
              change();
            }}
          >
            {["All", ...experiences].map((e) => (
              <option key={e}>{e}</option>
            ))}
          </select>
        </label>
        <label>
          Focus
          <select
            aria-label="Workout focus"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              change();
            }}
          >
            {["All", ...new Set(drills.map((d) => d.category))].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="lab-simulator-grid">
        <section className="lab-panel">
          <h2>Activity library</h2>
          {visible.length === 0 ? (
            <p>
              No activity matches this context. Choose another focus or
              experience; no program is prescribed.
            </p>
          ) : (
            visible.map((d) => (
              <button
                className="lab-library-row"
                aria-pressed={current?.id === d.id}
                key={d.id}
                onClick={() => {
                  setSelected(d.id);
                  change();
                }}
              >
                <span>
                  <strong>{d.title}</strong>
                  <small>
                    {d.category} · {d.minutes} min suggested discussion
                  </small>
                </span>
                <span>
                  {
                    state.activities.filter(
                      (a) =>
                        a.kind === "workout" &&
                        a.reference === d.id &&
                        (a.profile ?? "A") === profile,
                    ).length
                  }{" "}
                  completed
                </span>
              </button>
            ))
          )}
        </section>
        {current && (
          <section className="lab-panel" key={current.id}>
            <p className="lab-kicker">
              GUIDED SESSION / LOCAL DEMO ATHLETE {profile}
            </p>
            <h2>{current.title}</h2>
            <p>
              <strong>Equipment:</strong> {current.equipment}
            </p>
            <div className="lab-safety-note">{current.safety}</div>
            <p className="lab-kicker">
              STEP {step + 1} OF {current.steps.length}
            </p>
            <h3>{current.steps[step]}</h3>
            <progress
              aria-label="Activity step progress"
              value={complete ? current.steps.length : step}
              max={current.steps.length}
            />
            <div className="lab-actions">
              <button
                className="lab-button"
                disabled={step === 0 || complete}
                onClick={() => setStep(step - 1)}
              >
                Previous step
              </button>
              <button
                className="lab-button primary"
                disabled={complete}
                onClick={() => {
                  if (step < current.steps.length - 1) setStep(step + 1);
                  else {
                    recordActivity("workout", current.id, undefined, profile);
                    setComplete(true);
                    setMessage(
                      `Completion recorded in the local workspace. Matching demo ${profile} assignments are now complete. Storage status below confirms durability.`,
                    );
                  }
                }}
              >
                {step === current.steps.length - 1
                  ? "Complete activity"
                  : "Next step"}
              </button>
            </div>
            <p role="status">
              {message} {storageMessage}
            </p>
            <Link className="lab-text-link" href="/qb-lab/mechanics">
              Open Mechanics Studio →
            </Link>
          </section>
        )}
      </div>
    </>
  );
}
