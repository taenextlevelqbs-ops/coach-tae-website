"use client";
import { useEffect, useState } from "react";
import { Field } from "./Field";
import { PathwaySwitch, useDemo } from "./LabShell";
import { questions } from "./demo";
import { recordActivity } from "./platform/store";
import Link from "next/link";
import { ReadSequence } from "./ReadSequence";
import type { ReadFocus } from "./review-model";

export function FootballIQ() {
  const { pathway } = useDemo();
  const [read, setRead] = useState<ReadFocus>("D1");
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [question, setQuestion] = useState(0);
  const [answer, setAnswer] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [responses, setResponses] = useState<Record<number, number>>({});
  const active = playing && progress < 100;
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(
      () => setProgress((p) => Math.min(100, p + 2)),
      100,
    );
    return () => clearInterval(timer);
  }, [active]);
  const finished = Object.keys(responses).length === questions.length;
  const current = questions[question];
  function reset() {
    setRead("D1");
    setProgress(0);
    setPlaying(false);
    setQuestion(0);
    setAnswer(null);
    setSubmitted(false);
    setResponses({});
  }
  return (
    <>
      <div className="lab-page-heading">
        <div>
          <p className="lab-kicker">FOOTBALL IQ / FIELD STUDY 001</p>
          <h1>
            Eyes up.
            <br />
            <em>Read the change.</em>
          </h1>
          <p className="lab-lede">
            A guided observation exercise. Watch the defenders, describe the
            alignment and challenge the first assumption.
          </p>
        </div>
        <PathwaySwitch />
      </div>
      <div className="lab-iq-grid">
        <section className="lab-panel lab-field-panel">
          <div className="lab-card-top">
            <span className="lab-chip">
              {progress < 40 ? "INITIAL PICTURE" : "ILLUSTRATED ROTATION"}
            </span>
            <span>
              {pathway === "flag" ? "5v5 illustration" : "11v11 illustration"}
            </span>
          </div>
          <Field
            pathway={pathway}
            progress={progress}
            routes={read === "routes"}
            focusTarget={read}
          />
          <ReadSequence value={read} onChange={setRead} />
          <div className="lab-legend">
            <span>
              <i className="offense" /> Offense
            </span>
            <span>
              <i /> Defense
            </span>
            <span>Direction of play ↑</span>
          </div>
          <label className="lab-slider-label">
            Illustration timeline <span>{progress}%</span>
            <input
              aria-label="Illustration timeline"
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={(e) => {
                setPlaying(false);
                setProgress(Number(e.target.value));
              }}
            />
          </label>
          <div className="lab-actions">
            <button
              className="lab-button primary"
              onClick={() => {
                if (progress >= 100) setProgress(0);
                setPlaying(!playing || progress >= 100);
              }}
            >
              {playing && progress < 100 ? "Pause rotation" : "Play rotation"}
            </button>
            <button
              className="lab-button"
              onClick={() => {
                setPlaying(false);
                setProgress(progress < 100 ? Math.min(100, progress + 25) : 0);
              }}
            >
              Step illustration
            </button>
            <button className="lab-button" onClick={reset}>
              Start over
            </button>
          </div>
          <p className="lab-fine">
            Movement is authored for teaching. This is not a simulation of a
            guaranteed coverage, legal formation or passing result.
          </p>
        </section>
        <section className="lab-panel lab-question">
          <p className="lab-kicker">
            OBSERVATION {question + 1} / {questions.length}
          </p>
          <div className="lab-question-progress" aria-hidden="true">
            {questions.map((_, i) => (
              <span className={i <= question ? "active" : ""} key={i} />
            ))}
          </div>
          <h2>{current.prompt}</h2>
          <p>{current.detail}</p>
          <fieldset>
            <legend className="lab-sr">Choose your observation</legend>
            {current.answers.map((option, i) => (
              <label
                className={answer === i ? "lab-answer chosen" : "lab-answer"}
                key={option}
              >
                <input
                  type="radio"
                  name="observation"
                  checked={answer === i}
                  disabled={submitted}
                  onChange={() => setAnswer(i)}
                />
                <span>{option}</span>
              </label>
            ))}
          </fieldset>
          {!submitted ? (
            <button
              className="lab-button primary full"
              disabled={answer === null}
              onClick={() => {
                if (answer !== null) {
                  if (question === questions.length - 1)
                    recordActivity("lesson", `observation-${pathway}`);
                  setSubmitted(true);
                  setResponses({ ...responses, [question]: answer });
                }
              }}
            >
              Explain my answer →
            </button>
          ) : (
            <div className="lab-feedback" role="status">
              <strong>
                {answer === current.correct
                  ? "That matches this observation."
                  : "Let’s look more closely."}
              </strong>
              <p>{current.explanation}</p>
            </div>
          )}
          {submitted && question < questions.length - 1 && (
            <button
              className="lab-button primary full"
              onClick={() => {
                setQuestion(question + 1);
                setAnswer(null);
                setSubmitted(false);
                setProgress(question === 0 ? 0 : 100);
                setPlaying(false);
              }}
            >
              Next observation →
            </button>
          )}
          {finished && (
            <div className="lab-completion" role="status">
              <h3>Keep the question. Take it to the field.</h3>
              <p>
                You explored {Object.keys(responses).length} illustrated
                observations in this session. This is not a football IQ rating
                or a measure of playing ability.
              </p>
              <button className="lab-button" onClick={reset}>
                Repeat field study
              </button>
            </div>
          )}
        </section>
      </div>
      <div className="lab-app-toolbar">
        <p>
          Apply the observation process to a playable scenario. Coverage, blitz,
          two-minute and situational curricula are not yet published.
        </p>
        <Link className="lab-button primary" href="/qb-lab/simulator">
          Open playable simulator →
        </Link>
      </div>
      <aside className="lab-callout">
        <span aria-hidden="true">→</span>
        <div>
          <h2>
            {pathway === "flag"
              ? "Flag is its own game."
              : "An alignment is the beginning of a read."}
          </h2>
          <p>
            {pathway === "flag"
              ? "A five-player picture is not an eleven-player defense with fewer icons. League-specific rush, eligibility, contact and clock rules need their own verified context. This exercise only asks about what is drawn."
              : "The exercise distinguishes a visible shell from confirmed coverage assignments. A real decision also depends on the offensive concept, protection, timing, defenders and coaching context."}
          </p>
        </div>
      </aside>
      <details className="lab-panel lab-source-notes">
        <summary>Lesson scope and football review status</summary>
        <p>
          The answer to the first observation is verifiable directly from the
          diagram. The remaining prompts teach caution about interpreting a
          diagram; they do not grade a named coverage or prescribe a throw.
          Position and format distinctions were cross-checked against NFL
          Football Operations and NFL FLAG. Scheme-specific coverage answer keys
          and league-specific scenarios still require qualified coaching review
          before instructional publication.
        </p>
        <p>
          Source references checked for this preview:{" "}
          <a
            href="https://operations.nfl.com/rules-officiating/nfl-football-basics/football-terms"
            target="_blank"
            rel="noopener noreferrer"
          >
            NFL Football Operations glossary (new tab)
          </a>{" "}
          and{" "}
          <a
            href="https://nflflag.com/flag-football-rules"
            target="_blank"
            rel="noopener noreferrer"
          >
            NFL FLAG rules (new tab)
          </a>
          . These sources distinguish player responsibilities and football
          formats; they do not validate this authored animation or endorse the
          exercise. No league-specific rushing distance, pass clock or formation
          legality is scored here.
        </p>
      </details>
    </>
  );
}
