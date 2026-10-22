import type { LocalState } from "./store";
import { drills } from "./catalog";
import type { Pathway } from "../demo";
/** Suggestions use recorded interactions, never inferred athlete ability. */
export function nextStep(
  state: LocalState,
  pathway: Pathway,
  profile: "A" | "B" = "A",
) {
  const assigned = state.assignments.find(
    (a) =>
      a.profile === profile &&
      a.status === "assigned" &&
      drills.some(
        (d) =>
          d.id === a.drill && (d.pathway === "both" || d.pathway === pathway),
      ),
  );
  if (assigned)
    return {
      title: drills.find((d) => d.id === assigned.drill)!.title,
      href: `/qb-lab/workouts?activity=${assigned.drill}&profile=${profile}`,
      label: "Your next assignment",
      why: "Assigned in the local coach workspace. Complete the guided steps to update your queue.",
    };
  const activities = state.activities.filter(
    (a) => (a.profile ?? "A") === profile,
  );
  const lesson = [...activities]
    .reverse()
    .find(
      (a) =>
        a.kind === "lesson" && a.reference.startsWith(`observation-${pathway}`),
    );
  if (!lesson)
    return {
      title: "See the field before the snap",
      href: "/qb-lab/iq",
      label: "A good place to start",
      why: "Look at the defenders, notice what changes, and explain what you see.",
    };
  if (
    lesson.reference.endsWith("-revisit") &&
    !activities.some(
      (a) =>
        a.kind === "workout" && a.reference === "observe" && a.at >= lesson.at,
    )
  )
    return {
      title: "Walk the starting picture",
      href: `/qb-lab/workouts?activity=observe&profile=${profile}`,
      label: "Build on your Football IQ study",
      why: "An observation needs another look. Use the guided walkthrough, then try the field study again.",
    };
  if (
    !activities.some(
      (a) =>
        a.kind === "simulation" &&
        a.reference.includes(pathway === "flag" ? "flag" : "tackle"),
    )
  )
    return {
      title: "Put your observation into motion",
      href: "/qb-lab/simulator",
      label: "Your next practice",
      why: "You finished a field study. Now pause a playable scenario and compare the space around the receivers.",
    };
  return {
    title: "Connect the rep to a correction",
    href: "/qb-lab/film",
    label: "Keep developing",
    why: "Review an illustrated moment and choose a related practice. Your own footage stays private and unavailable in this demo.",
  };
}
