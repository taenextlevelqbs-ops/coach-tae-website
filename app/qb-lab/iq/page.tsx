import { accountConfig } from "@/server/qb-lab/accounts/config";
import { MemberQuizzes } from "@/modules/qb-lab/mvp/MemberQuizzes";
import type { Metadata } from "next";
import { FootballIQ } from "@/modules/qb-lab/FootballIQ";
export const metadata: Metadata = {
  title: "Football IQ | QB LAB",
  alternates: { canonical: "/qb-lab/iq" },
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ lesson?: string | string[] }>;
}) {
  if (accountConfig() !== null) return <MemberQuizzes />;
  const params = await searchParams;
  return (
    <FootballIQ
      initialRecognition={
        typeof params.lesson === "string" ? params.lesson : undefined
      }
    />
  );
}
