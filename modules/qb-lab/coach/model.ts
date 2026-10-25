import type { Format } from "../simulation/model";
export const demoRoster = [
  { id: "A", name: "Alex", pathway: "tackle", initials: "AX", age: 12 },
  { id: "B", name: "Jordan", pathway: "flag", initials: "JD", age: 12 },
] as const;
export type AthleteId = "A" | "B";
export type TeamFormat = Format | "passing7";
export const positions: Record<TeamFormat, string[]> = {
  tackle: ["QB", "RB", "X", "H", "Y", "Z", "LT", "LG", "C", "RG", "RT"],
  passing7: ["QB", "C", "X", "H", "Y", "Z", "RB"],
  flag5: ["QB", "Y / center", "X", "H", "Z"],
  flag7: ["QB", "C", "X", "H", "Y", "Z", "RB"],
  flag8: ["QB", "C", "X", "H", "Y", "Z", "RB", "E"],
};
export const formatNames: Record<TeamFormat, string> = {
  tackle: "11v11 tackle",
  passing7: "Passing 7v7 · non-contact",
  flag5: "5v5 flag",
  flag7: "7v7 flag",
  flag8: "8v8 flag",
};
export type DepthChart = Record<string, AthleteId>;
export function placePlayer(
  chart: DepthChart,
  format: TeamFormat,
  slot: string,
  athlete: AthleteId | "",
): DepthChart {
  if (!positions[format].some((p) => slot === `${p}:1` || slot === `${p}:2`))
    throw new Error("Unknown position.");
  if (
    athlete &&
    !demoRoster.some(
      (a) =>
        a.id === athlete &&
        (format === "passing7" ||
          (format === "tackle"
            ? a.pathway === "tackle"
            : a.pathway === "flag")),
    )
  )
    throw new Error("Choose a pathway-compatible demo athlete.");
  const next = { ...chart };
  if (athlete)
    for (const key of Object.keys(next))
      if (next[key] === athlete) delete next[key];
  if (athlete) next[slot] = athlete;
  else delete next[slot];
  return next;
}
export const situations = [
  "Open field",
  "Red zone",
  "Third down",
  "Two minute",
] as const;
export const distances = ["Short", "Medium", "Long"] as const;
export const concepts = [
  "Custom",
  "Stick",
  "Smash",
  "Mesh",
  "Flood",
  "Four verticals",
  "Spacing",
] as const;
export type ScriptTag = {
  id: string;
  name: string;
  format: Format;
  down: 1 | 2 | 3 | 4;
  distance: (typeof distances)[number];
  concept: (typeof concepts)[number];
  situation: (typeof situations)[number];
  playId?: string;
};
/** Bounded tactical grammar. Parsing is atomic; tags never manufacture routes or a coaching answer key. */
export function parseScript(source: string): ScriptTag[] {
  if (source.length > 16000) throw new Error("Script limit: 16 KB.");
  const lines = source.split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length || lines.length > 24)
    throw new Error("Provide 1–24 play lines.");
  return lines.map((line, i) => {
    const parts = line.split("|").map((s) => s.trim());
    const [name, format, down, distance, concept, situation] = parts;
    if (
      parts.length !== 6 ||
      !name ||
      name.length > 50 ||
      /[<>\u0000-\u001f]/.test(name) ||
      !["tackle", "flag5", "flag7", "flag8"].includes(format) ||
      !["1", "2", "3", "4"].includes(down) ||
      !distances.includes(distance as ScriptTag["distance"]) ||
      !concepts.includes(concept as ScriptTag["concept"]) ||
      !situations.includes(situation as ScriptTag["situation"])
    )
      throw new Error(
        `Line ${i + 1}: use Name | tackle/flag5/flag7/flag8 | 1–4 | Short/Medium/Long | supported concept | supported situation.`,
      );
    return {
      id: `script-${i}`,
      name,
      format: format as Format,
      down: Number(down) as ScriptTag["down"],
      distance: distance as ScriptTag["distance"],
      concept: concept as ScriptTag["concept"],
      situation: situation as ScriptTag["situation"],
    };
  });
}
export type DemoSubmission = {
  id: string;
  player: AthleteId;
  coach: "coach-demo";
  visibility: "Private";
  status: "Awaiting review" | "Reviewed";
  feedback: { time: number; tag: string }[];
  marks: { x: number; y: number; time: number }[];
};
export type ScheduleItem = {
  id: string;
  date: string;
  athlete: AthleteId;
  session: "Footwork" | "Football IQ";
  time: string;
};

export type FocusWeights = {
  footwork: number;
  recognition: number;
  mechanics: number;
};
