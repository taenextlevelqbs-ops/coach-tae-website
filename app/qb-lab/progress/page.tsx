import { MemberProgress } from "@/modules/qb-lab/mvp/MemberProgress";
import { accountConfig } from "@/server/qb-lab/accounts/config";
import type { Metadata } from "next";
import { Progress } from "@/modules/qb-lab/platform/Progress";
export const metadata: Metadata = { title: "Progress | QB LAB", alternates: { canonical: "/qb-lab/progress" } };
export default function Page() {
  if (accountConfig() !== null) return <MemberProgress />;return <Progress />;}
