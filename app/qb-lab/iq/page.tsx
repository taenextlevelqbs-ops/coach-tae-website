import type { Metadata } from "next";
import { FootballIQ } from "@/modules/qb-lab/FootballIQ";
export const metadata: Metadata = {
  title: "Football IQ | QB LAB",
  alternates: { canonical: "/qb-lab/iq" },
};
export default function Page() {
  return <FootballIQ />;
}
