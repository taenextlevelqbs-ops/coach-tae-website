import type { Metadata } from "next";
import { EngineLab } from "@/modules/qb-lab/live-engine/EngineLab";
export const metadata: Metadata = {
  title: "Live Pocket Engine | QB LAB",
  alternates: { canonical: "/qb-lab/simulator/engine" },
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ play?: string | string[] }>;
}) {
  const { play } = await searchParams;
  const initialPlayId =
    typeof play === "string" && play.length <= 80 ? play : undefined;
  return <EngineLab initialPlayId={initialPlayId} />;
}
