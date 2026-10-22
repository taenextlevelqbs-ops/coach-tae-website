import { buildDefense } from "../football/content";
import { formation, rosterSize, type Format, type Scenario } from "./model";
function study(format: Format, rotation: boolean): Scenario {
  const play = formation(format);
  return {
    id: `${format}-${rotation ? "rotation" : "spacing"}`,
    title: rotation ? "Reassess the rotation" : "Find the changing space",
    format,
    play,
    focus: rotation
      ? "Observe the depth change, then reassess the drawn routes."
      : "Compare route spacing as the illustration develops.",
    context:
      format === "tackle"
        ? "Tackle personnel illustration. Blocking, pressure and receiver eligibility are not simulated."
        : "Flag-specific roster. No league pass clock, rush distance, quarterback-run permission or eligibility rule is assumed. Girls and boys can use the same flag study; the ruleset must be selected by league, not gender.",
    defenders:
      format === "tackle"
        ? buildDefense(
            play,
            "4-3",
            rotation ? "Odd" : "Even",
            rotation ? "Cover 3" : "Cover 2",
            2,
            4,
          ).players
        : Array.from(
            {
              length: rosterSize(format),
            },
            (_, i) => ({
              id: `D${i + 1}`,
              label: `D${i + 1}`,
              start: {
                x: i < 2 ? (i === 0 ? 30 : 70) : 12 + (i % 5) * 19,
                y: i < 2 ? 20 : 45 + (i > 6 ? 12 : 0),
              },
              route: [
                {
                  x:
                    rotation && i === 0
                      ? 50
                      : i < 2
                        ? i === 0
                          ? 30
                          : 70
                        : 12 + (i % 5) * 19,
                  y:
                    rotation && i === 1
                      ? 54
                      : i < 2
                        ? 18
                        : 40 + (i > 6 ? 12 : 0),
                },
              ],
            }),
          ),
  };
}
export const scenarios: Scenario[] = (
  ["tackle", "flag5", "flag7", "flag8"] as const
).flatMap((f) => [study(f, false), study(f, true)]);
