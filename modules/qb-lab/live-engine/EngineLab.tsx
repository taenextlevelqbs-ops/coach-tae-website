"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import type { Play } from "../simulation/model";
import { useDemo } from "../LabShell";
import { recordActivity, useLocalLab } from "../platform/store";
import { fronts, personnelGroups, coverages } from "../football/content";
import { gameFormats, type GameFormat } from "./formats";
import { defaultConfig } from "./defaults";
import { advanceTicks, createEngine, snap, step } from "./engine";
import { validateConfig } from "./roster";
import { coaching, recommendedLesson } from "./coaching";
import { report } from "./report";
import { EngineField } from "./EngineField";
import {
  rushMoves,
  type EngineConfig,
  type EngineState,
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
export function EngineLab({ initialPlayId }: { initialPlayId?: string } = {}) {
  const { profile } = useDemo();
  const { state } = useLocalLab();
  const play = state.plays.find((p) => p.id === initialPlayId);
  return (
    <EngineDesk
      key={`${profile.id}:${initialPlayId ?? ""}:${play?.id ?? "default"}`}
      initialPlay={play}
    />
  );
}
function EngineDesk({ initialPlay }: { initialPlay?: Play }) {
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
        }
      : defaultConfig(),
  );
  const [sim, setSim] = useState<EngineState | null>(null);
  const [running, setRunning] = useState(false);
  const [hypothesis, setHypothesis] = useState("");
  const [recorded, setRecorded] = useState(false);
  const [placement, setPlacement] = useState(0);
  const [zoom, setZoom] = useState(false);
  const fieldViewport = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = fieldViewport.current;
    if (zoom && el) {
      el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
      el.scrollTop = el.scrollHeight - el.clientHeight;
    }
  }, [zoom]);
  const held = useRef<Input["move"]>({ x: 0, y: 0 });
  const errors = validateConfig(config);
  const staged = errors.length || sim ? null : createEngine(config);
  const s = sim ?? staged;
  const locked = !!sim || !hydrated;
  const phase = sim?.phase;
  const canStep = !!sim && sim.phase !== "done" && sim.phase !== "ready";
  function change(p: Partial<EngineConfig>) {
    setConfig((c) => ({ ...c, ...p }));
    setRecorded(false);
  }
  function rule(p: Partial<EngineConfig["rules"]>) {
    setConfig((c) => ({
      ...c,
      rules: { ...c.rules, ...p, acknowledged: c.rules.format === "tackle11" },
    }));
  }
  useEffect(() => {
    if (!running || !phase || phase === "done") return;
    // Every scheduled update advances exactly one tick. Slow scheduling slows play, never skips collisions.
    const timer = setInterval(
      () => setSim((p) => (p ? step(p, { move: held.current }) : p)),
      1000 / 30,
    );
    return () => clearInterval(timer);
  }, [running, phase]);
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
    setSim(null);
    setRecorded(false);
  }
  function start() {
    if (staged && hydrated) {
      setSim(snap(staged));
      setRunning(config.mode !== "learn");
      setRecorded(false);
    }
  }
  function nudge(x: number, y: number) {
    if (canStep)
      setSim((p) => (p ? advanceTicks(p, 6, { move: { x, y } }) : p));
  }
  function decide(input: Input) {
    if (canStep) setSim((p) => (p ? step(p, input) : p));
  }
  const done = sim?.phase === "done";
  const recommendation = sim ? recommendedLesson(sim) : null;
  return (
    <>
      <div className="lab-page-heading">
        <div>
          <p className="lab-kicker">LIVE POCKET · ENGINE MILESTONE 1</p>
          <h1>See the rush. Own your space.</h1>
          <p className="lab-lede">
            A playable, deterministic teaching model. Coach review required;
            synthetic attributes do not measure athlete ability.
          </p>
        </div>
        <Link href="/qb-lab/simulator" className="lab-text-link">
          Recognition &amp; spacing tools →
        </Link>
      </div>
      <section className="engine-lab" aria-label="Live pocket engine">
        {!hydrated && (
          <p role="status" aria-label="Engine readiness">
            Preparing interactive controls. JavaScript is required for the live
            engine.
          </p>
        )}
        <div className="engine-title">
          <div>
            <h2>Build the rep</h2>
            <p>
              Personnel, alignment, coverage and pressure are separate
              decisions.
            </p>
          </div>
          <span>Demo athlete {profile.name} · local only</span>
        </div>
        <fieldset disabled={locked} className="engine-config">
          <legend>Before the snap</legend>
          <label>
            Game environment
            <select
              value={config.rules.format}
              onChange={(e) => {
                setConfig(defaultConfig(e.target.value as GameFormat));
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
                Challenge · clock &amp; live decision
              </option>
            </select>
          </label>
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
        </fieldset>
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
            to nearby routes/throws. The existing quarters-match branch remains
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
        {errors.length > 0 && (
          <div
            className="engine-notice"
            role="status"
            aria-label="Engine configuration issues"
          >
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
              <div className="engine-scoreboard">
                <span>
                  {s.config.rules.offense} offense / {s.config.rules.defense}{" "}
                  defense
                </span>
                <strong>{(s.tick / 30).toFixed(2)}s</strong>
                <span>
                  {s.phase} · {s.qbState}
                </span>
              </div>
              <div
                className="engine-viewport"
                ref={fieldViewport}
                tabIndex={0}
                role="group"
                aria-label="Live engine field controls. Arrow keys or W A S D to move; release to stop."
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
                    if (running) held.current = directions[e.key];
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
                  onClick={() => setSim((p) => (p ? advanceTicks(p, 6) : p))}
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
              <output aria-label="Live QB position">
                QB {s.players.find((p) => p.job === "qb")!.pos.x.toFixed(1)},{" "}
                {s.players.find((p) => p.job === "qb")!.pos.y.toFixed(1)} yards
                · pressure {s.pressure.toFixed(2)}
              </output>
            </div>
            <aside>
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
              <div className="engine-targets">
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
                    Your pre-snap prediction: {hypothesis}. The actual call is
                    revealed in the ledger; this observation is not graded as
                    guaranteed coverage.
                  </p>
                  <button
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
                  </button>
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
            Milestone 1 is a synthetic positional model: geometric engagement,
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
