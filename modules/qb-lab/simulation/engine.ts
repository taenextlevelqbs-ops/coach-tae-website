import {
  duration,
  type Decision,
  type Player,
  type Point,
  type Scenario,
} from "./model";
export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
export function advance(time: number, delta: number, speed = 1) {
  return clamp(time + Math.max(0, delta) * clamp(speed, 0.25, 2), 0, duration);
}
/** Renderer-independent linear path sampling. Timing is authored, not a physics model. */
export function position(player: Player, time: number): Point {
  const points = [player.start, ...player.route];
  if (points.length === 1) return player.start;
  const scaled =
    clamp(
      (time - (player.delay ?? 0)) /
        Math.max(0.1, duration - (player.delay ?? 0)),
      0,
      1,
    ) *
    (points.length - 1);
  const i = Math.min(points.length - 2, Math.floor(scaled));
  const blend = scaled - i;
  return {
    x: points[i].x + (points[i + 1].x - points[i].x) * blend,
    y: points[i].y + (points[i + 1].y - points[i].y) * blend,
  };
}
export function moveQB(point: Point, dx: number, dy: number): Point {
  return { x: clamp(point.x + dx, 30, 70), y: clamp(point.y + dy, 74, 94) };
}
export function evaluate(
  scenario: Scenario,
  target: string,
  time: number,
  qb: Point,
): Decision {
  const receiver = scenario.play.players.find(
    (p) =>
      p.id === target &&
      p.id !== "QB" &&
      p.eligible !== false &&
      p.route.length > 0,
  );
  if (!receiver || !Number.isFinite(time) || time < 1.5 || time >= duration)
    return {
      points: 0,
      max: 2,
      separation: 0,
      target,
      time,
      feedback:
        time >= duration
          ? "The authored decision window expired. Reset, inspect the paths and choose before 6 seconds."
          : "Choose a drawn route after the 1.5-second observation window. No score was inferred from a real athlete.",
    };
  const at = position(receiver, time);
  const separation = Math.min(
    ...scenario.defenders.map((d) => {
      const p = position(d, time);
      return Math.hypot(at.x - p.x, at.y - p.y);
    }),
  );
  const spaced = separation >= 12;
  const forward = at.y < qb.y - 2;
  return {
    points: (spaced ? 1 : 0) + (forward ? 1 : 0),
    max: 2,
    separation: Math.round(separation * 10) / 10,
    target,
    time,
    feedback: `${spaced ? "Spacing criterion met" : "A defender is inside the spacing threshold"} (${separation.toFixed(1)} schematic units; threshold 12). ${forward ? "The target is ahead of the controlled QB." : "The target is not ahead of the controlled QB."} These two geometry checks score this toy decision only; they do not establish a legal or safe pass, coverage, protection or football ability.`,
  };
}
