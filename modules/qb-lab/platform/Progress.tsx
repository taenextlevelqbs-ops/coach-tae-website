"use client";
import { useDemo } from "../LabShell";
import { useState } from "react";
import { drills, goals } from "./catalog";
import {
  downloadLab,
  parseState,
  resetLab,
  updateLab,
  useLocalLab,
} from "./store";
export function Progress() {
  const { state, message } = useLocalLab();
  const { profile } = useDemo();
  const activities = state.activities.filter(
    (a) => (a.profile ?? "A") === profile.id,
  );
  const assignments = state.assignments.filter((a) => a.profile === profile.id);
  const [notice, setNotice] = useState("");
  const [confirm, setConfirm] = useState(false);
  return (
    <>
      <div className="lab-page-heading">
        <div>
          <p className="lab-kicker">PROGRESS CENTER / ACTUAL LOCAL EVENTS</p>
          <h1>The work you recorded.</h1>
          <p className="lab-lede">
            The most recent browser events for demo athlete {profile.name}.
            Self-reported completions and toy simulation checks are not verified
            athlete development metrics.
          </p>
        </div>
        <button className="lab-button" onClick={downloadLab}>
          Export local prototype
        </button>
      </div>
      <div className="lab-app-metrics">
        <div>
          <strong>
            {activities.filter((a) => a.kind === "workout").length}
          </strong>
          <span>Activity completions</span>
        </div>
        <div>
          <strong>
            {activities.filter((a) => a.kind === "simulation").length}
          </strong>
          <span>Simulation decisions</span>
        </div>
        <div>
          <strong>
            {assignments.filter((a) => a.status === "complete").length}
          </strong>
          <span>Completed local assignments</span>
        </div>
        <div>
          <strong>{state.plays.length}</strong>
          <span>Saved plays</span>
        </div>
      </div>
      <div className="lab-dashboard-grid">
        <section className="lab-panel">
          <h2>Session history</h2>
          {activities.length === 0 ? (
            <p>
              No activity recorded. Complete a workout or make a simulator
              decision to begin.
            </p>
          ) : (
            <ol className="lab-activity-list">
              {[...activities].reverse().map((a) => (
                <li key={a.id}>
                  <span className="lab-kicker">
                    {a.kind} · demo {a.profile ?? "A"}
                  </span>
                  <strong>
                    {drills.find((d) => d.id === a.reference)?.title ??
                      a.reference}
                  </strong>
                  <time dateTime={a.at}>{new Date(a.at).toLocaleString()}</time>
                  {a.engine && (
                    <span>
                      Engine rep · {a.engine.format} · {a.engine.outcome} ·{" "}
                      {a.engine.elapsed.toFixed(2)}s
                      {a.engine.throwTime !== undefined
                        ? ` · release ${a.engine.throwTime.toFixed(2)}s`
                        : ""}{" "}
                      · {a.engine.engagements} engagements / {a.engine.sheds}{" "}
                      sheds · model pressure {a.engine.peakPressure.toFixed(2)}{" "}
                      · seed {a.engine.seed}. Synthetic event, not an athlete
                      rating.
                    </span>
                  )}
                  {a.points !== undefined && (
                    <span>{a.points}/2 geometry checks · not a QB rating</span>
                  )}
                </li>
              ))}
            </ol>
          )}
        </section>
        <aside className="lab-panel">
          <h2>Choose an intention.</h2>
          <p>Fixed local goals. No ranking or skill estimate is generated.</p>
          {goals.map((g) => (
            <label className="lab-preference" key={g}>
              <span>{g}</span>
              <input
                type="checkbox"
                checked={state.goals.includes(g)}
                onChange={() =>
                  updateLab((s) => ({
                    ...s,
                    goals: s.goals.includes(g)
                      ? s.goals.filter((x) => x !== g)
                      : [...s.goals, g],
                  }))
                }
              />
            </label>
          ))}
          <h3>Data controls</h3>
          <p>
            Stored locally under a versioned schema. This is not secure account
            storage. Do not enter names, contact details or private athlete
            information.
          </p>
          <label className="lab-file-import">
            Restore prototype JSON
            <input
              aria-label="Restore prototype JSON"
              type="file"
              accept="application/json,.json"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                if (f.size > 250000) {
                  setNotice("Import rejected: 250 KB maximum.");
                  return;
                }
                f.text()
                  .then((raw) => {
                    const next = parseState(raw);
                    updateLab(() => next);
                    setNotice(
                      "Prototype data restored locally. Imported history is untrusted, not coach verified.",
                    );
                  })
                  .catch(() =>
                    setNotice(
                      "Import rejected. Invalid schema, bounds or JSON; existing data preserved.",
                    ),
                  );
                e.target.value = "";
              }}
            />
          </label>
          <label className="lab-inline-check">
            <input
              type="checkbox"
              checked={confirm}
              onChange={(e) => setConfirm(e.target.checked)}
            />{" "}
            Confirm removal of all local prototype data
          </label>
          <button
            className="lab-button"
            disabled={!confirm}
            onClick={() => {
              resetLab();
              setConfirm(false);
              setNotice("All local prototype data cleared.");
            }}
          >
            Clear local prototype
          </button>
          <p role="status">{notice || message}</p>
        </aside>
      </div>
    </>
  );
}
