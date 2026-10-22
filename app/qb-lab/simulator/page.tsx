import type { Metadata } from "next";
import { Simulator } from "@/modules/qb-lab/simulation/Simulator";
export const metadata: Metadata = { title: "Simulator | QB LAB", alternates: { canonical: "/qb-lab/simulator" } };
export default function Page() {return <Simulator />;}
