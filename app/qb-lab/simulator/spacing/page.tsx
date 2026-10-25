import type { Metadata } from "next";
import { Simulator } from "@/modules/qb-lab/simulation/Simulator";
export const metadata: Metadata = { title: "Recognition & spacing | QB LAB", alternates: { canonical: "/qb-lab/simulator/spacing" } };
export default function Page() { return <Simulator />; }
