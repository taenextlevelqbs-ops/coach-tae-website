import type { SpatialZone, Side } from "../football/geometry";
import type { Point, Play } from "../simulation/model";
import type { Personnel, Front, Coverage } from "../football/content";
import type { Rules } from "./formats";
export type Protection =
  | "man"
  | "half-slide-left"
  | "half-slide-right"
  | "full-slide-left"
  | "full-slide-right";
export const rushMoves = [
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
] as const;
export type RushMove = (typeof rushMoves)[number];
export type Ratings = {
  speed: number;
  acceleration: number;
  strength: number;
  power: number;
  finesse: number;
  shedding: number;
  pursuit: number;
  awareness: number;
  contain: number;
  stamina: number;
  passBlock: number;
  runBlock: number;
  footwork: number;
  agility: number;
  recovery: number;
  anchor: number;
};
export type Actor = {
  id: string;
  label: string;
  team: "offense" | "defense";
  role: string;
  eligible: boolean;
  pos: Point;
  start: Point;
  velocity: Point;
  route: Point[];
  ratings: Ratings;
  job:
    | "qb"
    | "block"
    | "route"
    | "inactive"
    | "rush"
    | "man"
    | "zone"
    | "match"
    | "spy";
  landmark: Point;
  receiver?: string;
  responsibility: string;
  move: RushMove;
  delay: number;
  recoveryUntil: number;
  fatigue: number;
  zone?: SpatialZone;
  matched?: boolean;
};
export type EngineConfig = {
  rules: Rules;
  seed: number;
  matchup?: "balanced" | "offense-edge" | "defense-edge";
  blitzTempo?: number;
  halfSide?: Side;
  matchDepth?: number;
  pocketPreset?: boolean;
  personnel: Personnel;
  front: Front;
  coverage: Coverage;
  shell: 0 | 1 | 2;
  protection: Protection;
  help: "none" | "RB" | "TE" | "RB+TE";
  rushMove: RushMove;
  play?: Play;
  mode: "learn" | "practice" | "challenge";
};
export type Engagement = {
  blocker: string;
  rusher: string;
  control: number;
  since: number;
};
export type Event = {
  tick: number;
  kind: string;
  text: string;
  actors?: string[];
};
export type Outcome =
  | "sack"
  | "flag-pull"
  | "tackle"
  | "clock"
  | "incomplete"
  | "deflection"
  | "interception"
  | "completion"
  | "touchdown"
  | "out-of-bounds"
  | "throw-away"
  | "practice-ended";
export type Ball = {
  origin: Point;
  pos: Point;
  aim: Point;
  height: number;
  elapsed: number;
  flight: number;
  apex: number;
  target: string;
  released: number;
};
export type EngineState = {
  config: EngineConfig;
  tick: number;
  phase: "ready" | "live" | "flight" | "done";
  players: Actor[];
  plan: Record<string, string>;
  engagements: Engagement[];
  events: Event[];
  outcome?: Outcome;
  ball?: Ball;
  pressure: number;
  peakPressure: number;
  throwTime?: number;
  qbState:
    | "stance"
    | "drop"
    | "hitch"
    | "reset"
    | "escape"
    | "release"
    | "follow-through";
  endedAt?: number;
  pocket?: {
    deadline: number;
  };
};
export type Input = {
  move?: Point;
  throwTo?: string;
  placement?: Point;
  throwAway?: boolean;
};
