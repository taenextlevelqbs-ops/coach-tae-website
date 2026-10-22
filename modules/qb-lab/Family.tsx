"use client";
import { useState } from "react";
import Link from "next/link";
import { useDemo } from "./LabShell";
import { useLocalLab } from "./platform/store";
import { ActivityDesk } from "./platform/ActivityDesk";
const athletes = [
  {
    id: "A",
    name: "Demo athlete A",
    age: "11–13",
    pathway: "tackle" as const,
    initials: "A",
  },
  {
    id: "B",
    name: "Demo athlete B",
    age: "11–13",
    pathway: "flag" as const,
    initials: "B",
  },
];
const defaults = {
  A: { reminders: true, feedback: true },
  B: { reminders: false, feedback: true },
};
export function Family() {
  const { state: localState } = useLocalLab();
  const [selected, setSelected] = useState<"A" | "B">("A");
  const [preferences, setPreferences] = useState(defaults);
  const [message, setMessage] = useState("");
  const { selectProfile } = useDemo();
  const localCount = localState.activities.filter(
    (a) => (a.profile ?? "A") === selected,
  ).length;
  const athlete = athletes.find((a) => a.id === selected)!;
  function exportDemo() {
    const blob = new Blob(
      [
        JSON.stringify(
          { demonstration: true, profiles: athletes, preferences },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "coach-tae-demo-settings.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage(
      "Synthetic demo settings exported. No personal information is included.",
    );
  }
  return (
    <>
      <div className="lab-page-heading">
        <div>
          <p className="lab-kicker">FAMILY HUB / GROW TOGETHER</p>
          <h1>Their development. Your support.</h1>
          <p className="lab-lede">
            A thoughtful space for guardians to guide the experience, understand
            the work and stay part of the conversation.
          </p>
        </div>
        <span className="lab-chip">SYNTHETIC FAMILY</span>
      </div>
      <section
        aria-label="Select a sample athlete"
        className="lab-family-profiles"
      >
        {athletes.map((a) => (
          <button
            className={
              selected === a.id ? "lab-profile selected" : "lab-profile"
            }
            aria-pressed={selected === a.id}
            key={a.id}
            onClick={() => {
              setSelected(a.id as "A" | "B");
              setMessage("");
            }}
          >
            <span className="lab-avatar">{a.initials}</span>
            <span>
              <strong>{a.name}</strong>
              <small>
                Ages {a.age} · {a.pathway === "tackle" ? "Tackle" : "Flag"}{" "}
                pathway
              </small>
            </span>
            <span className="lab-profile-arrow" aria-hidden="true">
              →
            </span>
          </button>
        ))}
      </section>
      <ActivityDesk profile={selected} />
      <section className="lab-family-briefing" aria-label="Family briefing">
        <div>
          <p className="lab-kicker">THE GUARDIAN BRIEFING</p>
          <h2>
            Support the process.
            <br />
            Let them own the rep.
          </h2>
          <p>
            For {athlete.name.toLowerCase()}, start with one simple
            conversation: “What did you notice?” This is sample guidance, not a
            coach assignment.
          </p>
        </div>
        <dl>
          <div>
            <dt>Development records</dt>
            <dd>
              {localCount
                ? `${localCount} local demo events`
                : "No activity recorded"}
            </dd>
          </div>
          <div>
            <dt>Upcoming sessions</dt>
            <dd>No appointments connected</dd>
          </div>
          <div>
            <dt>Coaching updates</dt>
            <dd>No released feedback</dd>
          </div>
        </dl>
      </section>
      <div className="lab-dashboard-grid lab-family-grid">
        <section className="lab-panel">
          <p className="lab-kicker">
            {athlete.name.toUpperCase()} / LEARNING CONTEXT
          </p>
          <h2>The athlete’s next step.</h2>
          <div className="lab-family-summary">
            <div>
              <span>AGE GROUP</span>
              <strong>{athlete.age}</strong>
            </div>
            <div>
              <span>PATHWAY</span>
              <strong>
                {athlete.pathway === "tackle" ? "Tackle" : "Flag"}
              </strong>
            </div>
            <div>
              <span>ACTIVITY</span>
              <strong>
                {localCount ? `${localCount} local events` : "No records"}
              </strong>
            </div>
          </div>
          <p>
            Only browser demonstration events are connected here. No real
            athlete records or released coach reviews exist. There are no hidden
            performance scores.
          </p>
          <Link
            className="lab-button primary"
            href="/qb-lab/athlete"
            onClick={() => selectProfile(selected)}
          >
            Explore the athlete studio →
          </Link>
          <div className="lab-family-coaching">
            <span className="lab-empty-icon" aria-hidden="true">
              →
            </span>
            <div>
              <h3>Keep the conversation open.</h3>
              <p>
                A future family account would show released feedback and
                assignments for verified linked athletes. This screen does not
                establish guardianship or grant access to real records.
              </p>
            </div>
          </div>
        </section>
        <section className="lab-panel">
          <p className="lab-kicker">COMMUNICATION / LOCAL PREVIEW</p>
          <h2>Your communication preferences.</h2>
          <p className="lab-muted">
            Explore separate settings for each synthetic profile. No emails or
            notifications are sent.
          </p>
          {(
            [
              [
                "reminders",
                "Session reminders",
                "A gentle prompt to revisit assigned learning.",
              ],
              [
                "feedback",
                "Coaching feedback updates",
                "Keep a guardian in the coaching conversation.",
              ],
            ] as const
          ).map(([key, label, help]) => (
            <label className="lab-preference" key={key}>
              <span>
                <strong>{label}</strong>
                <small>{help}</small>
              </span>
              <input
                type="checkbox"
                checked={preferences[selected][key]}
                onChange={(e) => {
                  setPreferences({
                    ...preferences,
                    [selected]: {
                      ...preferences[selected],
                      [key]: e.target.checked,
                    },
                  });
                  setMessage("Demo preference changed in this tab only.");
                }}
              />
            </label>
          ))}
          <p className="lab-fine">
            These are interface preferences, not consent to collect a child’s
            information.
          </p>
          <p role="status" className="lab-muted">
            {message}
          </p>
        </section>
      </div>
      <section className="lab-bottom-grid">
        <div className="lab-panel">
          <p className="lab-kicker">PRIVACY / BY DESIGN</p>
          <h2>Clear boundaries come first.</h2>
          <dl className="lab-privacy-list">
            <div>
              <dt>Personal information</dt>
              <dd>Not collected</dd>
            </div>
            <div>
              <dt>Athlete footage</dt>
              <dd>Not accepted</dd>
            </div>
            <div>
              <dt>Legal consent</dt>
              <dd>Not collected</dd>
            </div>
            <div>
              <dt>Persistent account</dt>
              <dd>Not created</dd>
            </div>
          </dl>
          <details>
            <summary>What needs to happen before real accounts?</summary>
            <p>
              Verified guardian relationships, an approved consent process,
              private authorization, access logs and tested export/deletion
              workflows. Changing a demo preference does not satisfy these
              requirements.
            </p>
          </details>
        </div>
        <div className="lab-panel">
          <p className="lab-kicker">YOUR DEMONSTRATION DATA</p>
          <h2>
            Easy to inspect.
            <br />
            Easy to reset.
          </h2>
          <p>
            Export the fixed sample profiles and current demo preferences, or
            restore the defaults. Nothing is saved to a server or browser
            storage.
          </p>
          <div className="lab-actions">
            <button className="lab-button" onClick={exportDemo}>
              Export demo settings →
            </button>
            <button
              className="lab-button"
              onClick={() => {
                setPreferences(defaults);
                setMessage("Demo preferences reset for both sample profiles.");
              }}
            >
              Reset preferences
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
