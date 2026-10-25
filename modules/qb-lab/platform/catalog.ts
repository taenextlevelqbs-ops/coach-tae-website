export const drills = [
  {
    id: "recognition",
    title: "Read personnel, front and coverage",
    category: "Football IQ",
    ages: ["8–10", "11–13", "14–15", "16–18", "College"],
    experience: "All",
    pathway: "both",
    minutes: 8,
    equipment:
      "Shared recognition workspace; current league rules and adult/coach guidance for youth.",
    steps: [
      "Open the shared recognition workspace in Football IQ or Simulator.",
      "Choose a formation, defense and governing flag rules when applicable.",
      "Identify personnel/front, predict a possible coverage, snap and make one decision.",
      "Review revealed assignments and discuss a correction with your coach.",
    ],
    safety:
      "Authored schematic, not a validated coverage or athlete assessment. Scheme-dependent terms require Coach Tae review.",
  },
  {
    id: "observe",
    title: "Walk the starting picture",
    category: "Football IQ",
    ages: ["8–10", "11–13", "14–15", "16–18", "College"],
    experience: "All",
    pathway: "both",
    minutes: 4,
    equipment: "A field diagram; an adult or coach for younger learners.",
    steps: [
      "Choose tackle or flag in Football IQ.",
      "Count the deep defenders in the starting picture.",
      "Pause after the illustrated movement. Describe one change.",
      "Bring one question to a qualified coach.",
    ],
    safety:
      "A seated or standing observation drill. Younger athletes should work with an adult.",
  },
  {
    id: "footwork",
    title: "Slow setup walkthrough",
    category: "Footwork",
    ages: ["8–10", "11–13", "14–15", "16–18", "College"],
    experience: "Getting started",
    pathway: "both",
    minutes: 5,
    equipment: "Flat, clear non-slip space; no ball required.",
    steps: [
      "Ask your coach which stance and sequence to practice.",
      "Use Mechanics Studio to inspect the authored setup phases.",
      "Walk through the selected setup slowly without a throw.",
      "Pause and discuss one cue with your coach.",
    ],
    safety:
      "Illustrative walkthrough pending coaching review. No repetitions or load prescribed. Stop for pain, dizziness or discomfort.",
  },
  {
    id: "pocket",
    title: "Controlled pocket awareness",
    category: "Pocket movement",
    ages: ["11–13", "14–15", "16–18", "College"],
    experience: "Building confidence",
    pathway: "tackle",
    minutes: 5,
    equipment: "Clear space and adult/coach supervision.",
    steps: [
      "Inspect the pocket illustration in Mechanics Studio.",
      "Identify the QB starting location.",
      "In the simulator, move one step left and one step back.",
      "Discuss how protection and concept change a real decision.",
    ],
    safety:
      "No contact, sprinting or obstacle drill. Follow coach guidance; this is not protection instruction.",
  },
  {
    id: "flag-space",
    title: "Flag space and timing study",
    category: "Accuracy & decisions",
    ages: ["8–10", "11–13", "14–15", "16–18", "College"],
    experience: "All",
    pathway: "flag",
    minutes: 4,
    equipment: "Simulator and the selected league rulebook for discussion.",
    steps: [
      "Choose a flag roster in the simulator.",
      "Inspect receiver paths before starting.",
      "Pause and compare space between markers.",
      "Discuss the missing eligibility, rush and clock context with a coach.",
    ],
    safety:
      "No universal flag rule is taught. Do not infer permission to run, block or pass from the drawing.",
  },
  {
    id: "recovery",
    title: "Prepare a recovery conversation",
    category: "Recovery & mobility",
    ages: ["8–10", "11–13", "14–15", "16–18", "College"],
    experience: "All",
    pathway: "both",
    minutes: 3,
    equipment: "No equipment or physical exertion.",
    steps: [
      "Pause training and check how you feel.",
      "Tell a guardian or coach about discomfort or fatigue.",
      "Ask a qualified professional about an appropriate recovery routine.",
      "Record completion only after the conversation.",
    ],
    safety:
      "No shoulder-health, rehabilitation, conditioning or medical prescription. Pain or injury needs qualified professional advice.",
  },
] as const;
export type DrillId = (typeof drills)[number]["id"];
export const goals = [
  "Ask one specific coaching question",
  "Complete one observation study",
  "Review one tagged moment",
] as const;
