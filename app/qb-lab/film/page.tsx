import type { Metadata } from "next";
import { FilmReview } from "@/modules/qb-lab/FilmReview";
export const metadata: Metadata = {
  title: "Film Room | QB LAB",
  alternates: { canonical: "/qb-lab/film" },
};
export default function Page() {
  return <FilmReview />;
}
