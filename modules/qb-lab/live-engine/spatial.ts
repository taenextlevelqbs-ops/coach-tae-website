import { deepZones, zoneContains, type Side } from "../football/geometry";
import { tuning } from "./tuning";
import type { Actor, EngineConfig, EngineState } from "./types";
export function selectedHalf(config: EngineConfig): Side {
  if (config.halfSide) return config.halfSide;
  if (config.coverage !== "Cover 8") return "left";
  const tactics = config.play?.tactics;
  return tactics?.hash === "left"
    ? "right"
    : tactics?.hash === "right"
      ? "left"
      : (tactics?.strongSide ?? "right");
}
export function assignSpatialZones(players: Actor[], config: EngineConfig) {
  const r = config.rules;
  const zones = deepZones(config.coverage, r.width, selectedHalf(config));
  if (!zones.length) return;
  const defense = players.filter(
    (p) => p.team === "defense" && p.job !== "rush",
  );
  const deep = defense.filter(
    (p) =>
      /deep|quarter|half/i.test(p.responsibility) || p.landmark.y >= r.los + 15,
  );
  // Tackle deep assignments arrive in authored slot order; passing-event safeties follow underneath defenders.
  const priority =
    config.coverage === "Cover 2"
      ? ["FS", "SS"]
      : config.coverage === "Cover 3"
        ? ["CB-L", "FS", "CB-R"]
        : config.coverage === "Cover 6" || config.coverage === "Cover 8"
          ? selectedHalf(config) === "left"
            ? ["FS", "SS", "CB-R"]
            : ["CB-L", "FS", "SS"]
          : ["CB-L", "FS", "SS", "CB-R"];
  const rank = (a: Actor) =>
    priority.includes(a.label) ? priority.indexOf(a.label) : 20 + a.landmark.x;
  const selected = deep
    .sort((a, b) => rank(a) - rank(b))
    .slice(0, zones.length);
  for (let i = 0; i < selected.length; i++) {
    const a = selected[i];
    a.zone = {
      ...zones[i],
      minDepth: zones[i].match ? (config.matchDepth ?? 11) : zones[i].minDepth,
    };
    a.job = a.zone.match ? "match" : "zone";
    a.receiver = undefined;
    a.matched = false;
    a.landmark = {
      x: (a.zone.minX + a.zone.maxX) / 2,
      y: Math.min(r.length, r.los + 22),
    };
    a.responsibility = `${a.zone.name}. ${a.zone.match ? "Carry one observed vertical after the selected trigger; switches, brackets and poach checks are NOT implemented." : "Protect this deep interval, react to observed threats, exchange routes that leave it and break on a visible throw after reaction delay."}`;
  }
  const under = defense
    .filter((p) => !selected.includes(p) && p.job !== "man")
    .sort((a, b) => a.start.x - b.start.x);
  const labels = [
    "Left flat",
    "Left hook-to-curl",
    "Middle hole",
    "Right hook-to-curl",
    "Right flat",
  ];
  for (let i = 0; i < under.length; i++) {
    const a = under[i];
    a.zone = {
      minX: (r.width * i) / under.length,
      maxX: (r.width * (i + 1)) / under.length,
      minDepth: 0,
      maxDepth: 15,
      match: false,
      name: under.length === 5 ? labels[i] : `Underneath window ${i + 1}`,
    };
    a.landmark = { x: (a.zone.minX + a.zone.maxX) / 2, y: r.los + 8 };
    a.receiver = undefined;
    a.matched = false;
    a.responsibility = `${a.zone.name}. React to an observed receiver within this authored window; release it at the boundary and gain the next threat. Break on a nearby visible throw after reaction delay. Not a complete match/communication system.`;
  }
}
export function spatialTarget(a: Actor, s: EngineState) {
  const zone = a.zone;
  if (!zone) return null;
  const r = s.config.rules;
  // React to the observed ball, never its hidden landing coordinate. This lives
  // here because spatial actors return before engine.ts's legacy zone fallback.
  const ball = s.ball;
  if (
    ball &&
    ball.elapsed > tuning.throwReactionDelaySeconds + (1 - a.ratings.awareness) * 0.4 &&
    Math.hypot(ball.pos.x - a.pos.x, ball.pos.y - a.pos.y) < 9
  ) {
    if (!s.events.some((e) => e.kind === "ball-read" && e.actors?.[0] === a.id))
      s.events.push({
        tick: s.tick,
        kind: "ball-read",
        text: `${a.label} reacted to the visible ball after the model's response delay.`,
        actors: [a.id],
      });
    return { ...ball.pos };
  }
  if (a.matched && a.receiver) {
    const receiver = s.players.find((p) => p.id === a.receiver);
    if (receiver) return { x: receiver.pos.x, y: receiver.pos.y + 0.7 };
  }
  const threats = s.players.filter(
    (p) =>
      p.team === "offense" &&
      p.job === "route" &&
      zoneContains(zone, p.pos, r.los, r.width),
  );
  const target = threats.sort(
    (p, q) =>
      Math.hypot(p.pos.x - a.pos.x, p.pos.y - a.pos.y) -
        Math.hypot(q.pos.x - a.pos.x, q.pos.y - a.pos.y) ||
      p.id.localeCompare(q.id),
  )[0];
  if (zone.match && target) {
    // Observable position only, never future route points; one defender claims one receiver.
    if (
      !s.players.some(
        (d) =>
          d !== a &&
          d.team === "defense" &&
          d.matched &&
          d.receiver === target.id,
      )
    ) {
      a.receiver = target.id;
      a.matched = true;
      s.events.push({
        tick: s.tick,
        kind: "match",
        text: `${a.label} carried ${target.label} after the ${zone.minDepth}-yard authored vertical trigger.`,
        actors: [a.id, target.id],
      });
      return { x: target.pos.x, y: target.pos.y + 0.7 };
    }
  }
  // receiver is current zone attention, not a permanent man assignment. Record
  // actual acquisitions/exchanges once when that attention changes, not per tick.
  if (!zone.match && a.receiver !== target?.id) {
    if (a.receiver)
      s.events.push({
        tick: s.tick,
        kind: "zone-release",
        text: `${a.label} released the previous threat from ${zone.name}; this is an authored zone exchange, not a man carry.`,
        actors: [a.id, a.receiver],
      });
    a.receiver = target?.id;
    if (target)
      s.events.push({
        tick: s.tick,
        kind: "zone-acquire",
        text: `${a.label} gained ${target.label} in ${zone.name} from observed position.`,
        actors: [a.id, target.id],
      });
  }
  return target
    ? {
        x: Math.max(zone.minX, Math.min(zone.maxX, target.pos.x)),
        y: Math.min(
          r.length,
          Math.max(
            r.los + zone.minDepth,
            Math.min(r.los + zone.maxDepth, target.pos.y + 1),
          ),
        ),
      }
    : a.landmark;
}
