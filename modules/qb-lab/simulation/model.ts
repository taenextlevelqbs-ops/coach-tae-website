import type { Tactics } from "../football/geometry";
export type Format = "tackle" | "flag5" | "flag7" | "flag8";
export type Point = { x: number; y: number };
export type Player = {
  id: string;
  label: string;
  start: Point;
  route: Point[];
  role?: "QB" | "C" | "OL" | "RB" | "WR" | "TE" | "DL" | "LB" | "DB" | "rusher";
  eligible?: boolean;
  delay?: number;
};
export type Play = {
  id: string;
  name: string;
  format: Format;
  players: Player[];
  personnel?: "10" | "11" | "12";
  tactics?: Tactics;
};
export type Scenario = {
  id: string;
  title: string;
  format: Format;
  play: Play;
  defenders: Player[];
  focus: string;
  context: string;
};
export type Decision = {
  points: number;
  max: 2;
  feedback: string;
  separation: number;
  target: string;
  time: number;
};
export const duration = 6;
export const rosterSize = (format: Format) =>
  format === "tackle" ? 11 : Number(format.slice(4));
export function formation(
  format: Format,
  spread = true,
  personnel: "10" | "11" | "12" = "11",
): Play {
  const count = rosterSize(format);
  const players: Player[] = [
    {
      id: "QB",
      label: "QB",
      role: "QB",
      eligible: false,
      start: { x: 50, y: 85 },
      route: [],
    },
    {
      id: "C",
      label: format === "flag5" ? "Y" : "C",
      role: "C",
      eligible: format !== "tackle",
      start: { x: 50, y: 70 },
      route: format === "tackle" ? [] : [{ x: 50, y: 48 }],
    },
    ...Array.from({ length: count - 2 }, (_, i): Player => {
      const line = format === "tackle" && i < 4;
      const skill =
        format === "tackle"
          ? [10, 25, 75, 90, 60]
          : format === "flag5"
            ? [10, 65, 90]
            : [8, 27, 64, 80, 94, 40];
      const slot = i - (format === "tackle" ? 4 : 0);
      const baseX = line ? [38, 44, 56, 62][i] : skill[slot];
      const x = spread || line ? baseX : 50 + (baseX - 50) * 0.7;
      const back = format === "tackle" && slot === 4;
      const label = line
        ? ["LT", "LG", "RG", "RT"][i]
        : format === "flag5"
          ? ["X", "H", "Z"][slot]
          : ["X", "H", "Y", "Z", "RB", "E"][slot];
      const role: Player["role"] = line
        ? "OL"
        : back || label === "RB"
          ? "RB"
          : format === "tackle" &&
              ((slot === 2 && personnel !== "10") ||
                (slot === 1 && personnel === "12"))
            ? "TE"
            : "WR";
      return {
        id: `R${i + 1}`,
        label,
        role,
        eligible: !line,
        start: {
          x,
          y:
            line || (format === "tackle" && (slot === 0 || slot === 2))
              ? 70
              : back
                ? 94
                : 74,
        },
        route: line
          ? []
          : [
              { x: Math.min(90, x), y: 40 },
              { x: Math.min(94, x + 12), y: 24 },
            ],
      };
    }),
  ];
  return {
    id: `play-${format}`,
    name: spread ? "Spread study" : "Compact study",
    format,
    players,
    ...(format === "tackle" ? { personnel } : {}),
  };
}
