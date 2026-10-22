"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useDemo } from "../LabShell";
import {
  formation,
  type Format,
  type Play,
  type Player,
  type Point,
} from "../simulation/model";
import { position } from "../simulation/engine";
import { SimField } from "../simulation/SimField";
import { recognitionPreset } from "./presets";
import { recordActivity, useLocalLab, updateLab } from "../platform/store";
import {
  frontMatches,
  defenderPosition,
  recognitionMove,
  boxCount,
  buildDefense,
  buildFlag,
  coverages,
  flagLooks,
  fronts,
  nflFlag5,
  personnelGroups,
  techniques,
  techniqueAt,
  validRules,
  validateFormation,
  type Coverage,
  type Front,
  type Personnel,
  type Rules,
} from "./content";
type Result = { text: string; target: Point; from: Point };
export function RecognitionLab({ initialPreset }: { initialPreset?: string }) {
  const preset = recognitionPreset(initialPreset);
  const [magnified, setMagnified] = useState(false);
  const fieldViewport = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = fieldViewport.current;
    if (el)
      el.scrollLeft = magnified ? (el.scrollWidth - el.clientWidth) / 2 : 0;
  }, [magnified]);
  const { pathway, profile } = useDemo();
  const { state } = useLocalLab();
  const [savedId, setSavedId] = useState("");
  const [format, setFormat] = useState<Format>(
    preset?.format ?? (pathway === "flag" ? "flag5" : "tackle"),
  );
  const [personnel, setPersonnel] = useState<Personnel>(
    preset?.personnel ?? "4-2-5",
  );
  const [front, setFront] = useState<Front>(preset?.front ?? "Even");
  const [coverage, setCoverage] = useState<Coverage>(
    preset?.coverage ?? "Cover 2",
  );
  const [shell, setShell] = useState<0 | 1 | 2>(2);
  const [rush, setRush] = useState(4);
  const [offense, setOffense] = useState<"10" | "11" | "12">("11");
  const [example, setExample] = useState(preset?.example ?? 0);
  const [ruleMode, setRuleMode] = useState("unconfigured");
  const [custom, setCustom] = useState({
    rushYards: 5,
    rushDelay: 1,
    passClock: 7,
    qbRun: false,
    blocking: false,
    contact: false,
  });
  const [confirmed, setConfirmed] = useState(false);
  const [age, setAge] = useState("Middle school · developing");
  const [conflictKey, setConflictKey] = useState("");
  const [guess, setGuess] = useState("");
  const [frontGuess, setFrontGuess] = useState("");
  const [prediction, setPrediction] = useState("");
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [qb, setQB] = useState<Point>({ x: 50, y: 85 });
  const [result, setResult] = useState<Result | null>(null);
  const [flight, setFlight] = useState(0);
  const [labelOverrides, setLabelOverrides] = useState<Record<string, string>>(
    {},
  );
  const [labelPlayer, setLabelPlayer] = useState(
    pathway === "flag" ? "C" : "R5",
  );
  const rules: Rules | null =
    format === "tackle"
      ? null
      : ruleMode === "nfl" && format === "flag5"
        ? nflFlag5
        : ruleMode === "custom" && confirmed
          ? {
              ...custom,
              id: "Coach-configured teaching rules · verify league source",
              format,
            }
          : null;
  const basePlay = useMemo(
    () => formation(format, true, offense),
    [format, offense],
  );
  const sourcePlay =
    state.plays.find((p) => p.id === savedId && p.format === format) ??
    basePlay;
  const play = {
    ...sourcePlay,
    players: sourcePlay.players.map((p) => ({
      ...p,
      eligible:
        p.eligible ?? basePlay.players.find((b) => b.id === p.id)?.eligible,
      label: labelOverrides[p.id] || p.label,
    })),
  };
  const tackle = buildDefense(play, personnel, front, coverage, shell, rush);
  const flag =
    format !== "tackle" && rules && validRules(rules, format)
      ? buildFlag(play, example, rules)
      : null;
  const defenders: Player[] =
    format === "tackle" ? tackle.players : (flag?.players ?? []);
  const assignments =
    format === "tackle" ? tackle.assignments : (flag?.assignments ?? []);
  const limit = format === "tackle" ? 6 : (rules?.passClock ?? 7) + 1;
  const isReady =
    format === "tackle" || (rules !== null && validRules(rules, format));
  const formationIssues = validateFormation(play);
  const labelsUnique =
    new Set(play.players.map((p) => p.label)).size === play.players.length;
  const canSnap =
    isReady &&
    formationIssues.length === 0 &&
    labelsUnique &&
    !!guess &&
    !!prediction &&
    (format !== "tackle" || age.startsWith("Youth") || !!frontGuess) &&
    (!age.startsWith("College") || !!conflictKey);
  const active = started && playing && time < limit && !result;
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(
      () => setTime((t) => Math.min(limit, t + 0.1)),
      100,
    );
    return () => clearInterval(timer);
  }, [active, limit]);
  useEffect(() => {
    if (!result) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let value = 0;
    const timer = setInterval(() => {
      value = Math.min(1, value + 0.1);
      setFlight(value);
      if (value >= 1) clearInterval(timer);
    }, 40);
    return () => clearInterval(timer);
  }, [result]);
  function reset(nextPlay?: Play) {
    setTime(0);
    setStarted(false);
    setPlaying(false);
    setQB(
      recognitionMove(
        (nextPlay ?? play).players.find((p) => p.id === "QB")?.start ?? {
          x: 50,
          y: 85,
        },
        0,
        0,
        rules,
      ),
    );
    setResult(null);
    setFlight(0);
    setConflictKey("");
    setGuess("");
    setFrontGuess("");
    setPrediction("");
  }
  function changeFormat(value: Format) {
    setFormat(value);
    setLabelPlayer(value === "tackle" ? "R5" : "C");
    setSavedId("");
    setExample(0);
    setRuleMode("unconfigured");
    setConfirmed(false);
    setLabelOverrides({});
    reset();
  }
  function move(dx: number, dy: number) {
    if (started && !result) setQB((p) => recognitionMove(p, dx, dy, rules));
  }
  function decide(player: Player | null) {
    if (!started || result) return;
    const target = player ? position(player, time) : qb;
    const separation = player
      ? Math.min(
          ...defenders.map((d) => {
            const at = defenderPosition(d, time, assignments, play.players);
            return Math.hypot(at.x - target.x, at.y - target.y);
          }),
        )
      : 0;
    const pressure = assignments
      .filter((a) => a.job === "rush")
      .some((a) => {
        const d = defenders.find((p) => p.id === a.player)!;
        const at = defenderPosition(d, time, assignments, play.players);
        return Math.hypot(at.x - qb.x, at.y - qb.y) < 6;
      });
    const expired = rules ? time >= rules.passClock : time >= 6;
    const action = player
      ? `Target ${player.label}: ${separation >= 12 ? "space exists at the authored landmark" : "a defender closes the authored window"}. Nearest defender: ${separation.toFixed(1)} schematic units.`
      : "No throw selected; discuss the available check or permitted run with your coach.";
    const reveal =
      format === "tackle"
        ? `${personnel} personnel, ${front.toLowerCase()} look, ${coverage}. ${tackle.rush} assigned rushers. Pre-snap ${shell}-high is a clue, not proof of that call.`
        : `${flag?.look.name}. These are instructional assignments, not a universal flag defense.`;
    const observations =
      format === "tackle"
        ? `${guess === personnel ? "Personnel identified correctly" : "Recount DL, LB and DB roles"}; ${frontMatches(frontGuess, front) ? "front observation matches" : "compare the shown surface with your front answer"}.`
        : `${guess === flag?.look.name ? "Example structure identified" : "Compare the rush, underneath and deep counts"}.`;
    setPlaying(false);
    setFlight(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 1 : 0,
    );
    setResult({
      from: qb,
      target,
      text: `${observations} ${reveal} ${conflictKey ? `Your chosen key ${defenders.find((d) => d.id === conflictKey)?.label} had responsibility: ${assignments.find((a) => a.player === conflictKey)?.responsibility}` : ""} Your possible-coverage prediction was ${prediction}; an initial prediction is not scored as confirmed coverage. ${expired ? "The configured decision clock expired. " : ""}${pressure ? "An authored rusher reached the QB area. " : ""}${action} This schematic illustrates a read and pressure proximity, not a guaranteed completion, interception, sack or athlete rating. Discuss protection, leverage and the called concept with your coach.`,
    });
    recordActivity(
      "lesson",
      `recognition-${format}-${format === "tackle" ? `${personnel}-${front}-${coverage}` : example}`.replaceAll(
        " ",
        "-",
      ),
      undefined,
      profile.id,
    );
    const matchesPreset =
      preset &&
      format === preset.format &&
      (format === "tackle"
        ? personnel === preset.personnel &&
          front === preset.front &&
          coverage === preset.coverage
        : example === preset.example);
    if (matchesPreset)
      updateLab((s) => ({
        ...s,
        assignments: s.assignments.map((a) =>
          a.profile === profile.id &&
          a.drill === "recognition" &&
          a.recognition === preset.id
            ? { ...a, status: "complete" as const }
            : a,
        ),
      }));
  }
  return (
    <section
      id="recognition"
      className="recognition-lab"
      aria-label="Defensive recognition workspace"
    >
      <div className="recognition-title">
        <div>
          <p className="lab-kicker">QB SIMULATOR · SHARED FOOTBALL IQ LAB</p>
          <h2>Recognize the structure. Confirm the movement.</h2>
          <p>
            Personnel is who is on the field. A front is where they align. A
            coverage is what they do after the snap.
          </p>
        </div>
        <span className="recognition-review">Coach review required</span>
      </div>
      {preset && (
        <p className="recognition-assignment">
          Selected shared lesson: {preset.title}. Changing the called structure
          will not complete that assignment.
        </p>
      )}
      <div className="recognition-config">
        <label>
          Football format
          <select
            aria-label="Recognition format"
            value={format}
            disabled={started}
            onChange={(e) => changeFormat(e.target.value as Format)}
          >
            <option value="tackle">11v11 tackle</option>
            <option value="flag5">5v5 flag</option>
            <option value="flag7">7v7 flag</option>
            <option value="flag8">8v8 flag</option>
          </select>
        </label>
        <label>
          Shared playbook formation
          <select
            aria-label="Recognition playbook formation"
            value={savedId}
            disabled={started}
            onChange={(e) => {
              setSavedId(e.target.value);
              setLabelOverrides({});
              reset(
                state.plays.find((p) => p.id === e.target.value) ?? basePlay,
              );
            }}
          >
            <option value="">Authored formation</option>
            {state.plays
              .filter((p) => p.format === format)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </select>
        </label>
        <label>
          Learning depth
          <select
            aria-label="Learning depth"
            value={age}
            disabled={started}
            onChange={(e) => setAge(e.target.value)}
          >
            <option>Youth · guided</option>
            <option>Middle school · developing</option>
            <option>High school · independent</option>
            <option>College · scheme discussion</option>
          </select>
        </label>
        {format === "tackle" ? (
          <>
            <label>
              Defensive personnel
              <select
                aria-label="Defensive personnel"
                value={personnel}
                disabled={started}
                onChange={(e) => {
                  setPersonnel(e.target.value as Personnel);
                  reset();
                }}
              >
                {Object.keys(personnelGroups).map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </label>
            <label>
              Front / surface
              <select
                aria-label="Front / surface"
                value={front}
                disabled={started}
                onChange={(e) => {
                  setFront(e.target.value as Front);
                  reset();
                }}
              >
                {fronts.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </label>
            <label>
              Offensive personnel
              <select
                aria-label="Offensive personnel"
                value={offense}
                disabled={started}
                onChange={(e) => {
                  setOffense(e.target.value as typeof offense);
                  reset();
                }}
              >
                <option value="10">10 · 1 RB / 0 TE</option>
                <option value="11">11 · 1 RB / 1 TE</option>
                <option value="12">12 · 1 RB / 2 TE</option>
              </select>
            </label>
            <label>
              Starting safety shell
              <select
                aria-label="Starting safety shell"
                value={shell}
                disabled={started}
                onChange={(e) => {
                  setShell(Number(e.target.value) as 0 | 1 | 2);
                  reset();
                }}
              >
                <option value={0}>Zero high</option>
                <option value={1}>One high</option>
                <option value={2}>Two high</option>
              </select>
            </label>
          </>
        ) : (
          <label>
            Flag defensive example
            <select
              disabled={started}
              value={example}
              onChange={(e) => {
                setExample(Number(e.target.value));
                reset();
              }}
            >
              {flagLooks[format].map((p, i) => (
                <option key={p.name} value={i}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      {format === "tackle" ? (
        <details className="recognition-rules">
          <summary>Coach setup: post-snap coverage and pressure call</summary>
          <div className="recognition-config">
            <label>
              Called coverage
              <select
                aria-label="Called coverage"
                value={coverage}
                disabled={started}
                onChange={(e) => {
                  setCoverage(e.target.value as Coverage);
                  if (e.target.value === "Cover 1")
                    setRush((r) => Math.min(r, 5));
                  reset();
                }}
              >
                {coverages.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </label>
            <label>
              Assigned rushers
              <input
                aria-label="Assigned rushers"
                type="number"
                min={2}
                max={coverage === "Cover 1" ? 5 : 6}
                value={rush}
                disabled={started}
                onChange={(e) => {
                  setRush(
                    Math.max(
                      2,
                      Math.min(
                        coverage === "Cover 1" ? 5 : 6,
                        Number(e.target.value) || 2,
                      ),
                    ),
                  );
                  reset();
                }}
              />
            </label>
          </div>
          <p>
            Any listed personnel group can use every listed coverage. Cover 1
            reserves five man responsibilities and one deep helper, so its rush
            count is capped at five for this five-receiver formation. Walking an
            LB onto the line does not change his personnel identity. Coverage
            variants and match rules are examples pending Coach Tae’s review.
          </p>
        </details>
      ) : (
        <section className="recognition-rules" aria-label="Selected flag rules">
          <h3>Choose the governing rules before the snap</h3>
          <label>
            Flag ruleset
            <select
              aria-label="Flag ruleset"
              value={ruleMode}
              disabled={started}
              onChange={(e) => {
                setRuleMode(e.target.value);
                setConfirmed(false);
                reset();
              }}
            >
              <option value="unconfigured">Select a ruleset</option>
              {format === "flag5" && (
                <option value="nfl">NFL FLAG · 5v5 introductory summary</option>
              )}
              <option value="custom">
                Enter your league’s teaching configuration
              </option>
            </select>
          </label>
          {ruleMode === "custom" && (
            <>
              <div className="recognition-config">
                {(
                  [
                    ["rushYards", "Rush-line distance (yards)", 0, 15],
                    ["rushDelay", "Rush delay (seconds)", 0, 5],
                    ["passClock", "Pass clock (seconds)", 2, 15],
                  ] as const
                ).map(([key, label, min, max]) => (
                  <label key={key}>
                    {label}
                    <input
                      type="number"
                      min={min}
                      max={max}
                      step={0.5}
                      value={custom[key]}
                      disabled={started}
                      onChange={(e) => {
                        setCustom({ ...custom, [key]: Number(e.target.value) });
                        setConfirmed(false);
                      }}
                    />
                  </label>
                ))}
              </div>
              {(
                [
                  ["qbRun", "Quarterback may run directly"],
                  ["blocking", "Blocking allowed"],
                  ["contact", "Contact allowed"],
                ] as const
              ).map(([key, label]) => (
                <label className="recognition-check" key={key}>
                  <input
                    type="checkbox"
                    checked={custom[key]}
                    disabled={started}
                    onChange={(e) => {
                      setCustom({ ...custom, [key]: e.target.checked });
                      setConfirmed(false);
                    }}
                  />
                  {label}
                </label>
              ))}
              <label className="recognition-check">
                <input
                  type="checkbox"
                  checked={confirmed}
                  disabled={started}
                  onChange={(e) => setConfirmed(e.target.checked)}
                />
                I checked these teaching values against the selected league’s
                current rules.
              </label>
            </>
          )}
          {rules && !validRules(rules, format) && (
            <p role="alert">
              Use a rush distance from 0–15 yards, delay from 0–5 seconds and
              pass clock from 2–15 seconds.
            </p>
          )}
          {rules && (
            <p>
              {rules.rushYards}-yard rush line · {rules.rushDelay}s rush delay ·{" "}
              {rules.passClock}s pass clock · QB direct run{" "}
              {rules.qbRun ? "allowed" : "not allowed"} · Blocking{" "}
              {rules.blocking ? "allowed" : "not allowed"} · Contact{" "}
              {rules.contact ? "allowed" : "not allowed"}. Blocking/contact and
              flags are not collision-simulated.
            </p>
          )}
          <p>
            No rule is inferred from roster size. The NFL FLAG summary applies
            only to its selected 5v5 example. Custom configurations are
            unreviewed; consult the full current rulebook.
          </p>
        </section>
      )}
      <div className="recognition-workspace">
        <div className="recognition-board">
          <div className="recognition-board-top">
            <span>
              {started ? "POST-SNAP" : "PRE-SNAP"} · {play.players.length}{" "}
              offense / {defenders.length} defense
            </span>
            <span role="timer" aria-live="off" aria-label="Recognition clock">
              {time.toFixed(1)}s
            </span>
          </div>
          <div
            tabIndex={0}
            role="group"
            aria-label="Recognition quarterback controls. Use arrow keys."
            onKeyDown={(e) => {
              if (e.target !== e.currentTarget) return;
              const delta: Record<string, [number, number]> = {
                ArrowLeft: [-2, 0],
                ArrowRight: [2, 0],
                ArrowUp: [0, -2],
                ArrowDown: [0, 2],
              };
              if (delta[e.key]) {
                e.preventDefault();
                move(...delta[e.key]);
              }
            }}
          >
            <div
              ref={fieldViewport}
              className="recognition-field-scroll"
              role="group"
              tabIndex={0}
              aria-label="Football field viewport. Scroll horizontally when magnified."
            >
              <div style={{ width: magnified ? "280%" : "100%" }}>
                <SimField
                  players={play.players}
                  defenders={defenders.map((d) => ({
                    ...d,
                    start: defenderPosition(d, time, assignments, play.players),
                    route: [],
                  }))}
                  time={time}
                  qb={qb}
                  rushYards={rules?.rushYards}
                  showGaps={format === "tackle"}
                  ball={
                    result
                      ? {
                          from: result.from,
                          to: result.target,
                          progress: flight,
                        }
                      : undefined
                  }
                />
              </div>
            </div>
          </div>
          <div className="recognition-magnify">
            <button
              className="lab-button"
              aria-pressed={magnified}
              onClick={() => setMagnified((v) => !v)}
            >
              {magnified ? "Show full field" : "Magnify field"}
            </button>
            <span>
              Magnify to inspect labels. Swipe the field or focus it and use
              arrow keys to pan.
            </span>
          </div>
          <div className="lab-actions">
            <button
              className="lab-button primary"
              disabled={!canSnap || !!result || time >= limit}
              onClick={() => {
                setStarted(true);
                setPlaying(!playing);
              }}
            >
              {playing
                ? "Pause recognition rep"
                : started
                  ? "Resume recognition rep"
                  : "Snap recognition rep"}
            </button>
            <button
              className="lab-button"
              disabled={!started || !!result || time >= limit}
              onClick={() => {
                setPlaying(false);
                setTime((t) => Math.min(limit, t + 0.5));
              }}
            >
              Step recognition rep
            </button>
            <button className="lab-button" onClick={() => reset()}>
              Reset recognition rep
            </button>
          </div>
          <label className="recognition-timeline">
            Review movement
            <input
              aria-label="Recognition timeline"
              type="range"
              min={0}
              max={limit}
              step={0.1}
              value={time}
              disabled={!started || !!result}
              onChange={(e) => {
                setTime(Number(e.target.value));
                setPlaying(false);
              }}
            />
          </label>
          <div className="lab-touch-pad">
            {(
              [
                ["left", -2, 0],
                ["forward", 0, -2],
                ["back", 0, 2],
                ["right", 2, 0],
              ] as const
            ).map(([label, x, y]) => (
              <button
                key={label}
                className="lab-button"
                disabled={!!result}
                aria-label={`Recognition QB ${label}`}
                onClick={() => move(x, y)}
              >
                {label}
              </button>
            ))}
          </div>
          {rules && !rules.qbRun && (
            <p>
              The QB is bounded behind the line of scrimmage. Direct QB running
              is disabled by this selected ruleset.
            </p>
          )}
          <p className="recognition-hint">
            {age.startsWith("Youth")
              ? "Start by counting the players close to the line. Then find the deep defenders. Pause whenever you need."
              : age.startsWith("College")
                ? "Discuss strength declaration, field/boundary, leverage, protection, pattern distribution and alternative checks with your coach."
                : "Compare personnel identity with the surface. Describe the shell, then confirm responsibilities after the snap."}
          </p>
        </div>
        <aside className="recognition-read">
          <h3>Make your pre-snap observations</h3>
          <label>
            {format === "tackle"
              ? "Identify the personnel"
              : "Identify the flag structure"}
            <select
              aria-label="Identify personnel or structure"
              value={guess}
              disabled={started}
              onChange={(e) => setGuess(e.target.value)}
            >
              <option value="">Choose an observation</option>
              {(format === "tackle"
                ? Object.keys(personnelGroups)
                : flagLooks[format].map((p) => p.name)
              ).map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
          {format === "tackle" && (
            <label>
              Identify the front
              <select
                aria-label="Identify the front"
                value={frontGuess}
                disabled={started}
                onChange={(e) => setFrontGuess(e.target.value)}
              >
                <option value="">Choose a front</option>
                {fronts.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </label>
          )}
          <label>
            Possible coverage prediction
            <select
              aria-label="Possible coverage prediction"
              value={prediction}
              disabled={started}
              onChange={(e) => setPrediction(e.target.value)}
            >
              <option value="">Choose a hypothesis</option>
              {(format === "tackle"
                ? [...coverages, "Cannot confirm from alignment"]
                : [
                    "Underneath zones with deep help",
                    "Pressure with deep help",
                    "Cannot confirm from alignment",
                  ]
              ).map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
          <p>
            Youth reps require personnel and possible-coverage observations;
            older reps add the front. College reps add a post-snap defender key.
            These are teaching levels, not athlete skill classifications.
          </p>
          <p>
            Safety depth is a clue. Your prediction is not treated as confirmed
            coverage.
          </p>
          {format === "tackle" && (
            <p>
              Observable box: {boxCount(defenders)} players in the highlighted
              interior region (schematic X 30–70, depth 0–14 yards from LOS).
              Box definitions vary by system.
            </p>
          )}
          {format === "tackle" && (
            <p>
              Potential edge/pressure clues:{" "}
              {defenders
                .filter(
                  (d) => d.start.y === 64 && (d.start.x < 38 || d.start.x > 62),
                )
                .map((d) => d.label)
                .join(", ") || "No wide walked-up marker"}
              . Alignment suggests a possibility, not a guaranteed rush.
            </p>
          )}
          {age.startsWith("College") && (
            <label>
              Post-snap conflict key
              <select
                aria-label="Post-snap conflict key"
                value={conflictKey}
                disabled={started}
                onChange={(e) => setConflictKey(e.target.value)}
              >
                <option value="">
                  Choose a defender to confirm after the snap
                </option>
                {defenders.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label} · {d.role}
                  </option>
                ))}
              </select>
            </label>
          )}
          <h3>Choose a target after the snap</h3>
          <div className="lab-target-grid">
            {play.players
              .filter((p) => p.eligible)
              .map((p) => (
                <button
                  key={p.id}
                  className="lab-button"
                  disabled={
                    !started ||
                    time < 0.5 ||
                    qb.y < 70 ||
                    time >= (rules?.passClock ?? limit) ||
                    !!result
                  }
                  onClick={() => decide(p)}
                >
                  Throw to {p.label}
                </button>
              ))}
          </div>
          <button
            className="lab-button"
            disabled={!started || !!result}
            onClick={() => decide(null)}
          >
            Finish without a throw
          </button>
          {!labelsUnique && (
            <p role="alert">Use unique receiver labels before starting.</p>
          )}
          {formationIssues.length > 0 && <p>{formationIssues.join(" ")}</p>}
          {result && (
            <div
              role="status"
              aria-label="Recognition feedback"
              className="recognition-feedback"
            >
              <h3>Confirm what happened</h3>
              <p>{result.text}</p>
              <p>
                Completed recognition rep recorded for demo {profile.name} in
                this browser.
              </p>
              <Link href="/qb-lab/progress">Review actual activity →</Link>
            </div>
          )}
        </aside>
      </div>
      <details className="recognition-rules">
        <summary>Assignments, techniques and system-dependent terms</summary>
        <p>
          X, H, Y and Z are configurable identifiers, not fixed routes or
          universal positions. The flag5 center uses Y to keep all four eligible
          labels; larger flag rosters also include an eligible center.
          Mike/Will/Sam/Jack, edge, nickel, Bear, box definitions, technique
          suffixes and match exchanges need Coach Tae’s system-specific review.
          A walked-up player is only a potential rusher until his assignment is
          revealed.
        </p>
        <div className="recognition-config">
          <label>
            Player label to customize
            <select
              value={labelPlayer}
              disabled={started}
              onChange={(e) => setLabelPlayer(e.target.value)}
            >
              {play.players
                .filter((p) => p.eligible)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label} · {p.role}
                  </option>
                ))}
            </select>
          </label>
          <label>
            System label
            <input
              aria-label="System receiver label"
              maxLength={12}
              disabled={started}
              value={
                play.players.find((p) => p.id === labelPlayer)?.label ?? ""
              }
              onChange={(e) => {
                const value = e.target.value.replace(/[^A-Za-z0-9-]/g, "");
                setLabelOverrides({ ...labelOverrides, [labelPlayer]: value });
              }}
            />
          </label>
        </div>
        <p>
          Default tackle labels include five identified offensive linemen, QB,
          RB and X/H/Y/Z. Receiver roles follow selected 10/11/12 personnel, not
          a universal letter dictionary.
        </p>
        {format === "tackle" && (
          <table>
            <caption>Shown surface technique landmarks</caption>
            <thead>
              <tr>
                <th>Player</th>
                <th>Personnel role</th>
                <th>Technique</th>
              </tr>
            </thead>
            <tbody>
              {defenders
                .filter((p) => p.start.y === 64)
                .map((p) => (
                  <tr key={p.id}>
                    <td>{p.label}</td>
                    <td>{p.role}</td>
                    <td>{techniqueAt(p.start.x, play)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
        <ul>
          {techniques.map(([n, description, gap]) => (
            <li key={n}>
              <strong>{n}</strong> — {description}; {gap} landmark. Alignment
              does not guarantee a gap assignment.
            </li>
          ))}
        </ul>
        <h3>Post-snap responsibility ledger</h3>
        {!started ? (
          <p>
            Snap the rep to reveal assignments. The pre-snap shell alone is
            insufficient.
          </p>
        ) : (
          <ul>
            {assignments.map((a) => (
              <li key={a.player}>
                <strong>
                  {defenders.find((p) => p.id === a.player)?.label}: {a.job}
                </strong>{" "}
                — {a.responsibility}
              </li>
            ))}
          </ul>
        )}
        <p>
          Sources:{" "}
          <a
            href="https://nflflag.com/flag-football-rules"
            target="_blank"
            rel="noopener noreferrer"
          >
            NFL FLAG rules
          </a>
          ;{" "}
          <a
            href="https://operations.nfl.com/learn-the-game/nfl-basics/terms-glossary/"
            target="_blank"
            rel="noopener noreferrer"
          >
            NFL Football Operations glossary
          </a>
          . Sources support terminology/rules context, not endorsement of these
          authored paths. Coaching review of all coverage, pressure and match
          branches remains required.
        </p>
      </details>
    </section>
  );
}
