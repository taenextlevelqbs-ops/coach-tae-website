import { accountConfig } from "@/server/qb-lab/accounts/config";
import { MemberLibrary } from "@/modules/qb-lab/mvp/MemberLibrary";
import type { Metadata } from "next";
import { RecoveryLibrary } from "@/modules/qb-lab/training/RecoveryLibrary";

export const metadata: Metadata = {
  title: "Recovery | QB LAB",
  alternates: { canonical: "/qb-lab/recovery" },
};
export default function Page() {
  if (accountConfig() !== null) return <MemberLibrary kind="recovery" />;
  return <RecoveryLibrary />;
}
