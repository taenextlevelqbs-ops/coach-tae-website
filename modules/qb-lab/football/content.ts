import { position } from "../simulation/engine";
import {
  formation,
  rosterSize,
  type Format,
  type Play,
  type Player,
} from "../simulation/model";
export const personnelGroups = {
  "3-4": { DL: 3, LB: 4, DB: 4 },
  "4-3": { DL: 4, LB: 3, DB: 4 },
  "4-2-5": { DL: 4, LB: 2, DB: 5 },
  "3-3-5": { DL: 3, LB: 3, DB: 5 },
  "5-2": { DL: 5, LB: 2, DB: 4 },
} as const;
export type Personnel = keyof typeof personnelGroups;
export const fronts = [
  "Odd",
  "Even",
  "Three-man surface",
  "Four-man surface",
  "Bear",
  "Overload",
] as const;
export type Front = (typeof fronts)[number];
export const coverages = [
  "Cover 0",
  "Cover 1",
  "Cover 2",
  "Cover 3",
  "Cover 4",
  "Cover 6",
  "Quarters match",
] as const;
export type Coverage = (typeof coverages)[number];
export type Rules = {
  id: string;
  format: Format;
  rushYards: number;
  rushDelay: number;
  passClock: number;
  qbRun: boolean;
  blocking: boolean;
  contact: boolean;
};
/** Source summary, not a complete rulebook or certification of formation legality. */
export const nflFlag5: Rules = {
  id: "NFL FLAG 5v5 · source summary",
  format: "flag5",
  rushYards: 7,
  rushDelay: 0,
  passClock: 7,
  qbRun: false,
  blocking: false,
  contact: false,
};
export const techniques = [
  ["0", "Head-up on the center", "Center"],
  ["1", "Center shoulder", "A gap"],
  ["2i", "Inside shoulder of guard", "A gap"],
  ["2", "Head-up on guard", "Guard"],
  ["3", "Outside shoulder of guard", "B gap"],
  ["4i", "Inside shoulder of tackle", "B gap"],
  ["4", "Head-up on tackle", "Tackle"],
  ["5", "Outside shoulder of tackle", "C gap"],
  ["6", "Head-up on attached tight end", "Tight end"],
  ["9", "Outside shoulder of attached tight end", "Outside edge"],
] as const;
export type Assignment = {
  player: string;
  job: "rush" | "zone" | "man" | "match" | "spy";
  responsibility: string;
  receiver?: string;
};
export type Defense = {
  personnel: Personnel;
  front: Front;
  coverage: Coverage;
  shell: 0 | 1 | 2;
  rush: number;
  players: Player[];
  assignments: Assignment[];
};
const deepCount: Record<Coverage, number> = {
  "Cover 0": 0,
  "Cover 1": 1,
  "Cover 2": 2,
  "Cover 3": 3,
  "Cover 4": 4,
  "Cover 6": 3,
  "Quarters match": 4,
};
export function validRules(r: Rules, format: Format) {
  return (
    r.format === format &&
    Number.isFinite(r.rushYards) &&
    r.rushYards >= 0 &&
    r.rushYards <= 15 &&
    Number.isFinite(r.rushDelay) &&
    r.rushDelay >= 0 &&
    r.rushDelay <= 5 &&
    Number.isFinite(r.passClock) &&
    r.passClock >= 2 &&
    r.passClock <= 15 &&
    [r.qbRun, r.blocking, r.contact].every((v) => typeof v === "boolean")
  );
}
export function validateFormation(play: Play): string[] {
  const issues: string[] = [];
  if (play.players.filter((p) => p.id === "QB").length !== 1)
    issues.push("Exactly one quarterback must be identified.");
  if (play.players.filter((p) => p.role === "C").length !== 1)
    issues.push("Exactly one center must be identified.");
  if (play.players.length !== rosterSize(play.format))
    issues.push("Roster count does not match the selected format.");
  if (new Set(play.players.map((p) => p.label)).size !== play.players.length)
    issues.push("Labels must be unique within the formation.");
  if (play.format === "tackle") {
    const line = play.players.filter((p) => Math.abs(p.start.y - 70) < 0.5);
    if (line.length < 7)
      issues.push(
        "This tackle fixture needs at least seven players on the line of scrimmage.",
      );
    const interior = [...line]
      .sort((a, b) => a.start.x - b.start.x)
      .slice(1, -1);
    if (interior.some((p) => p.eligible))
      issues.push(
        "An eligible player is covered on the line; check end-man eligibility.",
      );
    if (
      play.players.filter((p) => p.role === "OL" || p.role === "C").length !== 5
    )
      issues.push("The tackle fixture must identify five offensive linemen.");
    if (
      play.players.some(
        (p) => p.eligible === false && p.role !== "QB" && p.route.length,
      )
    )
      issues.push("An ineligible lineman has a receiving route.");
  }
  return issues;
}
export function buildDefense(
  play: Play,
  personnel: Personnel,
  front: Front,
  coverage: Coverage,
  shell: 0 | 1 | 2,
  rush: number,
): Defense {
  const counts = personnelGroups[personnel];
  const roles = [
    ...Array(counts.DL).fill("DL"),
    ...Array(counts.LB).fill("LB"),
    ...Array(counts.DB).fill("DB"),
  ] as ("DL" | "LB" | "DB")[];
  const eligible = play.players.filter((p) => p.eligible);
  const matchReceivers = [...eligible]
    .filter((p) => p.role !== "RB")
    .sort((a, b) => a.start.x - b.start.x);
  const dlX =
    front === "Bear"
      ? [44, 50, 56, 31, 69]
      : front === "Overload"
        ? [50, 56, 62, 69, 75]
        : front === "Even" || front === "Four-man surface"
          ? [35, 47, 59, 69, 77]
          : [35, 50, 65, 27, 73];
  const surface =
    front === "Three-man surface" || front === "Odd"
      ? 3
      : front === "Four-man surface" || front === "Even"
        ? 4
        : front === "Bear"
          ? 5
          : 4;
  const deep = deepCount[coverage];
  const rushCount = Math.max(
    2,
    Math.min(coverage === "Cover 1" ? 5 : 6, Math.round(rush)),
  );
  // Grouping is roster identity; a linebacker can walk onto a surface or a DL can drop.
  const names = roles.map((role, i) =>
    role === "DL"
      ? ["E", "N", "T", "E2", "T2"][i]
      : role === "LB"
        ? ["Mike", "Will", "Sam", "Jack"][i - counts.DL]
        : ["CB-L", "CB-R", "FS", "SS", "Nickel"][i - counts.DL - counts.LB],
  );
  const priority =
    coverage === "Cover 2" || coverage === "Cover 1"
      ? ["FS", "SS", "CB-L", "CB-R", "Nickel"]
      : coverage === "Cover 3"
        ? ["CB-L", "FS", "CB-R", "SS", "Nickel"]
        : ["CB-L", "FS", "SS", "CB-R", "Nickel"];
  const remaining = roles.map((_, i) => i).filter((i) => i >= rushCount);
  const deepIndices = [...remaining]
    .sort((a, b) => {
      const rank = (i: number) =>
        roles[i] === "DB" ? priority.indexOf(names[i]) : 20 + i;
      return rank(a) - rank(b);
    })
    .slice(0, deep);
  const startAt = (i: number) => {
    const atSurface = i < surface;
    let start = {
      x: atSurface
        ? dlX[i]
        : 10 + (80 * (i - surface)) / Math.max(1, 10 - surface),
      y: atSurface ? 64 : 49,
    };
    if (roles[i] === "LB" && !atSurface)
      start = { x: (100 * (i - counts.DL + 1)) / (counts.LB + 1), y: 49 };
    if (names[i] === "CB-L") start = { x: 12, y: 49 };
    if (names[i] === "CB-R") start = { x: 88, y: 49 };
    if (names[i] === "Nickel") start = { x: 35, y: 46 };
    if (names[i] === "FS")
      start = {
        x: shell === 1 ? 50 : shell === 2 ? 28 : 35,
        y: shell >= 1 ? 21 : 49,
      };
    if (names[i] === "SS")
      start = { x: shell === 2 ? 72 : 65, y: shell === 2 ? 21 : 49 };
    return start;
  };
  const underIndices = remaining
    .filter((i) => !deepIndices.includes(i))
    .sort((a, b) => startAt(a).x - startAt(b).x);
  const manAssignments = new Map<number, Player>();
  if (coverage === "Cover 0" || coverage === "Cover 1") {
    const freeTargets = [...eligible];
    const order = [...underIndices].sort((a, b) => {
      const rank = (i: number) =>
        names[i].startsWith("CB-")
          ? 0
          : names[i] === "Nickel"
            ? 1
            : roles[i] === "LB"
              ? 2
              : roles[i] === "DL"
                ? 3
                : 4;
      return rank(a) - rank(b);
    });
    for (const i of order)
      if (freeTargets.length) {
        freeTargets.sort(
          (a, b) =>
            Math.abs(a.start.x - startAt(i).x) -
            Math.abs(b.start.x - startAt(i).x),
        );
        manAssignments.set(i, freeTargets.shift()!);
      }
  }
  const assignments: Assignment[] = [];
  const players = roles.map((role, i): Player => {
    const id = `D${i + 1}`;
    const start = startAt(i);
    const slot = deepIndices.includes(i)
      ? deepIndices.indexOf(i)
      : deep + underIndices.indexOf(i);
    let job: Assignment;
    let end = start;
    if (i < rushCount) {
      job = {
        player: id,
        job: "rush",
        responsibility:
          "Authored pressure lane toward the QB; no contact or protection result simulated.",
      };
      end = { x: 45 + (i % 3) * 5, y: 84 };
    } else if (slot < deep) {
      const split =
        coverage === "Cover 6"
          ? [15, 35, 75]
          : Array.from({ length: deep }, (_, j) => (100 * (j + 0.5)) / deep);
      end = { x: split[slot], y: 12 };
      job = {
        player: id,
        job: coverage === "Quarters match" ? "match" : "zone",
        responsibility:
          coverage === "Cover 1"
            ? "Deep middle help"
            : coverage === "Cover 6"
              ? slot < 2
                ? "Left-side deep quarter"
                : "Right-side deep half"
              : `Deep ${deep === 2 ? "half" : deep === 3 ? "third" : "quarter"} ${slot + 1}`,
      };
      if (coverage === "Quarters match" && eligible.length > 0) {
        const receivers = matchReceivers.length ? matchReceivers : eligible;
        const receiver = receivers[slot % receivers.length];
        const vertical = (receiver.route.at(-1)?.y ?? receiver.start.y) < 40;
        job.receiver = receiver.id;
        job.responsibility = `Demo match rule: carry ${receiver.label} if vertical past the landmark; otherwise retain quarter help. This is one authored match branch, not a universal match system.`;
        if (vertical) end = receiver.route.at(-1) ?? receiver.start;
      }
    } else if (coverage === "Cover 0" || coverage === "Cover 1") {
      const receiver = manAssignments.get(i);
      if (receiver) {
        end = receiver.route.at(-1) ?? receiver.start;
        job = {
          player: id,
          job: "man",
          receiver: receiver.id,
          responsibility: `Man responsibility on ${receiver.label}; leverage and exchanges are coaching-system dependent.`,
        };
      } else {
        end = { x: 50, y: 58 };
        job = {
          player: id,
          job: "spy",
          responsibility: "Low-hole/QB observer, not an extra deep zone.",
        };
      }
    } else {
      const count = 11 - rushCount - deep;
      end = { x: (100 * (slot - deep + 0.5)) / Math.max(1, count), y: 43 };
      job = {
        player: id,
        job: "zone",
        responsibility: `Underneath window ${slot - deep + 1}; run/pass conflict is illustrated, not a run-fit prescription.`,
      };
    }
    assignments.push(job);
    return {
      id,
      label: names[i],
      role,
      start,
      route: [{ x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 }, end],
    };
  });
  return {
    personnel,
    front,
    coverage,
    shell,
    rush: rushCount,
    players,
    assignments,
  };
}
export const flagLooks = {
  flag5: [
    {
      name: "One rush / three underneath / one deep",
      rush: 1,
      middle: 3,
      deep: 1,
    },
    { name: "Two rush / one middle / two deep", rush: 2, middle: 1, deep: 2 },
  ],
  flag7: [
    {
      name: "Two rush / three underneath / two deep",
      rush: 2,
      middle: 3,
      deep: 2,
    },
  ],
  flag8: [
    {
      name: "Three rush / two middle / three deep",
      rush: 3,
      middle: 2,
      deep: 3,
    },
  ],
} as const;
export function buildFlag(play: Play, example: number, rules: Rules) {
  if (play.format === "tackle" || !validRules(rules, play.format))
    throw Error("Select valid rules for this flag format.");
  const look = flagLooks[play.format][example] ?? flagLooks[play.format][0];
  const assignments: Assignment[] = [];
  const players = Array.from(
    { length: rosterSize(play.format) },
    (_, i): Player => {
      const rushing = i < look.rush;
      const deep = i >= look.rush + look.middle;
      const slot = rushing
        ? i
        : deep
          ? i - look.rush - look.middle
          : i - look.rush;
      const count = rushing ? look.rush : deep ? look.deep : look.middle;
      const x = (100 * (slot + 0.5)) / count;
      assignments.push({
        player: `D${i + 1}`,
        job: rushing ? "rush" : "zone",
        responsibility: rushing
          ? `Rush from at least ${rules.rushYards} yards after ${rules.rushDelay}s delay in the configured example.`
          : deep
            ? "Deep zone example"
            : "Underneath/middle zone example",
      });
      return {
        id: `D${i + 1}`,
        label: rushing
          ? `Rush${slot + 1}`
          : deep
            ? `Deep${slot + 1}`
            : `U${slot + 1}`,
        role: rushing ? "rusher" : "DB",
        delay: rushing ? rules.rushDelay : 0,
        start: { x, y: rushing ? 70 - 2 * rules.rushYards : deep ? 20 : 48 },
        route: [
          rushing ? { x: 50, y: 83 } : deep ? { x, y: 12 } : { x, y: 40 },
        ],
      };
    },
  );
  return { players, assignments, look };
}
export function boxCount(players: Player[]) {
  return players.filter(
    (p) =>
      p.start.x >= 30 && p.start.x <= 70 && p.start.y >= 42 && p.start.y <= 70,
  ).length;
}
export function techniqueAt(x: number, play: Play = formation("tackle")) {
  const center = play.players.find((p) => p.role === "C")?.start.x ?? 50;
  const side = x < center ? -1 : 1;
  const line = play.players
    .filter((p) => p.role === "OL" && (p.start.x - center) * side > 0)
    .sort(
      (a, b) => Math.abs(a.start.x - center) - Math.abs(b.start.x - center),
    );
  const guard = line[0]?.start.x ?? center + side * 6;
  const tackle = line[1]?.start.x ?? center + side * 12;
  const te = play.players.find(
    (p) =>
      p.role === "TE" &&
      Math.abs(p.start.y - 70) < 0.5 &&
      (p.start.x - center) * side > 0,
  );
  const landmarks: [number, string][] = [
    [center, "0"],
    [center + side * 3, "1"],
    [guard - side * 2, "2i"],
    [guard, "2"],
    [guard + side * 2, "3"],
    [tackle - side * 2, "4i"],
    [tackle, "4"],
    [tackle + side * 3, "5"],
  ];
  if (te) landmarks.push([te.start.x, "6"], [te.start.x + side * 3, "9"]);
  const distance = Math.min(...landmarks.map(([at]) => Math.abs(x - at)));
  if (distance > 1) return "Wide / displaced alignment · review";
  return (
    landmarks
      .filter(([at]) => Math.abs(x - at) === distance)
      .map(([, label]) => label)
      .join("/") + (distance > 0 ? " · review" : "")
  );
}

export const sharedFormation = formation;

/** Man assignments follow the authored receiver, while zone assignments retain landmarks. */
export function defenderPosition(
  player: Player,
  time: number,
  assignments: Assignment[],
  offense: Player[],
) {
  const job = assignments.find((a) => a.player === player.id);
  const target = offense.find((p) => p.id === job?.receiver);
  if (
    target &&
    (job?.job === "man" ||
      (job?.job === "match" && position(target, time).y < 40))
  ) {
    const at = position(target, time);
    const blend = Math.min(1, Math.max(0, time / 1.5));
    return {
      x: player.start.x + (at.x - player.start.x) * blend,
      y: player.start.y + (at.y - 3 - player.start.y) * blend,
    };
  }
  return position(player, time);
}
export function recognitionMove(
  qb: { x: number; y: number },
  dx: number,
  dy: number,
  rules: Rules | null,
) {
  return {
    x: Math.max(30, Math.min(70, qb.x + dx)),
    y: Math.max(rules?.qbRun ? 55 : 74, Math.min(94, qb.y + dy)),
  };
}

/** Surface descriptions can be equivalent; do not mark an alias as a wrong read. */
export function frontMatches(observed: string, called: Front) {
  return (
    observed === called ||
    (["Odd", "Three-man surface"].includes(observed) &&
      ["Odd", "Three-man surface"].includes(called)) ||
    (["Even", "Four-man surface"].includes(observed) &&
      ["Even", "Four-man surface"].includes(called))
  );
}
