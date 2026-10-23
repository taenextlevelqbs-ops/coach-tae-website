import { createEngine, snap, step } from "./engine";
import type { EngineConfig, EngineState, Input } from "./types";

/** Session-only input recording. Never imports athlete history or grants authority. */
export type RecordedRep = {
  initial: EngineState;
  state: EngineState;
  inputs: Input[];
};
export function beginRep(config: EngineConfig): RecordedRep {
  const initial = snap(createEngine(config));
  return { initial, state: initial, inputs: [] };
}
export function advanceRep(rep: RecordedRep, count: number, input: Input = {}): RecordedRep {
  if (!Number.isInteger(count) || count < 0 || count > 600) throw new Error("Advance 0–600 whole ticks.");
  let state = rep.state;
  const inputs = [...rep.inputs];
  for (let i = 0; i < count && state.phase !== "done"; i++) {
    state = step(state, input);
    inputs.push(structuredClone(input));
  }
  return { initial: rep.initial, state, inputs };
}
/** Sparse checkpoints bound seek work to <15 fixed ticks and memory to ≤37 states. */
export function buildReplay(rep: RecordedRep) {
  const checkpoints = new Map<number, EngineState>([[0, rep.initial]]);
  let state = rep.initial;
  rep.inputs.forEach((input, index) => {
    state = step(state, input);
    if ((index + 1) % 15 === 0) checkpoints.set(index + 1, state);
  });
  return { checkpoints, rep };
}
export function replayAt(replay: ReturnType<typeof buildReplay>, tick: number) {
  if (!Number.isInteger(tick) || tick < 0 || tick > replay.rep.inputs.length) throw new Error("Replay tick is outside this recorded rep.");
  const base = Math.floor(tick / 15) * 15;
  let state = replay.checkpoints.get(base)!;
  for (let i = base; i < tick; i++) state = step(state, replay.rep.inputs[i]);
  return state;
}
