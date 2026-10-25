import type { Format } from "../simulation/model";
import type { Personnel, Front, Coverage } from "./content";
export type RecognitionPreset = {
  id: string;
  title: string;
  format: Format;
  personnel: Personnel;
  front: Front;
  coverage: Coverage;
  example: number;
};
export const recognitionPresets: RecognitionPreset[] = [
  {
    id: "t34-c3",
    title: "3-4 · odd surface · Cover 3",
    format: "tackle",
    personnel: "3-4",
    front: "Odd",
    coverage: "Cover 3",
    example: 0,
  },
  {
    id: "t43-c2",
    title: "4-3 · even surface · Cover 2",
    format: "tackle",
    personnel: "4-3",
    front: "Even",
    coverage: "Cover 2",
    example: 0,
  },
  {
    id: "t425-c6",
    title: "4-2-5 · overload · Cover 6",
    format: "tackle",
    personnel: "4-2-5",
    front: "Overload",
    coverage: "Cover 6",
    example: 0,
  },
  {
    id: "t335-match",
    title: "3-3-5 · three-man surface · Quarters match",
    format: "tackle",
    personnel: "3-3-5",
    front: "Three-man surface",
    coverage: "Quarters match",
    example: 0,
  },
  {
    id: "t52-c1",
    title: "5-2 · Bear · Cover 1",
    format: "tackle",
    personnel: "5-2",
    front: "Bear",
    coverage: "Cover 1",
    example: 0,
  },
  {
    id: "t43-c0",
    title: "4-3 · four-man surface · Cover 0",
    format: "tackle",
    personnel: "4-3",
    front: "Four-man surface",
    coverage: "Cover 0",
    example: 0,
  },
  {
    id: "t425-c4",
    title: "4-2-5 · even surface · Cover 4",
    format: "tackle",
    personnel: "4-2-5",
    front: "Even",
    coverage: "Cover 4",
    example: 0,
  },
  {
    id: "f5-one",
    title: "5v5 · one rush / three underneath / one deep",
    format: "flag5",
    personnel: "4-3",
    front: "Even",
    coverage: "Cover 2",
    example: 0,
  },
  {
    id: "f5-two",
    title: "5v5 · two rush / one middle / two deep",
    format: "flag5",
    personnel: "4-3",
    front: "Even",
    coverage: "Cover 2",
    example: 1,
  },
  {
    id: "f7-two",
    title: "7v7 · two rush / three underneath / two deep",
    format: "flag7",
    personnel: "4-3",
    front: "Even",
    coverage: "Cover 2",
    example: 0,
  },
  {
    id: "f8-three",
    title: "8v8 · three rush / two middle / three deep",
    format: "flag8",
    personnel: "4-3",
    front: "Even",
    coverage: "Cover 2",
    example: 0,
  },
];
export const recognitionPreset = (id: unknown) =>
  typeof id === "string"
    ? recognitionPresets.find((p) => p.id === id)
    : undefined;
