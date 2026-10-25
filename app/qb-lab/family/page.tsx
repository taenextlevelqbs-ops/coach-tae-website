import { MemberProfile } from "@/modules/qb-lab/mvp/MemberProfile";
import { accountConfig } from "@/server/qb-lab/accounts/config";
import type { Metadata } from "next";
import { Family } from "@/modules/qb-lab/Family";
export const metadata: Metadata = {
  title: "Family Hub | QB LAB",
  alternates: { canonical: "/qb-lab/family" },
};
export default function Page() {
  if (accountConfig() !== null) return <MemberProfile />;
  return <Family />;
}
