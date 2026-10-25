"use client";
import { useCallback, useSyncExternalStore } from "react";
import type { Pathway } from "./demo";
export const demoProfiles = [
  { id: "B", name: "Jordan", age: 12, pathway: "flag" as const },
  { id: "A", name: "Alex", age: 12, pathway: "tackle" as const },
] as const;
export type DemoProfile = (typeof demoProfiles)[number];
type Selection = { profile: DemoProfile; pathway: Pathway };
const defaults: Record<"A" | "B", Selection> = {
  A: { profile: demoProfiles[1], pathway: "tackle" },
  B: { profile: demoProfiles[0], pathway: "flag" },
};
let selection: Selection | null = null;
const listeners = new Set<() => void>();
const key = "qb-lab-demo-selection-v1";
function save(next: Selection) {
  selection = next;
  try {
    sessionStorage.setItem(
      key,
      JSON.stringify({ profile: next.profile.id, pathway: next.pathway }),
    );
  } catch {
    /* In-memory selection still works when storage is blocked. */
  }
  listeners.forEach((listener) => listener());
}
export function useDemoSelection(initial: "A" | "B") {
  const subscribe = useCallback(
    (listener: () => void) => {
      if (!selection) {
        selection = defaults[initial];
        try {
          const raw = JSON.parse(sessionStorage.getItem(key) ?? "null");
          if (
            raw &&
            (raw.profile === "A" || raw.profile === "B") &&
            (raw.pathway === "flag" || raw.pathway === "tackle")
          )
            selection = {
              profile: defaults[raw.profile as "A" | "B"].profile,
              pathway: raw.pathway,
            };
          sessionStorage.setItem(
            key,
            JSON.stringify({
              profile: selection.profile.id,
              pathway: selection.pathway,
            }),
          );
        } catch {
          /* Malformed data is ignored; only fixed demo identities are supported. */
        }
      }
      listeners.add(listener);
      listener();
      return () => {
        listeners.delete(listener);
      };
    },
    [initial],
  );
  const state = useSyncExternalStore(
    subscribe,
    () => selection ?? defaults[initial],
    () => defaults[initial],
  );
  return {
    ...state,
    selectProfile(id: string) {
      if (id === "A" || id === "B") save(defaults[id]);
    },
    setPathway(pathway: Pathway) {
      save({ ...(selection ?? state), pathway });
    },
  };
}
