// @vitest-environment node
import { expect, it } from "vitest";
import { defaultConfig } from "../../modules/qb-lab/live-engine/defaults";
import { advanceRep, beginRep, buildReplay, replayAt } from "../../modules/qb-lab/live-engine/replay";
import { step } from "../../modules/qb-lab/live-engine/engine";

it("records exact movement and release inputs, seeks deterministically without changing the completed rep", () => {
  let rep = beginRep(defaultConfig());
  rep = advanceRep(rep, 15, { move: { x: -1, y: 0 } });
  rep = advanceRep(rep, 15, { move: { x: 0, y: 1 } });
  rep = advanceRep(rep, 1, { throwTo: "R5" });
  rep = advanceRep(rep, 200);
  expect(rep.state.phase).toBe("done");
  const before = structuredClone(rep);
  const replay = buildReplay(rep);
  let expected = rep.initial;
  rep.inputs.forEach((input, index) => {
    expected = step(expected, input);
    if ([0, 14, 15, 29, rep.inputs.length - 1].includes(index)) expect(replayAt(replay, index + 1)).toEqual(expected);
  });
  expect(replayAt(replay, rep.inputs.length)).toEqual(rep.state);
  expect(replayAt(replay, 0)).toEqual(rep.initial);
  expect(rep).toEqual(before);
  expect(replay.checkpoints.size).toBeLessThanOrEqual(37);
  expect(() => replayAt(replay, -1)).toThrow(/outside/);
  expect(() => replayAt(replay, rep.inputs.length + 1)).toThrow(/outside/);
  expect(() => advanceRep(rep, 0.5)).toThrow(/whole/);
  expect(advanceRep(rep, 30).inputs).toHaveLength(rep.inputs.length);
});
