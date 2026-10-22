"use client";
import { useEffect, useRef, useState } from "react";
import { Field } from "./Field";
import { filmComments } from "./demo";
import { PathwaySwitch, useDemo } from "./LabShell";

export function FilmReview() {
  const { pathway } = useDemo();
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [annotate, setAnnotate] = useState(true);
  const [compare, setCompare] = useState(false);
  const [queued, setQueued] = useState<{ clip: string; focus: string } | null>(
    null,
  );
  const [clip, setClip] = useState("Alignment study");
  const [focus, setFocus] = useState("Describe the alignment");
  const dialog = useRef<HTMLDialogElement>(null);
  const active = playing && time < 10;
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(
      () => setTime((t) => Math.min(10, Math.round((t + 0.1) * 10) / 10)),
      100 / speed,
    );
    return () => clearInterval(timer);
  }, [active, speed]);
  return (
    <>
      <div className="lab-page-heading">
        <div>
          <p className="lab-kicker">FILM ROOM / THE DETAILS MATTER</p>
          <h1>
            Turn a moment
            <br />
            into a <em>conversation.</em>
          </h1>
          <p className="lab-lede">
            Explore how focused feedback could connect what an athlete sees with
            what they work on next.
          </p>
        </div>
        <button
          className="lab-button primary"
          onClick={() => dialog.current?.showModal()}
        >
          Prepare a demo submission →
        </button>
      </div>
      {queued && (
        <div className="lab-queue-message" role="status">
          <div>
            <strong>Demo review queued: {queued.clip}</strong>
            <p>
              Focus: {queued.focus}. Local workflow preview only. No file was
              uploaded and no coach received a submission.
            </p>
          </div>
          <button className="lab-button" onClick={() => setQueued(null)}>
            Clear demo submission
          </button>
        </div>
      )}
      <div className="lab-film-toolbar">
        <PathwaySwitch />
        <div className="lab-actions">
          <button
            className="lab-button"
            aria-pressed={annotate}
            onClick={() => setAnnotate(!annotate)}
          >
            {annotate ? "Hide" : "Show"} annotation
          </button>
          <button
            className="lab-button"
            aria-pressed={compare}
            onClick={() => setCompare(!compare)}
          >
            {compare ? "Single view" : "Compare moments"}
          </button>
        </div>
      </div>
      <div className="lab-film-grid">
        <section className="lab-panel lab-film-player">
          <div className="lab-card-top">
            <span className="lab-chip">ILLUSTRATED FILM / SAMPLE 001</span>
            <span className="lab-muted">
              00:{String(Math.floor(time)).padStart(2, "0")} / 00:10
            </span>
          </div>
          <div className={compare ? "lab-compare-fields" : ""}>
            <div>
              {compare && <p className="lab-kicker">EARLIER MOMENT</p>}
              <Field
                pathway={pathway}
                progress={time * 10}
                annotate={annotate && time >= 4}
              />
            </div>
            {compare && (
              <div>
                <p className="lab-kicker">LATER MOMENT / +2 SECONDS</p>
                <Field
                  pathway={pathway}
                  progress={Math.min(100, (time + 2) * 10)}
                  annotate={annotate}
                />
              </div>
            )}
          </div>
          <label className="lab-slider-label">
            Review timeline <span>{time.toFixed(1)} seconds</span>
            <input
              type="range"
              aria-label="Review timeline"
              min="0"
              max="10"
              step="0.1"
              value={time}
              onChange={(e) => {
                setPlaying(false);
                setTime(Number(e.target.value));
              }}
            />
          </label>
          <div className="lab-player-controls">
            <button
              className="lab-button primary"
              onClick={() => {
                if (time >= 10) setTime(0);
                setPlaying(!playing || time >= 10);
              }}
            >
              {active ? "Pause illustration" : "Play illustration"}
            </button>
            <button
              className="lab-button"
              onClick={() => {
                setPlaying(false);
                setTime(Math.max(0, Math.round((time - 0.1) * 10) / 10));
              }}
            >
              −0.1s
            </button>
            <button
              className="lab-button"
              onClick={() => {
                setPlaying(false);
                setTime(Math.min(10, Math.round((time + 0.1) * 10) / 10));
              }}
            >
              +0.1s
            </button>
            <label>
              Speed
              <select
                aria-label="Playback speed"
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
              >
                <option value={0.5}>0.5×</option>
                <option value={1}>1×</option>
                <option value={1.5}>1.5×</option>
              </select>
            </label>
          </div>
          <p className="lab-fine">
            A synthetic field animation, not athlete footage. The controls step
            the authored timeline, not video frames. Comparison shows different
            moments, not measured improvement.
          </p>
        </section>
        <aside className="lab-panel lab-feedback-panel">
          <p className="lab-kicker">COACHING CONVERSATION / SAMPLE</p>
          <h2>A more useful second look.</h2>
          <p className="lab-muted">
            Fictional feedback for this illustration. These notes were not
            submitted by Coach Tae.
          </p>
          <div className="lab-timestamp-list">
            {filmComments.map((comment) => (
              <button
                key={comment.time}
                aria-label={`Jump to ${comment.time} seconds: ${comment.title}`}
                onClick={() => {
                  setPlaying(false);
                  setTime(comment.time);
                }}
                aria-pressed={time === comment.time}
              >
                <span>00:0{comment.time}</span>
                <div>
                  <strong>{comment.title}</strong>
                  <p>{comment.text}</p>
                </div>
              </button>
            ))}
          </div>
          <div className="lab-next-rep">
            <p className="lab-kicker">THE NEXT CONVERSATION</p>
            <h3>Describe. Then ask.</h3>
            <p>
              Use the field study to practice describing the picture. Bring
              scheme-specific questions to a qualified coach.
            </p>
            <a className="lab-text-link" href="/qb-lab/iq">
              Open the field study →
            </a>
          </div>
        </aside>
      </div>
      <section className="lab-bottom-grid">
        <div className="lab-panel">
          <p className="lab-kicker">COMPARE WITH PURPOSE</p>
          <h2>Context before conclusions.</h2>
          <p>
            A future coach-led comparison would keep camera angle, task and
            timing in view. This preview compares only two moments in the same
            synthetic illustration.
          </p>
          <button className="lab-button" onClick={() => setCompare(!compare)}>
            {compare ? "Return to single view" : "Open comparison layout"}
          </button>
        </div>
        <div className="lab-panel">
          <p className="lab-kicker">BUILT AROUND TRUST</p>
          <h2>Your film is personal.</h2>
          <p>
            Real uploads stay unavailable here. Private access, verified
            guardian consent, retention and deletion controls must be
            implemented and tested before any athlete film is accepted.
          </p>
          <span className="lab-chip">NO FILES COLLECTED</span>
        </div>
      </section>
      <dialog
        ref={dialog}
        className="lab-dialog"
        aria-labelledby="submission-title"
      >
        <div className="lab-card-top">
          <span className="lab-kicker">SUBMISSION PREVIEW</span>
          <button
            className="lab-close"
            aria-label="Close submission preview"
            onClick={() => dialog.current?.close()}
          >
            ×
          </button>
        </div>
        <h2 id="submission-title">Give the review a purpose.</h2>
        <p>
          Choose a synthetic clip to try the workflow. File selection, camera
          access and uploads are unavailable.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setQueued({ clip, focus });
            dialog.current?.close();
          }}
        >
          <div className="lab-demo-dropzone">
            <span aria-hidden="true">▷</span>
            <strong>Illustrated clips only</strong>
            <small>No personal footage or information is accepted.</small>
          </div>
          <label>
            Demo clip
            <select
              aria-label="Demo clip"
              value={clip}
              onChange={(e) => setClip(e.target.value)}
            >
              <option>Alignment study</option>
              <option>Rotation study</option>
            </select>
          </label>
          <label>
            Review focus
            <select
              aria-label="Review focus"
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
            >
              <option>Describe the alignment</option>
              <option>Observe defender movement</option>
            </select>
          </label>
          <label className="lab-inline-check">
            <input type="checkbox" required /> I understand this is a local
            demonstration.
          </label>
          <button className="lab-button primary full" type="submit">
            Queue synthetic review →
          </button>
        </form>
      </dialog>
    </>
  );
}
