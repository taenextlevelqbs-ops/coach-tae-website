export type Format = "tackle" | "flag5" | "flag7";
export type Point = { x: number; y: number };
export type Player = {
  id: string;
  label: string;
  start: Point;
  route: Point[];
};
export type Play = {
  id: string;
  name: string;
  format: Format;
  players: Player[];
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
  format === "tackle" ? 11 : format === "flag7" ? 7 : 5;
export function formation(format: Format, spread = true): Play {
  const count = rosterSize(format);
  const players: Player[] = [
    { id: "QB", label: "QB", start: { x: 50, y: 85 }, route: [] },
    {
      id: "C",
      label: "C",
      start: { x: 50, y: 70 },
      route: format === "tackle" ? [] : [{ x: 50, y: 48 }],
    },
    ...Array.from({ length: count - 2 }, (_, i) => {
      const line = format === "tackle" && i < 4;
      const skill =
        format === "tackle"
          ? [10, 25, 75, 90, 60]
          : format === "flag7"
            ? [8, 27, 64, 80, 94]
            : [10, 65, 90];
      const baseX = line
        ? [38, 44, 56, 62][i]
        : skill[i - (format === "tackle" ? 4 : 0)];
      const x = spread || line ? baseX : 50 + (baseX - 50) * 0.7;
      const back = format === "tackle" && i === 8;
      return {
        id: `R${i + 1}`,
        label: line ? `L${i + 1}` : `R${i + 1}`,
        start: { x, y: line ? 70 : back ? 94 : spread ? 68 : 76 },
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
  };
}
