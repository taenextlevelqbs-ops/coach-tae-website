/** Fixed, synthetic review vocabulary; no free-form or personal data. */
export type ReviewTag = "Alignment" | "Rotation" | "Question for coach";
export type FilmMoment = { id: number; time: number; tag: ReviewTag };
export const reviewTags: ReviewTag[] = [
  "Alignment",
  "Rotation",
  "Question for coach",
];
export const studyClips = [
  {
    id: "alignment",
    title: "Alignment study",
    start: 0,
    description:
      "Begin at the starting shell. Describe the visible depth before naming a coverage.",
  },
  {
    id: "rotation",
    title: "Rotation study",
    start: 5,
    description:
      "Begin mid-illustration. Follow D1 and D2 as the original picture changes.",
  },
] as const;
export const readSteps = [
  {
    id: "D1",
    label: "Track D1",
    note: "Follow the left deep marker toward the middle. Its movement changes the starting picture; it does not prove a coverage assignment.",
  },
  {
    id: "D2",
    label: "Track D2",
    note: "Follow the right deep marker as it moves shallower. Describe the depth change before inferring a responsibility.",
  },
  {
    id: "routes",
    label: "Inspect space",
    note: "Compare the drawn paths with the defenders. These are illustrative paths, not a prescribed receiver progression or a verified throwing window.",
  },
] as const;
export type ReadFocus = (typeof readSteps)[number]["id"];
