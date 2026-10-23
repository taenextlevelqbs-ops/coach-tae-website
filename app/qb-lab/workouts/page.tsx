import type { Metadata } from "next";
import { Workouts } from "@/modules/qb-lab/platform/Workouts";
import { WorkoutLibrary } from "@/modules/qb-lab/training/WorkoutLibrary";
import { workoutCategories, workouts } from "@/modules/qb-lab/training/workouts";
export const metadata: Metadata = {
  title: "Workouts | QB LAB",
  alternates: { canonical: "/qb-lab/workouts" },
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ activity?: string; profile?: string }>;
}) {
  const params = await searchParams;
  if (!params.activity) return <WorkoutLibrary categories={workoutCategories} drills={workouts.map(({ slug, title, category, duration }) => ({ slug, title, category, duration }))} />;
  return (
    <Workouts
      initialActivity={params.activity}
      profile={
        params.profile === "B" ? "B" : params.profile === "A" ? "A" : undefined
      }
    />
  );
}
