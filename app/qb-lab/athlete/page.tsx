import type { Metadata } from "next";
import { Athlete } from "@/modules/qb-lab/Athlete";
export const metadata: Metadata = {
  title: "Athlete Studio | QB LAB",
  alternates: { canonical: "/qb-lab/athlete" },
};
export default function Page() {
  return <Athlete />;
}
