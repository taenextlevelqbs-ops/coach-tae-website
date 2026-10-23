import { formation, type Play } from "../simulation/model";
import { defaultConfig } from "./defaults";
import { createEngine, snap, step } from "./engine";
import type { EngineConfig, EngineState, Input } from "./types";

/** Synthetic, reproducible instructional examples. These are not approved coaching answer keys. */
export type AcceptanceScenario = {
  id: string;
  title: string;
  intent: string;
  config: EngineConfig;
  inputs: { tick: number; input: Input }[];
  ticks: number;
};

function floodPlay(name: string): Play {
  const p = formation("tackle");
  p.id = name;
  p.name = "Three-level right-side distribution";
  const changes = {
    R5: { start: { x: 10, y: 70 }, route: [{ x: 10, y: 14 }] },
    R6: { start: { x: 65, y: 74 }, route: [{ x: 84, y: 66 }] },
    R7: { start: { x: 76, y: 70 }, route: [{ x: 76, y: 48 }, { x: 94, y: 42 }] },
    R8: { start: { x: 88, y: 74 }, route: [{ x: 88, y: 14 }] },
  };
  for (const player of p.players) {
    const change = changes[player.id as keyof typeof changes];
    if (change) Object.assign(player, change);
  }
  return p;
}

function scenario(
  id: string,
  title: string,
  intent: string,
  patch: Partial<EngineConfig>,
  inputs: AcceptanceScenario["inputs"],
  ticks = 180,
): AcceptanceScenario {
  return { id, title, intent, config: { ...defaultConfig(), ...patch }, inputs, ticks };
}

export const acceptanceScenarios: AcceptanceScenario[] = [
  scenario(
    "four-v-five",
    "Four rushers, five blockers",
    "Observe geometric protection, then release to the running back before live pressure. A four-man rush has no forced three-second win.",
    { seed: 42, matchup: "offense-edge" },
    [{ tick: 37, input: { throwTo: "R9" } }],
  ),
  scenario(
    "six-with-help",
    "Six threats, RB protection help",
    "Six blockers can account for six assigned rushers. Verify that the RB actually engages rather than assuming a blitz is free.",
    {
      seed: 42,
      rules: { ...defaultConfig().rules, rushers: 6 },
      matchup: "offense-edge",
      help: "RB",
    },
    [{ tick: 121, input: { throwAway: true } }],
  ),
  scenario(
    "six-no-help",
    "Six threats, five blockers",
    "One threat is initially unaccounted for. Watch its actual path to the QB; urgency is positional, not a countdown-created sack.",
    { seed: 42, rules: { ...defaultConfig().rules, rushers: 6 } },
    [],
    300,
  ),
  scenario(
    "cover-two-flood",
    "Cover 2 · three-level distribution",
    "Watch the short, intermediate and deep right-side routes against the authored two-half/five-underneath spot-drop model. This is not a complete flood coverage check.",
    { seed: 42, matchup: "offense-edge", coverage: "Cover 2", play: floodPlay("acceptance-c2-flood") },
    [{ tick: 91, input: { throwAway: true } }],
  ),
  scenario(
    "cover-three-stretch",
    "Cover 3 · three-level distribution",
    "Compare the same routes against three deep thirds and four underneath windows. Complete match checks and coaching progressions are not implemented.",
    { seed: 42, matchup: "offense-edge", coverage: "Cover 3", play: floodPlay("acceptance-c3-stretch") },
    [{ tick: 91, input: { throwAway: true } }],
  ),
  scenario(
    "quarters-vertical",
    "Quarters · limited vertical-match branch",
    "The explicitly authored match branch carries observed vertical releases at eleven yards. Switches, poach and complete match communication remain unimplemented.",
    { seed: 42, matchup: "offense-edge", coverage: "Quarters match", help: "RB", matchDepth: 11 },
    [{ tick: 91, input: { throwAway: true } }],
  ),
];

/** A full rep from validated formation to actual engine result, with no mid-rep state manipulation. */
export function runAcceptance(example: AcceptanceScenario): EngineState[] {
  if (!Number.isInteger(example.ticks) || example.ticks < 1 || example.ticks > 540)
    throw new Error("Acceptance reps must contain 1–540 fixed ticks.");
  let state = snap(createEngine(structuredClone(example.config)));
  const frames = [state];
  const inputs = new Map(example.inputs.map((event) => [event.tick, event.input]));
  for (let tick = 1; tick <= example.ticks && state.phase !== "done"; tick++) {
    state = step(state, inputs.get(tick) ?? {});
    frames.push(state);
  }
  return frames;
}
