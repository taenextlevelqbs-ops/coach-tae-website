"use client";
import { useEffect, useState } from "react";
import { Field } from "../Field";
import { demoRoster, type AthleteId, type DemoSubmission } from "./model";
const feedbackTags = [
  "Check safety depth",
  "Reset your base",
  "Review your release",
];
export function FilmVault({
  submissions,
  onSubmit,
  onReview,
}: {
  submissions: DemoSubmission[];
  onSubmit: (player: AthleteId) => void;
  onReview: (
    id: string,
    feedback: DemoSubmission["feedback"],
    marks: DemoSubmission["marks"],
  ) => void;
}) {
  const [view, setView] = useState<"coach" | "athlete">("coach");
  const [player, setPlayer] = useState<AthleteId>("B");
  const [selected, setSelected] = useState("");
  const [notice, setNotice] = useState("");
  const [dragging, setDragging] = useState(false);
  const visible = submissions.filter(
    (s) =>
      s.coach === "coach-demo" && (view === "coach" || s.player === player),
  );
  const current = visible.find((s) => s.id === selected) ?? visible[0];
  return (
    <>
      <div className="coach-section-title">
        <div>
          <p className="coach-eyebrow">PRIVATE BY DESIGN</p>
          <h2>Film Vault</h2>
          <p>
            Synthetic review workflow. Authentication, consent and real storage
            remain disabled.
          </p>
        </div>
        <div className="coach-segment" aria-label="Film demonstration view">
          <button
            aria-pressed={view === "coach"}
            onClick={() => setView("coach")}
          >
            Coach view
          </button>
          <button
            aria-pressed={view === "athlete"}
            onClick={() => setView("athlete")}
          >
            Athlete view
          </button>
        </div>
      </div>
      {view === "athlete" ? (
        <section className="coach-card">
          <div className="coach-section-title">
            <div>
              <h3>Send a rep to Coach Tae</h3>
              <p>One rep. One coaching conversation.</p>
            </div>
            <label>
              Demonstration athlete
              <select
                aria-label="Submission demo athlete"
                value={player}
                onChange={(e) => setPlayer(e.target.value as AthleteId)}
              >
                {demoRoster.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} · synthetic
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div
            className={`coach-dropzone ${dragging ? "is-dragging" : ""}`}
            role="group"
            aria-label="Synthetic video submission"
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              setNotice(
                "Real files are not accepted. No file was read or uploaded. Use the demo submission button.",
              );
            }}
          >
            <span className="coach-upload-symbol" aria-hidden="true">
              ↑
            </span>
            <h3>Your next coaching moment starts here.</h3>
            <p>
              In the connected application, you’ll choose or drop a video here.
            </p>
            <p>
              <strong>Strictly private:</strong> only the uploading player and
              assigned coach may view a ready video after server authorization.
            </p>
            <button
              className="coach-primary"
              disabled={submissions.length >= 20}
              onClick={() => {
                onSubmit(player);
                setNotice(
                  "Synthetic submission created. No video file was collected or uploaded.",
                );
              }}
            >
              Try a demo submission
            </button>
            <p className="coach-small">
              Real uploads are disabled. Please don’t drop personal videos. Demo
              queue limit: 20.
            </p>
          </div>
          <p role="status" aria-label="Submission result">
            {notice}
          </p>
          <h3>Your demonstration submissions</h3>
          {visible.length ? (
            <ul className="coach-submission-list">
              {visible.map((s) => (
                <li key={s.id}>
                  <strong>Illustrated rep · {s.status}</strong>
                  <span className="coach-private">
                    Private · player {s.player} + coach-demo
                  </span>
                  {s.feedback.map((f, i) => (
                    <p key={i}>
                      {f.time.toFixed(1)}s · {f.tag} · synthetic coaching note
                    </p>
                  ))}
                </li>
              ))}
            </ul>
          ) : (
            <p>No submissions for this demo athlete.</p>
          )}
        </section>
      ) : (
        <div className="coach-film-layout">
          <aside className="coach-card">
            <div className="coach-section-title">
              <h3>Review queue</h3>
              <span className="coach-pill">
                {visible.filter((s) => s.status === "Awaiting review").length}{" "}
                awaiting
              </span>
            </div>
            {!visible.length ? (
              <div className="coach-empty">
                <h3>A clear queue.</h3>
                <p>
                  No synthetic submissions yet. Open Athlete view to try the
                  submission workflow.
                </p>
                <button onClick={() => setView("athlete")}>
                  Open athlete submission
                </button>
              </div>
            ) : (
              <div className="coach-queue">
                {visible.map((s) => (
                  <button
                    aria-pressed={current?.id === s.id}
                    key={s.id}
                    onClick={() => setSelected(s.id)}
                  >
                    <span>
                      Illustrated rep ·{" "}
                      {demoRoster.find((a) => a.id === s.player)?.name}
                    </span>
                    <strong>{s.status}</strong>
                    <span className="coach-private">Private</span>
                  </button>
                ))}
              </div>
            )}
          </aside>
          {current ? (
            <ReviewDesk
              key={current.id}
              submission={current}
              onReview={onReview}
            />
          ) : (
            <section className="coach-card coach-empty">
              <span className="coach-upload-symbol" aria-hidden="true">
                ▷
              </span>
              <h3>Every rep deserves useful feedback.</h3>
              <p>
                Select a synthetic submission to open playback, annotations and
                timestamped coaching notes. No athlete footage is available
                here.
              </p>
            </section>
          )}
        </div>
      )}
    </>
  );
}
function ReviewDesk({
  submission,
  onReview,
}: {
  submission: DemoSubmission;
  onReview: (
    id: string,
    feedback: DemoSubmission["feedback"],
    marks: DemoSubmission["marks"],
  ) => void;
}) {
  const [time, setTime] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [marks, setMarks] = useState(submission.marks);
  const [cursor, setCursor] = useState({ x: 50, y: 50 });
  const [tag, setTag] = useState(feedbackTags[0]);
  const [notice, setNotice] = useState("");
  const ended = time >= 10;
  useEffect(() => {
    if (!playing || ended) return;
    const timer = setInterval(
      () => setTime((t) => Math.min(10, t + 0.05 * speed)),
      50,
    );
    return () => clearInterval(timer);
  }, [playing, ended, speed]);
  function mark(x: number, y: number) {
    setMarks((m) => [...m, { x, y, time }].slice(-20));
  }
  return (
    <section className="coach-card">
      <div className="coach-section-title">
        <div>
          <span className="coach-eyebrow">
            ILLUSTRATED REP · DEMO {submission.player}
          </span>
          <h3>See it. Mark it. Coach it.</h3>
        </div>
        <span className="coach-private">Private</span>
      </div>
      <div className="coach-film-canvas">
        <Field
          pathway={submission.player === "A" ? "tackle" : "flag"}
          progress={time * 10}
        />
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="coach-annotation-layer"
          role="img"
          aria-label={`Feedback canvas with ${marks.length} annotations`}
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            mark(
              Math.round(((e.clientX - r.left) / r.width) * 100),
              Math.round(((e.clientY - r.top) / r.height) * 100),
            );
          }}
        >
          {marks.map((m, i) => (
            <circle
              key={i}
              cx={m.x}
              cy={m.y}
              r="3"
              fill="none"
              stroke="#eab308"
              strokeWidth=".7"
            />
          ))}
          <path
            d={`M${cursor.x - 2} ${cursor.y}h4M${cursor.x} ${cursor.y - 2}v4`}
            stroke="#ffffff"
            strokeWidth=".5"
          />
        </svg>
      </div>
      <p className="coach-small">
        Synthetic field illustration, not uploaded video. Click to annotate, or
        use the keyboard marker below. Up to 20 marks per demo review.
      </p>
      <div className="coach-form-row">
        <button
          onClick={() => {
            if (time >= 10) setTime(0);
            setPlaying(!playing);
          }}
        >
          {playing && time < 10 ? "Pause illustration" : "Play illustration"}
        </button>
        <label>
          Playback speed
          <select
            aria-label="Coach playback speed"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
          >
            {[0.5, 1, 1.5, 2].map((s) => (
              <option key={s} value={s}>
                {s}×
              </option>
            ))}
          </select>
        </label>
        <button
          onClick={() => setMarks((m) => m.slice(0, -1))}
          disabled={!marks.length}
        >
          Undo annotation
        </button>
      </div>
      <label>
        Coach film timeline · {time.toFixed(1)}s
        <input
          type="range"
          aria-label="Coach film timeline"
          min="0"
          max="10"
          step="0.1"
          value={time}
          onChange={(e) => {
            setTime(Number(e.target.value));
            setPlaying(false);
          }}
        />
      </label>
      <button
        aria-label="Keyboard annotation marker. Use arrow keys, then Enter to place."
        onKeyDown={(e) => {
          const delta: Record<string, [number, number]> = {
            ArrowLeft: [-2, 0],
            ArrowRight: [2, 0],
            ArrowUp: [0, -2],
            ArrowDown: [0, 2],
          };
          if (delta[e.key]) {
            e.preventDefault();
            setCursor((p) => ({
              x: Math.max(0, Math.min(100, p.x + delta[e.key][0])),
              y: Math.max(0, Math.min(100, p.y + delta[e.key][1])),
            }));
          }
        }}
        onClick={() => mark(cursor.x, cursor.y)}
      >
        Place marker at {cursor.x}, {cursor.y}
      </button>
      <label>
        Coaching feedback
        <select
          aria-label="Coaching feedback"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
        >
          {feedbackTags.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </label>
      <button
        className="coach-primary"
        onClick={() => {
          onReview(
            submission.id,
            [...submission.feedback, { time, tag }].slice(-20),
            marks,
          );
          setNotice(
            "Demo feedback saved to this submission. No message was sent.",
          );
        }}
      >
        Save timestamped demo feedback
      </button>
      <p role="status" aria-label="Coach feedback result">
        {notice}
      </p>
      {submission.feedback.length > 0 && (
        <ul className="coach-submission-list">
          {submission.feedback.map((f, i) => (
            <li key={i}>
              <button
                onClick={() => {
                  setTime(f.time);
                  setPlaying(false);
                }}
              >
                {f.time.toFixed(1)}s · {f.tag}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
