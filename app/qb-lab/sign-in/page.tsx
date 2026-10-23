import type { Metadata } from "next";
import { accountConfig } from "@/server/qb-lab/accounts/config";
import { SignIn } from "@/modules/qb-lab/entry/SignIn";
import { safeReturnPath } from "@/modules/qb-lab/entry/routes";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Sign In | QB LAB", alternates: { canonical: "/qb-lab/sign-in" } };
export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  return <SignIn enabled={accountConfig() !== null} destination={safeReturnPath((await searchParams).next)} />;
}
