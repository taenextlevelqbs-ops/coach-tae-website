/** Engine coordinates are yards: offense advances toward increasing y. No league is inferred from roster size. */
export const gameFormats = [
  "tackle11",
  "passing7",
  "flag5",
  "flag7",
  "flag8",
] as const;
export type GameFormat = (typeof gameFormats)[number];
export type Rules = {
  format: GameFormat;
  name: string;
  provenance: "instructional" | "custom";
  acknowledged: boolean;
  offense: number;
  defense: number;
  eligibleLimit: number;
  width: number;
  length: number;
  los: number;
  passClock: number | null;
  rushers: number;
  rushDistance: number;
  rushDelay: number;
  qbRun: boolean;
  blocking: boolean;
  contact: boolean;
  handoff: boolean;
  lateral: boolean;
  noRunZone: number;
  downs: number;
  touchdown: number;
  deadOnCatch: boolean;
};
export function rulesFor(format: GameFormat): Rules {
  const tackle = format === "tackle11";
  const passing = format === "passing7";
  const count = tackle ? 11 : passing ? 7 : Number(format.slice(4));
  return {
    format,
    name: tackle
      ? "11v11 instructional pocket"
      : passing
        ? "Custom passing 7v7 event"
        : `Custom ${count}v${count} flag direct-pass exercise`,
    provenance: tackle ? "instructional" : "custom",
    acknowledged: tackle,
    offense: count,
    defense: count,
    eligibleLimit: tackle ? 5 : passing ? 5 : count - 1,
    width: tackle ? 53.33 : 40,
    length: tackle ? 100 : 60,
    los: tackle ? 30 : 15,
    passClock: tackle ? null : passing ? 5 : 7,
    rushers: tackle ? 4 : passing ? 0 : count === 8 ? 3 : count === 7 ? 2 : 1,
    rushDistance: tackle || passing ? 0 : 7,
    rushDelay: 0,
    qbRun: tackle,
    blocking: tackle,
    contact: tackle,
    handoff: false,
    lateral: false,
    noRunZone: 0,
    downs: 4,
    touchdown: 6,
    deadOnCatch: true,
  };
}
export function validateRules(r: Rules): string[] {
  const errors: string[] = [];
  const range = (n: number, min: number, max: number) =>
    Number.isFinite(n) && n >= min && n <= max;
  if (!gameFormats.includes(r.format)) errors.push("Unknown game format.");
  if (typeof r.name !== "string" || !r.name.trim() || r.name.length > 100)
    errors.push("Name the instructional configuration.");
  if (!r.acknowledged)
    errors.push(
      "Confirm the rules against the selected teaching exercise/event before snapping.",
    );
  if (!["custom", "instructional"].includes(r.provenance))
    errors.push("Rules provenance is required.");
  if (
    [
      r.offense,
      r.defense,
      r.eligibleLimit,
      r.rushers,
      r.downs,
      r.touchdown,
    ].some((n) => !Number.isInteger(n))
  )
    errors.push("Counts and scoring must be whole numbers.");
  if (
    !range(r.width, 25, 60) ||
    !range(r.length, 40, 120) ||
    !range(r.los, 10, r.length - 5)
  )
    errors.push("Field dimensions or line of scrimmage are out of range.");
  if (r.passClock !== null && !range(r.passClock, 2, 15))
    errors.push("Passing clock must be 2–15 seconds or explicitly absent.");
  if (
    !range(r.rushers, 0, r.defense) ||
    !range(r.rushDistance, 0, 15) ||
    !range(r.rushDelay, 0, 8)
  )
    errors.push("Invalid rush count, distance or delay.");
  if (
    !range(r.eligibleLimit, 1, r.offense - 1) ||
    !range(r.noRunZone, 0, 10) ||
    !range(r.downs, 1, 8) ||
    !range(r.touchdown, 1, 12)
  )
    errors.push(
      "Invalid eligibility, no-run zone, downs or scoring configuration.",
    );
  if (
    [
      r.qbRun,
      r.blocking,
      r.contact,
      r.handoff,
      r.lateral,
      r.deadOnCatch,
      r.acknowledged,
    ].some((v) => typeof v !== "boolean")
  )
    errors.push("Rule switches must be explicit booleans.");
  if (r.format === "tackle11") {
    if (
      r.offense !== 11 ||
      r.defense !== 11 ||
      r.eligibleLimit !== 5 ||
      !r.blocking ||
      !r.contact ||
      r.rushers < 2 ||
      r.rushers > 6
    )
      errors.push(
        "This tackle fixture requires 11 per side, five eligible receivers, contact protection and 2–6 rushers.",
      );
  } else if (r.format === "passing7") {
    if (r.defense !== 7 || ![6, 7].includes(r.offense) || r.eligibleLimit > 6)
      errors.push(
        "Passing 7v7 requires seven defenders and six or seven offensive participants with a bounded eligible limit.",
      );
    if (r.rushers !== 0 || r.blocking || r.contact || r.qbRun)
      errors.push(
        "This passing-event implementation has no line, rush, blitz, blocking, contact or QB runs. Events permitting these need another reviewed configuration.",
      );
    if (r.passClock === null)
      errors.push(
        "Select this event's passing clock; no universal four-second rule is assumed.",
      );
  } else {
    const n = Number(r.format.slice(4));
    if (r.offense !== n || r.defense !== n)
      errors.push("Flag roster counts must match the selected format.");
    if (r.blocking || r.contact)
      errors.push(
        "Contact/blocking flag formats are not implemented in this milestone.",
      );
  }
  if (r.handoff || r.lateral || !r.deadOnCatch)
    errors.push(
      "Handoff, lateral and live catch continuation rules require a later engine stage; this milestone ends at the catch.",
    );
  return errors;
}
