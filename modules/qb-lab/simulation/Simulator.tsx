"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { PathwaySwitch, useDemo } from "../LabShell";
import { useLocalLab, recordActivity } from "../platform/store";
import { scenarios } from "./scenarios";
import { advance, evaluate, moveQB } from "./engine";
import {
  duration,
  type Decision,
  type Format,
  type Point,
  type Scenario,
} from "./model";
import { RecognitionLab } from "../football/RecognitionLab";
import { SimField } from "./SimField";
export function Simulator() {
  const { pathway } = useDemo();
  const [flag, setFlag] = useState<"flag5" | "flag7" | "flag8">("flag5");
  const format = pathway === "tackle" ? "tackle" : flag;
  return (
    <>
      <div className="lab-page-heading">
        <div>
          <p className="lab-kicker">QB SIMULATOR 2.0</p>
          <h1>Read. Move. Decide.</h1>
          <p className="lab-lede">
            Control the QB, follow the routes and test a specific spacing
            decision. Synthetic geometry, not an athlete evaluation.
          </p>
        </div>
        <PathwaySwitch />
      </div>
      <RecognitionLab />
      <h2>Open spacing practice</h2>
      {pathway === "flag" && (
        <label className="lab-format-label">
          Flag roster
          <select
            aria-label="Flag roster"
            value={flag}
            onChange={(e) => setFlag(e.target.value as typeof flag)}
          >
            <option value="flag5">5v5 · league rules not configured</option>
            <option value="flag7">7v7 · league rules not configured</option>
            <option value="flag8">8v8 · league rules not configured</option>
          </select>
        </label>
      )}
      <SimulationDesk key={format} format={format} />
    </>
  );
}
function SimulationDesk({ format }: { format: Format }) {
  const { profile } = useDemo();
  const { state, message: storageMessage } = useLocalLab();
  const available = scenarios.filter((s) => s.format === format);
  const [selected, setSelected] = useState(available[0].id);
  const [time, setTime] = useState(0);
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [qb, setQB] = useState<Point>({ x: 50, y: 85 });
  const [decision, setDecision] = useState<Decision | null>(null);
  const authored = available.find((s) => s.id === selected) ?? available[0];
  const saved = state.plays.find(
    (p) => p.id === selected && p.format === format,
  );
  const scenario: Scenario = saved
    ? {
        ...authored,
        id: saved.id,
        title: saved.name,
        play: saved,
        context:
          "User-drawn prototype play. No coach validation or league legality is inferred.",
      }
    : authored;
  const active = started && playing && time < duration && !decision;
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(
      () => setTime((t) => advance(t, 0.05, speed)),
      50,
    );
    return () => clearInterval(timer);
  }, [active, speed]);
  function reset(play = scenario.play) {
    setTime(0);
    setStarted(false);
    setPlaying(false);
    setQB(
      moveQB(
        play.players.find((p) => p.id === "QB")?.start ?? { x: 50, y: 85 },
        0,
        0,
      ),
    );
    setDecision(null);
  }
  function move(dx: number, dy: number) {
    if (!decision) setQB((p) => moveQB(p, dx, dy));
  }
  function choose(target: string) {
    if (decision || !started) return;
    const result = evaluate(scenario, target, time, qb);
    setDecision(result);
    setPlaying(false);
    recordActivity("simulation", scenario.id, result.points, profile.id);
  }
  return (
    <>
      <div className="lab-app-toolbar">
        <label>
          Scenario or saved play
          <select
            aria-label="Simulation scenario"
            value={selected}
            onChange={(e) => {
              setSelected(e.target.value);
              reset(
                state.plays.find((p) => p.id === e.target.value) ??
                  available.find((s) => s.id === e.target.value)?.play,
              );
            }}
          >
            {available.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
            {state.plays
              .filter((p) => p.format === format)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  My play: {p.name}
                </option>
              ))}
          </select>
        </label>
        <p>{scenario.focus}</p>
        <Link className="lab-text-link" href="/qb-lab/playbook">
          Build a play →
        </Link>
      </div>
      <div className="lab-simulator-grid">
        <section className="lab-simulator-stage">
          <div className="lab-card-top">
            <span className="lab-kicker">
              {format.toUpperCase()} /{" "}
              {started ? "POST-SNAP" : "PRE-SNAP INSPECTION"}
            </span>
            <strong className="lab-clock">{time.toFixed(1)} / 6.0s</strong>
          </div>
          <div
            tabIndex={0}
            className="lab-qb-control"
            aria-label="Quarterback movement area. Use arrow keys or W A S D."
            onKeyDown={(e) => {
              const directions: Record<string, [number, number]> = {
                ArrowLeft: [-2, 0],
                a: [-2, 0],
                ArrowRight: [2, 0],
                d: [2, 0],
                ArrowUp: [0, -2],
                w: [0, -2],
                ArrowDown: [0, 2],
                s: [0, 2],
              };
              const delta = directions[e.key];
              if (delta) {
                e.preventDefault();
                move(...delta);
              }
            }}
          >
            <SimField
              players={scenario.play.players}
              defenders={scenario.defenders}
              time={time}
              qb={qb}
            />
          </div>
          <div className="lab-app-toolbar">
            <button
              className="lab-button primary"
              disabled={!!decision || time >= duration}
              onClick={() => {
                setStarted(true);
                setPlaying(!active);
              }}
            >
              {active ? "Pause play" : started ? "Resume play" : "Snap & play"}
            </button>
            <button className="lab-button" onClick={() => reset()}>
              Restart rep
            </button>
            <label>
              Simulation speed
              <select
                aria-label="Simulation speed"
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
              >
                <option value={0.5}>0.5×</option>
                <option value={1}>1×</option>
                <option value={2}>2×</option>
              </select>
            </label>
          </div>
          <label className="lab-slider-label">
            Inspect timeline <span>{time.toFixed(1)} seconds</span>
            <input
              aria-label="Simulation timeline"
              type="range"
              min="0"
              max="6"
              step="0.1"
              value={time}
              disabled={!!decision}
              onChange={(e) => {
                setTime(Number(e.target.value));
                setPlaying(false);
                setStarted(true);
              }}
            />
          </label>
          <div
            className="lab-touch-pad"
            aria-label="Touch quarterback controls"
          >
            <button
              aria-label="Move quarterback left"
              disabled={!!decision}
              onClick={() => move(-2, 0)}
            >
              ←
            </button>
            <button
              aria-label="Move quarterback forward"
              disabled={!!decision}
              onClick={() => move(0, -2)}
            >
              ↑
            </button>
            <button
              aria-label="Move quarterback back"
              disabled={!!decision}
              onClick={() => move(0, 2)}
            >
              ↓
            </button>
            <button
              aria-label="Move quarterback right"
              disabled={!!decision}
              onClick={() => move(2, 0)}
            >
              →
            </button>
            <output aria-label="Quarterback coordinates">
              QB {qb.x}, {qb.y}
            </output>
          </div>
          <p className="lab-fine">
            Move the schematic QB inside the bounded practice area (X 30–70, Y
            74–94). A saved QB start is constrained to those bounds. This is not
            protection or pocket safety instruction. No ball-flight, pass-rush,
            collision or catch simulation is implemented.
          </p>
        </section>
        <aside className="lab-panel">
          <p className="lab-kicker">DECISION DESK</p>
          <h2>{decision ? "Review the decision." : "Choose what you see."}</h2>
          <p>
            Inspect freely before the snap. Choose a drawn route between 1.5 and
            6 seconds. Timing is a demo constraint, not a league pass clock.
          </p>
          <div className="lab-target-grid">
            {scenario.play.players
              .filter(
                (p) =>
                  p.id !== "QB" && p.eligible !== false && p.route.length > 0,
              )
              .map((p) => (
                <button
                  className="lab-button"
                  key={p.id}
                  disabled={
                    !started || time < 1.5 || !!decision || time >= duration
                  }
                  onClick={() => choose(p.id)}
                >
                  Target {p.label}
                </button>
              ))}
          </div>
          {time >= duration && !decision && (
            <button className="lab-button" onClick={() => choose("timeout")}>
              Record expired window
            </button>
          )}
          {decision && (
            <div
              className="lab-feedback"
              role="status"
              aria-label="Simulation decision"
            >
              <h3>{decision.points} / 2 geometry checks</h3>
              <p>{decision.feedback}</p>
              <p>
                Result recorded in the local workspace. It is not a QB rating.
              </p>
            </div>
          )}
          <p className="lab-fine">{storageMessage}</p>
          <details>
            <summary>Exact scoring rubric and limits</summary>
            <p>
              One point if the nearest defender is at least 12 schematic units
              from the chosen target at decision time; one if that target is
              ahead of the controlled QB. No points before the observation
              window or after expiry. Paths and defender motion are authored and
              deterministic. These are executable fixture checks, not a
              validated coaching decision key.
            </p>
          </details>
          <p className="lab-fine">
            {scenario.context} Scenario suitability, full coverage labels and
            coaching answer keys still require qualified review.
          </p>
          <Link className="lab-text-link" href="/qb-lab/progress">
            See actual local history →
          </Link>
        </aside>
      </div>
    </>
  );
}
