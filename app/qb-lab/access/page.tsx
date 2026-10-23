import type { Metadata } from "next";
import { Access } from "@/modules/qb-lab/platform/Access";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Access | QB LAB",
  alternates: { canonical: "/qb-lab/access" },
};
export default function Page() {
  return <Access />;
}
