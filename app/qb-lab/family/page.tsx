import type { Metadata } from "next";
import { Family } from "@/modules/qb-lab/Family";
export const metadata: Metadata = {
  title: "Family Hub | QB LAB",
  alternates: { canonical: "/qb-lab/family" },
};
export default function Page() {
  return <Family />;
}
