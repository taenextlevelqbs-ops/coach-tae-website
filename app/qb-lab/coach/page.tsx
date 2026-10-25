import { MemberCoach } from "@/modules/qb-lab/mvp/MemberCoach";
import { accountConfig } from "@/server/qb-lab/accounts/config";
import type { Metadata } from "next";
import { CoachWorkspace } from "@/modules/qb-lab/coach/CoachWorkspace";
export const metadata: Metadata = {
  title: "Coach | QB LAB",
  alternates: { canonical: "/qb-lab/coach" },
};
export default function Page() {
  if (accountConfig() !== null) return <MemberCoach />;
  return <CoachWorkspace />;
}
