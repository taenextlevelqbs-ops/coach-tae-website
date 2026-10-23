export type Pathway = "tackle" | "flag";
export const ageGroups = [
  "8–10",
  "11–13",
  "14–15",
  "16–18",
  "College",
] as const;
export const experiences = [
  "Getting started",
  "Building confidence",
  "Advanced",
] as const;
export const pathways = {
  tackle: {
    title: "Tackle academy",
    format: "11 players per side",
    focus: "Footwork. Pocket presence. Seeing the whole field.",
    note: "Explore pocket movement, defensive structures and passing concepts. This diagram illustrates 11v11; it does not validate formations or predict outcomes.",
  },
  flag: {
    title: "Flag academy",
    format: "Illustrative 5v5",
    focus: "Space. Timing. Decisions under pressure.",
    note: "A separate learning pathway. Player eligibility, rushing, pass clocks, field dimensions and no-run zones depend on the league. No league rules are assumed in this demo; 7v7 needs its own reviewed ruleset.",
  },
};
export const questions = [
  {
    prompt: "Start with what you can see.",
    detail:
      "At the start of this illustration, how many defenders occupy the highlighted deep area?",
    answers: [
      "One deep defender",
      "Two deep defenders",
      "The picture does not show defenders",
    ],
    correct: 1,
    explanation:
      "Two defenders are drawn in the deep area. That describes the visible alignment; it does not establish their coverage assignments.",
  },
  {
    prompt: "A shell is a clue. Keep reading.",
    detail:
      "Does a two-high pre-snap picture, by itself, prove the defense is playing Cover 2?",
    answers: [
      "Yes, every two-high look is Cover 2",
      "No, confirm the assignments after the snap",
      "Yes, regardless of the football format",
    ],
    correct: 1,
    explanation:
      "Do not turn a pre-snap clue into a guaranteed coverage label. This example deliberately changes the picture after the snap. Actual coverage identification needs assignments and movement, with scheme and rules context.",
  },
  {
    prompt: "Let the picture develop.",
    detail:
      "As the illustrated defenders rotate, what information should you revisit?",
    answers: [
      "Only the original pre-snap label",
      "The defenders’ movement and developing throwing windows",
      "A guaranteed touchdown prediction",
    ],
    correct: 1,
    explanation:
      "Reassess the defenders and the space as the play develops. The animation does not prove that a receiver is open or prescribe a universal progression. A coach must establish the concept, protection, timing and rules context.",
  },
] as const;
export const filmComments = [
  {
    time: 2,
    title: "Set a clear observation",
    text: "Sample coaching note: identify the starting alignment before naming a coverage.",
  },
  {
    time: 5,
    title: "Revisit the picture",
    text: "Sample coaching note: pause as the defenders change depth. Describe the change before discussing a throw.",
  },
  {
    time: 8,
    title: "Bring a question to your coach",
    text: "Sample coaching note: which assignments and rules would you need to know to evaluate this play?",
  },
];
