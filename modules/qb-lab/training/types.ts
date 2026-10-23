export type Instruction = { title: string; body: string };
export type TrainingDiagram = {
  caption: string;
  points: { x: number; y: number; label: string }[];
};
export type TrainingItem = {
  slug: string;
  kind: "workout" | "recovery";
  title: string;
  category: string;
  purpose: string;
  duration: string;
  dose: string;
  equipment: string;
  start: string;
  steps: Instruction[];
  tip: string;
  mistakes: string[];
  safety: string[];
  reviewNote: string;
  diagram?: TrainingDiagram;
};
export const trainingReference = (item: Pick<TrainingItem, "kind" | "slug">) =>
  `${item.kind}:${item.slug}`;
