import type { Metadata } from "next";
import { Workouts } from "@/modules/qb-lab/platform/Workouts";
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
  return (
    <Workouts
      initialActivity={params.activity}
      profile={
        params.profile === "B" ? "B" : params.profile === "A" ? "A" : undefined
      }
    />
  );
}
