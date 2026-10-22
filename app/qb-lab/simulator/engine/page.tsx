import type { Metadata } from "next";
import { EngineLab } from "@/modules/qb-lab/live-engine/EngineLab";
export const metadata: Metadata = {
  title: "Live Pocket Engine | QB LAB",
  alternates: { canonical: "/qb-lab/simulator/engine" },
};
export default function Page() {
  return <EngineLab />;
}
