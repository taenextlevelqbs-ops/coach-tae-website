import type { Metadata } from "next";
import { EngineLab } from "@/modules/qb-lab/live-engine/EngineLab";
export const metadata: Metadata = {
  title: "Live Pocket Engine | QB LAB",
  alternates: { canonical: "/qb-lab/simulator/engine" },
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ play?: string | string[]; mode?: string | string[] }>;
}) {
  const { play, mode } = await searchParams;
  const initialPlayId =
    typeof play === "string" && play.length <= 80 ? play : undefined;
  const initialMode = mode === "practice" || mode === "challenge" ? mode : "learn";
  return <EngineLab initialPlayId={initialPlayId} initialMode={initialMode} />;
}
