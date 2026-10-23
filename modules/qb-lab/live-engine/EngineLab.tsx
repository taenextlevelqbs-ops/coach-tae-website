"use client";
import { defaultTactics, type HashSpot, type Side } from "../football/geometry";
import { sharedPlay } from "./roster";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import type { Play } from "../simulation/model";
import { useDemo } from "../LabShell";
import { recordActivity, useLocalLab } from "../platform/store";
import { fronts, personnelGroups, coverages } from "../football/content";
import { gameFormats, type GameFormat } from "./formats";
import { defaultConfig } from "./defaults";
import { createEngine } from "./engine";
import { advanceRep, beginRep, buildReplay, replayAt, type RecordedRep } from "./replay";
import { validateConfig } from "./roster";
import { coaching, recommendedLesson } from "./coaching";
import { report } from "./report";
import { pocketWindow, throwEstimate } from "./assessment";
import { PocketCheck } from "./PocketCheck";
import { EngineField } from "./EngineField";
import { EngineReplay } from "./EngineReplay";
import { acceptanceScenarios } from "./acceptance";
import {
  rushMoves,
  type EngineConfig,
  type Input,
} from "./types";
const names: Record<GameFormat, string> = {
  tackle11: "11v11 tackle",
  passing7: "Non-contact passing 7v7",
  flag5: "5v5 flag",
  flag7: "7v7 flag",
  flag8: "8v8 flag",
};
const subscribeReady = () => () => {};
const clientReady = () => true;
const serverReady = () => false;
export function EngineLab({ initialPlayId, initialMode = "learn" }: { initialPlayId?: string; initialMode?: EngineConfig["mode"] } = {}) {
  const { profile } = useDemo();
  const { state } = useLocalLab();
  const play = state.plays.find((p) => p.id === initialPlayId);
  const ready = useSyncExternalStore(subscribeReady, clientReady, serverReady);
  if (initialPlayId && ready && !play)
    return (
      <section role="alert">
        <h1>Saved play unavailable</h1>
        <p>
          This play is not saved on this device. No substitute formation was
          launched.
        </p>
        <Link href="/qb-lab/playbook">Open Playbook Studio</Link>
      </section>
    );
  return (
    <EngineDesk
      key={`${profile.id}:${initialMode}:${initialPlayId ?? ""}:${play ? JSON.stringify(play) : "default"}`}
      initialPlay={play}
      initialMode={initialMode}
    />
  );
}
function EngineDesk({ initialPlay, initialMode }: { initialPlay?: Play; initialMode: EngineConfig["mode"] }) {
  const hydrated = useSyncExternalStore(
    subscribeReady,
    clientReady,
    serverReady,
  );
  const { profile } = useDemo();
  const { state: local } = useLocalLab();
  const [config, setConfig] = useState<EngineConfig>(() =>
    initialPlay
      ? {
          ...defaultConfig(
            initialPlay.format === "tackle" ? "tackle11" : initialPlay.format,
          ),
          play: initialPlay,
          mode: initialMode,
        }
      : { ...defaultConfig(), mode: initialMode },
  );
  const [rep, setRep] = useState<RecordedRep | null>(null);
  const sim = rep?.state ?? null;
  const [reviewTick, setReviewTick] = useState<number | null>(null);
  const [reviewPlaying, setReviewPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const replay = useMemo(() => rep?.state.phase === "done" ? buildReplay(rep) : null, [rep]);
  const reviewed = useMemo(() => replay && reviewTick !== null ? replayAt(replay, reviewTick) : null, [replay, reviewTick]);
  const [running, setRunning] = useState(false);
  const [hypothesis, setHypothesis] = useState("");
  const [recorded, setRecorded] = useState(false);
  const [exampleId, setExampleId] = useState("");
  const [reference, setReference] = useState(false);
  const example = acceptanceScenarios.find(e => e.id === exampleId);
  const [placement, setPlacement] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const advancedSettings = useRef<HTMLDetailsElement>(null);
  const fieldViewport = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = fieldViewport.current;
    if (zoom && el) {
      el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
      el.scrollTop = el.scrollHeight - el.clientHeight;
    }
  }, [zoom]);
  const held = useRef<Input["move"]>({ x: 0, y: 0 });
  useEffect(() => {
    const pause = () => {
      held.current = { x: 0, y: 0 };
      setRunning(false);
      setReviewPlaying(false);
    };
    window.addEventListener("qb-lab:pause-simulator", pause);
    return () => window.removeEventListener("qb-lab:pause-simulator", pause);
  }, []);
  const errors = validateConfig(config);
  const staged = useMemo(() => validateConfig(config).length ? null : createEngine(config), [config]);
  const s = reviewed ?? sim ?? staged;
  const locked = !!sim || !hydrated;
  const phase = sim?.phase;
  const canStep = !!sim && sim.phase !== "done" && sim.phase !== "ready" && reviewTick === null;
  function change(p: Partial<EngineConfig>) {
    setExampleId("");
    setConfig((c) => ({ ...c, ...p }));
    setRecorded(false);
  }
  function rule(p: Partial<EngineConfig["rules"]>) {
    setExampleId("");
    setConfig((c) => ({
      ...c,
      rules: { ...c.rules, ...p, acknowledged: c.rules.format === "tackle11" },
    }));
  }
  useEffect(() => {
    if (!running || !phase || phase === "done") return;
    // Every scheduled update advances exactly one tick. Slow scheduling slows play, never skips collisions.
    const timer = setInterval(
      () => setRep((p) => (p ? advanceRep(p, 1, { move: held.current }) : p)),
      1000 / (30 * speed),
    );
    return () => clearInterval(timer);
  }, [running, phase, speed]);
  useEffect(() => {
    const clear = () => {
      held.current = { x: 0, y: 0 };
    };
    window.addEventListener("blur", clear);
    return () => window.removeEventListener("blur", clear);
  }, []);
  function reset() {
    setRunning(false);
    held.current = { x: 0, y: 0 };
    setRep(null);
    setReviewTick(null);
    setReviewPlaying(false);
    setReference(false);
    setRecorded(false);
  }
  function start() {
    if (staged && hydrated) {
      setRep(beginRep(config));
      setReference(false);
      setRunning(config.mode !== "learn");
      setRecorded(false);
      if (
        window.matchMedia?.("(max-height: 500px) and (orientation: landscape)")
          ?.matches
      ) {
        fieldViewport.current?.previousElementSibling?.scrollIntoView({
          block: "start",
        });
      }
    }
  }
  function nudge(x: number, y: number) {
    if (canStep)
      setRep((p) => (p ? advanceRep(p, 6, { move: { x, y } }) : p));
  }
  function decide(input: Input) {
    if (canStep) setRep((p) => (p ? advanceRep(p, 1, input) : p));
  }
  useEffect(() => {
    if (!reviewPlaying || !replay || reviewTick === null || reviewTick >= replay.rep.inputs.length) return;
    const timer = setInterval(() => setReviewTick(t => t === null ? null : Math.min(replay.rep.inputs.length, t + 1)), 1000 / (30 * speed));
    return () => clearInterval(timer);
  }, [reviewPlaying, replay, reviewTick, speed]);
  const done = s?.phase === "done";
  const recommendation = sim ? recommendedLesson(sim) : null;
  return (
    <>
      <header className="train-header">
        <Link href="/qb-lab/simulator" className="train-back">← QB Simulator</Link>
        <h1>{config.mode === "learn" ? "Learn" : config.mode === "practice" ? "Practice" : "Challenge preview"}</h1>
        <p>Look at the defense. Move your feet. Choose your throw.</p>
      </header>
      <section className="engine-lab" aria-label="Live pocket engine">
        {!hydrated && (
          <p role="status" aria-label="Engine readiness">
            Preparing interactive controls. JavaScript is required for the live
            engine.
          </p>
        )}
        <div className="engine-title">
          <div>
            <h2>{config.mode === "learn" ? "One play at a time" : "Your next rep"}</h2>
            <p>
              {config.mode === "learn"
                ? "Make an observation, snap the ball, then use Step to watch what happens. There's no rush to answer."
                : config.mode === "practice"
                  ? "Make an observation, then snap and play. Pause whenever you need to look again."
                  : "Continuous practice preview. Scoring and a challenge curriculum are not implemented."}
            </p>
          </div>
          <span>Demo athlete {profile.name} · local only</span>
        </div>
        <p className="train-demo-note">Guided starter for youth and beginners. Older or experienced quarterbacks can change coverage, protection and event rules in Advanced Settings. These are synthetic teaching examples awaiting Coach Tae’s review.</p>
        {config.play && <p role="status">Current play: {config.play.name}. Its alignment and routes are loaded for this rep.</p>}
        <fieldset disabled={locked} className="engine-config engine-starter">
          <legend>Choose your practice</legend>
          <label>Practice example
            <select aria-label="Authored practice setup" value={exampleId} onChange={e => {
              const selected = acceptanceScenarios.find(item => item.id === e.target.value);
              setExampleId(e.target.value);
              setConfig(selected
                ? { ...structuredClone(selected.config), mode: config.mode }
                : {
                    ...defaultConfig(initialPlay
                      ? initialPlay.format === "tackle" ? "tackle11" : initialPlay.format
                      : "tackle11"),
                    ...(initialPlay ? { play: initialPlay } : {}),
                    mode: config.mode,
                  });
              setHypothesis("");
            }}>
              <option value="">{initialPlay ? "Your saved play" : "Starter rep · look, move and throw"}</option>
              {acceptanceScenarios.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
            </select>
          </label>
          {example && <div><p>{example.intent}</p><p>Synthetic reference · Coach Tae review pending. Play it yourself or inspect the recorded inputs.</p>
            <button type="button" onClick={() => {
              let recordedRep = beginRep(example.config);
              const inputs = new Map(example.inputs.map(event => [event.tick, event.input]));
              for (let tick = 1; tick <= example.ticks && recordedRep.state.phase !== "done"; tick++) recordedRep = advanceRep(recordedRep, 1, inputs.get(tick) ?? {});
              setRep(recordedRep); setRunning(false); setReference(true); setRecorded(false); setReviewTick(0); setReviewPlaying(false);
              setHypothesis("Reference rep · no athlete prediction");
            }}>Inspect reference rep</button>
          </div>}
          <label>
            Your possible coverage
            <select
              value={hypothesis}
              onChange={(e) => setHypothesis(e.target.value)}
            >
              <option value="">Make an observation</option>
              <option>Cannot confirm from alignment</option>
              {coverages.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <p>What might the defense do? It is okay to choose “Cannot confirm from alignment.” Watch the play to find out.</p>
        </fieldset>
        <details ref={advancedSettings} className="engine-call engine-advanced" open={advanced} onToggle={e => setAdvanced(e.currentTarget.open)}>
          <summary>Advanced Settings</summary>
          <p>Optional coaching tools. Starter tackle rules are already set. Flag and passing 7v7 require separate event rules and confirmation before play.</p>
        <fieldset disabled={locked} className="engine-config">
          <legend>Before the snap</legend>
          <label>
            Game environment
            <select
              value={config.rules.format}
              onChange={(e) => {
                setConfig(c => ({ ...defaultConfig(e.target.value as GameFormat), mode: c.mode }));
                setExampleId("");
                setHypothesis("");
              }}
            >
              {gameFormats.map((f) => (
                <option key={f} value={f}>
                  {names[f]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Learning mode
            <select
              value={config.mode}
              onChange={(e) =>
                change({ mode: e.target.value as EngineConfig["mode"] })
              }
            >
              <option value="learn">Learn · paused, step through</option>
              <option value="practice">Practice · continuous rep</option>
              <option value="challenge">
                Challenge preview · unscored live rep
              </option>
            </select>
          </label>
          {config.rules.format === "tackle11" && (
            <>
              <label>
                Ball hash
                <select
                  aria-label="Engine ball hash"
                  value={config.play?.tactics?.hash ?? "middle"}
                  onChange={(e) => {
                    const p = sharedPlay(config);
                    change({
                      play: {
                        ...p,
                        tactics: {
                          ...(p.tactics ?? defaultTactics),
                          hash: e.target.value as HashSpot,
                        },
                      },
                    });
                  }}
                >
                  <option value="left">Left hash</option>
                  <option value="middle">Middle</option>
                  <option value="right">Right hash</option>
                </select>
              </label>
              <label>
                Declared strong side
                <select
                  value={config.play?.tactics?.strongSide ?? "right"}
                  onChange={(e) => {
                    const p = sharedPlay(config);
                    change({
                      play: {
                        ...p,
                        tactics: {
                          ...(p.tactics ?? defaultTactics),
                          strongSide: e.target.value as Side,
                        },
                      },
                    });
                  }}
                >
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                </select>
              </label>
              <label>
                Split coverage half side
                <select
                  value={config.halfSide ?? ""}
                  onChange={(e) =>
                    change({
                      halfSide: e.target.value
                        ? (e.target.value as Side)
                        : undefined,
                    })
                  }
                >
                  <option value="">
                    Preset · Cover 6 left / Cover 8 field side
                  </option>
                  <option value="left">Left half / right quarters</option>
                  <option value="right">Left quarters / right half</option>
                </select>
              </label>
              <label>
                Vertical match trigger
                <select
                  value={config.matchDepth ?? 11}
                  onChange={(e) =>
                    change({ matchDepth: Number(e.target.value) })
                  }
                >
                  <option value={10}>10 yards</option>
                  <option value={11}>11 yards</option>
                  <option value={12}>12 yards</option>
                </select>
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={!!config.pocketPreset}
                  onChange={(e) => change({ pocketPreset: e.target.checked })}
                />
                Show advisory protection target
              </label>
              <p>
                Optional synthetic timing reference only. It never releases a
                blocker, causes pressure or awards movement time. Engagements,
                pursuit and actual QB position determine pocket safety.
                Over: strong 3/weak 1; Under: weak 3/strong 1. An inside guard
                shade is 2i. Match and Cover 8 terminology require Coach Tae
                review.
              </p>
              <label>
                Synthetic line matchup
                <select
                  value={config.matchup ?? "balanced"}
                  onChange={(e) =>
                    change({
                      matchup: e.target.value as EngineConfig["matchup"],
                    })
                  }
                >
                  <option value="balanced">Balanced ratings</option>
                  <option value="offense-edge">Blocking advantage</option>
                  <option value="defense-edge">Rush advantage</option>
                </select>
              </label>
              <label>
                Blitz tempo modifier
                <select
                  value={config.blitzTempo ?? 0}
                  onChange={(e) =>
                    change({ blitzTempo: Number(e.target.value) })
                  }
                >
                  <option value="0">Standard</option>
                  <option value="0.12">Accelerated pressure</option>
                  <option value="0.25">Aggressive pressure</option>
                </select>
              </label>
            </>
          )}
          <label>
            Repeatable scenario seed
            <input
              type="number"
              min="0"
              max="2147483647"
              value={config.seed}
              onChange={(e) => change({ seed: Number(e.target.value) })}
            />
          </label>
          {config.rules.format !== "passing7" && (
            <label>
              Formation / saved play
              <select
                value={config.play?.id ?? "authored"}
                onChange={(e) =>
                  change({
                    play: local.plays.find((p) => p.id === e.target.value),
                  })
                }
              >
                <option value="authored">Shared authored formation</option>
                {local.plays
                  .filter(
                    (p) =>
                      p.format ===
                      (config.rules.format === "tackle11"
                        ? "tackle"
                        : config.rules.format),
                  )
                  .map((p) => (
                    <option value={p.id} key={p.id}>
                      {p.name}
                    </option>
                  ))}
              </select>
            </label>
          )}
          {config.rules.format === "tackle11" && (
            <>
              <label>
                Defensive grouping
                <select
                  value={config.personnel}
                  onChange={(e) =>
                    change({
                      personnel: e.target.value as EngineConfig["personnel"],
                    })
                  }
                >
                  {Object.keys(personnelGroups).map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </label>
              <label>
                Front alignment
                <select
                  value={config.front}
                  onChange={(e) =>
                    change({ front: e.target.value as EngineConfig["front"] })
                  }
                >
                  {fronts.map((f) => (
                    <option key={f}>{f}</option>
                  ))}
                </select>
              </label>
              <label>
                Pass protection
                <select
                  aria-label="Pass protection"
                  value={config.protection}
                  onChange={(e) =>
                    change({
                      protection: e.target.value as EngineConfig["protection"],
                    })
                  }
                >
                  {[
                    "man",
                    "half-slide-left",
                    "half-slide-right",
                    "full-slide-left",
                    "full-slide-right",
                  ].map((p) => (
                    <option value={p} key={p}>
                      {p.replaceAll("-", " ")}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Protection help
                <select
                  value={config.help}
                  onChange={(e) =>
                    change({ help: e.target.value as EngineConfig["help"] })
                  }
                >
                  {["none", "RB", "TE", "RB+TE"].map((h) => (
                    <option key={h}>{h}</option>
                  ))}
                </select>
              </label>
              <label>
                Rush technique example
                <select
                  value={config.rushMove}
                  onChange={(e) =>
                    change({
                      rushMove: e.target.value as EngineConfig["rushMove"],
                    })
                  }
                >
                  {rushMoves.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </label>
            </>
          )}
          <label>
            Assigned rush count
            <input
              type="number"
              min={config.rules.format === "tackle11" ? 2 : 0}
              max={
                config.rules.format === "tackle11" ? 6 : config.rules.defense
              }
              disabled={config.rules.format === "passing7"}
              value={config.rules.rushers}
              onChange={(e) => rule({ rushers: Number(e.target.value) })}
            />
          </label>
          {config.rules.format === "tackle11" && (
            <label>
              Starting safety shell
              <select
                value={config.shell}
                onChange={(e) =>
                  change({ shell: Number(e.target.value) as 0 | 1 | 2 })
                }
              >
                <option value="0">0 high</option>
                <option value="1">1 high</option>
                <option value="2">2 high</option>
              </select>
            </label>
          )}
        </fieldset>
        {config.rules.format === "tackle11" && (
          <PocketCheck
            key={`${config.rules.rushers}:${config.matchup}:${config.blitzTempo}:${config.help}`}
            config={config}
          />
        )}
        <details className="engine-call">
          <summary>Teaching setup: actual post-snap responsibilities</summary>
          <label>
            Defensive coverage call
            <select
              disabled={locked}
              value={config.coverage}
              onChange={(e) =>
                change({ coverage: e.target.value as EngineConfig["coverage"] })
              }
            >
              {(config.rules.format === "tackle11"
                ? coverages
                : ["Cover 0", "Cover 1", "Cover 2", "Cover 3"]
              ).map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <p>
            Man tracks observed receivers; zones gain their landmarks and react
            to observed routes and visible ball movement. Cover 4 and split-field
            quarters use spot-drop here. Only the explicitly selected, incomplete
            quarters-match branch carries vertical releases. That branch remains
            an introductory example, not a complete coverage system. Rotation is
            movement from the actual starting shell to the called assignments.
          </p>
        </details>
        {config.rules.format !== "tackle11" && (
          <fieldset className="engine-config" disabled={locked}>
            <legend>
              {config.rules.format === "passing7"
                ? "Passing event rules — distinct from flag"
                : "Custom flag direct-pass teaching rules"}
            </legend>
            <label>
              Configuration name
              <input
                maxLength={100}
                value={config.rules.name}
                onChange={(e) => rule({ name: e.target.value })}
              />
            </label>
            {config.rules.format === "passing7" && (
              <>
                <label>
                  Offensive participants
                  <select
                    value={config.rules.offense}
                    onChange={(e) =>
                      rule({
                        offense: Number(e.target.value),
                        eligibleLimit: Math.min(
                          config.rules.eligibleLimit,
                          Number(e.target.value) - 1,
                        ),
                      })
                    }
                  >
                    <option value="6">6 · QB + five participants</option>
                    <option value="7">7 · QB + six participants</option>
                  </select>
                </label>
                <label>
                  Eligible receiver limit
                  <input
                    type="number"
                    min="1"
                    max={config.rules.offense - 1}
                    value={config.rules.eligibleLimit}
                    onChange={(e) =>
                      rule({ eligibleLimit: Number(e.target.value) })
                    }
                  />
                </label>
              </>
            )}
            <label>
              Event pass clock (seconds)
              <input
                type="number"
                min="2"
                max="15"
                step="0.5"
                value={config.rules.passClock ?? ""}
                onChange={(e) => rule({ passClock: Number(e.target.value) })}
              />
            </label>
            <label>
              Field width (yards)
              <input
                type="number"
                min="25"
                max="60"
                value={config.rules.width}
                onChange={(e) => rule({ width: Number(e.target.value) })}
              />
            </label>
            <label>
              Field length (yards)
              <input
                type="number"
                min="40"
                max="120"
                value={config.rules.length}
                onChange={(e) => rule({ length: Number(e.target.value) })}
              />
            </label>
            <label>
              Line of scrimmage (yards)
              <input
                type="number"
                min="10"
                max={config.rules.length - 5}
                value={config.rules.los}
                onChange={(e) => rule({ los: Number(e.target.value) })}
              />
            </label>
            <label>
              Event downs (context only)
              <input
                type="number"
                min="1"
                max="8"
                value={config.rules.downs}
                onChange={(e) => rule({ downs: Number(e.target.value) })}
              />
            </label>
            <label>
              Touchdown points
              <input
                type="number"
                min="1"
                max="12"
                value={config.rules.touchdown}
                onChange={(e) => rule({ touchdown: Number(e.target.value) })}
              />
            </label>
            {config.rules.format !== "passing7" && (
              <>
                <label>
                  Designated rush distance (yards)
                  <input
                    type="number"
                    min="0"
                    max="15"
                    value={config.rules.rushDistance}
                    onChange={(e) =>
                      rule({ rushDistance: Number(e.target.value) })
                    }
                  />
                </label>
                <label>
                  Rush delay (seconds)
                  <input
                    type="number"
                    min="0"
                    max="8"
                    step="0.5"
                    value={config.rules.rushDelay}
                    onChange={(e) =>
                      rule({ rushDelay: Number(e.target.value) })
                    }
                  />
                </label>
                <label>
                  No-run zone distance (yards)
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={config.rules.noRunZone}
                    onChange={(e) =>
                      rule({ noRunZone: Number(e.target.value) })
                    }
                  />
                </label>
                <label className="engine-checkbox">
                  <input
                    type="checkbox"
                    checked={config.rules.qbRun}
                    onChange={(e) => rule({ qbRun: e.target.checked })}
                  />
                  Direct QB run allowed
                </label>
              </>
            )}
            <label className="engine-checkbox">
              <input
                type="checkbox"
                checked={config.rules.acknowledged}
                onChange={(e) =>
                  setConfig((c) => ({
                    ...c,
                    rules: { ...c.rules, acknowledged: e.target.checked },
                  }))
                }
              />
              I checked these values for this teaching exercise. They are not a
              published league preset.
            </label>
            <p>
              Dead at catch. No blocking/contact, handoffs or laterals in these
              event examples. Downs are context only; drives, penalties,
              conversions and full scoring rules are not implemented. A league
              requiring those mechanics is not supported yet.
            </p>
          </fieldset>
        )}
        </details>
        {errors.length > 0 && (
          <div
            className="engine-notice"
            role="status"
            aria-label="Engine configuration issues"
          >
            <button type="button" onClick={() => { setAdvanced(true); advancedSettings.current?.querySelector("summary")?.focus(); }}>Review Advanced Settings</button>
            <ul>
              {errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>
        )}
        {s && (
          <div className="engine-workspace">
            <div>
              {s.pocket && (
                <p role="status" aria-label="Teaching pocket countdown">
                  Advisory protection target:{" "}
                  {Math.max(0, s.pocket.deadline - s.tick / 30).toFixed(2)}s ·
                  Display only. No blocker loss or movement bonus.
                </p>
              )}
              <div className="engine-scoreboard">
                <span>
                  {s.config.rules.offense} offense / {s.config.rules.defense}{" "}
                  defense
                </span>
                <strong>{(s.tick / 30).toFixed(2)}s</strong>
                <span>
                  {reviewTick !== null ? "replay · " : ""}{s.phase} · {s.qbState}
                </span>
              </div>
              <div
                className={`engine-viewport${zoom ? " is-zoomed" : ""}`}
                ref={fieldViewport}
                tabIndex={0}
                role="group"
                aria-label={reviewTick !== null ? "Live engine field replay. Read only; use the replay timeline to review movement." : "Live engine field controls. Arrow keys or W A S D to move; release to stop."}
                onBlur={() => {
                  held.current = { x: 0, y: 0 };
                }}
                onKeyDown={(e) => {
                  if (e.shiftKey) {
                    held.current = { x: 0, y: 0 };
                    return;
                  }
                  const directions: Record<string, { x: number; y: number }> = {
                    ArrowLeft: { x: -1, y: 0 },
                    a: { x: -1, y: 0 },
                    ArrowRight: { x: 1, y: 0 },
                    d: { x: 1, y: 0 },
                    ArrowUp: { x: 0, y: 1 },
                    w: { x: 0, y: 1 },
                    ArrowDown: { x: 0, y: -1 },
                    s: { x: 0, y: -1 },
                  };
                  if (directions[e.key]) {
                    e.preventDefault();
                    if (running && canStep) held.current = directions[e.key];
                    else nudge(directions[e.key].x, directions[e.key].y);
                  }
                }}
                onKeyUp={() => {
                  held.current = { x: 0, y: 0 };
                }}
              >
                <div style={{ width: zoom ? "280%" : "100%" }}>
                  <EngineField state={s} />
                </div>
              </div>
              {replay && <EngineReplay
                tick={reviewTick}
                total={replay.rep.inputs.length}
                playing={reviewPlaying}
                reference={reference}
                onSeek={tick => { setRunning(false); setReviewPlaying(false); setReviewTick(tick); }}
                onToggle={() => {
                  if (reviewTick === replay.rep.inputs.length) {
                    setReviewTick(0);
                    setReviewPlaying(true);
                  } else setReviewPlaying(p => !p);
                }}
                onResult={() => { setReviewPlaying(false); setReviewTick(null); }}
              />}
              <label>Simulation playback speed
                <select value={speed} onChange={e => setSpeed(Number(e.target.value))}>
                  <option value={0.25}>0.25×</option><option value={0.5}>0.5×</option><option value={1}>1×</option>
                </select>
              </label>
              <div className="engine-actions">
                <button onClick={() => setZoom(!zoom)} aria-pressed={zoom}>
                  {zoom ? "Field overview" : "Enlarge field"}
                </button>
                <button
                  onClick={start}
                  disabled={locked || !hypothesis || errors.length > 0}
                >
                  Snap live rep
                </button>
                <button
                  disabled={!canStep}
                  onClick={() => setRep((p) => (p ? advanceRep(p, 6) : p))}
                >
                  Step 0.2 seconds
                </button>
                <button
                  disabled={!canStep}
                  onClick={() => {
                    held.current = { x: 0, y: 0 };
                    setRunning(!running);
                  }}
                >
                  {running && !done ? "Pause live rep" : "Play live rep"}
                </button>
                <button onClick={reset}>Reset live rep</button>
              </div>
              <p className="engine-hint">
                {config.mode === "learn"
                  ? "Learn starts paused. Step through engagements, then move or throw."
                  : "Real-time play advances at 30 fixed steps/second; pause to inspect."}{" "}
                Arrow keys / WASD move the QB; Shift + arrows pan an enlarged
                field. Touch movement buttons advance 0.2s in that direction.
                You can climb, reset, slide or escape; no fixed sack timer.
              </p>
              <div
                className="engine-actions"
                aria-label="Live engine touch movement"
              >
                {[
                  ["Slide left", -1, 0],
                  ["Climb pocket", 0, 1],
                  ["Drop back", 0, -1],
                  ["Slide right", 1, 0],
                ].map(([name, x, y]) => (
                  <button
                    key={name}
                    disabled={!canStep || s.phase === "flight"}
                    onClick={() => nudge(Number(x), Number(y))}
                  >
                    {name}
                  </button>
                ))}
              </div>
              <output aria-label="Live QB position" aria-live="off">
                QB {s.players.find((p) => p.job === "qb")!.pos.x.toFixed(1)},{" "}
                {s.players.find((p) => p.job === "qb")!.pos.y.toFixed(1)} yards
                · pressure {s.pressure.toFixed(2)}
                {pocketWindow(s) !== null && (
                  <>
                    {" "}
                    · estimated pocket remaining {pocketWindow(s)!.toFixed(1)}s
                    (advisory, not a sack clock)
                  </>
                )}
              </output>
            </div>
            <aside>
              {s.phase === "live" && (
                <details className="engine-estimates">
                  <summary>Synthetic throw estimates</summary>
                  <p>
                    Teaching estimates, not athlete statistics. Balance, release
                    timing, pressure, range and observed separation affect
                    dispersion. Live ball geometry still decides the outcome.
                  </p>
                  <ul>
                    {s.players
                      .filter((p) => p.job === "route" && p.eligible)
                      .map((p) => (
                        <li key={p.id}>
                          {p.label}:{" "}
                          {Math.round(throwEstimate(s, p).probability * 100)}%
                          model completion estimate
                        </li>
                      ))}
                  </ul>
                </details>
              )}
              <h3>{done ? "What happened" : "Your pocket decision"}</h3>
              <p>
                {s.config.rules.format === "passing7"
                  ? "No line or physical rush. Work through the event's passing window."
                  : s.config.rules.format === "tackle11"
                    ? "Yellow links show actual block engagements. An accounted-for rusher can win a block; an unaccounted rusher still has to reach you."
                    : "Designated rushers obey this configuration's distance and delay. The QB-run boundary uses these rules, not a universal flag rule."}
              </p>
              <label>
                Throw placement relative to predicted target
                <select
                  value={placement}
                  disabled={s.phase === "flight" || done}
                  onChange={(e) => setPlacement(Number(e.target.value))}
                >
                  <option value="0">Lead current receiver motion</option>
                  <option value="-2">Two yards left</option>
                  <option value="2">Two yards right</option>
                </select>
              </label>
              <div
                className={`engine-targets${s.phase === "live" || s.phase === "flight" ? " is-live" : ""}`}
              >
                {s.players
                  .filter((p) => p.job === "route" && p.eligible)
                  .map((p) => (
                    <button
                      disabled={!canStep || s.phase !== "live"}
                      key={p.id}
                      onClick={() =>
                        decide({
                          throwTo: p.id,
                          placement: { x: placement, y: 0 },
                        })
                      }
                    >
                      Pass to {p.label}
                    </button>
                  ))}
                <button
                  disabled={!canStep || s.phase !== "live"}
                  onClick={() => decide({ throwAway: true })}
                >
                  End rep: throw away
                </button>
              </div>
              {s.phase === "flight" && (
                <p role="status">
                  Ball in flight. Continue stepping or play to resolve the catch
                  window.
                </p>
              )}
              {done && (
                <div
                  role="status"
                  aria-label="Live engine coaching"
                  className="engine-feedback"
                >
                  {coaching(s).map((n) => (
                    <p key={n}>{n}</p>
                  ))}
                  <p>
                    {reference ? "Authored reference inputs; no athlete prediction or completion is graded." : `Your pre-snap prediction: ${hypothesis}. The actual call is revealed in the ledger; this observation is not graded as guaranteed coverage.`}
                  </p>
                  {reference ? <p>Authored reference replay only. It is not recorded as your training activity.</p> : <button
                    disabled={recorded}
                    onClick={() => {
                      recordActivity(
                        "simulation",
                        `live-${s.config.rules.format}-${s.outcome}`,
                        undefined,
                        profile.id,
                        report(s),
                      );
                      setRecorded(true);
                    }}
                  >
                    {recorded
                      ? "Rep saved locally"
                      : "Record this completed rep"}
                  </button>}
                  {recommendation && (
                    <Link href={recommendation.href}>
                      {recommendation.label} →
                    </Link>
                  )}
                </div>
              )}
              <h3>Observed events</h3>
              {s.events.length ? (
                <ol className="engine-events">
                  {s.events.slice(-12).map((e, i) => (
                    <li key={`${e.tick}-${i}`}>
                      <time>{(e.tick / 30).toFixed(2)}s</time> {e.text}
                    </li>
                  ))}
                </ol>
              ) : (
                <p>No snap yet. Make a coverage hypothesis to begin.</p>
              )}
            </aside>
          </div>
        )}
        <details className="engine-ledger">
          <summary>
            Protection plan, responsibilities and model boundaries
          </summary>
          {s && (
            <>
              <h3>Protection assignments</h3>
              {Object.keys(s.plan).length ? (
                <ul>
                  {Object.entries(s.plan).map(([b, d]) => (
                    <li key={b}>
                      {s.players.find((p) => p.id === b)?.label} →{" "}
                      {s.players.find((p) => p.id === d)?.label}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No physical protection in this format.</p>
              )}
              <h3>Defensive responsibilities · {s.config.coverage}</h3>
              <ul>
                {s.players
                  .filter((p) => p.team === "defense")
                  .map((p) => (
                    <li key={p.id}>
                      {p.label} · {p.role} ·{" "}
                      {p.responsibility.replace(
                        "no contact or protection result simulated.",
                        "live simplified protection interactions.",
                      )}
                    </li>
                  ))}
              </ul>
            </>
          )}
          <p>
            Learn offers pause/step and Practice offers continuous reps. Challenge
            is an unscored preview, not a progressive challenge curriculum.
            Behind-QB/3D views are not implemented. This is a synthetic positional model: geometric engagement,
            tunable ratings, bounded reactive coverage, simple
            catch/interception radii and a ball arc. No full run blocking,
            designed-run/RPO logic, contact biomechanics, complete match
            exchanges, motion/shifts, drive management, penalties or verified
            coaching answer keys. Swim/rip/spin are parameterized rush
            approaches, not biomechanical animations. QB is an articulated 2D
            teaching avatar, not motion-captured mechanics. The practice horizon
            ends without inventing a sack. Keep the existing recognition
            workspace for the wider lesson library.
          </p>
        </details>
      </section>
    </>
  );
}
