import { rulesFor, type GameFormat } from "./formats";
import type { EngineConfig } from "./types";
export function defaultConfig(format: GameFormat = "tackle11"): EngineConfig {
  return {
    rules: rulesFor(format),
    seed: 42,
    personnel: "4-3",
    front: "Even",
    coverage: format === "flag8" ? "Cover 3" : "Cover 2",
    shell: 2,
    protection: "man",
    help: "none",
    rushMove: "bull",
    mode: "learn",
  };
}
