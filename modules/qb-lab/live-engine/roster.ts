import {
  buildDefense,
  validateFormation,
  personnelGroups,
  fronts,
  coverages,
} from "../football/content";
import {
  formation,
  type Point,
  type Player,
  type Play,
} from "../simulation/model";
import { validateRules } from "./formats";
import type { Actor, EngineConfig, Ratings } from "./types";
export const distance = (a: Point, b: Point) =>
  Math.hypot(a.x - b.x, a.y - b.y);
export const bound = (x: number, min: number, max: number) =>
  Math.max(min, Math.min(max, x));
/** Stateless seeded draw: deterministic across frame schedules and unrelated random calls. */
export function seeded(seed: number, key: string): number {
  let h = seed | 0;
  for (let i = 0; i < key.length; i++)
    h = Math.imul(h ^ key.charCodeAt(i), 16777619);
  h ^= h >>> 16;
  h = Math.imul(h, 0x45d9f3b);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
function ratings(seed: number, id: string): Ratings {
  const keys: (keyof Ratings)[] = [
    "speed",
    "acceleration",
    "strength",
    "power",
    "finesse",
    "shedding",
    "pursuit",
    "awareness",
    "contain",
    "stamina",
    "passBlock",
    "runBlock",
    "footwork",
    "agility",
    "recovery",
    "anchor",
  ];
  return Object.fromEntries(
    keys.map((k) => [k, 0.55 + seeded(seed, id + k) * 0.25]),
  ) as Ratings;
}
export function sharedPlay(c: EngineConfig): Play {
  if (c.rules.format === "passing7") {
    const p = formation(c.rules.offense === 7 ? "flag7" : "flag5");
    if (c.rules.offense === 6) {
      p.players.push({
        id: "R4",
        label: "Y",
        role: "WR",
        eligible: true,
        start: { x: 30, y: 74 },
        route: [
          { x: 35, y: 45 },
          { x: 35, y: 20 },
        ],
      });
      p.players.find((a) => a.id === "C")!.label = "C";
    }
    return p;
  }
  return (
    c.play ??
    formation(c.rules.format === "tackle11" ? "tackle" : c.rules.format)
  );
}
export function validateConfig(c: EngineConfig): string[] {
  const issues = validateRules(c.rules);
  if (c.matchup !== undefined && !["balanced", "offense-edge", "defense-edge"].includes(c.matchup)) issues.push("Invalid synthetic matchup.");
  if (c.blitzTempo !== undefined && (!Number.isFinite(c.blitzTempo) || c.blitzTempo < 0 || c.blitzTempo > 0.25)) issues.push("Blitz tempo must be from 0 to 0.25.");
  if (
    !Object.keys(personnelGroups).includes(c.personnel) ||
    !fronts.includes(c.front) ||
    !coverages.includes(c.coverage) ||
    ![0, 1, 2].includes(c.shell)
  )
    issues.push("Invalid defensive configuration.");
  if (
    ![
      "man",
      "half-slide-left",
      "half-slide-right",
      "full-slide-left",
      "full-slide-right",
    ].includes(c.protection) ||
    !["none", "RB", "TE", "RB+TE"].includes(c.help)
  )
    issues.push("Invalid protection declaration.");
  if (!["learn", "practice", "challenge"].includes(c.mode))
    issues.push("Invalid learning mode.");
  if (
    ![
      "bull",
      "speed",
      "swim",
      "rip",
      "spin",
      "interior",
      "edge",
      "twist",
      "delayed",
      "contain",
    ].includes(c.rushMove)
  )
    issues.push("Invalid rush technique.");
  if (
    c.rules.format !== "tackle11" &&
    !["Cover 0", "Cover 1", "Cover 2", "Cover 3"].includes(c.coverage)
  )
    issues.push(
      "This event engine currently supports man, one-high man, two-deep or three-deep teaching responsibilities; advanced match examples remain in Recognition Lab.",
    );
  if (
    c.rules.format !== "tackle11" &&
    ["Cover 0", "Cover 1"].includes(c.coverage) &&
    c.rules.defense - c.rules.rushers - (c.coverage === "Cover 1" ? 1 : 0) <
      c.rules.eligibleLimit
  )
    issues.push(
      "Not enough defenders for all eligible man assignments and the selected deep helper.",
    );
  if (!Number.isSafeInteger(c.seed) || c.seed < 0 || c.seed > 2147483647)
    issues.push("Seed must be an integer from 0 to 2147483647.");
  if (
    c.coverage === "Cover 1" &&
    c.rules.format === "tackle11" &&
    c.rules.rushers > 5
  )
    issues.push(
      "Cover 1 needs five man assignments and one deep helper for this fixture.",
    );
  if (c.rules.format !== "passing7") {
    const p = sharedPlay(c);
    if (
      p.format !== (c.rules.format === "tackle11" ? "tackle" : c.rules.format)
    )
      issues.push("Saved play does not match the game format.");
    issues.push(...validateFormation(p));
    if (
      p.players.some(
        (a) =>
          a.start.x < 0 ||
          a.start.x > 100 ||
          c.rules.los + (70 - a.start.y) * 0.5 < 0 ||
          c.rules.los + (70 - a.start.y) * 0.5 > c.rules.length,
      )
    )
      issues.push(
        "The shared formation starts outside this configured field; adjust the formation or event line of scrimmage.",
      );
    if (
      c.rules.format === "tackle11" &&
      p.players.some((a) => !a.role || a.eligible === undefined)
    )
      issues.push(
        "Legacy play needs explicit reviewed roles/eligibility before live protection. It remains available in the original simulator.",
      );
  }
  return issues;
}
export function makeRoster(c: EngineConfig): Actor[] {
  const r = c.rules;
  const play = sharedPlay(c);
  const world = (p: Point): Point => ({
    x: (p.x * r.width) / 100,
    y: r.los + (70 - p.y) * 0.5,
  });
  const actor = (p: Player, team: Actor["team"]): Actor => ({
    id: p.id,
    label: p.label,
    team,
    role: p.role ?? "WR",
    eligible: !!p.eligible,
    pos: world(p.start),
    start: world(p.start),
    velocity: { x: 0, y: 0 },
    route: p.route.map(world),
    ratings: ratings(c.seed, p.id),
    job: "route",
    landmark: world(p.start),
    responsibility:
      "Authored route; progression depends on your offensive system.",
    move: c.rushMove,
    delay: 0,
    recoveryUntil: 0,
    fatigue: 0,
  });
  let allowance = r.eligibleLimit;
  const offense = play.players.map((p) => {
    const a = actor(p, "offense");
    if (p.id === "QB") {
      a.job = "qb";
      a.eligible = false;
    } else if (
      r.format === "tackle11" &&
      (p.role === "OL" ||
        p.role === "C" ||
        (p.role === "RB" && c.help.includes("RB")) ||
        (p.role === "TE" && c.help.includes("TE")))
    ) {
      a.job = "block";
      a.responsibility = "Pass protection; unavailable as a target this rep.";
    } else if (a.eligible && allowance > 0) {
      allowance--;
      a.job = "route";
    } else {
      a.eligible = false;
      a.job = "inactive";
      a.responsibility =
        "Snap participant; no receiving or blocking assignment in this event.";
    }
    return a;
  });
  let defense: Actor[];
  if (r.format === "tackle11") {
    const d = buildDefense(
      play,
      c.personnel,
      c.front,
      c.coverage,
      c.shell,
      r.rushers,
    );
    defense = d.players.map((p) => {
      const a = actor(p, "defense");
      const job = d.assignments.find((j) => j.player === p.id)!;
      a.job = job.job;
      a.receiver = job.receiver;
      a.responsibility = job.responsibility;
      a.landmark = world(p.route.at(-1) ?? p.start);
      if (a.job === "match") {
        // Establish quarters from alignment, never inspect a future route to choose the assignment.
        const matchers = d.assignments.filter((j) => j.job === "match");
        const slot = matchers.findIndex((j) => j.player === p.id);
        a.landmark = {
          x: (r.width * (slot + 0.5)) / matchers.length,
          y: r.los + 29,
        };
      }
      if (a.job === "rush") {
        a.delay =
          c.rushMove === "delayed" && p.id === d.players[r.rushers - 1].id
            ? 1.1
            : 0;
        a.responsibility = `${c.rushMove} rush: react to QB position; protection can account for this defender.`;
      }
      return a;
    });
  } else {
    const deep =
      c.coverage === "Cover 0"
        ? 0
        : c.coverage === "Cover 1"
          ? 1
          : c.coverage === "Cover 3"
            ? 3
            : 2;
    const targets = offense.filter((a) => a.job === "route");
    const isMan = c.coverage === "Cover 0" || c.coverage === "Cover 1";
    defense = Array.from({ length: r.defense }, (_, i) => {
      const rush = i < r.rushers;
      const remaining = r.defense - r.rushers;
      const slot = i - r.rushers;
      const high = !rush && slot >= remaining - deep;
      const x = rush
        ? (r.width * (i + 1)) / (r.rushers + 1)
        : (r.width * (slot + 1)) / (remaining + 1);
      const p: Player = {
        id: `D${i + 1}`,
        label: rush
          ? `Rush${i + 1}`
          : high
            ? `S${slot - (remaining - deep) + 1}`
            : `DB${slot + 1}`,
        role: rush ? "rusher" : "DB",
        eligible: false,
        start: {
          x: (100 * x) / r.width,
          y: 70 - 2 * (rush ? r.rushDistance : high ? 13 : 5),
        },
        route: [],
      };
      const a = actor(p, "defense");
      a.job = rush ? "rush" : isMan && slot < targets.length ? "man" : "zone";
      a.receiver =
        a.job === "man" ? targets[slot % targets.length]?.id : undefined;
      a.landmark = {
        x: high
          ? (r.width * (slot - (remaining - deep) + 0.5)) / Math.max(1, deep)
          : x,
        y: r.los + (high ? 22 : 8),
      };
      a.delay = rush ? r.rushDelay : 0;
      a.responsibility = rush
        ? `Designated rusher, ${r.rushDistance} yards back, delay ${r.rushDelay}s.`
        : a.job === "man"
          ? `Track ${targets.find((t) => t.id === a.receiver)?.label}.`
          : `${high ? "Deep" : "Underneath"} instructional responsibility; event review required.`;
      return a;
    });
  }
  const edge = c.matchup === "offense-edge" ? 0.15 : c.matchup === "defense-edge" ? -0.15 : 0;
  for (const a of offense.filter(p => p.job === "block")) {
    a.ratings.passBlock = bound(a.ratings.passBlock + edge, 0, 1);
    a.ratings.anchor = bound(a.ratings.anchor + edge, 0, 1);
  }
  return [...offense, ...defense];
}
