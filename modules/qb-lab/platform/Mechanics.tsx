"use client";
import { useEffect, useState } from "react";
import { recordActivity } from "./store";
const phases = [
  {
    title: "Setup",
    cue: "Establish the coach-selected stance. The illustration does not prescribe one universal base.",
  },
  {
    title: "Gather",
    cue: "Observe the weight-shift drawing. Actual movement depends on athlete, concept and coach guidance.",
  },
  {
    title: "Step",
    cue: "Inspect the authored lead-step sequence. No joint angles or measurements are inferred.",
  },
  {
    title: "Release illustration",
    cue: "Follow the drawn arm sequence. It is not a biomechanical model or validated throwing technique.",
  },
  {
    title: "Finish & reset",
    cue: "Pause and discuss the movement with a qualified coach before physical practice.",
  },
];
export function Mechanics() {
  const [phase, setPhase] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [view, setView] = useState("side");
  const [mode, setMode] = useState("Setup sequence");
  const [compare, setCompare] = useState(false);
  const [message, setMessage] = useState("");
  const [seen, setSeen] = useState<number[]>([0]);
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setPhase((p) => {
        const next = (p + 1) % 5;
        return next;
      });
    }, 900);
    return () => clearInterval(id);
  }, [playing]);
  const shift =
    mode === "Pocket movement" ? Math.sin(phase * 1.2) * 45 : phase * 8;
  const arm = [
    [205, 160],
    [220, 125],
    [235, 110],
    [275, 140],
    [250, 190],
  ][phase];
  return (
    <>
      <div className="lab-page-heading">
        <div>
          <p className="lab-kicker">MECHANICS STUDIO / AUTHORED 2D MOTION</p>
          <h1>Slow the sequence down.</h1>
          <p className="lab-lede">
            An animated phase illustration. No motion capture, joint
            measurement, physical assessment or 3D avatar is implemented.
          </p>
        </div>
      </div>
      <div className="lab-app-toolbar">
        <label>
          Movement study
          <select
            aria-label="Movement study"
            value={mode}
            onChange={(e) => {
              setMode(e.target.value);
              setPhase(0);
              setSeen([0]);
              setMessage("");
            }}
          >
            <option>Setup sequence</option>
            <option>Pocket movement</option>
          </select>
        </label>
        <label>
          2D view
          <select
            aria-label="Mechanics view"
            value={view}
            onChange={(e) => setView(e.target.value)}
          >
            <option value="side">Side illustration</option>
            <option value="front">Front illustration</option>
          </select>
        </label>
      </div>
      <div className="lab-simulator-grid">
        <section className="lab-simulator-stage">
          <svg
            viewBox="0 0 500 360"
            className="lab-mechanics-avatar"
            role="img"
            aria-label={`${view} 2D ${mode}, phase ${phase + 1}: ${phases[phase].title}. Authored positions, not biomechanical measurements.`}
          >
            <path d="M30 320H470" stroke="#bfd6de" strokeWidth="2" />
            {compare && (
              <g opacity=".3" aria-hidden="true">
                <circle cx="210" cy="90" r="23" fill="#f0c77a" />
                <path
                  d="M210 115L220 200L180 300M220 200L250 300M210 135L205 160L230 175M210 140L175 165L190 180"
                  fill="none"
                  stroke="#f0c77a"
                  strokeWidth="15"
                  strokeLinecap="round"
                />
              </g>
            )}
            <g transform={`translate(${shift} 0)`}>
              <circle cx="210" cy="90" r="23" fill="#e7eddf" />
              <path
                d={`M210 115L${view === "front" ? 210 : 220} 200L${180 - phase * 4} 300M220 200L${250 + phase * 8} 300M210 135L${arm[0]} ${arm[1]}L${arm[0] + 25} ${arm[1] + 15}M210 140L175 165L190 180`}
                fill="none"
                stroke="#7bd3f0"
                strokeWidth="15"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <ellipse
                cx={arm[0] + 28}
                cy={arm[1] + 14}
                rx="17"
                ry="10"
                fill="#e8c784"
              />
            </g>
            <text x="25" y="345" fill="#bfd6de" fontSize="12">
              SCHEMATIC PHASE DEMO / NO TECHNIQUE VALIDATION
            </text>
          </svg>
          <label className="lab-slider-label">
            Movement phase
            <input
              aria-label="Movement phase"
              type="range"
              min="0"
              max="4"
              step="1"
              value={phase}
              onChange={(e) => {
                const p = Number(e.target.value);
                setPlaying(false);
                setPhase(p);
                setSeen((s) => [...new Set([...s, p])]);
              }}
            />
          </label>
          <div className="lab-actions">
            <button
              className="lab-button"
              aria-pressed={compare}
              onClick={() => setCompare(!compare)}
            >
              {compare ? "Hide setup comparison" : "Compare with setup"}
            </button>
            <button
              className="lab-button primary"
              onClick={() => setPlaying(!playing)}
            >
              {playing ? "Pause movement" : "Play movement"}
            </button>
            <button
              className="lab-button"
              onClick={() => {
                const next = (phase + 1) % 5;
                setPlaying(false);
                setPhase(next);
                setSeen((s) => [...new Set([...s, next])]);
              }}
            >
              Next phase
            </button>
            <button
              className="lab-button"
              onClick={() => {
                setPlaying(false);
                setPhase(0);
              }}
            >
              Replay from setup
            </button>
          </div>
        </section>
        <aside className="lab-panel">
          <p className="lab-fine">
            {compare
              ? "Amber ghost: the initial setup phase, compared with the current authored phase. This is not measured improvement."
              : "Compare any phase against the original setup drawing."}
          </p>
          <p className="lab-kicker">
            PHASE {phase + 1} / {phases.length}
          </p>
          <h2>{phases[phase].title}</h2>
          <p>{phases[phase].cue}</p>
          <ol className="lab-phase-list">
            {phases.map((p, i) => (
              <li key={p.title}>
                <button
                  className="lab-button"
                  aria-pressed={phase === i}
                  onClick={() => {
                    setPhase(i);
                    setPlaying(false);
                    setSeen((s) => [...new Set([...s, i])]);
                  }}
                >
                  {p.title}
                </button>
              </li>
            ))}
          </ol>
          <p>
            Manually inspect all five phases to record this review. This records
            interaction, not physical training.
          </p>
          <button
            className="lab-button"
            disabled={seen.length < 5 || message !== ""}
            onClick={() => {
              recordActivity("mechanics", mode);
              setMessage(
                "Illustration review recorded locally. No mechanics score was generated.",
              );
            }}
          >
            Record phase review
          </button>
          <p role="status">{message}</p>
          <div className="lab-safety-note">
            Coaching review required before using this as physical instruction.
            No medical, shoulder-health or rehabilitation prescription. Stop
            physical activity for pain or discomfort.
          </div>
        </aside>
      </div>
    </>
  );
}
