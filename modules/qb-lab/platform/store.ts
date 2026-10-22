"use client";
import { useSyncExternalStore } from "react";
import { drills, goals } from "./catalog";
import { rosterSize, type Play } from "../simulation/model";
export type Activity = {
  id: string;
  kind: "workout" | "simulation" | "lesson" | "mechanics";
  reference: string;
  at: string;
  points?: number;
  profile?: "A" | "B";
};
export type Assignment = {
  id: string;
  drill: string;
  profile: "A" | "B";
  status: "assigned" | "complete";
};
export type LocalState = {
  version: 1;
  plays: Play[];
  activities: Activity[];
  assignments: Assignment[];
  goals: string[];
};
export const empty: LocalState = {
  version: 1,
  plays: [],
  activities: [],
  assignments: [],
  goals: [],
};
const key = "coach-tae-qblab-local-v1";
let state: LocalState = empty;
let initialized = false;
let storageMessage = "";
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((f) => f());
const text = (v: unknown, max = 80): v is string =>
  typeof v === "string" &&
  v.length > 0 &&
  v.length <= max &&
  !/[<>\u0000-\u001f]/.test(v);
const point = (v: unknown) =>
  !!v &&
  typeof v === "object" &&
  ["x", "y"].every(
    (k) =>
      Number.isFinite((v as Record<string, number>)[k]) &&
      (v as Record<string, number>)[k] >= 0 &&
      (v as Record<string, number>)[k] <= 100,
  );
export function validPlay(value: unknown): value is Play {
  if (!value || typeof value !== "object") return false;
  const p = value as Play;
  return (
    text(p.id) &&
    text(p.name, 50) &&
    ["tackle", "flag5", "flag7"].includes(p.format) &&
    Array.isArray(p.players) &&
    p.players.length === rosterSize(p.format) &&
    new Set(p.players.map((a) => a?.id)).size === p.players.length &&
    p.players.filter((a) => a.id === "QB").length === 1 &&
    p.players.every(
      (a) =>
        /^(QB|C|R[1-9])$/.test(a.id) &&
        text(a.id, 12) &&
        text(a.label, 12) &&
        point(a.start) &&
        Array.isArray(a.route) &&
        (a.id !== "QB" || a.route.length === 0) &&
        a.route.length <= 8 &&
        a.route.every(point),
    )
  );
}
export function parseState(raw: string): LocalState {
  if (raw.length > 250000)
    throw new Error("File exceeds the 250 KB demo limit.");
  const input = JSON.parse(raw) as LocalState;
  if (
    !input ||
    input.version !== 1 ||
    !Array.isArray(input.plays) ||
    input.plays.length > 20 ||
    !input.plays.every(validPlay) ||
    new Set(input.plays.map((p) => p.id)).size !== input.plays.length
  )
    throw new Error("Invalid playbook format or roster.");
  if (
    !Array.isArray(input.activities) ||
    input.activities.length > 200 ||
    new Set(input.activities.map((a) => a?.id)).size !==
      input.activities.length ||
    !input.activities.every(
      (a) =>
        text(a.id) &&
        ["workout", "simulation", "lesson", "mechanics"].includes(a.kind) &&
        (a.profile === undefined || a.profile === "A" || a.profile === "B") &&
        text(a.reference) &&
        text(a.at) &&
        !Number.isNaN(Date.parse(a.at)) &&
        (a.points === undefined || [0, 1, 2].includes(a.points)),
    )
  )
    throw new Error("Invalid activity history.");
  if (
    !Array.isArray(input.assignments) ||
    input.assignments.length > 40 ||
    new Set(input.assignments.map((a) => a?.id)).size !==
      input.assignments.length ||
    !input.assignments.every(
      (a) =>
        text(a.id) &&
        drills.some((d) => d.id === a.drill) &&
        ["A", "B"].includes(a.profile) &&
        ["assigned", "complete"].includes(a.status),
    )
  )
    throw new Error("Invalid synthetic assignments.");
  if (
    !Array.isArray(input.goals) ||
    !input.goals.every((g) => goals.some((allowed) => allowed === g)) ||
    input.goals.length > 3
  )
    throw new Error("Invalid goals.");
  // Reconstruct only the allowed fields. Imported JSON cannot smuggle additional records into storage/export.
  return {
    version: 1,
    plays: input.plays.map((p) => ({
      id: p.id,
      name: p.name,
      format: p.format,
      players: p.players.map((a) => ({
        id: a.id,
        label: a.label,
        start: { x: a.start.x, y: a.start.y },
        route: a.route.map((r) => ({ x: r.x, y: r.y })),
      })),
    })),
    activities: input.activities.map((a) => ({
      id: a.id,
      kind: a.kind,
      profile: a.profile ?? "A",
      reference: a.reference,
      at: a.at,
      ...(a.points !== undefined ? { points: a.points } : {}),
    })),
    assignments: input.assignments.map((a) => ({
      id: a.id,
      drill: a.drill,
      profile: a.profile,
      status: a.status,
    })),
    goals: [...new Set(input.goals)],
  };
}
function initialize() {
  if (initialized) return;
  initialized = true;
  try {
    const raw = localStorage.getItem(key);
    if (raw) state = parseState(raw);
  } catch {
    storageMessage =
      "Saved demo data could not be loaded. Use Progress Center to reset or restore a valid export.";
  }
}
function subscribe(listener: () => void) {
  initialize();
  listeners.add(listener);
  listener();
  return () => {
    listeners.delete(listener);
  };
}
export function useLocalLab() {
  const snapshot = useSyncExternalStore(
    subscribe,
    () => state,
    () => empty,
  );
  return { state: snapshot, message: storageMessage };
}
export function updateLab(change: (previous: LocalState) => LocalState) {
  initialize();
  const next = parseState(JSON.stringify(change(state)));
  try {
    localStorage.setItem(key, JSON.stringify(next));
    state = next;
    storageMessage = "Saved to this browser only.";
  } catch {
    state = next;
    storageMessage =
      "Browser storage is unavailable or full. Changes are in memory only; export before leaving.";
  }
  emit();
  return storageMessage === "Saved to this browser only.";
}
export function recordActivity(
  kind: Activity["kind"],
  reference: string,
  points?: number,
  profile: "A" | "B" = "A",
) {
  updateLab((s) => ({
    ...s,
    activities: [
      ...s.activities,
      {
        id: crypto.randomUUID(),
        kind,
        profile,
        reference,
        at: new Date().toISOString(),
        ...(points !== undefined ? { points } : {}),
      },
    ].slice(-200),
    assignments: s.assignments.map((a) =>
      kind === "workout" && a.profile === profile && a.drill === reference
        ? { ...a, status: "complete" as const }
        : a,
    ),
  }));
}
export function resetLab() {
  state = empty;
  try {
    localStorage.removeItem(key);
    storageMessage = "Local prototype data cleared.";
  } catch {
    storageMessage =
      "In-memory data cleared. Browser storage access is blocked.";
  }
  emit();
}
export function downloadLab() {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(state, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "qb-lab-local-prototype.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
/** Cloud adapter must be implemented with authenticated ownership checks; local data is never an authority. */
export interface PlayRepository {
  load(): Promise<Play[]>;
  save(play: Play): Promise<void>;
}
export const localPlayRepository: PlayRepository = {
  async load() {
    initialize();
    return state.plays;
  },
  async save(play) {
    if (!validPlay(play)) throw new Error("Invalid play");
    initialize();
    if (state.plays.length >= 20 && !state.plays.some((p) => p.id === play.id))
      throw new Error(
        "Twenty-play limit reached. Export or delete a saved play first.",
      );
    const persisted = updateLab((s) => ({
      ...s,
      plays: [...s.plays.filter((p) => p.id !== play.id), play].slice(-20),
    }));
    if (!persisted) throw new Error("Browser storage unavailable");
  },
};
