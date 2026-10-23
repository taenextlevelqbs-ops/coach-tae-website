import type { Point } from "../simulation/model";
export type HashSpot = "left" | "middle" | "right";
export type Side = "left" | "right";
export type Tactics = {
  hash: HashSpot;
  strongSide: Side;
  boundaryBreakScale: number;
};
export const HS_FIELD_WIDTH = 160 / 3;
export const HS_HASH_INSET = (53 + 4 / 12) / 3;
export const defaultTactics: Tactics = {
  hash: "middle",
  strongSide: "right",
  boundaryBreakScale: 1,
};
export function validTactics(value: unknown): value is Tactics {
  if (!value || typeof value !== "object") return false;
  const t = value as Tactics;
  return (
    ["left", "middle", "right"].includes(t.hash) &&
    ["left", "right"].includes(t.strongSide) &&
    Number.isFinite(t.boundaryBreakScale) &&
    t.boundaryBreakScale >= 0.75 &&
    t.boundaryBreakScale <= 1
  );
}
export function ballX(hash: HashSpot, width = HS_FIELD_WIDTH) {
  return hash === "middle"
    ? width / 2
    : hash === "left"
      ? HS_HASH_INSET
      : width - HS_HASH_INSET;
}
export function boundarySide(hash: HashSpot): Side | null {
  return hash === "middle" ? null : hash;
}
/** Editor percentages -> yards. Increasing world y is downfield; editor y=70 is LOS. Scale each side about the ball to retain legal sideline bounds. */
export function toField(
  point: Point,
  width: number,
  los: number,
  tactics?: Tactics,
  routeStart?: Point,
  rigid = false,
): Point {
  const spot = tactics ? ballX(tactics.hash, width) : width / 2;
  const x = rigid
    ? spot + ((point.x - 50) * width) / 100
    : point.x <= 50
      ? (spot * point.x) / 50
      : spot + ((width - spot) * (point.x - 50)) / 50;
  const boundary =
    tactics &&
    routeStart &&
    boundarySide(tactics.hash) === (routeStart.x < 50 ? "left" : "right");
  const depth = (70 - point.y) * 0.5;
  return {
    x,
    y: los + depth * (boundary && depth > 0 ? tactics.boundaryBreakScale : 1),
  };
}
export type SpatialZone = {
  minX: number;
  maxX: number;
  minDepth: number;
  maxDepth: number;
  match: boolean;
  name: string;
};
export function deepZones(
  coverage: string,
  width: number,
  halfSide: Side,
): SpatialZone[] {
  const quarter = (i: number): SpatialZone => ({
    minX: (width * i) / 4,
    maxX: (width * (i + 1)) / 4,
    minDepth: 11,
    maxDepth: 100,
    match: true,
    name: `Deep quarter ${i + 1} · authored vertical-match rule`,
  });
  const half = (side: Side): SpatialZone => ({
    minX: side === "left" ? 0 : width / 2,
    maxX: side === "left" ? width / 2 : width,
    minDepth: 15,
    maxDepth: 100,
    match: false,
    name: `Deep ${side} half`,
  });
  if (coverage === "Cover 4" || coverage === "Quarters match")
    return [0, 1, 2, 3].map(quarter);
  if (coverage === "Cover 6" || coverage === "Cover 8")
    return halfSide === "left"
      ? [half("left"), quarter(2), quarter(3)]
      : [quarter(0), quarter(1), half("right")];
  if (coverage === "Cover 2") return [half("left"), half("right")];
  if (coverage === "Cover 3")
    return [0, 1, 2].map((i) => ({
      minX: (width * i) / 3,
      maxX: (width * (i + 1)) / 3,
      minDepth: 12,
      maxDepth: 100,
      match: false,
      name: `Deep third ${i + 1}`,
    }));
  return [];
}
export function zoneContains(
  zone: SpatialZone,
  point: Point,
  los: number,
  width: number,
) {
  return (
    point.x >= zone.minX &&
    (point.x < zone.maxX || (zone.maxX === width && point.x === width)) &&
    point.y - los >= zone.minDepth &&
    point.y - los <= zone.maxDepth
  );
}
export function fromField(
  point: Point,
  width: number,
  los: number,
  tactics?: Tactics,
  routeStart?: Point,
  rigid = false,
): Point {
  const spot = tactics ? ballX(tactics.hash, width) : width / 2;
  const x = rigid
    ? 50 + ((point.x - spot) * 100) / width
    : point.x <= spot
      ? (point.x * 50) / spot
      : 50 + ((point.x - spot) * 50) / (width - spot);
  const boundary =
    tactics &&
    routeStart &&
    boundarySide(tactics.hash) === (routeStart.x < 50 ? "left" : "right");
  const depth = point.y - los;
  return {
    x,
    y:
      70 -
      (2 * depth) / (boundary && depth > 0 ? tactics.boundaryBreakScale : 1),
  };
}
