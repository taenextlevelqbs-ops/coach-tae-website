"use client";
import { useEffect, useRef, useState } from "react";
import { ReviewCanvas } from "./ReviewCanvas";
import { Field } from "./Field";
import { ReviewNotes } from "./ReviewNotes";
import { ReviewSubmission } from "./ReviewSubmission";
import { PathwaySwitch, useDemo } from "./LabShell";
import { FilmTimeline } from "./FilmTimeline";
import { ReadSequence } from "./ReadSequence";
import { studyClips, type FilmMoment, type ReadFocus } from "./review-model";

export function FilmReview() {
  const { pathway } = useDemo();
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [annotate, setAnnotate] = useState(true);
  const [compare, setCompare] = useState(false);
  const [selectedClip, setSelectedClip] =
    useState<(typeof studyClips)[number]["id"]>("alignment");
  const [read, setRead] = useState<ReadFocus>("D1");
  const [notebooks, setNotebooks] = useState<
    Record<(typeof studyClips)[number]["id"], FilmMoment[]>
  >({ alignment: [], rotation: [] });
  const moments = notebooks[selectedClip];
  function setMoments(next: FilmMoment[]) {
    setNotebooks((previous) => ({ ...previous, [selectedClip]: next }));
  }
  const [queued, setQueued] = useState<{ clip: string; focus: string } | null>(
    null,
  );
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
  function seek(t: number) {
    setPlaying(false);
    setTime(t);
  }
  const study = studyClips.find((c) => c.id === selectedClip)!;
  return (
    <>
      <div className="lab-page-heading lab-film-heading">
        <div>
          <p className="lab-kicker">REVIEW DESK / SYNTHETIC FILM LIBRARY</p>
          <h1>
            The Film Room<span className="lab-heading-period">.</span>
          </h1>
          <p className="lab-lede">
            Slow it down. Find the detail. Make the next conversation count.
          </p>
        </div>
        <button
          className="lab-button primary"
          onClick={() => dialog.current?.showModal()}
        >
          Prepare a demo submission →
        </button>
      </div>
      <aside className="lab-callout" aria-label="Private upload gate">
        <div>
          <h2>Real uploads are locked</h2>
          <p>
            Authentication, verified guardian consent and private media
            processing are not connected. Do not submit personal videos. The
            review below uses an illustration only.
          </p>
        </div>
      </aside>
      {queued && (
        <div
          className="lab-queue-message"
          role="status"
          aria-label="Review submission status"
        >
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
      <div className="lab-film-console">
        <div className="lab-film-console-bar">
          <span>
            QB LAB <b>/</b> REVIEW CONSOLE
          </span>
          <span>ILLUSTRATED FILM · NOT ATHLETE FOOTAGE</span>
        </div>
        <div className="lab-clip-index" aria-label="Illustrated study library">
          {studyClips.map((c, i) => (
            <button
              key={c.id}
              aria-pressed={selectedClip === c.id}
              aria-label={`Open ${c.title}`}
              onClick={() => {
                setSelectedClip(c.id);
                seek(c.start);
              }}
            >
              <span className="lab-clip-icon" aria-hidden="true">
                {i === 0 ? "◉" : "→"}
              </span>
              <span>
                <strong>{c.title}</strong>
                <small>
                  {i === 0
                    ? "STARTING PICTURE / 00:00"
                    : "CHANGING DEPTH / 00:05"}
                </small>
              </span>
              <span className="lab-clip-duration">10 SEC</span>
            </button>
          ))}
        </div>
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
          <section
            className="lab-film-player"
            aria-label="Illustrated film player"
          >
            <div className="lab-card-top">
              <span className="lab-kicker">
                {study.title.toUpperCase()} /{" "}
                {pathway === "flag" ? "5v5" : "11v11"}
              </span>
              <span className="lab-timecode">
                00:{time.toFixed(1).padStart(4, "0")} <small>/ 00:10.0</small>
              </span>
            </div>
            <ReviewCanvas
              key={selectedClip}
              time={time}
              onPause={() => setPlaying(false)}
              onSeek={seek}
            >
              <div className={compare ? "lab-compare-fields" : ""}>
                <div>
                  {compare && <p className="lab-kicker">EARLIER MOMENT</p>}
                  <Field
                    pathway={pathway}
                    progress={time * 10}
                    annotate={annotate && time >= 4}
                    focusTarget={annotate ? read : undefined}
                  />
                </div>
                {compare && (
                  <div>
                    <p className="lab-kicker">LATER MOMENT / +2 SECONDS</p>
                    <Field
                      pathway={pathway}
                      progress={Math.min(100, (time + 2) * 10)}
                      annotate={annotate}
                      focusTarget={annotate ? read : undefined}
                    />
                  </div>
                )}
              </div>
            </ReviewCanvas>
            <FilmTimeline time={time} onSeek={seek} moments={moments} />
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
              <div className="lab-step-controls">
                <button
                  className="lab-button"
                  onClick={() =>
                    seek(Math.max(0, Math.round((time - 0.1) * 10) / 10))
                  }
                >
                  −0.1s
                </button>
                <button
                  className="lab-button"
                  onClick={() =>
                    seek(Math.min(10, Math.round((time + 0.1) * 10) / 10))
                  }
                >
                  +0.1s
                </button>
              </div>
              <label>
                Playback speed
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
              {study.description} Both studies use the same authored
              illustration with different starting moments. Controls step time,
              not video frames. Comparison shows moments, not improvement.
            </p>
            <ReadSequence value={read} onChange={setRead} />
          </section>
          <ReviewNotes
            key={selectedClip}
            time={time}
            moments={moments}
            onMomentsChange={setMoments}
            onSeek={seek}
          />
        </div>
      </div>
      <aside className="lab-callout">
        <span aria-hidden="true">→</span>
        <div>
          <h2>Context before conclusions.</h2>
          <p>
            Real film needs private access, verified consent and secure
            retention. This review desk accepts no files. Practice describing
            the illustration, then bring scheme-specific questions to a
            qualified coach.
          </p>
          <a className="lab-text-link" href="/qb-lab/iq">
            Continue in the classroom →
          </a>
        </div>
      </aside>
      <ReviewSubmission dialog={dialog} onQueue={setQueued} />
    </>
  );
}
