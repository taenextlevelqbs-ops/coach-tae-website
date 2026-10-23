import { deepZones, zoneContains, type Side } from "../football/geometry";
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
    a.responsibility = a.zone.name;
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
    a.responsibility = a.zone.name;
  }
}
export function spatialTarget(a: Actor, s: EngineState) {
  const zone = a.zone;
  if (!zone) return null;
  const r = s.config.rules;
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
