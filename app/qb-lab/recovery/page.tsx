import type { Metadata } from "next";
import { RecoveryLibrary } from "@/modules/qb-lab/training/RecoveryLibrary";

export const metadata: Metadata = {
  title: "Recovery | QB LAB",
  alternates: { canonical: "/qb-lab/recovery" },
};
export default function Page() {
  return <RecoveryLibrary />;
}
